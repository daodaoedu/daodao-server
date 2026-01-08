/**
 * Outcome Validators
 * 成果驗證器 - 使用 Zod 進行資料驗證
 * 使用 @asteasolutions/zod-to-openapi 進行 OpenAPI 整合
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  apiSuccessResponseSchema
} from './api-response.validators';

// 可見性選項
const VISIBILITY_OPTIONS = ['private', 'public'] as const;

// 可見性 schema 定義
const visibilitySchema = z.enum(VISIBILITY_OPTIONS)
  .openapi({
    description: '成果的可見性設定',
    example: 'private',
    examples: ['private', 'public'],
    enum: ['private', 'public']
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
    .openapi({
      description: '成果所屬的週數（學習週期）',
      example: 4,
      examples: [1, 2, 4, 8, 12]
    }),

  title: z.string({
    message: '標題為必填項目'
  }).min(1, '標題不能為空').max(100, '標題不可超過100字')
    .openapi({
      description: '成果的標題或名稱',
      example: 'React Todo App 完成',
      examples: ['React Todo App 完成', '第一個網站上線', 'JavaScript 基礎學習成果']
    }),

  date: z.string({
    message: '日期為必填項目'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD')
    .openapi({
      description: '成果完成的日期',
      example: '2024-03-15',
      examples: ['2024-03-15', '2024-12-01', '2025-01-20'],
      format: 'date'
    }),

  content: z.string({
    message: '內容為必填項目'
  }).min(1, '內容不能為空').max(5000, '內容不可超過5000字')
    .openapi({
      description: '成果的詳細描述或學習心得',
      example: '完成了一個功能完整的 Todo 應用，包括增删改查功能、回應式設計和本地存储。'
    }),

  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
      .openapi({
        description: '成果截圖或相關圖片的網址',
        example: 'https://example.com/screenshots/app1.png',
        format: 'uri'
      })
  ).optional()
    .openapi({
      description: '成果相關的圖片網址列表',
      example: ['https://example.com/screenshots/app1.png', 'https://example.com/screenshots/app2.png']
    }),

  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
      .openapi({
        description: '成果演示影片或說明影片的網址',
        example: 'https://youtube.com/watch?v=demo123',
        format: 'uri'
      })
  ).optional()
    .openapi({
      description: '成果相關的影片網址列表',
      example: ['https://youtube.com/watch?v=demo123', 'https://vimeo.com/123456789']
    }),

  visibility: visibilitySchema.optional().default('private')
}).openapi('CreateOutcomeRequest', {
  description: '創建新學習成果的請求資料'
});

// 註冊 CreateOutcomeRequest
registry.register('CreateOutcomeRequest', createOutcomeSchema);

/**
 * 更新成果驗證模式
 */
export const updateOutcomeSchema = z.object({
  week: z.number({
    message: '週數必須是數字'
  }).int('週數必須是整數').min(1, '週數必須大於0').optional()
    .openapi({
      description: '更新後的學習週數',
      example: 4,
      examples: [1, 2, 4, 8, 12]
    }),

  title: z.string().min(1, '標題不能為空').max(100, '標題不可超過100字').optional()
    .openapi({
      description: '更新後的成果標題',
      example: 'React Todo App 完成 v2.0',
      examples: ['React Todo App 完成 v2.0', '更新：增加新功能']
    }),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').optional()
    .openapi({
      description: '更新後的完成日期',
      example: '2024-03-20',
      examples: ['2024-03-20', '2024-12-05'],
      format: 'date'
    }),

  content: z.string().min(1, '內容不能為空').max(5000, '內容不可超過5000字').optional()
    .openapi({
      description: '更新後的成果描述內容',
      example: '更新：增加了使用者認證功能和資料持久化。'
    }),

  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
      .openapi({
        description: '更新後的成果圖片網址',
        example: 'https://example.com/screenshots/updated-app.png',
        format: 'uri'
      })
  ).optional()
    .openapi({
      description: '更新後的成果圖片列表',
      example: ['https://example.com/screenshots/updated-app1.png', 'https://example.com/screenshots/updated-app2.png']
    }),

  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
      .openapi({
        description: '更新後的成果影片網址',
        example: 'https://youtube.com/watch?v=updated-demo',
        format: 'uri'
      })
  ).optional()
    .openapi({
      description: '更新後的成果影片列表',
      example: ['https://youtube.com/watch?v=updated-demo1', 'https://youtube.com/watch?v=updated-demo2']
    }),

  visibility: visibilitySchema.optional()
}).openapi('UpdateOutcomeRequest', {
  description: '更新現有學習成果的請求資料'
});

