import { z } from 'zod';

export const cohortCheckinParamsSchema = z.object({
  programId: z.coerce.number().int().positive(),
  cohortId: z.coerce.number().int().positive(),
  checkinId: z.coerce.number().int().positive()
});

export const submitCohortEncouragementSchema = z.object({
  content: z.string().trim().min(1).max(5000)
});

export const cohortEncouragementDraftResponseSchema = z.object({
  checkinId: z.number().int().positive(),
  draft: z.string().min(1)
});

export const cohortEncouragementResponseSchema = z.object({
  commentId: z.number().int().positive(),
  checkinId: z.number().int().positive(),
  content: z.string(),
  userId: z.number().int().positive()
});
