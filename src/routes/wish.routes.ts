/**
 * Wish Routes
 *
 * POST /api/v1/wishes — 提交許願（authenticate）
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { wishController } from '../controllers/wish.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  createWishSchema,
  createWishApiResponseSchema,
  publicWishListQuerySchema,
  wishSupportParamSchema,
} from '../validators/wish.validators';
import { toggleSupportApiResponseSchema } from '../validators/roadmap.validators';

const router = Router();

registry.registerPath({
  method: 'get',
  path: '/api/v1/wishes',
  tags: ['Wishpool'],
  summary: '許願池列表',
  description: '前台公開許願池列表（預設 pending）',
  request: { query: publicWishListQuerySchema },
  responses: {
    200: {
      description: '許願池列表',
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/wishes',
  tags: ['Wishpool'],
  summary: '提交許願',
  description: '登入使用者提交三步驟許願；situation ≥ 10 字；submitter 取登入帳號',
  request: {
    body: { content: { 'application/json': { schema: createWishSchema } } },
  },
  responses: {
    201: {
      description: '許願已建立',
      content: { 'application/json': { schema: createWishApiResponseSchema } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/wishes/{externalId}/supports',
  tags: ['Wishpool'],
  summary: '許願池項目投票支持',
  description: '登入使用者對許願池項目投票（冪等）；回傳最新票數與 voted',
  request: { params: wishSupportParamSchema },
  responses: {
    200: {
      description: '投票結果',
      content: { 'application/json': { schema: toggleSupportApiResponseSchema } },
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/wishes/{externalId}/supports',
  tags: ['Wishpool'],
  summary: '取消許願池項目投票',
  description: '登入使用者取消對許願池項目的投票（冪等）；回傳最新票數與 voted',
  request: { params: wishSupportParamSchema },
  responses: {
    200: {
      description: '取消投票結果',
      content: { 'application/json': { schema: toggleSupportApiResponseSchema } },
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

router.get(
  '/',
  optionalAuth,
  validate(publicWishListQuerySchema, 'query'),
  wishController.listPublic as RequestHandler,
);

router.post(
  '/',
  authenticate,
  validate(createWishSchema, 'body'),
  wishController.createWish as RequestHandler,
);

router.post(
  '/:externalId/supports',
  authenticate,
  validate(wishSupportParamSchema, 'params'),
  wishController.addSupport as RequestHandler,
);

router.delete(
  '/:externalId/supports',
  authenticate,
  validate(wishSupportParamSchema, 'params'),
  wishController.removeSupport as RequestHandler,
);

export default router;
