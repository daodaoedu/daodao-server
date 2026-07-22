import { z } from 'zod';
export const exportConsentSchema = z.object({ consent: z.boolean() });
export const exportConsentResponseSchema = z.object({ cohortId: z.number().int(), consent: z.boolean(), optedInAt: z.date().nullable() });
export const cohortExportResponseSchema = z.object({
  cohortId: z.number().int(), exportedAt: z.date(),
  learners: z.array(z.object({ nickname: z.string().nullable(), practices: z.array(z.object({ title: z.string(), checkinSummary: z.array(z.string()), reflectionExcerpt: z.string().nullable() })) }))
});

