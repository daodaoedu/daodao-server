/**
 * Connection Controller
 * 處理連結系統的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { connectionService } from '../services/connection.service';
import type {
  SendRequestBody,
  UpdateRequestBody,
  ConnectionQuery,
} from '../validators/connection.validators';

/**
 * POST /api/v1/connections/request
 * 發送連結請求
 */
export const sendRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const body = req.body as SendRequestBody;
  const result = await connectionService.sendRequest(
    req.user.id,
    body.receiverExternalId,
    body.intent,
    body.contextPracticeExternalId
  );

  res.status(201).json(result);
});

/**
 * PATCH /api/v1/connections/request/:requestId
 * 接受或拒絕連結請求
 */
export const updateRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const requestId = parseInt(req.params.requestId, 10);
  const { action } = req.body as UpdateRequestBody;

  const result = action === 'accept'
    ? await connectionService.acceptRequest(req.user.id, requestId)
    : await connectionService.rejectRequest(req.user.id, requestId);

  res.json(result);
});

/**
 * DELETE /api/v1/connections/request/:requestId
 * 撤回連結請求
 */
export const withdrawRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const requestId = parseInt(req.params.requestId, 10);
  const result = await connectionService.withdrawRequest(req.user.id, requestId);
  res.json(result);
});

/**
 * DELETE /api/v1/connections/:userId
 * 解除連結
 */
export const disconnect = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const result = await connectionService.disconnect(req.user.id, req.params.userId);
  res.json(result);
});

/**
 * GET /api/v1/connections
 * 取得我的夥伴列表
 */
export const getConnections = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const { page, limit } = req.query as unknown as ConnectionQuery;
  const result = await connectionService.getConnections(req.user.id, page, limit);
  res.json(result);
});

/**
 * GET /api/v1/connections/requests/incoming
 * 取得收到的待處理連結請求
 */
export const getIncomingRequests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const { page, limit } = req.query as unknown as ConnectionQuery;
  const result = await connectionService.getPendingIncoming(req.user.id, page, limit);
  res.json(result);
});

/**
 * GET /api/v1/connections/requests/outgoing
 * 取得發出的連結請求
 */
export const getOutgoingRequests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const { page, limit } = req.query as unknown as ConnectionQuery;
  const result = await connectionService.getPendingOutgoing(req.user.id, page, limit);
  res.json(result);
});
