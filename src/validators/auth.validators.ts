/**
 * 認證相關驗證器
 * 使用 Zod 進行輸入驗證
 */

import { z } from 'zod';

/**
 * 登入請求驗證器
 */
export const loginValidator = z.object({
  email: z
    .string({ required_error: '電子郵件為必填欄位' })
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: '密碼為必填欄位' })
    .min(1, '密碼不能為空'),
  rememberMe: z
    .boolean()
    .optional()
    .default(false)
});

/**
 * 註冊請求驗證器
 */
export const registerValidator = z.object({
  username: z
    .string({ required_error: '用戶名為必填欄位' })
    .min(3, '用戶名至少需要 3 個字符')
    .max(50, '用戶名不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用戶名只能包含字母、數字、底線和連字符')
    .trim(),
  email: z
    .string({ required_error: '電子郵件為必填欄位' })
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: '密碼為必填欄位' })
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字'),
  confirmPassword: z
    .string({ required_error: '確認密碼為必填欄位' }),
  name: z
    .string()
    .max(100, '顯示名稱不能超過 100 個字符')
    .trim()
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼確認不符',
  path: ['confirmPassword']
});

/**
 * 忘記密碼請求驗證器
 */
export const forgotPasswordValidator = z.object({
  email: z
    .string({ required_error: '電子郵件為必填欄位' })
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
});

/**
 * 重設密碼請求驗證器
 */
export const resetPasswordValidator = z.object({
  token: z
    .string({ required_error: '重設令牌為必填欄位' })
    .min(1, '重設令牌不能為空'),
  newPassword: z
    .string({ required_error: '新密碼為必填欄位' })
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字'),
  confirmPassword: z
    .string({ required_error: '確認密碼為必填欄位' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '密碼確認不符',
  path: ['confirmPassword']
});

/**
 * 郵件驗證請求驗證器
 */
export const verifyEmailValidator = z.object({
  token: z
    .string({ required_error: '驗證令牌為必填欄位' })
    .min(1, '驗證令牌不能為空'),
  email: z
    .string({ required_error: '電子郵件為必填欄位' })
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
});

/**
 * 更改密碼請求驗證器
 */
export const changePasswordValidator = z.object({
  currentPassword: z
    .string({ required_error: '當前密碼為必填欄位' })
    .min(1, '當前密碼不能為空'),
  newPassword: z
    .string({ required_error: '新密碼為必填欄位' })
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字'),
  confirmPassword: z
    .string({ required_error: '確認密碼為必填欄位' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '密碼確認不符',
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: '新密碼必須與當前密碼不同',
  path: ['newPassword']
});

/**
 * 更新個人資料請求驗證器
 */
export const updateProfileValidator = z.object({
  name: z
    .string()
    .max(100, '顯示名稱不能超過 100 個字符')
    .trim()
    .optional(),
  username: z
    .string()
    .min(3, '用戶名至少需要 3 個字符')
    .max(50, '用戶名不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用戶名只能包含字母、數字、底線和連字符')
    .trim()
    .optional(),
  photo_url: z
    .string()
    .url('請輸入有效的 URL 格式')
    .max(2048, 'URL 長度不能超過 2048 個字符')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, '個人簡介不能超過 500 個字符')
    .trim()
    .optional()
    .nullable()
});

/**
 * JWT Token 驗證器
 */
export const tokenValidator = z.object({
  token: z
    .string({ required_error: 'Token 為必填欄位' })
    .min(1, 'Token 不能為空')
    .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, '無效的 JWT Token 格式')
});

/**
 * 註銷所有設備請求驗證器
 */
export const revokeAllSessionsValidator = z.object({
  password: z
    .string({ required_error: '密碼為必填欄位' })
    .min(1, '密碼不能為空')
});

/**
 * OAuth 狀態驗證器
 */
export const oauthStateValidator = z.object({
  state: z
    .string()
    .min(1, '狀態參數不能為空')
    .optional(),
  code: z
    .string()
    .min(1, '授權碼不能為空')
    .optional(),
  error: z
    .string()
    .optional(),
  error_description: z
    .string()
    .optional()
});

// 導出所有驗證器的型別
export type LoginRequest = z.infer<typeof loginValidator>;
export type RegisterRequest = z.infer<typeof registerValidator>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordValidator>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordValidator>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailValidator>;
export type ChangePasswordRequest = z.infer<typeof changePasswordValidator>;
export type UpdateProfileRequest = z.infer<typeof updateProfileValidator>;
export type TokenRequest = z.infer<typeof tokenValidator>;
export type RevokeAllSessionsRequest = z.infer<typeof revokeAllSessionsValidator>;
export type OAuthStateRequest = z.infer<typeof oauthStateValidator>;

// 統一導出
export const authValidators = {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  changePasswordValidator,
  updateProfileValidator,
  tokenValidator,
  revokeAllSessionsValidator,
  oauthStateValidator
};

export default authValidators;