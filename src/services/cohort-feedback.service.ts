import { randomInt } from 'crypto';
import { Prisma } from '../../generated/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../middleware/error.middleware';
import type { ApiSuccessResponse } from '../types/api-response.types';
import type { SubmitResponseBody } from '../validators/survey.validators';
import type { CohortFeedbackQuery, CohortFeedbackResponse } from '../validators/cohort-feedback.validators';
import { createSuccessResponse } from '../utils/response-helper';
import { prisma } from './database/prisma.service';

export const FEEDBACK_PRIVACY_NOTICE = '請先登入填寫。系統會記錄你是否已完成，cohort owner 可以查看完成狀態；你的回答不會連結到姓名或帳號。文字內容仍可能讓人推測作者。';
export const FEEDBACK_DESCRIPTION = '謝謝你參與這次課程活動！歡迎分享你的感受與建議，讓我們知道哪些地方值得保留、哪些可以調整，作為之後規劃活動的參考。';
export const FEEDBACK_QUESTIONS = [
  '整體來說，這個課程活動符合你的期待嗎？',
  '有哪些環節或互動，讓你印象最深？它對你有什麼影響？',
  '有什麼你希望可以調整的地方？',
  '還有其他想讓我們知道的事嗎？'
] as const;

/** 新期末問卷只在本次核定的 dev / 本機測試環境啟用。 */
export function isCohortFeedbackEnabled(): boolean {
  if (['prod', 'production'].includes(process.env.NODE_ENV ?? '') || ['prod', 'production'].includes(process.env.APP_ENV ?? '')) return false;
  return process.env.APP_ENV === 'dev' || ['dev', 'development', 'local', 'test'].includes(process.env.NODE_ENV ?? '');
}

/** Server-first rollout must preserve legacy surveys until all additive tables exist. */
export async function hasCohortFeedbackSchema(): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ ready: boolean }>>`
    SELECT to_regclass('cohort_feedback_surveys') IS NOT NULL
      AND to_regclass('cohort_feedback_completions') IS NOT NULL
      AND to_regclass('cohort_feedback_answers') IS NOT NULL AS ready
  `;
  return rows?.[0]?.ready === true;
}

/** 不容許新問卷回落到一般問卷的建立者權限或追蹤流程。 */
export async function assertGenericSurvey(surveyId: number): Promise<void> {
  if (!await hasCohortFeedbackSchema()) return;
  const feedback = await prisma.cohort_feedback_surveys.findUnique({ where: { survey_id: surveyId }, select: { cohort_id: true } });
  if (feedback) throw new ForbiddenError('請由 Lighthouse 場次成果查看學員回饋');
}

/** 原子建立新問卷與不可由客戶端偽造的版本對應。 */
export async function createCohortFeedbackSurvey(cohortId: number, creatorId: number, now: Date): Promise<void> {
  if (!isCohortFeedbackEnabled()) throw new ForbiddenError('本功能目前僅供 dev 測試');
  if (!await hasCohortFeedbackSchema()) throw new NotFoundError('問卷資料尚未開放');
  await prisma.$transaction(async tx => {
    const survey = await tx.surveys.create({ data: {
      title: '活動回饋', description: FEEDBACK_DESCRIPTION, status: 'active', is_public: true, is_anonymous: true,
      created_by: creatorId, start_time: now,
      tags: ['lighthouse', 'cohort-feedback', `lighthouse:cohort-feedback:${cohortId}`],
      questions: { create: FEEDBACK_QUESTIONS.map((question_text, position) => ({ question_text, position, question_type: position === 0 ? 'rating' : 'text', is_required: position === 0, conditions: [] })) }
    }, select: { id: true } });
    await tx.cohort_feedback_surveys.create({ data: { cohort_id: cohortId, survey_id: survey.id } });
  });
}

