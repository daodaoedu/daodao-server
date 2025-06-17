/**
 * 資源驗證器
 * 使用 Zod 實現資源相關驗證
 */

import { z } from 'zod';
import { 
  RESOURCE_TYPES, 
  COST_TYPES, 
  LEVEL_TYPES, 
  RESOURCE_STATUS 
} from '@/constants/mappings';

// 將物件值轉換為字串陣列，用於 enum 驗證
const resourceTypeValues = Object.values(RESOURCE_TYPES);
const costTypeValues = Object.values(COST_TYPES);
const levelTypeValues = Object.values(LEVEL_TYPES);
const statusValues = Object.values(RESOURCE_STATUS);

// 資源評價嵌套 schema (用於創建資源時同時提交評價)
const reviewSchema = z.object({
  title: z.string().min(1, { message: "評價標題為必填" }).max(255, { message: "評價標題最多 255 字符" }),
  content: z.string().min(1, { message: "評價內容為必填" }),
  score_impact: z.number().min(1, { message: "評分最小為 1" }).max(5, { message: "評分最大為 5" }),
  score_comprehensiveness: z.number().min(1, { message: "評分最小為 1" }).max(5, { message: "評分最大為 5" }),
  score_implementation: z.number().min(1, { message: "評分最小為 1" }).max(5, { message: "評分最大為 5" }),
  recommendation: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional()
}).nullable().optional();

// 資源基本 schema
const resourceBaseSchema = z.object({
  name: z.string().min(1, { message: "資源名稱為必填" }).max(255, { message: "資源名稱最多 255 字符" }),
  url: z.string().min(1, { message: "資源 URL 為必填" }).max(1000, { message: "資源 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" }),
  image_url: z.string().max(1000, { message: "圖片 URL 最多 1000 字符" }).url({ message: "URL 格式不正確" })
    .nullable().optional(),
  description: z.string().min(1, { message: "資源描述為必填" }),
  video_url: z.string().max(1000, { message: "影片 URL 最多 1000 字符" }).url({ message: "URL 格式不正確" })
    .nullable().optional(),
  type: z.enum(resourceTypeValues as [string, ...string[]], {
    errorMap: () => ({ message: "無效的資源類型" })
  }),
  cost: z.enum(costTypeValues as [string, ...string[]], {
    errorMap: () => ({ message: "無效的費用類型" })
  }),
  level: z.enum(levelTypeValues as [string, ...string[]], {
    errorMap: () => ({ message: "無效的難度等級" })
  }),
  major_category_id: z.number().int({ message: "主分類 ID 必須為整數" }).nullable().optional(),
  sub_category_id: z.number().int({ message: "子分類 ID 必須為整數" }).nullable().optional(),
  tags: z.array(z.string()).nullable().optional()
});

// 創建資源 schema
export const createResourceSchema = resourceBaseSchema.extend({
  status: z.enum(statusValues as [string, ...string[]], { 
    errorMap: () => ({ message: "無效的資源狀態" }) 
  }).default("active"),
  review: reviewSchema
});

// 更新資源 schema - 所有欄位都是可選的，用於部分更新
export const updateResourceSchema = resourceBaseSchema.partial().extend({
  status: z.enum(statusValues as [string, ...string[]], { 
    errorMap: () => ({ message: "無效的資源狀態" }) 
  }).optional()
});

// 更新資源狀態 schema
export const updateResourceStatusSchema = z.object({
  status: z.enum(statusValues as [string, ...string[]], {
    errorMap: () => ({ message: "無效的資源狀態" })
  })
});

// 使用 zod 推導型別
export type CreateResourceSchema = z.infer<typeof createResourceSchema>;
export type UpdateResourceSchema = z.infer<typeof updateResourceSchema>;
export type UpdateResourceStatusSchema = z.infer<typeof updateResourceStatusSchema>;

// 資源 API 響應類型
export type ResourceSchema = UpdateResourceSchema & {
  id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  author?: any;
  majorCategory?: any;
  subCategory?: any;
  tags?: any[];
  stats?: {
    view_count: number;
    favorite_count: number;
    share_count: number;
    review_count: number;
  };
  avgRating?: number | null;
};

// 導出驗證函數
export const validateCreateResource = (data: any) => createResourceSchema.parse(data);
export const validateUpdateResource = (data: any) => updateResourceSchema.parse(data);
export const validateUpdateResourceStatus = (data: any) => updateResourceStatusSchema.parse(data);
