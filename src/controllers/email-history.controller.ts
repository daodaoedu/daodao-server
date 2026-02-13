/**
 * 郵件歷史控制器
 * 處理郵件歷史相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import emailHistoryService from '../services/email-history.service';
import { emailHistoryQuerySchema } from '../validators/email-history.validator';

/**
 * 取得郵件發送歷史
 * GET /admin/email/history
 */
export const getEmailHistory = asyncHandler(async (req: Request, res: Response) => {
  const query = emailHistoryQuerySchema.parse(req.query);

  const result = await emailHistoryService.getEmailHistory({
    emailType: query.emailType,
    status: query.status,
    recipient: query.recipient,
    userId: query.userId,
    startDate: query.startDate,
    endDate: query.endDate,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  });

  const response = createSuccessResponse(result);
  res.json(response);
});

export default {
  getEmailHistory
};
