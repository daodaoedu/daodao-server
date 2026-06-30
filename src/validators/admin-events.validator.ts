/**
 * Admin 活動驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * 建立活動 schema
 */
export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().min(1).max(500),
  maxCapacity: z.coerce.number().int().positive(),
  isRecurring: z.boolean().optional().default(false),
});

/**
 * 更新活動 schema
 */
export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().min(1).max(500).optional(),
  maxCapacity: z.coerce.number().int().positive().optional(),
  isRecurring: z.boolean().optional(),
});

/**
 * 建立活動範本 schema
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
});

/**
 * 上傳錄影 schema
 */
export const uploadRecordingSchema = z.object({
  fileName: z.string().min(1).max(300),
  fileSize: z.coerce.number().int().positive(),
  accessLevel: z.enum(['public', 'members', 'roles']).optional().default('members'),
});

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 活動 ID 參數 schema
 */
export const eventIdParamSchema = z.object({
  eventId: z.coerce.number().int().positive(),
});

/**
 * 範本 ID 參數 schema
 */
export const templateIdParamSchema = z.object({
  templateId: z.coerce.number().int().positive(),
});

/**
 * 錄影 ID 參數 schema
 */
export const recordingIdParamSchema = z.object({
  recordingId: z.coerce.number().int().positive(),
});

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * 活動篩選 schema
 */
export const eventFilterQuerySchema = z.object({
  status: z.enum(['upcoming', 'past']).optional(),
});
