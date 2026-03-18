/**
 * Connection validation schemas
 * 連結系統（Connect）的 Zod 驗證 schema
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * POST /api/v1/connections/request
 */
export const sendRequestBodySchema = z.object({
  receiverExternalId:    z.string().trim().min(1).openapi({
    description: '收到請求的用戶 external_id',
    example:     'abc123',
  }),
  intent: z.string().trim().max(50).optional().openapi({
    description: '連結原因（標準門檻下必填，最多 50 字）',
    example:     '我們都在學 React，希望能互相鼓勵',
  }),
  contextPracticeExternalId: z.string().trim().optional().openapi({
    description: '從主題實踐頁發出時帶入的實踐 external_id（選填）',
  }),
}).openapi('SendConnectionRequestBody');

/**
 * PATCH /api/v1/connections/request/:requestId
 */
export const updateRequestBodySchema = z.object({
  action: z.enum(['accept', 'reject']).openapi({
    description: '對連結請求的回應動作',
    example:     'accept',
  }),
}).openapi('UpdateConnectionRequestBody');

/**
 * GET /api/v1/connections 分頁查詢
 */
export const connectionQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).openapi('ConnectionQuery');

export const requestIdParamSchema = z.object({
  requestId: z.coerce.number().int().min(1).openapi({
    description: '連結請求 ID',
    example:     1,
  }),
}).openapi('RequestIdParam');

export const userExternalIdParamSchema = z.object({
  userId: z.string().trim().min(1).openapi({
    description: '用戶 external_id',
  }),
}).openapi('UserExternalIdParam');

// ============================================================================
// Response Schemas
// ============================================================================

const connectionItemSchema = z.object({
  connectionId:  z.number(),
  userId:        z.number(),
  externalId:    z.string(),
  nickname:      z.string().nullable(),
  connectedAt:   z.string(),
}).openapi('ConnectionItem');

const connectionRequestItemSchema = z.object({
  requestId:          z.number(),
  requesterExternalId: z.string(),
  requesterNickname:   z.string().nullable(),
  intent:             z.string().nullable(),
  interactionCount:   z.number(),
  createdAt:          z.string(),
}).openapi('ConnectionRequestItem');

export const connectionListApiResponseSchema = apiSuccessResponseSchema(
  z.array(connectionItemSchema)
).openapi('ConnectionListApiResponse');

export const connectionRequestListApiResponseSchema = apiSuccessResponseSchema(
  z.array(connectionRequestItemSchema)
).openapi('ConnectionRequestListApiResponse');

export const connectionActionApiResponseSchema = apiSuccessResponseSchema(
  z.object({ message: z.string() })
).openapi('ConnectionActionApiResponse');

export const connectionStatusApiResponseSchema = apiSuccessResponseSchema(
  z.object({
    isConnected:       z.boolean(),
    interactionCount:  z.number(),
    hasBypass:         z.boolean(),
  })
).openapi('ConnectionStatusApiResponse');

// ============================================================================
// OpenAPI Component Registration
// ============================================================================

registry.register('SendConnectionRequestBody',      sendRequestBodySchema);
registry.register('ConnectionListApiResponse',       connectionListApiResponseSchema);
registry.register('ConnectionRequestListApiResponse', connectionRequestListApiResponseSchema);
registry.register('ConnectionActionApiResponse',     connectionActionApiResponseSchema);

// ============================================================================
// Type Exports
// ============================================================================

export type SendRequestBody   = z.infer<typeof sendRequestBodySchema>;
export type UpdateRequestBody = z.infer<typeof updateRequestBodySchema>;
export type ConnectionQuery   = z.infer<typeof connectionQuerySchema>;
