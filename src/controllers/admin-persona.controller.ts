import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import personaQuestionService from '../services/admin/persona-question.service';

const translationSchema = z.object({
  locale: z.enum(['zh-TW', 'en']),
  prompt: z.string().min(1),
  options: z.array(z.string()).nullable().optional(),
});

const createQuestionBodySchema = z.object({
  questionType: z.enum(['choice', 'sentence_completion', 'scenario']),
  isNewUserPriority: z.boolean().optional().default(false),
  translations: z.array(translationSchema).min(1),
});

const updateQuestionBodySchema = z.object({
  questionType: z.enum(['choice', 'sentence_completion', 'scenario']).optional(),
  isNewUserPriority: z.boolean().optional(),
});

const upsertTranslationBodySchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string()).nullable().optional(),
});

const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['answer_count', 'last_answered']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * GET /admin/persona/questions
 */
export const listQuestions = asyncHandler(async (_req: Request, res: Response) => {
  const questions = await personaQuestionService.listQuestions();
  res.json(createSuccessResponse(questions));
});

/**
 * GET /admin/persona/questions/:id
 */
export const getQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new BadRequestError('無效的問題 ID');
  const question = await personaQuestionService.getQuestion(id);
  res.json(createSuccessResponse(question));
});

/**
 * POST /admin/persona/questions
 */
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createQuestionBodySchema.safeParse(req.body);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? '無效的請求內容');
  const question = await personaQuestionService.createQuestion(parsed.data);
  res.status(201).json(createSuccessResponse(question));
});

/**
 * PUT /admin/persona/questions/:id
 */
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new BadRequestError('無效的問題 ID');
  const parsed = updateQuestionBodySchema.safeParse(req.body);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? '無效的請求內容');
  const question = await personaQuestionService.updateQuestion(id, parsed.data);
  res.json(createSuccessResponse(question));
});

/**
 * DELETE /admin/persona/questions/:id
 */
export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new BadRequestError('無效的問題 ID');
  await personaQuestionService.deleteQuestion(id);
  res.json(createSuccessResponse({ message: '問題已刪除' }));
});

/**
 * PUT /admin/persona/questions/:id/translations/:locale
 */
export const upsertTranslation = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new BadRequestError('無效的問題 ID');
  const { locale } = req.params;
  const parsed = upsertTranslationBodySchema.safeParse(req.body);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? '無效的請求內容');
  const question = await personaQuestionService.upsertTranslation(id, locale, parsed.data);
  res.json(createSuccessResponse(question));
});

/**
 * DELETE /admin/persona/questions/:id/translations/:locale
 */
export const deleteTranslation = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new BadRequestError('無效的問題 ID');
  const { locale } = req.params;
  await personaQuestionService.deleteTranslation(id, locale);
  res.json(createSuccessResponse({ message: '翻譯已刪除' }));
});

/**
 * GET /admin/persona/users
 * 列出已回答 persona 題目的使用者（支援搜尋、排序、分頁）
 */
export const listPersonaUsers = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? '無效的查詢參數');
  const { data, pagination } = await personaQuestionService.listPersonaUsers(parsed.data);
  res.json({
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

export default { listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion, upsertTranslation, deleteTranslation, listPersonaUsers };
