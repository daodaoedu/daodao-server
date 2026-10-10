/**
 * Follow Routes
 * 關注系統路由定義（含 OpenAPI registry）
 */

import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  follow,
  unfollow,
  checkFollow,
  getFollowers,
  getFollowing,
} from '../controllers/follow.controller';
import {
  followTargetSchema,
  followParamsSchema,
  followQuerySchema,
  userIdParamSchema,
  followActionApiResponseSchema,
} from '../validators/follow.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method:  'post',
  path:    '/api/v1/follows',
  tags:    ['Follow'],
  summary: '關注用戶或主題實踐',
  request: {
    body: {
      content: { 'application/json': { schema: followTargetSchema } },
    },
  },
  responses: {
    201: {
      description: '關注成功',
      content: { 'application/json': { schema: followActionApiResponseSchema } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'delete',
  path:    '/api/v1/follows/{targetType}/{targetId}',
  tags:    ['Follow'],
  summary: '取消關注',
  request: { params: followParamsSchema },
  responses: {
    200: {
      description: '取消關注成功',
      content: { 'application/json': { schema: followActionApiResponseSchema } },
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Express 路由
// ============================================================================

// GET /api/v1/follows/check/:targetType/:targetId
router.get('/check/:targetType/:targetId',
  authenticate,
  validate(followParamsSchema, 'params'),
  checkFollow
);

// POST /api/v1/follows
router.post('/',
  authenticate,
  validate(followTargetSchema, 'body'),
  follow
);

// DELETE /api/v1/follows/:targetType/:targetId
router.delete('/:targetType/:targetId',
  authenticate,
  validate(followParamsSchema, 'params'),
  unfollow
);

// GET /api/v1/users/:userId/followers — 掛在 userRoutes 下
export const userFollowRouter = Router();

userFollowRouter.get('/:userId/followers',
  validate(userIdParamSchema, 'params'),
  validate(followQuerySchema, 'query'),
  getFollowers
);

userFollowRouter.get('/:userId/following',
  validate(userIdParamSchema, 'params'),
  validate(followQuerySchema, 'query'),
  getFollowing
);

export default router;
