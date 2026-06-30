import { Request, Response } from 'express'
import { asyncHandler, NotFoundError, BadRequestError } from '@/middleware/error.middleware'
import { createSuccessResponse } from '@/utils/response-helper'
import { prisma } from '@/services/database/prisma.service'
import { z } from 'zod'

function parseId(param: string): number {
  const id = parseInt(param, 10)
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('無效的 ID')
  return id
}

const listQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'closed', 'archived']).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'closed', 'archived']),
})

const createSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  is_anonymous: z.boolean().default(false),
  max_responses: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
  cover_url: z.string().url().nullable().optional(),
  questions: z.array(z.object({
    question_text: z.string().min(1).max(1000),
    question_type: z.enum(['multiple_choice', 'single_choice', 'rating', 'text', 'yesno', 'scale', 'ranking']),
    is_required: z.boolean().default(false),
    position: z.number().int().min(0).default(0),
    options: z.array(z.object({
      option_text: z.string().min(1).max(200),
      position: z.number().int().min(0).default(0),
    })).optional(),
  })).default([]),
})

const updateSurveySchema = createSurveySchema.omit({ questions: true }).partial()

const questionWithOptions = {
  include: { options: { orderBy: { position: 'asc' as const } } },
  orderBy: { position: 'asc' as const },
}

