/**
 * 用戶路由
 * 定義用戶管理相關的 API 路由
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { userController } from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  canUpdateUser,
  // canDeleteUser,
  requireAdmin
} from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import upload from '../middleware/multer.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserParamsSchema,
  getUserQuerySchema,
  userSuccessResponseSchema,
  usersListResponseSchema,
  createUserResponseSchema,
  updateUserResponseSchema,
  deleteUserResponseSchema,
  customIdAvailabilityResponseSchema,
  setCustomIdResponseSchema,
  removeCustomIdResponseSchema,
  userPreferencesResponseSchema,
  updateUserPreferencesResponseSchema,
  availablePreferencesResponseSchema,
  loginHistoryResponseSchema,
  userActivityStatsResponseSchema,
  loginHistoryQuerySchema
} from '../validators/user.validators';
import {
  customIdSchema,
  customIdParamsSchema
} from '../validators/user-custom-id.validators';
import {
  preferencesQuerySchema,
  updatePreferencesSchema
} from '../validators/me.validators';
import { userFollowRouter } from './follow.routes';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/users - 獲取用戶列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: '獲取用戶列表',
  description: '獲取所有用戶列表，支援分頁、過濾和搜尋。支援可選身份驗證以提供個人化內容。',
  request: {
    query: getUserQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取用戶列表',
      content: {
        'application/json': {
          schema: usersListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * GET /api/v1/users/me - 獲取當前用戶資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me',
  tags: ['Me'],
  summary: '獲取當前用戶資訊',
  description: '獲取當前已登入用戶的完整資料',
  responses: {
    200: {
      description: '成功獲取用戶資料',
      content: {
        'application/json': {
          schema: userSuccessResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * POST /api/v1/users/me - 創建新用戶
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/users/me',
  tags: ['Me'],
  summary: '創建新用戶（當前用戶）',
  description: '創建一個新的用戶帳號（與 POST /users 功能相同）',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '用戶創建成功',
      content: {
        'application/json': {
          schema: createUserResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /users/me
 * 創建新用戶（與 POST /users 功能相同）
 * 請求體：CreateUserRequest
 * 需要身份驗證和創建用戶權限（允許臨時用戶）
 */
router.post('/me',
  authenticate,
  upload.single('avatar'),
  validate(createUserSchema, 'body'),
  userController.createUser as RequestHandler
);

/**
 * PUT /api/v1/users/me - 更新當前用戶資訊
 * 支援 multipart/form-data 以統一處理頭像上傳和表單資料
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/users/me',
  tags: ['Me'],
  summary: '更新當前用戶資訊',
  description: '更新已登入用戶的個人資料。支援 multipart/form-data 格式，可同時上傳頭像檔案。',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              avatar: {
                type: 'string',
                format: 'binary',
                description: '新頭像圖片（JPEG、PNG 或 WebP 格式，最大 500KB）'
              },
              name: { type: 'string', description: '使用者姓名' },
              gender: { type: 'string', enum: ['male', 'female', 'other'], description: '性別' },
              birthDay: { type: 'string', description: '出生日期 (YYYY-MM-DD)' },
              location: { type: 'string', description: '地區代碼' },
              educationStage: { type: 'string', description: '教育階段' },
              isOpenLocation: { type: 'boolean', description: '是否公開位置資訊' },
              isOpenProfile: { type: 'boolean', description: '是否公開個人資料' },
              isSubscribeEmail: { type: 'boolean', description: '是否訂閱電子郵件' },
              selfIntroduction: { type: 'string', description: '自我介紹' },
              share: { type: 'string', description: '分享內容' },
              wantToDoList: { type: 'string', description: '想做的事情清單 (JSON 字串)' },
              tagList: { type: 'string', description: '標籤清單 (JSON 字串)' },
              roleList: { type: 'string', description: '角色清單 (JSON 字串)' },
              interestList: { type: 'string', description: '興趣清單 (JSON 字串)' },
              preferences: { type: 'string', description: '偏好設定 (JSON 字串)' },
              contactList: { type: 'string', description: '聯絡資訊 (JSON 字串)' },
              professionalField: { type: 'string', description: '專業領域 (JSON 字串)' },
              personalSlogan: { type: 'string', description: '個人標語' },
              referralSource: { type: 'string', description: '資訊來源' },
              customId: { type: 'string', description: '自訂 ID' }
            }
          }
        },
        'application/json': {
          schema: updateUserSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '用戶資料更新成功',
      content: {
        'application/json': {
          schema: updateUserResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /users/me
 * 更新當前用戶資訊
 * 支援 multipart/form-data（含 avatar 檔案）或 application/json
 * 需要身份驗證
 */
router.put('/me',
  authenticate,
  upload.single('avatar'),
  userController.updateMe as RequestHandler
);

