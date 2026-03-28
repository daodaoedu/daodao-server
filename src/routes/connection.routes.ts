/**
 * Connection Routes
 * 連結系統路由定義（含 OpenAPI registry）
 */

import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  sendRequest,
  updateRequest,
  withdrawRequest,
  disconnect,
  getConnections,
  getIncomingRequests,
  getOutgoingRequests,
} from '../controllers/connection.controller';
import {
  sendRequestBodySchema,
  updateRequestBodySchema,
  connectionQuerySchema,
  requestIdParamSchema,
  userExternalIdParamSchema,
  connectionListApiResponseSchema,
  connectionRequestListApiResponseSchema,
  connectionActionApiResponseSchema,
} from '../validators/connection.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method:  'post',
  path:    '/api/v1/connections/request',
  tags:    ['Connection'],
  summary: '發送連結請求',
  request: {
    body: { content: { 'application/json': { schema: sendRequestBodySchema } } },
  },
  responses: {
    201: { description: '請求已送出', content: { 'application/json': { schema: connectionActionApiResponseSchema } } },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'patch',
  path:    '/api/v1/connections/request/{requestId}',
  tags:    ['Connection'],
  summary: '接受或拒絕連結請求',
  request: {
    params: requestIdParamSchema,
    body:   { content: { 'application/json': { schema: updateRequestBodySchema } } },
  },
  responses: {
    200: { description: '操作成功', content: { 'application/json': { schema: connectionActionApiResponseSchema } } },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'delete',
  path:    '/api/v1/connections/request/{requestId}',
  tags:    ['Connection'],
  summary: '撤回連結請求',
  request: { params: requestIdParamSchema },
  responses: {
    200: { description: '撤回成功', content: { 'application/json': { schema: connectionActionApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'delete',
  path:    '/api/v1/connections/{userId}',
  tags:    ['Connection'],
  summary: '解除連結（取消夥伴關係）',
  request: { params: userExternalIdParamSchema },
  responses: {
    200: { description: '解除成功', content: { 'application/json': { schema: connectionActionApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'get',
  path:    '/api/v1/connections',
  tags:    ['Connection'],
  summary: '取得我的夥伴列表',
  request: { query: connectionQuerySchema },
  responses: {
    200: { description: '成功', content: { 'application/json': { schema: connectionListApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'get',
  path:    '/api/v1/connections/requests/incoming',
  tags:    ['Connection'],
  summary: '取得收到的連結請求',
  request: { query: connectionQuerySchema },
  responses: {
    200: { description: '成功', content: { 'application/json': { schema: connectionRequestListApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'get',
  path:    '/api/v1/connections/requests/outgoing',
  tags:    ['Connection'],
  summary: '取得發出的連結請求',
  request: { query: connectionQuerySchema },
  responses: {
    200: { description: '成功', content: { 'application/json': { schema: connectionRequestListApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Express 路由
// ============================================================================

// 靜態子路徑優先於動態路徑
router.get('/requests/incoming',
  authenticate,
  validate(connectionQuerySchema, 'query'),
  getIncomingRequests
);

router.get('/requests/outgoing',
  authenticate,
  validate(connectionQuerySchema, 'query'),
  getOutgoingRequests
);

router.post('/request',
  authenticate,
  validate(sendRequestBodySchema, 'body'),
  sendRequest
);

router.patch('/request/:requestId',
  authenticate,
  validate(requestIdParamSchema, 'params'),
  validate(updateRequestBodySchema, 'body'),
  updateRequest
);

router.delete('/request/:requestId',
  authenticate,
  validate(requestIdParamSchema, 'params'),
  withdrawRequest
);

router.get('/',
  authenticate,
  validate(connectionQuerySchema, 'query'),
  getConnections
);

router.delete('/:userId',
  authenticate,
  disconnect
);

export default router;
