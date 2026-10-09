/**
 * 郵件歷史驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';
import { EMAIL_STATUS } from '../types/email';

/** email_logs.status 的全部可能值（含後台停用時記的 skipped，daodao#236／#292） */
const EMAIL_HISTORY_STATUSES = [
  EMAIL_STATUS.SENT,
  EMAIL_STATUS.FAILED,
  EMAIL_STATUS.PENDING,
  EMAIL_STATUS.SKIPPED,
] as const;

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * 郵件歷史查詢參數 schema
 */
export const emailHistoryQuerySchema = z.object({
  emailType: z.string()
    .optional()
    .openapi({
      description: '郵件類型',
      example: 'verification'
    }),
  status: z.enum(EMAIL_HISTORY_STATUSES)
    .optional()
    .openapi({
      description: '發送狀態（skipped：後台停用該模板而未寄出）',
      example: 'sent'
    }),
  recipient: z.string()
    .email('請輸入有效的 email 格式')
    .optional()
    .openapi({
      description: '收件人 email',
      example: 'user@example.com'
    }),
  userId: z.string()
    .regex(/^\d+$/, '用戶 ID 必須為正整數')
    .transform(Number)
    .optional()
    .openapi({
      description: '用戶 ID',
      example: '123'
    }),
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
    }),
  page: z.string()
    .regex(/^\d+$/, '頁數必須為正整數')
    .optional()
    .transform(val => val ? Number(val) : 1)
    .openapi({
      description: '頁數',
      example: '1'
    }),
  limit: z.string()
    .regex(/^\d+$/, '每頁數量必須為正整數')
    .optional()
    .transform(val => val ? Number(val) : 50)
    .openapi({
      description: '每頁數量',
      example: '50'
    }),
  sortBy: z.enum(['sentAt', 'createdAt'])
    .default('sentAt')
    .openapi({
      description: '排序欄位',
      example: 'sentAt'
    }),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc')
    .openapi({
      description: '排序方向',
      example: 'desc'
    }),
  opened: z.enum(['true', 'false'])
    .optional()
    .openapi({
      description: '開啟狀態篩選',
      example: 'true'
    })
}).openapi('EmailHistoryQuery');

registry.register('EmailHistoryQuery', emailHistoryQuerySchema);

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * 郵件歷史記錄 schema
 */
const emailHistoryRecordSchema = z.object({
  id: z.number().int().openapi({
    description: '記錄 ID',
    example: 1
  }),
  userId: z.number().int().openapi({
    description: '用戶 ID',
    example: 123
  }),
  recipientEmail: z.string().nullable().openapi({
    description: '收件人 email',
    example: 'user@example.com'
  }),
  emailType: z.string().openapi({
    description: '郵件類型',
    example: 'verification'
  }),
  subject: z.string().nullable().openapi({
    description: '郵件主題',
    example: '請驗證您的電子郵件'
  }),
  status: z.enum(EMAIL_HISTORY_STATUSES).openapi({
    description: '發送狀態（skipped：後台停用該模板而未寄出）',
    example: 'sent'
  }),
  sentAt: z.string().nullable().openapi({
    description: '發送時間',
    example: '2024-01-15T10:30:00.000Z'
  }),
  createdAt: z.string().nullable().openapi({
    description: '建立時間',
    example: '2024-01-15T10:30:00.000Z'
  }),
  entityType: z.string().nullable().openapi({
    description: '關聯實體類型',
    example: 'practice'
  }),
  entityId: z.number().int().nullable().openapi({
    description: '關聯實體 ID',
    example: 456
  }),
  trackingToken: z.string().nullable().openapi({
    description: '追蹤 Token',
    example: '550e8400-e29b-41d4-a716-446655440000'
  }),
  openedAt: z.string().nullable().openapi({
    description: '首次開啟時間',
    example: '2024-01-15T12:00:00.000Z'
  }),
  openCount: z.number().int().openapi({
    description: '開啟次數',
    example: 3
  })
}).openapi('EmailHistoryRecord');

registry.register('EmailHistoryRecord', emailHistoryRecordSchema);

/**
 * 郵件歷史統計 schema
 */
const emailHistoryStatsSchema = z.object({
  totalRecords: z.number().int().openapi({
    description: '總記錄數',
    example: 1000
  }),
  sentCount: z.number().int().openapi({
    description: '已發送數量',
    example: 950
  }),
  failedCount: z.number().int().openapi({
    description: '失敗數量',
    example: 30
  }),
  pendingCount: z.number().int().openapi({
    description: '待發送數量',
    example: 20
  }),
  successRate: z.number().openapi({
    description: '成功率（百分比）',
    example: 95.0
  }),
  openedCount: z.number().int().openapi({
    description: '已開啟數量',
    example: 800
  }),
  openRate: z.number().openapi({
    description: '開啟率（百分比）',
    example: 84.21
  })
}).openapi('EmailHistoryStats');

registry.register('EmailHistoryStats', emailHistoryStatsSchema);

/**
 * 分頁資訊 schema
 */
const paginationSchema = z.object({
  currentPage: z.number().int().openapi({
    description: '當前頁數',
    example: 1
  }),
  totalPages: z.number().int().openapi({
    description: '總頁數',
    example: 10
  }),
  totalCount: z.number().int().openapi({
    description: '總記錄數',
    example: 500
  }),
  hasNext: z.boolean().openapi({
    description: '是否有下一頁',
    example: true
  }),
  hasPrev: z.boolean().openapi({
    description: '是否有上一頁',
    example: false
  }),
  limit: z.number().int().openapi({
    description: '每頁數量',
    example: 50
  })
}).openapi('Pagination');

/**
 * 完整郵件歷史回應 schema
 */
const emailHistoryResponseDataSchema = z.object({
  records: z.array(emailHistoryRecordSchema).openapi({
    description: '郵件記錄列表'
  }),
  pagination: paginationSchema.openapi({
    description: '分頁資訊'
  }),
  stats: emailHistoryStatsSchema.openapi({
    description: '統計資訊'
  })
}).openapi('EmailHistoryResponseData');

registry.register('EmailHistoryResponseData', emailHistoryResponseDataSchema);

export const emailHistoryResponseSchema = apiSuccessResponseSchema(emailHistoryResponseDataSchema)
  .openapi('EmailHistoryResponse');

// ============================================================================
// Type exports
// ============================================================================

export type EmailHistoryQueryDto = z.infer<typeof emailHistoryQuerySchema>;
