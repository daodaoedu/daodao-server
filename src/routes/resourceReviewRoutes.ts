/**
 * 資源心得評價路由
 * 處理資源心得評價相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import resourceReviewController from '@/controllers/resourceReviewController';
import { validate } from '@/validators/validation.middleware';
import { 
  resourceReviewSchema, 
  updateResourceReviewSchema, 
  updateReviewStatusSchema 
} from '@/validators/resourceReview.validator';
import { 
  paginationSchema, 
  reviewFilterSchema 
} from '@/validators/requestParams.validator';

const router = Router();

/**
 * GET /reviews
 * 獲取心得評價列表
 * 查詢參數：cursor, limit, resourceId, userId, tags, sortField, sortDirection
 */
router.get('/', 
  validate(paginationSchema, 'query'),
  validate(reviewFilterSchema, 'query'),
  resourceReviewController.getReviewsByResource);

/**
 * GET /reviews/:id
 * 獲取心得評價詳情
 * 路徑參數：id - 心得評價 ID
 */
router.get('/:id', resourceReviewController.getReviewById as RequestHandler);

/**
 * POST /reviews
 * 創建新心得評價
 * 請求體：CreateResourceReviewDto
 * 需要身份驗證
 */
router.post('/', 
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(resourceReviewSchema, 'body'),
  resourceReviewController.createReview as RequestHandler
);

/**
 * PATCH /reviews/:id
 * 更新心得評價
 * 路徑參數：id - 心得評價 ID
 * 請求體：UpdateResourceReviewDto
 * 需要身份驗證和權限檢查
 */
router.patch('/:id',
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(updateResourceReviewSchema, 'body'),
  resourceReviewController.updateReview as RequestHandler
);

/**
 * PATCH /reviews/:id/status
 * 更新心得評價狀態
 * 路徑參數：id - 心得評價 ID
 * 請求體：{ status: string }
 * 需要身份驗證和權限檢查
 */
router.patch('/:id/status',
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(updateReviewStatusSchema, 'body'),
  resourceReviewController.updateReviewStatus as RequestHandler
);

/**
 * DELETE /reviews/:id
 * 刪除心得評價（軟刪除）
 * 路徑參數：id - 心得評價 ID
 * 需要身份驗證和權限檢查
 */
router.delete('/:id',
  // TODO: 添加身份驗證中間件
  // authenticate,
  resourceReviewController.deleteReview as RequestHandler
);

/**
 * POST /reviews/:id/like
 * 點讚心得評價
 * 路徑參數：id - 心得評價 ID
 * 需要身份驗證
 */
router.post('/:id/like',
  // TODO: 添加身份驗證中間件
  // authenticate,
  resourceReviewController.likeReview as RequestHandler
);

/**
 * DELETE /reviews/:id/like
 * 取消點讚心得評價
 * 路徑參數：id - 心得評價 ID
 * 需要身份驗證
 */
router.delete('/:id/like',
  // TODO: 添加身份驗證中間件
  // authenticate,
  resourceReviewController.unlikeReview as RequestHandler
);

/**
 * GET /reviews/:id/tags
 * 獲取心得評價標籤
 * 路徑參數：id - 心得評價 ID
 */
router.get('/:id/tags', resourceReviewController.getReviewTags as RequestHandler);

export default router;