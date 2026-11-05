import { assertGenericSurvey, getCohortFeedbackMetadata, submitCohortFeedback, hasCohortFeedbackSchema } from './cohort-feedback.service';
import { prisma } from '@/services/database/prisma.service';
import { createSuccessResponse } from '@/utils/response-helper';
import { emailService } from '@/services/email/email.service';
import { loggerService } from '@/services/logging/logger.service';
import type { CreateSurveyBody, UpdateSurveyStatusBody, SubmitResponseBody, UpdateSurveyBody, ConditionBody, TrackPartialBody } from '@/validators/survey.validators';

const questionWithOptions = {
  include: { options: { orderBy: { position: 'asc' as const } } },
  orderBy: { position: 'asc' as const },
};

function formatSurvey(s: {
  id: number;
  external_id: string;
  title: string;
  description: string | null;
  status: string;
  is_anonymous: boolean;
  max_responses: number | null;
  tags: string[];
  cover_url: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  questions: Array<{
    id: number;
    question_text: string;
    question_type: string;
    is_required: boolean;
    position: number;
    conditions: unknown;
    options: Array<{ id: number; option_text: string; position: number }>;
  }>;
}) {
  return {
    id: s.id,
    external_id: s.external_id,
    title: s.title,
    description: s.description ?? null,
    status: s.status,
    is_anonymous: s.is_anonymous,
    max_responses: s.max_responses ?? null,
    tags: s.tags,
    cover_url: s.cover_url ?? null,
    created_by: s.created_by,
    created_at: s.created_at.toISOString(),
    updated_at: s.updated_at.toISOString(),
    questions: (s.questions ?? []).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      is_required: q.is_required,
      position: q.position,
      conditions: (q.conditions as ConditionBody[]) ?? [],
      options: (q.options ?? []).map((o) => ({
        id: o.id,
        option_text: o.option_text,
        position: o.position,
      })),
    })),
  };
}

