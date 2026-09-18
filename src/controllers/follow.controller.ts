/**
 * Follow Controller
 * 處理關注系統的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { followService } from '../services/follow.service';
import type { FollowTargetBody, FollowParams, FollowQuery, FollowCheckParams } from '../validators/follow.validators';
import { followActionApiResponseSchema, followListApiResponseSchema } from '../validators/follow.validators';

/**
 * POST /api/v1/follows
 * 關注用戶或主題實踐
 */
export const follow = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const body = req.body as FollowTargetBody;

  const result = body.targetType === 'user'
    ? await followService.followUser(req.user.id, body.targetId)
    : await followService.followPractice(req.user.id, body.targetId);

  const validatedResponse = followActionApiResponseSchema.parse(result);
  res.status(201).json(validatedResponse);
});

/**
 * DELETE /api/v1/follows/:targetType/:targetId
 * 取消關注
 */
export const unfollow = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const { targetType, targetId } = req.params as unknown as FollowParams;

  const result = targetType === 'user'
    ? await followService.unfollowUser(req.user.id, targetId)
    : await followService.unfollowPractice(req.user.id, targetId);

  const validatedResponse = followActionApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * GET /api/v1/follows/check/:targetType/:targetId
 * 查詢當前用戶是否已關注某目標
 */
export const checkFollow = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const { targetType, targetId } = req.params as unknown as FollowCheckParams;
  const result = await followService.checkFollowStatus(req.user.id, targetType, targetId);
  res.json(result);
});

/**
 * GET /api/v1/users/:userId/followers
 * 取得某用戶的關注者列表
 */
export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, limit } = req.query as unknown as FollowQuery;

  const result = await followService.getFollowers(userId, page, limit);
  const validatedResponse = followListApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * GET /api/v1/users/:userId/following
 * 取得某用戶正在關注的用戶列表
 */
export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, limit } = req.query as unknown as FollowQuery;

  const result = await followService.getFollowing(userId, page, limit);
  const validatedResponse = followListApiResponseSchema.parse(result);
  res.json(validatedResponse);
});
