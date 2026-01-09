/**
 * 資源心得評價控制器
 * 處理心得評價相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { BadRequestError } from '@/middleware/error.middleware';
import resourceReviewService from '@/services/resource-review.service';
import tagService from '@/services/tag.service';
import type { tags } from '../../generated/prisma';
import {
  validateCreateResourceReview,
  validateUpdateResourceReview,
  validateUpdateReviewStatus,
  validateGetReviewByIdResponse,
  validateGetReviewsListResponse,
  validateCreateReviewResponse,
  validateUpdateReviewResponse,
  validateDeleteReviewResponse,
  validateLikeReviewResponse,
  validateGetReviewTagsResponse
} from '@/validators/resource-review.validator';

/**
 * 獲取特定資源的心得評價列表
 * GET /resources/:resourceId/reviews
 */
export const getReviewsByResource = asyncHandler(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const {
    cursor,
    limit,
    tags,
    sort,
    order,
    minScore,
    maxScore
  } = req.query;

  // 處理過濾條件
  const filters: Record<string, unknown> = {
    resourceId: resourceId, // resourceId 是 UUID 字串
    status: 'published' // 預設只獲取已發布的評價
  };

  // 處理標籤過濾
  if (tags) {
    filters.tags = (tags as string).split(',').map(tag => tag.trim());
  }

  // 處理評分過濾
  if (minScore) filters.minScore = parseFloat(minScore as string);
  if (maxScore) filters.maxScore = parseFloat(maxScore as string);

  // 處理分頁和排序
  const pagination: Record<string, unknown> = {};
  if (cursor) pagination.cursor = cursor as string;
  if (limit) pagination.limit = parseInt(limit as string, 10);
  if (sort) pagination.sort = sort as string;
  if (order) pagination.order = order as string;

  // 查詢心得評價列表
  const result = await resourceReviewService.getReviews(filters, pagination);

  // 驗證並回傳回應
  const validatedResult = validateGetReviewsListResponse(result);
  res.json(validatedResult);
});

/**
 * 獲取使用者的心得評價列表
 * GET /users/:userId/reviews
 */
export const getReviewsByUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const {
    cursor,
    limit,
    tags,
    sort,
    order
  } = req.query;

  // 處理過濾條件
  const filters: Record<string, unknown> = {
    userId: parseInt(userId, 10)
  };

  // 如果是當前用戶，可以獲取所有狀態的評價，否則只獲取已發布的評價
  if (req.user?.id !== parseInt(userId, 10)) {
    filters.status = 'published';
  }

  // 處理標籤過濾
  if (tags) {
    filters.tags = (tags as string).split(',').map(tag => tag.trim());
  }

  // 處理分頁和排序
  const pagination: Record<string, unknown> = {};
  if (cursor) pagination.cursor = cursor as string;
  if (limit) pagination.limit = parseInt(limit as string, 10);
  if (sort) pagination.sort = sort as string;
  if (order) pagination.order = order as string;

  // 查詢心得評價列表
  const result = await resourceReviewService.getReviews(filters, pagination);

  // 驗證並回傳回應
  const validatedResult = validateGetReviewsListResponse(result);
  res.json(validatedResult);
});

/**
 * 獲取單個心得評價
 * GET /reviews/:id
 */
export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  // 查詢心得評價
  const review = await resourceReviewService.getReviewById(parseInt(reviewId, 10));

  // 驗證並回傳回應
  const validatedReview = validateGetReviewByIdResponse(review);
  res.json(validatedReview);
});

/**
 * 創建心得評價
 * POST /resources/:resourceId/reviews
 */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能創建心得評價');
  }

  // 驗證請求數據
  const validatedData = validateCreateResourceReview(req.body);

  // 創建心得評價
  const review = await resourceReviewService.createReview(
    resourceId,
    validatedData,
    userId
  );

  // 驗證並回傳回應
  const validatedReview = validateCreateReviewResponse(review);
  res.status(201).json(validatedReview);
});

/**
 * 更新心得評價
 * PATCH /reviews/:id
 */
