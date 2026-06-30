/**
 * Admin 自動審核驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * 建立自動審核規則 schema
 */
export const createAutoModRuleSchema = z.object({
  name: z.string().min(1).max(200),
  pattern: z.string().min(1),
  matchMode: z.enum(['exact', 'wildcard', 'contains']).optional().default('contains'),
  action: z.enum(['delete', 'warn', 'timeout']),
  timeoutMinutes: z.coerce.number().int().positive().optional(),
  isEnabled: z.boolean().optional().default(true),
});

/**
 * 更新自動審核規則 schema
 */
export const updateAutoModRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  pattern: z.string().min(1).optional(),
  matchMode: z.enum(['exact', 'wildcard', 'contains']).optional(),
  action: z.enum(['delete', 'warn', 'timeout']).optional(),
  timeoutMinutes: z.coerce.number().int().positive().optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * 標記佇列處理動作 schema
 */
export const flagQueueActionSchema = z.object({
  action: z.enum(['agree', 'dismiss', 'defer', 'delete', 'silence']),
});

/**
 * 新增封鎖使用者名稱 schema
 */
export const addBlockedUsernameSchema = z.object({
  username: z.string().min(1).max(100),
});

/**
 * 更新社群審核設定 schema
 */
export const updateCommunityModConfigSchema = z.object({
  flagThreshold: z.coerce.number().int().min(1).max(100),
});

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 規則 ID 參數 schema
 */
export const ruleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 詞彙清單 ID 參數 schema
 */
export const wordListIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 標記 ID 參數 schema
 */
export const flagIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 封鎖使用者名稱參數 schema
 */
export const blockedUsernameParamSchema = z.object({
  username: z.string().min(1),
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