export const adminSurveyController = {
  listSurveys: asyncHandler(async (req: Request, res: Response) => {
    const { status, q, limit, offset } = listQuerySchema.parse(req.query)

    const where = {
      ...(status && { status }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [surveys, total] = await Promise.all([
      prisma.surveys.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: { _count: { select: { responses: true } } },
      }),
      prisma.surveys.count({ where }),
    ])

    const creatorIds = [...new Set(surveys.map((s) => s.created_by).filter((id): id is number => id != null))]
    const creators = creatorIds.length
      ? await prisma.users.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, nickname: true, contacts: { select: { email: true } } },
        })
      : []
    const creatorMap = new Map(creators.map((u) => [u.id, u]))

    const data = surveys.map((s) => {
      const creator = creatorMap.get(s.created_by)
      return {
        id: s.id,
        external_id: s.external_id,
        title: s.title,
        status: s.status,
        is_anonymous: s.is_anonymous,
        tags: s.tags,
        view_count: s.view_count,
        created_at: s.created_at.toISOString(),
        response_count: s._count.responses,
        creator: {
          id: creator?.id ?? null,
          email: creator?.contacts?.email ?? null,
          nickname: creator?.nickname ?? null,
        },
      }
    })

    res.json({
      success: true,
      data,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  }),

  getSurvey: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    const survey = await prisma.surveys.findUnique({
      where: { id },
      include: {
        questions: questionWithOptions,
        _count: { select: { responses: true } },
      },
    })
    if (!survey) throw new NotFoundError('問卷不存在')

    const creator = await prisma.users.findUnique({
      where: { id: survey.created_by },
      select: { id: true, nickname: true, contacts: { select: { email: true } } },
    })

    res.json(createSuccessResponse({
      id: survey.id,
      external_id: survey.external_id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      is_anonymous: survey.is_anonymous,
      max_responses: survey.max_responses,
      tags: survey.tags,
      cover_url: survey.cover_url,
      view_count: survey.view_count,
      created_at: survey.created_at.toISOString(),
      updated_at: survey.updated_at.toISOString(),
      response_count: survey._count.responses,
      creator: {
        id: creator?.id ?? null,
        email: creator?.contacts?.email ?? null,
        nickname: creator?.nickname ?? null,
      },
      questions: survey.questions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        position: q.position,
        options: q.options.map((o) => ({ id: o.id, option_text: o.option_text, position: o.position })),
      })),
    }))
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    const { status } = updateStatusSchema.parse(req.body)
    const existing = await prisma.surveys.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('問卷不存在')
    const updated = await prisma.surveys.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updated_at: true },
    })
    res.json(createSuccessResponse({
      id: updated.id,
      status: updated.status,
      updated_at: updated.updated_at.toISOString(),
    }))
  }),

  deleteSurvey: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    const existing = await prisma.surveys.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('問卷不存在')
    await prisma.surveys.delete({ where: { id } })
    res.status(204).send()
  }),

  listResponses: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    const { limit, offset } = listQuerySchema.pick({ limit: true, offset: true }).parse(req.query)

    const existing = await prisma.surveys.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw new NotFoundError('問卷不存在')

    const [responses, total] = await Promise.all([
      prisma.survey_responses.findMany({
        where: { survey_id: id },
        include: { _count: { select: { answers: true } } },
        orderBy: { completed_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.survey_responses.count({ where: { survey_id: id } }),
    ])

    res.json({
      success: true,
      data: responses.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        completed_at: r.completed_at.toISOString(),
        answer_count: r._count.answers,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  }),

  getResponse: asyncHandler(async (req: Request, res: Response) => {
    const surveyId = parseId(req.params.id)
    const responseId = parseId(req.params.responseId)

    const response = await prisma.survey_responses.findFirst({
      where: { id: responseId, survey_id: surveyId },
    })
    if (!response) throw new NotFoundError('回應不存在')

    const answers = await prisma.survey_answers.findMany({
      where: { survey_response_id: responseId },
      include: { question: { select: { question_text: true } } },
    })

    res.json(createSuccessResponse({
      id: response.id,
      user_id: response.user_id,
      completed_at: response.completed_at.toISOString(),
      answers: answers.map((a) => ({
        question_id: a.question_id,
        question_text: a.question?.question_text ?? '',
        question_type: a.question_type,
        answer_text: a.answer_text,
        selected_option_ids: a.selected_option_ids,
        selected_options: [],
        rating_value: a.rating_value,
        boolean_value: a.boolean_value,
      })),
    }))
  }),

  deleteResponse: asyncHandler(async (req: Request, res: Response) => {
    const surveyId = parseId(req.params.id)
    const responseId = parseId(req.params.responseId)

    const existing = await prisma.survey_responses.findFirst({
      where: { id: responseId, survey_id: surveyId },
    })
    if (!existing) throw new NotFoundError('回應不存在')
    await prisma.survey_responses.delete({ where: { id: responseId } })
    res.status(204).send()
  }),

  createSurvey: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) throw new BadRequestError('未登入')
    const body = createSurveySchema.parse(req.body)

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
            conditions: [],
            options: q.options
              ? { create: q.options.map((o) => ({ option_text: o.option_text, position: o.position })) }
              : undefined,
          })),
        },
      },
      select: { id: true, external_id: true },
    })
    res.status(201).json(createSuccessResponse({ id: survey.id, external_id: survey.external_id }))
  }),

  updateSurvey: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    const body = updateSurveySchema.parse(req.body)

    const existing = await prisma.surveys.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('問卷不存在')

    const updated = await prisma.surveys.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.cover_url !== undefined && { cover_url: body.cover_url }),
        ...(body.is_anonymous !== undefined && { is_anonymous: body.is_anonymous }),
        ...(body.max_responses !== undefined && { max_responses: body.max_responses }),
      },
      select: { id: true, updated_at: true },
    })
    res.json(createSuccessResponse({ id: updated.id, updated: true }))
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id)

    const survey = await prisma.surveys.findUnique({
      where: { id },
      include: { questions: { include: { options: true }, orderBy: { position: 'asc' } } },
    })
    if (!survey) throw new NotFoundError('問卷不存在')

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
    ])

    const answerCountMap = new Map(answerCounts.map((a) => [a.question_id, a._count.id]))

    const perQuestion = await Promise.all(
      survey.questions.map(async (q) => {
        const answerCount = answerCountMap.get(q.id) ?? 0
        let stats: Record<string, unknown> = {}

        if (q.question_type === 'rating' || q.question_type === 'scale') {
          const agg = await prisma.survey_answers.aggregate({
            where: { survey_id: id, question_id: q.id, rating_value: { not: null } },
            _avg: { rating_value: true },
            _min: { rating_value: true },
            _max: { rating_value: true },
          })
          stats = { avg: agg._avg.rating_value, min: agg._min.rating_value, max: agg._max.rating_value }
        } else if (q.question_type === 'yesno') {
          const [trueCount, falseCount] = await Promise.all([
            prisma.survey_answers.count({ where: { survey_id: id, question_id: q.id, boolean_value: true } }),
            prisma.survey_answers.count({ where: { survey_id: id, question_id: q.id, boolean_value: false } }),
          ])
          stats = { true: trueCount, false: falseCount }
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
          `
          const countMap = new Map(rows.map((r) => [Number(r.option_id), Number(r.cnt)]))
          stats = {
            option_counts: q.options.map((o) => ({
              option_id: o.id,
              option_text: o.option_text,
              count: countMap.get(o.id) ?? 0,
            })),
          }
        } else {
          const samples = await prisma.survey_answers.findMany({
            where: { survey_id: id, question_id: q.id, answer_text: { not: null } },
            select: { answer_text: true },
            take: 5,
          })
          stats = { sample_answers: samples.map((a) => a.answer_text) }
        }

        return { question_id: q.id, question_text: q.question_text, question_type: q.question_type, answer_count: answerCount, stats }
      })
    )

    res.json(createSuccessResponse({
      survey_id: id,
      response_count: responseCount,
      view_count: survey.view_count,
      avg_duration_seconds: avgDurationResult[0]?.avg_seconds ?? null,
      drop_off: dropOffRows.map((r) => ({ last_position: r.last_position, count: r._count.id })),
      per_question: perQuestion,
    }))
  }),
}
