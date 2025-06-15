/**
 * Resource 相關驗證器
 */

import { z } from 'zod';
import { resourceReviewSchema } from './resourceReview.validator';

// 資源類型驗證
export const resourceTypeSchema = z.enum([
  'learning_platform_app',
  'learning_tools',
  'books_articles',
  'video_content',
  'podcast_content',
  'workshops_courses',
  'professional_certificates',
  'community_organization',
  'other'
]);

// 費用類型驗證
export const costTypeSchema = z.enum([
  'free',
  'paid',
  'partial_free'
]);

// 程度類型驗證
export const levelTypeSchema = z.enum([
  'beginner',
  'intermediate',
  'expert',
  'all_levels'
]);

// 狀態類型驗證
export const resourceStatusSchema = z.enum([
  'draft',
  'active',
  'archived',
  'reported'
]);

// URL 驗證 (加強驗證邏輯)
export const urlSchema = z.string()
  .url({ message: "必須是有效的URL" })
  .max(1000, { message: "URL長度不能超過1000個字符" });

// 資源基本驗證 Schema
export const resourceBaseSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱不能為空" })
    .max(255, { message: "資源名稱不能超過255個字符" }),
  url: urlSchema,
  imageUrl: urlSchema.optional().nullable(),
  description: z.string()
    .min(1, { message: "資源描述不能為空" }),
  videoUrl: urlSchema.optional().nullable(),
  type: resourceTypeSchema,
  cost: costTypeSchema,
  level: levelTypeSchema.default('all_levels'),
  majorCategoryId: z.number().int().positive().optional().nullable(),
  subCategoryId: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional()
});

// 建立資源驗證 Schema (可以包含評論)
export const createResourceSchema = resourceBaseSchema.extend({
  // 可選的巢狀評論
  review: resourceReviewSchema.optional()
});

// 更新資源驗證 Schema
export const updateResourceSchema = resourceBaseSchema.partial();

// 狀態更新驗證 Schema
export const updateResourceStatusSchema = z.object({
  status: resourceStatusSchema
});

// 使用 zod 推導型別
export type ResourceSchema = z.infer<typeof resourceBaseSchema>;
export type CreateResourceSchema = z.infer<typeof createResourceSchema>;
export type UpdateResourceSchema = z.infer<typeof updateResourceSchema>;
export type UpdateResourceStatusSchema = z.infer<typeof updateResourceStatusSchema>;

// 匯出驗證中間件
export const validateCreateResource = (data: any) => createResourceSchema.parse(data);
export const validateUpdateResource = (data: any) => updateResourceSchema.parse(data);
export const validateUpdateResourceStatus = (data: any) => updateResourceStatusSchema.parse(data);
