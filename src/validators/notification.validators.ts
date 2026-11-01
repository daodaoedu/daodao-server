/**
 * Notification validation schemas
 * 通知系統的 Zod 驗證 schema
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * GET /api/v1/notifications 查詢參數
 */
export const notificationQuerySchema = z.object({
  cursor: z.string().optional().openapi({
    description: '分頁游標（上一頁最後一筆通知的 cursor）',
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({
    description: '每頁筆數（1-100，預設 20）',
    example: 20,
  }),
}).openapi('NotificationQuery');

/**
 * PATCH /api/v1/notifications/:id/read 路徑參數
 */
export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().min(1).openapi({
    description: '通知 ID',
    example: 1,
  }),
}).openapi('NotificationIdParam');

/**
 * PUT /api/v1/notifications/preferences 請求 body
 */
export const updatePreferencesBodySchema = z.object({
  globalEnabled: z.boolean().optional().openapi({
    description: '是否全域啟用通知',
    example: true,
  }),
  preferences: z.array(
    z.object({
      type:      z.string().openapi({ description: '通知類型', example: 'buddy_request' }),
      channel:   z.enum(['N01', 'N02', 'N03']).openapi({ description: '通知渠道（N01=Email, N02=In-App, N03=Push）', example: 'N01' }),
      isEnabled: z.boolean().openapi({ description: '是否啟用', example: true }),
    })
  ).optional().openapi({ description: '通知偏好設定列表' }),
}).openapi('UpdateNotificationPreferencesBody');

// ============================================================================
// Response Schemas
// ============================================================================

export const notificationActorSchema = z.object({
  id:       z.number().openapi({ description: '發送者 ID', example: 42 }),
  nickname: z.string().nullable().openapi({ description: '發送者暱稱', example: '小明' }),
}).openapi('NotificationActor');

export const notificationItemSchema = z.object({
  id:                z.number().openapi({ description: '通知 ID', example: 1 }),
  type:              z.string().openapi({ description: '通知類型', example: 'buddy_request' }),
  entity_type:       z.string().nullable().openapi({ description: '關聯實體類型', example: 'practice' }),
  entity_id:         z.string().nullable().openapi({ description: '關聯實體 ID', example: '550e8400' }),
  priority:          z.string().openapi({ description: '優先級', example: 'normal' }),
  is_read:           z.boolean().openapi({ description: '是否已讀', example: false }),
  aggregation_key:   z.string().nullable().openapi({ description: '聚合鍵', example: null }),
  aggregation_count: z.number().openapi({ description: '聚合數量', example: 1 }),
  created_at:        z.string().openapi({ description: '建立時間（ISO 8601）', example: '2024-01-15T10:30:00.000Z' }),
  actor:             notificationActorSchema.nullable().openapi({ description: '發送者資訊' }),
  entityTitle: z.string().optional().openapi({ description: '通知關聯內容的名稱', example: '學習地圖' }),
  cohortName: z.string().optional().openapi({ description: '場次名稱；歷史資料可能缺少', example: '夏季期' }),
  message: z.string().optional().openapi({ description: '事件說明', example: '你收到「夏季期」的加入邀請。' }),
  url: z.string().optional().openapi({ description: '有可用目的頁時提供的連結', example: 'https://app.daodao.so/cohorts/join/invitation-token' }),
}).openapi('NotificationItem');

export const notificationListDataSchema = z.object({
  notifications: z.array(notificationItemSchema).openapi({ description: '通知列表' }),
  nextCursor:    z.string().nullable().openapi({ description: '下一頁游標', example: null }),
  unreadCount:   z.number().openapi({ description: '未讀通知數', example: 3 }),
}).openapi('NotificationListData');

export const notificationListApiResponseSchema = apiSuccessResponseSchema(
  notificationListDataSchema
).openapi('NotificationListApiResponse');

export const preferenceItemSchema = z.object({
  type:      z.string().openapi({ description: '通知類型', example: 'buddy_request' }),
  channel:   z.string().openapi({ description: '通知渠道', example: 'N01' }),
  isEnabled: z.boolean().openapi({ description: '是否啟用', example: true }),
}).openapi('NotificationPreferenceItem');

export const notificationPreferencesApiResponseSchema = apiSuccessResponseSchema(
  z.array(preferenceItemSchema)
).openapi('NotificationPreferencesApiResponse');

export const notificationActionApiResponseSchema = apiSuccessResponseSchema(
  z.object({ message: z.string() })
).openapi('NotificationActionApiResponse');

export const unsubscribeHtmlResponseSchema = z.object({
  html: z.string(),
}).openapi('UnsubscribeHtmlResponse');

// ============================================================================
// OpenAPI Component Registration
// ============================================================================

registry.register('NotificationItem',                   notificationItemSchema);
registry.register('NotificationListData',               notificationListDataSchema);
registry.register('NotificationListApiResponse',        notificationListApiResponseSchema);
registry.register('NotificationPreferencesApiResponse', notificationPreferencesApiResponseSchema);

// ============================================================================
// Type Exports
// ============================================================================

export type NotificationQuery           = z.infer<typeof notificationQuerySchema>;
export type NotificationIdParam         = z.infer<typeof notificationIdParamSchema>;
export type UpdatePreferencesBody       = z.infer<typeof updatePreferencesBodySchema>;
export type NotificationActor           = z.infer<typeof notificationActorSchema>;
export type NotificationItem            = z.infer<typeof notificationItemSchema>;
export type NotificationListData        = z.infer<typeof notificationListDataSchema>;
export type PreferenceItem              = z.infer<typeof preferenceItemSchema>;
