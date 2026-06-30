/**
 * Roadmap Routes
 *
 * GET    /api/v1/roadmap/items                       — 公開看板列表（optionalAuth）
 * GET    /api/v1/roadmap/stats                       — Hero 統計（optionalAuth）
 * POST   /api/v1/roadmap/items/:externalId/supports  — 投票（authenticate）
 * DELETE /api/v1/roadmap/items/:externalId/supports  — 取消投票（authenticate）
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { roadmapController } from '../controllers/roadmap.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  listRoadmapItemsQuerySchema,
  supportItemParamSchema,
  listRoadmapItemsApiResponseSchema,
  roadmapStatsApiResponseSchema,
  toggleSupportApiResponseSchema,
} from '../validators/roadmap.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/roadmap/items',
  tags: ['Roadmap'],
  summary: '公開看板項目列表',
  description: '公開免登入唯讀；status 分頁（all/scheduled/discussing/done），登入時回傳 voted',
  request: { query: listRoadmapItemsQuerySchema },
  responses: {
    200: {
      description: '看板項目列表',
      content: { 'application/json': { schema: listRoadmapItemsApiResponseSchema } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/roadmap/stats',
  tags: ['Roadmap'],
  summary: 'Hero 統計',
  description: '回傳 { partners, feedback }，Redis 快取 1 小時',
  responses: {
    200: {
      description: '統計資料',
      content: { 'application/json': { schema: roadmapStatsApiResponseSchema } },
    },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/roadmap/items/{externalId}/supports',
  tags: ['Roadmap'],
  summary: '投票支持',
  description: '登入使用者對項目投票（冪等）；回傳最新票數與 voted',
  request: { params: supportItemParamSchema },
  responses: {
    200: {
      description: '投票結果',
      content: { 'application/json': { schema: toggleSupportApiResponseSchema } },
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/roadmap/items/{externalId}/supports',
  tags: ['Roadmap'],
  summary: '取消投票',
  description: '登入使用者取消對項目的投票（冪等）；回傳最新票數與 voted',
  request: { params: supportItemParamSchema },
  responses: {
    200: {
      description: '取消投票結果',
      content: { 'application/json': { schema: toggleSupportApiResponseSchema } },
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Express 路由定義
// ============================================================================

router.get(
  '/items',
  optionalAuth,
  validate(listRoadmapItemsQuerySchema, 'query'),
  roadmapController.listItems as RequestHandler,
);

router.get('/stats', optionalAuth, roadmapController.getStats as RequestHandler);

router.post(
  '/items/:externalId/supports',
  authenticate,
  validate(supportItemParamSchema, 'params'),
  roadmapController.addSupport as RequestHandler,
);

router.delete(
  '/items/:externalId/supports',
  authenticate,
  validate(supportItemParamSchema, 'params'),
  roadmapController.removeSupport as RequestHandler,
);

export default router;
