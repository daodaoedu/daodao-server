import { z } from 'zod';

// 基礎枚舉
export const ideaStatusSchema = z.enum(['active', 'draft', 'archived']);

// 想法資源 Schema
export const ideaResourceSchema = z.object({
  name: z.string().min(1, '請輸入資源名稱').max(255, '資源名稱不能超過255字符'),
  url: z.string().url('請輸入有效的網址').refine(
    (url) => url.startsWith('https://'),
    'URL 必須以 https:// 開頭'
  ),
  description: z.string().optional(),
});

// 創建想法請求 Schema
export const createIdeaSchema = z.object({
  content: z.string().min(1, '請輸入內容').max(5000, '內容不能超過5000字'),
  tags: z.array(z.string().min(1).max(50)).max(10, '標籤最多10個').default([]),
  resources: z.array(ideaResourceSchema).max(5, '資源最多5個').optional(),
});

// 更新想法請求 Schema
export const updateIdeaSchema = z.object({
  content: z.string().min(1, '請輸入內容').max(5000, '內容不能超過5000字').optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, '標籤最多10個').optional(),
  status: ideaStatusSchema.optional(),
});

// 查詢參數 Schema
export const ideaQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  query: z.string().optional(),
  tags: z.string().optional(), // 逗號分隔的標籤
  userId: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived', 'all']).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// 事件記錄 Schema
export const eventViewSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().uuid('請提供有效的想法ID'),
  duration: z.number().min(0).optional(),
});

export const eventClickSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().uuid('請提供有效的想法ID'),
  clickPosition: z.string().optional(),
});

export const eventShareSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().uuid('請提供有效的想法ID'),
  shareChannel: z.string().min(1, '請指定分享渠道'),
});

export const eventFavoriteSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().uuid('請提供有效的想法ID'),
});

// 路徑參數 Schema
export const ideaParamsSchema = z.object({
  id: z.string().uuid('請提供有效的想法ID'),
});

// 型別導出
export type CreateIdeaRequest = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaRequest = z.infer<typeof updateIdeaSchema>;
export type IdeaQueryParams = z.infer<typeof ideaQuerySchema>;
export type EventViewRequest = z.infer<typeof eventViewSchema>;
export type EventClickRequest = z.infer<typeof eventClickSchema>;
export type EventShareRequest = z.infer<typeof eventShareSchema>;
export type EventFavoriteRequest = z.infer<typeof eventFavoriteSchema>;
export type IdeaParamsRequest = z.infer<typeof ideaParamsSchema>;