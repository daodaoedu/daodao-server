/**
 * 資源心得評價巢狀路由
 * 處理 /resources/:resourceId/reviews 相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import resourceReviewController from '@/controllers/resource-review.controller';
import { validate } from '@/validators/validation.middleware';
import { authenticate, optionalAuth, requireRole } from '@/middleware/auth';
import { 
  resourceReviewSchema, 
  updateResourceReviewSchema, 
  updateReviewStatusSchema 
} from '@/validators/resource-review.validator';
import { 
  paginationSchema, 
  reviewFilterSchema 
} from '@/validators/request-params.validator';

const router = Router({ mergeParams: true });

/**
 * GET /resources/:resourceId/reviews
 * 獲取指定資源的心得評價列表
 * 路徑參數：resourceId - 資源 UUID
 * 查詢參數：cursor, limit, sort, order, status, minScore, maxScore, tags
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/', 
  optionalAuth,
  validate(paginationSchema, 'query'),
  validate(reviewFilterSchema, 'query'),
  resourceReviewController.getReviewsByResource);

/**
 * GET /resources/:resourceId/reviews/:reviewId
 * 獲取指定資源的單一心得詳細內容
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:reviewId', 
  optionalAuth,
  resourceReviewController.getReviewById as RequestHandler);

/**
 * POST /resources/:resourceId/reviews
 * 為指定資源新增心得評價
 * 路徑參數：resourceId - 資源 UUID
 * 請求體：CreateResourceReviewDto
 * 需要身份驗證
 */
router.post('/', 
  authenticate,
  validate(resourceReviewSchema, 'body'),
  resourceReviewController.createReview as RequestHandler
);

/**
 * PATCH /resources/:resourceId/reviews/:reviewId
 * 更新指定資源的心得評價
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 請求體：UpdateResourceReviewDto
 * 需要身份驗證和權限檢查
 */
router.patch('/:reviewId',
  authenticate,
  validate(updateResourceReviewSchema, 'body'),
  resourceReviewController.updateReview as RequestHandler
);

/**
 * PATCH /resources/:resourceId/reviews/:reviewId/status
 * 更新指定資源心得評價的狀態
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 請求體：{ status: string } (draft, published, archived, reported)
 * 需要身份驗證和權限檢查（管理員或評論所有者）
 */
router.patch('/:reviewId/status',
  authenticate,
  requireRole(['admin']), // 只有管理員可以更改評論狀態
  validate(updateReviewStatusSchema, 'body'),
  resourceReviewController.updateReviewStatus as RequestHandler
);

/**
 * DELETE /resources/:resourceId/reviews/:reviewId
 * 刪除指定資源的心得評價（軟刪除）
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 需要身份驗證和權限檢查
 */
router.delete('/:reviewId',
  authenticate,
  resourceReviewController.deleteReview as RequestHandler
);

/**
 * POST /resources/:resourceId/reviews/:reviewId/like
 * 對指定資源的心得評價點讚
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 需要身份驗證
 */
router.post('/:reviewId/like',
  authenticate,
  resourceReviewController.likeReview as RequestHandler
);

/**
 * DELETE /resources/:resourceId/reviews/:reviewId/like
 * 取消對指定資源心得評價的點讚
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 需要身份驗證
 */
router.delete('/:reviewId/like',
  authenticate,
  resourceReviewController.unlikeReview as RequestHandler
);

export default router;