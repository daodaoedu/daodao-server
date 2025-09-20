/**
 * 用戶路由
 * 定義用戶管理相關的 API 路由
 */

import { Router, RequestHandler } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  canUpdateUser,
  // canDeleteUser,
  requireAdmin
} from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserParamsSchema,
  getUserQuerySchema
} from '../validators/user.validators';
import {
  customIdSchema,
  customIdParamsSchema
} from '../validators/user-custom-id.validators';
import {
  preferencesQuerySchema,
  updatePreferencesSchema
} from '../validators/me.validators';

const router = Router();

/**
 * GET /users
 * 獲取用戶列表
 * 查詢參數：page, pageSize, educationStage, roleList, location, search
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(getUserQuerySchema, 'query'),
  userController.getAllUsers as RequestHandler
);

/**
 * GET /users/me
 * 獲取當前用戶資訊
 * 需要身份驗證
 */
router.get('/me',
  authenticate,
  userController.getMe as RequestHandler
);

/**
 * GET /users/custom-id/check/:customId
 * 檢查自訂 ID 可用性
 * 路徑參數：customId - 要檢查的自訂 ID
 */
router.get('/custom-id/check/:customId',
  validate(customIdParamsSchema, 'params'),
  userController.checkCustomIdAvailability as RequestHandler
);

/**
 * GET /users/custom-id/:customId
 * 透過自訂 ID 獲取用戶資訊
 * 路徑參數：customId - 用戶自訂 ID
 */
router.get('/custom-id/:customId',
  validate(customIdParamsSchema, 'params'),
  userController.getUserByCustomId as RequestHandler
);

/**
 * POST /users/me/custom-id
 * 設置當前用戶的自訂 ID
 * 請求體：{ customId: string }
 * 需要身份驗證
 */
router.post('/me/custom-id',
  authenticate,
  validate(customIdSchema, 'body'),
  userController.setCustomId as RequestHandler
);

/**
 * DELETE /users/me/custom-id
 * 移除當前用戶的自訂 ID
 * 需要身份驗證
 */
router.delete('/me/custom-id',
  authenticate,
  userController.removeCustomId as RequestHandler
);

/**
 * GET /users/me/preferences
 * 獲取當前用戶的偏好設定
 * 查詢參數：category, includeSystem
 * 需要身份驗證
 */
router.get('/me/preferences',
  authenticate,
  validate(preferencesQuerySchema, 'query'),
  userController.getUserPreferences as RequestHandler
);

/**
 * PUT /users/me/preferences
 * 更新當前用戶的偏好設定
 * 請求體：preferences array with preferenceTypeId, optionId, isSelected, weight
 * 需要身份驗證
 */
router.put('/me/preferences',
  authenticate,
  validate(updatePreferencesSchema, 'body'),
  userController.updateUserPreferences as RequestHandler
);

/**
 * GET /users/preferences/available
 * 獲取所有可用的偏好選項
 * 公開API，無需驗證
 */
router.get('/preferences/available',
  userController.getAvailablePreferences as RequestHandler
);

/**
 * GET /users/:id
 * 獲取指定用戶資訊
 * 路徑參數：id - 用戶 external_id
 */
router.get('/:id',
  validate(getUserParamsSchema, 'params'),
  userController.getOneUser as RequestHandler
);

/**
 * POST /users
 * 創建新用戶
 * 請求體：CreateUserRequest
 * 需要身份驗證和創建用戶權限（允許臨時用戶）
 */
router.post('/',
  authenticate,
  // canCreateUser(),
  validate(createUserSchema, 'body'),
  userController.createUser as RequestHandler
);

/**
 * PUT /users/:id
 * 更新用戶資訊
 * 路徑參數：id - 用戶 external_id
 * 請求體：UpdateUserRequest
 * 需要身份驗證和更新用戶權限或本人修改
 */
router.put('/:id',
  authenticate,
  canUpdateUser(),
  validate(getUserParamsSchema, 'params'),
  validate(updateUserSchema, 'body'),
  userController.updateUser as RequestHandler
);

/**
 * DELETE /users/me
 * 刪除當前用戶
 * 需要身份驗證
 */
router.delete('/me',
  authenticate,
  userController.deleteMe as RequestHandler
);

/**
 * DELETE /users/:id
 * 刪除指定用戶（管理員功能）
 * 路徑參數：id - 用戶 ID (數字)
 * 需要身份驗證和管理員權限
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  userController.deleteUser as RequestHandler
);

export default router;