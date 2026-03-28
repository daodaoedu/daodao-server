/**
 * Notification Routes
 * 通知偏好設定與通知列表路由定義（含 OpenAPI registry）
 */

import { z } from 'zod';
import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { strictLimiter } from '../middleware/rate-limit.middleware';
import {
  getPreferences,
  updatePreferences,
  getNotifications,
  markAsRead,
  markAllAsRead,
  unsubscribeEmail,
} from '../controllers/notification.controller';
import {
  notificationQuerySchema,
  notificationIdParamSchema,
  updatePreferencesBodySchema,
  notificationListApiResponseSchema,
  notificationPreferencesApiResponseSchema,
  notificationActionApiResponseSchema,
} from '../validators/notification.validators';

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method:  'get',
  path:    '/api/v1/notifications/unsubscribe',
  tags:    ['Notification'],
  summary: '取消訂閱 Email 通知',
  request: {
    query: z.object({ token: z.string() }),
  },
  responses: {
    200: {
      description: '退訂成功 HTML 頁面',
      content: { 'text/html': { schema: z.object({ html: z.string() }) } },
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
});

registry.registerPath({
  method:  'get',
  path:    '/api/v1/notifications/preferences',
  tags:    ['Notification'],
  summary: '取得通知偏好設定',
  responses: {
    200: { description: '成功', content: { 'application/json': { schema: notificationPreferencesApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'put',
  path:    '/api/v1/notifications/preferences',
  tags:    ['Notification'],
  summary: '更新通知偏好設定',
  request: {
    body: { content: { 'application/json': { schema: updatePreferencesBodySchema } } },
  },
  responses: {
    200: { description: '更新成功', content: { 'application/json': { schema: notificationActionApiResponseSchema } } },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'patch',
  path:    '/api/v1/notifications/read-all',
  tags:    ['Notification'],
  summary: '全部標記已讀',
  responses: {
    200: { description: '操作成功', content: { 'application/json': { schema: notificationActionApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'patch',
  path:    '/api/v1/notifications/{id}/read',
  tags:    ['Notification'],
  summary: '標記單則通知已讀',
  request: { params: notificationIdParamSchema },
  responses: {
    200: { description: '操作成功', content: { 'application/json': { schema: notificationActionApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method:  'get',
  path:    '/api/v1/notifications',
  tags:    ['Notification'],
  summary: '取得 In-App 通知列表（含 cursor 分頁與未讀數）',
  request: { query: notificationQuerySchema },
  responses: {
    200: { description: '成功', content: { 'application/json': { schema: notificationListApiResponseSchema } } },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

const router = Router();

// ============================================================================
// 退訂路由（公開，不需登入）
// ============================================================================

// GET  /api/v1/notifications/unsubscribe?token=<jwt>
router.get('/unsubscribe',
  strictLimiter,
  unsubscribeEmail
);

// ============================================================================
// 偏好設定路由
// ============================================================================

// GET  /api/v1/notifications/preferences
router.get('/preferences',
  authenticate,
  getPreferences
);

// PUT  /api/v1/notifications/preferences
router.put('/preferences',
  authenticate,
  updatePreferences
);

// ============================================================================
// 通知列表路由
// 注意：靜態子路徑（/preferences, /read-all）須先於動態路徑（/:id/read）
// ============================================================================

// PATCH /api/v1/notifications/read-all
router.patch('/read-all',
  authenticate,
  markAllAsRead
);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read',
  authenticate,
  markAsRead
);

// GET  /api/v1/notifications
router.get('/',
  authenticate,
  getNotifications
);

export default router;
