/**
 * Note Validators
 * 便利貼驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';

// 可見性選項
const VISIBILITY_OPTIONS = ['private', 'public'] as const;

// URL 驗證正則表達式
const URL_REGEX = /^https?:\/\/.+/;

/**
 * 創建便利貼驗證模式
 */
export const createNoteSchema = z.object({
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
 * 更新便利貼驗證模式
 */
export const updateNoteSchema = z.object({
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
 * 便利貼查詢參數驗證模式
 */
export const noteQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional(),
  visibility: z.enum(VISIBILITY_OPTIONS).optional(),
  week: z.string().regex(/^\d+$/, '週數必須是正整數').transform(Number).optional()
});

/**
 * 便利貼路徑參數驗證模式
 */
export const noteParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空'),
  
  noteId: z.string({
    message: '便利貼ID為必填項目'
  }).regex(/^\d+$/, '便利貼ID必須是數字').transform(Number)
});

/**
 * 專案路徑參數驗證模式
 */
export const projectParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
});

/**
 * 公開便利貼查詢參數驗證模式
 */
export const publicNotesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional().default(1 as any),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional().default(10 as any)
});

// 導出驗證類型
export type CreateNoteData = z.infer<typeof createNoteSchema>;
export type UpdateNoteData = z.infer<typeof updateNoteSchema>;
export type NoteQueryParams = z.infer<typeof noteQuerySchema>;
export type NoteParamsData = z.infer<typeof noteParamsSchema>;
export type ProjectParamsData = z.infer<typeof projectParamsSchema>;
export type PublicNotesQueryData = z.infer<typeof publicNotesQuerySchema>;