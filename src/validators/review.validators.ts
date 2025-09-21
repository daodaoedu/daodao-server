/**
 * Review Validators
 * 覆盤驗證器 - 處理覆盤相關的資料驗證
 */

import { z } from 'zod';
import { apiErrorResponseSchema, responseMetaSchema } from './api-response.validators';

// 心情類型驗證
export const moodSchema = z.enum([
  'excellent',
  'good', 
  'neutral',
  'poor',
  'terrible'
], '心情必須是以下之一: excellent, good, neutral, poor, terrible')
  .describe('心情評估等級')
  .meta({
    title: '心情狀態',
    examples: ['excellent', 'good', 'neutral', 'poor', 'terrible'],
    enumDescriptions: {
      'excellent': '非常好',
      'good': '良好',
      'neutral': '普通',
      'poor': '不好',
      'terrible': '很糟'
    }
  });

// 壓力等級驗證 (1-10)
export const stressLevelSchema = z.number()
  .int({ message: '壓力等級必須是整數' })
  .min(1, { message: '壓力等級最小值為 1' })
  .max(10, { message: '壓力等級最大值為 10' })
  .describe('壓力等級評估')
  .meta({
    title: '壓力等級',
    examples: [1, 3, 5, 7, 10]
  });

// 學習回顧等級驗證 (1-10)
export const learningReviewSchema = z.number()
  .int({ message: '學習回顧等級必須是整數' })
  .min(1, { message: '學習回顧等級最小值為 1' })
  .max(10, { message: '學習回顧等級最大值為 10' })
  .describe('學習效果評估等級')
  .meta({
    title: '學習回顧等級',
    examples: [1, 4, 6, 8, 10]
  });

// 週數驗證
export const weekSchema = z.number()
  .int({ message: '週數必須是整數' })
  .min(1, { message: '週數最小值為 1' })
  .max(52, { message: '週數最大值為 52' })
  .describe('覆盤週數')
  .meta({
    title: '週數',
    examples: [1, 12, 24, 36, 52]
  });

// 可見性驗證
export const visibilitySchema = z.enum(['private', 'public'], '可見性必須是 private 或 public')
  .describe('覆盤可見性設定')
  .meta({
    title: '可見性',
    examples: ['private', 'public'],
    enumDescriptions: {
      'private': '私人',
      'public': '公開'
    }
  });

// 創建覆盤驗證 Schema
export const createReviewSchema = z.object({
  week: weekSchema,
  title: z.string()
    .min(1, { message: '標題不能為空' })
    .max(255, { message: '標題最多 255 字符' })
    .describe('覆盤標題')
    .meta({
      title: '標題',
      examples: ['第12週學習覆盤', 'TypeScript學習反思', '專案進度檢討']
    })
    .optional(),
  mood: moodSchema,
  stressLevel: stressLevelSchema,
  moodDescription: z.string()
    .max(1000, { message: '心情描述最多 1000 字符' })
    .describe('心情狀態詳細描述')
    .meta({
      title: '心情描述',
      examples: ['今天學習狀態不錯，對新概念理解很快', '壓力較大，需要調整學習節奏', '感覺進步明顯，很有成就感']
    })
    .optional(),
  learningReview: learningReviewSchema,
  learningFeedback: z.string()
    .max(2000, { message: '學習反饋最多 2000 字符' })
    .describe('學習反饋與心得')
    .meta({
      title: '學習反饋',
      examples: ['這週重點學習了React Hooks，實作了幾個小專案', '演算法部分還需要加強，多做練習題', 'API設計有了新的理解，開始關注RESTful規範']
    })
    .optional(),
  adjustmentPlan: z.string()
    .max(2000, { message: '調整計劃最多 2000 字符' })
    .describe('下週調整計劃')
    .meta({
      title: '調整計劃',
      examples: ['下週要多花時間在演算法練習上', '增加實作專案時間，減少理論學習比重', '安排更多休息時間，避免過度疲勞']
    })
    .optional(),
  visibility: visibilitySchema.optional().default('private')
})
.describe('創建覆盤的請求資料')
.meta({
  title: '創建覆盤',
  examples: [{
    week: 12,
    title: '第12週學習覆盤',
    mood: 'good',
    stressLevel: 6,
    moodDescription: '本週學習狀態良好，雖然有些挑戰但整體進展順利',
    learningReview: 8,
    learningFeedback: '完成了React專案，對狀態管理有了更深入的理解',
    adjustmentPlan: '下週將重點放在後端API開發上',
    visibility: 'private'
  }]
});

