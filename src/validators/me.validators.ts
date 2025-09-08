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

