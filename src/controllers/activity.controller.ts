import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { activityService } from '../services/activity.service';
import { createSuccessResponse } from '../utils/response-helper';
import { activityDetailResponseSchema, activityHostPreviewSchema, activityListResponseSchema } from '../validators/activity.validator';

/** 探索活動列表（公開；登入時附 isJoined；可依互動方式篩選；含已結束） */
const list = asyncHandler(async (req: Request, res: Response) => {
  const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;
  const { data, meta } = await activityService.list(req.user?.id ?? null, mode);
  res.json(createSuccessResponse(activityListResponseSchema.parse(data), meta));
});

/** 活動詳情（公開） */
const detail = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(activityDetailResponseSchema.parse(await activityService.getDetail(Number(req.params.cohortId), req.user?.id ?? null))));
});

/** 發起人快覽 */
const hostPreview = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(activityHostPreviewSchema.parse(await activityService.getHostPreview(Number(req.params.userId)))));
});

export const activityController = { list, detail, hostPreview };
