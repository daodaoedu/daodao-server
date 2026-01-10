/**
 * 資源心得評價巢狀路由
 * 處理 /resources/:resourceId/reviews 相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import resourceReviewController from '@/controllers/resource-review.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, optionalAuth, requireRole } from '@/middleware/auth';
import {
  resourceReviewSchema,
  updateResourceReviewSchema,
  updateReviewStatusSchema,
  resourceIdParamsSchema,
  resourceReviewParamsSchema,
  getReviewByIdResponseSchema,
  getReviewsListResponseSchema,
  createReviewResponseSchema,
  updateReviewResponseSchema,
  deleteReviewResponseSchema,
  likeReviewResponseSchema
} from '@/validators/resource-review.validator';
import {
  paginationSchema,
  reviewFilterSchema
} from '@/validators/request-params.validator';

const router = Router({ mergeParams: true });

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/resources/:resourceId/reviews - 獲取指定資源的心得評價列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/resources/{resourceId}/reviews',
  tags: ['Resource Reviews'],
  summary: '獲取指定資源的心得評價列表',
  description: '獲取指定資源的所有心得評價，支援分頁、過濾和排序。支援可選身份驗證以提供個人化內容。',
  request: {
    params: resourceIdParamsSchema,
    query: paginationSchema.merge(reviewFilterSchema)
  },
  responses: {
    200: {
      description: '成功獲取心得評價列表',
      content: {
        'application/json': {
          schema: getReviewsListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /resources/:resourceId/reviews
 * 獲取指定資源的心得評價列表
 * 路徑參數：resourceId - 資源 UUID
 * 查詢參數：cursor, limit, sort, order, status, minScore, maxScore, tags
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(resourceIdParamsSchema, 'params'),
  validate(paginationSchema, 'query'),
  validate(reviewFilterSchema, 'query'),
  resourceReviewController.getReviewsByResource as RequestHandler);

/**
 * GET /api/v1/resources/:resourceId/reviews/:reviewId - 獲取單一心得詳細內容
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/resources/{resourceId}/reviews/{reviewId}',
  tags: ['Resource Reviews'],
  summary: '獲取單一心得評價詳情',
  description: '獲取指定資源的單一心得評價詳細內容。支援可選身份驗證以提供個人化內容。',
  request: {
    params: resourceReviewParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取心得評價詳情',
      content: {
        'application/json': {
          schema: getReviewByIdResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /resources/:resourceId/reviews/:reviewId
 * 獲取指定資源的單一心得詳細內容
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:reviewId',
  optionalAuth,
  validate(resourceReviewParamsSchema, 'params'),
  resourceReviewController.getReviewById as RequestHandler);

/**
 * POST /api/v1/resources/:resourceId/reviews - 新增心得評價
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/resources/{resourceId}/reviews',
  tags: ['Resource Reviews'],
  summary: '新增心得評價',
  description: '為指定資源創建新的心得評價',
  request: {
    params: resourceIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: resourceReviewSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '心得評價創建成功',
      content: {
        'application/json': {
          schema: createReviewResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /resources/:resourceId/reviews
 * 為指定資源新增心得評價
 * 路徑參數：resourceId - 資源 UUID
 * 請求體：CreateResourceReviewDto
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  validate(resourceIdParamsSchema, 'params'),
  validate(resourceReviewSchema, 'body'),
  resourceReviewController.createReview as RequestHandler
);

/**
 * PATCH /api/v1/resources/:resourceId/reviews/:reviewId - 更新心得評價
 */
