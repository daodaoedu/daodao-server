/**
 * Review Validators
 * 覆盤驗證器 - 處理覆盤相關的資料驗證
 */

import { z } from 'zod';

// 心情類型驗證
export const moodSchema = z.enum([
  'excellent',
  'good', 
  'neutral',
  'poor',
  'terrible'
], {
  errorMap: () => ({ message: '心情必須是以下之一: excellent, good, neutral, poor, terrible' })
});

// 壓力等級驗證 (1-10)
export const stressLevelSchema = z.number()
  .int({ message: '壓力等級必須是整數' })
  .min(1, { message: '壓力等級最小值為 1' })
  .max(10, { message: '壓力等級最大值為 10' });

// 學習回顧等級驗證 (1-10)
export const learningReviewSchema = z.number()
  .int({ message: '學習回顧等級必須是整數' })
  .min(1, { message: '學習回顧等級最小值為 1' })
  .max(10, { message: '學習回顧等級最大值為 10' });

// 週數驗證
export const weekSchema = z.number()
  .int({ message: '週數必須是整數' })
  .min(1, { message: '週數最小值為 1' })
  .max(52, { message: '週數最大值為 52' });

// 可見性驗證
export const visibilitySchema = z.enum(['private', 'public'], {
  errorMap: () => ({ message: '可見性必須是 private 或 public' })
});

// 創建覆盤驗證 Schema
export const createReviewSchema = z.object({
  week: weekSchema,
  title: z.string()
    .min(1, { message: '標題不能為空' })
    .max(255, { message: '標題最多 255 字符' })
    .optional(),
  mood: moodSchema,
  stressLevel: stressLevelSchema,
  moodDescription: z.string()
    .max(1000, { message: '心情描述最多 1000 字符' })
    .optional(),
  learningReview: learningReviewSchema,
  learningFeedback: z.string()
    .max(2000, { message: '學習反饋最多 2000 字符' })
    .optional(),
  adjustmentPlan: z.string()
    .max(2000, { message: '調整計劃最多 2000 字符' })
    .optional(),
  visibility: visibilitySchema.optional().default('private')
});

// 更新覆盤驗證 Schema
export const updateReviewSchema = z.object({
  title: z.string()
    .min(1, { message: '標題不能為空' })
    .max(255, { message: '標題最多 255 字符' })
    .optional(),
  mood: moodSchema.optional(),
  stressLevel: stressLevelSchema.optional(),
  moodDescription: z.string()
    .max(1000, { message: '心情描述最多 1000 字符' })
    .optional(),
  learningReview: learningReviewSchema.optional(),
  learningFeedback: z.string()
    .max(2000, { message: '學習反饋最多 2000 字符' })
    .optional(),
  adjustmentPlan: z.string()
    .max(2000, { message: '調整計劃最多 2000 字符' })
    .optional()
});

// 查詢參數驗證 Schema
export const reviewQuerySchema = z.object({
  week: weekSchema.optional(),
  mood: moodSchema.optional(),
  stressLevel: stressLevelSchema.optional(),
  page: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, { message: '頁數必須是正整數' })
    .optional()
    .default('1'),
  pageSize: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0 && val <= 100, { message: '每頁數量必須是 1-100 之間的正整數' })
    .optional()
    .default('10')
});

// 路徑參數驗證 Schema
export const reviewParamsSchema = z.object({
  projectId: z.string()
    .min(1, { message: '專案ID不能為空' }),
  reviewId: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, { message: '覆盤ID必須是正整數' })
});

// 使用 zod 推導型別
export type CreateReviewSchema = z.infer<typeof createReviewSchema>;
export type UpdateReviewSchema = z.infer<typeof updateReviewSchema>;
export type ReviewQuerySchema = z.infer<typeof reviewQuerySchema>;
export type ReviewParamsSchema = z.infer<typeof reviewParamsSchema>;

// 匯出驗證中間件
export const validateCreateReview = (data: unknown): CreateReviewSchema => createReviewSchema.parse(data);
export const validateUpdateReview = (data: unknown): UpdateReviewSchema => updateReviewSchema.parse(data);
export const validateReviewQuery = (data: unknown): ReviewQuerySchema => reviewQuerySchema.parse(data);
export const validateReviewParams = (data: unknown): ReviewParamsSchema => reviewParamsSchema.parse(data);