/**
 * Wish validation schemas (Zod + zod-to-openapi)
 *
 * 涵蓋使用者許願提交，以及後台收件匣查詢、歸併、促成、封存。
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';
import {
  WISH_CATEGORY_VALUES,
  WISH_STATUS_VALUES,
  ROADMAP_STATUS_VALUES,
} from '../types/wishpool.types';

const categoryEnum = z.enum(WISH_CATEGORY_VALUES);

// ============================================================================
// 使用者許願：Request Schema
// ============================================================================

export const createWishSchema = z
  .object({
    category: categoryEnum.openapi({ description: '許願分類', example: 'practice' }),
    situation: z.string().trim().min(10, '情境描述至少 10 字').openapi({ description: 'Step 2 情境描述（≥ 10 字）' }),
    desire: z.string().trim().min(1, '請描述你的期待').openapi({ description: 'Step 3 期待描述' }),
    contact_email: z.string().trim().email('Email 格式不正確').optional().openapi({ description: '進度通知 email（選填，預設取帳號 email）' }),
  })
  .openapi('CreateWish', { description: '提交許願' });

const createWishResultSchema = z
  .object({ id: z.number().openapi({ description: '建立的許願 id' }) })
  .openapi('CreateWishResult');

export const createWishApiResponseSchema = apiSuccessResponseSchema(createWishResultSchema);

// ============================================================================
// 前台許願池：Request Schema
// ============================================================================

export const publicWishListQuerySchema = z
  .object({
    status: z
      .enum(WISH_STATUS_VALUES)
      .default('pending')
      .openapi({ description: '狀態過濾（預設 pending）', example: 'pending' }),
    category: categoryEnum.optional().openapi({ description: '分類過濾' }),
    cursor: z.string().optional().openapi({ description: '分頁游標（不透明）' }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .openapi({ description: '每頁筆數', example: 20 }),
  })
  .openapi('PublicWishListQuery', { description: '前台許願池列表查詢參數' });

// ============================================================================
// 後台收件匣：Request Schemas
// ============================================================================

export const adminWishListQuerySchema = z
  .object({
    status: z.enum(WISH_STATUS_VALUES).optional().openapi({ description: '狀態過濾' }),
    category: categoryEnum.optional().openapi({ description: '分類過濾' }),
    q: z.string().trim().min(1).optional().openapi({ description: '關鍵字（搜尋 situation/desire）' }),
    cursor: z.string().optional().openapi({ description: '分頁游標（不透明）' }),
    limit: z.coerce.number().int().min(1).max(100).default(20).openapi({ description: '每頁筆數' }),
  })
  .openapi('AdminWishListQuery', { description: '後台許願收件匣查詢參數' });

export const adminWishIdParamSchema = z
  .object({ id: z.coerce.number().int().positive().openapi({ description: '許願內部 id' }) })
  .openapi('AdminWishIdParam');

export const linkWishSchema = z
  .object({
    roadmap_item_id: z.number().int().positive().openapi({ description: '歸入的路線圖項目內部 id' }),
    internal_module_tag: z.string().trim().max(50).optional().openapi({ description: '內部模組子標籤（category=other 時必填）' }),
  })
  .openapi('LinkWish', { description: '將許願歸入既有項目' });

export const promoteWishSchema = z
  .object({
    title: z.string().trim().min(1).max(255).openapi({ description: '對外標題' }),
    description: z.string().trim().min(1).openapi({ description: '對外描述' }),
    category: categoryEnum.openapi({ description: '分類' }),
    status: z.enum(ROADMAP_STATUS_VALUES).optional().openapi({ description: '初始狀態（預設 collected）' }),
    internal_module_tag: z.string().trim().max(50).optional().openapi({ description: '內部模組子標籤（category=other 時必填）' }),
  })
  .openapi('PromoteWish', { description: '以許願促成新項目並歸併' });

// ============================================================================
// Type exports
// ============================================================================

export type CreateWishInput = z.infer<typeof createWishSchema>;
export type PublicWishListQuery = z.infer<typeof publicWishListQuerySchema>;
export const wishSupportParamSchema = z
  .object({
    externalId: z
      .string()
      .regex(/^wish-\d+$/u, 'externalId 應為 wish-<id> 格式')
      .openapi({ description: '許願 external_id（格式：wish-<id>）', example: 'wish-12' }),
  })
  .openapi('WishSupportParam');

export type WishSupportParam = z.infer<typeof wishSupportParamSchema>;
export type AdminWishListQuery = z.infer<typeof adminWishListQuerySchema>;
export type AdminWishIdParam = z.infer<typeof adminWishIdParamSchema>;
export type LinkWishInput = z.infer<typeof linkWishSchema>;
export type PromoteWishInput = z.infer<typeof promoteWishSchema>;

// ============================================================================
// Register with OpenAPI registry
// ============================================================================

registry.register('CreateWish', createWishSchema);
registry.register('LinkWish', linkWishSchema);
registry.register('PromoteWish', promoteWishSchema);
registry.register('PublicWishListQuery', publicWishListQuerySchema);
