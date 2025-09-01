/**
 * Review Controller
 * 覆盤控制器 - 處理覆盤相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { HTTP_STATUS } from '../constants/index';
import { 
  asyncHandler,
  UnauthorizedError,
  BadRequestError
} from '../middleware/error.middleware';
import type { 
  ReviewCreateRequest,
  ReviewUpdateRequest
} from '../types/review.types';
import type { UserJwtPayload } from '../types/auth.types';

/**
 * 創建覆盤
 * POST /api/v1/projects/:projectId/reviews
 */
export const createReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId } = req.params;
  const reviewData: ReviewCreateRequest = req.body;
  
  const result = await reviewService.createReview(
    projectId,
    user.id,
    reviewData
  );

  res.status(HTTP_STATUS.CREATED).json(result);
});

/**
 * 獲取專案的覆盤列表
 * GET /api/v1/projects/:projectId/reviews
 */
export const getReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const result = await reviewService.getReviews(projectId);

  res.json(result);
});

/**
 * 獲取覆盤詳情
 * GET /api/v1/projects/:projectId/reviews/:reviewId
 */
export const getReviewDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId);

  if (isNaN(reviewIdNum)) {
    throw new BadRequestError('無效的覆盤ID');
  }

  const result = await reviewService.getReviewDetail(projectId, reviewIdNum);

  res.json(result);
});

/**
 * 更新覆盤
 * PUT /api/v1/projects/:projectId/reviews/:reviewId
 */
export const updateReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId);
  const updateData: ReviewUpdateRequest = req.body;

  if (isNaN(reviewIdNum)) {
    throw new BadRequestError('無效的覆盤ID');
  }

  const result = await reviewService.updateReview(
    projectId,
    reviewIdNum,
    updateData
  );

  res.json(result);
});

/**
 * 刪除覆盤
 * DELETE /api/v1/projects/:projectId/reviews/:reviewId
 */
export const deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId);

  if (isNaN(reviewIdNum)) {
    throw new BadRequestError('無效的覆盤ID');
  }

  const result = await reviewService.deleteReview(projectId, reviewIdNum);

  res.json(result);
});

/**
 * 獲取用戶覆盤統計
 * GET /api/v1/reviews/stats
 */
export const getReviewStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const result = await reviewService.getReviewStats(user.id);

  res.json(result);
});