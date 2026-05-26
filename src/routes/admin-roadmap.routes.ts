/**
 * Admin Roadmap Routes（掛載於 /api/v1/admin）
 *
 * GET   /api/v1/admin/wishes                 — 許願收件匣列表
 * POST  /api/v1/admin/wishes/:id/link        — 歸入既有項目
 * POST  /api/v1/admin/wishes/:id/promote     — 促成新項目並歸併
 * POST  /api/v1/admin/wishes/:id/archive     — 封存許願
 * POST  /api/v1/admin/roadmap/items          — 建立項目
 * PATCH /api/v1/admin/roadmap/items/:id      — 編輯項目（status→done 觸發通知）
 * GET   /api/v1/admin/roadmap/reports        — 趨勢報表
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { adminRoadmapController } from '../controllers/admin-roadmap.controller';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  adminWishListQuerySchema,
  adminWishIdParamSchema,
  linkWishSchema,
  promoteWishSchema,
} from '../validators/wish.validators';
import {
  adminItemIdParamSchema,
  adminRoadmapItemListQuerySchema,
  createRoadmapItemSchema,
  updateRoadmapItemSchema,
  roadmapReportQuerySchema,
} from '../validators/roadmap.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/wishes',
  tags: ['Admin Roadmap'],
  summary: '許願收件匣列表',
  request: { query: adminWishListQuerySchema },
  responses: {
    200: { description: '許願列表' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/wishes/{id}/link',
  tags: ['Admin Roadmap'],
  summary: '歸入既有項目',
  request: {
    params: adminWishIdParamSchema,
    body: { content: { 'application/json': { schema: linkWishSchema } } },
  },
  responses: {
    200: { description: '已歸併' },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/wishes/{id}/promote',
  tags: ['Admin Roadmap'],
  summary: '促成新項目並歸併',
  request: {
    params: adminWishIdParamSchema,
    body: { content: { 'application/json': { schema: promoteWishSchema } } },
  },
  responses: {
    201: { description: '已促成並歸併' },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/wishes/{id}/archive',
  tags: ['Admin Roadmap'],
  summary: '封存許願',
  request: { params: adminWishIdParamSchema },
  responses: {
    200: { description: '已封存' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/roadmap/items',
  tags: ['Admin Roadmap'],
  summary: '路線圖項目列表（含非公開）',
  request: { query: adminRoadmapItemListQuerySchema },
  responses: {
    200: { description: '項目列表' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/roadmap/items',
  tags: ['Admin Roadmap'],
  summary: '建立路線圖項目',
  request: {
    body: { content: { 'application/json': { schema: createRoadmapItemSchema } } },
  },
  responses: {
    201: { description: '已建立' },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/roadmap/items/{id}',
  tags: ['Admin Roadmap'],
  summary: '編輯路線圖項目',
  description: 'status→done 時寫 shipped_at 並通知所有支持者一次',
  request: {
    params: adminItemIdParamSchema,
    body: { content: { 'application/json': { schema: updateRoadmapItemSchema } } },
  },
  responses: {
    200: { description: '已更新' },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/roadmap/reports',
  tags: ['Admin Roadmap'],
  summary: '趨勢報表',
  request: { query: roadmapReportQuerySchema },
  responses: {
    200: { description: '四指標報表' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Express 路由定義（全部需 admin 權限）
// ============================================================================

router.use(authenticateAny as RequestHandler, requireAdmin as RequestHandler);

router.get(
  '/wishes',
  validate(adminWishListQuerySchema, 'query'),
  adminRoadmapController.listWishes as RequestHandler,
);

router.post(
  '/wishes/:id/link',
  validate(adminWishIdParamSchema, 'params'),
  validate(linkWishSchema, 'body'),
  adminRoadmapController.linkWish as RequestHandler,
);

router.post(
  '/wishes/:id/promote',
  validate(adminWishIdParamSchema, 'params'),
  validate(promoteWishSchema, 'body'),
  adminRoadmapController.promoteWish as RequestHandler,
);

router.post(
  '/wishes/:id/archive',
  validate(adminWishIdParamSchema, 'params'),
  adminRoadmapController.archiveWish as RequestHandler,
);

router.get(
  '/roadmap/items',
  validate(adminRoadmapItemListQuerySchema, 'query'),
  adminRoadmapController.listItems as RequestHandler,
);

router.post(
  '/roadmap/items',
  validate(createRoadmapItemSchema, 'body'),
  adminRoadmapController.createItem as RequestHandler,
);

router.patch(
  '/roadmap/items/:id',
  validate(adminItemIdParamSchema, 'params'),
  validate(updateRoadmapItemSchema, 'body'),
  adminRoadmapController.updateItem as RequestHandler,
);

router.get(
  '/roadmap/reports',
  validate(roadmapReportQuerySchema, 'query'),
  adminRoadmapController.getReport as RequestHandler,
);

export default router;
