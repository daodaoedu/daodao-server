/**
 * 通用請求參數驗證器
 */

import { z } from 'zod';
import { SORT_FIELDS, SORT_DIRECTIONS } from '@/constants/mappings';

// 通用分頁參數驗證
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "limit 必須是有效的數字" })
    .refine(val => val > 0 && val <= 100, { message: "limit 必須在 1-100 之間" })
    .optional(),
  sortField: z.enum([...SORT_FIELDS] as [string, ...string[]]).optional(),
  sortDirection: z.enum([...SORT_DIRECTIONS] as [string, ...string[]]).optional()
});

// 資源過濾參數驗證
export const resourceFilterSchema = z.object({
  type: z.string().optional(),
  cost: z.string().optional(),
  level: z.string().optional(),
  majorCategoryId: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "majorCategoryId 必須是有效的數字" })
    .optional(),
  subCategoryId: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "subCategoryId 必須是有效的數字" })
    .optional(),
  tags: z.string()
    .transform(val => val.split(',').map(tag => tag.trim()))
    .optional(),
  query: z.string().optional(),
  createdBy: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "createdBy 必須是有效的數字" })
    .optional()
});

// 心得評價過濾參數驗證
export const reviewFilterSchema = z.object({
  resourceId: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "resourceId 必須是有效的數字" })
    .optional(),
  userId: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "userId 必須是有效的數字" })
    .optional(),
  tags: z.string()
    .transform(val => val.split(',').map(tag => tag.trim()))
    .optional()
});

// 標籤相關參數驗證
export const tagQuerySchema = z.object({
  entityType: z.string().optional(),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "limit 必須是有效的數字" })
    .optional(),
  query: z.string().optional()
});

// 標籤實體操作參數驗證
export const tagEntitySchema = z.object({
  entityId: z.number().int().positive(),
  entityType: z.string(),
  tagName: z.string().min(1).max(50)
});

// 使用 zod 推導型別
export type PaginationParams = z.infer<typeof paginationSchema>;
export type ResourceFilterParams = z.infer<typeof resourceFilterSchema>;
export type ReviewFilterParams = z.infer<typeof reviewFilterSchema>;
export type TagQueryParams = z.infer<typeof tagQuerySchema>;
export type TagEntityParams = z.infer<typeof tagEntitySchema>;

// 導出驗證函數
export const validatePagination = (data: any) => paginationSchema.parse(data);
export const validateResourceFilter = (data: any) => resourceFilterSchema.parse(data);
export const validateReviewFilter = (data: any) => reviewFilterSchema.parse(data);
export const validateTagQuery = (data: any) => tagQuerySchema.parse(data);
export const validateTagEntity = (data: any) => tagEntitySchema.parse(data);
