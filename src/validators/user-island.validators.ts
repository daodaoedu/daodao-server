/**
 * User Island validation schemas
 * 3D 島嶼頁 islandData 聚合端點的 Zod 驗證 schema（openspec change: island-3d）
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * GET /api/v1/users/:identifier/island 路徑參數
 */
export const userIslandParamsSchema = z.object({
  identifier: z.string().trim().min(1).openapi({
    description: '島主的 custom_id 或 external_id（UUID）',
    example: 'my_custom_id'
  })
}).openapi('UserIslandParams');

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * 島主基本資料
 */
export const islandProfileSchema = z.object({
  id: z.string().openapi({
    description: '島主 external_id（UUID）',
    example: '550e8400-e29b-41d4-a716-446655440000'
  }),
  customId: z.string().nullable().openapi({
    description: '島主 custom_id',
    example: 'my_custom_id'
  }),
  name: z.string().nullable().openapi({
    description: '島主暱稱',
    example: '小島'
  }),
  photoURL: z.string().nullable().openapi({
    description: '島主頭像 URL',
    example: 'https://example.com/avatar.png'
  })
}).openapi('IslandProfile');

/**
 * 島上單一實踐（僅含渲染建築所需欄位，已通過隱私過濾）
 */
export const islandPracticeSchema = z.object({
  id: z.string().openapi({
    description: '實踐 external_id',
    example: '550e8400-e29b-41d4-a716-446655440001'
  }),
  title: z.string().openapi({
    description: '實踐標題',
    example: '每天寫 500 字'
  }),
  status: z.enum(['active', 'completed']).openapi({
    description: '實踐狀態：active 渲染為帳篷＋營火、completed 渲染為小木屋',
    example: 'active'
  }),
  themeColor: z.string().nullable().openapi({
    description: '實踐主題色，建築配色依據',
    example: '#FF6B6B'
  }),
  checkinCount: z.number().int().openapi({
    description: '該實踐的打卡總數（決定周圍植栽數量）',
    example: 12
  }),
  checkinIds: z.array(z.number().int()).openapi({
    description: '該實踐的打卡 id 清單（依 id 升冪；作為植栽種類/位置的 deterministic 種子）',
    example: [101, 102, 103]
  })
}).openapi('IslandPractice');

/**
 * islandData 聚合資料
 */
export const userIslandDataSchema = z.object({
  profile: islandProfileSchema,
  personaType: z.string().nullable().openapi({
    description: 'quiz 人格類型（單字母代碼，如 A/C/D/L/O）；未完成 quiz 為 null，前端渲染中性預設島',
    example: 'D'
  }),
  practices: z.array(islandPracticeSchema).openapi({
    description: '可見實踐清單（已依觀看者關係於 server 端過濾；僅含 active/completed）'
  }),
  recentCheckinCount: z.number().int().openapi({
    description: '近 30 天可見實踐的打卡總量（決定生態熱鬧度）',
    example: 23
  }),
  viewerRelation: z.enum(['self', 'connection', 'visitor']).openapi({
    description: '觀看者與島主的關係：self 島主本人、connection 已連結夥伴、visitor 一般訪客（含未登入）',
    example: 'visitor'
  })
}).openapi('UserIslandData');

/**
 * GET /api/v1/users/:identifier/island 成功回應
 */
export const userIslandResponseSchema = apiSuccessResponseSchema(userIslandDataSchema);

// ============================================================================
// Registry
// ============================================================================

registry.register('UserIslandData', userIslandDataSchema);
registry.register('UserIslandApiResponse', userIslandResponseSchema);

// ============================================================================
// Types
// ============================================================================

export type UserIslandParams = z.infer<typeof userIslandParamsSchema>;
export type UserIslandData = z.infer<typeof userIslandDataSchema>;
export type IslandPracticeDto = z.infer<typeof islandPracticeSchema>;