export const surveyService = {
  async create(userId: number, body: CreateSurveyBody) {
    const survey = await prisma.surveys.create({
      data: {
        title: body.title,
        description: body.description,
        is_anonymous: body.is_anonymous,
        max_responses: body.max_responses,
        tags: body.tags,
        cover_url: body.cover_url,
        created_by: userId,
        questions: {
          create: body.questions.map((q) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            position: q.position,
            conditions: q.conditions ?? [],
            options: q.options
              ? { create: q.options.map((o) => ({ option_text: o.option_text, position: o.position })) }
              : undefined,
          })),
        },
      },
      include: { questions: questionWithOptions },
    });
    return createSuccessResponse(formatSurvey(survey));
  },

  async listMine(userId: number) {
    const feedbackSchemaReady = await hasCohortFeedbackSchema();
    const surveys = await prisma.surveys.findMany({
      where: { created_by: userId, ...(feedbackSchemaReady ? { cohort_feedback: { is: null } } : {}) },
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { responses: true } } },
    });
    const data = surveys.map((s) => ({
      id: s.id,
      external_id: s.external_id,
      title: s.title,
      status: s.status,
      is_anonymous: s.is_anonymous,
      tags: s.tags,
      created_at: s.created_at.toISOString(),
      response_count: s._count.responses,
    }));
    return createSuccessResponse(data);
  },

  async getById(id: number, userId: number) {
    await assertGenericSurvey(id);
    const survey = await prisma.surveys.findFirst({
      where: { id, created_by: userId },
      include: { questions: questionWithOptions },
    });
    return survey ? createSuccessResponse(formatSurvey(survey)) : null;
  },

  async getPublic(externalId: string, userId: number | null = null) {
    const now = new Date();
    const survey = await prisma.surveys.findFirst({
      where: {
        external_id: externalId,
        status: 'active',
        is_public: true,
        OR: [{ start_time: null }, { start_time: { lte: now } }],
      },
      include: { questions: questionWithOptions },
    });
    if (!survey) return null;
    if (survey.end_time && survey.end_time < now) return null;
    const feedback = await getCohortFeedbackMetadata(survey.id, userId);
    return createSuccessResponse({ ...formatSurvey(survey), ...(feedback ? { cohort_feedback: feedback } : {}) });
  },

  async updateStatus(id: number, userId: number, body: UpdateSurveyStatusBody) {
    await assertGenericSurvey(id);
    const existing = await prisma.surveys.findFirst({ where: { id, created_by: userId } });
    if (!existing) return null;
    const survey = await prisma.surveys.update({
      where: { id },
      data: { status: body.status },
      include: { questions: questionWithOptions },
    });
    return createSuccessResponse(formatSurvey(survey));
  },

  async submitResponse(externalId: string, userId: number | null, body: SubmitResponseBody) {
    const now = new Date();
    const survey = await prisma.surveys.findFirst({
      where: {
        external_id: externalId,
        status: 'active',
        OR: [{ start_time: null }, { start_time: { lte: now } }],
      },
      include: { questions: { select: { id: true, question_type: true, is_required: true, position: true, conditions: true } } },
    });
    if (!survey) return null;
    if (survey.end_time && survey.end_time < now) return null;

    const feedbackResult = await submitCohortFeedback(survey.id, userId, body);
    if (feedbackResult) return feedbackResult;

    const questionTypeMap = new Map(survey.questions.map((q) => [q.id, q.question_type]));

    // validate question_id belongs to this survey
    for (const a of body.answers) {
      if (!questionTypeMap.has(a.question_id)) {
        return 'invalid_question' as const;
      }
    }

    // validate per-type answer shape
    for (const a of body.answers) {
      const qType = questionTypeMap.get(a.question_id)!;
      if ((qType === 'rating' || qType === 'scale') && a.rating_value == null && a.answer_text == null) {
        return 'invalid_answer' as const;
      }
      if (qType === 'yesno' && a.boolean_value == null && a.answer_text == null) {
        return 'invalid_answer' as const;
      }
    }

    // Build maps for condition evaluation
    const positionToId = new Map(survey.questions.map((q) => [q.position, q.id]));
    const answerMap = new Map(body.answers.map((a) => [a.question_id, a]));

    // Determine which questions are visible given the submitted answers
    const isVisible = (q: { position: number; conditions: unknown }): boolean => {
      const conditions = (q.conditions as ConditionBody[]) ?? [];
      if (conditions.length === 0) return true;
      return conditions.every((c) => {
        const targetId = positionToId.get(c.depends_on_position);
        if (targetId == null) return false;
        const answer = answerMap.get(targetId);
        const answerValue =
          answer?.answer_text ??
          (answer?.boolean_value != null ? String(answer.boolean_value) : null) ??
          (answer?.rating_value != null ? String(answer.rating_value) : null) ??
          (Array.isArray(answer?.selected_option_ids) && answer.selected_option_ids.length > 0
            ? (answer.selected_option_ids as number[]).join(',')
            : null) ??
          '';
        switch (c.operator) {
          case 'equals': return answerValue === c.value;
          case 'not_equals': return answerValue !== c.value;
          case 'contains': return answerValue.includes(c.value);
          default: return true;
        }
      });
    };

    // enforce required only on visible questions
    const answeredQuestionIds = new Set(body.answers.map((a) => a.question_id));
    for (const q of survey.questions) {
      if (q.is_required && isVisible(q) && !answeredQuestionIds.has(q.id)) {
        return 'missing_required' as const;
      }
    }

    // Only persist answers for visible questions
    const visibleQuestionIds = new Set(survey.questions.filter(isVisible).map((q) => q.id));
    const visibleAnswers = body.answers.filter((a) => visibleQuestionIds.has(a.question_id));

    // wrap max_responses check and insert in a transaction
    const startedAt = body.started_at ? new Date(body.started_at) : undefined;
    const response = await prisma.$transaction(async (tx) => {
      if (survey.max_responses) {
        const count = await tx.survey_responses.count({ where: { survey_id: survey.id } });
        if (count >= survey.max_responses) return 'max_reached' as const;
      }
      return tx.survey_responses.create({
        data: {
          survey_id: survey.id,
          user_id: userId,
          started_at: startedAt,
          answers: {
            create: visibleAnswers.map((a) => ({
              survey_id: survey.id,
              question_id: a.question_id,
              question_type: questionTypeMap.get(a.question_id) ?? 'text',
              answer_text: a.answer_text,
              selected_option_ids: a.selected_option_ids ?? [],
              rating_value: a.rating_value,
              boolean_value: a.boolean_value,
            })),
          },
        },
      });
    });
    if (response === 'max_reached') return 'max_reached' as const;

    // Clean up this session's partial submission (fire-and-forget)
    if (body.session_key) {
      prisma.survey_partial_submissions.deleteMany({
        where: { survey_id: survey.id, session_key: body.session_key },
      }).catch((err) => loggerService.error('partial cleanup failed', { surveyId: survey.id, err }));
    }

    // Fire-and-forget: notify survey creator
    notifySurveyCreator(survey.id, survey.title, survey.created_by).catch((err) =>
      loggerService.error('survey notification failed', { surveyId: survey.id, err }),
    );

    return createSuccessResponse({ response_id: (response as { id: number }).id });
  },

  async getAnalytics(id: number, userId: number) {
    await assertGenericSurvey(id);
    const survey = await prisma.surveys.findFirst({
      where: { id, created_by: userId },
      include: { questions: { include: { options: true }, orderBy: { position: 'asc' } } },
    });
    if (!survey) return null;

    const [responseCount, answerCounts, avgDurationResult, dropOffRows] = await Promise.all([
      prisma.survey_responses.count({ where: { survey_id: id } }),
      prisma.survey_answers.groupBy({
        by: ['question_id'],
        where: { survey_id: id },
        _count: { id: true },
      }),
      prisma.$queryRaw<Array<{ avg_seconds: number | null }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::float AS avg_seconds
        FROM survey_responses
        WHERE survey_id = ${id} AND started_at IS NOT NULL
      `,
      prisma.survey_partial_submissions.groupBy({
        by: ['last_position'],
        where: { survey_id: id },
        _count: { id: true },
        orderBy: { last_position: 'asc' },
      }),
    ]);

    const answerCountMap = new Map(answerCounts.map(a => [a.question_id, a._count.id]));

    const perQuestion = await Promise.all(
      survey.questions.map(async (q) => {
        const answerCount = answerCountMap.get(q.id) ?? 0;
        let stats: Record<string, unknown> = {};

        if (q.question_type === 'rating' || q.question_type === 'scale') {
          const agg = await prisma.survey_answers.aggregate({
            where: { survey_id: id, question_id: q.id, rating_value: { not: null } },
            _avg: { rating_value: true },
            _min: { rating_value: true },
            _max: { rating_value: true },
          });
          stats = { avg: agg._avg.rating_value, min: agg._min.rating_value, max: agg._max.rating_value };

        } else if (q.question_type === 'yesno') {
          const [trueCount, falseCount] = await Promise.all([
            prisma.survey_answers.count({ where: { survey_id: id, question_id: q.id, boolean_value: true } }),
            prisma.survey_answers.count({ where: { survey_id: id, question_id: q.id, boolean_value: false } }),
          ]);
          stats = { true: trueCount, false: falseCount };

        } else if (
          q.question_type === 'multiple_choice' ||
          q.question_type === 'single_choice' ||
          q.question_type === 'ranking'
        ) {
          const rows = await prisma.$queryRaw<Array<{ option_id: number; cnt: bigint }>>`
            SELECT unnest(selected_option_ids) AS option_id, COUNT(*) AS cnt
            FROM survey_answers
            WHERE survey_id = ${id} AND question_id = ${q.id}
            GROUP BY option_id
          `;
          const countMap = new Map(rows.map(r => [Number(r.option_id), Number(r.cnt)]));
          stats = {
            option_counts: q.options.map(o => ({
              option_id: o.id,
              option_text: o.option_text,
              count: countMap.get(o.id) ?? 0,
            })),
          };

        } else {
          const samples = await prisma.survey_answers.findMany({
            where: { survey_id: id, question_id: q.id, answer_text: { not: null } },
            select: { answer_text: true },
            take: 5,
          });
          stats = { sample_answers: samples.map(a => a.answer_text) };
        }

        return {
          question_id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          answer_count: answerCount,
          stats,
        };
      })
    );

    const avgDurationSeconds = avgDurationResult[0]?.avg_seconds ?? null;
    const dropOff = dropOffRows.map((r) => ({
      last_position: r.last_position,
      count: r._count.id,
    }));

    return createSuccessResponse({
      survey_id: id,
      response_count: responseCount,
      view_count: survey.view_count,
      avg_duration_seconds: avgDurationSeconds,
      drop_off: dropOff,
      per_question: perQuestion,
    });
  },

  async delete(id: number, userId: number) {
    await assertGenericSurvey(id);
    const existing = await prisma.surveys.findFirst({ where: { id, created_by: userId } });
    if (!existing) return null;
    await prisma.surveys.delete({ where: { id } });
    return true;
  },

  async update(id: number, userId: number, body: UpdateSurveyBody) {
    await assertGenericSurvey(id);
    const existing = await prisma.surveys.findFirst({ where: { id, created_by: userId } });
    if (!existing) return null;
    const survey = await prisma.surveys.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.cover_url !== undefined && { cover_url: body.cover_url }),
      },
      include: { questions: { include: { options: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } } },
    });
    return createSuccessResponse(formatSurvey(survey));
  },

  async trackPartial(externalId: string, body: TrackPartialBody) {
    const survey = await prisma.surveys.findFirst({
      where: { external_id: externalId, status: 'active' },
      select: { id: true },
    });
    if (!survey) return;
    await assertGenericSurvey(survey.id);
    await prisma.survey_partial_submissions.upsert({
      where: { survey_id_session_key: { survey_id: survey.id, session_key: body.session_key } },
      create: { survey_id: survey.id, session_key: body.session_key, last_position: body.last_position },
      update: { last_position: body.last_position },
    });
  },

  async deleteResponse(surveyId: number, userId: number, responseId: number) {
    await assertGenericSurvey(surveyId);
    const survey = await prisma.surveys.findFirst({ where: { id: surveyId, created_by: userId }, select: { id: true } });
    if (!survey) return null;
    const existing = await prisma.survey_responses.findFirst({ where: { id: responseId, survey_id: surveyId } });
    if (!existing) return null;
    await prisma.survey_responses.delete({ where: { id: responseId } });
    return true;
  },

  async trackView(externalId: string) {
    const survey = await prisma.surveys.findFirst({ where: { external_id: externalId }, select: { id: true } });
    if (survey) await assertGenericSurvey(survey.id);
    await prisma.surveys.updateMany({
      where: { external_id: externalId, status: 'active' },
      data: { view_count: { increment: 1 } },
    });
  },

  async getResponse(surveyId: number, userId: number, responseId: number) {
    await assertGenericSurvey(surveyId);
    const survey = await prisma.surveys.findFirst({ where: { id: surveyId, created_by: userId }, select: { id: true } });
    if (!survey) return null;
    const response = await prisma.survey_responses.findFirst({
      where: { id: responseId, survey_id: surveyId },
      include: { answers: { select: { question_id: true, question_type: true, answer_text: true, selected_option_ids: true, rating_value: true, boolean_value: true } } },
    });
    if (!response) return null;
    return createSuccessResponse({
      id: response.id,
      survey_id: response.survey_id,
      user_id: response.user_id,
      completed_at: response.completed_at.toISOString(),
      answers: response.answers.map((a) => ({
        question_id: a.question_id,
        question_type: a.question_type,
        answer_text: a.answer_text,
        selected_option_ids: a.selected_option_ids,
        rating_value: a.rating_value,
        boolean_value: a.boolean_value,
      })),
    });
  },

  async listResponses(id: number, userId: number) {
    await assertGenericSurvey(id);
    const survey = await prisma.surveys.findFirst({ where: { id, created_by: userId }, select: { id: true } });
    if (!survey) return null;
    const responses = await prisma.survey_responses.findMany({
      where: { survey_id: id },
      include: { _count: { select: { answers: true } } },
      orderBy: { completed_at: 'desc' },
    });
    return createSuccessResponse(responses.map((r) => ({
      id: r.id,
      survey_id: r.survey_id,
      user_id: r.user_id,
      completed_at: r.completed_at.toISOString(),
      answer_count: r._count.answers,
    })));
  },
};

async function notifySurveyCreator(surveyId: number, surveyTitle: string, creatorId: number): Promise<void> {
  const user = await prisma.users.findFirst({
    where: { id: creatorId },
    include: { contacts: true },
  });
  const email = user?.contacts?.email;
  if (!email) return;

  const frontendUrl = process.env.FRONTEND_URL ?? '';
  const analyticsUrl = `${frontendUrl}/survey/${surveyId}/analytics`;

  await emailService.sendEmail({
    to: email,
    subject: `你的問卷《${surveyTitle}》收到了新回應`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 12px">收到新回應 🎉</h2>
        <p style="color:#555">你的問卷 <strong>${surveyTitle}</strong> 剛剛收到了一筆新回應。</p>
        <a href="${analyticsUrl}"
           style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16B9B3;color:#fff;border-radius:6px;text-decoration:none">
          查看分析結果
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">島島阿學 · 問卷系統</p>
      </div>
    `,
  });
}
