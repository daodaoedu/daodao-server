import { Request, Response } from 'express';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import personaQuestionService from '../services/admin/persona-question.service';

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
  const { questionType, isNewUserPriority, translations } = req.body;
  const question = await personaQuestionService.createQuestion({ questionType, isNewUserPriority, translations });
  res.status(201).json(createSuccessResponse(question));
});

/**
 * PUT /admin/persona/questions/:id
 */
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new BadRequestError('無效的問題 ID');
  const { questionType, isNewUserPriority } = req.body;
  const question = await personaQuestionService.updateQuestion(id, { questionType, isNewUserPriority });
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
  const { prompt, options } = req.body;
  const question = await personaQuestionService.upsertTranslation(id, locale, { prompt, options });
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
