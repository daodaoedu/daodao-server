import { z } from 'zod';
export const inviteMembersSchema = z.object({
  emails: z.array(z.string()).max(500).optional(),
  csv: z.string().max(200000).optional(),
  preview: z.boolean().optional().default(false)
}).refine(value => Boolean(value.emails?.length || value.csv?.trim()), { message: '必須提供 emails 或 csv' });
export const inviteMembersResponseSchema = z.object({
  total: z.number().int(), validCount: z.number().int(), errorCount: z.number().int(), queuedCount: z.number().int(),
  items: z.array(z.object({ email: z.string(), valid: z.boolean(), reason: z.string().nullable(), enrollmentId: z.number().int().nullable() }))
});
export const invitationParamsSchema = z.object({
  programId: z.coerce.number().int().positive(), cohortId: z.coerce.number().int().positive(), enrollmentId: z.coerce.number().int().positive()
});
export const resendInvitationResponseSchema = z.object({ enrollmentId: z.number().int(), queued: z.boolean() });
export type InviteMembersInput = z.infer<typeof inviteMembersSchema>;
