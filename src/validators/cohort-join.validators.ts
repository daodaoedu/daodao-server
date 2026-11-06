import { cohortTimezoneSchema, cohortSessionSchema } from './cohort.validators';
import { z } from 'zod';
import { COHORT_INTERACTION_MODES, COHORT_FEE_TYPES, COHORT_SIGNUP_METHODS } from '../constants/cohort-setup';

const interactionModeSchema = z.enum(COHORT_INTERACTION_MODES);
const feeTypeSchema = z.enum(COHORT_FEE_TYPES);
const signupMethodSchema = z.enum(COHORT_SIGNUP_METHODS);

/** 聚會時段（回應用） */
const sessionSchema = cohortSessionSchema;

/** 隱私資訊 */
const privacySchema = z.object({
  isPrivate: z.boolean().openapi({ description: '私密活動' }),
  checkinDefaultPrivate: z.boolean().openapi({ description: '參與者打卡預設私密' }),
  hostCommentDefaultPrivate: z.boolean().openapi({ description: '發起人留言預設私密' })
}).openapi({ title: 'CohortPrivacy', description: '隱私設定' });

export const joinTokenParamsSchema = z.object({ joinToken: z.string().uuid() });
export const joinCohortSchema = z.object({ consent: z.literal(true).openapi({ description: '同意打卡內容對教練與同期學員可見' }) });
export const cohortJoinInfoResponseSchema = z.object({
  cohortId: z.number().int(), displayName: z.string(), startDate: z.date(), endDate: z.date(),
  tagline: z.string().nullable().openapi({ description: '一句話簡介' }),
  timezone: cohortTimezoneSchema,
  interactionModes: z.array(interactionModeSchema).openapi({ description: '互動方式' }),
  location: z.string().nullable().openapi({ description: '活動地點' }),
  sessions: z.array(sessionSchema).openapi({ description: '聚會時段' }),
  feeType: feeTypeSchema,
  feeAmount: z.number().int().nullable().openapi({ description: '費用金額' }),
  signupMethod: signupMethodSchema,
  externalSignupUrl: z.string().nullable().openapi({ description: '外部報名連結' }),
  capacity: z.number().int().nullable().openapi({ description: '人數上限' }),
  joinDeadline: z.date().nullable().openapi({ description: '加入截止日' }),
  participantCount: z.number().int().nonnegative().openapi({ description: '已加入人數' }),
  inviteMessage: z.string().nullable(), canJoin: z.boolean(), unavailableReason: z.enum(['not_published', 'expired', 'full', 'paused']).nullable(),
  unavailableReasons: z.array(z.enum(['not_published', 'expired', 'full', 'paused'])).openapi({ description: '所有成立的不可加入原因（依優先序，第一個等於 unavailableReason）；可加入時為空陣列' }),
  privacy: privacySchema,
  visibilityNotice: z.string(), organization: z.object({ name: z.string(), bio: z.string().nullable(), externalLink: z.string().nullable() })
});
export const cohortJoinResultResponseSchema = z.object({ enrollmentId: z.number().int(), cohortId: z.number().int(), status: z.literal('joined') });
export const myCohortsResponseSchema = z.array(z.object({
  cohortId: z.number().int(), displayName: z.string(), startDate: z.date(), endDate: z.date(),
  timezone: cohortTimezoneSchema,
  status: z.string(), joinedAt: z.date().nullable(), programName: z.string(), organizationName: z.string(),
}));
export const cohortMemberHomeResponseSchema = z.object({
  cohortId: z.number().int(), displayName: z.string(), startDate: z.date(), endDate: z.date(),
  tagline: z.string().nullable().openapi({ description: '一句話簡介' }),
  timezone: cohortTimezoneSchema,
  interactionModes: z.array(interactionModeSchema).openapi({ description: '互動方式' }),
  meetingUrl: z.string().nullable().openapi({ description: '會議連結（僅已加入成員可見）' }),
  location: z.string().nullable().openapi({ description: '活動地點' }),
  sessions: z.array(sessionSchema).openapi({ description: '聚會時段' }),
  feeType: feeTypeSchema,
  privacy: privacySchema,
  exportOptIn: z.boolean(),
  organization: z.object({ name: z.string(), bio: z.string().nullable(), externalLink: z.string().nullable() }),
  practices: z.array(z.object({
    id: z.string().uuid(), title: z.string(), practiceAction: z.string().nullable(),
    status: z.enum(['draft', 'not_started', 'active', 'completed', 'archived']), creationSource: z.string().nullable(),
    // 以下欄位讓前端能沿用「我的」那張實踐卡，不必自己刻一套簡化版
    startDate: z.date().nullable(), endDate: z.date().nullable(),
    progressPercentage: z.number(), checkInCount: z.number().int().nonnegative(),
    lastCheckinAt: z.date().nullable(), themeColor: z.string().nullable()
  }))
});

/** HTTP JSON schemas. Service/controller schemas above intentionally accept Date before serialization. */
const wireDateSchema = z.string().datetime();
const wirePrivacySchema = privacySchema.strict().openapi({ title: 'CohortPrivacy', description: '隱私設定' });
const wireOrganizationSchema = cohortJoinInfoResponseSchema.shape.organization.strict();
const wireSessionSchema = sessionSchema.strict();
export const cohortJoinInfoWireResponseSchema = cohortJoinInfoResponseSchema.extend({
  startDate: wireDateSchema,
  endDate: wireDateSchema,
  joinDeadline: wireDateSchema.nullable().openapi({ description: '加入截止日' }),
  privacy: wirePrivacySchema,
  organization: wireOrganizationSchema,
  sessions: z.array(wireSessionSchema).openapi({ description: '聚會時段' })
}).strict();
export const cohortMemberHomeWireResponseSchema = cohortMemberHomeResponseSchema.extend({
  startDate: wireDateSchema,
  endDate: wireDateSchema,
  privacy: wirePrivacySchema,
  organization: wireOrganizationSchema,
  sessions: z.array(wireSessionSchema).openapi({ description: '聚會時段' }),
  practices: z.array(cohortMemberHomeResponseSchema.shape.practices.element.extend({
    startDate: wireDateSchema.nullable(),
    endDate: wireDateSchema.nullable(),
    lastCheckinAt: wireDateSchema.nullable()
  }).strict())
}).strict();
