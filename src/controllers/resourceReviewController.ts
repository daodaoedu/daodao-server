/**
 * 資源心得評價控制器
 * 處理心得評價相關的 HTTP 請求
 */

/// <reference path="../types/declarations/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { asyncWrapper, BadRequestError } from '@/utils/errorHandler';
import resourceReviewService from '@/services/resourceReviewService';
import tagService from '@/services/tagService';
import { TagAttributes } from '@/models/tag';
import { 
  validateCreateResourceReview, 
  validateUpdateResourceReview, 
  validateUpdateReviewStatus 
} from '@/validators/resourceReview.validator';

/**
 * 獲取特定資源的心得評價列表
 * GET /resources/:resourceId/reviews
 */
export const getReviewsByResource = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const { resourceId } = req.params;
  const { 
    cursor, 
    limit, 
    tags, 
    sortField,
    sortDirection
  } = req.query;

  // 處理過濾條件
  const filters: any = {
    resourceId: parseInt(resourceId, 10),
    status: 'published' // 預設只獲取已發布的評價
  };

  // 處理標籤過濾
  if (tags) {
    filters.tags = (tags as string).split(',').map(tag => tag.trim());
  }

  // 處理分頁和排序
  const pagination: any = {};
  if (cursor) pagination.cursor = cursor as string;
  if (limit) pagination.limit = parseInt(limit as string, 10);
  if (sortField) pagination.sortField = sortField as string;
  if (sortDirection) pagination.sortDirection = sortDirection as string;

  // 查詢心得評價列表
  const result = await resourceReviewService.getReviews(filters, pagination);

  // 返回結果
  res.json({
    success: true,
    data: result
  });
});

/**
 * 獲取使用者的心得評價列表
 * GET /users/:userId/reviews
 */
export const getReviewsByUser = asyncWrapper(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { 
    cursor, 
    limit, 
    tags, 
    sortField,
    sortDirection
  } = req.query;

  // 處理過濾條件
  const filters: any = {
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
  const pagination: any = {};
  if (cursor) pagination.cursor = cursor as string;
  if (limit) pagination.limit = parseInt(limit as string, 10);
  if (sortField) pagination.sortField = sortField as string;
  if (sortDirection) pagination.sortDirection = sortDirection as string;

  // 查詢心得評價列表
  const result = await resourceReviewService.getReviews(filters, pagination);

  // 返回結果
  res.json({
    success: true,
    data: result
  });
});

/**
 * 獲取單個心得評價
 * GET /reviews/:id
 */
export const getReviewById = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // 查詢心得評價
  const review = await resourceReviewService.getReviewById(parseInt(id, 10));

  // 返回結果
  res.json({
    success: true,
    data: review
  });
});

/**
 * 創建心得評價
 * POST /resources/:resourceId/reviews
 */
export const createReview = asyncWrapper(async (req: Request, res: Response) => {
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
    parseInt(resourceId, 10),
    validatedData,
    userId
  );

  // 返回結果
  res.status(201).json({
    success: true,
    data: review
  });
});

/**
 * 更新心得評價
 * PATCH /reviews/:id
 */
export const updateReview = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能更新心得評價');
  }

  // 驗證請求數據
  const validatedData = validateUpdateResourceReview(req.body);

  // 更新心得評價
  const review = await resourceReviewService.updateReview(
    parseInt(id, 10),
    validatedData,
    userId
  );

  // 返回結果
  res.json({
    success: true,
    data: review
  });
});

/**
 * 更新心得評價狀態
 * PATCH /reviews/:id/status
 */
export const updateReviewStatus = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能更新心得評價狀態');
  }

  // 驗證請求數據
  const { status } = validateUpdateReviewStatus(req.body);

  // 更新心得評價狀態
  const review = await resourceReviewService.updateReviewStatus(
    parseInt(id, 10),
    status,
    userId
  );

  // 返回結果
  res.json({
    success: true,
    data: review
  });
});

/**
 * 刪除心得評價
 * DELETE /reviews/:id
 */
export const deleteReview = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能刪除心得評價');
  }

  // 刪除心得評價
  await resourceReviewService.deleteReview(parseInt(id, 10), userId);

  // 返回結果
  res.json({
    success: true,
    message: '心得評價已成功刪除'
  });
});

/**
 * 點讚心得評價
 * POST /reviews/:id/like
 */
export const likeReview = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能點讚心得評價');
  }

  // 點讚心得評價
  await resourceReviewService.toggleLikeReview(parseInt(id, 10), userId, true);

  // 返回結果
  res.json({
    success: true,
    message: '已成功點讚心得評價'
  });
});

/**
 * 取消點讚心得評價
 * DELETE /reviews/:id/like
 */
export const unlikeReview = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能取消點讚心得評價');
  }

  // 取消點讚心得評價
  await resourceReviewService.toggleLikeReview(parseInt(id, 10), userId, false);

  // 返回結果
  res.json({
    success: true,
    message: '已成功取消點讚心得評價'
  });
});

/**
 * 獲取心得評價標籤
 * GET /reviews/:id/tags
 */
export const getReviewTags = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // 獲取心得評價標籤
  const tags = await tagService.getEntityTags(parseInt(id, 10), 'resource_review');

  // 返回結果
  res.json({
    success: true,
    data: tags.map(tag => {
      const tagInstance = tag as unknown as TagAttributes;
      return tagInstance.name;
    })
  });
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
  getReviewTags
};
