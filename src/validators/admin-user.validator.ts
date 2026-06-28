/**
 * Admin 使用者管理驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema, paginatedApiResponseSchema } from './api-response.validators';

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * Admin 使用者列表查詢參數 schema
 */
export const adminUserListQuerySchema = z.object({
  search: z.string()
    .optional()
    .openapi({
      description: '搜尋名稱或 email',
      example: 'john'
    }),
  roleId: z.string()
    .regex(/^\d+$/, '角色 ID 必須為正整數')
    .transform(Number)
    .optional()
    .openapi({
      description: '篩選角色 ID',
      example: '2'
    }),
  isActive: z.enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional()
    .openapi({
      description: '篩選啟用狀態',
      example: 'true'
    }),
  isVerified: z.enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional()
    .openapi({
      description: '篩選 email 驗證狀態',
      example: 'true'
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
    .transform(val => val ? Number(val) : 20)
    .openapi({
      description: '每頁數量',
      example: '20'
    }),
  sortBy: z.enum([
    'createdAt',
    'lastLoginAt',
    'name',
    'email',
    'registrationFlow',
    'creationMethod',
    'daysToComplete'
  ])
    .optional()
    .default('createdAt')
    .openapi({
      description: '排序欄位',
      example: 'createdAt'
    }),
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .openapi({
      description: '排序方向',
      example: 'desc'
    }),
  personaType: z.enum(['L', 'C', 'A', 'D', 'O'])
    .optional()
    .openapi({
      description: '篩選學習風格人物誌（最新一次測驗結果）',
      example: 'D'
    }),
  badgeGranted: z.enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional()
    .openapi({
      description: '篩選 Onboarding Badge 完成狀態',
      example: 'true'
    }),
  userSource: z.enum(['S1', 'S2', 'S3'])
    .optional()
    .openapi({
      description: '篩選用戶來源',
      example: 'S1'
    }),
  registrationFlow: z.enum(['landing_page', 'quiz', 'action_maker'])
    .optional()
    .openapi({
      description: '篩選註冊來源',
      example: 'landing_page'
    }),
  creationMethod: z.enum(['self_created', 'copied', 'action_generator'])
    .optional()
    .openapi({
      description: '篩選任務建立方式',
      example: 'self_created'
    })
}).openapi('AdminUserListQuery');

registry.register('AdminUserListQuery', adminUserListQuerySchema);

/**
 * Admin 使用者 ID 路徑參數 schema
 */
export const adminUserIdParamSchema = z.object({
  userId: z.string()
    .regex(/^\d+$/, '用戶 ID 必須為正整數')
    .transform(Number)
    .openapi({
      description: '用戶內部 ID',
      example: '123'
    })
}).openapi('AdminUserIdParam');

registry.register('AdminUserIdParam', adminUserIdParamSchema);

/**
 * Admin 登入歷史查詢參數 schema
 */
export const adminLoginHistoryQuerySchema = z.object({
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
    .transform(val => val ? Number(val) : 20)
    .openapi({
      description: '每頁數量',
      example: '20'
    })
}).openapi('AdminLoginHistoryQuery');

registry.register('AdminLoginHistoryQuery', adminLoginHistoryQuerySchema);

/**
 * 用戶狀態更新請求 schema
 */
export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
    .openapi({
      description: '是否啟用帳號',
      example: true
    })
}).openapi('UpdateUserStatusRequest');

registry.register('UpdateUserStatusRequest', updateUserStatusSchema);

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * 角色資訊 schema
 */
const roleInfoSchema = z.object({
  id: z.number().int().openapi({
    description: '角色 ID',
    example: 1
  }),
  name: z.string().openapi({
    description: '角色名稱',
    example: 'Admin'
  }),
  description: z.string().nullable().openapi({
    description: '角色描述',
    example: '系統管理員'
  })
}).openapi('RoleInfo');

registry.register('RoleInfo', roleInfoSchema);

