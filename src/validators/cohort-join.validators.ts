import { z } from 'zod';

export const joinTokenParamsSchema = z.object({ joinToken: z.string().uuid() });
export const joinCohortSchema = z.object({ consent: z.literal(true).openapi({ description: '同意打卡內容對教練與同期學員可見' }) });
export const cohortJoinInfoResponseSchema = z.object({
  cohortId: z.number().int(), displayName: z.string(), startDate: z.date(), endDate: z.date(),
  inviteMessage: z.string().nullable(), canJoin: z.boolean(), unavailableReason: z.enum(['not_published', 'expired', 'full']).nullable(),
  visibilityNotice: z.string(), organization: z.object({ name: z.string(), bio: z.string().nullable(), externalLink: z.string().nullable() })
});
export const cohortJoinResultResponseSchema = z.object({ enrollmentId: z.number().int(), cohortId: z.number().int(), status: z.literal('joined') });
export const myCohortsResponseSchema = z.array(z.object({
  cohortId: z.number().int(), displayName: z.string(), startDate: z.date(), endDate: z.date(),
  status: z.string(), joinedAt: z.date().nullable(), programName: z.string(), organizationName: z.string(),
}));
export const cohortMemberHomeResponseSchema = z.object({
  cohortId: z.number().int(), displayName: z.string(), startDate: z.date(), endDate: z.date(), exportOptIn: z.boolean(),
  organization: z.object({ name: z.string(), bio: z.string().nullable(), externalLink: z.string().nullable() }),
  practices: z.array(z.object({
    id: z.string().uuid(), title: z.string(), practiceAction: z.string().nullable(),
    status: z.enum(['draft', 'not_started', 'active', 'completed', 'archived']), creationSource: z.string().nullable()
  }))
});
