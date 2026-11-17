import { randomUUID, randomInt } from 'crypto';
import { prisma } from '@/services/database/prisma.service';
import type { Prisma } from '../../generated/prisma';
import { GoneError, BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '@/middleware/error.middleware';
import { assertGenericSurvey } from './cohort-feedback.service';
import { assertManagedTransition, computeManagedAnalytics, sameQuestionStructure, validateManagedAnswers, SurveyAnswerData } from './managed-survey-logic';
import type { ManagedSurveyCreate, ManagedSurveyUpdate, ManagedQuestion } from '@/validators/managed-survey.validators';
import { uploadToR2Api } from './r2.service';

const includeQuestions = { questions: { include: { options: { orderBy: { position: 'asc' as const } } }, orderBy: { position: 'asc' as const } } };

/** Lock the survey before observing capacity, responses, or mutating its state. */
async function lockSurvey(tx: Prisma.TransactionClient, id: number) {
  await tx.$queryRaw`SELECT id FROM surveys WHERE id = ${id} FOR UPDATE`;
  const survey = await tx.surveys.findUnique({ where: { id }, include: includeQuestions });
  if (!survey) throw new NotFoundError('問卷不存在');
  return survey;
}

/** Build nested question writes without letting client-supplied ids change ownership. */
function questionWrites(questions: ManagedQuestion[]) {
  return questions.map((q, i) => ({ question_text: q.question_text, question_type: q.question_type, input_type: q.input_type, is_required: q.is_required, position: i,
    scale_min: q.question_type === 'scale' ? q.scale_min : null, scale_max: q.question_type === 'scale' ? q.scale_max : null,
    scale_min_label: q.scale_min_label, scale_max_label: q.scale_max_label,
    options: { create: q.options.map((o, j) => ({ option_text: o.option_text, position: j })) } }));
}

/** Find a managed survey without changing legacy/cohort-feedback behavior. */
export async function isManagedSurvey(id: number): Promise<boolean> {
  const survey = await prisma.surveys.findUnique({ where: { id }, select: { managed_version: true } });
  return survey?.managed_version === 1;
}

export const managedSurveyService = {
  /** Create a zero-question managed draft. */
  async create(userId: number, body: ManagedSurveyCreate) {
    const { questions, ...fields } = body;
    return prisma.surveys.create({ data: { ...fields, managed_version: 1, created_by: userId, questions: { create: questionWrites(questions) } }, include: includeQuestions });
  },
  /** Apply a full editor save, protecting all historical answer structures. */
  async update(id: number, body: ManagedSurveyUpdate) {
    await assertGenericSurvey(id);
    return prisma.$transaction(async tx => {
      const survey = await lockSurvey(tx, id);
      const count = await tx.survey_responses.count({ where: { survey_id: id } });
      const historicallyAnswered = count > 0 || (await tx.managed_survey_completions.count({ where: { survey_id: id } })) > 0 || (await tx.survey_response_deletion_audits.count({ where: { survey_id: id } })) > 0;
      const { questions, ...fields } = body;
      if (survey.status === 'active' && questions?.length === 0) throw new BadRequestError('進行中的問卷至少需要一題；請先關閉問卷');
      if (historicallyAnswered && ((body.is_anonymous !== undefined && body.is_anonymous !== survey.is_anonymous) || (body.is_public !== undefined && body.is_public !== survey.is_public))) throw new ConflictError('已有回應後無法變更回應對象或匿名設定');
      if (historicallyAnswered && questions && !sameQuestionStructure(survey.questions, questions)) throw new ConflictError('已有回應後無法修改題目；請複製問卷');
      if (questions && !historicallyAnswered) await tx.questions.deleteMany({ where: { survey_id: id } });
      return tx.surveys.update({ where: { id }, data: { ...fields, ...(questions && !historicallyAnswered ? { questions: { create: questionWrites(questions) } } : {}) }, include: includeQuestions });
    });
  },
  /** Serialize lifecycle changes with submissions so closed means no later accepted submissions. */
  async status(id: number, status: 'draft' | 'active' | 'closed' | 'archived') {
    await assertGenericSurvey(id);
    return prisma.$transaction(async tx => {
      const survey = await lockSurvey(tx, id);
      assertManagedTransition(survey.status, status, survey.questions.length);
      if (status === 'active' && !survey.title.trim()) throw new BadRequestError('發布前請填寫標題');
      return tx.surveys.update({ where: { id }, data: { status }, include: includeQuestions });
    });
  },
  /** Return a current snapshot and deny unavailable links consistently with submission. */
  async public(externalId: string, userId: number | null) {
    const survey = await prisma.surveys.findUnique({ where: { external_id: externalId }, include: includeQuestions });
    if (survey?.managed_version !== 1) return null;
    if (userId && !(await prisma.users.findUnique({ where: { id: userId }, select: { id: true } }))) userId = null;
    if (!survey.is_public && !userId) throw new UnauthorizedError('請先登入再填寫此問卷');
    const count = await prisma.survey_responses.count({ where: { survey_id: survey.id } });
    assertAvailable(survey, count);
    const completed = userId ? await prisma.managed_survey_completions.findUnique({ where: { survey_id_user_id: { survey_id: survey.id, user_id: userId } } }) : null;
    return { id: survey.id, external_id: survey.external_id, title: survey.title, description: survey.description, status: survey.status, managed_version: 1,
      is_public: survey.is_public, is_anonymous: survey.is_anonymous, logo_url: survey.logo_url, cover_url: survey.cover_url, thank_you_message: survey.thank_you_message,
      max_responses: survey.max_responses, has_responded: !!completed, questions: survey.questions };
  },
  /** Accept one atomic response. Anonymous submissions return no response id or identity correlation. */
  async submit(externalId: string, userId: number | null, answers: SurveyAnswerData[]) {
    const entry = await prisma.surveys.findUnique({ where: { external_id: externalId }, select: { id: true, managed_version: true } });
    if (entry?.managed_version !== 1) return null;
    await retryAnonymousCollision(() => prisma.$transaction(async tx => {
      const survey = await lockSurvey(tx, entry.id);
      if (userId && !(await tx.users.findUnique({ where: { id: userId }, select: { id: true } }))) userId = null;
      if (!survey.is_public && !userId) throw new UnauthorizedError('請先登入再填寫此問卷');
      const count = await tx.survey_responses.count({ where: { survey_id: survey.id } });
      assertAvailable(survey, count, true);
      if (userId && await tx.managed_survey_completions.findUnique({ where: { survey_id_user_id: { survey_id: survey.id, user_id: userId } } })) throw new ConflictError('你已提交過此問卷');
      const normalized = validateManagedAnswers(survey.questions, answers);
      const types = new Map(survey.questions.map(q => [q.id, q.question_type]));
      if (userId) await tx.managed_survey_completions.create({ data: { survey_id: survey.id, user_id: userId } });
      // No exact answer timestamp, session token, or start time for anonymous answers.
      const completedAt = survey.is_anonymous ? new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z') : new Date();
      await tx.survey_responses.create({ data: { ...(survey.is_anonymous ? { id: randomInt(-2147483648, 0) } : {}), survey_id: survey.id, user_id: survey.is_anonymous ? null : userId, completed_at: completedAt,
        answers: { create: normalized.map(a => { const questionType = types.get(a.question_id); if (!questionType) throw new BadRequestError('包含無效的題目'); return { survey_id: survey.id, question_id: a.question_id, question_type: questionType, answer_text: a.answer_text, selected_option_ids: a.selected_option_ids ?? [], rating_value: a.rating_value, boolean_value: a.boolean_value }; }) } } });
    }));
    return { completed: true };
  },
  /** Recompute managed survey analysis from saved valid answers; creator routes remain forbidden. */
  async analytics(id: number) {
    await assertGenericSurvey(id);
    const survey = await prisma.surveys.findUnique({ where: { id }, include: includeQuestions });
    if (!survey) throw new NotFoundError('問卷不存在');
    const [answers, count] = await Promise.all([prisma.survey_answers.findMany({ where: { survey_id: id } }), prisma.survey_responses.count({ where: { survey_id: id } })]);
    return { survey_id: id, response_count: count, view_count: survey.view_count, avg_duration_seconds: null, drop_off: [], per_question: computeManagedAnalytics(survey.questions, answers) };
  },
  /** Delete a response under the same lock used by capacity checks; audit contains no answers or respondent id. */
  async deleteResponse(surveyId: number, responseId: number, actorId: number) {
    await assertGenericSurvey(surveyId);
    await prisma.$transaction(async tx => {
      await lockSurvey(tx, surveyId);
      const response = await tx.survey_responses.findFirst({ where: { id: responseId, survey_id: surveyId } });
      if (!response) throw new NotFoundError('回應不存在');
      await tx.survey_responses.delete({ where: { id: responseId } });
      await tx.survey_response_deletion_audits.create({ data: { survey_id: surveyId, actor_id: actorId } });
      // Completion is deliberately retained: anonymous answers cannot be mapped back to a member.
    });
  },
  /** List the authenticated administrator's three selectable image records. */
  async images(userId: number) {
    return prisma.survey_image_library.findMany({ where: { created_by: userId }, orderBy: { created_at: 'desc' } });
  },
  /** Upload to R2 with a reserved survey-only namespace whose objects cannot be deleted via generic image API. */
  async uploadImage(userId: number, file: Express.Multer.File) {
    if (!file || file.size > 8 * 1024 * 1024 || !isSupportedImage(file.buffer, file.mimetype)) throw new BadRequestError('請上傳8MB以內的PNG、JPEG或WebP圖片');
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      if (await tx.survey_image_library.count({ where: { created_by: userId } }) >= 3) throw new ConflictError('圖片庫最多保留三張，請先移除一張');
      const user = await tx.users.findUnique({ where: { id: userId }, select: { external_id: true } });
      if (!user?.external_id) throw new UnauthorizedError('無法確認圖片擁有者');
      const result = await uploadToR2Api(file, `surveys/${randomUUID()}`, user.external_id);
      return tx.survey_image_library.create({ data: { url: result.data.url, created_by: userId } });
    }, { timeout: 30000 });
  },
  /** Forget a selectable library entry without deleting the underlying referenced object. */
  async removeImage(userId: number, imageId: number) {
    const image = await prisma.survey_image_library.findFirst({ where: { id: imageId, created_by: userId } });
    if (!image) throw new NotFoundError('圖片不存在');
    await prisma.survey_image_library.delete({ where: { id: imageId } });
  },
};

/** Keep availability rules identical for public reads and writes. */
function assertAvailable(survey: { status: string; start_time: Date | null; end_time: Date | null; max_responses: number | null }, count: number, submission = false) {
  const now = new Date();
  if (survey.status !== 'active' || (survey.start_time && survey.start_time > now) || (survey.end_time && survey.end_time < now)) throw new GoneError('問卷尚未開放或已關閉');
  if (survey.max_responses !== null && count >= survey.max_responses) {
    if (submission) throw new ConflictError('問卷已達最大回應數');
    throw new GoneError('問卷已達最大回應數');
  }
}

/** Check file magic bytes rather than trusting a multipart content-type. */
export function isSupportedImage(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (mime === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
}

/** Retry random anonymous key collisions without retaining partial completion writes. */
async function retryAnonymousCollision<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); } catch (error) {
      if (attempt >= 2 || !(typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002' && 'meta' in error && typeof error.meta === 'object' && error.meta !== null && 'target' in error.meta && Array.isArray(error.meta.target) && error.meta.target.length === 1 && error.meta.target[0] === 'id')) throw error;
    }
  }
}
