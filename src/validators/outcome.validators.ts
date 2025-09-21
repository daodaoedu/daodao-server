/**
 * Outcome Validators
 * 成果驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import { apiErrorResponseSchema, responseMetaSchema } from './api-response.validators';

// 可見性選項
const VISIBILITY_OPTIONS = ['private', 'public'] as const;

// 可見性 schema 定義
const visibilitySchema = z.enum(VISIBILITY_OPTIONS)
  .describe("成果的可見性設定")
  .meta({
    title: "可見性",
    examples: ['private', 'public'],
    enumDescriptions: {
      "private": "私人可見，僅作者可查看",
      "public": "公開可見，所有人可查看"
    }
  });

// URL 驗證正則表達式
const URL_REGEX = /^https?:\/\/.+/;

/**
 * 創建成果驗證模式
 */
export const createOutcomeSchema = z.object({
  week: z.number({
    message: '週數必須是數字'
  }).int('週數必須是整數').min(1, '週數必須大於0')
    .describe("成果所屬的週數（學習週期）")
    .meta({
      title: "學習週數",
      examples: [1, 2, 4, 8, 12]
    }),
  
  title: z.string({
    message: '標題為必填項目'
  }).min(1, '標題不能為空').max(100, '標題不可超過100字')
    .describe("成果的標題或名稱")
    .meta({
      title: "成果標題",
      examples: ["React Todo App 完成", "第一個網站上線", "JavaScript 基礎學習成果"]
    }),
  
  date: z.string({
    message: '日期為必填項目'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD')
    .describe("成果完成的日期")
    .meta({
      title: "完成日期",
      examples: ["2024-03-15", "2024-12-01", "2025-01-20"]
    }),
  
  content: z.string({
    message: '內容為必填項目'
  }).min(1, '內容不能為空').max(5000, '內容不可超過5000字')
    .describe("成果的詳細描述或學習心得")
    .meta({
      title: "成果內容",
      examples: [
        "完成了一個功能完整的 Todo 應用，包括增删改查功能、回應式設計和本地存储。",
        "學習了 React Hooks 的使用，特別是 useState 和 useEffect，並應用在實際專案中。",
        "第一次部署網站到 Netlify，學會了網站上線的整個流程。"
      ]
    }),
  
  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
      .describe("成果截圖或相關圖片的網址")
      .meta({
        title: "圖片網址",
        examples: [
          "https://example.com/screenshots/app1.png",
          "https://cloudinary.com/images/project-demo.jpg"
        ]
      })
  ).optional()
    .describe("成果相關的圖片網址列表")
    .meta({
      title: "成果圖片",
      examples: [[
        "https://example.com/screenshots/app1.png",
        "https://example.com/screenshots/app2.png"
      ]]
    }),
  
  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
      .describe("成果演示影片或說明影片的網址")
      .meta({
        title: "影片網址",
        examples: [
          "https://youtube.com/watch?v=demo123",
          "https://vimeo.com/123456789"
        ]
      })
  ).optional()
    .describe("成果相關的影片網址列表")
    .meta({
      title: "成果影片",
      examples: [[
        "https://youtube.com/watch?v=demo123",
        "https://vimeo.com/123456789"
      ]]
    }),
  
  visibility: visibilitySchema.optional().default('private')
}).describe("創建新學習成果的請求資料").meta({
  title: "創建學習成果",
  examples: [{
    week: 4,
    title: "React Todo App 完成",
    date: "2024-03-15",
    content: "完成了一個功能完整的 Todo 應用，包括增删改查功能、回應式設計和本地存储。",
    imgUrls: ["https://example.com/screenshots/todo-app.png"],
    visibility: "public"
  }]
});

/**
 * 更新成果驗證模式
 */
export const updateOutcomeSchema = z.object({
  week: z.number({
    message: '週數必須是數字'
  }).int('週數必須是整數').min(1, '週數必須大於0').optional()
    .describe("更新後的學習週數")
    .meta({
      title: "學習週數",
      examples: [1, 2, 4, 8, 12]
    }),
  
  title: z.string().min(1, '標題不能為空').max(100, '標題不可超過100字').optional()
    .describe("更新後的成果標題")
    .meta({
      title: "成果標題",
      examples: ["React Todo App 完成 v2.0", "更新：增加新功能"]
    }),
  
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').optional()
    .describe("更新後的完成日期")
    .meta({
      title: "完成日期",
      examples: ["2024-03-20", "2024-12-05"]
    }),
  
  content: z.string().min(1, '內容不能為空').max(5000, '內容不可超過5000字').optional()
    .describe("更新後的成果描述內容")
    .meta({
      title: "成果內容",
      examples: [
        "更新：增加了使用者認證功能和資料持久化。",
        "修正：解決了回應式設計的問題。"
      ]
    }),
  
  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
      .describe("更新後的成果圖片網址")
      .meta({
        title: "圖片網址",
        examples: ["https://example.com/screenshots/updated-app.png"]
      })
  ).optional()
    .describe("更新後的成果圖片列表")
    .meta({
      title: "成果圖片",
      examples: [[
        "https://example.com/screenshots/updated-app1.png",
        "https://example.com/screenshots/updated-app2.png"
      ]]
    }),
  
  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
      .describe("更新後的成果影片網址")
      .meta({
        title: "影片網址",
        examples: ["https://youtube.com/watch?v=updated-demo"]
      })
  ).optional()
    .describe("更新後的成果影片列表")
    .meta({
      title: "成果影片",
      examples: [[
        "https://youtube.com/watch?v=updated-demo1",
        "https://youtube.com/watch?v=updated-demo2"
      ]]
    }),
  
  visibility: visibilitySchema.optional()
}).describe("更新現有學習成果的請求資料").meta({
  title: "更新學習成果",
  examples: [{
    title: "React Todo App 完成 v2.0",
    content: "更新：增加了使用者認證功能和資料持久化。",
    visibility: "public"
  }]
});

