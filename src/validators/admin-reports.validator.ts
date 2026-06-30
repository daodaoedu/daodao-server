/**
 * Admin 報表與告警驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * 建立排程報表 schema
 */
export const createScheduledReportSchema = z.object({
  name: z.string().min(1).max(200),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  recipients: z.array(z.string().email()).min(1),
  sections: z.array(z.string().min(1)).min(1),
});

/**
 * 更新排程報表 schema
 */
export const updateScheduledReportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recipients: z.array(z.string().email()).min(1).optional(),
  sections: z.array(z.string().min(1)).min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

/**
 * 自訂報表查詢 schema
 */
export const queryCustomReportSchema = z.object({
  fields: z.array(z.string().min(1)).min(1),
});

/**
 * 儲存自訂報表 schema
 */
export const saveReportSchema = z.object({
  name: z.string().min(1).max(200),
  fields: z.array(z.string().min(1)).min(1),
});

/**
 * 建立告警規則 schema
 */
export const createAlertRuleSchema = z.object({
  name: z.string().min(1).max(200),
  metric: z.string().min(1),
  condition: z.enum(['above', 'below', 'change_percent']),
  threshold: z.coerce.number(),
  notifyChannel: z.enum(['email', 'in_app', 'both']).optional().default('email'),
  isEnabled: z.boolean().optional().default(true),
});

/**
 * 更新告警規則 schema
 */
export const updateAlertRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  metric: z.string().min(1).optional(),
  condition: z.enum(['above', 'below', 'change_percent']).optional(),
  threshold: z.coerce.number().optional(),
  notifyChannel: z.enum(['email', 'in_app', 'both']).optional(),
  isEnabled: z.boolean().optional(),
});

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 報表 ID 參數 schema
 */
export const reportIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 告警規則 ID 參數 schema
 */
export const alertRuleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