// 註冊 UpdateOutcomeRequest
registry.register('UpdateOutcomeRequest', updateOutcomeSchema);

/**
 * 成果查詢參數驗證模式
 */
export const outcomeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional()
    .openapi({
      description: '分頁查詢的頁碼',
      example: '1',
      examples: ['1', '2', '5']
    }),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional()
    .openapi({
      description: '每頁顯示的成果數量',
      example: '10',
      examples: ['10', '20', '50']
    }),
  visibility: visibilitySchema.optional()
    .openapi({
      description: '按可見性篩選成果',
      example: 'public',
      examples: ['private', 'public']
    }),
  week: z.string().regex(/^\d+$/, '週數必須是正整數').transform(Number).optional()
    .openapi({
      description: '按學習週數篩選成果',
      example: '4',
      examples: ['1', '4', '8', '12']
    })
}).openapi({
  description: '成果列表查詢的參數設定'
});

/**
 * 成果路徑參數驗證模式
 */
export const outcomeParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
    .openapi({
      description: '成果所屬的專案唯一識別ID',
      example: 'project_123',
      examples: ['project_123', 'my-learning-journey', 'bootcamp-2024']
    }),

  outcomeId: z.string({
    message: '成果ID為必填項目'
  }).regex(/^\d+$/, '成果ID必須是數字').transform(Number)
    .openapi({
      description: '成果的唯一識別ID',
      example: '123',
      examples: ['123', '456', '789']
    })
}).openapi({
  description: '包含專案ID和成果ID的路徑參數'
});

/**
 * 專案路徑參數驗證模式（成果專用）
 */
export const outcomeProjectParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
    .openapi({
      description: '查詢成果所屬的專案唯一識別ID',
      example: 'project_123',
      examples: ['project_123', 'my-learning-journey', 'bootcamp-2024']
    })
}).openapi({
  description: '包含專案ID的路徑參數（用於查詢成果）'
});

/**
 * 公開成果查詢參數驗證模式
 */
export const publicOutcomesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional()
    .openapi({
      description: '公開成果列表的頁碼',
      example: '1',
      examples: ['1', '2', '3']
    }),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional()
    .openapi({
      description: '每頁顯示的公開成果數量',
      example: '10',
      examples: ['10', '20', '30']
    })
}).openapi({
  description: '公開成果列表查詢的參數設定'
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
const outcomeResponseSchema = z.object({
  id: z.number().openapi({
    description: '成果唯一識別ID',
    example: 123
  }),
  week: z.number().openapi({
    description: '成果所屬週數',
    example: 4
  }),
  title: z.string().openapi({
    description: '成果標題',
    example: 'React Todo App 完成'
  }),
  content: z.string().openapi({
    description: '成果內容描述',
    example: '完成了一個功能完整的 Todo 應用'
  }),
  date: z.string().openapi({
    description: '成果完成日期',
    example: '2024-03-15',
    format: 'date'
  }),
  imgUrls: z.array(z.string()).optional().openapi({
    description: '成果圖片URL列表',
    example: ['https://example.com/screenshots/app1.png']
  }),
  videoUrls: z.array(z.string()).optional().openapi({
    description: '成果影片URL列表',
    example: ['https://youtube.com/watch?v=demo123']
  }),
  visibility: z.string().openapi({
    description: '成果可見性',
    example: 'public',
    examples: ['private', 'public']
  })
}).openapi('OutcomeResponse', {
  description: '成果回應資料'
});

// 註冊 OutcomeResponse
registry.register('OutcomeResponse', outcomeResponseSchema);

// 單一成果成功響應驗證（基於 ApiSuccessResponse<OutcomeResponse>）
export const singleOutcomeResponseSchema = apiSuccessResponseSchema(outcomeResponseSchema);

// 成果列表成功響應驗證（基於 ApiSuccessResponse<OutcomeResponse[]>）
export const outcomeListResponseSchema = apiSuccessResponseSchema(
  z.array(outcomeResponseSchema)
);

// 刪除成果成功響應驗證（基於 ApiSuccessResponse<null>）
export const deleteOutcomeResponseSchema = apiSuccessResponseSchema(
  z.null().openapi({
    description: '刪除成功，無返回資料'
  })
);

// Response validation TypeScript 類型導出
export type OutcomeResponseValidated = z.infer<typeof outcomeResponseSchema>;
export type SingleOutcomeResponseValidated = z.infer<typeof singleOutcomeResponseSchema>;
export type OutcomeListResponseValidated = z.infer<typeof outcomeListResponseSchema>;
export type DeleteOutcomeResponseValidated = z.infer<typeof deleteOutcomeResponseSchema>;