/** 取得填答資格；完成紀錄只用來回答布林狀態，不回傳完成時間。 */
export async function getCohortFeedbackMetadata(surveyId: number, userId: number | null): Promise<{ state: 'login_required' | 'ineligible' | 'ready' | 'completed'; privacy_notice: string } | null> {
  if (!await hasCohortFeedbackSchema()) return null;
  const feedback = await prisma.cohort_feedback_surveys.findUnique({ where: { survey_id: surveyId } });
  if (!feedback) return null;
  if (!isCohortFeedbackEnabled()) throw new NotFoundError('問卷尚未開放');
  let state: 'login_required' | 'ineligible' | 'ready' | 'completed' = 'login_required';
  if (userId !== null) {
    const enrolled = await prisma.cohort_enrollments.findFirst({ where: { cohort_id: feedback.cohort_id, user_id: userId, status: 'joined', cohort: { deleted_at: null } }, select: { id: true } });
    if (!enrolled) state = 'ineligible';
    else {
      const completion = await prisma.cohort_feedback_completions.findUnique({ where: { cohort_id_user_id: { cohort_id: feedback.cohort_id, user_id: userId } }, select: { user_id: true } });
      state = completion ? 'completed' : 'ready';
    }
  }
  return { state, privacy_notice: FEEDBACK_PRIVACY_NOTICE };
}

