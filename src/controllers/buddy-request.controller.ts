/**
 * Buddy Request Controller
 * 處理 Buddy 請求系統的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { buddyRequestService } from '../services/buddy-request.service';
import type {
  CreateBuddyRequestBody,
  UpdateBuddyRequestBody,
  BuddyRequestQuery,
} from '../validators/buddy-request.validators';

/**
 * POST /api/v1/practices/:id/buddy-requests
 * 發送 Buddy 請求
 */
export const createBuddyRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const practiceExternalId = req.params.id;
  const { receiverExternalId } = req.body as CreateBuddyRequestBody;

  const result = await buddyRequestService.createBuddyRequest(
    req.user.id,
    practiceExternalId,
    receiverExternalId,
  );

  res.status(201).json(result);
});

/**
 * PATCH /api/v1/buddy-requests/:id
 * 接受或忽略 Buddy 請求
 */
export const updateBuddyRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const requestId = parseInt(req.params.id, 10);
  const { status } = req.body as UpdateBuddyRequestBody;

  const result = await buddyRequestService.updateBuddyRequest(
    requestId,
    req.user.id,
    status,
  );

  res.json(result);
});

/**
 * GET /api/v1/buddy-requests
 * 查詢收到的待處理 Buddy 請求列表（當前用戶作為 receiver）
 */
export const getPendingIncoming = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const { page, limit } = req.query as unknown as BuddyRequestQuery;

  const result = await buddyRequestService.getPendingIncoming(req.user.id, page, limit);

  res.json(result);
});
