/**
 * Me endpoints validation schemas
 * Using Zod for comprehensive input validation
 * Validators for /api/v1/me endpoints
 * Migrated to use @asteasolutions/zod-to-openapi
 */

import { z } from 'zod';

// Practice query parameters schema (for ME endpoints)
// 基於新的 Prisma schema，移除已棄用的 contentType 欄位
export const mePracticesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1)
    .openapi({
      description: "分頁頁碼，從1開始",
      example: 1,
      examples: [1, 2, 5],
      minimum: 1
    }),
  limit: z.coerce.number().min(1).max(100).default(20)
    .openapi({
      description: "每頁顯示的練習項目數量",
      example: 20,
      examples: [10, 20, 50],
      minimum: 1,
      maximum: 100
    }),
  status: z.enum(['draft', 'not_started', 'active', 'completed', 'archived']).optional()
    .openapi({
      description: "按練習狀態篩選 (draft: 草稿, not_started: 未開始, active: 進行中, completed: 已完成, archived: 已封存)",
      example: "active",
      examples: ['draft', 'not_started', 'active', 'completed', 'archived']
    }),
  search: z.string().max(100).optional()
    .openapi({
      description: "搜尋關鍵詞，用於標題或內容搜尋",
      example: "React",
      examples: ["React", "JavaScript", "前端開發"],
      maxLength: 100
    }),
  sortBy: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt')
    .openapi({
      description: "排序欄位 (createdAt: 按創建時間, updatedAt: 按更新時間, likeCount: 按喜歡數)",
      example: "createdAt",
      examples: ['createdAt', 'updatedAt', 'likeCount']
    }),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
    .openapi({
      description: "排序方向 (asc: 升序, desc: 降序)",
      example: "desc",
      examples: ['asc', 'desc']
    }),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
    .openapi({
      description: "開始日期篩選，格式為YYYY-MM-DD",
      example: "2024-01-01",
      examples: ["2024-01-01", "2024-03-15", "2024-12-01"],
      pattern: '\\d{4}-\\d{2}-\\d{2}'
    }),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
    .openapi({
      description: "結束日期篩選，格式為YYYY-MM-DD",
      example: "2024-12-31",
      examples: ["2024-12-31", "2024-06-30", "2025-01-31"],
      pattern: '\\d{4}-\\d{2}-\\d{2}'
    })
}).openapi('MePracticesQuery', {
  description: "個人練習列表查詢參數"
});

export type MePracticesQueryParams = z.infer<typeof mePracticesQuerySchema>;

// Practice stats query parameters schema
export const practiceStatsQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d')
    .openapi({
      description: "統計時間範圍 (7d: 最近7天, 30d: 最近30天, 90d: 最近90天, 1y: 最近1年, all: 全部時間)",
      example: "30d",
      examples: ['7d', '30d', '90d', '1y', 'all']
    }),
  includeArchived: z.coerce.boolean().default(false)
    .openapi({
      description: "是否包含已歸檔的練習統計",
      example: false,
      examples: [true, false]
    })
}).openapi('PracticeStatsQuery', {
  description: "個人練習統計查詢參數"
});

export type PracticeStatsQueryParams = z.infer<typeof practiceStatsQuerySchema>;

// Resources query parameters schema
export const resourcesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1)
    .openapi({
      description: "資源列表的頁碼",
      example: 1,
      examples: [1, 2, 5],
      minimum: 1
    }),
  limit: z.coerce.number().min(1).max(100).default(20)
    .openapi({
      description: "每頁顯示的資源數量",
      example: 20,
      examples: [10, 20, 50],
      minimum: 1,
      maximum: 100
    }),
  category: z.string().max(50).optional()
    .openapi({
      description: "按資源分類篩選",
      example: "前端開發",
      examples: ["前端開發", "後端開發", "設計工具", "學習資源"],
      maxLength: 50
    }),
  type: z.enum(['link', 'file', 'note', 'draft']).optional()
    .openapi({
      description: "按資源類型篩選 (link: 連結, file: 檔案, note: 筆記, draft: 草稿)",
      example: "link",
      examples: ['link', 'file', 'note', 'draft']
    }),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
    .openapi({
      description: "按資源狀態篩選 (draft: 草稿, published: 已發布, archived: 已歸檔)",
      example: "published",
      examples: ['draft', 'published', 'archived']
    }),
  search: z.string().max(100).optional()
    .openapi({
      description: "搜尋關鍵詞，用於資源名稱或內容搜尋",
      example: "React",
      examples: ["React", "API設計", "資料庫"],
      maxLength: 100
    }),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt')
    .openapi({
      description: "排序欄位 (createdAt: 按創建時間, updatedAt: 按更新時間, name: 按資源名稱)",
      example: "updatedAt",
      examples: ['createdAt', 'updatedAt', 'name']
    }),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
    .openapi({
      description: "排序方向 (asc: 升序, desc: 降序)",
      example: "desc",
      examples: ['asc', 'desc']
    }),
  tags: z.string().optional()
    .openapi({
      description: "標籤篩選，多個標籤用逗號分隔",
      example: "React,JavaScript",
      examples: ["React,JavaScript", "設計,UI", "後端,API"]
    })
}).openapi('ResourcesQuery', {
  description: "個人資源列表查詢參數"
});

