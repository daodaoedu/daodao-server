/**
 * Wish Routes
 *
 * POST /api/v1/wishes — 提交許願（authenticate）
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { wishController } from '../controllers/wish.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { createWishSchema, createWishApiResponseSchema } from '../validators/wish.validators';

const router = Router();

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

router.post(
  '/',
  authenticate,
  validate(createWishSchema, 'body'),
  wishController.createWish as RequestHandler,
);

export default router;
