/**
 * 用戶自訂 ID 驗證器
 */

import { z } from 'zod';

/**
 * 自訂 ID 格式驗證 Schema
 */
export const customIdSchema = z.object({
  customId: z.string()
    .min(3, '自訂 ID 至少需要 3 個字符')
    .max(50, '自訂 ID 不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '自訂 ID 只能包含英文字母、數字、底線和連字符')
    .refine(
      (val) => !val.startsWith('_') && !val.startsWith('-'), 
      '自訂 ID 不能以底線或連字符開頭'
    )
    .refine(
      (val) => !val.endsWith('_') && !val.endsWith('-'), 
      '自訂 ID 不能以底線或連字符結尾'
    )
});

/**
 * 自訂 ID 路徑參數驗證 Schema  
 */
export const customIdParamsSchema = z.object({
  customId: z.string()
    .min(3, '自訂 ID 至少需要 3 個字符')
    .max(50, '自訂 ID 不能超過 50 個字符')
});

/**
 * 自訂 ID 設置請求驗證 Schema
 */
export const setCustomIdRequestSchema = customIdSchema;

/**
 * 驗證自訂 ID 格式的工具函數
 */
export const validateCustomIdFormat = (customId: string): boolean => {
  const regex = /^[a-zA-Z0-9_-]{3,50}$/;
  return regex.test(customId) && 
         !customId.startsWith('_') && 
         !customId.startsWith('-') &&
         !customId.endsWith('_') && 
         !customId.endsWith('-');
};

/**
 * 匯出驗證 Schema 類型
 */
export type CustomIdRequest = z.infer<typeof customIdSchema>;
export type CustomIdParams = z.infer<typeof customIdParamsSchema>;
export type SetCustomIdRequest = z.infer<typeof setCustomIdRequestSchema>;