export type ResourcesQueryParams = z.infer<typeof resourcesQuerySchema>;

// Preferences query parameters schema
export const preferencesQuerySchema = z.object({
  category: z.string().max(50).optional()
    .openapi({
      description: "按偏好設定分類篩選",
      example: "學習偏好",
      examples: ["學習偏好", "通知設定", "隱私設定", "介面設定"],
      maxLength: 50
    }),
  includeSystem: z.coerce.boolean().default(false)
    .openapi({
      description: "是否包含系統層級的偏好設定",
      example: false,
      examples: [true, false]
    })
}).openapi('PreferencesQuery', {
  description: "個人偏好設定查詢參數"
});

export type PreferencesQueryParams = z.infer<typeof preferencesQuerySchema>;

// Update preferences request schema
const preferenceItemSchema = z.object({
  preferenceTypeId: z.number().int().positive()
    .openapi({
      description: "偏好設定類型的唯一識別ID",
      example: 1,
      examples: [1, 2, 5, 10]
    }),
  optionId: z.number().int().positive()
    .openapi({
      description: "偏好選項的唯一識別ID",
      example: 101,
      examples: [101, 202, 305, 410]
    }),
  isSelected: z.boolean()
    .openapi({
      description: "是否選擇此偏好選項",
      example: true,
      examples: [true, false]
    })
}).openapi('PreferenceItem', {
  description: "單個偏好設定項目"
});

export const updatePreferencesSchema = z.object({
  preferences: z.array(preferenceItemSchema).min(1, 'At least one preference must be provided').max(50, 'Too many preferences in one request')
    .openapi({
      description: "偏好設定更新的項目列表",
      minItems: 1,
      maxItems: 50
    })
}).openapi('UpdatePreferencesRequest', {
  description: "更新個人偏好設定的請求資料"
});

// 額外的類型導出
export type UpdatePreferencesData = z.infer<typeof updatePreferencesSchema>;

// ===== Response Validation Schemas =====
// These schemas validate service response data for consistency

import {
  apiSuccessResponseSchema,
  paginatedApiResponseSchema
} from './api-response.validators';

