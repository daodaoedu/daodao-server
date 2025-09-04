/**
 * 我的 API 路由
 * 處理使用者個人相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation.middleware';
import { ideaQuerySchema } from '@/validators/idea.validators';
import {
  practiceQuerySchema,
  practiceStatsQuerySchema,
  resourcesQuerySchema,
  preferencesQuerySchema,
  updatePreferencesSchema
} from '@/validators/me.validators';
import ideaController from '@/controllers/idea.controller';
import meController from '@/controllers/me.controller';
import authController from '@/controllers/auth.controller';
import userController from '@/controllers/user.controller';

const router = Router();

/**
 * GET /me/auth
 * 獲取當前用戶身份認證資訊
 * 需要身份驗證
 */
router.get('/auth',
  authenticate,
  authController.getCurrentUser as RequestHandler
);

/**
 * GET /me/users
 * 獲取當前用戶完整個人資料
 * 需要身份驗證
 */
router.get('/users',
  authenticate,
  userController.getMe as RequestHandler
);


/**
 * GET /me/ideas
 * 獲取我的想法列表
 * 查詢參數：page, limit, query, tags, status, sort, order
 * 需要身份驗證
 */
router.get('/ideas',
  authenticate,
  validate(ideaQuerySchema, 'query'),
  ideaController.getMyIdeas as RequestHandler
);

/**
 * GET /me/practices
 * 獲取我的實踐記錄
 * 查詢參數：page, limit, status, contentType, search, sortBy, sortOrder, dateFrom, dateTo
 * 需要身份驗證
 */
router.get('/practices',
  authenticate,
  validate(practiceQuerySchema, 'query'),
  meController.getMyPractices as RequestHandler
);

/**
 * GET /me/practice-stats
 * 獲取我的實踐統計
 * 查詢參數：timeRange, includeArchived
 * 需要身份驗證
 */
router.get('/practice-stats',
  authenticate,
  validate(practiceStatsQuerySchema, 'query'),
  meController.getMyPracticeStats as RequestHandler
);

/**
 * GET /me/resources
 * 獲取我的個人資源草稿
 * 查詢參數：page, limit, category, type, status, search, sortBy, sortOrder, tags
 * 需要身份驗證
 */
router.get('/resources',
  authenticate,
  validate(resourcesQuerySchema, 'query'),
  meController.getMyResources as RequestHandler
);

/**
 * GET /me/preferences
 * 獲取我的個人偏好設定
 * 查詢參數：category, includeSystem
 * 需要身份驗證
 */
router.get('/preferences',
  authenticate,
  validate(preferencesQuerySchema, 'query'),
  meController.getMyPreferences as RequestHandler
);

/**
 * PUT /me/preferences
 * 更新我的個人偏好設定
 * 請求體：preferences array with preferenceTypeId, optionId, isSelected, weight
 * 需要身份驗證
 */
router.put('/preferences',
  authenticate,
  validate(updatePreferencesSchema, 'body'),
  meController.updateMyPreferences as RequestHandler
);

export default router;