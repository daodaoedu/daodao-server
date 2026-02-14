/**
 * Admin 統計驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * 實踐統計查詢參數 schema
 */
export const practiceStatsQuerySchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD')
    .optional()
    .openapi({
      description: '開始日期',
      example: '2024-01-01'
    }),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD')
    .optional()
    .openapi({
      description: '結束日期',
      example: '2024-01-31'
    })
}).openapi('PracticeStatsQuery');

registry.register('PracticeStatsQuery', practiceStatsQuerySchema);

/**
 * 活躍用戶趨勢查詢參數 schema
 */
export const activeUsersTrendQuerySchema = z.object({
  days: z.string()
    .regex(/^\d+$/, '天數必須為正整數')
    .optional()
    .transform(val => val ? Number(val) : 30)
    .refine(val => val >= 1 && val <= 90, {
      message: '天數必須在 1 到 90 之間'
    })
    .openapi({
      description: '查詢天數（預設 30，最大 90）',
      example: '30'
    })
}).openapi('ActiveUsersTrendQuery');

registry.register('ActiveUsersTrendQuery', activeUsersTrendQuerySchema);

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * 實踐分類統計 schema
 */
const practicesByCategorySchema = z.object({
  category: z.string().openapi({
    description: '分類名稱',
    example: '程式設計'
  }),
  count: z.number().int().openapi({
    description: '數量',
    example: 25
  })
}).openapi('PracticesByCategory');

/**
 * 實踐狀態統計 schema
 */
const practicesByStatusSchema = z.object({
  status: z.string().openapi({
    description: '狀態名稱',
    example: 'active'
  }),
  count: z.number().int().openapi({
    description: '數量',
    example: 100
  })
}).openapi('PracticesByStatus');

/**
 * 實踐統計資料 schema
 */
const practiceStatsDataSchema = z.object({
  total: z.number().int().openapi({
    description: '總實踐數',
    example: 500
  }),
  active: z.number().int().openapi({
    description: '進行中的實踐數',
    example: 150
  }),
  completed: z.number().int().openapi({
    description: '已完成的實踐數',
    example: 300
  }),
  totalCheckIns: z.number().int().openapi({
    description: '總簽到數',
    example: 1200
  }),
  averageCompletionRate: z.number().openapi({
    description: '平均完成率（百分比）',
    example: 65.5
  }),
  practicesByCategory: z.array(practicesByCategorySchema).openapi({
    description: '依分類統計'
  }),
  practicesByStatus: z.array(practicesByStatusSchema).openapi({
    description: '依狀態統計'
  })
}).openapi('PracticeStatsData');

registry.register('PracticeStatsData', practiceStatsDataSchema);

export const practiceStatsResponseSchema = apiSuccessResponseSchema(practiceStatsDataSchema)
  .openapi('PracticeStatsResponse');

/**
 * 活躍用戶趨勢資料點 schema
 */
const activeUsersTrendDataPointSchema = z.object({
  date: z.string().openapi({
    description: '日期 (YYYY-MM-DD)',
    example: '2024-01-15'
  }),
  dau: z.number().int().openapi({
    description: '日活躍用戶數',
    example: 156
  }),
  wau: z.number().int().openapi({
    description: '週活躍用戶數',
    example: 534
  }),
  mau: z.number().int().openapi({
    description: '月活躍用戶數',
    example: 892
  })
}).openapi('ActiveUsersTrendDataPoint');

/**
 * 活躍用戶趨勢元資料 schema
 */
const activeUsersTrendMetadataSchema = z.object({
  days: z.number().int().openapi({
    description: '查詢的天數',
    example: 30
  }),
  startDate: z.string().openapi({
    description: '開始日期',
    example: '2024-01-01'
  }),
  endDate: z.string().openapi({
    description: '結束日期',
    example: '2024-01-30'
  }),
  isLimited: z.boolean().openapi({
    description: '是否因超過最大範圍而被限制',
    example: false
  }),
  generatedAt: z.string().openapi({
    description: '資料生成時間',
    example: '2024-01-31T10:30:00.000Z'
  })
}).openapi('ActiveUsersTrendMetadata');

/**
 * 活躍用戶趨勢資料 schema
 */
const activeUsersTrendDataSchema = z.object({
  trend: z.array(activeUsersTrendDataPointSchema).openapi({
    description: '時間序列資料'
  }),
  metadata: activeUsersTrendMetadataSchema.openapi({
    description: '元資料'
  })
}).openapi('ActiveUsersTrendData');

registry.register('ActiveUsersTrendData', activeUsersTrendDataSchema);

export const activeUsersTrendResponseSchema = apiSuccessResponseSchema(activeUsersTrendDataSchema)
  .openapi('ActiveUsersTrendResponse');

// ============================================================================
// Type exports
// ============================================================================

export type PracticeStatsQueryDto = z.infer<typeof practiceStatsQuerySchema>;
export type ActiveUsersTrendQueryDto = z.infer<typeof activeUsersTrendQuerySchema>;
