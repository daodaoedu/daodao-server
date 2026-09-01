/**
 * 想法路由
 * 處理想法相關的路由定義，包含 OpenAPI 文檔定義
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validation.middleware';
import {
  createIdeaSchema,
  updateIdeaSchema,
  ideaQuerySchema,
  ideaParamsSchema,
  ideaSuccessResponseSchema,
  recordIdeaViewResponseSchema,
  ideasListResponseSchema,
  createIdeaResponseSchema,
  updateIdeaResponseSchema,
  deleteIdeaResponseSchema
} from '@/validators/idea.validators';
import ideaController from '@/controllers/idea.controller';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/ideas - 獲取想法列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/ideas',
  tags: ['Ideas'],
  summary: '獲取想法列表',
  description: '獲取所有想法列表，支援分頁、過濾和搜尋。支援可選身份驗證以提供個人化內容（如顯示點讚、收藏狀態）。',
  request: {
    query: ideaQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取想法列表',
      content: {
        'application/json': {
          schema: ideasListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/ideas/:id - 獲取想法詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/ideas/{id}',
  tags: ['Ideas'],
  summary: '獲取想法詳情',
  description: '根據想法 ID 獲取想法的完整資訊，包括創建者資訊、資源列表、互動統計等。支援可選身份驗證以提供個人化內容。',
  request: {
    params: ideaParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取想法詳情',
      content: {
        'application/json': {
          schema: ideaSuccessResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/ideas/{id}/view - 記錄想法瀏覽
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/ideas/{id}/view',
  tags: ['Ideas'],
  summary: '記錄想法瀏覽',
  description: '記錄登入使用者瀏覽指定想法的事件（同一使用者對同一想法 24h 內去重），回傳該想法目前的累計瀏覽數。',
  request: {
    params: ideaParamsSchema
  },
  responses: {
    200: {
      description: '瀏覽事件記錄成功',
      content: {
        'application/json': {
          schema: recordIdeaViewResponseSchema
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
 * POST /api/v1/ideas - 創建新想法
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/ideas',
  tags: ['Ideas'],
  summary: '創建新想法',
  description: '創建一個新的想法。可以包含內容、標籤和相關資源連結。需要身份驗證。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createIdeaSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '想法創建成功',
      content: {
        'application/json': {
          schema: createIdeaResponseSchema
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
 * PUT /api/v1/ideas/:id - 更新想法
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/ideas/{id}',
  tags: ['Ideas'],
  summary: '更新想法',
  description: '更新現有想法的內容、標籤、資源或狀態。需要身份驗證且只能由想法創建者更新。',
  request: {
    params: ideaParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateIdeaSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '想法更新成功',
      content: {
        'application/json': {
          schema: updateIdeaResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（只能更新自己的想法）',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              data: { type: 'null' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'FORBIDDEN' },
                  message: { type: 'string', example: '無權限更新此想法' }
                }
              },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/ideas/:id - 刪除想法（軟刪除）
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/ideas/{id}',
  tags: ['Ideas'],
  summary: '刪除想法',
  description: '軟刪除指定的想法。需要身份驗證且只能由想法創建者刪除。',
  request: {
    params: ideaParamsSchema
  },
  responses: {
    200: {
      description: '想法已成功刪除',
      content: {
        'application/json': {
          schema: deleteIdeaResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（只能刪除自己的想法）',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              data: { type: 'null' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'FORBIDDEN' },
                  message: { type: 'string', example: '無權限刪除此想法' }
                }
              },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ============================================================================
// Express 路由定義（與之前相同）
// ============================================================================

/**
 * GET /ideas
 * 獲取想法列表
 * 查詢參數：page, limit, query, tags, userId, status, sort, order
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(ideaQuerySchema, 'query'),
  ideaController.getIdeas as RequestHandler
);

/**
 * GET /ideas/:id
 * 獲取想法詳情
 * 路徑參數：id - 想法 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id',
  optionalAuth,
  validate(ideaParamsSchema, 'params'),
  ideaController.getIdeaById as RequestHandler
);

/**
 * POST /ideas/:id/view
 * 記錄想法瀏覽（24h 去重）
 * 路徑參數：id - 想法 ID
 * 需要身份驗證
 */
router.post('/:id/view',
  authenticate,
  validate(ideaParamsSchema, 'params'),
  ideaController.recordIdeaView as RequestHandler
);

/**
 * POST /ideas
 * 創建新想法
 * 請求體：CreateIdeaRequest (包含可選的關聯資源)
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  validate(createIdeaSchema, 'body'),
  ideaController.createIdea as RequestHandler
);

/**
 * PUT /ideas/:id
 * 更新想法
 * 路徑參數：id - 想法 ID
 * 請求體：UpdateIdeaRequest
 * 需要身份驗證和權限檢查（想法作者）
 */
router.put('/:id',
  authenticate,
  validate(ideaParamsSchema, 'params'),
  validate(updateIdeaSchema, 'body'),
  ideaController.updateIdea as RequestHandler
);

/**
 * DELETE /ideas/:id
 * 刪除想法（軟刪除）
 * 路徑參數：id - 想法 ID
 * 需要身份驗證和權限檢查（想法作者）
 */
router.delete('/:id',
  authenticate,
  validate(ideaParamsSchema, 'params'),
  ideaController.deleteIdea as RequestHandler
);

export default router;