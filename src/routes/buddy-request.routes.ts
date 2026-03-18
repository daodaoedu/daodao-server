/**
 * Buddy Request Routes
 * Buddy 請求系統路由定義（含 OpenAPI registry）
 */

import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  createBuddyRequest,
  updateBuddyRequest,
  getPendingIncoming,
} from '../controllers/buddy-request.controller';
import {
  createBuddyRequestBodySchema,
  updateBuddyRequestBodySchema,
  buddyRequestQuerySchema,
  buddyRequestIdParamSchema,
  practiceIdParamSchema,
  buddyRequestListApiResponseSchema,
  buddyRequestActionApiResponseSchema,
} from '../validators/buddy-request.validators';

// ============================================================================
// Buddy Requests 路由（standalone: /buddy-requests）
// ============================================================================

export const buddyRequestRouter = Router();

registry.registerPath({
  method:  'patch',
  path:    '/api/v1/buddy-requests/{id}',
  tags:    ['BuddyRequest'],
  summary: '接受或忽略 Buddy 請求',
  request: {
    params: buddyRequestIdParamSchema,
    body:   { content: { 'application/json': { schema: updateBuddyRequestBodySchema } } },
  },
  responses: {
    200: { description: '操作成功', content: { 'application/json': { schema: buddyRequestActionApiResponseSchema } } },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'get',
  path:    '/api/v1/buddy-requests',
  tags:    ['BuddyRequest'],
  summary: '查詢收到的待處理 Buddy 請求列表',
  request: { query: buddyRequestQuerySchema },
  responses: {
    200: { description: '成功', content: { 'application/json': { schema: buddyRequestListApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

buddyRequestRouter.get('/',
  authenticate,
  validate(buddyRequestQuerySchema, 'query'),
  getPendingIncoming,
);

buddyRequestRouter.patch('/:id',
  authenticate,
  validate(buddyRequestIdParamSchema, 'params'),
  validate(updateBuddyRequestBodySchema, 'body'),
  updateBuddyRequest,
);

// ============================================================================
// Practices 巢狀路由（nested: /practices/:id/buddy-requests）
// ============================================================================

export const practiceBuddyRequestRouter = Router({ mergeParams: true });

registry.registerPath({
  method:  'post',
  path:    '/api/v1/practices/{id}/buddy-requests',
  tags:    ['BuddyRequest'],
  summary: '發送 Buddy 請求',
  request: {
    params: practiceIdParamSchema,
    body:   { content: { 'application/json': { schema: createBuddyRequestBodySchema } } },
  },
  responses: {
    201: { description: '請求已送出', content: { 'application/json': { schema: buddyRequestActionApiResponseSchema } } },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

practiceBuddyRequestRouter.post('/',
  authenticate,
  validate(createBuddyRequestBodySchema, 'body'),
  createBuddyRequest,
);
