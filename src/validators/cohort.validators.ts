import '../config/openapi-registry';
import { z } from 'zod';
import { COHORT_VISIBILITIES } from '../constants/cohort-visibility';
import { COHORT_INTERACTION_MODES, COHORT_FEE_TYPES, COHORT_SIGNUP_METHODS } from '../constants/cohort-setup';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, '日期不存在');
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, '時間格式必須為 HH:MM').nullable();
/** IANA timezone used to interpret the cohort's unchanged local date/time values. */
export const cohortTimezoneSchema = z.string().min(1).max(64).refine(value => {
  if (/^[+-]/.test(value)) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, '請選擇有效的 IANA 時區').openapi({ description: '場次共用 IANA 時區', example: 'Asia/Taipei' });
export const cohortRecurrenceRuleSchema = z.object({
  startDate: dateSchema.openapi({ description: '規律範圍起始日期', example: '2026-11-10' }),
  weeks: z.number().int().min(1).max(52).openapi({ description: '持續週數（1–52）', example: 4 }),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7).refine(values => new Set(values).size === values.length, '星期不可重複').openapi({ description: 'ISO 星期：週一1至週日7', example: [2, 4] })
}).strict().openapi({ title: 'CohortRecurrenceRule', description: '規律聚會的原始規則；逐場修改仍保留此群組規則' });
const cohortStatusSchema = z.enum(['draft', 'published', 'archived']);
const interactionModeSchema = z.enum(COHORT_INTERACTION_MODES).openapi({ description: '互動方式：sync（線上同步）、async（非同步）、physical（實體）' });
const feeTypeSchema = z.enum(COHORT_FEE_TYPES).openapi({ description: '收費類型：free（免費）、paid（付費）', example: 'free' });
const signupMethodSchema = z.enum(COHORT_SIGNUP_METHODS).openapi({ description: '報名方式：island_form（島島表單）、external（外部連結）', example: 'island_form' });

export const cohortProgramParamsSchema = z.object({
  programId: z.coerce.number().int().positive().openapi({ example: 1 })
});
export const cohortParamsSchema = cohortProgramParamsSchema.extend({
  cohortId: z.coerce.number().int().positive().openapi({ example: 1 })
});
export const cohortVisibilitySchema = z.enum(COHORT_VISIBILITIES).openapi({ description: '探索活動頁可見性：private（僅邀請連結）、public（列於探索活動頁，任何人可取得加入連結）', example: 'private' });

/** 場次聚會時段輸入（建立／更新用） */
export const cohortSessionInputSchema = z.object({
  sessionDate: dateSchema.openapi({ description: '聚會日期', example: '2026-10-01' }),
  startTime: timeSchema.openapi({ description: '開始時間（HH:MM），可為 null', example: '14:00' }),
  endTime: timeSchema.openapi({ description: '結束時間（HH:MM），可為 null', example: '16:00' }),
  recurrenceGroupId: z.string().uuid().nullable().optional().openapi({ description: '穩定規律群組 ID；非規律時段為 null' }),
  recurrenceRule: cohortRecurrenceRuleSchema.nullable().optional().openapi({ description: '群組原始規則；非規律時段為 null' })
}).openapi({ title: 'CohortSessionInput', description: '場次聚會時段（輸入）' });

/** Validate explicit group identity without inferring recurrence from occurrence dates. */
const cohortSessionsInputSchema = z.array(cohortSessionInputSchema).max(50).superRefine((sessions, context) => {
  const groupRules = new Map<string, string>();
  sessions.forEach((session, index) => {
    const groupId = session.recurrenceGroupId;
    const rule = session.recurrenceRule;
    if (Boolean(groupId) !== Boolean(rule)) {
      context.addIssue({ code: 'custom', path: [index, 'recurrenceRule'], message: '規律群組與規則必須同時提供或同時為空' });
      return;
    }
    if (!groupId || !rule) return;
    const canonical = JSON.stringify({ ...rule, weekdays: [...rule.weekdays].sort((a, b) => a - b) });
    if (groupRules.has(groupId) && groupRules.get(groupId) !== canonical) {
      context.addIssue({ code: 'custom', path: [index, 'recurrenceRule'], message: '同一規律群組的規則必須一致' });
    }
    groupRules.set(groupId, canonical);
  });
});