export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能更新心得評價');
  }

  // 驗證請求數據
  const validatedData = validateUpdateResourceReview(req.body);

  // 更新心得評價
  const review = await resourceReviewService.updateReview(
    parseInt(reviewId, 10),
    validatedData,
    userId
  );

  // 驗證並回傳回應
  const validatedReview = validateUpdateReviewResponse(review);
  res.json(validatedReview);
});

/**
 * 更新心得評價狀態
 * PATCH /reviews/:id/status
 */
export const updateReviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能更新心得評價狀態');
  }

  // 驗證請求數據
  const { status } = validateUpdateReviewStatus(req.body);

  // 更新心得評價狀態
  const review = await resourceReviewService.updateReviewStatus(
    parseInt(reviewId, 10),
    status,
    userId
  );

  // 驗證並回傳回應
  const validatedReview = validateUpdateReviewResponse(review);
  res.json(validatedReview);
});

/**
 * 刪除心得評價
 * DELETE /reviews/:id
 */
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能刪除心得評價');
  }

  // 刪除心得評價
  const result = await resourceReviewService.deleteReview(parseInt(reviewId, 10), userId);

  // 驗證並回傳回應
  const validatedResult = validateDeleteReviewResponse(result);
  res.json(validatedResult);
});

/**
 * 點讚心得評價
 * POST /reviews/:id/like
 */
export const likeReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能點讚心得評價');
  }

  // 點讚心得評價
  const result = await resourceReviewService.toggleLikeReview(parseInt(reviewId, 10));

  // 驗證並回傳回應
  const validatedResult = validateLikeReviewResponse(result);
  res.json(validatedResult);
});

/**
 * 取消點讚心得評價
 * DELETE /reviews/:id/like
 */
export const unlikeReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能取消點讚心得評價');
  }

  // 取消點讚心得評價
  const result = await resourceReviewService.toggleLikeReview(parseInt(reviewId, 10));

  // 驗證並回傳回應
  const validatedResult = validateLikeReviewResponse(result);
  res.json(validatedResult);
});

/**
 * 獲取心得評價標籤
 * GET /reviews/:id/tags
 */
export const getReviewTags = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  
  // 獲取心得評價標籤 - reviewId 是數字 ID 的字串形式
  const tags = await tagService.getEntityTags('resource_review', parseInt(reviewId, 10));

  // 構建回應資料
  const response = {
    success: true,
    data: tags.map((tag: tags) => tag.name),
    timestamp: new Date().toISOString()
  };

  // 驗證並回傳回應
  const validatedResponse = validateGetReviewTagsResponse(response);
  res.json(validatedResponse);
});

/**
 * 獲取心得評價列表（通用）
 * GET /reviews
 */
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const {
    cursor,
    limit,
    tags,
    sort,
    order,
    status,
    minScore,
    maxScore
  } = req.query;

  // 處理過濾條件
  const filters: Record<string, unknown> = {};

  if (status) filters.status = status as string;
  if (minScore) filters.minScore = parseFloat(minScore as string);
  if (maxScore) filters.maxScore = parseFloat(maxScore as string);

  // 處理標籤過濾
  if (tags) {
    filters.tags = (tags as string).split(',').map(tag => tag.trim());
  }

  // 處理分頁和排序
  const pagination: Record<string, unknown> = {};
  if (cursor) pagination.cursor = cursor as string;
  if (limit) pagination.limit = parseInt(limit as string, 10);
  if (sort) pagination.sort = sort as string;
  if (order) pagination.order = order as string;

  // 查詢心得評價列表
  const result = await resourceReviewService.getReviews(filters, pagination);

  // 驗證並回傳回應
  const validatedResult = validateGetReviewsListResponse(result);
  res.json(validatedResult);
});

// 導出所有控制器函數
export default {
  getReviewsByResource,
  getReviewsByUser,
  getReviewById,
  createReview,
  updateReview,
  updateReviewStatus,
  deleteReview,
  likeReview,
  unlikeReview,
  getReviewTags,
  getReviews
};
