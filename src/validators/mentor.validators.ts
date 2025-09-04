/**
 * Mentor Validators
 * 導師相關驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';

/**
 * 指定導師參與馬拉松驗證模式
 */
export const assignMentorToMarathonSchema = z.object({
  mentorId: z.number({
    message: '導師 ID 必須是數字'
  }).int('導師 ID 必須是整數').min(1, '導師 ID 必須是正整數'),
  
  eventId: z.string({
    message: '活動 ID 為必填項目'
  }).min(1, '活動 ID 不能為空')
});

/**
 * 更新導師馬拉松關聯驗證模式
 */
export const updateMentorMarathonSchema = z.object({
  marathonId: z.string().min(1, '馬拉松 ID 不能為空').optional()
});

/**
 * 指定參與者給導師驗證模式
 */
export const assignParticipantToMentorSchema = z.object({
  participantId: z.number({
    message: '參與者 ID 必須是數字'
  }).int('參與者 ID 必須是整數').min(1, '參與者 ID 必須是正整數')
});

/**
 * 路徑參數驗證模式
 */
export const assignmentIdParamsSchema = z.object({
  assignmentId: z.string({
    message: '指派 ID 為必填項目'
  }).regex(/^\d+$/, '指派 ID 必須是數字').transform(Number)
});

export const participantIdParamsSchema = z.object({
  participantId: z.string({
    message: '參與者 ID 為必填項目'
  }).regex(/^\d+$/, '參與者 ID 必須是數字').transform(Number)
});

export const eventIdParamsSchema = z.object({
  eventId: z.string({
    message: '活動 ID 為必填項目'
  }).min(1, '活動 ID 不能為空')
});

/**
 * 分頁查詢驗證模式
 */
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁碼必須是正整數').transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional().default(10)
});

// 導出驗證類型
export type AssignMentorToMarathonData = z.infer<typeof assignMentorToMarathonSchema>;
export type UpdateMentorMarathonData = z.infer<typeof updateMentorMarathonSchema>;
export type AssignParticipantToMentorData = z.infer<typeof assignParticipantToMentorSchema>;
export type AssignmentIdParamsData = z.infer<typeof assignmentIdParamsSchema>;
export type ParticipantIdParamsData = z.infer<typeof participantIdParamsSchema>;
export type EventIdParamsData = z.infer<typeof eventIdParamsSchema>;
export type PaginationQueryData = z.infer<typeof paginationQuerySchema>;