// 我的實踐項目 Schema (基於新的 Prisma schema practices 表)
export const myPracticeItemSchema = z.object({
  id: z.string().openapi({
    description: "實踐項目的外部UUID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  }),
  title: z.string().openapi({
    description: "實踐項目標題",
    example: "學習React Hooks"
  }),
  practiceAction: z.string().optional().openapi({
    description: "實踐行動描述",
    example: "每天學習1小時React Hooks課程"
  }),
  startDate: z.string().optional().openapi({
    description: "開始日期 (YYYY-MM-DD)",
    example: "2024-01-15"
  }),
  endDate: z.string().optional().openapi({
    description: "結束日期 (YYYY-MM-DD)",
    example: "2024-02-15"
  }),
  durationDays: z.number().int().min(7).max(90).optional().openapi({
    description: "持續天數 (7-90天)",
    example: 30,
    minimum: 7,
    maximum: 90
  }),
  frequencyMinDays: z.number().int().min(1).max(7).optional().openapi({
    description: "最小頻率天數",
    example: 1,
    minimum: 1,
    maximum: 7
  }),
  frequencyMaxDays: z.number().int().min(1).max(7).optional().openapi({
    description: "最大頻率天數",
    example: 7,
    minimum: 1,
    maximum: 7
  }),
  frequencyDescription: z.string().optional().openapi({
    description: "頻率描述",
    example: "每週3-5次"
  }),
  sessionDurationMinutes: z.number().int().min(5).max(240).optional().openapi({
    description: "每次練習時長 (分鐘)",
    example: 30,
    minimum: 5,
    maximum: 240
  }),
  practiceTimePeriods: z.array(z.enum(['morning', 'afternoon', 'evening', 'night'])).openapi({
    description: "練習時段",
    example: ["morning", "evening"]
  }),
  otherContext: z.string().optional().openapi({
    description: "其他備註或情境說明",
    example: "在通勤時間練習"
  }),
  status: z.enum(['draft', 'not_started', 'active', 'completed', 'archived']).openapi({
    description: "實踐狀態",
    example: "active"
  }),
  hasResources: z.boolean().openapi({
    description: "是否有相關資源",
    example: true
  }),
  progressPercentage: z.number().min(0).max(100).optional().openapi({
    description: "進度百分比 (0-100)",
    example: 45,
    minimum: 0,
    maximum: 100
  }),
  firstCheckinAt: z.string().datetime().optional().openapi({
    description: "首次打卡時間",
    example: "2024-01-16T08:30:00.000Z",
    format: 'date-time'
  }),
  createdAt: z.string().datetime().openapi({
    description: "創建時間",
    example: "2024-01-15T10:30:00.000Z",
    format: 'date-time'
  }),
  updatedAt: z.string().datetime().optional().openapi({
    description: "更新時間",
    example: "2024-01-20T15:45:00.000Z",
    format: 'date-time'
  }),
  tags: z.array(z.string()).openapi({
    description: "相關標籤",
    example: ["React", "前端", "Hooks"]
  })
}).openapi('MyPracticeItem', {
  description: "我的實踐項目"
});

// 實踐統計資料 Schema (基於 PracticeStatsData interface)
export const practiceStatsDataSchema = z.object({
  totalPractices: z.number().int().min(0).describe("總實踐數"),
  activePractices: z.number().int().min(0).describe("活躍實踐數"),
  completedPractices: z.number().int().min(0).describe("已完成實踐數"),
  archivedPractices: z.number().int().min(0).describe("歸檔的實踐數"),
  totalCheckIns: z.number().int().min(0).describe("總簽到次數"),
  currentStreak: z.number().int().min(0).describe("當前連續天數"),
  maxStreak: z.number().int().min(0).describe("最大連續天數"),
  averageProgress: z.number().min(0).describe("平均進度"),
  timeSpentToday: z.number().min(0).describe("今日學習時間(分鐘)"),
  timeSpentThisWeek: z.number().min(0).describe("本週學習時間(分鐘)"),
  timeSpentThisMonth: z.number().min(0).describe("本月學習時間(分鐘)"),
  practicesByCategory: z.array(z.object({
    category: z.string().describe("分類名稱"),
    count: z.number().int().min(0).describe("該分類的實踐數量"),
    avgProgress: z.number().min(0).describe("該分類的平均進度")
  })).describe("按分類統計的實踐"),
  recentActivity: z.array(z.object({
    date: z.string().describe("日期 (YYYY-MM-DD)"),
    checkInCount: z.number().int().min(0).describe("當日簽到次數"),
    timeSpent: z.number().min(0).describe("當日學習時間(分鐘)")
  })).describe("最近活動記錄"),
  achievements: z.array(z.object({
    type: z.enum(['streak', 'completion', 'consistency']).describe("成就類型"),
    milestone: z.number().int().positive().describe("里程碑數值"),
    achievedAt: z.string().datetime().describe("達成時間"),
    description: z.string().describe("成就描述")
  })).describe("成就列表")
}).describe("實踐統計資料").meta({
  title: "實踐統計",
  examples: [{
    totalPractices: 12,
    activePractices: 3,
    completedPractices: 7,
    archivedPractices: 2,
    totalCheckIns: 245,
    currentStreak: 5,
    maxStreak: 25,
    averageProgress: 65.5,
    timeSpentToday: 120,
    timeSpentThisWeek: 600,
    timeSpentThisMonth: 2400,
    practicesByCategory: [
      { category: "前端開發", count: 5, avgProgress: 70.2 },
      { category: "後端開發", count: 3, avgProgress: 55.8 }
    ],
    recentActivity: [
      { date: "2024-01-20", checkInCount: 2, timeSpent: 90 },
      { date: "2024-01-19", checkInCount: 1, timeSpent: 60 }
    ],
    achievements: [
      {
        type: "streak",
        milestone: 10,
        achievedAt: "2024-01-15T10:30:00.000Z",
        description: "連續簽到10天"
      }
    ]
  }]
});

// 我的資源項目 Schema (基於 MyResourceItem interface)
export const myResourceItemSchema = z.object({
  id: z.string().describe("資源的外部UUID"),
  name: z.string().describe("資源名稱"),
  description: z.string().optional().describe("資源描述"),
  url: z.string().url().optional().describe("資源連結"),
  type: z.enum(['link', 'file', 'note', 'draft']).describe("資源類型"),
  category: z.string().optional().describe("資源分類"),
  status: z.enum(['draft', 'published', 'archived']).describe("資源狀態"),
  tags: z.array(z.string()).describe("資源標籤"),
  createdAt: z.string().datetime().describe("創建時間"),
  updatedAt: z.string().datetime().optional().describe("更新時間"),
  fileSize: z.number().int().positive().optional().describe("檔案大小(bytes)"),
  visibility: z.enum(['private', 'public']).describe("可見性"),
  metadata: z.record(z.string(), z.unknown()).optional().describe("額外元數據")
}).describe("我的資源項目").meta({
  title: "我的資源項目",
  examples: [{
    id: "res-123e4567-e89b-12d3-a456-426614174000",
    name: "React 學習筆記",
    description: "個人整理的React學習重點",
    type: "note",
    category: "前端開發",
    status: "published",
    tags: ["React", "筆記", "前端"],
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-20T15:45:00.000Z",
    visibility: "private"
  }]
});

// 偏好設定相關 Schemas
export const preferenceOptionSchema = z.object({
  id: z.number().int().describe("選項ID"),
  value: z.string().describe("選項值"),
  name: z.string().describe("選項名稱"),
  description: z.string().optional().describe("選項描述")
}).describe("偏好設定選項");

export const preferenceTypeSchema = z.object({
  id: z.number().int().describe("偏好類型ID"),
  name: z.string().describe("偏好類型名稱"),
  value: z.string().describe("偏好類型唯一標識"),
  description: z.string().optional().describe("偏好類型描述"),
  maxSelections: z.number().int().positive().optional().describe("最大選擇數"),
  options: z.array(preferenceOptionSchema).describe("可選選項")
}).describe("偏好設定類型");

export const userPreferenceSchema = z.object({
  id: z.number().int().describe("用戶偏好ID"),
  preferenceTypeId: z.number().int().describe("偏好類型ID"),
  optionId: z.number().int().describe("選項ID"),
  isSelected: z.boolean().describe("是否已選擇"),
  preferenceType: preferenceTypeSchema.describe("偏好類型資訊"),
  option: preferenceOptionSchema.describe("選項資訊")
}).describe("用戶偏好設定");

// ===== API Response Schemas =====

// 我的實踐列表回應
export const myPracticesApiResponseSchema = paginatedApiResponseSchema(myPracticeItemSchema);

// 我的實踐統計回應
export const myPracticeStatsApiResponseSchema = apiSuccessResponseSchema(practiceStatsDataSchema);

// 我的資源列表回應（帶統計資訊）
export const myResourcesApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(myResourceItemSchema),
  pagination: z.object({
    currentPage: z.number().int().min(1),
    totalPages: z.number().int().min(0),
    totalItems: z.number().int().min(0),
    itemsPerPage: z.number().int().min(1),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  }),
  stats: z.object({
    totalResources: z.number().int().min(0),
    draftCount: z.number().int().min(0),
    publishedCount: z.number().int().min(0),
    byCategory: z.record(z.string(), z.number().int().min(0))
  }),
  timestamp: z.string().datetime(),
  meta: z.record(z.string(), z.unknown()).optional()
}).describe("我的資源列表API回應").openapi({
  description: "我的資源列表API回應"
});

// 我的偏好設定回應
export const myPreferencesApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    preferences: z.array(userPreferenceSchema),
    categories: z.array(z.object({
      type: preferenceTypeSchema,
      userSelections: z.array(z.object({
        optionId: z.number().int(),
        isSelected: z.boolean()
      }))
    }))
  }),
  stats: z.object({
    totalPreferences: z.number().int().min(0),
    activeSelections: z.number().int().min(0),
    lastUpdated: z.string().datetime().optional()
  }),
  timestamp: z.string().datetime(),
  meta: z.record(z.string(), z.unknown()).optional()
}).describe("我的偏好設定API回應").openapi({
  description: "我的偏好設定API回應"
});

// 更新偏好設定回應
export const updatePreferencesApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    updated: z.number().int().min(0),
    created: z.number().int().min(0),
    deleted: z.number().int().min(0)
  }),
  message: z.string(),
  timestamp: z.string().datetime(),
  meta: z.record(z.string(), z.unknown()).optional()
}).describe("更新偏好設定API回應").openapi({
  description: "更新偏好設定API回應"
});

