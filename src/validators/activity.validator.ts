import { z } from 'zod';
import { COHORT_INTERACTION_MODES, COHORT_FEE_TYPES, COHORT_SIGNUP_METHODS } from '../constants/cohort-setup';

const interactionModeSchema = z.enum(COHORT_INTERACTION_MODES);
const feeTypeSchema = z.enum(COHORT_FEE_TYPES);
const signupMethodSchema = z.enum(COHORT_SIGNUP_METHODS);

/** 聚會時段（回應用） */
const sessionSchema = z.object({
  id: z.number().int(),
  sessionDate: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable()
});

export const activityParamsSchema = z.object({
  cohortId: z.coerce.number().int().positive().openapi({ description: '活動（期）ID', example: 1 })
});

/** 探索頁列表查詢（含 ?mode= 篩選） */
export const activityListQuerySchema = z.object({
  mode: z.enum(COHORT_INTERACTION_MODES).optional().openapi({ description: '依互動方式篩選', example: 'sync' })
});

/** 依日期推導的活動運行狀態（cohorts.status 僅表示編輯狀態） */
export const activityRunStatusSchema = z.enum(['upcoming', 'ongoing', 'ended']).openapi({
  description: '活動運行狀態：upcoming（未開始）、ongoing（進行中）、ended（已結束）'
});

/** 發起人資訊（三層 fallback 解析） */
export const activityHostSchema = z.object({
  userId: z.number().int().nullable().openapi({ description: '發起人 user ID；皆無法解析時為 null' }),
  name: z.string().openapi({ description: '發起人名稱（nickname 或組織名稱 fallback）' }),
  avatar: z.string().nullable().openapi({ description: '發起人頭像 URL' }),
  identifier: z.string().nullable().openapi({ description: '發起人 identifier（custom_id 或 external_id）' })
}).openapi({ description: '發起人資訊' });

export const activitySummarySchema = z.object({
  id: z.number().int().openapi({ description: '活動（期）ID', example: 1 }),
  displayName: z.string().openapi({ description: '活動名稱', example: '2026 秋季讀書會' }),
  tagline: z.string().nullable().openapi({ description: '一句話簡介' }),
  programName: z.string().openapi({ description: '所屬系列名稱', example: '線上讀書會' }),
  description: z.string().nullable().openapi({ description: '系列說明' }),
  organizationName: z.string().openapi({ description: '主辦組織名稱', example: '島島阿學' }),
  host: activityHostSchema,
  startDate: z.date().openapi({ description: '開始日' }),
  endDate: z.date().openapi({ description: '結束日' }),
  joinDeadline: z.date().nullable().openapi({ description: '加入截止日；null 表示可加入至結束日' }),
  capacity: z.number().int().nullable().openapi({ description: '人數上限；null 表示不限' }),
  participantCount: z.number().int().nonnegative().openapi({ description: '已加入人數', example: 12 }),
  interactionModes: z.array(interactionModeSchema).openapi({ description: '互動方式' }),
  location: z.string().nullable().openapi({ description: '活動地點' }),
  feeType: feeTypeSchema.openapi({ description: '收費類型' }),
  feeAmount: z.number().int().nullable().openapi({ description: '費用金額' }),
  signupMethod: signupMethodSchema.openapi({ description: '報名方式' }),
  templateCount: z.number().int().nonnegative().openapi({ description: '有效綁定的實踐模版數', example: 3 }),
  runStatus: activityRunStatusSchema,
  canJoin: z.boolean().openapi({ description: '目前是否可加入' }),
  unavailableReason: z.enum(['ended', 'expired', 'full', 'paused']).nullable().openapi({ description: '不可加入原因；可加入時為 null' }),
  isJoined: z.boolean().openapi({ description: '當前使用者是否已加入；未登入一律 false' }),
  joinToken: z.string().uuid().nullable().openapi({ description: '加入連結 token（導向 /cohorts/join/{joinToken}）；僅 canJoin 時回傳，否則 null' })
});

/** 列表回應 meta（已結束截斷資訊） */
export const activityListMetaSchema = z.object({
  endedLimit: z.number().int().openapi({ description: '已結束活動的上限', example: 24 }),
  endedTruncated: z.boolean().openapi({ description: '已結束活動是否被截斷' })
});

export const activityListResponseSchema = z.array(activitySummarySchema);

export const activityDetailResponseSchema = activitySummarySchema.extend({
  sessions: z.array(sessionSchema).openapi({ description: '聚會時段' }),
  externalSignupUrl: z.string().nullable().openapi({ description: '外部報名連結' }),
  organization: z.object({
    name: z.string().openapi({ description: '主辦組織名稱' }),
    bio: z.string().nullable().openapi({ description: '組織簡介' }),
    externalLink: z.string().nullable().openapi({ description: '組織外部連結' })
  }),
  inviteMessage: z.string().nullable().openapi({ description: '組織設定的邀請文案' })
});

/** 發起人快覽端點 params */
export const activityHostParamsSchema = z.object({
  userId: z.coerce.number().int().positive().openapi({ description: '發起人 user ID', example: 42 })
});

/** 發起人快覽回應 */
export const activityHostPreviewSchema = z.object({
  userId: z.number().int().openapi({ description: '使用者 ID' }),
  name: z.string().openapi({ description: '名稱（nickname）' }),
  avatar: z.string().nullable().openapi({ description: '頭像 URL' }),
  identifier: z.string().nullable().openapi({ description: 'custom_id 或 external_id' }),
  selfIntroduction: z.string().nullable().openapi({ description: '自我介紹' }),
  organizationName: z.string().openapi({ description: '組織名稱' }),
  hostedActivityCount: z.number().int().nonnegative().openapi({ description: '主持的活動數（所有已發佈燈塔期）' }),
  learnedWithCount: z.number().int().nonnegative().openapi({ description: '共學人數（去重，排除本人）' }),
  joinedYear: z.number().int().openapi({ description: '加入年份', example: 2024 })
});

export type ActivitySummary = z.infer<typeof activitySummarySchema>;
export type ActivityHost = z.infer<typeof activityHostSchema>;
