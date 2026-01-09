/**
 * Milestone Validators
 * 里程碑驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import { apiErrorResponseSchema, responseMetaSchema } from './api-response.validators';

// 里程碑創建驗證
export const createMilestoneSchema = z.object({
  position: z.number()
    .int('位置必須是整數')
    .min(1, '位置必須大於 0')
    .optional()
    .describe("里程碑順序位置")
    .meta({
      title: "位置順序",
      examples: [1, 2, 3, 4]
    }),
  name: z.string()
    .min(1, '里程碑名稱不能為空')
    .max(100, '里程碑名稱不能超過 100 字元')
    .describe("里程碑名稱")
    .meta({
      title: "里程碑名稱",
      examples: ["完成需求分析", "前端原型開發", "後端 API 實作", "系統整合測試"]
    }),
  description: z.string()
    .max(1000, '里程碑描述不能超過 1000 字元')
    .optional()
    .describe("里程碑詳細描述")
    .meta({
      title: "里程碑描述",
      examples: ["分析用戶需求並制定開發規格", "完成前端頁面設計和基本功能實作"]
    }),
  startDate: z.string()
    .min(1, '開始日期不能為空')
    .describe("里程碑開始日期")
    .meta({
      title: "開始日期",
      examples: ["2024-01-15", "2024-03-01"]
    }),
  endDate: z.string()
    .min(1, '結束日期不能為空')
    .describe("里程碑結束日期")
    .meta({
      title: "結束日期",
      examples: ["2024-02-15", "2024-03-31"]
    }),
  isCompleted: z.boolean()
    .optional()
    .default(false)
    .describe("是否已完成")
    .meta({
      title: "完成狀態",
      examples: [true, false]
    })
}).describe("創建里程碑的請求資料").meta({
  title: "創建里程碑",
  examples: [{
    position: 1,
    name: "完成需求分析",
    description: "分析用戶需求並制定開發規格",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    isCompleted: false
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

// 里程碑更新驗證
export const updateMilestoneSchema = z.object({
  position: z.number()
    .int('位置必須是整數')
    .min(1, '位置必須大於 0')
    .optional()
    .describe("里程碑順序位置")
    .meta({
      title: "位置順序",
      examples: [1, 2, 3, 4]
    }),
  name: z.string()
    .min(1, '里程碑名稱不能為空')
    .max(100, '里程碑名稱不能超過 100 字元')
    .optional()
    .describe("里程碑名稱")
    .meta({
      title: "里程碑名稱",
      examples: ["完成需求分析", "前端原型開發", "後端 API 實作", "系統整合測試"]
    }),
  description: z.string()
    .max(1000, '里程碑描述不能超過 1000 字元')
    .optional()
    .describe("里程碑詳細描述")
    .meta({
      title: "里程碑描述",
      examples: ["分析用戶需求並制定開發規格", "完成前端頁面設計和基本功能實作"]
    }),
  startDate: z.string()
    .min(1, '開始日期不能為空')
    .optional()
    .describe("里程碑開始日期")
    .meta({
      title: "開始日期",
      examples: ["2024-01-15", "2024-03-01"]
    }),
  endDate: z.string()
    .min(1, '結束日期不能為空')
    .optional()
    .describe("里程碑結束日期")
    .meta({
      title: "結束日期",
      examples: ["2024-02-15", "2024-03-31"]
    }),
  isCompleted: z.boolean()
    .optional()
    .describe("是否已完成")
    .meta({
      title: "完成狀態",
      examples: [true, false]
    })
}).describe("更新里程碑的請求資料").meta({
  title: "更新里程碑",
  examples: [{
    name: "完成需求分析 (更新版)",
    description: "更新需求分析階段的詳細內容",
    isCompleted: true
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

// 里程碑 ID 參數驗證
export const milestoneParamsSchema = z.object({
  milestoneId: z.string()
    .regex(/^\d+$/, '里程碑 ID 必須是數字')
    .transform(Number)
    .describe("里程碑唯一識別碼")
    .meta({
      title: "里程碑 ID",
      examples: ["1", "2", "123"]
    })
}).describe("里程碑路徑參數").meta({
  title: "里程碑參數",
  examples: [{
    milestoneId: "1"
  }]
});

// 專案 ID 參數驗證 (for milestone context)
export const milestoneProjectParamsSchema = z.object({
  projectId: z.string()
    .uuid('專案 ID 格式不正確')
    .describe("專案唯一識別碼")
    .meta({
      title: "專案 ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "550e8400-e29b-41d4-a716-446655440000"]
    })
}).describe("專案路徑參數").meta({
  title: "專案參數",
  examples: [{
    projectId: "123e4567-e89b-12d3-a456-426614174000"
  }]
});

// 里程碑查詢參數驗證
export const milestoneQuerySchema = z.object({
  includeCompleted: z.string()
    .transform(val => val === 'true')
    .optional()
    .describe("是否包含已完成的里程碑")
    .meta({
      title: "包含已完成",
      examples: ["true", "false"]
    }),
  sortBy: z.enum([
    'position',
    'startDate',
    'endDate',
    'createdAt',
    'name'
  ], "排序欄位無效")
    .optional()
    .describe("排序欄位")
    .meta({
      title: "排序欄位",
      examples: ['position', 'startDate', 'endDate', 'createdAt', 'name'],
      enumDescriptions: {
        "position": "位置順序",
        "startDate": "開始日期",
        "endDate": "結束日期",
        "createdAt": "建立時間",
        "name": "名稱"
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
}).describe("里程碑查詢參數").meta({
  title: "里程碑查詢",
  examples: [{
    includeCompleted: "true",
    sortBy: "position",
    sortOrder: "asc"
  }]
});

// 類型導出
export type CreateMilestoneData = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneData = z.infer<typeof updateMilestoneSchema>;
export type MilestoneParams = z.infer<typeof milestoneParamsSchema>;
export type MilestoneProjectParams = z.infer<typeof milestoneProjectParamsSchema>;
export type MilestoneQuery = z.infer<typeof milestoneQuerySchema>;

// =====================================
// Response Validation Schemas
// =====================================

// 基於 TaskResponse 接口的任務響應驗證
const taskResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.number(),
  description: z.string(),
  daysOfWeek: z.unknown(),
  isCompleted: z.boolean()
});

// 基於 MilestoneResponse 接口的里程碑響應驗證
export const milestoneResponseSchema = z.object({
  id: z.number(),
  position: z.number(),
  name: z.string(),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isCompleted: z.boolean(),
  tasks: z.array(taskResponseSchema)
});

// API 成功響應基礎驗證
const baseSuccessResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string(),
  meta: responseMetaSchema.optional()
});

// 單一里程碑成功響應驗證（基於 ApiSuccessResponse<MilestoneResponse>）
export const singleMilestoneResponseSchema = baseSuccessResponseSchema.extend({
  data: milestoneResponseSchema
});

// 里程碑列表成功響應驗證（基於 ApiSuccessResponse<MilestoneResponse[]>）
export const milestoneListResponseSchema = baseSuccessResponseSchema.extend({
  data: z.array(milestoneResponseSchema)
});

// 刪除里程碑成功響應驗證（基於 ApiSuccessResponse<{message: string}>）
export const deleteMilestoneResponseSchema = baseSuccessResponseSchema.extend({
  data: z.object({
    message: z.string()
  }).optional()
});

// 里程碑 API 響應聯合類型
export const milestoneApiResponseSchema = z.union([
  singleMilestoneResponseSchema,
  apiErrorResponseSchema
]);

export const milestoneListApiResponseSchema = z.union([
  milestoneListResponseSchema,
  apiErrorResponseSchema
]);

export const deleteMilestoneApiResponseSchema = z.union([
  deleteMilestoneResponseSchema,
  apiErrorResponseSchema
]);

// Response validation TypeScript 類型導出
export type MilestoneResponseValidated = z.infer<typeof milestoneResponseSchema>;
export type TaskResponseValidated = z.infer<typeof taskResponseSchema>;
export type SingleMilestoneResponseValidated = z.infer<typeof singleMilestoneResponseSchema>;
export type MilestoneListResponseValidated = z.infer<typeof milestoneListResponseSchema>;
export type DeleteMilestoneResponseValidated = z.infer<typeof deleteMilestoneResponseSchema>;