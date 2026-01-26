/**
 * 實踐路由
 * 處理實踐相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { practiceController } from '../controllers/practice.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  practiceQuerySchema,
  myPracticesQuerySchema,
  practiceParamsSchema,
  createPracticeSchema,
  updatePracticeSchema,
  checkInSchema,
  checkInQuerySchema,
  practiceEventViewSchema,
  practiceEventShareSchema,
  practiceApiResponseSchema,
  practicesListApiResponseSchema,
  checkInApiResponseSchema,
  checkInsListApiResponseSchema,
  practiceStatsApiResponseSchema,
  checkInStatsApiResponseSchema,
  monthlyCalendarApiResponseSchema,
  toggleLikeApiResponseSchema,
  toggleFavoriteApiResponseSchema,
  recordShareApiResponseSchema,
  recordViewApiResponseSchema,
  interactionStatsApiResponseSchema,
  userInteractionStatusApiResponseSchema,
  createPracticeApiResponseSchema,
  updatePracticeApiResponseSchema,
  operationSuccessApiResponseSchema,
  // 新增
  practiceTemplateQuerySchema,
  practiceTemplateResponseSchema,
  encouragementResponseSchema,
  tagPromptQuerySchema,
  tagPromptResponseSchema
} from '../validators/practice.validators';
import { paginatedApiResponseSchema, apiSuccessResponseSchema } from '../validators/api-response.validators';

// 月度日曆參數 schema
const monthlyCalendarParamsSchema = z.object({
  id: z.string().uuid('Practice ID must be a valid UUID'),
  year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits').transform(Number),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Month must be 1-12').transform(Number)
});

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/practices - 取得實踐列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices',
  tags: ['Practice'],
  summary: '取得實踐列表',
  description: '取得實踐活動列表，支援分頁、搜尋和過濾。支援可選身份驗證以提供個人化內容。',
  request: {
    query: practiceQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取實踐列表',
      content: {
        'application/json': {
          schema: practicesListApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/practices/me - 取得我的實踐列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/me',
  tags: ['Practice'],
  summary: '取得我的實踐列表',
  description: '取得當前用戶的實踐活動列表',
  request: {
    query: myPracticesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取我的實踐列表',
      content: {
        'application/json': {
          schema: practicesListApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/practices/stats - 取得實踐統計資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/stats',
  tags: ['Practice'],
  summary: '取得實踐統計資訊',
  description: '取得用戶的實踐統計資訊，支援可選身份驗證',
  request: {
    query: z.object({
      userId: z.string().uuid().optional().openapi({
        description: '用戶 ID（可選）',
        example: '550e8400-e29b-41d4-a716-446655440000'
      })
    }).openapi({
      description: '實踐統計查詢參數'
    })
  },
  responses: {
    200: {
      description: '成功獲取統計資訊',
      content: {
        'application/json': {
          schema: practiceStatsApiResponseSchema
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/practices/{id} - 取得實踐詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/{id}',
  tags: ['Practice'],
  summary: '取得實踐詳情',
  description: '取得指定實踐的詳細資訊，支援可選身份驗證以提供個人化內容',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取實踐詳情',
      content: {
        'application/json': {
          schema: practiceApiResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/practices - 創建新實踐
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices',
  tags: ['Practice'],
  summary: '創建新實踐',
  description: '創建一個新的實踐活動',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPracticeSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '實踐創建成功',
      content: {
        'application/json': {
          schema: createPracticeApiResponseSchema
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
 * PUT /api/v1/practices/{id} - 更新實踐
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/practices/{id}',
  tags: ['Practice'],
  summary: '更新實踐',
  description: '更新指定實踐的資訊',
  request: {
    params: practiceParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updatePracticeSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '實踐更新成功',
      content: {
        'application/json': {
          schema: updatePracticeApiResponseSchema
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
 * DELETE /api/v1/practices/{id} - 刪除實踐
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/practices/{id}',
  tags: ['Practice'],
  summary: '刪除實踐',
  description: '刪除指定的實踐活動（軟刪除）',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '實踐刪除成功',
      content: {
        'application/json': {
          schema: operationSuccessApiResponseSchema
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
 * POST /api/v1/practices/{id}/checkins - 創建簽到記錄
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/checkins',
  tags: ['Practice Check-ins'],
  summary: '創建簽到記錄',
  description: '為指定實踐創建新的簽到記錄',
  request: {
    params: practiceParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: checkInSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '簽到記錄創建成功',
      content: {
        'application/json': {
          schema: checkInApiResponseSchema
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
 * GET /api/v1/practices/{id}/checkins - 取得簽到記錄列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/{id}/checkins',
  tags: ['Practice Check-ins'],
  summary: '取得簽到記錄列表',
  description: '取得指定實踐的簽到記錄列表',
  request: {
    params: practiceParamsSchema,
    query: checkInQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取簽到記錄列表',
      content: {
        'application/json': {
          schema: checkInsListApiResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/practices/{id}/checkins/stats - 取得簽到統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/{id}/checkins/stats',
  tags: ['Practice Check-ins'],
  summary: '取得簽到統計',
  description: '取得指定實踐的簽到統計資訊',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取簽到統計',
      content: {
        'application/json': {
          schema: checkInStatsApiResponseSchema
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
 * GET /api/v1/practices/{id}/checkins/calendar/{year}/{month} - 取得月度簽到日曆
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/{id}/checkins/calendar/{year}/{month}',
  tags: ['Practice Check-ins'],
  summary: '取得月度簽到日曆',
  description: '取得指定實踐的月度簽到日曆資訊',
  request: {
    params: monthlyCalendarParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取月度日曆',
      content: {
        'application/json': {
          schema: monthlyCalendarApiResponseSchema
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
 * POST /api/v1/practices/{id}/like - 點讚/取消點讚
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/like',
  tags: ['Practice Interactions'],
  summary: '點讚/取消點讚',
  description: '對指定實踐進行點讚或取消點讚',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '操作成功',
      content: {
        'application/json': {
          schema: toggleLikeApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/practices/{id}/favorite - 收藏/取消收藏
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/favorite',
  tags: ['Practice Interactions'],
  summary: '收藏/取消收藏',
  description: '對指定實踐進行收藏或取消收藏',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '操作成功',
      content: {
        'application/json': {
          schema: toggleFavoriteApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/practices/{id}/share - 記錄分享事件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/share',
  tags: ['Practice Interactions'],
  summary: '記錄分享事件',
  description: '記錄用戶分享實踐的事件',
  request: {
    params: practiceParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: practiceEventShareSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '分享事件記錄成功',
      content: {
        'application/json': {
          schema: recordShareApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/practices/{id}/view - 記錄瀏覽事件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/view',
  tags: ['Practice Interactions'],
  summary: '記錄瀏覽事件',
  description: '記錄用戶瀏覽實踐的事件',
  request: {
    params: practiceParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: practiceEventViewSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '瀏覽事件記錄成功',
      content: {
        'application/json': {
          schema: recordViewApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/practices/{id}/stats - 取得實踐互動統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/{id}/stats',
  tags: ['Practice Interactions'],
  summary: '取得實踐互動統計',
  description: '取得指定實踐的互動統計資訊（點讚、收藏、分享、瀏覽次數等）',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取互動統計',
      content: {
        'application/json': {
          schema: interactionStatsApiResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/practices/{id}/user-status - 取得使用者對實踐的互動狀態
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/{id}/user-status',
  tags: ['Practice Interactions'],
  summary: '取得使用者對實踐的互動狀態',
  description: '取得當前用戶對指定實踐的互動狀態（是否點讚、是否收藏）',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取用戶互動狀態',
      content: {
        'application/json': {
          schema: userInteractionStatusApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ============================================================================
// Express 路由定義
// ============================================================================

/**
 * GET /practices
 * 取得實踐列表
 * 查詢參數：page, limit, search, contentType, status, sortBy, sortOrder, userId
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(practiceQuerySchema, 'query'),
  practiceController.getPractices as RequestHandler);

/**
 * GET /practices/me
 * 取得我的實踐列表
 * 查詢參數：page, limit, search, contentType, status, sortBy, sortOrder
 * 需要身份驗證
 */
