/**
 * 成果路由
 * 定義成果管理相關的 API 路由
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import {
  createOutcome,
  getOutcomes,
  getMyOutcomes,
  getOutcomeDetail,
  updateOutcome,
  getPublicOutcomes,
  deleteOutcome
} from '../controllers/outcome.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  createOutcomeSchema,
  updateOutcomeSchema,
  outcomeParamsSchema,
  outcomeProjectParamsSchema,
  publicOutcomesQuerySchema,
  singleOutcomeResponseSchema,
  outcomeListResponseSchema,
  deleteOutcomeResponseSchema
} from '../validators/outcome.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/outcomes/public - 獲取公開成果列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/outcomes/public',
  tags: ['Outcomes'],
  summary: '獲取公開成果列表',
  description: '獲取所有公開可見的學習成果，支援分頁',
  request: {
    query: publicOutcomesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取公開成果列表',
      content: {
        'application/json': {
          schema: outcomeListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /outcomes/public
 * 獲取公開成果列表（分頁）
 * 查詢參數：page, pageSize
 */
router.get(
  '/public',
  validate(publicOutcomesQuerySchema, 'query'),
  getPublicOutcomes as RequestHandler
);

/**
 * GET /api/v1/outcomes/my - 獲取當前用戶的成果列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/outcomes/my',
  tags: ['Outcomes'],
  summary: '獲取當前用戶的成果列表',
  description: '獲取當前已登入用戶的所有學習成果',
  responses: {
    200: {
      description: '成功獲取用戶成果列表',
      content: {
        'application/json': {
          schema: outcomeListResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /outcomes/my
 * 獲取當前用戶的成果列表
 * 需要身份驗證
 */
router.get(
  '/my',
  authenticate,
  getMyOutcomes as RequestHandler
);

/**
 * POST /api/v1/outcomes/projects/{projectId} - 創建新成果
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/outcomes/projects/{projectId}',
  tags: ['Outcomes'],
  summary: '創建新成果',
  description: '為指定專案創建一個新的學習成果',
  request: {
    params: outcomeProjectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: createOutcomeSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '成果創建成功',
      content: {
        'application/json': {
          schema: singleOutcomeResponseSchema
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
 * POST /outcomes/projects/:projectId
 * 創建新成果
 * 路徑參數：projectId - 專案ID
 * 請求體：CreateOutcomeRequest
 * 需要身份驗證
 */
router.post(
  '/projects/:projectId',
  authenticate,
  validate(outcomeProjectParamsSchema, 'params'),
  validate(createOutcomeSchema, 'body'),
  createOutcome as RequestHandler
);

/**
 * GET /api/v1/outcomes/projects/{projectId} - 獲取專案的成果列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/outcomes/projects/{projectId}',
  tags: ['Outcomes'],
  summary: '獲取專案的成果列表',
  description: '獲取指定專案的所有學習成果。支援可選身份驗證以提供個人化內容。',
  request: {
    params: outcomeProjectParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取專案成果列表',
      content: {
        'application/json': {
          schema: outcomeListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /outcomes/projects/:projectId
 * 獲取專案的成果列表
 * 路徑參數：projectId - 專案ID
 * 支援可選身份驗證
 */
router.get(
  '/projects/:projectId',
  optionalAuth,
  validate(outcomeProjectParamsSchema, 'params'),
  getOutcomes as RequestHandler
);

/**
 * GET /api/v1/outcomes/projects/{projectId}/{outcomeId} - 獲取成果詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/outcomes/projects/{projectId}/{outcomeId}',
  tags: ['Outcomes'],
  summary: '獲取成果詳情',
  description: '獲取指定專案中特定成果的詳細資訊。支援可選身份驗證以提供個人化內容。',
  request: {
    params: outcomeParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取成果詳情',
      content: {
        'application/json': {
          schema: singleOutcomeResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /outcomes/projects/:projectId/:outcomeId
 * 獲取成果詳情
 * 路徑參數：projectId - 專案ID, outcomeId - 成果ID
 * 支援可選身份驗證
 */
router.get(
  '/projects/:projectId/:outcomeId',
  optionalAuth,
  validate(outcomeParamsSchema, 'params'),
  getOutcomeDetail as RequestHandler
);

/**
 * PUT /api/v1/outcomes/projects/{projectId}/{outcomeId} - 更新成果
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/outcomes/projects/{projectId}/{outcomeId}',
  tags: ['Outcomes'],
  summary: '更新成果',
  description: '更新指定專案中特定成果的資訊',
  request: {
    params: outcomeParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateOutcomeSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '成果更新成功',
      content: {
        'application/json': {
          schema: singleOutcomeResponseSchema
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
 * PUT /outcomes/projects/:projectId/:outcomeId
 * 更新成果
 * 路徑參數：projectId - 專案ID, outcomeId - 成果ID
 * 請求體：UpdateOutcomeRequest
 * 需要身份驗證
 */
router.put(
  '/projects/:projectId/:outcomeId',
  authenticate,
  validate(outcomeParamsSchema, 'params'),
  validate(updateOutcomeSchema, 'body'),
  updateOutcome as RequestHandler
);

/**
 * DELETE /api/v1/outcomes/projects/{projectId}/{outcomeId} - 刪除成果
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/outcomes/projects/{projectId}/{outcomeId}',
  tags: ['Outcomes'],
  summary: '刪除成果',
  description: '刪除指定專案中的特定成果',
  request: {
    params: outcomeParamsSchema
  },
  responses: {
    200: {
      description: '成果已成功刪除',
      content: {
        'application/json': {
          schema: deleteOutcomeResponseSchema
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
 * DELETE /outcomes/projects/:projectId/:outcomeId
 * 刪除成果
 * 路徑參數：projectId - 專案ID, outcomeId - 成果ID
 * 需要身份驗證
 */
router.delete(
  '/projects/:projectId/:outcomeId',
  authenticate,
  validate(outcomeParamsSchema, 'params'),
  deleteOutcome as RequestHandler
);

// ============================================================================
// Express 路由定義完成
// ============================================================================

export default router;