/**
 * Practice validation schemas
 * Using Zod for comprehensive input validation with proper error messages
 * Based on practice-api-v1.md specification
 */

import { z } from 'zod';

// 基礎枚舉定義
export const practiceStatusSchema = z.enum(['active', 'paused', 'completed', 'archived'], {
  errorMap: () => ({ message: 'Status must be one of: active, paused, completed, archived' })
});

export const contentTypeSchema = z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom'], {
  errorMap: () => ({ message: 'Content type must be one of: book, video, articles, podcast, course, custom' })
});

export const dailyGoalTypeSchema = z.enum(['time', 'completion'], {
  errorMap: () => ({ message: 'Daily goal type must be either time or completion' })
});

// 每日目標 Schema
export const dailyGoalSchema = z.object({
  type: dailyGoalTypeSchema,
  timeMinutes: z.number({
    invalid_type_error: 'Time minutes must be a number'
  }).min(5, '時間目標最少5分鐘').max(240, '時間目標最多240分鐘').optional(),
  amount: z.number({
    invalid_type_error: 'Amount must be a number'
  }).min(1, '數量目標最少1').max(100, '數量目標最多100').optional(),
  unit: z.string().max(10, '單位不能超過10字符').optional()
}).refine(data => {
  if (data.type === 'time' && !data.timeMinutes) {
    return false;
  }
  if (data.type === 'completion' && (!data.amount || !data.unit)) {
    return false;
  }
  return true;
}, {
  message: '時間類型需要timeMinutes，完成類型需要amount和unit',
  path: ['type']
});

// 實踐資源 Schema (用於創建)
export const practiceResourceInputSchema = z.object({
  name: z.string({
    required_error: '請輸入資源名稱'
  }).min(1, '請輸入資源名稱').max(100, '資源名稱不可超過100字'),
  url: z.string().url('請輸入有效的網址').optional().or(z.literal(''))
});

// 實踐資源 Schema (API 回應)
export const practiceResourceSchema = z.object({
  id: z.string().uuid('資源ID格式不正確'),
  name: z.string(),
  url: z.string().optional()
});

// 創建實踐請求 Schema
export const createPracticeSchema = z.object({
  title: z.string({
    required_error: '請輸入標題'
  }).min(1, '請輸入標題').max(100, '標題不可超過100字'),
  contentType: contentTypeSchema,
  customContentType: z.string().max(50, '自定義內容類型不可超過50字').optional(),
  totalAmount: z.number({
    required_error: '請輸入總量',
    invalid_type_error: '總量必須是數字'
  }).min(1, '總量必須大於0').max(10000, '總量不可超過10000'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  dailyGoal: dailyGoalSchema,
  practiceAction: z.string().max(200, '實踐行動描述不可超過200字').optional(),
  tags: z.array(z.string().min(1).max(50)).max(3, '標籤最多3個').default([]),
  resources: z.array(practiceResourceInputSchema).max(5, '資源最多5個').optional()
}).refine(data => {
  if (data.contentType === 'custom' && !data.customContentType) {
    return false;
  }
  return true;
}, {
  message: '選擇自定義類型時，請填寫自定義內容類型',
  path: ['customContentType']
});

// 更新實踐請求 Schema
export const updatePracticeSchema = z.object({
  title: z.string().min(1, '標題不能為空').max(100, '標題不可超過100字').optional(),
  totalAmount: z.number().min(1, '總量必須大於0').max(10000, '總量不可超過10000').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  dailyGoal: dailyGoalSchema.optional(),
  practiceAction: z.string().max(200, '實踐行動描述不可超過200字').optional(),
  tags: z.array(z.string().min(1).max(50)).max(3, '標籤最多3個').optional(),
  resources: z.array(practiceResourceInputSchema).max(5, '資源最多5個').optional(),
  status: practiceStatusSchema.optional()
}).refine(data => {
  // 至少要更新一個欄位
  return Object.keys(data).length > 0;
}, {
  message: '至少需要提供一個要更新的欄位'
});

// 簽到記錄 Schema
export const checkInSchema = z.object({
  progress: z.number({
    required_error: '請輸入進度',
    invalid_type_error: '進度必須是數字'
  }).min(0.01, '進度必須大於0'),
  note: z.string().max(500, '筆記不可超過500字').optional(),
  mood: z.enum(['awesome', 'happy', 'neutral', 'tired', 'frustrated'], {
    errorMap: () => ({ message: 'Mood must be one of: awesome, happy, neutral, tired, frustrated' })
  }).optional(),
  reflectionText: z.string().max(1000, '反思文字不可超過1000字').optional(),
  relatedResourceId: z.string().uuid('關聯資源ID格式不正確').optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string().min(1).max(50)).max(5, '標籤最多5個').default([])
});

// 查詢參數 Schema
export const practiceQuerySchema = z.object({
  page: z.coerce.number({
    invalid_type_error: 'Page must be a number'
  }).min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number({
    invalid_type_error: 'Limit must be a number'
  }).min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  query: z.string().optional(),
  contentType: z.string().optional(), // 逗號分隔
  tags: z.string().optional(), // 逗號分隔
  userId: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived', 'all']).default('active'),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount'], {
    errorMap: () => ({ message: 'Sort must be one of: createdAt, updatedAt, likeCount' })
  }).default('createdAt'),
  order: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Order must be either asc or desc' })
  }).default('desc'),
  include: z.string().optional() // resources, stats等
});

