/**
 * Reaction Routes
 *
 * POST   /api/v1/reactions        — upsert（新增或更換反應）
 * DELETE /api/v1/reactions        — remove（取消反應）
 * GET    /api/v1/reactions        — 取得目標反應計數
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { reactionController } from '../controllers/reaction.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  upsertReactionSchema,
  removeReactionSchema,
  getReactionsQuerySchema,
  getReactionsApiResponseSchema,
  getReactionsListQuerySchema,
  getReactionsListApiResponseSchema,
} from '../validators/reaction.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/reactions',
  tags: ['Reactions'],
  summary: '新增或更換反應',
  description: '對指定目標送出快速反應；同一用戶同一目標只保留一筆（UPSERT）',
  request: {
    body: {
      content: { 'application/json': { schema: upsertReactionSchema } },
    },
  },
  responses: {
    200: {
      description: '反應已更新，回傳最新計數',
      content: { 'application/json': { schema: getReactionsApiResponseSchema } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/reactions',
  tags: ['Reactions'],
  summary: '取消反應',
  description: '刪除當前用戶對指定目標的反應',
  request: {
    body: {
      content: { 'application/json': { schema: removeReactionSchema } },
    },
  },
  responses: {
    200: {
      description: '反應已刪除，回傳最新計數',
      content: { 'application/json': { schema: getReactionsApiResponseSchema } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reactions',
  tags: ['Reactions'],
  summary: '取得反應計數',
  description: '取得指定目標的各類型反應計數與當前用戶狀態',
  request: {
    query: getReactionsQuerySchema,
  },
  responses: {
    200: {
      description: '成功取得反應資料',
      content: { 'application/json': { schema: getReactionsApiResponseSchema } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reactions/list',
  tags: ['Reactions'],
  summary: '取得個別用戶反應列表',
  description: '取得指定目標的每位反應用戶詳細資料（含名稱、頭像、反應類型、時間）',
  request: {
    query: getReactionsListQuerySchema,
  },
  responses: {
    200: {
      description: '成功取得反應列表',
      content: { 'application/json': { schema: getReactionsListApiResponseSchema } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
});

// ============================================================================
// Express 路由定義
// ============================================================================

router.post(
  '/',
  authenticate,
  validate(upsertReactionSchema, 'body'),
  reactionController.upsertReaction as RequestHandler,
);

router.delete(
  '/',
  authenticate,
  validate(removeReactionSchema, 'body'),
  reactionController.removeReaction as RequestHandler,
);

router.get(
  '/',
  optionalAuth,
  validate(getReactionsQuerySchema, 'query'),
  reactionController.getReactions as RequestHandler,
);

router.get(
  '/list',
  optionalAuth,
  validate(getReactionsListQuerySchema, 'query'),
  reactionController.getReactionsList as RequestHandler,
);

export default router;
