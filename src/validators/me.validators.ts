/**
 * Me endpoints validation schemas
 * Using Zod for comprehensive input validation
 * Validators for /api/v1/me endpoints
 */

import { z } from 'zod';

// Practice query parameters schema
export const practiceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1)
    .describe("分頁頁碼，從1開始")
    .meta({
      title: "頁碼",
      examples: [1, 2, 5]
    }),
  limit: z.coerce.number().min(1).max(100).default(20)
    .describe("每頁顯示的練習項目數量")
    .meta({
      title: "每頁數量",
      examples: [10, 20, 50]
    }),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional()
    .describe("按練習狀態篩選")
    .meta({
      title: "練習狀態",
      examples: ['active', 'paused', 'completed', 'archived'],
      enumDescriptions: {
        "active": "進行中的練習",
        "paused": "已暫停的練習",
        "completed": "已完成的練習",
        "archived": "已歸檔的練習"
      }
    }),
  contentType: z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom']).optional()
    .describe("按內容類型篩選練習")
    .meta({
      title: "內容類型",
      examples: ['book', 'video', 'articles', 'podcast', 'course', 'custom'],
      enumDescriptions: {
        "book": "書籍類型",
        "video": "影片類型",
        "articles": "文章類型",
        "podcast": "播客類型",
        "course": "課程類型",
        "custom": "自訂類型"
      }
    }),
  search: z.string().max(100).optional()
    .describe("搜尋關鍵詞，用於標題或內容搜尋")
    .meta({
      title: "搜尋關鍵詞",
      examples: ["React", "JavaScript", "前端開發"]
    }),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'progress']).default('createdAt')
    .describe("排序欄位")
    .meta({
      title: "排序方式",
      examples: ['createdAt', 'updatedAt', 'title', 'progress'],
      enumDescriptions: {
        "createdAt": "按創建時間排序",
        "updatedAt": "按更新時間排序",
        "title": "按標題排序",
        "progress": "按進度排序"
      }
    }),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
    .describe("排序方向")
    .meta({
      title: "排序方向",
      examples: ['asc', 'desc'],
      enumDescriptions: {
        "asc": "升序排列",
        "desc": "降序排列"
      }
    }),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
    .describe("開始日期篩選，格式為YYYY-MM-DD")
    .meta({
      title: "開始日期",
      examples: ["2024-01-01", "2024-03-15", "2024-12-01"]
    }),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
    .describe("結束日期篩選，格式為YYYY-MM-DD")
    .meta({
      title: "結束日期",
      examples: ["2024-12-31", "2024-06-30", "2025-01-31"]
    })
}).describe("個人練習列表查詢參數").meta({
  title: "練習查詢參數",
  examples: [{
    page: 1,
    limit: 20,
    status: "active",
    contentType: "book",
    search: "React",
    sortBy: "updatedAt",
    sortOrder: "desc",
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
  }]
});

export type PracticeQueryParams = z.infer<typeof practiceQuerySchema>;

// Practice stats query parameters schema
export const practiceStatsQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d')
    .describe("統計時間範圍")
    .meta({
      title: "時間範圍",
      examples: ['7d', '30d', '90d', '1y', 'all'],
      enumDescriptions: {
        "7d": "最近7天",
        "30d": "最近30天",
        "90d": "最近90天",
        "1y": "最近1年",
        "all": "全部時間"
      }
    }),
  includeArchived: z.coerce.boolean().default(false)
    .describe("是否包含已歸檔的練習統計")
    .meta({
      title: "包含歸檔項目",
      examples: [true, false]
    })
}).describe("個人練習統計查詢參數").meta({
  title: "練習統計查詢參數",
  examples: [{
    timeRange: "30d",
    includeArchived: false
  }]
});

export type PracticeStatsQueryParams = z.infer<typeof practiceStatsQuerySchema>;