// 更新覆盤驗證 Schema
export const updateReviewSchema = z.object({
  title: z.string()
    .min(1, { message: '標題不能為空' })
    .max(255, { message: '標題最多 255 字符' })
    .describe('覆盤標題')
    .meta({
      title: '標題',
      examples: ['第12週學習覆盤 (已修改)', 'TypeScript學習反思 - 更新版']
    })
    .optional(),
  mood: moodSchema.optional(),
  stressLevel: stressLevelSchema.optional(),
  moodDescription: z.string()
    .max(1000, { message: '心情描述最多 1000 字符' })
    .describe('心情狀態詳細描述')
    .meta({
      title: '心情描述',
      examples: ['更新後的心情描述：今天狀態更好了', '調整心情評估，實際感受沒那麼糟']
    })
    .optional(),
  learningReview: learningReviewSchema.optional(),
  learningFeedback: z.string()
    .max(2000, { message: '學習反饋最多 2000 字符' })
    .describe('學習反饋與心得')
    .meta({
      title: '學習反饋',
      examples: ['補充學習心得：實際專案中遇到的問題解決了', '更新反饋：對某個概念有了新的理解']
    })
    .optional(),
  adjustmentPlan: z.string()
    .max(2000, { message: '調整計劃最多 2000 字符' })
    .describe('下週調整計劃')
    .meta({
      title: '調整計劃',
      examples: ['修正計劃：增加更多實作時間', '調整策略：重點放在弱項提升']
    })
    .optional()
})
.describe('更新覆盤的請求資料')
.meta({
  title: '更新覆盤',
  examples: [{
    title: '第12週學習覆盤 (已更新)',
    mood: 'excellent',
    stressLevel: 4,
    moodDescription: '經過調整後心情狀態大幅提升',
    learningFeedback: '補充：完成了額外的練習項目，收穫很大'
  }]
});

// 查詢參數驗證 Schema
export const reviewQuerySchema = z.object({
  week: weekSchema.optional(),
  mood: moodSchema.optional(),
  stressLevel: stressLevelSchema.optional(),
  page: z.string()
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, { message: '頁數必須是正整數' })
    .describe('頁碼')
    .meta({
      title: '頁碼',
      examples: ['1', '2', '5']
    }),
  pageSize: z.string()
    .optional()
    .default('10')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0 && val <= 100, { message: '每頁數量必須是 1-100 之間的正整數' })
    .describe('每頁數量')
    .meta({
      title: '每頁數量',
      examples: ['10', '20', '50']
    })
})
.describe('覆盤查詢參數')
.meta({
  title: '查詢覆盤',
  examples: [{
    week: 12,
    mood: 'good',
    page: '1',
    pageSize: '10'
  }]
});

// 路徑參數驗證 Schema
export const reviewParamsSchema = z.object({
  projectId: z.string()
    .min(1, { message: '專案ID不能為空' })
    .describe('專案識別碼')
    .meta({
      title: '專案ID',
      examples: ['123e4567-e89b-12d3-a456-426614174000', 'proj_abc123', 'project-001']
    }),
  reviewId: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, { message: '覆盤ID必須是正整數' })
    .describe('覆盤識別碼')
    .meta({
      title: '覆盤ID',
      examples: ['1', '123', '456']
    })
})
.describe('覆盤路徑參數')
.meta({
  title: '路徑參數',
  examples: [{
    projectId: '123e4567-e89b-12d3-a456-426614174000',
    reviewId: '123'
  }]
});

