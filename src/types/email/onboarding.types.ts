import { z } from 'zod';
import { UserSource } from '../onboarding.types';

export const onboardingEmailTypeSchema = z.enum(['L0', 'A', 'B', 'C', 'D', 'E']);

export type OnboardingEmailType = z.infer<typeof onboardingEmailTypeSchema>;

export const onboardingEmailJobDataSchema = z.object({
  userId: z.number().int().positive(),
  emailType: onboardingEmailTypeSchema,
  userSource: z.enum([UserSource.S1, UserSource.S2, UserSource.S3]),
});

export type OnboardingEmailJobData = z.infer<typeof onboardingEmailJobDataSchema>;