// Resources query parameters schema
export const resourcesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1)
    .describe("資源列表的頁碼")
    .meta({
      title: "頁碼",
      examples: [1, 2, 5]
    }),
  limit: z.coerce.number().min(1).max(100).default(20)
    .describe("每頁顯示的資源數量")
    .meta({
      title: "每頁數量",
      examples: [10, 20, 50]
    }),
  category: z.string().max(50).optional()
    .describe("按資源分類篩選")
    .meta({
      title: "資源分類",
      examples: ["前端開發", "後端開發", "設計工具", "學習資源"]
    }),
  type: z.enum(['link', 'file', 'note', 'draft']).optional()
    .describe("按資源類型篩選")
    .meta({
      title: "資源類型",
      examples: ['link', 'file', 'note', 'draft'],
      enumDescriptions: {
        "link": "連結資源",
        "file": "檔案資源",
        "note": "筆記資源",
        "draft": "草稿資源"
      }
    }),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
    .describe("按資源狀態篩選")
    .meta({
      title: "資源狀態",
      examples: ['draft', 'published', 'archived'],
      enumDescriptions: {
        "draft": "草稿狀態",
        "published": "已發布",
        "archived": "已歸檔"
      }
    }),
  search: z.string().max(100).optional()
    .describe("搜尋關鍵詞，用於資源名稱或內容搜尋")
    .meta({
      title: "搜尋關鍵詞",
      examples: ["React", "API設計", "資料庫"]
    }),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt')
    .describe("排序欄位")
    .meta({
      title: "排序方式",
      examples: ['createdAt', 'updatedAt', 'name'],
      enumDescriptions: {
        "createdAt": "按創建時間排序",
        "updatedAt": "按更新時間排序",
        "name": "按資源名稱排序"
      }
    }),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
    .describe("排序方向")
    .meta({
      title: "排序方向",
      examples: ['asc', 'desc'],
      enumDescriptions: {
        "asc": "升序排列",
        "desc": "降序排列"
      }
    }),
  tags: z.string().optional()
    .describe("標籤篩選，多個標籤用逗號分隔")
    .meta({
      title: "標籤篩選",
      examples: ["React,JavaScript", "設計,UI", "後端,API"]
    })
}).describe("個人資源列表查詢參數").meta({
  title: "資源查詢參數",
  examples: [{
    page: 1,
    limit: 20,
    category: "前端開發",
    type: "link",
    status: "published",
    search: "React",
    sortBy: "updatedAt",
    sortOrder: "desc",
    tags: "React,JavaScript"
  }]
});

export type ResourcesQueryParams = z.infer<typeof resourcesQuerySchema>;

// Preferences query parameters schema
export const preferencesQuerySchema = z.object({
  category: z.string().max(50).optional()
    .describe("按偏好設定分類篩選")
    .meta({
      title: "偏好分類",
      examples: ["學習偏好", "通知設定", "隱私設定", "介面設定"]
    }),
  includeSystem: z.coerce.boolean().default(false)
    .describe("是否包含系統層級的偏好設定")
    .meta({
      title: "包含系統設定",
      examples: [true, false]
    })
}).describe("個人偏好設定查詢參數").meta({
  title: "偏好設定查詢參數",
  examples: [{
    category: "學習偏好",
    includeSystem: false
  }]
});

export type PreferencesQueryParams = z.infer<typeof preferencesQuerySchema>;