// 簽到查詢參數 Schema
export const checkInQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  mood: z.string().optional(),
  include: z.string().optional() // interactions, comments等
});

// 事件記錄 Schema
export const eventViewSchema = z.object({
  entityType: z.literal('practice', {
    errorMap: () => ({ message: 'Entity type must be practice' })
  }),
  entityId: z.string({
    required_error: 'Entity ID is required'
  }).min(1, 'Entity ID cannot be empty'),
  duration: z.number().min(0, 'Duration must be non-negative').optional()
});

export const eventClickSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  clickPosition: z.string().optional()
});

export const eventShareSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  shareChannel: z.string({
    required_error: '請指定分享渠道'
  }).min(1, '請指定分享渠道')
});

export const eventFavoriteSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty')
});

// 反應（點讚）Schema
export const reactionSchema = z.object({
  reactionType: z.string().default('like')
});

// URL 參數 Schema
export const practiceParamsSchema = z.object({
  id: z.string({
    required_error: 'Practice ID is required'
  }).min(1, 'Practice ID cannot be empty')
});

export const practiceCommentParamsSchema = z.object({
  id: z.coerce.number({
    invalid_type_error: 'Comment ID must be a number'
  }).int('Comment ID must be an integer').positive('Comment ID must be positive')
});

// 我的實踐查詢參數 Schema
export const myPracticesQuerySchema = practiceQuerySchema.extend({
  status: z.enum(['active', 'paused', 'completed', 'archived', 'all']).default('all')
});

// 型別導出
export type CreatePracticeRequest = z.infer<typeof createPracticeSchema>;
export type UpdatePracticeRequest = z.infer<typeof updatePracticeSchema>;
export type CheckInRequest = z.infer<typeof checkInSchema>;
export type PracticeQueryParams = z.infer<typeof practiceQuerySchema>;
export type CheckInQueryParams = z.infer<typeof checkInQuerySchema>;
export type PracticeResourceInput = z.infer<typeof practiceResourceInputSchema>;
export type PracticeResourceResponse = z.infer<typeof practiceResourceSchema>;
export type EventViewRequest = z.infer<typeof eventViewSchema>;
export type EventClickRequest = z.infer<typeof eventClickSchema>;
export type EventShareRequest = z.infer<typeof eventShareSchema>;
export type EventFavoriteRequest = z.infer<typeof eventFavoriteSchema>;
export type ReactionRequest = z.infer<typeof reactionSchema>;
export type PracticeParamsRequest = z.infer<typeof practiceParamsSchema>;
export type PracticeCommentParamsRequest = z.infer<typeof practiceCommentParamsSchema>;
export type MyPracticesQueryParams = z.infer<typeof myPracticesQuerySchema>;

// 驗證函數
export const validateCreatePractice = (data: unknown): CreatePracticeRequest => createPracticeSchema.parse(data);
export const validateUpdatePractice = (data: unknown): UpdatePracticeRequest => updatePracticeSchema.parse(data);
export const validateCheckIn = (data: unknown): CheckInRequest => checkInSchema.parse(data);
export const validatePracticeQuery = (data: unknown): PracticeQueryParams => practiceQuerySchema.parse(data);
export const validateCheckInQuery = (data: unknown): CheckInQueryParams => checkInQuerySchema.parse(data);
export const validateEventView = (data: unknown): EventViewRequest => eventViewSchema.parse(data);
export const validateEventClick = (data: unknown): EventClickRequest => eventClickSchema.parse(data);
export const validateEventShare = (data: unknown): EventShareRequest => eventShareSchema.parse(data);
export const validateEventFavorite = (data: unknown): EventFavoriteRequest => eventFavoriteSchema.parse(data);
export const validateReaction = (data: unknown): ReactionRequest => reactionSchema.parse(data);
export const validatePracticeParams = (data: unknown): PracticeParamsRequest => practiceParamsSchema.parse(data);
export const validatePracticeCommentParams = (data: unknown): PracticeCommentParamsRequest => practiceCommentParamsSchema.parse(data);
export const validateMyPracticesQuery = (data: unknown): MyPracticesQueryParams => myPracticesQuerySchema.parse(data);

// 統一導出對象，遵循專案模式
export const practiceValidators = {
  // 主要 schemas
  createPracticeSchema,
  updatePracticeSchema,
  checkInSchema,
  practiceQuerySchema,
  checkInQuerySchema,
  myPracticesQuerySchema,
  
  // 事件 schemas
  eventViewSchema,
  eventClickSchema,
  eventShareSchema,
  eventFavoriteSchema,
  reactionSchema,
  
  // 參數 schemas
  practiceParamsSchema,
  practiceCommentParamsSchema,
  
  // 子組件 schemas
  dailyGoalSchema,
  practiceResourceInputSchema,
  practiceResourceSchema,
  
  // 枚舉 schemas
  practiceStatusSchema,
  contentTypeSchema,
  dailyGoalTypeSchema
};

export default practiceValidators;