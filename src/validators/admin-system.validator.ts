/**
 * Admin 系統監控驗證器
 * 使用 Zod 定義請求驗證 schema
 */

import { z } from 'zod';

/**
 * 發送單封 Email 請求 schema
 */
export const emailSendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
});

/**
 * 批次發送 Email 請求 schema
 */
export const emailBulkSendSchema = z.object({
  tagId: z.coerce.number().int().positive().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
});
