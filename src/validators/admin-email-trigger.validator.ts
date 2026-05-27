/**
 * Admin 觸發式信件驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * 建立觸發規則 schema
 */
export const createTriggerRuleSchema = z.object({
  name: z.string().min(1).max(200),
  conditionType: z.enum(['dormant_days', 'no_action_days', 'tag_change']),
  conditionValue: z.string().min(1),
  templateId: z.coerce.number().int().positive(),
  isEnabled: z.boolean().optional().default(true),
});

/**
 * 更新觸發規則 schema
 */
export const updateTriggerRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  conditionType: z.enum(['dormant_days', 'no_action_days', 'tag_change']).optional(),
  conditionValue: z.string().min(1).optional(),
  templateId: z.coerce.number().int().positive().optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * 建立信件模板 schema
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  variables: z.array(z.string()).optional().default([]),
});

/**
 * 更新信件模板 schema
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
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
 * 模板 ID 參數 schema
 */
export const templateIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
