/**
 * Buddy Request validation schemas
 * Buddy 請求系統的 Zod 驗證 schema
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * POST /api/v1/practices/:id/buddy-requests
 */
export const createBuddyRequestBodySchema = z.object({
  receiverExternalId: z.string().trim().min(1).openapi({
    description: '被請求的用戶 external_id',
    example: 'abc123',
  }),
}).openapi('CreateBuddyRequestBody');

/**
 * PATCH /api/v1/buddy-requests/:id
 */
export const updateBuddyRequestBodySchema = z.object({
  status: z.enum(['accepted', 'ignored']).openapi({
    description: '對 Buddy 請求的回應動作',
    example: 'accepted',
  }),
}).openapi('UpdateBuddyRequestBody');

/**
 * GET /api/v1/buddy-requests 分頁查詢
 */
export const buddyRequestQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).openapi('BuddyRequestQuery');

export const buddyRequestIdParamSchema = z.object({
  id: z.coerce.number().int().min(1).openapi({
    description: 'Buddy 請求 ID',
    example: 1,
  }),
}).openapi('BuddyRequestIdParam');

export const practiceIdParamSchema = z.object({
  id: z.string().trim().min(1).openapi({
    description: '實踐 external_id',
    example: 'practice-uuid-123',
  }),
}).openapi('PracticeExternalIdParam');

// ============================================================================
// Response Schemas
// ============================================================================

const buddyRequestItemSchema = z.object({
  requestId:          z.number(),
  requesterExternalId: z.string(),
  requesterNickname:   z.string().nullable(),
  practiceId:         z.number(),
  practiceTitle:      z.string(),
  createdAt:          z.string(),
}).openapi('BuddyRequestItem');

export const buddyRequestListApiResponseSchema = apiSuccessResponseSchema(
  z.array(buddyRequestItemSchema)
).openapi('BuddyRequestListApiResponse');

export const buddyRequestActionApiResponseSchema = apiSuccessResponseSchema(
  z.object({ message: z.string() })
).openapi('BuddyRequestActionApiResponse');

// ============================================================================
// OpenAPI Component Registration
// ============================================================================

registry.register('CreateBuddyRequestBody',        createBuddyRequestBodySchema);
registry.register('BuddyRequestListApiResponse',   buddyRequestListApiResponseSchema);
registry.register('BuddyRequestActionApiResponse', buddyRequestActionApiResponseSchema);

// ============================================================================
// Type Exports
// ============================================================================

export type CreateBuddyRequestBody = z.infer<typeof createBuddyRequestBodySchema>;
export type UpdateBuddyRequestBody = z.infer<typeof updateBuddyRequestBodySchema>;
export type BuddyRequestQuery      = z.infer<typeof buddyRequestQuerySchema>;
