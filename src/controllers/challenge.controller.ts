import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { challengeService } from '../services/challenge.service';
import { createSuccessResponse } from '../utils/response-helper';
import { challengeDetailResponseSchema, challengeJoinResultSchema, challengeListResponseSchema } from '../validators/challenge.validator';

/** 探索共同挑戰列表（公開；登入時附 isJoined） */
const list = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(challengeListResponseSchema.parse(await challengeService.list(req.user?.id ?? null))));
});

/** 挑戰詳情（公開；含已結束的歷史足跡） */
const detail = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(challengeDetailResponseSchema.parse(await challengeService.getDetail(Number(req.params.challengeId), req.user?.id ?? null))));
});

/** 加入共同挑戰（需登入） */
const join = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.status(201).json(createSuccessResponse(challengeJoinResultSchema.parse(await challengeService.join(Number(req.params.challengeId), req.user.id))));
});

export const challengeController = { list, detail, join };