/**
 * GET /api/v1/users/custom-id/check/{customId} - 檢查自訂 ID 可用性
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/custom-id/check/{customId}',
  tags: ['Users'],
  summary: '檢查自訂 ID 可用性',
  description: '檢查指定的自訂 ID 是否可用',
  request: {
    params: z.object({
      customId: z.string().openapi({
        description: '要檢查的自訂 ID',
        example: 'my_custom_id'
      })
    }).openapi({
      description: '檢查自訂 ID 可用性的路徑參數'
    })
  },
  responses: {
    200: {
      description: '成功檢查可用性',
      content: {
        'application/json': {
          schema: customIdAvailabilityResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * GET /api/v1/users/custom-id/{customId} - 透過自訂 ID 獲取用戶資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/custom-id/{customId}',
  tags: ['Users'],
  summary: '透過自訂 ID 獲取用戶',
  description: '使用自訂 ID 查詢用戶資訊',
  request: {
    params: z.object({
      customId: z.string().openapi({
        description: '用戶自訂 ID',
        example: 'my_custom_id'
      })
    }).openapi({
      description: '透過自訂 ID 獲取用戶的路徑參數'
    })
  },
  responses: {
    200: {
      description: '成功獲取用戶資料',
      content: {
        'application/json': {
          schema: userSuccessResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * POST /api/v1/users/me/custom-id - 設置自訂 ID
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/users/me/custom-id',
  tags: ['Me'],
  summary: '設置當前用戶的自訂 ID',
  description: '為當前用戶設置一個唯一的自訂 ID',
  request: {
    body: {
      content: {
        'application/json': {
          schema: customIdSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '自訂 ID 設置成功',
      content: {
        'application/json': {
          schema: setCustomIdResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    409: {
      description: '自訂 ID 已被使用',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          }).openapi({
            description: '自訂 ID 衝突錯誤響應'
          })
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * DELETE /api/v1/users/me/custom-id - 移除自訂 ID
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/users/me/custom-id',
  tags: ['Me'],
  summary: '移除當前用戶的自訂 ID',
  description: '刪除當前用戶的自訂 ID',
  responses: {
    200: {
      description: '自訂 ID 已成功移除',
      content: {
        'application/json': {
          schema: removeCustomIdResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * GET /api/v1/users/me/preferences - 獲取用戶偏好設定
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me/preferences',
  tags: ['Me'],
  summary: '獲取當前用戶的偏好設定',
  description: '獲取當前用戶的所有偏好設定',
  request: {
    query: preferencesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取偏好設定',
      content: {
        'application/json': {
          schema: userPreferencesResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * PUT /api/v1/users/me/preferences - 更新用戶偏好設定
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/users/me/preferences',
  tags: ['Me'],
  summary: '更新當前用戶的偏好設定',
  description: '更新當前用戶的偏好設定選項',
  request: {
    body: {
      content: {
        'application/json': {
          schema: updatePreferencesSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '偏好設定更新成功',
      content: {
        'application/json': {
          schema: updateUserPreferencesResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * GET /api/v1/users/me/login-history - 獲取當前用戶的登入歷史
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me/login-history',
  tags: ['Me'],
  summary: '獲取當前用戶的登入歷史',
  description: '獲取當前用戶的登入歷史記錄，包含裝置和時間資訊',
  request: {
    query: loginHistoryQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取登入歷史',
      content: {
        'application/json': {
          schema: loginHistoryResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /users/me/login-history
 * 獲取當前用戶的登入歷史
 * 查詢參數：limit - 限制返回數量（預設 10）
 * 需要身份驗證
 */
router.get('/me/login-history',
  authenticate,
  validate(loginHistoryQuerySchema, 'query'),
  userController.getLoginHistory as RequestHandler
);

/**
 * GET /api/v1/users/me/activity-stats - 獲取當前用戶的活躍統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me/activity-stats',
  tags: ['Me'],
  summary: '獲取當前用戶的活躍統計',
  description: '獲取當前用戶的活躍狀態統計，包含登入次數、最後活動時間等',
  responses: {
    200: {
      description: '成功獲取活躍統計',
      content: {
        'application/json': {
          schema: userActivityStatsResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /users/me/activity-stats
 * 獲取當前用戶的活躍統計
 * 需要身份驗證
 */
router.get('/me/activity-stats',
  authenticate,
  userController.getActivityStats as RequestHandler
);

/**
 * GET /api/v1/users/settings-summary - 獲取設定頁完整度摘要
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/settings-summary',
  tags: ['Me'],
  summary: '獲取設定頁完整度摘要',
  description: '回傳用戶個人設定的完整度，包含 onboarding、偏好、帳號、公開資訊四個區塊的完成狀態',
  responses: {
    200: {
      description: '成功獲取設定完整度',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              completed: z.number(),
              total: z.number(),
              sections: z.object({
                onboarding: z.boolean(),
                preferences: z.boolean(),
                account: z.boolean(),
                publicInfo: z.boolean()
              })
            }),
            timestamp: z.string()
          })
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /users/settings-summary
 * 獲取設定頁完整度摘要
 * 需要身份驗證
 */