/** 新期末問卷的提交；同一交易保證唯一完成紀錄及匿名答案同成同敗。 */
export async function submitCohortFeedback(surveyId: number, userId: number | null, body: SubmitResponseBody): Promise<ApiSuccessResponse<{ completed: true }> | null> {
  if (!await hasCohortFeedbackSchema()) return null;
  const feedback = await prisma.cohort_feedback_surveys.findUnique({ where: { survey_id: surveyId } });
  if (!feedback) return null;
  if (!isCohortFeedbackEnabled()) throw new NotFoundError('問卷尚未開放');
  if (userId === null) throw new UnauthorizedError('請先登入填寫問卷');
  const questions = await prisma.questions.findMany({ where: { survey_id: surveyId }, orderBy: { position: 'asc' }, select: { id: true, position: true, question_type: true, is_required: true } });
  const byId = new Map(questions.map(q => [q.id, q]));
  const seen = new Set<number>();
  const answers: Prisma.cohort_feedback_answersCreateManyInput[] = [];
  for (const answer of body.answers) {
    const question = byId.get(answer.question_id);
    if (!question || seen.has(answer.question_id)) throw new BadRequestError('包含無效或重複的問題 ID');
    seen.add(answer.question_id);
    if (answer.boolean_value !== undefined || (answer.selected_option_ids?.length ?? 0) > 0) throw new BadRequestError('答案格式不符合題型');
    if (question.position === 0) {
      if (!Number.isInteger(answer.rating_value) || answer.rating_value === undefined || answer.rating_value < 1 || answer.rating_value > 5 || answer.answer_text !== undefined) throw new BadRequestError('請選擇 1 至 5 星');
      answers.push({ survey_id: surveyId, question_id: question.id, rating_value: answer.rating_value });
    } else {
      if (answer.rating_value !== undefined || question.question_type !== 'text') throw new BadRequestError('答案格式不符合題型');
      const text = answer.answer_text?.trim();
      if (text) answers.push({ survey_id: surveyId, question_id: question.id, answer_text: text });
    }
  }
  if (questions.some(q => q.is_required && !seen.has(q.id))) throw new BadRequestError('必填題目未作答');
  try {
    await prisma.$transaction(async tx => {
      const enrollment = await tx.cohort_enrollments.findFirst({ where: { cohort_id: feedback.cohort_id, user_id: userId, status: 'joined', cohort: { deleted_at: null } }, select: { id: true } });
      if (!enrollment) throw new ForbiddenError('你不符合此場次的填答資格');
      await tx.cohort_feedback_completions.create({ data: { cohort_id: feedback.cohort_id, user_id: userId } });
      await tx.cohort_feedback_answers.createMany({ data: answers });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictError('你已完成此問卷');
    throw error;
  }
  return createSuccessResponse({ completed: true as const });
}

/** 打亂每題獨立文字陣列，避免答案呈現順序對應具名完成名單。 */
export function shuffleFeedbackTexts(values: string[]): string[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 只允許本場次 owner（含 canonical organization owner）取得進度與匿名結果。 */
export async function getCohortFeedback(programId: number, cohortId: number, actorId: number, query: CohortFeedbackQuery): Promise<CohortFeedbackResponse> {
  if (!isCohortFeedbackEnabled() || !await hasCohortFeedbackSchema()) throw new NotFoundError('本功能目前尚未開放');
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, deleted_at: null }, select: {
    id: true, program: { select: { organization: { select: { organization_members: { where: { user_id: actorId, role: 'owner' }, select: { id: true } } } } } },
    cohort_enrollments: { where: { user_id: actorId, status: 'joined', role: 'owner' }, select: { id: true } }
  } });
  if (!cohort) throw new NotFoundError('找不到場次');
  if (!cohort.program.organization.organization_members.length && !cohort.cohort_enrollments.length) throw new ForbiddenError('僅場次 owner 可查看學員回饋');
  const feedback = await prisma.cohort_feedback_surveys.findUnique({ where: { cohort_id: cohortId } });
  const [enrollments, completions] = await Promise.all([
    prisma.cohort_enrollments.findMany({ where: { cohort_id: cohortId, status: 'joined', user_id: { not: null } }, select: { user_id: true, user: { select: { nickname: true } } }, orderBy: { user_id: 'asc' } }),
    prisma.cohort_feedback_completions.findMany({ where: { cohort_id: cohortId }, select: { user_id: true } })
  ]);
  const completed = new Set(completions.map(c => c.user_id));
  const members = new Map<number, { userId: number; name: string; completed: boolean }>();
  for (const enrollment of enrollments) if (enrollment.user_id !== null) members.set(enrollment.user_id, { userId: enrollment.user_id, name: enrollment.user?.nickname ?? '學員', completed: completed.has(enrollment.user_id) });
  const participants = [...members.values()];
  const filtered = participants.filter(p => query.status === 'all' || (query.status === 'completed' ? p.completed : !p.completed));
  const completedCount = participants.filter(p => p.completed).length;
  const result: CohortFeedbackResponse = { state: 'scheduled', completedCount, eligibleCount: participants.length,
    participants: filtered.slice((query.page - 1) * 5, query.page * 5), pagination: { page: query.page, pageSize: 5, total: filtered.length, totalPages: Math.ceil(filtered.length / 5) },
    ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({ rating, count: 0 })), totalResponses: 0, textQuestions: [] };
  if (!feedback) {
    const legacy = await prisma.surveys.findFirst({ where: { tags: { has: `lighthouse:cohort-feedback:${cohortId}` } }, select: { id: true } });
    if (legacy) result.state = 'legacy';
    return result;
  }
  const [questions, answers] = await Promise.all([
    prisma.questions.findMany({ where: { survey_id: feedback.survey_id }, select: { id: true, question_text: true, position: true }, orderBy: { position: 'asc' } }),
    prisma.cohort_feedback_answers.findMany({ where: { survey_id: feedback.survey_id }, select: { question_id: true, rating_value: true, answer_text: true } })
  ]);
  const ratingQuestion = questions.find(q => q.position === 0);
  for (const answer of answers) if (answer.question_id === ratingQuestion?.id && answer.rating_value !== null && answer.rating_value >= 1 && answer.rating_value <= 5) {
    result.ratingDistribution[answer.rating_value - 1].count += 1;
    result.totalResponses += 1;
  }
  result.state = result.totalResponses > 0 ? 'available' : feedback.delivery_state === 'sent' ? 'waiting' : 'sending';
  result.textQuestions = questions.filter(q => q.position > 0).map(q => ({ questionId: q.id, title: q.question_text, answers: shuffleFeedbackTexts(answers.filter(a => a.question_id === q.id && a.answer_text !== null).map(a => a.answer_text ?? '')) }));
  return result;
}
