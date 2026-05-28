import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, BadRequestError } from '@/middleware/error.middleware';
import { prisma } from '@/services/database/prisma.service';
import { createSuccessResponse } from '@/utils/response-helper';
import { survey_status_t, question_type_t } from '../../generated/prisma';

function parseId(param: string): number {
  const id = parseInt(param, 10);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('無效的 ID');
  return id;
}

async function getUserInfoMap(userIds: number[]): Promise<Map<number, { id: number; email: string | null; nickname: string | null }>> {
  if (userIds.length === 0) return new Map();
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      nickname: true,
      contacts: { select: { email: true } },
    },
  });
  return new Map(users.map((u) => [u.id, { id: u.id, email: u.contacts?.email ?? null, nickname: u.nickname ?? null }]));
}

export const adminSurveyController = {
  listAll: asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const q = req.query.q as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const where = {
      ...(status ? { status: status as survey_status_t } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [surveys, total] = await Promise.all([
      prisma.surveys.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: { _count: { select: { responses: true } } },
      }),
      prisma.surveys.count({ where }),
    ]);

    const userIds = [...new Set(surveys.map((s) => s.created_by))];
    const userMap = await getUserInfoMap(userIds);

    const data = surveys.map((s) => ({
      id: s.id,
      external_id: s.external_id,
      title: s.title,
      status: s.status,
      is_anonymous: s.is_anonymous,
      tags: s.tags,
      view_count: s.view_count,
      created_at: s.created_at.toISOString(),
      response_count: s._count.responses,
      creator: userMap.get(s.created_by) ?? { id: s.created_by, email: null, nickname: null },
    }));

    res.json({
      success: true,
      data,
      pagination: { total_count: total, limit, offset, has_next: offset + limit < total },
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const survey = await prisma.surveys.findFirst({
      where: { id },
      include: {
        questions: {
          include: { options: { orderBy: { position: 'asc' } } },
          orderBy: { position: 'asc' },
        },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundError('問卷不存在');

    const userMap = await getUserInfoMap([survey.created_by]);
    const creator = userMap.get(survey.created_by) ?? { id: survey.created_by, email: null, nickname: null };

    res.json(
      createSuccessResponse({
        id: survey.id,
        external_id: survey.external_id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        is_anonymous: survey.is_anonymous,
        max_responses: survey.max_responses,
        view_count: survey.view_count,
        tags: survey.tags,
        cover_url: survey.cover_url,
        created_at: survey.created_at.toISOString(),
        updated_at: survey.updated_at.toISOString(),
        response_count: survey._count.responses,
        creator,
        questions: survey.questions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          position: q.position,
          options: q.options.map((o) => ({ id: o.id, option_text: o.option_text, position: o.position })),
        })),
      }),
    );
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const { status } = req.body as { status: string };
    const validStatuses: string[] = Object.values(survey_status_t);
    if (!validStatuses.includes(status)) throw new BadRequestError('無效的狀態值');

    const survey = await prisma.surveys.findFirst({ where: { id } });
    if (!survey) throw new NotFoundError('問卷不存在');

    const updated = await prisma.surveys.update({
      where: { id },
      data: { status: status as survey_status_t },
      select: { id: true, status: true, updated_at: true },
    });
    res.json(createSuccessResponse(updated));
  }),

  deleteSurvey: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const survey = await prisma.surveys.findFirst({ where: { id } });
    if (!survey) throw new NotFoundError('問卷不存在');
    await prisma.surveys.delete({ where: { id } });
    res.status(204).send();
  }),

  listResponses: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const survey = await prisma.surveys.findFirst({ where: { id }, select: { id: true } });
    if (!survey) throw new NotFoundError('問卷不存在');

    const [responses, total] = await Promise.all([
      prisma.survey_responses.findMany({
        where: { survey_id: id },
        orderBy: { completed_at: 'desc' },
        skip: offset,
        take: limit,
        include: { _count: { select: { answers: true } } },
      }),
      prisma.survey_responses.count({ where: { survey_id: id } }),
    ]);

    res.json({
      success: true,
      data: responses.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        completed_at: r.completed_at.toISOString(),
        answer_count: r._count.answers,
      })),
      pagination: { total_count: total, limit, offset, has_next: offset + limit < total },
    });
  }),

  deleteResponse: asyncHandler(async (req: Request, res: Response) => {
    const surveyId = parseId(req.params.id);
    const responseId = parseId(req.params.responseId);

    const survey = await prisma.surveys.findFirst({ where: { id: surveyId }, select: { id: true } });
    if (!survey) throw new NotFoundError('問卷不存在');

    const response = await prisma.survey_responses.findFirst({
      where: { id: responseId, survey_id: surveyId },
    });
    if (!response) throw new NotFoundError('回應不存在');

    await prisma.survey_responses.delete({ where: { id: responseId } });
    res.status(204).send();
  }),

  getResponseDetail: asyncHandler(async (req: Request, res: Response) => {
    const surveyId = parseId(req.params.id);
    const responseId = parseId(req.params.responseId);

    const survey = await prisma.surveys.findFirst({ where: { id: surveyId }, select: { id: true } });
    if (!survey) throw new NotFoundError('問卷不存在');

    const response = await prisma.survey_responses.findFirst({
      where: { id: responseId, survey_id: surveyId },
      include: {
        answers: {
          include: {
            question: { include: { options: { orderBy: { position: 'asc' } } } },
          },
        },
      },
    });
    if (!response) throw new NotFoundError('回應不存在');

    res.json(
      createSuccessResponse({
        id: response.id,
        user_id: response.user_id,
        completed_at: response.completed_at.toISOString(),
        answers: response.answers.map((a) => ({
          question_id: a.question_id,
          question_text: a.question.question_text,
          question_type: a.question_type,
          answer_text: a.answer_text,
          selected_option_ids: a.selected_option_ids,
          selected_options: a.question.options
            .filter((o) => a.selected_option_ids.includes(o.id))
            .map((o) => o.option_text),
          rating_value: a.rating_value,
          boolean_value: a.boolean_value,
        })),
      }),
    );
  }),

  createSurvey: asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user?.id;
    if (!adminId) throw new BadRequestError('未驗證');

    const { title, description, is_anonymous, tags, max_responses, start_time, end_time, questions } =
      req.body as {
        title: string;
        description?: string;
        is_anonymous?: boolean;
        tags?: string[];
        max_responses?: number;
        start_time?: string;
        end_time?: string;
        questions?: Array<{
          question_text: string;
          question_type: string;
          is_required?: boolean;
          position?: number;
          options?: Array<{ option_text: string; position?: number }>;
        }>;
      };

    if (!title?.trim()) throw new BadRequestError('標題為必填');

    const survey = await prisma.$transaction(async (tx) => {
      const created = await tx.surveys.create({
        data: {
          title: title.trim(),
          description: description ?? null,
          is_anonymous: is_anonymous ?? false,
          tags: tags ?? [],
          max_responses: max_responses ?? null,
          start_time: start_time ? new Date(start_time) : null,
          end_time: end_time ? new Date(end_time) : null,
          created_by: adminId,
          status: survey_status_t.draft,
        },
      });

      if (questions && questions.length > 0) {
        for (const q of questions) {
          const question = await tx.questions.create({
            data: {
              survey_id: created.id,
              question_type: q.question_type as question_type_t,
              question_text: q.question_text,
              is_required: q.is_required ?? false,
              position: q.position ?? 0,
            },
          });
          if (q.options && q.options.length > 0) {
            await tx.question_options.createMany({
              data: q.options.map((o, i) => ({
                question_id: question.id,
                option_text: o.option_text,
                position: o.position ?? i,
              })),
            });
          }
        }
      }

      return created;
    });

    res.status(201).json(createSuccessResponse({ id: survey.id, external_id: survey.external_id }));
  }),

  updateSurvey: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const { title, description, is_anonymous, tags, max_responses, start_time, end_time, questions } =
      req.body as {
        title?: string;
        description?: string;
        is_anonymous?: boolean;
        tags?: string[];
        max_responses?: number | null;
        start_time?: string | null;
        end_time?: string | null;
        questions?: Array<{
          question_text: string;
          question_type: string;
          is_required?: boolean;
          position?: number;
          options?: Array<{ option_text: string; position?: number }>;
        }>;
      };

    const existing = await prisma.surveys.findFirst({ where: { id } });
    if (!existing) throw new NotFoundError('問卷不存在');

    await prisma.$transaction(async (tx) => {
      await tx.surveys.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && { description }),
          ...(is_anonymous !== undefined && { is_anonymous }),
          ...(tags !== undefined && { tags }),
          ...(max_responses !== undefined && { max_responses }),
          ...(start_time !== undefined && { start_time: start_time ? new Date(start_time) : null }),
          ...(end_time !== undefined && { end_time: end_time ? new Date(end_time) : null }),
        },
      });

      if (questions !== undefined) {
        await tx.questions.deleteMany({ where: { survey_id: id } });
        for (const q of questions) {
          const question = await tx.questions.create({
            data: {
              survey_id: id,
              question_type: q.question_type as question_type_t,
              question_text: q.question_text,
              is_required: q.is_required ?? false,
              position: q.position ?? 0,
            },
          });
          if (q.options && q.options.length > 0) {
            await tx.question_options.createMany({
              data: q.options.map((o, i) => ({
                question_id: question.id,
                option_text: o.option_text,
                position: o.position ?? i,
              })),
            });
          }
        }
      }
    });

    res.json(createSuccessResponse({ id, updated: true }));
  }),
};
