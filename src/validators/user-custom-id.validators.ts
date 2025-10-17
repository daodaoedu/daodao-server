/**
 * 用戶自訂 ID 驗證器
 */

import { z } from 'zod';
import {
  CUSTOM_ID_REGEX,
  CUSTOM_ID_MIN_LENGTH,
  CUSTOM_ID_MAX_LENGTH,
  CUSTOM_ID_ERROR_MESSAGES,
  validateCustomIdFormat as validateFormat
} from '../constants/validation';

/**
 * 自訂 ID 格式驗證 Schema
 * 使用共享的驗證規則確保一致性
 */
export const customIdSchema = z.object({
  customId: z.string()
    .min(CUSTOM_ID_MIN_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MIN_LENGTH)
    .max(CUSTOM_ID_MAX_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MAX_LENGTH)
    .regex(CUSTOM_ID_REGEX, CUSTOM_ID_ERROR_MESSAGES.FORMAT)
});

/**
 * 自訂 ID 路徑參數驗證 Schema
 */
export const customIdParamsSchema = z.object({
  customId: z.string()
    .min(CUSTOM_ID_MIN_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MIN_LENGTH)
    .max(CUSTOM_ID_MAX_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MAX_LENGTH)
});

/**
 * 自訂 ID 設置請求驗證 Schema
 */
export const setCustomIdRequestSchema = customIdSchema;

/**
 * 驗證自訂 ID 格式的工具函數
 * 使用共享的驗證邏輯
 */
export const validateCustomIdFormat = validateFormat;

/**
 * 匯出驗證 Schema 類型
 */
export type CustomIdRequest = z.infer<typeof customIdSchema>;
export type CustomIdParams = z.infer<typeof customIdParamsSchema>;
export type SetCustomIdRequest = z.infer<typeof setCustomIdRequestSchema>;