/**
 * Admin 使用者列表項目 schema
 */
const adminUserListItemSchema = z.object({
  id: z.string().openapi({
    description: '用戶外部 ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
  internalId: z.number().int().openapi({
    description: '用戶內部 ID',
    example: 123
  }),
  customId: z.string().nullable().openapi({
    description: '使用者自訂唯一識別碼（@username）',
    example: 'my_username'
  }),
  name: z.string().nullable().openapi({
    description: '用戶名稱',
    example: '王小明'
  }),
  email: z.string().nullable().openapi({
    description: '電子郵件',
    example: 'user@example.com'
  }),
  photoURL: z.string().nullable().openapi({
    description: '頭像 URL',
    example: 'https://example.com/avatar.jpg'
  }),
  emailVerified: z.boolean().openapi({
    description: 'Email 是否已驗證',
    example: true
  }),
  emailVerifiedAt: z.string().nullable().openapi({
    description: 'Email 驗證時間',
    example: '2024-01-15T10:30:00.000Z'
  }),
  isActive: z.boolean().openapi({
    description: '帳號是否啟用',
    example: true
  }),
  roles: z.array(roleInfoSchema).openapi({
    description: '用戶角色列表'
  }),
  permissions: z.array(z.string()).openapi({
    description: '用戶權限列表',
    example: ['users:read', 'users:write']
  }),
  createdAt: z.string().openapi({
    description: '建立時間',
    example: '2024-01-15T10:30:00.000Z'
  }),
  lastLoginAt: z.string().nullable().openapi({
    description: '最後登入時間',
    example: '2024-01-20T08:30:00.000Z'
  }),
  personaType: z.enum(['L', 'C', 'A', 'D', 'O']).nullable().openapi({
    description: '最新一次學習風格測驗結果',
    example: 'D'
  }),
  badgeGranted: z.boolean().nullable().openapi({
    description: '是否完成 Onboarding Badge',
    example: true
  }),
  userSource: z.string().nullable().openapi({
    description: '用戶來源（S1/S2/S3）',
    example: 'S1'
  }),
  registrationFlow: z
    .enum(['landing_page', 'quiz', 'action_maker'])
    .nullable()
    .openapi({
      description: '註冊來源',
      example: 'landing_page'
    }),
  creationMethod: z
    .enum(['self_created', 'copied', 'action_generator'])
    .nullable()
    .openapi({
      description: '任務建立方式',
      example: 'self_created'
    }),
  daysToComplete: z.number().nullable().openapi({
    description: '完成天數',
    example: 7
  }),
  tags: z.array(z.object({
    id: z.number().int(),
    name: z.string(),
  })).openapi({
    description: '用戶標籤列表'
  })
}).openapi('AdminUserListItem');

registry.register('AdminUserListItem', adminUserListItemSchema);

/**
 * Admin 使用者列表回應 schema
 */
export const adminUserListResponseSchema = paginatedApiResponseSchema(adminUserListItemSchema)
  .openapi('AdminUserListResponse');

/**
 * 登入歷史記錄 schema
 */
const loginHistoryRecordSchema = z.object({
  id: z.number().int().openapi({
    description: '記錄 ID',
    example: 1
  }),
  deviceType: z.string().nullable().openapi({
    description: '裝置類型',
    example: 'desktop'
  }),
  os: z.string().nullable().openapi({
    description: '作業系統',
    example: 'macOS 14.0'
  }),
  browser: z.string().nullable().openapi({
    description: '瀏覽器',
    example: 'Chrome 120'
  }),
  userAgent: z.string().nullable().openapi({
    description: 'User-Agent 字串'
  }),
  ipAddress: z.string().nullable().openapi({
    description: 'IP 地址',
    example: '192.168.1.1'
  }),
  loginAt: z.string().nullable().openapi({
    description: '登入時間',
    example: '2024-01-20T08:30:00.000Z'
  })
}).openapi('LoginHistoryRecord');

/**
 * 用戶活躍統計 schema
 */
const userActivityStatsSchema = z.object({
  lastLoginAt: z.string().nullable().openapi({
    description: '最後登入時間'
  }),
  lastActiveAt: z.string().nullable().openapi({
    description: '最後活動時間'
  }),
  loginCount: z.number().int().openapi({
    description: '總登入次數',
    example: 42
  }),
  profileViews: z.number().int().openapi({
    description: '個人檔案被查看次數',
    example: 128
  }),
  recentLoginCount: z.number().int().openapi({
    description: '最近 30 天登入次數',
    example: 15
  })
}).openapi('UserActivityStats');

/**
 * Admin 使用者詳情回應 schema
 */
const adminUserDetailDataSchema = z.object({
  id: z.string().openapi({
    description: '用戶外部 ID (UUID)'
  }),
  internalId: z.number().int().openapi({
    description: '用戶內部 ID'
  }),
  name: z.string().nullable().openapi({
    description: '用戶名稱'
  }),
  email: z.string().nullable().openapi({
    description: '電子郵件'
  }),
  photoURL: z.string().nullable().openapi({
    description: '頭像 URL'
  }),
  emailVerified: z.boolean().openapi({
    description: 'Email 是否已驗證'
  }),
  emailVerifiedAt: z.string().nullable().openapi({
    description: 'Email 驗證時間'
  }),
  isActive: z.boolean().openapi({
    description: '帳號是否啟用'
  }),
  roles: z.array(roleInfoSchema).openapi({
    description: '用戶角色列表'
  }),
  permissions: z.array(z.string()).openapi({
    description: '用戶權限列表'
  }),
  recentLoginHistory: z.array(loginHistoryRecordSchema).openapi({
    description: '最近登入歷史（最近 10 筆）'
  }),
  activityStats: userActivityStatsSchema.openapi({
    description: '活躍統計'
  }),
  createdAt: z.string().openapi({
    description: '建立時間'
  }),
  updatedAt: z.string().openapi({
    description: '更新時間'
  }),
  personaType: z.enum(['L', 'C', 'A', 'D', 'O']).nullable().openapi({
    description: '人物誌類型'
  }),
  badgeGranted: z.boolean().nullable().openapi({
    description: '是否完成 Onboarding Badge'
  }),
  userSource: z.string().nullable().openapi({
    description: '用戶來源'
  })
}).openapi('AdminUserDetailData');

registry.register('AdminUserDetailData', adminUserDetailDataSchema);

export const adminUserDetailResponseSchema = apiSuccessResponseSchema(adminUserDetailDataSchema)
  .openapi('AdminUserDetailResponse');

/**
 * 用戶狀態更新回應 schema
 */
const updateUserStatusDataSchema = z.object({
  id: z.string().openapi({
    description: '用戶外部 ID'
  }),
  isActive: z.boolean().openapi({
    description: '更新後的狀態'
  }),
  updatedAt: z.string().openapi({
    description: '更新時間'
  })
}).openapi('UpdateUserStatusData');

export const updateUserStatusResponseSchema = apiSuccessResponseSchema(updateUserStatusDataSchema)
  .openapi('UpdateUserStatusResponse');

/**
 * Admin 登入歷史回應 schema
 */
export const adminLoginHistoryResponseSchema = paginatedApiResponseSchema(loginHistoryRecordSchema)
  .openapi('AdminLoginHistoryResponse');

/**
 * Admin 活躍統計回應 schema
 */
export const adminActivityStatsResponseSchema = apiSuccessResponseSchema(userActivityStatsSchema)
  .openapi('AdminActivityStatsResponse');

// ============================================================================
// Type exports
// ============================================================================

export type AdminUserListQueryDto = z.infer<typeof adminUserListQuerySchema>;
export type AdminUserIdParamDto = z.infer<typeof adminUserIdParamSchema>;
export type AdminLoginHistoryQueryDto = z.infer<typeof adminLoginHistoryQuerySchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
