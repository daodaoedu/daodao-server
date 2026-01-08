/**
 * Project Validators
 * 專案驗證器 - 使用 Zod 進行資料驗證和 OpenAPI 整合
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  apiSuccessResponseSchema,
  paginatedApiResponseSchema
} from './api-response.validators';

// 專案動機驗證
const motivationSchema = z.unknown()
  .optional()
  .openapi({
    description: '專案動機資訊',
    example: { reason: "提升技術能力" }
  });

// 專案策略驗證
const strategySchema = z.unknown()
  .optional()
  .openapi({
    description: '專案執行策略',
    example: { approach: "逐步學習" }
  });

// 專案成果驗證
const outcomeSchema = z.unknown()
  .optional()
  .openapi({
    description: '專案預期成果',
    example: { deliverable: "完成網站開發" }
  });

// 專案狀態驗證
const statusSchema = z.enum(['Not Started', 'Ongoing', 'Completed', 'Canceled'], { message: "無效的專案狀態" })
  .openapi({
    description: '專案完成狀態',
    example: 'Not Started',
    examples: ['Not Started', 'Ongoing', 'Completed', 'Canceled']
  });

// 創建專案驗證
export const createProjectSchema = z.object({
  title: z.string()
    .min(1, '專案標題不能為空')
    .max(100, '專案標題不能超過 100 字元')
    .optional()
    .openapi({
      description: '專案標題',
      example: '學習 React 全端開發',
      examples: ['學習 React 全端開發', '個人品牌網站建置', '機器學習專案實作']
    }),
  description: z.string()
    .max(2000, '專案描述不能超過 2000 字元')
    .optional()
    .openapi({
      description: '專案的詳細描述',
      example: '這個專案旨在學習 React 全端開發，包含前後端整合和部署流程'
    }),
  motivation: motivationSchema,
  motivationDescription: z.string()
    .max(1000, '動機描述不能超過 1000 字元')
    .optional()
    .openapi({
      description: '專案動機的詳細描述',
      example: '希望提升自己的全端開發能力，為轉職做準備'
    }),
  goal: z.string()
    .max(500, '專案目標不能超過 500 字元')
    .optional()
    .openapi({
      description: '專案的具體目標',
      example: '在 3 個月內完成一個具有前後端功能的完整應用'
    }),
  content: z.string()
    .max(5000, '專案內容不能超過 5000 字元')
    .optional()
    .openapi({
      description: '專案的詳細內容和計劃',
      example: '本專案將分為以下階段：1. 學習 React 基礎 2. 開發後端 API 3. 整合前後端 4. 部署上線'
    }),
  strategy: strategySchema,
  strategyDescription: z.string()
    .max(1000, '策略描述不能超過 1000 字元')
    .optional()
    .openapi({
      description: '專案執行策略的描述',
      example: '每週 20 小時的學習時間，先理論後實作'
    }),
  resources: z.string()
    .max(2000, '資源描述不能超過 2000 字元')
    .optional()
    .openapi({
      description: '專案所需資源',
      example: 'React 官方文檔、Node.js 教學、雲端伺服器費用'
    }),
  outcome: outcomeSchema,
  outcomeDescription: z.string()
    .max(1000, '成果描述不能超過 1000 字元')
    .optional()
    .openapi({
      description: '預期成果的描述',
      example: '完成一個具有用戶管理、內容管理系統的網站'
    }),
  isPublic: z.boolean()
    .optional()
    .openapi({
      description: '是否為公開專案',
      example: true
    }),
  status: statusSchema.optional(),
  startDate: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional()
    .openapi({
      description: '專案開始日期',
      example: '2024-01-15T09:00:00.000Z',
      format: 'date-time'
    }),
  endDate: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional()
    .openapi({
      description: '專案結束日期',
      example: '2024-04-15T18:00:00.000Z',
      format: 'date-time'
    }),
  interval: z.number()
    .int('間隔必須是整數')
    .min(1, '間隔必須大於 0')
    .max(365, '間隔不能超過 365 天')
    .optional()
    .openapi({
      description: '專案執行間隔天數',
      example: 7,
      examples: [1, 7, 14, 30]
    }),
  imgUrl: z.string()
    .url('圖片 URL 格式不正確')
    .optional()
    .openapi({
      description: '專案封面圖片 URL',
      example: 'https://example.com/project-cover.jpg',
      format: 'uri'
    })
}).openapi('CreateProjectRequest', {
  description: '創建專案的請求資料'
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

// 註冊 CreateProjectRequest
registry.register('CreateProjectRequest', createProjectSchema);

// 更新專案驗證
export const updateProjectSchema = z.object({
  title: z.string()
    .min(1, '專案標題不能為空')
    .max(100, '專案標題不能超過 100 字元')
    .optional()
    .openapi({
      description: '專案標題',
      example: '學習 React 全端開發',
      examples: ['學習 React 全端開發', '個人品牌網站建置', '機器學習專案實作']
    }),
  description: z.string()
    .max(2000, '專案描述不能超過 2000 字元')
    .optional()
    .openapi({
      description: '專案的詳細描述',
      example: '這個專案旨在學習 React 全端開發，包含前後端整合和部署流程'
    }),
  motivation: motivationSchema,
  motivationDescription: z.string()
    .max(1000, '動機描述不能超過 1000 字元')
    .optional()
    .openapi({
      description: '專案動機的詳細描述',
      example: '希望提升自己的全端開發能力，為轉職做準備'
    }),
  goal: z.string()
    .max(500, '專案目標不能超過 500 字元')
    .optional()
    .openapi({
      description: '專案的具體目標',
      example: '在 3 個月內完成一個具有前後端功能的完整應用'
    }),
  content: z.string()
    .max(5000, '專案內容不能超過 5000 字元')
    .optional()
    .openapi({
      description: '專案的詳細內容和計劃',
      example: '本專案將分為以下階段：1. 學習 React 基礎 2. 開發後端 API 3. 整合前後端 4. 部署上線'
    }),
  strategy: strategySchema,
  strategyDescription: z.string()
    .max(1000, '策略描述不能超過 1000 字元')
    .optional()
    .openapi({
      description: '專案執行策略的描述',
      example: '每週 20 小時的學習時間，先理論後實作'
    }),
  resources: z.string()
    .max(2000, '資源描述不能超過 2000 字元')
    .optional()
    .openapi({
      description: '專案所需資源',
      example: 'React 官方文檔、Node.js 教學、雲端伺服器費用'
    }),
  outcome: outcomeSchema,
  outcomeDescription: z.string()
    .max(1000, '成果描述不能超過 1000 字元')
    .optional()
    .openapi({
      description: '預期成果的描述',
      example: '完成一個具有用戶管理、內容管理系統的網站'
    }),
  isPublic: z.boolean()
    .optional()
    .openapi({
      description: '是否為公開專案',
      example: true
    }),
  status: statusSchema.optional(),
  startDate: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional()
    .openapi({
      description: '專案開始日期',
      example: '2024-01-15T09:00:00.000Z',
      format: 'date-time'
    }),
  endDate: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional()
    .openapi({
      description: '專案結束日期',
      example: '2024-04-15T18:00:00.000Z',
      format: 'date-time'
    }),
  interval: z.number()
    .int('間隔必須是整數')
    .min(1, '間隔必須大於 0')
    .max(365, '間隔不能超過 365 天')
    .optional()
    .openapi({
      description: '專案執行間隔天數',
      example: 7,
      examples: [1, 7, 14, 30]
    }),
  imgUrl: z.string()
    .url('圖片 URL 格式不正確')
    .optional()
    .openapi({
      description: '專案封面圖片 URL',
      example: 'https://example.com/project-cover.jpg',
      format: 'uri'
    })
}).openapi('UpdateProjectRequest', {
  description: '更新專案的請求資料'
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

// 註冊 UpdateProjectRequest
registry.register('UpdateProjectRequest', updateProjectSchema);

// 專案 ID 參數驗證
export const projectParamsSchema = z.object({
  id: z.string()
    .uuid('專案 ID 格式不正確')
    .openapi({
      description: '專案唯一識別碼 (UUID)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    })
}).openapi({
  description: '專案路徑參數'
});

// 專案查詢參數驗證
export const projectQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, '頁碼必須是數字')
    .transform(Number)
    .refine(n => n > 0, '頁碼必須大於 0')
    .optional()
    .openapi({
      description: '頁碼',
      example: '1',
      examples: ['1', '2', '10']
    }),
  limit: z.string()
    .regex(/^\d+$/, '每頁數量必須是數字')
    .transform(Number)
    .refine(n => n > 0 && n <= 100, '每頁數量必須在 1-100 之間')
    .optional()
    .openapi({
      description: '每頁項目數',
      example: '10',
      examples: ['10', '20', '50']
    }),
  status: statusSchema.optional(),
  isPublic: z.string()
    .transform(val => val === 'true')
    .optional()
    .openapi({
      description: '是否只查詢公開專案',
      example: 'true',
      examples: ['true', 'false']
    }),
  userId: z.string()
    .regex(/^\d+$/, '使用者 ID 必須是數字')
    .transform(Number)
    .optional()
    .openapi({
      description: '指定用戶ID篩選',
      example: '123',
      examples: ['123', '456', '789']
    }),
  search: z.string()
    .max(100, '搜尋關鍵字不能超過 100 字元')
    .optional()
    .openapi({
      description: '搜尋關鍵字',
      example: 'React',
      examples: ['React', '網站開發', '機器學習']
    }),
  sortBy: z.enum([
    'createdAt',
    'updatedAt',
    'title',
    'startDate',
    'endDate'
  ], { message: "排序欄位無效" })
    .optional()
    .openapi({
      description: '排序欄位',
      example: 'createdAt',
      examples: ['createdAt', 'updatedAt', 'title', 'startDate', 'endDate']
    }),
  sortOrder: z.enum(['asc', 'desc'], { message: "排序順序無效" })
    .optional()
    .openapi({
      description: '排序順序',
      example: 'desc',
      examples: ['asc', 'desc']
    })
}).openapi({
  description: '專案查詢參數'
});

// 複製專案驗證
export const duplicateProjectSchema = z.object({
  title: z.string()
    .min(1, '新專案標題不能為空')
    .max(100, '新專案標題不能超過 100 字元')
    .optional()
    .openapi({
      description: '複製專案的新標題',
      example: '學習 React 全端開發 (副本)',
      examples: ['學習 React 全端開發 (副本)', '個人品牌網站建置 v2']
    })
}).openapi('DuplicateProjectRequest', {
  description: '複製專案的請求資料'
});

// 註冊 DuplicateProjectRequest
registry.register('DuplicateProjectRequest', duplicateProjectSchema);

// 專案統計查詢參數驗證
export const projectStatsQuerySchema = z.object({
  userId: z.string()
    .regex(/^\d+$/, '使用者 ID 必須是數字')
    .transform(Number)
    .optional()
    .openapi({
      description: '指定用戶ID進行統計',
      example: '123'
    })
}).openapi({
  description: '專案統計查詢參數'
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
  id: z.string(),
  name: z.string(),
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
  id: z.string().openapi({
    description: '專案 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  }),
  userId: z.number().openapi({
    description: '專案擁有者的用戶 ID',
    example: 123
  }),
  imgUrl: z.string().nullable().openapi({
    description: '專案封面圖片 URL',
    example: 'https://example.com/project-cover.jpg',
    format: 'uri'
  }),
  title: z.string().openapi({
    description: '專案標題',
    example: '學習 React 全端開發'
  }),
  description: z.string().openapi({
    description: '專案描述',
    example: '這個專案旨在學習 React 全端開發'
  }),
  motivation: z.unknown().openapi({
    description: '專案動機資訊'
  }),
  motivationDescription: z.string().nullable().openapi({
    description: '動機描述'
  }),
  goal: z.string().nullable().openapi({
    description: '專案目標'
  }),
  content: z.string().nullable().openapi({
    description: '專案內容'
  }),
  strategy: z.unknown().openapi({
    description: '執行策略'
  }),
  strategyDescription: z.string().nullable().openapi({
    description: '策略描述'
  }),
  resources: z.string().nullable().openapi({
    description: '所需資源'
  }),
  outcome: z.unknown().openapi({
    description: '預期成果'
  }),
  outcomeDescription: z.string().nullable().openapi({
    description: '成果描述'
  }),
  isPublic: z.boolean().openapi({
    description: '是否為公開專案',
    example: true
  }),
  status: z.string().openapi({
    description: '專案狀態',
    example: 'Ongoing',
    examples: ['Not Started', 'Ongoing', 'Completed', 'Canceled']
  }),
  startDate: z.date().nullable().openapi({
    description: '開始日期',
    type: 'string',
    format: 'date-time'
  }),
  endDate: z.date().nullable().openapi({
    description: '結束日期',
    type: 'string',
    format: 'date-time'
  }),
  interval: z.number().nullable().openapi({
    description: '執行間隔天數',
    example: 7
  }),
  createdAt: z.date().openapi({
    description: '建立時間',
    type: 'string',
    format: 'date-time'
  }),
  updatedAt: z.date().openapi({
    description: '更新時間',
    type: 'string',
    format: 'date-time'
  }),
  version: z.number().openapi({
    description: '版本號',
    example: 1
  }),
  user: userResponseSchema,
  milestones: z.array(milestoneResponseSchema).openapi({
    description: '專案里程碑列表'
  })
}).openapi('ProjectResponse', {
  description: '專案詳細資料'
});

// 註冊 ProjectResponse
registry.register('ProjectResponse', projectResponseSchema);

// 基於 ProjectStats 接口的統計響應驗證
export const projectStatsDataSchema = z.object({
  total_projects: z.number().openapi({
    description: '專案總數',
    example: 25
  }),
  ongoing_projects: z.number().openapi({
    description: '進行中的專案數',
    example: 10
  }),
  completed_projects: z.number().openapi({
    description: '已完成的專案數',
    example: 12
  }),
  not_started_projects: z.number().openapi({
    description: '未開始的專案數',
    example: 2
  }),
  canceled_projects: z.number().openapi({
    description: '已取消的專案數',
    example: 1
  })
}).openapi('ProjectStats', {
  description: '專案統計資料'
});

// 註冊 ProjectStats
registry.register('ProjectStats', projectStatsDataSchema);

// 使用標準化的響應 schemas
// 單一專案成功響應
export const singleProjectResponseSchema = apiSuccessResponseSchema(projectResponseSchema);

// 專案列表分頁響應
export const projectListResponseSchema = paginatedApiResponseSchema(projectResponseSchema);

// 專案統計成功響應
export const projectStatsSuccessResponseSchema = apiSuccessResponseSchema(projectStatsDataSchema);

// 刪除專案成功響應
export const deleteProjectResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().openapi({
      description: '成功訊息',
      example: '專案已成功刪除'
    })
  })
);

// Response validation TypeScript 類型導出
export type ProjectResponseValidated = z.infer<typeof projectResponseSchema>;
export type ProjectStatsDataValidated = z.infer<typeof projectStatsDataSchema>;
export type SingleProjectResponseValidated = z.infer<typeof singleProjectResponseSchema>;
export type ProjectListResponseValidated = z.infer<typeof projectListResponseSchema>;
export type ProjectStatsSuccessResponseValidated = z.infer<typeof projectStatsSuccessResponseSchema>;
export type DeleteProjectResponseValidated = z.infer<typeof deleteProjectResponseSchema>;