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
import upload from '../middleware/multer.middleware';
import { withOnboardingHook } from '../middleware/onboarding-hook.middleware';
import { enforcePracticeCohortContentLifecycle } from '../middleware/cohort-content-lifecycle.middleware';
import { OnboardingTask } from '../types/onboarding.types';
import type { CreationMethod } from '../types/onboarding.types';
import {
  isCreatedPracticeResponse,
  isBatchCreatedPracticeResponse,
  isFirstCheckInResponse,
} from '../utils/onboarding-task-completion';
import {
  practiceQuerySchema,
  myPracticesQuerySchema,
  practiceParamsSchema,
  userPracticesParamsSchema,
  deleteCheckInParamsSchema,
  updateCheckInParamsSchema,
  updateCheckInSchema,
  updateCheckInApiResponseSchema,
  createPracticeSchema,
  batchCreatePracticeSchema,
  batchCreatePracticesApiResponseSchema,
  batchCreatePracticeTemplateSchema,
  batchCreatePracticeTemplatesApiResponseSchema,
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
  recordCheckInViewApiResponseSchema,
  interactionStatsApiResponseSchema,
  userInteractionStatusApiResponseSchema,
  createPracticeApiResponseSchema,
  updatePracticeApiResponseSchema,
  operationSuccessApiResponseSchema,
  copyPracticeApiResponseSchema,
  // Practice Summary
  patchReflectionSchema,
  patchNextIntentSchema,
  patchSelectedCheckinsSchema,
  createInsightFeedbackSchema,
  // Practice Template
  practiceTemplateQuerySchema,
  practiceTemplateParamsSchema,
  createPracticeTemplateSchema,
  updatePracticeTemplateSchema,
  practiceTemplatesListApiResponseSchema,
  practiceTemplateApiResponseSchema,
  templateCategoriesApiResponseSchema,
  createPracticeTemplateApiResponseSchema,
  updatePracticeTemplateApiResponseSchema,
  deletePracticeTemplateApiResponseSchema,
  // Random Template
  randomTemplateQuerySchema,
  randomTemplatesApiResponseSchema,
  // Admin Practice
  adminPracticeListQuerySchema,
  adminPracticeStatusUpdateSchema,
  adminPracticeStatusApiResponseSchema
} from '../validators/practice.validators';

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
 * GET /api/v1/practices/user/{userId} - 取得指定用戶的實踐列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/user/{userId}',
  tags: ['Practice'],
  summary: '取得指定用戶的實踐列表',
  description: '取得指定用戶的實踐活動列表，支援分頁、搜尋和過濾。公開存取。',
  request: {
    params: userPracticesParamsSchema,
    query: practiceQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取用戶實踐列表',
      content: {
        'application/json': {
          schema: practicesListApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
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
 * POST /api/v1/practices/batch - 拆段批次建立實踐
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/batch',
  tags: ['Practice'],
  summary: '拆段批次建立實踐',
  description: '長天數實踐拆成 2–3 段，一次 request 在同一交易內建立多筆實踐；任一段驗證失敗整批回滾。各段開始日須接續（後段 = 前段結束日隔日），14 天開始日限制只套用於第一段。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchCreatePracticeSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '全部段落建立成功，回傳順序與送出一致',
      content: {
        'application/json': {
          schema: batchCreatePracticesApiResponseSchema
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
 * 支援 multipart/form-data 以統一處理圖片上傳和表單資料
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/checkins',
  tags: ['Practice Check-ins'],
  summary: '創建簽到記錄',
  description: '為指定實踐創建新的簽到記錄。支援 multipart/form-data 格式，可同時上傳圖片檔案（最多 3 張）。',
  request: {
    params: practiceParamsSchema,
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              mood: {
                type: 'string',
                enum: ['give_up', 'frustrated', 'bored', 'neutral', 'good', 'happy'],
                description: '學習心情'
              },
              note: { type: 'string', description: '詳細描述（最多 300 字）' },
              tags: { type: 'string', description: '標籤（JSON 字串陣列，最多 10 個）' },
              ogImageUrl: { type: 'string', description: 'OG 圖片 URL（用於社群分享）' },
              images: {
                type: 'array',
                items: { type: 'string', format: 'binary' },
                maxItems: 3,
                description: '圖片檔案（最多 3 張，每張最大 500KB）'
              }
            }
          }
        },
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
 * PUT /api/v1/practices/{id}/checkins/{checkInId} - 更新簽到記錄
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/practices/{id}/checkins/{checkInId}',
  tags: ['Practice Check-ins'],
  summary: '更新簽到記錄',
  description: '更新指定的簽到記錄，需要身份驗證且只能編輯自己的記錄。支援 multipart/form-data 格式以便上傳新圖片。注意：打卡日期不可編輯。',
  request: {
    params: updateCheckInParamsSchema,
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              mood: {
                type: 'string',
                enum: ['give_up', 'frustrated', 'bored', 'neutral', 'good', 'happy'],
                description: '學習心情'
              },
              note: { type: 'string', description: '詳細描述（最多 300 字）' },
              tags: { type: 'string', description: '標籤（JSON 字串陣列，最多 10 個）' },
              ogImageUrl: { type: 'string', description: 'OG 圖片 URL（用於社群分享）' },
              images: {
                type: 'array',
                items: { type: 'string', format: 'binary' },
                maxItems: 3,
                description: '圖片檔案（最多 3 張，每張最大 500KB）'
              }
            }
          }
        },
        'application/json': {
          schema: updateCheckInSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '成功更新簽到記錄',
      content: {
        'application/json': {
          schema: updateCheckInApiResponseSchema
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
 * DELETE /api/v1/practices/{id}/checkins/{checkInId} - 刪除簽到記錄
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/practices/{id}/checkins/{checkInId}',
  tags: ['Practice Check-ins'],
  summary: '刪除簽到記錄',
  description: '刪除指定的簽到記錄，需要身份驗證且只能刪除自己的記錄',
  request: {
    params: deleteCheckInParamsSchema
  },
  responses: {
    200: {
      description: '成功刪除簽到記錄',
      content: {
        'application/json': {
          schema: operationSuccessApiResponseSchema
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
 * POST /api/v1/practices/{id}/checkins/{checkInId}/view - 記錄打卡瀏覽
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/checkins/{checkInId}/view',
  tags: ['Practice Check-ins'],
  summary: '記錄打卡紀錄瀏覽',
  description: '記錄登入使用者瀏覽指定打卡紀錄的事件（同一使用者對同一筆打卡 24h 內去重），回傳該打卡目前的累計瀏覽數。',
  request: {
    params: updateCheckInParamsSchema
  },
  responses: {
    200: {
      description: '瀏覽事件記錄成功',
      content: {
        'application/json': {
          schema: recordCheckInViewApiResponseSchema
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
// Copy OpenAPI 路由定義
// ============================================================================

/**
 * POST /api/v1/practices/{id}/copy - 複製實踐
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/copy',
  tags: ['Practice'],
  summary: '複製實踐',
  description: '將指定的實踐複製到自己的清單。複製他人的實踐時，來源實踐必須為公開狀態。複製自己的實踐不受此限。',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    201: {
      description: '複製成功，回傳新實踐 ID',
      content: {
        'application/json': {
          schema: copyPracticeApiResponseSchema
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

// Archive OpenAPI 路由定義
// ============================================================================

/**
 * POST /api/v1/practices/{id}/archive - 封存實踐
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/archive',
  tags: ['Practice'],
  summary: '封存實踐',
  description: '將指定的實踐封存。封存後的實踐不會出現在預設列表中，但可以透過取消封存恢復。只有實踐擁有者可以執行此操作。',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '封存成功',
      content: {
        'application/json': {
          schema: operationSuccessApiResponseSchema
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
 * POST /api/v1/practices/{id}/unarchive - 取消封存實踐
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/{id}/unarchive',
  tags: ['Practice'],
  summary: '取消封存實踐',
  description: '取消封存指定的實踐，恢復到正常狀態。系統會根據是否有打卡記錄自動決定恢復後的狀態（active 或 not_started）。只有實踐擁有者可以執行此操作。',
  request: {
    params: practiceParamsSchema
  },
  responses: {
    200: {
      description: '取消封存成功',
      content: {
        'application/json': {
          schema: practiceApiResponseSchema
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

// ============================================================================
// Practice Template OpenAPI 路由定義
// ============================================================================

/**
 * GET /api/v1/practices/templates - 取得實踐模板列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/templates',
  tags: ['Practice Templates'],
  summary: '取得實踐模板列表',
  description: '取得可用的實踐模板列表，支援分頁、分類過濾和搜尋。模板提供預設的實踐配置供用戶參考。',
  request: {
    query: practiceTemplateQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取模板列表',
      content: {
        'application/json': {
          schema: practiceTemplatesListApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/practices/templates/categories - 取得模板分類列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/templates/categories',
  tags: ['Practice Templates'],
  summary: '取得模板分類列表',
  description: '取得所有可用的實踐模板分類，用於前端篩選功能。',
  responses: {
    200: {
      description: '成功獲取分類列表',
      content: {
        'application/json': {
          schema: templateCategoriesApiResponseSchema
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/practices/templates/random - 隨機取得實踐模板
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/templates/random',
  tags: ['Practice Templates'],
  summary: '隨機取得實踐模板',
  description: '隨機取得指定數量的實踐模板，可選擇按分類過濾。適用於為用戶推薦模板。',
  request: {
    query: randomTemplateQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取隨機模板',
      content: {
        'application/json': {
          schema: randomTemplatesApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/practices/templates/{id} - 取得單一實踐模板
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/practices/templates/{id}',
  tags: ['Practice Templates'],
  summary: '取得單一實踐模板',
  description: '根據模板 ID 取得單一實踐模板的詳細資訊。',
  request: {
    params: practiceTemplateParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取模板詳情',
      content: {
        'application/json': {
          schema: practiceTemplateApiResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/practices/templates/batch - 拆段批次建立實踐模板
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/templates/batch',
  tags: ['Practice Templates'],
  summary: '拆段批次建立實踐模板',
  description: '長天數模板拆成 2–3 段，一次 request 在同一交易內建立多筆模板；模板無開始日，不驗日期接續。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchCreatePracticeTemplateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '全部段落建立成功，回傳順序與送出一致',
      content: {
        'application/json': {
          schema: batchCreatePracticeTemplatesApiResponseSchema
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
 * POST /api/v1/practices/templates - 創建實踐模板
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/practices/templates',
  tags: ['Practice Templates'],
  summary: '創建實踐模板',
  description: '創建新的實踐模板。需要管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPracticeTemplateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '模板創建成功',
      content: {
        'application/json': {
          schema: createPracticeTemplateApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /api/v1/practices/templates/{id} - 更新實踐模板
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/practices/templates/{id}',
  tags: ['Practice Templates'],
  summary: '更新實踐模板',
  description: '更新指定實踐模板的資訊。需要管理員權限。',
  request: {
    params: practiceTemplateParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updatePracticeTemplateSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '模板更新成功',
      content: {
        'application/json': {
          schema: updatePracticeTemplateApiResponseSchema
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
 * DELETE /api/v1/practices/templates/{id} - 刪除實踐模板
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/practices/templates/{id}',
  tags: ['Practice Templates'],
  summary: '刪除實踐模板',
  description: '刪除指定的實踐模板。需要管理員權限。',
  request: {
    params: practiceTemplateParamsSchema
  },
  responses: {
    200: {
      description: '模板刪除成功',
      content: {
        'application/json': {
          schema: deletePracticeTemplateApiResponseSchema
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

// ===== Admin 實踐管理（express 路由掛在 admin.routes.ts；OpenAPI 定義集中於此以維持 schema 註冊順序） =====

/**
 * GET /api/v1/admin/practices - 取得 Admin 實踐列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/practices',
  tags: ['Admin - Practices'],
  summary: '取得 Admin 實踐列表',
  description:
    '取得全站實踐列表，包含私密（private）與尚未完成的「完成後公開」（delayed）實踐；支援狀態、隱私狀態篩選與搜尋。需要管理員權限。',
  request: {
    query: adminPracticeListQuerySchema
  },
  responses: {
    200: {
      description: '成功取得實踐列表',
      content: {
        'application/json': {
          schema: practicesListApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PATCH /api/v1/admin/practices/:id/status - 更新實踐狀態
 */
registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/practices/{id}/status',
  tags: ['Admin - Practices'],
  summary: '更新實踐狀態',
  description: '由管理員直接更新實踐狀態（不受擁有者限制）。需要管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: adminPracticeStatusUpdateSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '成功更新實踐狀態',
      content: {
        'application/json': {
          schema: adminPracticeStatusApiResponseSchema
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
 * 取得實踐統計資訊（僅限本人）
 */
router.get('/stats',
  authenticate,
  practiceController.getUserPracticeStats as RequestHandler);

/**
 * GET /practices/templates
 * 取得實踐模板列表
 * 公開存取
 * 注意：必須在 /:id 之前定義，否則 'templates' 會被當作 :id 參數
 */
router.get('/templates',
  validate(practiceTemplateQuerySchema, 'query'),
  practiceController.getTemplates as RequestHandler);

/**
 * GET /practices/templates/categories
 * 取得模板分類列表
 * 公開存取
 * 注意：必須在 /templates/:id 之前定義，否則 'categories' 會被當作 :id 參數
 */
router.get('/templates/categories',
  practiceController.getTemplateCategories as RequestHandler);

/**
 * GET /practices/templates/random
 * 隨機取得實踐模板
 * 公開存取
 * 注意：必須在 /templates/:id 之前定義，否則 'random' 會被當作 :id 參數
 */
router.get('/templates/random',
  validate(randomTemplateQuerySchema, 'query'),
  practiceController.getRandomTemplates as RequestHandler);

/**
 * GET /practices/templates/:id
 * 取得單一實踐模板
 * 公開存取
 * 注意：必須在 /:id 之前定義
 */
router.get('/templates/:id',
  validate(practiceTemplateParamsSchema, 'params'),
  practiceController.getTemplateById as RequestHandler);

/**
 * POST /practices/templates
 * 創建實踐模板
 * 需要身份驗證（管理員權限）
 */
router.post('/templates',
  authenticate,
  validate(createPracticeTemplateSchema, 'body'),
  practiceController.createTemplate as RequestHandler);

/**
 * POST /practices/templates/batch
 * 拆段批次建立實踐模板（同一交易）
 */
router.post('/templates/batch',
  authenticate,
  validate(batchCreatePracticeTemplateSchema, 'body'),
  practiceController.batchCreateTemplates as RequestHandler);

/**
 * PUT /practices/templates/:id
 * 更新實踐模板
 * 需要身份驗證（管理員權限）
 */
router.put('/templates/:id',
  authenticate,
  validate(practiceTemplateParamsSchema, 'params'),
  validate(updatePracticeTemplateSchema, 'body'),
  practiceController.updateTemplate as RequestHandler);

/**
 * DELETE /practices/templates/:id
 * 刪除實踐模板
 * 需要身份驗證（管理員權限）
 */
router.delete('/templates/:id',
  authenticate,
  validate(practiceTemplateParamsSchema, 'params'),
  practiceController.deleteTemplate as RequestHandler);

/**
 * GET /practices/user/:userId
 * 取得指定用戶的實踐列表
 * 路徑參數：userId - 用戶外部 UUID
 * 查詢參數：page, limit, search, status, sortBy, sortOrder
 * 公開存取
 * 注意：必須在 /:id 之前定義，否則 'user' 會被當作 :id 參數
 */
router.get('/user/:userId',
  validate(userPracticesParamsSchema, 'params'),
  validate(practiceQuerySchema, 'query'),
  practiceController.getUserPractices as RequestHandler);

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
  withOnboardingHook(OnboardingTask.C, practiceController.createPractice as RequestHandler, {
    resolveCreationMethod: (req) => req.body.creationMethod,
    shouldAdvance: (_req, body) => isCreatedPracticeResponse(body),
  }) as RequestHandler);

/**
 * POST /practices/batch
 * 拆段批次建立實踐（2–3 段、同一交易）
 * Onboarding hook 只掛一次，以第一段判定
 */
router.post('/batch',
  authenticate,
  validate(batchCreatePracticeSchema, 'body'),
  withOnboardingHook(OnboardingTask.C, practiceController.batchCreatePractices as RequestHandler, {
    resolveCreationMethod: (req) => req.body.segments?.[0]?.creationMethod,
    shouldAdvance: (_req, body) => isBatchCreatedPracticeResponse(body),
  }) as RequestHandler);

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
  enforcePracticeCohortContentLifecycle,
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
  enforcePracticeCohortContentLifecycle,
  // TODO: requirePracticeOwnership middleware
  practiceController.deletePractice as RequestHandler);

/**
 * POST /practices/:id/checkins
 * 創建簽到記錄
 * 路徑參數：id - 實踐 ID
 * 支援 multipart/form-data（含 images 檔案，最多 3 張）或 application/json
 * 需要身份驗證和擁有權驗證
 */
router.post('/:id/checkins',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  enforcePracticeCohortContentLifecycle,
  upload.array('images', 3),
  // TODO: requirePracticeOwnership middleware
  withOnboardingHook(OnboardingTask.D, practiceController.createCheckIn as RequestHandler, {
    shouldAdvance: (_req, body) => isFirstCheckInResponse(body),
  }) as RequestHandler);

/**
 * PUT /practices/:id/checkins/:checkInId
 * 更新簽到記錄
 * 路徑參數：id - 實踐 ID, checkInId - 簽到記錄 ID
 * 支援 multipart/form-data（含 images 檔案，最多 3 張）或 application/json
 * 需要身份驗證和擁有權驗證
 */
router.put('/:id/checkins/:checkInId',
  authenticate,
  validate(updateCheckInParamsSchema, 'params'),
  enforcePracticeCohortContentLifecycle,
  upload.array('images', 3),
  practiceController.updateCheckIn as RequestHandler);

/**
 * DELETE /practices/:id/checkins/:checkInId
 * 刪除簽到記錄
 * 路徑參數：id - 實踐 ID, checkInId - 簽到記錄 ID
 * 需要身份驗證和擁有權驗證
 */
router.delete('/:id/checkins/:checkInId',
  authenticate,
  validate(deleteCheckInParamsSchema, 'params'),
  enforcePracticeCohortContentLifecycle,
  practiceController.deleteCheckIn as RequestHandler);

/**
 * POST /practices/:id/checkins/:checkInId/view
 * 記錄打卡紀錄瀏覽（24h 去重）
 * 路徑參數：id - 實踐 ID, checkInId - 簽到記錄 ID
 * 需要身份驗證
 */
router.post('/:id/checkins/:checkInId/view',
  authenticate,
  validate(updateCheckInParamsSchema, 'params'),
  practiceController.recordCheckInView as RequestHandler);

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

router.post('/:id/progress',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.recordReadProgress as RequestHandler);

router.post('/:id/time-spent',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.recordTimeSpent as RequestHandler);

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
// 封存功能
// ============================================================================

/**
 * POST /practices/:id/copy
 * 複製實踐
 * 需要身份驗證
 */
router.post('/:id/copy',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  withOnboardingHook(OnboardingTask.C, practiceController.copyPractice as RequestHandler, {
    resolveCreationMethod: () => 'copied' as CreationMethod,
    // copyPractice always creates a new not_started practice.
    shouldAdvance: () => true,
  }) as RequestHandler);

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

// ============================================================================
// 實踐總結頁功能
// ============================================================================

/**
 * PATCH /practices/:id/reflection
 * 更新實踐反思文字
 * 需要身份驗證和擁有權驗證
 */
router.patch('/:id/reflection',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(patchReflectionSchema, 'body'),
  practiceController.patchReflection as RequestHandler);

/**
 * PATCH /practices/:id/next-intent
 * 更新「接下來我想」文字，可選擇同時建立草稿
 * 需要身份驗證和擁有權驗證
 */
router.patch('/:id/next-intent',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(patchNextIntentSchema, 'body'),
  practiceController.patchNextIntent as RequestHandler);

/**
 * PATCH /practices/:id/selected-checkins
 * 更新精選打卡列表（最多 3 筆）
 * 需要身份驗證和擁有權驗證
 */
router.patch('/:id/selected-checkins',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(patchSelectedCheckinsSchema, 'body'),
  practiceController.patchSelectedCheckins as RequestHandler);

/**
 * POST /practices/:id/insight-feedback
 * 建立 AI 洞察回饋
 * 需要身份驗證和擁有權驗證
 */
router.post('/:id/insight-feedback',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(createInsightFeedbackSchema, 'body'),
  practiceController.createInsightFeedback as RequestHandler);

export default router;
