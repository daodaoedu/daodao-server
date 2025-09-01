/**
 * Outcome Routes
 * 成果路由配置
 */

import { Router } from 'express';
import {
  createOutcome,
  getOutcomes,
  getMyOutcomes,
  getOutcomeDetail,
  updateOutcome,
  getPublicOutcomes,
  deleteOutcome
} from '../controllers/outcome.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import {
  createOutcomeSchema,
  updateOutcomeSchema,
  outcomeParamsSchema,
  outcomeProjectParamsSchema,
  publicOutcomesQuerySchema
} from '../validators/outcome.validators';

const router = Router();

/**
 * 成果相關路由
 */

// 獲取公開成果列表（分頁）
router.get(
  '/public',
  validateRequest(publicOutcomesQuerySchema, 'query'),
  getPublicOutcomes
);

// 獲取用戶的成果列表
router.get(
  '/my',
  authenticate,
  getMyOutcomes
);

// 專案相關成果路由
// 創建成果
router.post(
  '/projects/:projectId',
  authenticate,
  validateRequest(outcomeProjectParamsSchema, 'params'),
  validateRequest(createOutcomeSchema, 'body'),
  createOutcome
);

// 獲取專案的成果列表
router.get(
  '/projects/:projectId',
  optionalAuth,
  validateRequest(outcomeProjectParamsSchema, 'params'),
  getOutcomes
);

// 獲取成果詳情
router.get(
  '/projects/:projectId/:outcomeId',
  optionalAuth,
  validateRequest(outcomeParamsSchema, 'params'),
  getOutcomeDetail
);

// 更新成果
router.put(
  '/projects/:projectId/:outcomeId',
  authenticate,
  validateRequest(outcomeParamsSchema, 'params'),
  validateRequest(updateOutcomeSchema, 'body'),
  updateOutcome
);

// 刪除成果
router.delete(
  '/projects/:projectId/:outcomeId',
  authenticate,
  validateRequest(outcomeParamsSchema, 'params'),
  deleteOutcome
);

export default router;