/** 場次聚會時段回應（含 id） */
export const cohortSessionSchema = cohortSessionInputSchema.extend({
  id: z.number().int().openapi({ description: '聚會時段 ID', example: 1 })
}).openapi({ title: 'CohortSession', description: '場次聚會時段' });

export const createCohortSchema = z.object({
  slug: z.string().trim().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).openapi({ example: '2026-summer' }),
  displayName: z.string().trim().min(1).max(100).openapi({ example: '2026 夏季期' }),
  tagline: z.string().trim().min(1).max(80).optional().openapi({ description: '一句話簡介（≤80 字）', example: '一起學習、一起成長' }),
  startDate: dateSchema,
  endDate: dateSchema,
  joinDeadline: dateSchema.nullable().optional().openapi({ description: '加入截止日；null 表示可加入至結束日' }),
  capacity: z.number().int().positive().nullable().optional().openapi({ description: '人數上限；null 表示不限' }),
  inviteMessage: z.string().trim().max(2000).nullable().optional(),
  showInviteMessageOnSignup: z.boolean().optional().default(false).openapi({ description: '在報名頁面顯示邀請訊息' }),
  timezone: cohortTimezoneSchema.optional(),
  interactionModes: z.array(interactionModeSchema).min(1).max(3).optional().openapi({ description: '互動方式（至少選一）', example: ['sync'] }),
  meetingUrl: z.string().url().nullable().optional().openapi({ description: '會議連結' }),
  location: z.string().trim().min(1).max(200).nullable().optional().openapi({ description: '活動地點' }),
  sessions: cohortSessionsInputSchema.optional().openapi({ description: '聚會時段（上限 50 筆）' }),
  feeType: feeTypeSchema.optional().default('free'),
  feeAmount: z.number().int().positive().nullable().optional().openapi({ description: '費用金額（NT$）；free 時清為 null' }),
  signupMethod: signupMethodSchema.optional().default('island_form'),
  externalSignupUrl: z.string().url().nullable().optional().openapi({ description: '外部報名連結' }),
  isPrivate: z.boolean().optional().default(true).openapi({ description: '私密活動' }),
  checkinDefaultPrivate: z.boolean().optional().default(false).openapi({ description: '參與者打卡預設私密' }),
  hostCommentDefaultPrivate: z.boolean().optional().default(false).openapi({ description: '發起人留言預設私密' }),
  visibility: cohortVisibilitySchema.optional().default('private'),
  status: cohortStatusSchema.optional().default('draft')
}).refine(value => value.startDate <= value.endDate, { message: '開始日期不可晚於結束日期', path: ['endDate'] })
  .refine(value => {
    // D3：paid → feeAmount 必填
    if (value.feeType === 'paid' && (value.feeAmount === null || value.feeAmount === undefined)) return false;
    return true;
  }, { message: '付費活動必須填寫費用金額', path: ['feeAmount'] })
  .refine(value => {
    // D3：paid → signupMethod 必須是 external
    if (value.feeType === 'paid' && value.signupMethod !== 'external') return false;
    return true;
  }, { message: '付費活動的報名方式必須為外部連結', path: ['signupMethod'] })
  .refine(value => {
    // D3：signupMethod=external → externalSignupUrl 必填
    if (value.signupMethod === 'external' && !value.externalSignupUrl) return false;
    return true;
  }, { message: '外部報名必須填寫外部報名連結', path: ['externalSignupUrl'] });

export const updateCohortSchema = z.object({
  slug: z.string().trim().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  displayName: z.string().trim().min(1).max(100).optional(),
  tagline: z.string().trim().min(1).max(80).nullable().optional().openapi({ description: '一句話簡介' }),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  joinDeadline: dateSchema.nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  inviteMessage: z.string().trim().max(2000).nullable().optional(),
  showInviteMessageOnSignup: z.boolean().optional(),
  timezone: cohortTimezoneSchema.optional(),
  interactionModes: z.array(interactionModeSchema).min(1).max(3).optional(),
  meetingUrl: z.string().url().nullable().optional(),
  location: z.string().trim().min(1).max(200).nullable().optional(),
  sessions: cohortSessionsInputSchema.optional(),
  feeType: feeTypeSchema.optional(),
  feeAmount: z.number().int().positive().nullable().optional(),
  signupMethod: signupMethodSchema.optional(),
  externalSignupUrl: z.string().url().nullable().optional(),
  isPrivate: z.boolean().optional(),
  checkinDefaultPrivate: z.boolean().optional(),
  hostCommentDefaultPrivate: z.boolean().optional(),
  visibility: cohortVisibilitySchema.optional(),
  status: cohortStatusSchema.optional()
}).refine(value => Object.keys(value).length > 0, { message: '至少需要提供一個可更新欄位' });
// Note: update 的 D3/D4/D5 正規化在 service 層的 normalizeCohortSetup 以合併結果驗證

