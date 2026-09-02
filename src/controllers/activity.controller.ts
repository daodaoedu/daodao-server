import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { activityService } from '../services/activity.service';
import { createSuccessResponse } from '../utils/response-helper';
import { activityDetailResponseSchema, activityListResponseSchema } from '../validators/activity.validator';

/** 探索活動列表（公開；登入時附 isJoined） */
const list = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(activityListResponseSchema.parse(await activityService.list(req.user?.id ?? null))));
});

/** 活動詳情（公開） */
const detail = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(activityDetailResponseSchema.parse(await activityService.getDetail(Number(req.params.cohortId), req.user?.id ?? null))));
});

export const activityController = { list, detail };
