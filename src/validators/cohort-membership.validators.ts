import { z } from 'zod';
export const cohortMembershipParamsSchema = z.object({ cohortId: z.coerce.number().int().positive() });
export const exitCohortResponseSchema = z.object({ enrollmentId: z.number().int(), status: z.literal('exited'), detachedPracticeCount: z.number().int().nonnegative() });
export const removeCohortMemberParamsSchema = z.object({ programId: z.coerce.number().int().positive(), cohortId: z.coerce.number().int().positive(), enrollmentId: z.coerce.number().int().positive() });
export const cohortLearnerResponseSchema = z.object({ id: z.number().int(), nickname: z.string().nullable(), avatar: z.string().nullable(), joinedAt: z.date() });
export const cohortLearnerListResponseSchema = z.array(cohortLearnerResponseSchema);
export const cohortEnrollmentRosterItemSchema = z.object({
  id: z.number().int(),
  email: z.string().email().nullable(),
  userId: z.number().int().nullable(),
  nickname: z.string().nullable(),
  role: z.enum(['owner', 'assistant', 'member']),
  status: z.enum(['invited', 'joined', 'exited', 'removed']),
  invitedAt: z.date(),
  joinedAt: z.date().nullable(),
  exitedAt: z.date().nullable()
  , exportOptIn: z.boolean()
});
export const cohortEnrollmentRosterResponseSchema = z.array(cohortEnrollmentRosterItemSchema);
