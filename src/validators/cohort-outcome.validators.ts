import { z } from 'zod';
export const cohortOutcomeResponseSchema = z.object({
  cohortId: z.number().int(), completedCount: z.number().int().nonnegative(), enrolledCount: z.number().int().nonnegative(),
  sustainedParticipationCount: z.number().int().nonnegative(), sustainedParticipationRate: z.number().min(0).max(1), computedAt: z.date()
});

