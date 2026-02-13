/**
 * Admin 統計控制器
 * 處理 Admin 統計相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminStatisticsService from '../services/admin-statistics.service';
import {
  practiceStatsQuerySchema,
  activeUsersTrendQuerySchema
} from '../validators/admin-statistics.validator';

/**
 * 取得全站實踐統計
 * GET /admin/practices/stats
 */
export const getPracticeStats = asyncHandler(async (req: Request, res: Response) => {
  const query = practiceStatsQuerySchema.parse(req.query);

  const stats = await adminStatisticsService.getPracticeStats({
    startDate: query.startDate,
    endDate: query.endDate
  });

  const response = createSuccessResponse(stats);
  res.json(response);
});

/**
 * 取得活躍用戶趨勢
 * GET /admin/user-stats/active-users/trend
 */
export const getActiveUsersTrend = asyncHandler(async (req: Request, res: Response) => {
  const query = activeUsersTrendQuerySchema.parse(req.query);

  const trend = await adminStatisticsService.getActiveUsersTrend({
    days: query.days
  });

  const response = createSuccessResponse(trend);
  res.json(response);
});

export default {
  getPracticeStats,
  getActiveUsersTrend
};
