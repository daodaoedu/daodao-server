/**
 * Admin 信任等級驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * 晉升條件 schema
 */
const promotionCriteriaSchema = z.object({
  readCount: z.coerce.number().int().nonnegative(),
  postCount: z.coerce.number().int().nonnegative(),
  daysVisited: z.coerce.number().int().nonnegative(),
  likesGiven: z.coerce.number().int().nonnegative(),
  likesReceived: z.coerce.number().int().nonnegative(),
});

/**
 * 更新信任等級設定 schema
 */
export const updateTrustConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  promotionCriteria: promotionCriteriaSchema.partial().optional(),
  unlockedAbilities: z.array(z.string().min(1)).optional(),
});

/**
 * 覆寫用戶信任等級 schema
 */
export const overrideUserTrustLevelSchema = z.object({
  level: z.coerce.number().int().min(0).max(3),
});

/**
 * 建立用戶群組 schema
 */
export const createUserGroupSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string().min(1)).optional().default([]),
});

/**
 * 更新用戶群組 schema
 */
export const updateUserGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string().min(1)).optional(),
});

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 信任等級參數 schema
 */
export const trustLevelParamSchema = z.object({
  level: z.coerce.number().int().min(0).max(3),
});

/**
 * 用戶 ID 參數 schema
 */
export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

/**
 * 群組 ID 參數 schema
 */
export const groupIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * 分頁查詢 schema
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});
