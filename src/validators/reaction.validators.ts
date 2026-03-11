/**
 * Reaction validation schemas (Zod + zod-to-openapi)
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';
import { REACTION_TYPE_VALUES } from '../types/reaction.types';

const REACTION_TARGET_TYPES = ['practice', 'comment'] as const;

// ============================================================================
// Request Schemas
// ============================================================================

export const upsertReactionSchema = z.object({
  targetType: z.enum(REACTION_TARGET_TYPES).openapi({
    description: '反應目標類型',
    example: 'practice',
  }),
  targetId: z.string().min(1).openapi({
    description: '目標外部 ID（UUID）',
    example: '32859587-f159-43fd-93e7-fcc890661781',
  }),
  reactionType: z.enum(REACTION_TYPE_VALUES as [string, ...string[]]).openapi({
    description: '反應類型',
    example: 'fire',
    examples: ['useful', 'fire', 'touched', 'curious'],
  }),
}).openapi('UpsertReactionRequest', { description: '新增或更換反應的請求資料' });

export const removeReactionSchema = z.object({
  targetType: z.enum(REACTION_TARGET_TYPES).openapi({
    description: '反應目標類型',
    example: 'practice',
  }),
  targetId: z.string().min(1).openapi({
    description: '目標外部 ID（UUID）',
    example: '32859587-f159-43fd-93e7-fcc890661781',
  }),
}).openapi('RemoveReactionRequest', { description: '刪除反應的請求資料' });

export const getReactionsQuerySchema = z.object({
  targetType: z.enum(REACTION_TARGET_TYPES).openapi({
    description: '反應目標類型',
    example: 'practice',
  }),
  targetId: z.string().min(1).openapi({
    description: '目標外部 ID（UUID）',
    example: '32859587-f159-43fd-93e7-fcc890661781',
  }),
}).openapi('GetReactionsQuery', { description: '查詢反應的參數' });

// ============================================================================
// Response Schemas
// ============================================================================

const reactionCountSchema = z.object({
  type: z.string().openapi({ description: '反應類型', example: 'fire' }),
  count: z.number().openapi({ description: '計數', example: 3 }),
  latestActorName: z.string().nullable().openapi({ description: '最新反應的用戶名稱', example: '王小明' }),
}).openapi('ReactionCount', { description: '單種反應的計數資訊' });

export const getReactionsResponseSchema = z.object({
  reactions: z.array(reactionCountSchema).openapi({ description: '各類型反應計數' }),
  currentUserReaction: z.string().nullable().openapi({ description: '當前用戶的反應類型（未反應為 null）', example: 'fire' }),
}).openapi('GetReactionsResponse', { description: '反應查詢回應' });

export const getReactionsApiResponseSchema = apiSuccessResponseSchema(getReactionsResponseSchema);

// ============================================================================
// Type exports
// ============================================================================

export type UpsertReactionSchema = z.infer<typeof upsertReactionSchema>;
export type RemoveReactionSchema = z.infer<typeof removeReactionSchema>;
export type GetReactionsQuerySchema = z.infer<typeof getReactionsQuerySchema>;

export const getReactionsListQuerySchema = z.object({
  targetType: z.enum(REACTION_TARGET_TYPES).openapi({
    description: '反應目標類型',
    example: 'practice',
  }),
  targetId: z.string().min(1).openapi({
    description: '目標外部 ID（UUID）',
    example: '32859587-f159-43fd-93e7-fcc890661781',
  }),
}).openapi('GetReactionsListQuery', { description: '查詢個別反應列表的參數' });

const reactionListItemSchema = z.object({
  userId: z.string().openapi({ description: '用戶外部 ID（UUID）' }),
  name: z.string().openapi({ description: '用戶名稱' }),
  photoURL: z.string().nullable().openapi({ description: '用戶頭像 URL' }),
  reactionType: z.string().openapi({ description: '反應類型', example: 'fire' }),
  reactedAt: z.string().openapi({ description: '反應時間（ISO 8601）' }),
}).openapi('ReactionListItem', { description: '單筆用戶反應資料' });

const getReactionsListResponseSchema = z.object({
  items: z.array(reactionListItemSchema).openapi({ description: '反應列表' }),
}).openapi('GetReactionsListResponse', { description: '個別用戶反應列表回應' });

export const getReactionsListApiResponseSchema = apiSuccessResponseSchema(getReactionsListResponseSchema);

export type GetReactionsListQuerySchema = z.infer<typeof getReactionsListQuerySchema>;

// ============================================================================
// Register with OpenAPI registry
// ============================================================================

registry.register('ReactionCount', reactionCountSchema);
registry.register('GetReactionsResponse', getReactionsResponseSchema);
registry.register('UpsertReactionRequest', upsertReactionSchema);
registry.register('RemoveReactionRequest', removeReactionSchema);
registry.register('ReactionListItem', reactionListItemSchema);
registry.register('GetReactionsListResponse', getReactionsListResponseSchema);
