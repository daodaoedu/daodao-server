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
  description: z.string().max(500).optional(),
  triggerType: z.string().min(1),
  triggerConfig: z.record(z.string(), z.unknown()).optional().default({}),
  template: z.string().min(1),
  subject: z.string().min(1).max(500).optional().default(''),
  enabled: z.boolean().optional().default(true),
});

/**
 * 更新觸發規則 schema
 */
export const updateTriggerRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  triggerType: z.string().min(1).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  template: z.string().min(1).optional(),
  subject: z.string().min(1).max(500).optional(),
  enabled: z.boolean().optional(),
});

/**
 * 建立信件模板 schema
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  preheader: z.string().max(300).optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional().default([]),
  dataSource: z.enum(['user', 'practice', 'event', 'none']).optional().default('none'),
  isActive: z.boolean().optional().default(true),
  slug: z.string().max(100).optional(),
});

/**
 * 更新信件模板 schema
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  preheader: z.string().max(300).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  dataSource: z.enum(['user', 'practice', 'event', 'none']).optional(),
  isActive: z.boolean().optional(),
  slug: z.string().max(100).optional(),
});

/**
 * 取得信件模板 schema（ID 參數）
 */
export const getTemplateSchema = z.object({
  id: z.coerce.number().int().positive(),
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
