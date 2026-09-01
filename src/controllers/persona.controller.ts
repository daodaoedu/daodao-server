import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../middleware/error.middleware';
import { prisma } from '../services/database/prisma.service';
import { personaService } from '../services/persona.service';
import { createSuccessResponse } from '../utils/response-helper';
import type { SubmitAnswerBody, SubmitSkipBody, CarouselStateQuery, ProfileUserQuery, QuestionAnswersParam, QuestionAnswersQuery, QuestionViewParam } from '../validators/persona.validators';

export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  const locale = (req.query.locale as string) || 'zh-TW';
  const result = await personaService.getQuestions(req.user?.id ?? null, locale);
  res.json(result);
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const body = req.body as SubmitAnswerBody;
  const { answer, isNew } = await personaService.submitAnswer(req.user.id, body);
  res.status(isNew ? 201 : 200).json(createSuccessResponse(answer));
});

export const submitSkip = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const { questionId } = req.body as SubmitSkipBody;
  const result = await personaService.submitSkip(req.user.id, questionId);
  res.json(result);
});

export const getCarouselState = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const { replace } = req.query as unknown as CarouselStateQuery;
  const locale = (req.query.locale as string) || 'zh-TW';
  const result = await personaService.getCarouselState(req.user.id, replace, locale);
  res.json(result);
});

export const dismissCarousel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const result = await personaService.dismissCarousel(req.user.id);
  res.json(result);
});

export const getProfileMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const locale = (req.query.locale as string) || 'zh-TW';
  const result = await personaService.getProfileMe(req.user.id, locale);
  res.json(result);
});

export const getQuestionAnswers = asyncHandler(async (req: Request, res: Response) => {
  const { questionId } = req.params as unknown as QuestionAnswersParam;
  const { locale, limit, cursor } = req.query as unknown as QuestionAnswersQuery;
  const result = await personaService.getQuestionAnswers(questionId, req.user?.id, { locale, limit, cursor });
  res.json(result);
});

/**
 * 記錄一次人物誌題目的觀看事件（同一使用者對同一題 24h 內去重）。
 * POST /api/v1/persona/questions/:questionId/view
 */
export const recordQuestionView = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const { questionId } = req.params as unknown as QuestionViewParam;
  const result = await personaService.recordQuestionView(questionId, req.user.id);
  res.json(result);
});

export const getProfileUser = asyncHandler(async (req: Request, res: Response) => {
  const externalId = req.params.userId;
  const { exclude } = req.query as unknown as ProfileUserQuery;
  const locale = (req.query.locale as string) || 'zh-TW';
  const requesterId = req.user?.id;
  const user = await prisma.users.findFirst({ where: { external_id: externalId }, select: { id: true } });
  if (!user) throw new NotFoundError('找不到使用者');
  const result = await personaService.getProfileUser(user.id, requesterId, exclude, locale);
  res.json(result);
});
