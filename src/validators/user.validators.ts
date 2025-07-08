/**
 * 用戶驗證器
 * 使用 Zod 實現用戶相關驗證
 */

import { z } from 'zod';

// 聯絡資訊 schema
const contactListSchema = z.object({
  instagram: z.string().optional(),
  discord: z.string().optional(),
  line: z.string().optional(),
  facebook: z.string().optional(),
}).optional();

// 創建用戶 schema
export const createUserSchema = z.object({
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.string().or(z.date()).optional(),
  contactList: contactListSchema,
  educationStage: z.enum(['university', 'high', 'other']).optional(),
  isOpenLocation: z.boolean().optional(),
  isOpenProfile: z.boolean().optional(),
  isSubscribeEmail: z.boolean().optional(),
  location: z.string().optional(), // area code
  roleList: z.array(z.string()).optional(),
  selfIntroduction: z.string().optional(),
  share: z.string().or(z.array(z.string())).optional(),
  wantToDoList: z.array(z.string()).optional(),
  tagList: z.array(z.string()).optional(),
  interestList: z.array(z.string()).optional(),
  isSendEmail: z.boolean().optional(),
});

// 更新用戶 schema
export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().url().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.string().or(z.date()).optional(),
  contactList: contactListSchema,
  educationStage: z.enum(['university', 'high', 'other']).optional(),
  isOpenLocation: z.boolean().optional(),
  isOpenProfile: z.boolean().optional(),
  isSubscribeEmail: z.boolean().optional(),
  selfIntroduction: z.string().optional(),
  share: z.string().or(z.array(z.string())).optional(),
  wantToDoList: z.array(z.string()).optional(),
  tagList: z.array(z.string()).optional(),
  roleList: z.array(z.string()).optional(),
  interestList: z.array(z.string()).optional(),
});

// 獲取用戶參數 schema
export const getUserParamsSchema = z.object({
  id: z.string().uuid({ message: "無效的用戶 ID 格式" }),
});

// 獲取用戶查詢參數 schema
export const getUserQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  educationStage: z.string().optional(),
  roleList: z.string().optional(),
  location: z.string().optional(),
  search: z.string().optional(),
});

// 導出型別
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type GetUserParamsDto = z.infer<typeof getUserParamsSchema>;
export type GetUserQueryDto = z.infer<typeof getUserQuerySchema>;