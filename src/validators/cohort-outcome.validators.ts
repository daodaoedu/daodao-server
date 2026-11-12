import { z } from 'zod';
import { aiCredentialProviderSchema, aiCredentialStatusSchema } from './organization-ai-credential.validators';

export const OUTCOME_PHASES = ['not_started', 'in_progress', 'ended'] as const;
export const SUMMARY_SOURCES = ['platform_ai', 'own_ai', 'manual'] as const;
export const SUMMARY_MODES = ['platform', 'own'] as const;
export const SUMMARY_CONTENT_MAX = 5000;

export const outcomeSummaryVersionSchema = z.object({
  id: z.number().int(),
  version: z.number().int().positive(),
  source: z.enum(SUMMARY_SOURCES).openapi({ description: 'platform_ai（平台 AI）| own_ai（組織自帶 key）| manual（人工編輯）' }),
  content: z.string(),
  provider: z.string().nullable(),
  modelName: z.string().nullable(),
  generatedAt: z.date().nullable().openapi({ description: 'AI 產生時間；人工版本為 null' }),
  createdBy: z.object({ id: z.number().int(), nickname: z.string().nullable() }).nullable().openapi({ description: '觸發產生或編輯的人（FR-OUT-04 最後編輯者）' }),
  createdAt: z.date(),
  isCurrent: z.boolean()
});

export const outcomePracticeSchema = z.object({
  title: z.string(),
  participants: z.number().int().nonnegative().openapi({ description: '有這個實踐的參與者數（含草稿）' }),
  started: z.number().int().nonnegative().openapi({ description: '已啟動（status ≠ draft）' }),
  completed: z.number().int().nonnegative().openapi({ description: 'status = completed' }),
  checkins: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative().openapi({ description: '留言與回應' })
});

export const outcomeParticipantSchema = z.object({
  userId: z.number().int(),
  nickname: z.string().nullable(),
  avatar: z.string().nullable(),
  practiceId: z.number().int(),
  practiceTitle: z.string(),
  practiceStatus: z.string(),
  completedCount: z.number().int().nonnegative().openapi({ description: '已完成的打卡次數' }),
  targetCount: z.number().int().nonnegative().openapi({ description: '目標打卡次數：ceil(天數 / 7 × 每週最少次數)；無設定時 0' }),
  progressPercentage: z.number().int().min(0).openapi({ description: '完成率（practices.progress_percentage，可超過 100）' }),
  checkinCount: z.number().int().nonnegative(),
  responseCount: z.number().int().nonnegative().openapi({ description: '這位參與者打卡收到的留言與回應數' }),
  publishedCommentCount: z.number().int().nonnegative().openapi({ description: '這位參與者在本場次其他成員打卡下發佈的留言數（以人計，同一人各實踐列相同）' }),
  lastActivityAt: z.date().nullable().openapi({ description: '最後一次打卡或收到回應的時間' })
});

export const cohortOutcomeResponseSchema = z.object({
  cohortId: z.number().int(),
  cohort: z.object({ displayName: z.string(), programName: z.string(), startDate: z.date(), endDate: z.date() }),
  phase: z.enum(OUTCOME_PHASES).openapi({ description: 'not_started（尚未開始）| in_progress（進行中資料）| ended（最終成果）' }),
  finalizedAt: z.date().nullable().openapi({ description: '期末 final 快照時間；沒有代表尚未結算' }),
  overview: z.object({
    participants: z.number().int().nonnegative(),
    activatedPractices: z.number().int().nonnegative(),
    checkins: z.number().int().nonnegative(),
    comments: z.number().int().nonnegative()
  }),
  ai: z.object({
    platformAvailable: z.boolean().openapi({ description: '平台 AI 是否可用（AI_BACKEND_URL 已設定）' }),
    ownKey: z.object({ status: aiCredentialStatusSchema, provider: aiCredentialProviderSchema, keyLast4: z.string().nullable() }),
    platformDailyLimit: z.number().int().positive(),
    platformUsedToday: z.number().int().nonnegative()
  }),
  summary: z.object({ current: outcomeSummaryVersionSchema.nullable(), versions: z.array(outcomeSummaryVersionSchema) }),
  practiceOutcomes: z.array(outcomePracticeSchema),
  participantProgress: z.array(outcomeParticipantSchema),
  generatedAt: z.date()
});

export const generateOutcomeSummarySchema = z.object({
  mode: z.enum(SUMMARY_MODES).optional().default('platform').openapi({ description: 'platform（平台 AI）| own（組織自帶 AI API key）' })
});

export const editOutcomeSummarySchema = z.object({
  content: z.string().trim().min(1, '摘要不可空白').max(SUMMARY_CONTENT_MAX, `摘要最多 ${SUMMARY_CONTENT_MAX} 字`)
});

export const outcomeReportExportedSchema = z.object({
  filename: z.string().trim().max(200).optional().openapi({ description: '前端實際下載的檔名，例：場次名稱_成果報告_20260911.pdf' })
});

export const outcomeReportExportedResponseSchema = z.object({
  cohortId: z.number().int(),
  filename: z.string(),
  exportedAt: z.date()
});

export type CohortOutcomeResponse = z.infer<typeof cohortOutcomeResponseSchema>;
export type OutcomeSummaryVersion = z.infer<typeof outcomeSummaryVersionSchema>;
export type GenerateOutcomeSummaryInput = z.infer<typeof generateOutcomeSummarySchema>;
export type EditOutcomeSummaryInput = z.infer<typeof editOutcomeSummarySchema>;
export type OutcomePhase = (typeof OUTCOME_PHASES)[number];
