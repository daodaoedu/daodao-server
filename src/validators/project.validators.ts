/**
 * Project Validators
 * 專案驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import { apiErrorResponseSchema } from './api-response.validators';

// 專案動機驗證
const motivationSchema = z.unknown()
  .optional()
  .describe("專案動機資訊")
  .meta({
    title: "動機",
    examples: [null, { reason: "提升技術能力" }]
  });

// 專案策略驗證
const strategySchema = z.unknown()
  .optional()
  .describe("專案執行策略")
  .meta({
    title: "執行策略",
    examples: [null, { approach: "逐步學習" }]
  });

// 專案成果驗證
const outcomeSchema = z.unknown()
  .optional()
  .describe("專案預期成果")
  .meta({
    title: "預期成果",
    examples: [null, { deliverable: "完成網站開發" }]
  });

// 專案狀態驗證
const statusSchema = z.enum(['Not Started', 'Ongoing', 'Completed', 'Canceled'], "無效的專案狀態")
  .describe("專案完成狀態")
  .meta({
    title: "專案狀態",
    examples: ['Not Started', 'Ongoing', 'Completed', 'Canceled'],
    enumDescriptions: {
      "Not Started": "尚未開始",
      "Ongoing": "進行中",
      "Completed": "已完成",
      "Canceled": "已取消"
    }
  });

// 創建專案驗證
export const createProjectSchema = z.object({
  title: z.string()
    .min(1, '專案標題不能為空')
    .max(100, '專案標題不能超過 100 字元')
    .optional()
    .describe("專案標題")
    .meta({
      title: "專案標題",
      examples: ["學習 React 全端開發", "個人品牌網站建置", "機器學習專案實作"]
    }),
  description: z.string()
    .max(2000, '專案描述不能超過 2000 字元')
    .optional()
    .describe("專案的詳細描述")
    .meta({
      title: "專案描述",
      examples: ["這個專案旨在學習 React 全端開發，包含前後端整合和部署流程", "建置個人品牌網站，展示作品集和技術能力"]
    }),
  motivation: motivationSchema,
  motivationDescription: z.string()
    .max(1000, '動機描述不能超過 1000 字元')
    .optional()
    .describe("專案動機的詳細描述")
    .meta({
      title: "動機描述",
      examples: ["希望提升自己的全端開發能力，為轉職做準備", "想要建立個人品牌，展示專業能力"]
    }),
  goal: z.string()
    .max(500, '專案目標不能超過 500 字元')
    .optional()
    .describe("專案的具體目標")
    .meta({
      title: "專案目標",
      examples: ["在 3 個月內完成一個具有前後端功能的完整應用", "建立一個具有 SEO 優化的響應式網站"]
    }),
  content: z.string()
    .max(5000, '專案內容不能超過 5000 字元')
    .optional()
    .describe("專案的詳細內容和計劃")
    .meta({
      title: "專案內容",
      examples: ["本專案將分為以下階段：1. 學習 React 基礎 2. 開發後端 API 3. 整合前後端 4. 部署上線"]
    }),
  strategy: strategySchema,
  strategyDescription: z.string()
    .max(1000, '策略描述不能超過 1000 字元')
    .optional()
    .describe("專案執行策略的描述")
    .meta({
      title: "執行策略",
      examples: ["每週 20 小時的學習時間，先理論後實作", "按照敏捷開發模式，每兩週一個迭代"]
    }),
  resources: z.string()
    .max(2000, '資源描述不能超過 2000 字元')
    .optional()
    .describe("專案所需資源")
    .meta({
      title: "所需資源",
      examples: ["React 官方文檔、Node.js 教學、雲端伺服器費用", "設計軟體、網域費用、主機空間"]
    }),
  outcome: outcomeSchema,
  outcomeDescription: z.string()
    .max(1000, '成果描述不能超過 1000 字元')
    .optional()
    .describe("預期成果的描述")
    .meta({
      title: "預期成果",
      examples: ["完成一個具有用戶管理、內容管理系統的網站", "獲得 React 全端開發技能及相關證書"]
    }),
  isPublic: z.boolean()
    .optional()
    .describe("是否為公開專案")
    .meta({
      title: "公開專案",
      examples: [true, false]
    }),
  status: statusSchema.optional(),
  startDate: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional()
    .describe("專案開始日期")
    .meta({
      title: "開始日期",
      examples: ["2024-01-15T09:00:00.000Z", "2024-03-01T08:30:00.000Z"]
    }),
  endDate: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional()
    .describe("專案結束日期")
    .meta({
      title: "結束日期",
      examples: ["2024-04-15T18:00:00.000Z", "2024-06-01T17:30:00.000Z"]
    }),
  interval: z.number()
    .int('間隔必須是整數')
    .min(1, '間隔必須大於 0')
    .max(365, '間隔不能超過 365 天')
    .optional()
    .describe("專案執行間隔天數")
    .meta({
      title: "執行間隔",
      examples: [1, 7, 14, 30]
    }),
  imgUrl: z.string()
    .url('圖片 URL 格式不正確')
    .optional()
    .describe("專案封面圖片 URL")
    .meta({
      title: "專案圖片",
      examples: ["https://example.com/project-cover.jpg", "https://cdn.example.com/projects/react-project.png"]
    })
}).describe("創建專案的請求資料").meta({
  title: "創建專案",
  examples: [{
    title: "學習 React 全端開發",
    description: "學習從零開始開發一個完整的 React 全端應用",
    goal: "在 3 個月內掌握 React 全棧開發技能",
    isPublic: true,
    status: "Not Started",
    startDate: "2024-01-15T09:00:00.000Z",
    endDate: "2024-04-15T18:00:00.000Z",
    interval: 7
  }]
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: '開始日期不能晚於結束日期',
    path: ['endDate']
  }
);

// 更新專案驗證
export const updateProjectSchema = z.object({
  title: z.string()
    .min(1, '專案標題不能為空')
    .max(100, '專案標題不能超過 100 字元')
    .optional()
    .describe("專案標題")
    .meta({
      title: "專案標題",
      examples: ["學習 React 全端開發", "個人品牌網站建置", "機器學習專案實作"]
    }),
  description: z.string()
    .max(2000, '專案描述不能超過 2000 字元')
    .optional()
    .describe("專案的詳細描述")
    .meta({
      title: "專案描述",
      examples: ["這個專案旨在學習 React 全端開發，包含前後端整合和部署流程", "建置個人品牌網站，展示作品集和技術能力"]
    }),
  motivation: motivationSchema,
  motivationDescription: z.string()
    .max(1000, '動機描述不能超過 1000 字元')
    .optional()
    .describe("專案動機的詳細描述")
    .meta({
      title: "動機描述",
      examples: ["希望提升自己的全端開發能力，為轉職做準備", "想要建立個人品牌，展示專業能力"]
    }),
  goal: z.string()
    .max(500, '專案目標不能超過 500 字元')
    .optional()
    .describe("專案的具體目標")
    .meta({
      title: "專案目標",
      examples: ["在 3 個月內完成一個具有前後端功能的完整應用", "建立一個具有 SEO 優化的響應式網站"]
    }),
  content: z.string()
    .max(5000, '專案內容不能超過 5000 字元')
    .optional()
    .describe("專案的詳細內容和計劃")
    .meta({
      title: "專案內容",
      examples: ["本專案將分為以下階段：1. 學習 React 基礎 2. 開發後端 API 3. 整合前後端 4. 部署上線"]
    }),
  strategy: strategySchema,
  strategyDescription: z.string()
    .max(1000, '策略描述不能超過 1000 字元')
    .optional()
    .describe("專案執行策略的描述")
    .meta({
      title: "執行策略",
      examples: ["每週 20 小時的學習時間，先理論後實作", "按照敏捷開發模式，每兩週一個迭代"]
    }),
  resources: z.string()
    .max(2000, '資源描述不能超過 2000 字元')
    .optional()
    .describe("專案所需資源")
    .meta({
      title: "所需資源",
      examples: ["React 官方文檔、Node.js 教學、雲端伺服器費用", "設計軟體、網域費用、主機空間"]
    }),
  outcome: outcomeSchema,
  outcomeDescription: z.string()
    .max(1000, '成果描述不能超過 1000 字元')
    .optional()
    .describe("預期成果的描述")
    .meta({
      title: "預期成果",
      examples: ["完成一個具有用戶管理、內容管理系統的網站", "獲得 React 全端開發技能及相關證書"]
    }),
  isPublic: z.boolean()
    .optional()
    .describe("是否為公開專案")
    .meta({
      title: "公開專案",
      examples: [true, false]
    }),
  status: statusSchema.optional(),
  startDate: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional()
    .describe("專案開始日期")
    .meta({
      title: "開始日期",
      examples: ["2024-01-15T09:00:00.000Z", "2024-03-01T08:30:00.000Z"]
    }),
  endDate: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional()
    .describe("專案結束日期")
    .meta({
      title: "結束日期",
      examples: ["2024-04-15T18:00:00.000Z", "2024-06-01T17:30:00.000Z"]
    }),
  interval: z.number()
    .int('間隔必須是整數')
    .min(1, '間隔必須大於 0')
    .max(365, '間隔不能超過 365 天')
    .optional()
    .describe("專案執行間隔天數")
    .meta({
      title: "執行間隔",
      examples: [1, 7, 14, 30]
    }),
  imgUrl: z.string()
    .url('圖片 URL 格式不正確')
    .optional()
    .describe("專案封面圖片 URL")
    .meta({
      title: "專案圖片",
      examples: ["https://example.com/project-cover.jpg", "https://cdn.example.com/projects/react-project.png"]
    })
}).describe("更新專案的請求資料").meta({
  title: "更新專案",
  examples: [{
    title: "學習 React 全端開發 (更新版)",
    description: "更新專案描述，加入更多實作細節",
    goal: "在 4 個月內掌握 React 全棧開發技能",
    isPublic: true,
    status: "Ongoing"
  }]
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: '開始日期不能晚於結束日期',
    path: ['endDate']
  }
);

// 專案 ID 參數驗證
export const projectParamsSchema = z.object({
  id: z.string()
    .uuid('專案 ID 格式不正確')
    .describe("專案唯一識別碼")
    .meta({
      title: "專案 ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "550e8400-e29b-41d4-a716-446655440000"]
    })
}).describe("專案路徑參數").meta({
  title: "專案參數",
  examples: [{
    id: "123e4567-e89b-12d3-a456-426614174000"
  }]
});

// 專案查詢參數驗證
export const projectQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, '頁碼必須是數字')
    .transform(Number)
    .refine(n => n > 0, '頁碼必須大於 0')
    .optional()
    .describe("頁碼")
    .meta({
      title: "頁碼",
      examples: ["1", "2", "10"]
    }),
  limit: z.string()
    .regex(/^\d+$/, '每頁數量必須是數字')
    .transform(Number)
    .refine(n => n > 0 && n <= 100, '每頁數量必須在 1-100 之間')
    .optional()
    .describe("每頁項目數")
    .meta({
      title: "每頁數量",
      examples: ["10", "20", "50"]
    }),
  status: statusSchema.optional(),
  isPublic: z.string()
    .transform(val => val === 'true')
    .optional()
    .describe("是否只查詢公開專案")
    .meta({
      title: "公開專案篩選",
      examples: ["true", "false"]
    }),
  userId: z.string()
    .regex(/^\d+$/, '使用者 ID 必須是數字')
    .transform(Number)
    .optional()
    .describe("指定用戶ID篩選")
    .meta({
      title: "用戶 ID",
      examples: ["123", "456", "789"]
    }),
  search: z.string()
    .max(100, '搜尋關鍵字不能超過 100 字元')
    .optional()
    .describe("搜尋關鍵字")
    .meta({
      title: "搜尋關鍵字",
      examples: ["React", "網站開發", "機器學習"]
    }),
  sortBy: z.enum([
    'createdAt',
    'updatedAt',
    'title',
    'startDate',
    'endDate'
  ], "排序欄位無效")
    .optional()
    .describe("排序欄位")
    .meta({
      title: "排序欄位",
      examples: ['createdAt', 'updatedAt', 'title', 'startDate', 'endDate'],
      enumDescriptions: {
        "createdAt": "建立時間",
        "updatedAt": "更新時間",
        "title": "標題",
        "startDate": "開始日期",
        "endDate": "結束日期"
      }
    }),
  sortOrder: z.enum(['asc', 'desc'], "排序順序無效")
    .optional()
    .describe("排序順序")
    .meta({
      title: "排序順序",
      examples: ['asc', 'desc'],
      enumDescriptions: {
        "asc": "升序",
        "desc": "降序"
      }
    })
}).describe("專案查詢參數").meta({
  title: "專案查詢",
  examples: [{
    page: "1",
    limit: "20",
    status: "Ongoing",
    isPublic: "true",
    search: "React",
    sortBy: "createdAt",
    sortOrder: "desc"
  }]
});

// 複製專案驗證
export const duplicateProjectSchema = z.object({
  title: z.string()
    .min(1, '新專案標題不能為空')
    .max(100, '新專案標題不能超過 100 字元')
    .optional()
    .describe("複製專案的新標題")
    .meta({
      title: "新專案標題",
      examples: ["學習 React 全端開發 (副本)", "個人品牌網站建置 v2"]
    })
}).describe("複製專案的請求資料").meta({
  title: "複製專案",
  examples: [{
    title: "學習 React 全端開發 (副本)"
  }]
});

// 專案統計查詢參數驗證
export const projectStatsQuerySchema = z.object({
  userId: z.string()
    .regex(/^\d+$/, '使用者 ID 必須是數字')
    .transform(Number)
    .optional()
});

// 批量操作驗證
export const batchProjectOperationSchema = z.object({
  action: z.enum(['delete', 'updateStatus', 'changeVisibility']),
  projectIds: z.array(
    z.string().uuid('專案 ID 格式不正確')
  ).min(1, '至少選擇一個專案'),
  data: z.object({
    status: statusSchema.optional(),
    isPublic: z.boolean().optional()
  }).optional()
}).refine(
  (data) => {
    if (data.action === 'updateStatus') {
      return data.data?.status !== undefined;
    }
    if (data.action === 'changeVisibility') {
      return data.data?.isPublic !== undefined;
    }
    return true;
  },
  {
    message: '操作所需的資料不完整',
    path: ['data']
  }
);


export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type ProjectParams = z.infer<typeof projectParamsSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
export type DuplicateProjectData = z.infer<typeof duplicateProjectSchema>;
export type ProjectStatsQuery = z.infer<typeof projectStatsQuerySchema>;
export type BatchProjectOperation = z.infer<typeof batchProjectOperationSchema>;

// =====================================
// Response Validation Schemas
// =====================================

// 基於 ProjectResponse 接口的使用者資訊驗證
const userResponseSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  _id: z.string().nullable(),
  roleList: z.array(z.string()),
  photoURL: z.string().nullable()
}).nullable();

// 基於 ProjectResponse 接口的任務響應驗證
const taskResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.number(),
  description: z.string(),
  daysOfWeek: z.unknown(),
  isCompleted: z.boolean()
});

// 基於 ProjectResponse 接口的里程碑響應驗證
const milestoneResponseSchema = z.object({
  id: z.number(),
  position: z.number(),
  name: z.string(),
  description: z.string(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  isCompleted: z.boolean(),
  tasks: z.array(taskResponseSchema)
});

// 基於 ProjectResponse 接口的專案響應驗證
export const projectResponseSchema = z.object({
  id: z.string(),
  userId: z.number(),
  imgUrl: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  motivation: z.unknown(),
  motivationDescription: z.string().nullable(),
  goal: z.string().nullable(),
  content: z.string().nullable(),
  strategy: z.unknown(),
  strategyDescription: z.string().nullable(),
  resources: z.string().nullable(),
  outcome: z.unknown(),
  outcomeDescription: z.string().nullable(),
  isPublic: z.boolean(),
  status: z.string(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  interval: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number(),
  user: userResponseSchema,
  milestones: z.array(milestoneResponseSchema)
});

// 基於 ProjectStats 接口的統計響應驗證
export const projectStatsResponseSchema = z.object({
  total_projects: z.number(),
  ongoing_projects: z.number(),
  completed_projects: z.number(),
  not_started_projects: z.number(),
  canceled_projects: z.number()
});

// 分頁資訊驗證（基於 api-response.types.ts）
const paginationSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  itemsPerPage: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean()
});

// 響應元數據驗證（基於 api-response.types.ts）
const responseMetaSchema = z.object({
  searchQuery: z.string().optional(),
  searchTime: z.number().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  categoryCounts: z.record(z.string(), z.number()).optional(),
  aggregateData: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().optional(),
  cacheHit: z.boolean().optional(),
  processingTime: z.number().optional(),
  message: z.string().optional()
}).catchall(z.unknown());

// API 成功響應基礎驗證（基於 ApiSuccessResponse）
const baseSuccessResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string(),
  meta: responseMetaSchema.optional()
});

// API 錯誤響應驗證 - using imported schema

// 單一專案成功響應驗證（基於 ApiSuccessResponse<ProjectResponse>）
export const singleProjectResponseSchema = baseSuccessResponseSchema.extend({
  data: projectResponseSchema
});

// 專案列表成功響應驗證（基於 PaginatedApiResponse<ProjectResponse>）
export const projectListResponseSchema = baseSuccessResponseSchema.extend({
  data: z.array(projectResponseSchema),
  pagination: paginationSchema
});

// 專案統計成功響應驗證（基於 ApiSuccessResponse<ProjectStats>）
export const projectStatsSuccessResponseSchema = baseSuccessResponseSchema.extend({
  data: projectStatsResponseSchema
});

// 刪除專案成功響應驗證（基於 ApiSuccessResponse<void>）
export const deleteProjectResponseSchema = baseSuccessResponseSchema.extend({
  data: z.undefined()
});

// 專案 API 響應聯合類型
export const projectApiResponseSchema = z.union([
  singleProjectResponseSchema,
  apiErrorResponseSchema
]);

export const projectListApiResponseSchema = z.union([
  projectListResponseSchema,
  apiErrorResponseSchema
]);

export const projectStatsApiResponseSchema = z.union([
  projectStatsSuccessResponseSchema,
  apiErrorResponseSchema
]);

export const deleteProjectApiResponseSchema = z.union([
  deleteProjectResponseSchema,
  apiErrorResponseSchema
]);

// Response validation TypeScript 類型導出
export type ProjectResponseValidated = z.infer<typeof projectResponseSchema>;
export type ProjectStatsResponseValidated = z.infer<typeof projectStatsResponseSchema>;
export type ApiErrorResponseValidated = z.infer<typeof apiErrorResponseSchema>;
export type SingleProjectResponseValidated = z.infer<typeof singleProjectResponseSchema>;
export type ProjectListResponseValidated = z.infer<typeof projectListResponseSchema>;
export type ProjectStatsSuccessResponseValidated = z.infer<typeof projectStatsSuccessResponseSchema>;
export type DeleteProjectResponseValidated = z.infer<typeof deleteProjectResponseSchema>;