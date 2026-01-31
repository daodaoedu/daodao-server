/**
 * 用戶自訂 ID 驗證器 - OpenAPI 版本
 * 展示如何使用 @asteasolutions/zod-to-openapi
 *
 * 🔄 遷移指南：
 * 1. 將原有的 z.string() 改為 .openapi() 添加 OpenAPI metadata
 * 2. 使用 registry.register() 註冊 schemas
 * 3. 提供 example, description 等 OpenAPI 屬性
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  CUSTOM_ID_REGEX,
  CUSTOM_ID_MIN_LENGTH,
  CUSTOM_ID_MAX_LENGTH,
  CUSTOM_ID_ERROR_MESSAGES,
  validateCustomIdFormat as validateFormat
} from '../constants/validation';

// ===================================
// 🆕 新寫法：使用 .openapi() 替代 .meta()
// ===================================

/**
 * 自訂 ID 格式驗證 Schema
 * 使用共享的驗證規則確保一致性
 */
export const customIdSchema = z.object({
  customId: z.string()
    .min(CUSTOM_ID_MIN_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MIN_LENGTH)
    .max(CUSTOM_ID_MAX_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MAX_LENGTH)
    .regex(CUSTOM_ID_REGEX, CUSTOM_ID_ERROR_MESSAGES.FORMAT)
    .openapi({
      description: '用戶自訂 ID (3-30 字元，字母、數字、底線、連字號)',
      example: 'john_doe_2024',
      examples: [
        'john_doe_2024',
        'alice-chen',
        'developer_bob123',
        'mary_educator'
      ],
      minLength: CUSTOM_ID_MIN_LENGTH,
      maxLength: CUSTOM_ID_MAX_LENGTH,
      pattern: CUSTOM_ID_REGEX.source
    })
}).openapi('CustomIdRequest', {
  description: '設置自訂 ID 請求'
});

// 註冊 CustomIdRequest schema
registry.register('CustomIdRequest', customIdSchema);

/**
 * 自訂 ID 路徑參數驗證 Schema
 */
export const customIdParamsSchema = z.object({
  customId: z.string()
    .min(CUSTOM_ID_MIN_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MIN_LENGTH)
    .max(CUSTOM_ID_MAX_LENGTH, CUSTOM_ID_ERROR_MESSAGES.MAX_LENGTH)
    .openapi({
      description: '用戶自訂 ID (路徑參數)',
      example: 'john_doe_2024',
      param: {
        name: 'customId',
        in: 'path'
      },
      minLength: CUSTOM_ID_MIN_LENGTH,
      maxLength: CUSTOM_ID_MAX_LENGTH
    })
}).openapi('CustomIdParams', {
  description: '自訂 ID 路徑參數'
});

// 註冊 CustomIdParams schema
registry.register('CustomIdParams', customIdParamsSchema);

/**
 * 自訂 ID 設置請求驗證 Schema
 */
export const setCustomIdRequestSchema = customIdSchema;

/**
 * 驗證自訂 ID 格式的工具函數
 * 使用共享的驗證邏輯
 */
export const validateCustomIdFormat = validateFormat;

// ===================================
// 🎯 Response Schemas
// ===================================

/**
 * 自訂 ID 可用性檢查回應
 */
export const customIdAvailabilityDataSchema = z.object({
  customId: z.string().openapi({
    description: '檢查的自訂 ID',
    example: 'john_doe_2024'
  }),
  available: z.boolean().openapi({
    description: '是否可用',
    example: true
  })
}).openapi('CustomIdAvailabilityData', {
  description: '自訂 ID 可用性資料'
});

registry.register('CustomIdAvailabilityData', customIdAvailabilityDataSchema);

/**
 * 設置自訂 ID 成功回應資料
 */
export const setCustomIdDataSchema = z.object({
  id: z.string().uuid().openapi({
    description: '用戶 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  }),
  customId: z.string().openapi({
    description: '設置的自訂 ID',
    example: 'john_doe_2024'
  }),
  message: z.string().openapi({
    description: '操作訊息',
    example: '自訂 ID 設置成功'
  })
}).openapi('SetCustomIdData', {
  description: '設置自訂 ID 成功資料'
});

registry.register('SetCustomIdData', setCustomIdDataSchema);

/**
 * 移除自訂 ID 成功回應資料
 */
export const removeCustomIdDataSchema = z.object({
  id: z.string().uuid().openapi({
    description: '用戶 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  }),
  customId: z.null().openapi({
    description: '移除後的自訂 ID (null)',
    example: null
  }),
  message: z.string().openapi({
    description: '操作訊息',
    example: '自訂 ID 已成功移除'
  })
}).openapi('RemoveCustomIdData', {
  description: '移除自訂 ID 成功資料'
});

registry.register('RemoveCustomIdData', removeCustomIdDataSchema);

/**
 * 匯出驗證 Schema 類型
 */
export type CustomIdRequest = z.infer<typeof customIdSchema>;
export type CustomIdParams = z.infer<typeof customIdParamsSchema>;
export type SetCustomIdRequest = z.infer<typeof setCustomIdRequestSchema>;
export type CustomIdAvailabilityData = z.infer<typeof customIdAvailabilityDataSchema>;
export type SetCustomIdData = z.infer<typeof setCustomIdDataSchema>;
export type RemoveCustomIdData = z.infer<typeof removeCustomIdDataSchema>;