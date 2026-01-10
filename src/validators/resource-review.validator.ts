/**
 * ResourceReview 相關驗證器
 * 使用 Zod 實現資源心得評價相關驗證
 * 使用 @asteasolutions/zod-to-openapi 進行 OpenAPI 整合
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema, cursorPaginatedApiResponseSchema } from './api-response.validators';

// 時間使用選項驗證
export const timeUsageSchema = z.enum([
  '1_2_hours_daily',
  'few_intensive_days_week',
  'spare_moments',
  'not_applicable_time'
])
  .openapi({
    description: "使用資源的時間投入方式",
    example: '1_2_hours_daily',
    examples: ['1_2_hours_daily', 'few_intensive_days_week', 'spare_moments']
  });

// 評分驗證 (支援 0.5 分間距)
export const scoreSchema = z.number()
  .min(1.0, { message: "評分最低為1.0" })
  .max(5.0, { message: "評分最高為5.0" })
  .refine(value => {
    const decimal = value % 1;
    return decimal === 0 || decimal === 0.5;
  }, { message: "評分必須以0.5為間距（如1.0, 1.5, 2.0等）" })
  .openapi({
    description: "評分數值，支援1.0到5.0分之間，0.5為間距",
    example: 4.5,
    examples: [1.0, 1.5, 2.0, 3.5, 4.0, 5.0]
  });

// 狀態類型驗證
export const reviewStatusSchema = z.enum([
  'draft',
  'published',
  'archived',
  'reported'
])
  .openapi({
    description: "資源評論的發布狀態",
    example: 'published',
    examples: ['draft', 'published', 'archived', 'reported']
  });

// 內容特色物件 schema
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false)
    .openapi({
      description: "內容結構完整、條理清晰",
      example: true
    }),
  practiceFocused: z.boolean().default(false)
    .openapi({
      description: "注重實作和動手練習",
      example: true
    }),
  wellRoundedConcepts: z.boolean().default(false)
    .openapi({
      description: "概念解釋全面且深入",
      example: false
    }),
  thoughtProvoking: z.boolean().default(false)
    .openapi({
      description: "內容引人思考、激發靈感",
      example: true
    }),
  progressiveLearning: z.boolean().default(false)
    .openapi({
      description: "采用漸進式學習方法",
      example: false
    }),
  problemBased: z.boolean().default(false)
    .openapi({
      description: "以問題為導向的學習方式",
      example: true
    }),
  realWorldExamples: z.boolean().default(false)
    .openapi({
      description: "包含豐富的現實世界範例",
      example: true
    }),
  interactive: z.boolean().default(false)
    .openapi({
      description: "互動性強，參與度高",
      example: false
    }),
  visuallyRich: z.boolean().default(false)
    .openapi({
      description: "視覺內容豐富，圖文並茂",
      example: false
    })
}).openapi('ContentFeatures', {
  description: "資源內容特色的評估指標"
});

// 註冊 ContentFeatures 為可重用組件
registry.register('ContentFeatures', contentFeaturesSchema);

// 資源使用物件 schema
export const resourceUsageSchema = z.object({
  withOnlineCourses: z.boolean().default(false)
    .openapi({
      description: "搭配線上課程一起使用",
      example: true
    }),
  withBooks: z.boolean().default(false)
    .openapi({
      description: "搭配書籍教材一起使用",
      example: false
    }),
  withOtherTools: z.boolean().default(false)
    .openapi({
      description: "搭配其他工具或資源使用",
      example: true
    }),
  withCommunity: z.boolean().default(false)
    .openapi({
      description: "搭配社群或學習群組使用",
      example: true
    }),
  onlyThisResource: z.boolean().default(false)
    .openapi({
      description: "僅使用此資源，未搭配其他",
      example: false
    }),
  notApplicableResource: z.boolean().default(false)
    .openapi({
      description: "資源使用方式不適用或無關",
      example: false
    })
}).openapi('ResourceUsage', {
  description: "資源搭配使用方式的評估"
});

// 註冊 ResourceUsage 為可重用組件
registry.register('ResourceUsage', resourceUsageSchema);

// 心得評價基本驗證 Schema
export const resourceReviewBaseSchema = z.object({
  content: z.string().min(1, { message: "評論內容不能為空" })
    .openapi({
      description: "資源使用心得和評價內容",
      example: "這個資源非常實用，內容結構清晰，例子豐富。特別是在解釋複雜概念時，能夠分階段引導學習者理解。"
    }),
  overallImpact: scoreSchema
    .openapi({
      description: "整體影響評分，反映資源的總體價值",
      example: 4.5
    }),
  changeMindset: scoreSchema
    .openapi({
      description: "改變思維方式的程度評分",
      example: 4.0
    }),
  solveProblems: scoreSchema
    .openapi({
      description: "解決實際問題的能力提升評分",
      example: 4.5
    }),
  gainPerspectives: scoreSchema
    .openapi({
      description: "獲得新觀點和洞見的程度評分",
      example: 5.0
    }),
  achieveGoals: scoreSchema
    .openapi({
      description: "達成學習目標的幫助程度評分",
      example: 4.0
    }),
  timeUsage: timeUsageSchema.optional().nullable()
    .openapi({
      description: "使用資源的時間安排方式",
      example: '1_2_hours_daily'
    }),
  contentFeatures: contentFeaturesSchema.optional().default({
    wellStructured: false,
    practiceFocused: false,
    wellRoundedConcepts: false,
    thoughtProvoking: false,
    progressiveLearning: false,
    problemBased: false,
    realWorldExamples: false,
    interactive: false,
    visuallyRich: false
  })
    .openapi({
      description: "資源內容特色的詳細評估"
    }),
  resourceUsage: resourceUsageSchema.optional().default({
    withOnlineCourses: false,
    withBooks: false,
    withOtherTools: false,
    withCommunity: false,
    onlyThisResource: false,
    notApplicableResource: false
  })
    .openapi({
      description: "資源搭配使用情況的評估"
    }),
  tags: z.array(z.string()).optional()
    .openapi({
      description: "與評論相關的標籤列表",
      example: ["初學者友善", "實作導向", "清晰易懂"]
    })
}).openapi({
  description: "資源使用心得評論的基本資料結構"
});

// 建立心得評價驗證 Schema
export const resourceReviewSchema = resourceReviewBaseSchema
  .openapi('CreateResourceReview', {
    description: "創建資源使用心得評論的完整資料"
  });

// 註冊 CreateResourceReview
registry.register('CreateResourceReview', resourceReviewSchema);

// 更新心得評價驗證 Schema
export const updateResourceReviewSchema = resourceReviewBaseSchema.partial().extend({
  status: reviewStatusSchema.optional()
    .openapi({
      description: "更新後的評論狀態",
      example: "published"
    })
})
  .openapi('UpdateResourceReview', {
    description: "更新資源評論的部分資料結構"
  });

// 註冊 UpdateResourceReview
registry.register('UpdateResourceReview', updateResourceReviewSchema);

// 狀態更新驗證 Schema
export const updateReviewStatusSchema = z.object({
  status: reviewStatusSchema
    .openapi({
      description: "要更新的評論狀態",
      example: "published"
    })
}).openapi('UpdateReviewStatus', {
  description: "僅更新評論狀態的請求資料"
});

// 註冊 UpdateReviewStatus
registry.register('UpdateReviewStatus', updateReviewStatusSchema);

// 使用 zod 推導型別
export type ResourceReviewSchema = z.infer<typeof resourceReviewSchema>;
export type UpdateResourceReviewSchema = z.infer<typeof updateResourceReviewSchema>;
export type UpdateReviewStatusSchema = z.infer<typeof updateReviewStatusSchema>;
export type ContentFeaturesSchema = z.infer<typeof contentFeaturesSchema>;
export type ResourceUsageSchema = z.infer<typeof resourceUsageSchema>;


// 路徑參數驗證 schemas
export const resourceIdParamsSchema = z.object({
  resourceId: z.string()
    .uuid({ message: "無效的資源 ID 格式" })
    .openapi({
      description: '資源唯一識別碼 (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      format: 'uuid'
    })
}).openapi({
  description: '資源 ID 路徑參數'
});

export const reviewIdParamsSchema = z.object({
  reviewId: z.string()
    .regex(/^\d+$/, "評論 ID 必須為數字")
    .openapi({
      description: '評論 ID',
      example: '123'
    })
}).openapi({
  description: '評論 ID 路徑參數'
});

export const resourceReviewParamsSchema = z.object({
  resourceId: z.string()
    .uuid({ message: "無效的資源 ID 格式" })
    .openapi({
      description: '資源唯一識別碼 (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      format: 'uuid'
    }),
  reviewId: z.string()
    .regex(/^\d+$/, "評論 ID 必須為數字")
    .openapi({
      description: '評論 ID',
      example: '123'
    })
}).openapi({
  description: '資源和評論的路徑參數'
});

// 心得評價回應 schema
export const resourceReviewResponseSchema = z.object({
  id: z.string().openapi({
    description: '評論 ID',
    example: '123'
  }),
  resourceId: z.string().uuid().openapi({
    description: '資源外部 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  }),
  content: z.string().openapi({
    description: '評論內容',
    example: '這個資源真的很棒，幫助我學到了很多實用的技能。'
  }),
  overallImpact: scoreSchema,
  changeMindset: scoreSchema,
  solveProblems: scoreSchema,
  gainPerspectives: scoreSchema,
  achieveGoals: scoreSchema,
  timeUsage: timeUsageSchema.nullable().openapi({
    description: '時間使用方式',
    example: '1_2_hours_daily'
  }),
  contentFeatures: contentFeaturesSchema,
  resourceUsage: resourceUsageSchema,
  status: reviewStatusSchema,
  user: z.object({
    id: z.number().int().openapi({
      description: '用戶 ID',
      example: 456
    }),
    name: z.string().openapi({
      description: '用戶名稱',
      example: '學習者小王'
    }),
    _id: z.string().openapi({
      description: '用戶外部 ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    roleList: z.array(z.string()).optional().openapi({
      description: '用戶角色列表',
      example: ['學生', '工程師']
    }),
    photoURL: z.string().nullable().openapi({
      description: '用戶頭像 URL',
      example: 'https://example.com/avatar/wang.jpg',
      format: 'uri'
    }),
    educationStage: z.string().nullable().optional().openapi({
      description: '教育階段',
      example: 'university'
    }),
    tagList: z.array(z.string()).optional().openapi({
      description: '用戶標籤列表',
      example: ['JavaScript', 'React']
    }),
    selfIntroduction: z.string().nullable().optional().openapi({
      description: '自我介紹',
      example: '熱愛學習的開發者'
    })
  }).openapi({
    description: '評論作者資訊'
  }),
  tags: z.array(z.string()).openapi({
    description: '評論標籤',
    example: ['實用', '初學者友善']
  }),
  likeCount: z.number().int().min(0).openapi({
    description: '點讚數',
    example: 15
  }),
  createdAt: z.string().datetime().openapi({
    description: '創建時間',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  }),
  updatedAt: z.string().datetime().openapi({
    description: '更新時間',
    example: '2024-01-15T11:00:00.000Z',
    format: 'date-time'
  })
}).openapi('ResourceReviewResponse', {
  description: '心得評價詳情回應'
});

// 註冊 ResourceReviewResponse
registry.register('ResourceReviewResponse', resourceReviewResponseSchema);

// 建立具體的回應 schemas
export const getReviewByIdResponseSchema = apiSuccessResponseSchema(resourceReviewResponseSchema);

export const getReviewsListResponseSchema = cursorPaginatedApiResponseSchema(resourceReviewResponseSchema);

export const createReviewResponseSchema = apiSuccessResponseSchema(resourceReviewResponseSchema);

export const updateReviewResponseSchema = apiSuccessResponseSchema(resourceReviewResponseSchema);

export const deleteReviewResponseSchema = apiSuccessResponseSchema(z.object({
  message: z.string().openapi({
    description: '刪除成功訊息',
    example: '心得評價已成功刪除'
  })
}));

export const likeReviewResponseSchema = apiSuccessResponseSchema(z.object({
  likeCount: z.number().int().min(0).openapi({
    description: '更新後的點讚數',
    example: 16
  }),
  isLiked: z.boolean().openapi({
    description: '當前用戶是否已點讚',
    example: true
  })
}));

export const getReviewTagsResponseSchema = apiSuccessResponseSchema(z.array(z.string()).openapi({
  description: '評論標籤列表',
  example: ['實用', '初學者友善', '內容豐富']
}));

// 匯出驗證中間件
export const validateCreateResourceReview = (data: unknown): ResourceReviewSchema => resourceReviewSchema.parse(data);
export const validateUpdateResourceReview = (data: unknown): UpdateResourceReviewSchema => updateResourceReviewSchema.parse(data);
export const validateUpdateReviewStatus = (data: unknown): UpdateReviewStatusSchema => updateReviewStatusSchema.parse(data);

// 導出回應驗證函數
export const validateGetReviewByIdResponse = (data: unknown): z.infer<typeof getReviewByIdResponseSchema> => getReviewByIdResponseSchema.parse(data);
export const validateGetReviewsListResponse = (data: unknown): z.infer<typeof getReviewsListResponseSchema> => getReviewsListResponseSchema.parse(data);
export const validateCreateReviewResponse = (data: unknown): z.infer<typeof createReviewResponseSchema> => createReviewResponseSchema.parse(data);
export const validateUpdateReviewResponse = (data: unknown): z.infer<typeof updateReviewResponseSchema> => updateReviewResponseSchema.parse(data);
export const validateDeleteReviewResponse = (data: unknown): z.infer<typeof deleteReviewResponseSchema> => deleteReviewResponseSchema.parse(data);
export const validateLikeReviewResponse = (data: unknown): z.infer<typeof likeReviewResponseSchema> => likeReviewResponseSchema.parse(data);
export const validateGetReviewTagsResponse = (data: unknown): z.infer<typeof getReviewTagsResponseSchema> => getReviewTagsResponseSchema.parse(data);
