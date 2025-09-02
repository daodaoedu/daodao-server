/**
 * Outcome Validators
 * 成果驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';

// 可見性選項
const VISIBILITY_OPTIONS = ['private', 'public'] as const;

// URL 驗證正則表達式
const URL_REGEX = /^https?:\/\/.+/;

/**
 * 創建成果驗證模式
 */
export const createOutcomeSchema = z.object({
  week: z.number({
    message: '週數必須是數字'
  }).int('週數必須是整數').min(1, '週數必須大於0'),
  
  title: z.string({
    message: '標題為必填項目'
  }).min(1, '標題不能為空').max(100, '標題不可超過100字'),
  
  date: z.string({
    message: '日期為必填項目'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD'),
  
  content: z.string({
    message: '內容為必填項目'
  }).min(1, '內容不能為空').max(5000, '內容不可超過5000字'),
  
  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
  ).optional(),
  
  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
  ).optional(),
  
  visibility: z.enum(VISIBILITY_OPTIONS).optional().default('private')
});

/**
 * 更新成果驗證模式
 */
export const updateOutcomeSchema = z.object({
  week: z.number({
    message: '週數必須是數字'
  }).int('週數必須是整數').min(1, '週數必須大於0').optional(),
  
  title: z.string().min(1, '標題不能為空').max(100, '標題不可超過100字').optional(),
  
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').optional(),
  
  content: z.string().min(1, '內容不能為空').max(5000, '內容不可超過5000字').optional(),
  
  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
  ).optional(),
  
  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
  ).optional(),
  
  visibility: z.enum(VISIBILITY_OPTIONS).optional()
});

/**
 * 成果查詢參數驗證模式
 */
export const outcomeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional(),
  visibility: z.enum(VISIBILITY_OPTIONS).optional(),
  week: z.string().regex(/^\d+$/, '週數必須是正整數').transform(Number).optional()
});

/**
 * 成果路徑參數驗證模式
 */
export const outcomeParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空'),
  
  outcomeId: z.string({
    message: '成果ID為必填項目'
  }).regex(/^\d+$/, '成果ID必須是數字').transform(Number)
});

/**
 * 專案路徑參數驗證模式（成果專用）
 */
export const outcomeProjectParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
});

/**
 * 公開成果查詢參數驗證模式
 */
export const publicOutcomesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional().default(1 as any),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional().default(10 as any)
});

// 導出驗證類型
export type CreateOutcomeData = z.infer<typeof createOutcomeSchema>;
export type UpdateOutcomeData = z.infer<typeof updateOutcomeSchema>;
export type OutcomeQueryParams = z.infer<typeof outcomeQuerySchema>;
export type OutcomeParamsData = z.infer<typeof outcomeParamsSchema>;
export type OutcomeProjectParamsData = z.infer<typeof outcomeProjectParamsSchema>;
export type PublicOutcomesQueryData = z.infer<typeof publicOutcomesQuerySchema>;