router.get('/me',
  authenticate,
  validate(myPracticesQuerySchema, 'query'),
  practiceController.getMyPractices as RequestHandler);

/**
 * GET /practices/stats
 * 取得實踐統計資訊
 * 查詢參數：userId（可選）
 * 支援可選身份驗證
 */
router.get('/stats',
  optionalAuth,
  practiceController.getUserPracticeStats as RequestHandler);

/**
 * GET /practices/:id
 * 取得實踐詳情
 * 路徑參數：id - 實踐 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id',
  optionalAuth,
  validate(practiceParamsSchema, 'params'),
  practiceController.getPractice as RequestHandler);

/**
 * POST /practices
 * 創建新實踐
 * 請求體：CreatePracticeRequest
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  validate(createPracticeSchema, 'body'),
  practiceController.createPractice as RequestHandler);

/**
 * PUT /practices/:id
 * 更新實踐
 * 路徑參數：id - 實踐 ID
 * 請求體：UpdatePracticeRequest
 * 需要身份驗證和擁有權驗證
 */
router.put('/:id',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(updatePracticeSchema, 'body'),
  // TODO: requirePracticeOwnership middleware
  practiceController.updatePractice as RequestHandler);

/**
 * DELETE /practices/:id
 * 刪除實踐（軟刪除）
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證和擁有權驗證
 */
