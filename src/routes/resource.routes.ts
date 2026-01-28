/**
 * 資源路由
 * 處理資源相關的路由定義，支援 OpenAPI 文檔生成
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
  getResourceStats,
  getResourceTags
} from '../controllers/resource.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';
import {
  createResourceSchema,
  updateResourceSchema,
  updateResourceStatusSchema,
  getResourcesListResponseSchema,
  getResourceByIdResponseSchema,
  createResourceResponseSchema,
  updateResourceResponseSchema,
  deleteResourceResponseSchema,
  getResourceStatsResponseSchema,
  getResourceTagsResponseSchema
} from '../validators/resource.validator';
import {
  paginationSchema,
  resourceFilterSchema
} from '../validators/request-params.validator';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/resources - 獲取資源列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/resources',
  tags: ['Resources'],
  summary: '獲取資源列表',
  description: '獲取所有資源列表，支援分頁、過濾和搜尋。支援可選身份驗證以提供個人化內容。',
  request: {
    query: paginationSchema.merge(resourceFilterSchema)
  },
  responses: {
    200: {
      description: '成功獲取資源列表',
      content: {
        'application/json': {
          schema: getResourcesListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/resources/stats - 獲取資源統計資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/resources/stats',
  tags: ['Resources'],
  summary: '獲取資源統計資訊',
  description: '獲取資源統計數據，包括總數、分類統計等',
  responses: {
    200: {
      description: '成功獲取資源統計',
      content: {
        'application/json': {
          schema: getResourceStatsResponseSchema
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/resources/{resourceId} - 獲取資源詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/resources/{resourceId}',
  tags: ['Resources'],
  summary: '獲取資源詳情',
  description: '根據資源 ID 獲取資源的詳細資訊',
  request: {
    params: z.object({
      resourceId: z.string().openapi({
        description: '資源 ID',
        example: '550e8400-e29b-41d4-a716-446655440000'
      })
    })
  },
  responses: {
    200: {
      description: '成功獲取資源詳情',
      content: {
        'application/json': {
          schema: getResourceByIdResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/resources - 創建新資源
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/resources',
  tags: ['Resources'],
  summary: '創建新資源',
  description: '創建一個新的學習資源，可選擇同時提交資源評價',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createResourceSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '資源創建成功',
      content: {
        'application/json': {
          schema: createResourceResponseSchema
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
 * PATCH /api/v1/resources/{resourceId} - 更新資源
 */
registry.registerPath({
  method: 'patch',
  path: '/api/v1/resources/{resourceId}',
  tags: ['Resources'],
  summary: '更新資源資訊',
  description: '更新指定資源的資料（需要資源所有者或管理員權限）',
  request: {
    params: z.object({
      resourceId: z.string().openapi({
        description: '資源 ID',
        example: '550e8400-e29b-41d4-a716-446655440000'
      })
    }),
    body: {
      content: {
        'application/json': {
          schema: updateResourceSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '資源更新成功',
      content: {
        'application/json': {
          schema: updateResourceResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要資源所有者或管理員權限）',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PATCH /api/v1/resources/{resourceId}/status - 更新資源狀態
 */
registry.registerPath({
  method: 'patch',
  path: '/api/v1/resources/{resourceId}/status',
  tags: ['Resources'],
  summary: '更新資源狀態',
  description: '更新資源的發布狀態（僅限管理員）',
  request: {
    params: z.object({
      resourceId: z.string().openapi({
        description: '資源 ID',
        example: '550e8400-e29b-41d4-a716-446655440000'
      })
    }),
    body: {
      content: {
        'application/json': {
          schema: updateResourceStatusSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '資源狀態更新成功',
      content: {
        'application/json': {
          schema: updateResourceResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要管理員權限）',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/resources/{resourceId} - 刪除資源
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/resources/{resourceId}',
  tags: ['Resources'],
  summary: '刪除資源',
  description: '軟刪除指定的資源（需要資源所有者或管理員權限）',
  request: {
    params: z.object({
      resourceId: z.string().openapi({
        description: '資源 ID',
        example: '550e8400-e29b-41d4-a716-446655440000'
      })
    })
  },
  responses: {
    200: {
      description: '資源刪除成功',
      content: {
        'application/json': {
          schema: deleteResourceResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要資源所有者或管理員權限）',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/resources/{resourceId}/tags - 獲取資源標籤
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/resources/{resourceId}/tags',
  tags: ['Resources'],
  summary: '獲取資源標籤',
  description: '獲取指定資源的所有標籤',
  request: {
    params: z.object({
      resourceId: z.string().openapi({
        description: '資源 ID',
        example: '550e8400-e29b-41d4-a716-446655440000'
      })
    })
  },
  responses: {
    200: {
      description: '成功獲取資源標籤',
      content: {
        'application/json': {
          schema: getResourceTagsResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

// ============================================================================
// Express 路由定義（與之前相同）
// ============================================================================

/**
 * GET /resources
 * 獲取資源列表
 * 查詢參數：cursor, limit, type, cost, level, majorCategory, subCategory, tags, query, sort, order
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(paginationSchema, 'query'),
  validate(resourceFilterSchema, 'query'),
  getResources as RequestHandler);

/**
 * GET /resources/stats
 * 獲取資源統計資訊
 * 支援可選身份驗證（用於個人化統計）
 */
router.get('/stats',
  optionalAuth,
  getResourceStats as RequestHandler);

/**
 * GET /resources/:resourceId
 * 獲取資源詳情
 * 路徑參數：resourceId - 資源 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:resourceId',
  optionalAuth,
  getResourceById as RequestHandler);

/**
 * POST /resources
 * 創建新資源
 * 請求體：CreateResourceDto (包含可選的嵌套評論)
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  validate(createResourceSchema, 'body'),
  createResource as RequestHandler
);

/**
 * PATCH /resources/:resourceId
 * 更新資源
 * 路徑參數：resourceId - 資源 ID
 * 請求體：UpdateResourceDto
 * 需要身份驗證和權限檢查（資源所有者或管理員）
 */
router.patch('/:resourceId',
  authenticate,
  validate(updateResourceSchema, 'body'),
  updateResource as RequestHandler
);

/**
 * PATCH /resources/:resourceId/status
 * 更新資源狀態
 * 路徑參數：resourceId - 資源 ID
 * 請求體：{ status: string }
 * 需要身份驗證和權限檢查（管理員或資源所有者）
 */
router.patch('/:resourceId/status',
  authenticate,
  requireRole(['admin']), // 只有管理員可以更改狀態
  validate(updateResourceStatusSchema, 'body'),
  updateResourceStatus as RequestHandler
);

/**
 * DELETE /resources/:resourceId
 * 刪除資源（軟刪除）
 * 路徑參數：resourceId - 資源 ID
 * 需要身份驗證和權限檢查（資源所有者或管理員）
 */
router.delete('/:resourceId',
  authenticate,
  deleteResource as RequestHandler
);

/**
 * GET /resources/:resourceId/tags
 * 獲取資源標籤
 * 路徑參數：resourceId - 資源 ID
 */
router.get('/:resourceId/tags', getResourceTags as RequestHandler);

export default router;