/**
 * Admin 用戶標籤驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * 建立標籤 schema
 */
export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#6366f1'),
  description: z.string().max(500).optional(),
  type: z.enum(['manual', 'auto']).optional().default('manual'),
});

/**
 * 更新標籤 schema
 */
export const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(500).optional(),
});

/**
 * 建立標籤規則 schema
 */
export const createTagRuleSchema = z.object({
  tagId: z.coerce.number().int().positive(),
  conditionType: z.string().min(1),
  conditionOperator: z.string().optional().default('gt'),
  conditionValue: z.string().min(1),
  logicOperator: z.enum(['AND', 'OR']).optional().default('AND'),
  isEnabled: z.boolean().optional().default(true),
});

/**
 * 更新標籤規則 schema
 */
export const updateTagRuleSchema = z.object({
  conditionType: z.string().min(1).optional(),
  conditionOperator: z.string().optional(),
  conditionValue: z.string().min(1).optional(),
  logicOperator: z.enum(['AND', 'OR']).optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * 批量標籤操作 schema
 */
export const bulkTagSchema = z.object({
  userIds: z.array(z.coerce.number().int().positive()).min(1),
  tagId: z.coerce.number().int().positive(),
  action: z.enum(['add', 'remove']),
});

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 標籤 ID 參數 schema
 */
export const tagIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 規則 ID 參數 schema
 */
export const ruleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
