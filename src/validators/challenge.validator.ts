import { z } from 'zod';

export const challengeParamsSchema = z.object({
  challengeId: z.coerce.number().int().positive().openapi({ description: '挑戰（期）ID', example: 1 })
});

/** 依日期推導的挑戰運行狀態（cohorts.status 僅表示編輯狀態） */
export const challengeRunStatusSchema = z.enum(['upcoming', 'ongoing', 'ended']).openapi({
  description: '挑戰運行狀態：upcoming（未開始）、ongoing（進行中）、ended（已結束）'
});

export const challengeSummarySchema = z.object({
  id: z.number().int().openapi({ description: '挑戰（期）ID', example: 1 }),
  displayName: z.string().openapi({ description: '挑戰名稱', example: '21 天晨間書寫' }),
  programName: z.string().openapi({ description: '所屬挑戰主題名稱', example: '晨間書寫' }),
  description: z.string().nullable().openapi({ description: '主題說明' }),
  startDate: z.date().openapi({ description: '開始日（所有參與者共用）' }),
  endDate: z.date().openapi({ description: '結束日' }),
  joinDeadline: z.date().nullable().openapi({ description: '加入截止日；null 表示可加入至結束日' }),
  participantCount: z.number().int().nonnegative().openapi({ description: '已加入人數（xx 座島已加入）', example: 12 }),
  runStatus: challengeRunStatusSchema,
  canJoin: z.boolean().openapi({ description: '目前是否可加入' }),
  unavailableReason: z.enum(['ended', 'expired', 'full', 'paused']).nullable().openapi({ description: '不可加入原因；可加入時為 null' }),
  isJoined: z.boolean().openapi({ description: '當前使用者是否已加入；未登入一律 false' }),
  hasInspirationDeck: z.boolean().openapi({ description: '是否有指派靈感卡卡組（顯示抽卡 icon）' })
});

export const challengeListResponseSchema = z.array(challengeSummarySchema);

export const challengeDetailResponseSchema = challengeSummarySchema.extend({
  template: z.object({
    title: z.string().openapi({ description: '實踐模板標題' }),
    practiceAction: z.string().nullable().openapi({ description: '練習行動描述' })
  }).nullable().openapi({ description: '此期綁定的實踐模板；加入後自動複製給使用者' })
});

export const challengeJoinResultSchema = z.object({
  enrollmentId: z.number().int().openapi({ description: '參與記錄 ID' }),
  cohortId: z.number().int().openapi({ description: '挑戰（期）ID' }),
  status: z.literal('joined'),
  practiceId: z.string().uuid().nullable().openapi({ description: '自動複製產生的實踐 external_id；無綁定模板時為 null' })
});

/** 我參加的共同挑戰（空間共同挑戰子頁）：挑戰摘要 + 我在該挑戰的實踐 */
export const myChallengeSchema = challengeSummarySchema.extend({
  practiceId: z.string().uuid().nullable().openapi({ description: '加入時自動複製的實踐 external_id；無綁定模板或已刪除時為 null' }),
  checkInCount: z.number().int().nonnegative().openapi({ description: '該使用者在此挑戰實踐的打卡次數', example: 7 })
});
export const myChallengesResponseSchema = z.array(myChallengeSchema);
