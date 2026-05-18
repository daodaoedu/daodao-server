import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../middleware/error.middleware';
import { prisma } from '../services/database/prisma.service';
import { personaService } from '../services/persona.service';
import { createSuccessResponse } from '../utils/response-helper';
import type { SubmitAnswerBody, SubmitSkipBody, AddResonanceBody, CarouselStateQuery, ProfileUserQuery } from '../validators/persona.validators';

export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const result = await personaService.getQuestions(req.user.id);
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

export const addResonance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const { answerId } = req.body as AddResonanceBody;
  const result = await personaService.addResonance(req.user.id, answerId);
  res.status(201).json(result);
});

export const removeResonance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const answerId = Number(req.params.answerId);
  const result = await personaService.removeResonance(req.user.id, answerId);
  res.json(result);
});

export const getCarouselState = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const { replace } = req.query as CarouselStateQuery;
  const result = await personaService.getCarouselState(req.user.id, replace);
  res.json(result);
});

export const dismissCarousel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const result = await personaService.dismissCarousel(req.user.id);
  res.json(result);
});

export const getProfileMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const result = await personaService.getProfileMe(req.user.id);
  res.json(result);
});

export const getProfileUser = asyncHandler(async (req: Request, res: Response) => {
  const externalId = req.params.userId;
  const { exclude } = req.query as ProfileUserQuery;
  const requesterId = req.user?.id;
  const user = await prisma.users.findFirst({ where: { external_id: externalId }, select: { id: true } });
  if (!user) throw new NotFoundError('找不到使用者');
  const result = await personaService.getProfileUser(user.id, requesterId, exclude);
  res.json(result);
});