registry.registerPath({
  method: 'patch',
  path: '/api/v1/resources/{resourceId}/reviews/{reviewId}',
  tags: ['Resource Reviews'],
  summary: '更新心得評價',
  description: '更新指定資源的心得評價內容（需要權限或本人修改）',
  request: {
    params: resourceReviewParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateResourceReviewSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '心得評價更新成功',
      content: {
        'application/json': {
          schema: updateReviewResponseSchema
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
 * PATCH /resources/:resourceId/reviews/:reviewId
 * 更新指定資源的心得評價
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 請求體：UpdateResourceReviewDto
 * 需要身份驗證和權限檢查
 */
router.patch('/:reviewId',
  authenticate,
  validate(resourceReviewParamsSchema, 'params'),
  validate(updateResourceReviewSchema, 'body'),
  resourceReviewController.updateReview as RequestHandler
);

/**
 * PATCH /api/v1/resources/:resourceId/reviews/:reviewId/status - 更新心得評價狀態
 */
registry.registerPath({
  method: 'patch',
  path: '/api/v1/resources/{resourceId}/reviews/{reviewId}/status',
  tags: ['Resource Reviews'],
  summary: '更新心得評價狀態（管理員）',
  description: '更新指定資源心得評價的狀態（僅限管理員）',
  request: {
    params: resourceReviewParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateReviewStatusSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '心得評價狀態更新成功',
      content: {
        'application/json': {
          schema: updateReviewResponseSchema
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
 * PATCH /resources/:resourceId/reviews/:reviewId/status
 * 更新指定資源心得評價的狀態
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 請求體：{ status: string } (draft, published, archived, reported)
 * 需要身份驗證和權限檢查（管理員或評論所有者）
 */
router.patch('/:reviewId/status',
  authenticate,
  requireRole(['admin']), // 只有管理員可以更改評論狀態
  validate(resourceReviewParamsSchema, 'params'),
  validate(updateReviewStatusSchema, 'body'),
  resourceReviewController.updateReviewStatus as RequestHandler
);

/**
 * DELETE /api/v1/resources/:resourceId/reviews/:reviewId - 刪除心得評價
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/resources/{resourceId}/reviews/{reviewId}',
  tags: ['Resource Reviews'],
  summary: '刪除心得評價',
  description: '刪除指定資源的心得評價（軟刪除，需要權限或本人操作）',
  request: {
    params: resourceReviewParamsSchema
  },
  responses: {
    200: {
      description: '心得評價已成功刪除',
      content: {
        'application/json': {
          schema: deleteReviewResponseSchema
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
 * DELETE /resources/:resourceId/reviews/:reviewId
 * 刪除指定資源的心得評價（軟刪除）
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 需要身份驗證和權限檢查
 */
router.delete('/:reviewId',
  authenticate,
  validate(resourceReviewParamsSchema, 'params'),
  resourceReviewController.deleteReview as RequestHandler
);

/**
 * POST /api/v1/resources/:resourceId/reviews/:reviewId/like - 點讚心得評價
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/resources/{resourceId}/reviews/{reviewId}/like',
  tags: ['Resource Reviews'],
  summary: '點讚心得評價',
  description: '對指定資源的心得評價點讚',
  request: {
    params: resourceReviewParamsSchema
  },
  responses: {
    200: {
      description: '點讚成功',
      content: {
        'application/json': {
          schema: likeReviewResponseSchema
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
 * POST /resources/:resourceId/reviews/:reviewId/like
 * 對指定資源的心得評價點讚
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 需要身份驗證
 */
router.post('/:reviewId/like',
  authenticate,
  validate(resourceReviewParamsSchema, 'params'),
  resourceReviewController.likeReview as RequestHandler
);

/**
 * DELETE /api/v1/resources/:resourceId/reviews/:reviewId/like - 取消點讚
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/resources/{resourceId}/reviews/{reviewId}/like',
  tags: ['Resource Reviews'],
  summary: '取消點讚心得評價',
  description: '取消對指定資源心得評價的點讚',
  request: {
    params: resourceReviewParamsSchema
  },
  responses: {
    200: {
      description: '取消點讚成功',
      content: {
        'application/json': {
          schema: likeReviewResponseSchema
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
 * DELETE /resources/:resourceId/reviews/:reviewId/like
 * 取消對指定資源心得評價的點讚
 * 路徑參數：
 *   - resourceId - 資源 UUID
 *   - reviewId - 心得評價 ID (字串格式，內容為數字)
 * 需要身份驗證
 */
router.delete('/:reviewId/like',
  authenticate,
  validate(resourceReviewParamsSchema, 'params'),
  resourceReviewController.unlikeReview as RequestHandler
);

// ============================================================================
// Express 路由定義完成
// ============================================================================

export default router;