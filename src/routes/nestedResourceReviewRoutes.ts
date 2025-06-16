/**
 * 巢狀資源心得評價路由
 * 處理 /resources/:resourceId/reviews 的巢狀路由
 */

import { Router, RequestHandler } from 'express';
import resourceReviewController from '@/controllers/resourceReviewController';
import { validate } from '@/validators/validation.middleware';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import { 
  resourceReviewSchema, 
  updateResourceReviewSchema, 
  updateReviewStatusSchema 
} from '@/validators/resourceReview.validator';
import { 
  paginationSchema 
} from '@/validators/requestParams.validator';

// 使用 mergeParams: true 來合併父路由的參數
const router = Router({ mergeParams: true });

/**
 * GET /resources/:resourceId/reviews
 * 獲取特定資源的心得評價列表
 * 路徑參數：resourceId - 資源 ID
 * 查詢參數：cursor, limit, sortField, sortDirection
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/', 
  optionalAuth,
  validate(paginationSchema, 'query'),
  resourceReviewController.getReviewsByResource);

/**
 * GET /resources/:resourceId/reviews/:id
 * 獲取特定資源的特定心得評價詳情
 * 路徑參數：resourceId - 資源 ID, id - 心得評價 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id', 
  optionalAuth,
  resourceReviewController.getReviewById as RequestHandler);

/**
 * POST /resources/:resourceId/reviews
 * 為特定資源創建心得評價
 * 路徑參數：resourceId - 資源 ID
 * 請求體：CreateResourceReviewDto
 * 需要身份驗證
 */
router.post('/', 
  authenticate,
  validate(resourceReviewSchema, 'body'),
  resourceReviewController.createReview as RequestHandler
);

/**
 * PATCH /resources/:resourceId/reviews/:id
 * 更新特定資源的心得評價
 * 路徑參數：resourceId - 資源 ID, id - 心得評價 ID
 * 請求體：UpdateResourceReviewDto
 * 需要身份驗證和權限檢查
 */
router.patch('/:id',
  authenticate,
  validate(updateResourceReviewSchema, 'body'),
  resourceReviewController.updateReview as RequestHandler
);

/**
 * PATCH /resources/:resourceId/reviews/:id/status
 * 更新特定資源的心得評價狀態
 * 路徑參數：resourceId - 資源 ID, id - 心得評價 ID
 * 請求體：{ status: string }
 * 需要身份驗證和權限檢查
 */
router.patch('/:id/status',
  authenticate,
  validate(updateReviewStatusSchema, 'body'),
  resourceReviewController.updateReviewStatus as RequestHandler
);

/**
 * DELETE /resources/:resourceId/reviews/:id
 * 刪除特定資源的心得評價（軟刪除）
 * 路徑參數：resourceId - 資源 ID, id - 心得評價 ID
 * 需要身份驗證和權限檢查
 */
router.delete('/:id',
  authenticate,
  resourceReviewController.deleteReview as RequestHandler
);

/**
 * POST /resources/:resourceId/reviews/:id/like
 * 點讚特定資源的心得評價
 * 路徑參數：resourceId - 資源 ID, id - 心得評價 ID
 * 需要身份驗證
 */
router.post('/:id/like',
  authenticate,
  resourceReviewController.likeReview as RequestHandler
);

/**
 * DELETE /resources/:resourceId/reviews/:id/like
 * 取消點讚特定資源的心得評價
 * 路徑參數：resourceId - 資源 ID, id - 心得評價 ID
 * 需要身份驗證
 */
router.delete('/:id/like',
  authenticate,
  resourceReviewController.unlikeReview as RequestHandler
);

export default router;