router.get('/settings-summary',
  authenticate,
  userController.getSettingsSummary as RequestHandler
);

/**
 * GET /api/v1/users/preferences/available - 獲取所有可用的偏好選項
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/preferences/available',
  tags: ['Users'],
  summary: '獲取所有可用的偏好選項',
  description: '獲取系統中所有可用的偏好類型和選項（公開 API）',
  responses: {
    200: {
      description: '成功獲取可用偏好選項',
      content: {
        'application/json': {
          schema: availablePreferencesResponseSchema
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /users/preferences/available
 * 獲取所有可用的偏好選項
 * 公開API，無需驗證
 */
router.get('/preferences/available',
  userController.getAvailablePreferences as RequestHandler
);

/**
 * GET /api/v1/users/profile/{identifier} - 取得 Profile 聚合資料
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/profile/{identifier}',
  tags: ['Users'],
  summary: '取得 Profile 聚合資料',
  description: '根據 custom_id 或 external_id 取得用戶 Profile 聚合資訊，包含近期實踐數、共同 circle 數等。無需登入，但帶 JWT 可取得 commonCirclesCount。',
  request: {
    params: z.object({
      identifier: z.string().openapi({
        description: '用戶 custom_id 或 external_id（UUID）',
        example: 'my_custom_id'
      })
    }).openapi({
      description: 'Profile 查詢路徑參數'
    })
  },
  responses: {
    200: {
      description: '成功取得 Profile 聚合資料',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              id: z.string(),
              name: z.string().nullable(),
              customId: z.string().nullable(),
              photoURL: z.string().nullable(),
              headline: z.string().nullable(),
              educationStage: z.string().nullable(),
              recentPracticeCount: z.number(),
              commonCirclesCount: z.number().nullable(),
              hideConnectionsCount: z.boolean(),
              connectionsCount: z.number().nullable(),
              contactList: z.object({
                instagram: z.string().nullable(),
                discord: z.string().nullable(),
                line: z.string().nullable(),
                facebook: z.string().nullable(),
                threads: z.string().nullable(),
                linkedin: z.string().nullable(),
                github: z.string().nullable(),
                website: z.string().nullable()
              })
            }),
            timestamp: z.string()
          })
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /users/profile/:identifier
 * 取得 Profile 聚合資料
 * 路徑參數：identifier - 用戶 custom_id 或 external_id
 * 無需強制登入，但若帶 JWT 則解析 viewerId
 */
router.get('/profile/:identifier',
  optionalAuth,
  userController.getUserProfile as RequestHandler
);

/**
 * GET /api/v1/users/{id} - 獲取指定用戶資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: '獲取指定用戶資訊',
  description: '根據用戶 UUID 獲取用戶詳細資訊',
  request: {
    params: getUserParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取用戶資料',
      content: {
        'application/json': {
          schema: userSuccessResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * POST /api/v1/users - 創建新用戶
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: '創建新用戶',
  description: '創建一個新的用戶帳號',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '用戶創建成功',
      content: {
        'application/json': {
          schema: createUserResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * PUT /api/v1/users/{id} - 更新用戶資訊
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: '更新用戶資訊',
  description: '更新指定用戶的資料（需要權限或本人修改）',
  request: {
    params: getUserParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '用戶資料更新成功',
      content: {
        'application/json': {
          schema: updateUserResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * DELETE /api/v1/users/me - 刪除當前用戶
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/users/me',
  tags: ['Me'],
  summary: '刪除當前用戶',
  description: '完全刪除當前用戶帳號及所有關聯資料，同時清除 OAuth 臨時用戶記錄以允許重新註冊。呼叫後會自動登出。',
  responses: {
    200: {
      description: '用戶已成功刪除',
      content: {
        'application/json': {
          schema: deleteUserResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * DELETE /api/v1/users/{id} - 刪除指定用戶（管理員功能）
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: '刪除指定用戶（管理員）',
  description: '刪除指定用戶的帳號（僅限管理員）',
  request: {
    params: z.object({
      id: z.string().openapi({
        description: '用戶 ID（數字）',
        example: '123'
      })
    }).openapi({
      description: '刪除用戶的路徑參數'
    })
  },
  responses: {
    200: {
      description: '用戶已成功刪除',
      content: {
        'application/json': {
          schema: deleteUserResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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

// ============================================================================
// 關注子路由
// ============================================================================

router.use('/', userFollowRouter);

// ============================================================================
// Express 路由定義完成
// ============================================================================

export default router;
