/**
 * 標籤路由
 * 處理標籤相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import tagController from '@/controllers/tag.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticateAny } from '@/middleware/auth';
import {
  tagSearchQuerySchema,
  popularTagsQuerySchema,
  addEntityTagSchema,
  removeEntityTagSchema,
  entityTagsQuerySchema,
  getPopularTagsApiResponseSchema,
  searchTagsApiResponseSchema,
  getTagStatsApiResponseSchema,
  addEntityTagApiResponseSchema,
  removeEntityTagApiResponseSchema,
  getEntityTagsApiResponseSchema
} from '@/validators/tag.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/tags/popular - 取得熱門標籤
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/tags/popular',
  tags: ['Tags'],
  summary: '取得熱門標籤',
  description: '取得熱門標籤列表，按使用次數排序。可選擇篩選特定實體類型（resource, project, idea, practice, review）的熱門標籤。',
  request: {
    query: popularTagsQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取熱門標籤',
      content: {
        'application/json': {
          schema: getPopularTagsApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/tags/search - 搜尋標籤
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/tags/search',
  tags: ['Tags'],
  summary: '搜尋標籤',
  description: '根據關鍵詞搜尋標籤',
  request: {
    query: tagSearchQuerySchema
  },
  responses: {
    200: {
      description: '成功搜尋標籤',
      content: {
        'application/json': {
          schema: searchTagsApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/tags/stats - 取得標籤統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/tags/stats',
  tags: ['Tags'],
  summary: '取得標籤統計',
  description: '取得標籤的使用統計資訊',
  responses: {
    200: {
      description: '成功獲取標籤統計',
      content: {
        'application/json': {
          schema: getTagStatsApiResponseSchema
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/tags/entities - 為實體添加標籤
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/tags/entities',
  tags: ['Tags'],
  summary: '為實體添加標籤',
  description: '為指定的實體（資源、專案、想法等）添加標籤',
  request: {
    body: {
      content: {
        'application/json': {
          schema: addEntityTagSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '標籤添加成功',
      content: {
        'application/json': {
          schema: addEntityTagApiResponseSchema
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
 * DELETE /api/v1/tags/entities - 移除實體標籤
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/tags/entities',
  tags: ['Tags'],
  summary: '移除實體標籤',
  description: '從指定的實體移除標籤',
  request: {
    body: {
      content: {
        'application/json': {
          schema: removeEntityTagSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '標籤移除成功',
      content: {
        'application/json': {
          schema: removeEntityTagApiResponseSchema
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
 * GET /api/v1/tags/entities - 取得實體標籤列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/tags/entities',
  tags: ['Tags'],
  summary: '取得實體標籤列表',
  description: '取得指定實體的所有標籤',
  request: {
    query: entityTagsQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取實體標籤',
      content: {
        'application/json': {
          schema: getEntityTagsApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

// ============================================================================
// Express 路由定義
// ============================================================================

/**
 * GET /tags/popular
 * 獲取熱門標籤
 * 查詢參數：limit, entityType (可選)
 */
router.get('/popular',
  validate(popularTagsQuerySchema, 'query'),
  tagController.getPopularTags);

/**
 * GET /tags/search
 * 搜索標籤
 * 查詢參數：query, limit
 */
router.get('/search',
  validate(tagSearchQuerySchema, 'query'),
  tagController.searchTags as RequestHandler
);

/**
 * GET /tags/stats
 * 獲取標籤統計
 */
router.get('/stats',
  tagController.getTagStats as RequestHandler
);

/**
 * POST /tags/entities
 * 為實體添加標籤
 * 請求體：{ entityId: number, entityType: string, tagName: string }
 * 需要身份驗證
 */
router.post('/entities',
  authenticateAny,
  validate(addEntityTagSchema, 'body'),
  tagController.addEntityTag as RequestHandler
);

/**
 * DELETE /tags/entities
 * 移除實體標籤
 * 請求體：{ entityId: number, entityType: string, tagName: string }
 * 需要身份驗證和權限檢查
 */
router.delete('/entities',
  authenticateAny,
  validate(removeEntityTagSchema, 'body'),
  tagController.removeEntityTag as RequestHandler
);

/**
 * GET /tags/entities
 * 獲取實體標籤列表
 * 查詢參數：entityId, entityType
 */
router.get('/entities',
  validate(entityTagsQuerySchema, 'query'),
  tagController.getEntityTags as RequestHandler
);

export default router;