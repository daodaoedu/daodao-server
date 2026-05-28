import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, BadRequestError } from '@/middleware/error.middleware';
import { prisma } from '@/services/database/prisma.service';
import { createSuccessResponse } from '@/utils/response-helper';
import { survey_status_t } from '../../generated/prisma';

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
};
