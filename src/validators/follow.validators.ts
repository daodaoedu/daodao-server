/**
 * Follow validation schemas
 * Using Zod for input validation with OpenAPI metadata
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema, paginatedApiResponseSchema } from './api-response.validators';

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

// followers／following 的 service 都用 createPaginatedResponse 回 { data, pagination }；
// 用 apiSuccessResponseSchema 會被 zod 把 pagination 剝掉（Codex review on daodao#238 抓到），要用 paginated 版
export const followListApiResponseSchema = paginatedApiResponseSchema(
  followItemSchema
).openapi('FollowListApiResponse');

/**
 * GET /users/:userId/following 的 item 與 followers 不同形：依 targetType 分流 user／practice
 *（對應 follow.service.ts 的 FollowingItem）。daodao#238：之前拿 followers schema 驗這條，有關注就 400。
 */
const followingUserProfileSchema = z.object({
  id:         z.string().openapi({ description: '被關注用戶 external_id' }),
  name:       z.string().openapi({ description: '暱稱' }),
  photoURL:   z.string().nullable().openapi({ description: '頭像 URL' }),
  bio:        z.string().nullable().openapi({ description: '個人標語' }),
  identifier: z.string().nullable().openapi({ description: '自訂 ID（custom_id）' }),
}).openapi('FollowingUserProfile');

const followingPracticeProfileSchema = z.object({
  id:            z.string().openapi({ description: '主題實踐 external_id' }),
  title:         z.string().openapi({ description: '主題實踐標題' }),
  ownerName:     z.string().openapi({ description: '擁有者暱稱' }),
  ownerPhotoURL: z.string().nullable().openapi({ description: '擁有者頭像 URL' }),
}).openapi('FollowingPracticeProfile');

const followingItemSchema = z.discriminatedUnion('targetType', [
  z.object({
    targetType: z.literal('user'),
    // service 在目標已被刪除時會給 undefined，前端據此顯示空卡；不能因此 400
    user:       followingUserProfileSchema.optional(),
  }).strict(),  // service 明確組物件；strict 讓「targetType 與 payload 對不上」在 server 端就爆，不會混進前端
  z.object({
    targetType: z.literal('practice'),
    practice:   followingPracticeProfileSchema.optional(),
  }).strict(),
]).openapi('FollowingItem');

export const followingListApiResponseSchema = paginatedApiResponseSchema(
  followingItemSchema
).openapi('FollowingListApiResponse');

export const followActionApiResponseSchema = apiSuccessResponseSchema(
  z.object({ message: z.string() })
).openapi('FollowActionApiResponse');

// ============================================================================
// OpenAPI Component Registration
// ============================================================================

registry.register('FollowTargetBody', followTargetSchema);
registry.register('FollowListApiResponse', followListApiResponseSchema);
registry.register('FollowingListApiResponse', followingListApiResponseSchema);
registry.register('FollowActionApiResponse', followActionApiResponseSchema);

// ============================================================================
// Type Exports
// ============================================================================

export type FollowTargetBody = z.infer<typeof followTargetSchema>;
export type FollowParams     = z.infer<typeof followParamsSchema>;
export type FollowCheckParams = z.infer<typeof followParamsSchema>;
export type FollowQuery      = z.infer<typeof followQuerySchema>;
