/**
 * Roadmap validation schemas (Zod + zod-to-openapi)
 *
 * 涵蓋公開看板查詢、Hero 統計、投票，以及後台項目管理與報表。
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema, cursorPaginatedApiResponseSchema } from './api-response.validators';
import {
  WISH_CATEGORY_VALUES,
  ROADMAP_STATUS_VALUES,
  BOARD_TAB_VALUES,
} from '../types/wishpool.types';

const categoryEnum = z.enum(WISH_CATEGORY_VALUES);
const roadmapStatusEnum = z.enum(ROADMAP_STATUS_VALUES);

// ============================================================================
// 公開看板：Request Schemas
// ============================================================================

export const listRoadmapItemsQuerySchema = z
  .object({
    status: z
      .enum(BOARD_TAB_VALUES)
      .default('all')
      .openapi({ description: '看板分頁；scheduled = planned + in_progress', example: 'all' }),
    category: categoryEnum.optional().openapi({ description: '分類過濾', example: 'practice' }),
    cursor: z.string().optional().openapi({ description: '分頁游標（不透明）' }),
    limit: z.coerce.number().int().min(1).max(50).default(20).openapi({ description: '每頁筆數', example: 20 }),
  })
  .openapi('ListRoadmapItemsQuery', { description: '公開看板查詢參數' });

export const supportItemParamSchema = z
  .object({
    externalId: z.string().uuid().openapi({ description: '路線圖項目 external_id（UUID）' }),
  })
  .openapi('RoadmapItemParam', { description: '路線圖項目路徑參數' });

// ============================================================================
// 公開看板：Response Schemas
// ============================================================================

const roadmapItemPublicSchema = z
  .object({
    external_id: z.string().openapi({ description: '對外 UUID' }),
    title: z.string().openapi({ description: '對外標題' }),
    description: z.string().openapi({ description: '對外描述' }),
    category: categoryEnum.openapi({ description: '分類' }),
    status: roadmapStatusEnum.openapi({ description: '狀態' }),
    support_count: z.number().openapi({ description: '票數（去重支持者數）', example: 42 }),
    voted: z.boolean().openapi({ description: '當前使用者是否已投票（未登入恆為 false）' }),
  })
  .openapi('RoadmapItemPublic', { description: '公開看板項目' });

const roadmapStatsSchema = z
  .object({
    partners: z.number().openapi({ description: '曾許願或投票的去重使用者數', example: 128 }),
    feedback: z.number().openapi({ description: '許願總則數', example: 256 }),
  })
  .openapi('RoadmapStats', { description: 'Hero 統計' });

const toggleSupportResultSchema = z
  .object({
    support_count: z.number().openapi({ description: '最新票數' }),
    voted: z.boolean().openapi({ description: '當前使用者投票狀態' }),
  })
  .openapi('ToggleSupportResult', { description: '投票／取消投票結果' });

export const listRoadmapItemsApiResponseSchema = cursorPaginatedApiResponseSchema(roadmapItemPublicSchema);
export const roadmapStatsApiResponseSchema = apiSuccessResponseSchema(roadmapStatsSchema);
export const toggleSupportApiResponseSchema = apiSuccessResponseSchema(toggleSupportResultSchema);

// ============================================================================
// 後台：項目管理 Request Schemas
// ============================================================================

export const adminItemIdParamSchema = z
  .object({ id: z.coerce.number().int().positive().openapi({ description: '路線圖項目內部 id' }) })
  .openapi('AdminRoadmapItemIdParam');

export const createRoadmapItemSchema = z
  .object({
    title: z.string().trim().min(1).max(255).openapi({ description: '對外標題' }),
    description: z.string().trim().min(1).openapi({ description: '對外描述' }),
    category: categoryEnum.openapi({ description: '分類' }),
    status: roadmapStatusEnum.optional().openapi({ description: '初始狀態（預設 collected）' }),
    is_public: z.boolean().optional().openapi({ description: '是否公開' }),
    pinned: z.boolean().optional().openapi({ description: '置頂' }),
    sort_order: z.number().int().optional().openapi({ description: '手動排序' }),
  })
  .openapi('CreateRoadmapItem', { description: '建立路線圖項目' });

export const updateRoadmapItemSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).optional(),
    category: categoryEnum.optional(),
    status: roadmapStatusEnum.optional(),
    is_public: z.boolean().optional(),
    pinned: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: '至少需提供一個欲更新的欄位' })
  .openapi('UpdateRoadmapItem', { description: '更新路線圖項目' });

export const adminRoadmapItemListQuerySchema = z
  .object({
    status: roadmapStatusEnum.optional().openapi({ description: '狀態過濾' }),
    category: categoryEnum.optional().openapi({ description: '分類過濾' }),
    cursor: z.string().optional().openapi({ description: '分頁游標（不透明）' }),
    limit: z.coerce.number().int().min(1).max(100).default(50).openapi({ description: '每頁筆數' }),
  })
  .openapi('AdminRoadmapItemListQuery', { description: '後台路線圖項目列表查詢參數' });

export const roadmapReportQuerySchema = z
  .object({
    range: z.enum(['week', 'month', 'quarter', 'year']).default('month').openapi({ description: '時間範圍（預設本月）' }),
    status: roadmapStatusEnum.optional().openapi({ description: '熱門項目排行的狀態過濾' }),
  })
  .openapi('RoadmapReportQuery', { description: '趨勢報表查詢參數' });

// ============================================================================
// Type exports
// ============================================================================

export type ListRoadmapItemsQuery = z.infer<typeof listRoadmapItemsQuerySchema>;
export type SupportItemParam = z.infer<typeof supportItemParamSchema>;
export type AdminItemIdParam = z.infer<typeof adminItemIdParamSchema>;
export type AdminRoadmapItemListQuery = z.infer<typeof adminRoadmapItemListQuerySchema>;
export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemSchema>;
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>;
export type RoadmapReportQuery = z.infer<typeof roadmapReportQuerySchema>;

// ============================================================================
// Register with OpenAPI registry
// ============================================================================

registry.register('RoadmapItemPublic', roadmapItemPublicSchema);
registry.register('RoadmapStats', roadmapStatsSchema);
registry.register('ToggleSupportResult', toggleSupportResultSchema);
registry.register('CreateRoadmapItem', createRoadmapItemSchema);
registry.register('UpdateRoadmapItem', updateRoadmapItemSchema);