// 使用 zod 推導型別
export type CreateReviewSchema = z.infer<typeof createReviewSchema>;
export type UpdateReviewSchema = z.infer<typeof updateReviewSchema>;
export type ReviewQuerySchema = z.infer<typeof reviewQuerySchema>;

// =====================================
// Response Validation Schemas
// =====================================

// 基於 ReviewResponse 接口的覆盤響應驗證
export const reviewResponseSchema = z.object({
  id: z.number(),
  week: z.number(),
  title: z.string(),
  mood: z.string(),
  stressLevel: z.number(),
  moodDescription: z.string().optional(),
  learningReview: z.string().optional(),
  learningFeedback: z.string().optional(),
  adjustmentPlan: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional()
});

// 基於 ReviewStats 接口的覆盤統計響應驗證
export const reviewStatsResponseSchema = z.object({
  total: z.number(),
  averageStressLevel: z.number(),
  averageLearningReview: z.number(),
  moodDistribution: z.record(z.string(), z.number()),
  weeklyProgress: z.record(z.string(), reviewResponseSchema)
});

// API 成功響應基礎驗證
const baseSuccessResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string(),
  meta: responseMetaSchema.optional()
});

// 單一覆盤成功響應驗證（基於 ApiSuccessResponse<ReviewResponse>）
export const singleReviewResponseSchema = baseSuccessResponseSchema.extend({
  data: reviewResponseSchema
});

// 覆盤列表成功響應驗證（基於 ApiSuccessResponse<ReviewResponse[]>）
export const reviewListResponseSchema = baseSuccessResponseSchema.extend({
  data: z.array(reviewResponseSchema)
});

// 覆盤統計成功響應驗證（基於 ApiSuccessResponse<ReviewStats>）
export const reviewStatsSuccessResponseSchema = baseSuccessResponseSchema.extend({
  data: reviewStatsResponseSchema
});

// 刪除覆盤成功響應驗證（基於 ApiSuccessResponse<{message: string}>）
export const deleteReviewApiResponseSchema = baseSuccessResponseSchema.extend({
  data: z.object({
    message: z.string()
  })
});

// 覆盤 API 響應聯合類型
export const reviewApiResponseSchema = z.union([
  singleReviewResponseSchema,
  apiErrorResponseSchema
]);

export const reviewListApiResponseSchema = z.union([
  reviewListResponseSchema,
  apiErrorResponseSchema
]);

export const reviewStatsApiResponseSchema = z.union([
  reviewStatsSuccessResponseSchema,
  apiErrorResponseSchema
]);

export const deleteReviewUnionResponseSchema = z.union([
  deleteReviewApiResponseSchema,
  apiErrorResponseSchema
]);

// Response validation TypeScript 類型導出
export type ReviewResponseValidated = z.infer<typeof reviewResponseSchema>;
export type ReviewStatsResponseValidated = z.infer<typeof reviewStatsResponseSchema>;
export type SingleReviewResponseValidated = z.infer<typeof singleReviewResponseSchema>;
export type ReviewListResponseValidated = z.infer<typeof reviewListResponseSchema>;
export type ReviewStatsSuccessResponseValidated = z.infer<typeof reviewStatsSuccessResponseSchema>;
export type DeleteReviewResponseValidated = z.infer<typeof deleteReviewApiResponseSchema>;
export type ReviewParamsSchema = z.infer<typeof reviewParamsSchema>;

// 匯出驗證中間件
export const validateCreateReview = (data: unknown): CreateReviewSchema => createReviewSchema.parse(data);
export const validateUpdateReview = (data: unknown): UpdateReviewSchema => updateReviewSchema.parse(data);
export const validateReviewQuery = (data: unknown): ReviewQuerySchema => reviewQuerySchema.parse(data);
export const validateReviewParams = (data: unknown): ReviewParamsSchema => reviewParamsSchema.parse(data);