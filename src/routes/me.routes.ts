/**
 * 我的 API 路由
 * 處理使用者個人相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation.middleware';
import { ideaQuerySchema, ideasListResponseSchema } from '@/validators/idea.validators';
import {
  mePracticesQuerySchema,
  practiceStatsQuerySchema,
  resourcesQuerySchema,
  preferencesQuerySchema,
  updatePreferencesSchema,
  myFootprintsQuerySchema,
  myPracticesApiResponseSchema,
  myPracticeStatsApiResponseSchema,
  myResourcesApiResponseSchema,
  myPreferencesApiResponseSchema,
  updatePreferencesApiResponseSchema,
  myFootprintsApiResponseSchema
} from '@/validators/me.validators';
import ideaController from '@/controllers/idea.controller';
import meController from '@/controllers/me.controller';
import authController from '@/controllers/auth.controller';
import userController from '@/controllers/user.controller';
import { cohortJoinController } from '@/controllers/cohort-join.controller';
import { myCohortsResponseSchema } from '@/validators/cohort-join.validators';
import { challengeController } from '@/controllers/challenge.controller';
import { myChallengesResponseSchema } from '@/validators/challenge.validator';
import { apiSuccessResponseSchema } from '@/validators/api-response.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/me/auth - 取得當前用戶身份認證資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/auth',
  tags: ['Me'],
  summary: '取得當前用戶身份認證資訊',
  description: '取得當前登入用戶的身份驗證資訊',
  responses: {
    200: {
      description: '成功獲取身份認證資訊',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              id: z.string(),
              email: z.string().email(),
              name: z.string(),
              photoURL: z.string().nullable()
            }),
            timestamp: z.string().datetime()
          }).openapi({
            description: '身份認證資訊響應'
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
 * GET /api/v1/me/users - 取得當前用戶完整個人資料
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/users',
  tags: ['Me'],
  summary: '取得當前用戶完整個人資料',
  description: '取得當前登入用戶的完整個人資料資訊',
  responses: {
    200: {
      description: '成功獲取個人資料',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
              photoURL: z.string().nullable(),
              roleList: z.array(z.string()).optional(),
              educationStage: z.string().nullable().optional(),
              tagList: z.array(z.string()).optional(),
              selfIntroduction: z.string().nullable().optional()
            }),
            timestamp: z.string().datetime()
          }).openapi({
            description: '完整個人資料響應'
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
 * GET /api/v1/me/ideas - 取得我的想法列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/ideas',
  tags: ['Me'],
  summary: '取得我的想法列表',
  description: '取得當前用戶創建的所有想法',
  request: {
    query: ideaQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取我的想法列表',
      content: {
        'application/json': {
          schema: ideasListResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/me/practices - 取得我的實踐記錄
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/practices',
  tags: ['Me'],
  summary: '取得我的實踐記錄',
  description: '取得當前用戶的所有實踐記錄，支援多種篩選和排序選項',
  request: {
    query: mePracticesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取我的實踐記錄',
      content: {
        'application/json': {
          schema: myPracticesApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/me/practice-stats - 取得我的實踐統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/practice-stats',
  tags: ['Me'],
  summary: '取得我的實踐統計',
  description: '取得當前用戶的實踐統計資訊，包括總數、進度、連續天數等',
  request: {
    query: practiceStatsQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取實踐統計',
      content: {
        'application/json': {
          schema: myPracticeStatsApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/me/resources - 取得我的個人資源草稿
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/resources',
  tags: ['Me'],
  summary: '取得我的個人資源草稿',
  description: '取得當前用戶的個人資源列表，包括草稿和已發布的資源',
  request: {
    query: resourcesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取我的資源列表',
      content: {
        'application/json': {
          schema: myResourcesApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/me/preferences - 取得我的個人偏好設定
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/preferences',
  tags: ['Me'],
  summary: '取得我的個人偏好設定',
  description: '取得當前用戶的個人偏好設定',
  request: {
    query: preferencesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取偏好設定',
      content: {
        'application/json': {
          schema: myPreferencesApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/me/footprints - 取得我的學習足跡
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/footprints',
  tags: ['Me'],
  summary: '取得我的學習足跡',
  description: '取得當前用戶在實踐上留下的留言（學習足跡），依留言時間倒序排列，支援分頁',
  request: {
    query: myFootprintsQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取學習足跡列表',
      content: {
        'application/json': {
          schema: myFootprintsApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /api/v1/me/preferences - 更新我的個人偏好設定
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/me/preferences',
  tags: ['Me'],
  summary: '更新我的個人偏好設定',
  description: '更新當前用戶的個人偏好設定',
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
          schema: updatePreferencesApiResponseSchema
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
 * GET /api/v1/me/challenges - 取得我參加的共同挑戰
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/challenges',
  tags: ['Me'],
  summary: '取得我參加的共同挑戰（含已結束）',
  description: '空間「共同挑戰」子頁用：列出當前用戶已加入的共同挑戰摘要，附加入時自動複製的實踐 ID',
  responses: {
    200: {
      description: '成功獲取我的共同挑戰',
      content: {
        'application/json': {
          schema: apiSuccessResponseSchema(myChallengesResponseSchema)
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/me/cohorts - 取得我加入的期列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/me/cohorts',
  tags: ['Me'],
  summary: '取得我加入的期列表',
  description: '取得當前用戶已加入且尚未退出的所有期，包含計畫與組織名稱',
  responses: {
    200: {
      description: '成功獲取我的期列表',
      content: {
        'application/json': {
          schema: apiSuccessResponseSchema(myCohortsResponseSchema)
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ============================================================================
// Express 路由定義
// ============================================================================

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
  validate(mePracticesQuerySchema, 'query'),
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

/**
 * GET /me/footprints
 * 獲取我的學習足跡（在實踐上留下的留言）
 * 查詢參數：page, limit
 * 需要身份驗證
 */
router.get('/footprints',
  authenticate,
  validate(myFootprintsQuerySchema, 'query'),
  meController.getMyLearningFootprints as RequestHandler
);

/**
 * GET /me/cohorts
 * 獲取我加入的期列表
 * 需要身份驗證
 */
router.get('/cohorts',
  authenticate,
  cohortJoinController.listMyCohorts as RequestHandler
);

/**
 * GET /me/challenges
 * 獲取我參加的共同挑戰
 * 需要身份驗證
 */
router.get('/challenges',
  authenticate,
  challengeController.listMine as RequestHandler
);

export default router;