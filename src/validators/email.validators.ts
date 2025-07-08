/**
 * 郵件相關的驗證器
 * 使用 Zod 進行請求數據驗證
 */

import { z } from 'zod';

/**
 * 基本郵件地址驗證
 */
const emailSchema = z.string()
  .email('請提供有效的電子郵件地址')
  .min(1, '電子郵件為必填項');

/**
 * 聯絡郵件驗證器
 */
export const contactEmailSchema = z.object({
  from: emailSchema,
  to: emailSchema,
  subject: z.string().min(1, '主旨為必填項').max(200, '主旨不能超過200個字符'),
  text: z.string().min(1, '訊息內容為必填項').max(5000, '訊息內容不能超過5000個字符'),
  name: z.string().min(1, '姓名為必填項').max(100, '姓名不能超過100個字符'),
  title: z.string().max(200, '標題不能超過200個字符').optional(),
  information: z.union([
    z.string().max(500, '聯絡資訊不能超過500個字符'),
    z.array(z.string().max(100, '每項聯絡資訊不能超過100個字符')).max(10, '聯絡資訊項目不能超過10個')
  ]).optional(),
  activityTitle: z.string().max(200, '活動標題不能超過200個字符').optional()
});

/**
 * 驗證郵件驗證器
 */
export const verificationEmailSchema = z.object({
  email: emailSchema,
  verifyLink: z.string().url('請提供有效的驗證連結').min(1, '驗證連結為必填項'),
  name: z.string().max(100, '姓名不能超過100個字符').optional()
});

/**
 * 歡迎郵件驗證器
 */
export const welcomeEmailSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, '姓名為必填項').max(100, '姓名不能超過100個字符')
});

/**
 * 密碼重設郵件驗證器
 */
export const passwordResetEmailSchema = z.object({
  email: emailSchema,
  resetLink: z.string().url('請提供有效的重設連結').min(1, '重設連結為必填項'),
  name: z.string().max(100, '姓名不能超過100個字符').optional()
});

/**
 * 馬拉松郵件驗證器
 */
export const marathonEmailSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, '姓名為必填項').max(100, '姓名不能超過100個字符'),
  marathonTitle: z.string().min(1, '馬拉松標題為必填項').max(200, '馬拉松標題不能超過200個字符'),
  marathonDate: z.string().max(100, '馬拉松日期不能超過100個字符').optional(),
  marathonDescription: z.string().max(1000, '馬拉松描述不能超過1000個字符').optional()
});

/**
 * 自定義郵件驗證器
 */
export const customEmailSchema = z.object({
  to: z.union([
    emailSchema,
    z.array(emailSchema).min(1, '收件人列表不能為空').max(50, '單次發送收件人不能超過50個')
  ]),
  subject: z.string().min(1, '主旨為必填項').max(200, '主旨不能超過200個字符'),
  htmlContent: z.string().min(1, 'HTML內容為必填項').max(50000, 'HTML內容不能超過50000個字符').optional(),
  template: z.enum(['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom']).optional(),
  data: z.record(z.any()).optional()
}).refine(data => data.htmlContent || (data.template && data.data), {
  message: '必須提供 htmlContent 或 (template + data)',
  path: ['htmlContent']
});

/**
 * 批量郵件驗證器
 */
export const bulkEmailSchema = z.object({
  template: z.enum(['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom']),
  subject: z.string().min(1, '主旨為必填項').max(200, '主旨不能超過200個字符'),
  recipients: z.array(z.object({
    email: emailSchema,
    data: z.record(z.any())
  })).min(1, '收件人列表不能為空').max(100, '單次批量發送不能超過100個收件人'),
  from: emailSchema.optional(),
  scheduledAt: z.string().datetime('排程時間格式不正確').optional()
});

/**
 * 郵件地址驗證器
 */
export const validateEmailSchema = z.object({
  email: z.string().min(1, '電子郵件為必填項')
});

/**
 * 郵件模板預覽驗證器
 */
export const previewEmailSchema = z.object({
  template: z.enum(['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom']),
  data: z.record(z.any()).refine(data => {
    return Object.keys(data).length > 0;
  }, {
    message: '模板數據不能為空'
  })
});

/**
 * 郵件統計查詢驗證器
 */
export const emailStatsQuerySchema = z.object({
  startDate: z.string().datetime('開始時間格式不正確').optional(),
  endDate: z.string().datetime('結束時間格式不正確').optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: '開始時間不能晚於結束時間',
  path: ['startDate']
});

/**
 * 常用郵件類型的預設驗證器
 */
export const emailValidators = {
  contact: contactEmailSchema,
  verification: verificationEmailSchema,
  welcome: welcomeEmailSchema,
  passwordReset: passwordResetEmailSchema,
  marathon: marathonEmailSchema,
  custom: customEmailSchema,
  bulk: bulkEmailSchema,
  validate: validateEmailSchema,
  preview: previewEmailSchema,
  statsQuery: emailStatsQuerySchema
} as const;

export default emailValidators;