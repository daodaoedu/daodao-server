import { z } from 'zod';

// 基礎枚舉
export const practiceStatusSchema = z.enum(['active', 'paused', 'completed', 'archived']);
export const contentTypeSchema = z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom']);
export const dailyGoalTypeSchema = z.enum(['time', 'completion']);
export const checkInMoodSchema = z.enum(['awesome', 'happy', 'neutral', 'tired', 'frustrated']);

// 每日目標 Schema
export const dailyGoalSchema = z.object({
  type: dailyGoalTypeSchema,
  timeMinutes: z.number().min(5).max(240).optional(),
  amount: z.number().min(1).max(100).optional(),
  unit: z.string().max(10).optional(),
});

// 實踐資源 Schema (用於創建)
export const practiceResourceInputSchema = z.object({
  name: z.string().min(1, '請輸入資源名稱').max(100, '資源名稱不可超過 100 字'),
  url: z.string().url('請輸入有效的網址').optional().or(z.literal('')),
});

// 實踐資源 Schema (API 回應)
export const practiceResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().optional(),
});

// 創建實踐請求 Schema
export const createPracticeSchema = z.object({
  title: z.string().min(1, '請輸入標題').max(100, '標題不可超過 100 字'),
  contentType: contentTypeSchema,
  customContentType: z.string().max(50).optional(),
  totalAmount: z.number().min(1, '總量必須大於 0').max(10000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式').optional(),
  dailyGoal: dailyGoalSchema,
  practiceAction: z.string().max(200, '實踐行動描述不可超過 200 字').optional(),
  tags: z.array(z.string()).max(3, '標籤最多 3 個').default([]),
  resources: z.array(practiceResourceInputSchema).max(5, '資源最多 5 個').optional(),
});

// 更新實踐請求 Schema
export const updatePracticeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  totalAmount: z.number().min(1).max(10000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dailyGoal: dailyGoalSchema.optional(),
  practiceAction: z.string().max(200).optional(),
  tags: z.array(z.string()).max(3).optional(),
  resources: z.array(practiceResourceInputSchema).max(5).optional(),
  status: practiceStatusSchema.optional(),
});

// OG Image URL Schema（可重複使用）
const ogImageSchema = z.string().url('請輸入有效的圖片網址').optional();

// 簽到/打卡記錄 Schema
export const checkInSchema = z.object({
  progress: z.number().min(0.01, '進度必須大於 0'),
  note: z.string().max(500, '筆記不可超過 500 字').optional(),
  mood: checkInMoodSchema.optional(),
  reflectionText: z.string().max(1000, '反思文字不可超過 1000 字').optional(),
  relatedResourceId: z.string().uuid('請提供有效的資源 ID').optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).max(5, '標籤最多 5 個').default([]),
  ogImage: ogImageSchema, // Open Graph 圖片 URL，用於社交分享
});

// 更新打卡請求 Schema
export const updateCheckInSchema = z.object({
  note: z.string().max(500, '筆記不可超過 500 字').optional(),
  mood: checkInMoodSchema.optional(),
  reflectionText: z.string().max(1000, '反思文字不可超過 1000 字').optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).max(5, '標籤最多 5 個').optional(),
  ogImage: ogImageSchema, // Open Graph 圖片 URL，用於社交分享
});

// 查詢參數 Schema
export const practiceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  query: z.string().optional(),
  contentType: z.string().optional(), // 逗號分隔
  tags: z.string().optional(), // 逗號分隔
  userId: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived', 'all']).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const checkInQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mood: checkInMoodSchema.optional(),
  include: z.string().optional(),
});

// 月度日曆查詢參數 Schema
export const monthlyCalendarParamsSchema = z.object({
  year: z.coerce.number().min(2000).max(2100),
  month: z.coerce.number().min(1).max(12),
});

// 路徑參數 Schema
export const practiceParamsSchema = z.object({
  id: z.string().uuid('請提供有效的實踐 ID'),
});

export const checkInParamsSchema = z.object({
  practiceId: z.string().uuid('請提供有效的實踐 ID'),
  checkInId: z.string().uuid('請提供有效的打卡 ID').optional(),
});

// 事件記錄 Schema
export const eventViewSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().uuid('請提供有效的實踐 ID'),
  duration: z.number().min(0).optional(),
});

export const eventClickSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().uuid('請提供有效的實踐 ID'),
  clickPosition: z.string().optional(),
});

export const eventShareSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().uuid('請提供有效的實踐 ID'),
  shareChannel: z.string().min(1, '請指定分享渠道'),
});

export const eventFavoriteSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().uuid('請提供有效的實踐 ID'),
});

// 型別導出
export type CreatePracticeRequest = z.infer<typeof createPracticeSchema>;
export type UpdatePracticeRequest = z.infer<typeof updatePracticeSchema>;
export type CheckInRequest = z.infer<typeof checkInSchema>;
export type UpdateCheckInRequest = z.infer<typeof updateCheckInSchema>;
export type PracticeQueryParams = z.infer<typeof practiceQuerySchema>;
export type CheckInQueryParams = z.infer<typeof checkInQuerySchema>;
export type MonthlyCalendarParams = z.infer<typeof monthlyCalendarParamsSchema>;
export type PracticeResourceInput = z.infer<typeof practiceResourceInputSchema>;
export type PracticeResourceResponse = z.infer<typeof practiceResourceSchema>;
export type PracticeParams = z.infer<typeof practiceParamsSchema>;
export type CheckInParams = z.infer<typeof checkInParamsSchema>;
export type EventViewRequest = z.infer<typeof eventViewSchema>;
export type EventClickRequest = z.infer<typeof eventClickSchema>;
export type EventShareRequest = z.infer<typeof eventShareSchema>;
export type EventFavoriteRequest = z.infer<typeof eventFavoriteSchema>;