router.delete('/:id',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  // TODO: requirePracticeOwnership middleware
  practiceController.deletePractice as RequestHandler);

/**
 * POST /practices/:id/checkins
 * 創建簽到記錄
 * 路徑參數：id - 實踐 ID
 * 請求體：CreateCheckInRequest
 * 需要身份驗證和擁有權驗證
 */
router.post('/:id/checkins',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(checkInSchema, 'body'),
  // TODO: requirePracticeOwnership middleware
  practiceController.createCheckIn as RequestHandler);

/**
 * GET /practices/:id/checkins
 * 取得簽到記錄列表
 * 路徑參數：id - 實踐 ID
 * 查詢參數：page, limit, startDate, endDate, mood
 * 支援可選身份驗證
 */
router.get('/:id/checkins',
  optionalAuth,
  validate(practiceParamsSchema, 'params'),
  validate(checkInQuerySchema, 'query'),
  practiceController.getCheckIns as RequestHandler);

/**
 * GET /practices/:id/checkins/stats
 * 取得簽到統計
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證和擁有權驗證
 */
router.get('/:id/checkins/stats',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  // TODO: requirePracticeOwnership middleware
  practiceController.getCheckInStats as RequestHandler);

/**
 * GET /practices/:id/checkins/calendar/:year/:month
 * 取得月度簽到日曆
 * 路徑參數：id - 實踐 ID, year - 年份, month - 月份
 * 需要身份驗證和擁有權驗證
 */
router.get('/:id/checkins/calendar/:year/:month',
  authenticate,
  validate(monthlyCalendarParamsSchema, 'params'),
  // TODO: requirePracticeOwnership middleware
  practiceController.getMonthlyCheckInCalendar as RequestHandler);

/**
 * POST /practices/:id/like
 * 點讚/取消點讚
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.post('/:id/like',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.toggleLike as RequestHandler);

/**
 * POST /practices/:id/favorite
 * 收藏/取消收藏
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.post('/:id/favorite',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.toggleFavorite as RequestHandler);

/**
 * POST /practices/:id/share
 * 記錄分享事件
 * 路徑參數：id - 實踐 ID
 * 請求體：分享資訊
 * 需要身份驗證
 */
router.post('/:id/share',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(practiceEventShareSchema, 'body'),
  practiceController.recordShare as RequestHandler);

/**
 * POST /practices/:id/view
 * 記錄瀏覽事件
 * 路徑參數：id - 實踐 ID
 * 請求體：瀏覽資訊
 * 需要身份驗證
 */
router.post('/:id/view',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(practiceEventViewSchema, 'body'),
  practiceController.recordView as RequestHandler);

/**
 * GET /practices/:id/stats
 * 取得實踐互動統計
 * 路徑參數：id - 實踐 ID
 * 支援可選身份驗證
 */
router.get('/:id/stats',
  optionalAuth,
  validate(practiceParamsSchema, 'params'),
  practiceController.getInteractionStats as RequestHandler);

/**
 * GET /practices/:id/user-status
 * 取得使用者對實踐的互動狀態
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.get('/:id/user-status',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.getUserInteractionStatus as RequestHandler);

// ============================================================================
// 新增路由：模板、鼓勵句、引導句、封存功能
// ============================================================================

/**
 * GET /practices/templates
 * 取得實踐模板列表
 * 公開存取
 */
router.get('/templates',
  validate(practiceTemplateQuerySchema, 'query'),
  practiceController.getTemplates as RequestHandler);

/**
 * GET /practices/templates/:id
 * 取得單一實踐模板
 * 公開存取
 */
router.get('/templates/:id',
  practiceController.getTemplateById as RequestHandler);

/**
 * POST /practices/:id/archive
 * 封存實踐
 * 需要身份驗證
 */
router.post('/:id/archive',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.archive as RequestHandler);

/**
 * POST /practices/:id/unarchive
 * 取消封存實踐
 * 需要身份驗證
 */
router.post('/:id/unarchive',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.unarchive as RequestHandler);

export default router;
