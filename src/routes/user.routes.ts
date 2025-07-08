/**
 * 用戶路由
 * 定義用戶管理相關的 API 路由
 */

import { Router, RequestHandler } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { 
  canCreateUser,
  canUpdateUser,
  canDeleteUser,
  requireAdmin
} from '../middleware/permission.middleware';
import { validate } from '../validators/validation.middleware';
import { 
  createUserSchema,
  updateUserSchema,
  getUserParamsSchema,
  getUserQuerySchema
} from '../validators/user.validators';

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
  canCreateUser(),
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