/**
 * 成果查詢參數驗證模式
 */
export const outcomeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional()
    .describe("分頁查詢的頁碼")
    .meta({
      title: "頁碼",
      examples: ["1", "2", "5"]
    }),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional()
    .describe("每頁顯示的成果數量")
    .meta({
      title: "每頁數量",
      examples: ["10", "20", "50"]
    }),
  visibility: visibilitySchema.optional()
    .describe("按可見性篩選成果")
    .meta({
      title: "可見性篩選",
      examples: ["private", "public"]
    }),
  week: z.string().regex(/^\d+$/, '週數必須是正整數').transform(Number).optional()
    .describe("按學習週數篩選成果")
    .meta({
      title: "週數篩選",
      examples: ["1", "4", "8", "12"]
    })
}).describe("成果列表查詢的參數設定").meta({
  title: "成果查詢參數",
  examples: [{
    page: "1",
    pageSize: "10",
    visibility: "public",
    week: "4"
  }]
});

/**
 * 成果路徑參數驗證模式
 */
export const outcomeParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
    .describe("成果所屬的專案唯一識別ID")
    .meta({
      title: "專案ID",
      examples: ["project_123", "my-learning-journey", "bootcamp-2024"]
    }),
  
  outcomeId: z.string({
    message: '成果ID為必填項目'
  }).regex(/^\d+$/, '成果ID必須是數字').transform(Number)
    .describe("成果的唯一識別ID")
    .meta({
      title: "成果ID",
      examples: ["123", "456", "789"]
    })
}).describe("包含專案ID和成果ID的路徑參數").meta({
  title: "成果路徑參數",
  examples: [{
    projectId: "project_123",
    outcomeId: "456"
  }]
});

/**
 * 專案路徑參數驗證模式（成果專用）
 */
export const outcomeProjectParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
    .describe("查詢成果所屬的專案唯一識別ID")
    .meta({
      title: "專案ID",
      examples: ["project_123", "my-learning-journey", "bootcamp-2024"]
    })
}).describe("包含專案ID的路徑參數（用於查詢成果）").meta({
  title: "專案ID路徑參數",
  examples: [{
    projectId: "project_123"
  }]
});

/**
 * 公開成果查詢參數驗證模式
 */
export const publicOutcomesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional().default(1)
    .describe("公開成果列表的頁碼")
    .meta({
      title: "頁碼",
      examples: ["1", "2", "3"]
    }),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional().default(10)
    .describe("每頁顯示的公開成果數量")
    .meta({
      title: "每頁數量",
      examples: ["10", "20", "30"]
    })
}).describe("公開成果列表查詢的參數設定").meta({
  title: "公開成果查詢參數",
  examples: [{
    page: "1",
    pageSize: "10"
  }]
});

// 導出驗證類型
export type CreateOutcomeData = z.infer<typeof createOutcomeSchema>;
export type UpdateOutcomeData = z.infer<typeof updateOutcomeSchema>;
export type OutcomeQueryParams = z.infer<typeof outcomeQuerySchema>;
export type OutcomeParamsData = z.infer<typeof outcomeParamsSchema>;
export type OutcomeProjectParamsData = z.infer<typeof outcomeProjectParamsSchema>;
export type PublicOutcomesQueryData = z.infer<typeof publicOutcomesQuerySchema>;

// =====================================
// Response Validation Schemas
// =====================================

// 基於 OutcomeResponse 接口的成果響應驗證
export const outcomeResponseSchema = z.object({
  id: z.number(),
  week: z.number(),
  title: z.string(),
  content: z.string(),
  date: z.string(),
  imgUrls: z.array(z.string()).optional(),
  videoUrls: z.array(z.string()).optional(),
  visibility: z.string()
});

// API 成功響應基礎驗證
const baseSuccessResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string(),
  meta: responseMetaSchema.optional()
});

// 單一成果成功響應驗證（基於 ApiSuccessResponse<OutcomeResponse>）
export const singleOutcomeResponseSchema = baseSuccessResponseSchema.extend({
  data: outcomeResponseSchema
});

// 成果列表成功響應驗證（基於 ApiSuccessResponse<OutcomeResponse[]>）
export const outcomeListResponseSchema = baseSuccessResponseSchema.extend({
  data: z.array(outcomeResponseSchema)
});

// 刪除成果成功響應驗證（基於 ApiSuccessResponse<undefined>）
export const deleteOutcomeResponseSchema = baseSuccessResponseSchema.extend({
  data: z.undefined()
});

// 成果 API 響應聯合類型
export const outcomeApiResponseSchema = z.union([
  singleOutcomeResponseSchema,
  apiErrorResponseSchema
]);

export const outcomeListApiResponseSchema = z.union([
  outcomeListResponseSchema,
  apiErrorResponseSchema
]);

export const deleteOutcomeApiResponseSchema = z.union([
  deleteOutcomeResponseSchema,
  apiErrorResponseSchema
]);

// Response validation TypeScript 類型導出
export type OutcomeResponseValidated = z.infer<typeof outcomeResponseSchema>;
export type SingleOutcomeResponseValidated = z.infer<typeof singleOutcomeResponseSchema>;
export type OutcomeListResponseValidated = z.infer<typeof outcomeListResponseSchema>;
export type DeleteOutcomeResponseValidated = z.infer<typeof deleteOutcomeResponseSchema>;