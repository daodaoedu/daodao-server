import { z } from 'zod';
export const cohortFeedQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).optional().default(30), offset: z.coerce.number().int().nonnegative().optional().default(0) });
export const cohortFeedResponseSchema = z.object({
  perspective: z.enum(['coach', 'learner']),
  items: z.array(z.object({ id: z.number().int(), practiceId: z.number().int(), userId: z.number().int(), nickname: z.string().nullable(), avatar: z.string().nullable(), checkinDate: z.date(), mood: z.string().nullable(), note: z.string().nullable(), imageUrls: z.array(z.string()), createdAt: z.date() })),
  total: z.number().int().nonnegative(),
  pendingResponseCount: z.number().int().nonnegative()
});
