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

export default { listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion, upsertTranslation, deleteTranslation };
