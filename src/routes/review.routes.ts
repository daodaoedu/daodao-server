/**
 * Review Routes
 * 覆盤路由配置
 */

import { Router } from 'express';
import {
  createReview,
  getReviews,
  getReviewDetail,
  updateReview,
  deleteReview,
  getReviewStats
} from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewParamsSchema,
  reviewQuerySchema
} from '../validators/review.validators';
import { noteProjectParamsSchema } from '../validators/note.validators';

const router = Router();

/**
 * 覆盤相關路由
 */

// 獲取用戶覆盤統計
router.get(
  '/stats',
  authenticate,
  getReviewStats
);

// 專案相關覆盤路由
// 創建覆盤
router.post(
  '/projects/:projectId',
  authenticate,
  validateRequest(noteProjectParamsSchema, 'params'),
  validateRequest(createReviewSchema, 'body'),
  createReview
);

// 獲取專案的覆盤列表
router.get(
  '/projects/:projectId',
  authenticate,
  validateRequest(noteProjectParamsSchema, 'params'),
  validateRequest(reviewQuerySchema, 'query'),
  getReviews
);

// 獲取覆盤詳情
router.get(
  '/projects/:projectId/:reviewId',
  authenticate,
  validateRequest(reviewParamsSchema, 'params'),
  getReviewDetail
);

// 更新覆盤
router.put(
  '/projects/:projectId/:reviewId',
  authenticate,
  validateRequest(reviewParamsSchema, 'params'),
  validateRequest(updateReviewSchema, 'body'),
  updateReview
);

// 刪除覆盤
router.delete(
  '/projects/:projectId/:reviewId',
  authenticate,
  validateRequest(reviewParamsSchema, 'params'),
  deleteReview
);

export default router;