// Update preferences request schema
export const updatePreferencesSchema = z.object({
  preferences: z.array(z.object({
    preferenceTypeId: z.number().int().positive()
      .describe("偏好設定類型的唯一識別ID")
      .meta({
        title: "偏好類型ID",
        examples: [1, 2, 5, 10]
      }),
    optionId: z.number().int().positive()
      .describe("偏好選項的唯一識別ID")
      .meta({
        title: "偏好選項ID",
        examples: [101, 202, 305, 410]
      }),
    isSelected: z.boolean()
      .describe("是否選擇此偏好選項")
      .meta({
        title: "選擇狀態",
        examples: [true, false]
      }),
  }).describe("單個偏好設定項目").meta({
    title: "偏好設定項目",
    examples: [{
      preferenceTypeId: 1,
      optionId: 101,
      isSelected: true
    }]
  })).min(1, 'At least one preference must be provided').max(50, 'Too many preferences in one request')
    .describe("偏好設定更新的項目列表")
    .meta({
      title: "偏好設定列表",
      examples: [[
        {
          preferenceTypeId: 1,
          optionId: 101,
          isSelected: true
        },
        {
          preferenceTypeId: 2,
          optionId: 202,
          isSelected: false
        }
      ]]
    })
}).describe("更新個人偏好設定的請求資料").meta({
  title: "更新偏好設定",
  examples: [{
    preferences: [
      {
        preferenceTypeId: 1,
        optionId: 101,
        isSelected: true
      },
      {
        preferenceTypeId: 2,
        optionId: 202,
        isSelected: false
      }
    ]
  }]
});

// 額外的類型導出
export type UpdatePreferencesData = z.infer<typeof updatePreferencesSchema>;

// ===== Response Validation Schemas =====
// These schemas validate service response data for consistency

import {
  apiSuccessResponseSchema,
  paginatedApiResponseSchema
} from './api-response.validators';

// 我的實踐項目 Schema (基於 MyPracticeItem interface)
export const myPracticeItemSchema = z.object({
  id: z.string().describe("實踐項目的外部UUID"),
  title: z.string().describe("實踐項目標題"),
  contentType: z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom']).describe("內容類型"),
  customContentType: z.string().optional().describe("自定義內容類型"),
  totalAmount: z.number().int().min(1).describe("總學習量"),
  currentProgress: z.number().min(0).describe("當前進度"),
  startDate: z.string().optional().describe("開始日期 (YYYY-MM-DD)"),
  status: z.enum(['active', 'paused', 'completed', 'archived']).describe("實踐狀態"),
  streak: z.number().int().min(0).describe("當前連續天數"),
  maxStreak: z.number().int().min(0).describe("最大連續天數"),
  lastCheckInDate: z.string().optional().describe("最後簽到日期 (YYYY-MM-DD)"),
  createdAt: z.string().datetime().describe("創建時間"),
  updatedAt: z.string().datetime().optional().describe("更新時間"),
  dailyGoal: z.object({
    type: z.enum(['time', 'completion']).describe("目標類型"),
    timeMinutes: z.number().int().positive().optional().describe("每日時間目標(分鐘)"),
    amount: z.number().positive().optional().describe("每日數量目標"),
    unit: z.string().optional().describe("數量單位")
  }).describe("每日目標設定"),
  tags: z.array(z.string()).describe("相關標籤"),
  practiceAction: z.string().optional().describe("實踐行動描述"),
  hasResources: z.boolean().describe("是否有相關資源")
}).describe("我的實踐項目").meta({
  title: "我的實踐項目",
  examples: [{
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "學習React Hooks",
    contentType: "course",
    totalAmount: 20,
    currentProgress: 8,
    startDate: "2024-01-15",
    status: "active",
    streak: 5,
    maxStreak: 12,
    lastCheckInDate: "2024-01-20",
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-20T15:45:00.000Z",
    dailyGoal: {
      type: "time",
      timeMinutes: 60
    },
    tags: ["React", "前端", "Hooks"],
    practiceAction: "每天學習1小時React Hooks課程",
    hasResources: true
  }]
});

// 實踐統計資料 Schema (基於 PracticeStatsData interface)
export const practiceStatsDataSchema = z.object({
  totalPractices: z.number().int().min(0).describe("總實踐數"),
  activePractices: z.number().int().min(0).describe("活躍實踐數"),
  completedPractices: z.number().int().min(0).describe("已完成實踐數"),
  pausedPractices: z.number().int().min(0).describe("暫停的實踐數"),
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
    pausedPractices: 2,
    archivedPractices: 0,
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
}).describe("我的資源列表API回應");

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
}).describe("我的偏好設定API回應");

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
}).describe("更新偏好設定API回應");

