/**
 * Follow validation schemas
 * Using Zod for input validation with OpenAPI metadata
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

const FOLLOW_TARGET_TYPES = ['user', 'practice'] as const;

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Body schema for POST /api/v1/follows
 */
export const followTargetSchema = z.object({
  targetType: z.enum(FOLLOW_TARGET_TYPES).openapi({
    description: '關注對象類型',
    example: 'user',
  }),
  targetId: z.string().trim().min(1, 'Target ID cannot be empty').openapi({
    description: '關注對象的唯一識別碼（external_id）',
    example: 'abc123',
  }),
}).openapi('FollowTargetBody');

/**
 * Path params for DELETE /api/v1/follows/:targetType/:targetId
 */
export const followParamsSchema = z.object({
  targetType: z.enum(FOLLOW_TARGET_TYPES),
  targetId: z.string().trim().min(1),
}).openapi('FollowParams');

/**
 * Query params for GET /api/v1/users/:userId/followers | /following
 */
export const followQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1).openapi({ description: '頁碼', example: 1 }),
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({ description: '每頁筆數', example: 20 }),
}).openapi('FollowQuery');

export const userIdParamSchema = z.object({
  userId: z.string().trim().min(1).openapi({ description: '用戶 external_id', example: 'abc123' }),
}).openapi('UserIdParam');

// ============================================================================
// Response Schemas
// ============================================================================

const followItemSchema = z.object({
  userId:    z.number().openapi({ description: '用戶內部 ID' }),
  externalId: z.string().openapi({ description: '用戶 external_id' }),
  nickname:  z.string().nullable().openapi({ description: '用戶暱稱' }),
  followedAt: z.string().openapi({ description: '關注時間 ISO 8601' }),
}).openapi('FollowItem');

export const followListApiResponseSchema = apiSuccessResponseSchema(
  z.array(followItemSchema)
).openapi('FollowListApiResponse');

export const followActionApiResponseSchema = apiSuccessResponseSchema(
  z.object({ message: z.string() })
).openapi('FollowActionApiResponse');

// ============================================================================
// OpenAPI Component Registration
// ============================================================================

registry.register('FollowTargetBody', followTargetSchema);
registry.register('FollowListApiResponse', followListApiResponseSchema);
registry.register('FollowActionApiResponse', followActionApiResponseSchema);

// ============================================================================
// Type Exports
// ============================================================================

export type FollowTargetBody = z.infer<typeof followTargetSchema>;
export type FollowParams     = z.infer<typeof followParamsSchema>;
export type FollowCheckParams = z.infer<typeof followParamsSchema>;
export type FollowQuery      = z.infer<typeof followQuerySchema>;
