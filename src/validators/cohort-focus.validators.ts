import { z } from 'zod';
const personSchema = z.object({ userId: z.number().int(), nickname: z.string().nullable(), avatar: z.string().nullable() });
export const cohortFocusResponseSchema = z.object({
  needsEncouragement: z.array(personSchema.extend({ lastCheckinAt: z.date(), lastCheckinPreview: z.string().nullable(), interruptedDays: z.number().int().nonnegative() })),
  celebrations: z.array(personSchema.extend({ moment: z.enum(['first_checkin', 'return_after_break', 'month_milestone']), occurredAt: z.date() }))
});

