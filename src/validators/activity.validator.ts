import { z } from 'zod';

export const activityParamsSchema = z.object({
  cohortId: z.coerce.number().int().positive().openapi({ description: '活動（期）ID', example: 1 })
});

/** 依日期推導的活動運行狀態（cohorts.status 僅表示編輯狀態） */
export const activityRunStatusSchema = z.enum(['upcoming', 'ongoing', 'ended']).openapi({
  description: '活動運行狀態：upcoming（未開始）、ongoing（進行中）、ended（已結束）'
});

export const activitySummarySchema = z.object({
  id: z.number().int().openapi({ description: '活動（期）ID', example: 1 }),
  displayName: z.string().openapi({ description: '活動名稱', example: '2026 秋季讀書會' }),
  programName: z.string().openapi({ description: '所屬系列名稱', example: '線上讀書會' }),
  description: z.string().nullable().openapi({ description: '系列說明' }),
  organizationName: z.string().openapi({ description: '主辦組織名稱', example: '島島阿學' }),
  startDate: z.date().openapi({ description: '開始日' }),
  endDate: z.date().openapi({ description: '結束日' }),
  joinDeadline: z.date().nullable().openapi({ description: '加入截止日；null 表示可加入至結束日' }),
  capacity: z.number().int().nullable().openapi({ description: '人數上限；null 表示不限' }),
  participantCount: z.number().int().nonnegative().openapi({ description: '已加入人數', example: 12 }),
  runStatus: activityRunStatusSchema,
  canJoin: z.boolean().openapi({ description: '目前是否可加入' }),
  unavailableReason: z.enum(['ended', 'expired', 'full', 'paused']).nullable().openapi({ description: '不可加入原因；可加入時為 null' }),
  isJoined: z.boolean().openapi({ description: '當前使用者是否已加入；未登入一律 false' }),
  joinToken: z.string().uuid().nullable().openapi({ description: '加入連結 token（導向 /cohorts/join/{joinToken}）；僅 canJoin 時回傳，否則 null' })
});

export const activityListResponseSchema = z.array(activitySummarySchema);

export const activityDetailResponseSchema = activitySummarySchema.extend({
  organization: z.object({
    name: z.string().openapi({ description: '主辦組織名稱' }),
    bio: z.string().nullable().openapi({ description: '組織簡介' }),
    externalLink: z.string().nullable().openapi({ description: '組織外部連結' })
  }),
  inviteMessage: z.string().nullable().openapi({ description: '組織設定的邀請文案' })
});

export type ActivitySummary = z.infer<typeof activitySummarySchema>;