export const cohortResponseSchema = z.object({
  organizationId: z.number().int().positive().openapi({ description: '場次所屬組織 ID，依系列實際歸屬回傳', example: 2 }),
  organizationName: z.string().openapi({ description: '場次所屬組織名稱', example: '島島學習社群' }),
  id: z.number().int(), programId: z.number().int(), slug: z.string(), displayName: z.string(),
  tagline: z.string().nullable().openapi({ description: '一句話簡介' }),
  startDate: z.date(), endDate: z.date(), joinToken: z.string().uuid().nullable(),
  joinPaused: z.boolean().openapi({ description: '是否暫停透過邀請連結加入（token 保留，重新開放沿用原連結）' }),
  joinDeadline: z.date().nullable(), capacity: z.number().int().nullable(),
  inviteMessage: z.string().nullable(),
  showInviteMessageOnSignup: z.boolean(),
  timezone: cohortTimezoneSchema,
  interactionModes: z.array(interactionModeSchema).openapi({ description: '互動方式' }),
  meetingUrl: z.string().nullable().openapi({ description: '會議連結' }),
  location: z.string().nullable().openapi({ description: '活動地點' }),
  sessions: z.array(cohortSessionSchema).openapi({ description: '聚會時段' }),
  feeType: feeTypeSchema,
  feeAmount: z.number().int().nullable().openapi({ description: '費用金額' }),
  signupMethod: signupMethodSchema,
  externalSignupUrl: z.string().nullable().openapi({ description: '外部報名連結' }),
  isPrivate: z.boolean().openapi({ description: '私密活動' }),
  checkinDefaultPrivate: z.boolean().openapi({ description: '參與者打卡預設私密' }),
  hostCommentDefaultPrivate: z.boolean().openapi({ description: '發起人留言預設私密' }),
  hasHomePage: z.boolean().openapi({ description: '是否已建立活動主頁' }),
  signupQuestionCount: z.number().int().nonnegative().openapi({ description: '報名問題數量' }),
  status: cohortStatusSchema, visibility: cohortVisibilitySchema,
  archivedAt: z.date().nullable().optional().openapi({ description: '封存時間；status = archived 時有值' }),
  createdAt: z.date(), updatedAt: z.date().nullable()
});

/** PATCH 回應：切換 isPrivate 時附 affectedPracticeCount */
export const cohortUpdateResultSchema = cohortResponseSchema.extend({
  affectedPracticeCount: z.number().int().nonnegative().optional().openapi({ description: '切換隱私時影響的實踐數量' })
});

export const cohortListResponseSchema = z.array(cohortResponseSchema);
export const organizationCohortResponseSchema = cohortResponseSchema.extend({
  programName: z.string().openapi({ description: '所屬系列名稱' }),
  joinedCount: z.number().int().nonnegative().openapi({ description: '已加入的參與者人數（不含帶領人）' }),
  encourageCount: z.number().int().nonnegative().openapi({ description: '需要鼓勵的參與者×實踐數（>3天未打卡）' }),
  celebrateCount: z.number().int().nonnegative().openapi({ description: '值得慶祝的時刻數' }),
});
export const organizationCohortListResponseSchema = z.array(organizationCohortResponseSchema);
export const cohortJoinTokenResponseSchema = z.object({ cohortId: z.number().int(), joinToken: z.string().uuid().nullable(), joinPaused: z.boolean() });

/** 系列封存結果（級聯封存場次） */
export const programArchiveResultSchema = z.object({
  programId: z.number().int().openapi({ description: '系列 ID' }),
  archivedCohortCount: z.number().int().nonnegative().openapi({ description: '本次級聯封存的場次數量' })
});

export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortInput = z.infer<typeof updateCohortSchema>;
export type CohortResponse = z.infer<typeof cohortResponseSchema>;
export type CohortUpdateResult = z.infer<typeof cohortUpdateResultSchema>;
export type OrganizationCohortResponse = z.infer<typeof organizationCohortResponseSchema>;
export type CohortSessionInput = z.infer<typeof cohortSessionInputSchema>;
