import { z } from 'zod';
export const inviteMembersSchema = z.object({
  emails: z.array(z.string()).max(500).optional(),
  csv: z.string().max(200000).optional(),
  preview: z.boolean().optional().default(false)
}).refine(value => Boolean(value.emails?.length || value.csv?.trim()), { message: '必須提供 emails 或 csv' });
export const inviteMembersResponseSchema = z.object({
  total: z.number().int(), validCount: z.number().int(), errorCount: z.number().int(), queuedCount: z.number().int(),
  sendableCount: z.number().int().openapi({ description: '會寄出邀請信的筆數（新邀請、已邀請重寄、曾退出重新邀請）' }),
  skippedCount: z.number().int().openapi({ description: '已加入而略過、不重寄的筆數' }),
  blockedReason: z.enum(['not_published', 'expired', 'full']).nullable().openapi({ description: '此期目前不可寄送邀請的原因（未發布／已過加入截止日／已額滿）；可寄送時為 null' }),
  items: z.array(z.object({
    email: z.string(), valid: z.boolean(), reason: z.string().nullable(), enrollmentId: z.number().int().nullable(),
    state: z.enum(['new', 'invited', 'joined', 'rejoin', 'invalid']).optional().openapi({ description: '預覽時的名單狀態：new 新邀請、invited 已邀請、joined 已加入、rejoin 曾退出將重新邀請、invalid 格式錯誤' })
  }))
});
export const invitationParamsSchema = z.object({
  programId: z.coerce.number().int().positive(), cohortId: z.coerce.number().int().positive(), enrollmentId: z.coerce.number().int().positive()
});
export const resendInvitationResponseSchema = z.object({ enrollmentId: z.number().int(), queued: z.boolean() });
export type InviteMembersInput = z.infer<typeof inviteMembersSchema>;
