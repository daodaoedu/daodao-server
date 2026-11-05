import { z } from 'zod';
import { organizationIdParamsSchema } from './organization.validators';

export const organizationInvitationEmailSchema = z.string().trim().toLowerCase().email().max(255).openapi({ example: 'owner@example.com' });
export const createOrganizationInvitationSchema = z.object({ email: organizationInvitationEmailSchema });
export const organizationInvitationParamsSchema = organizationIdParamsSchema.extend({ invitationId: z.coerce.number().int().positive() });
export const organizationInvitationRequestParamsSchema = organizationInvitationParamsSchema.extend({ requestId: z.coerce.number().int().positive() });
export const acceptOrganizationInvitationSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/).openapi({ description: '郵件中的一次性邀請 token' }) });
export const organizationInvitationResponseSchema = z.object({
  id: z.number().int(), organizationId: z.number().int(), email: z.string(),
  status: z.enum(['pending', 'accepted', 'expired', 'revoked']),
  expiresAt: z.string().datetime(), createdAt: z.string().datetime(),
  deliveryStatus: z.enum(['pending', 'sent', 'failed']),
  requests: z.array(z.object({ id: z.number().int(), userId: z.number().int(), email: z.string().nullable(), nickname: z.string().nullable(), createdAt: z.string().datetime() }))
});
export const acceptOrganizationInvitationResponseSchema = z.object({
  status: z.enum(['accepted', 'needs_confirmation', 'expired', 'revoked', 'used', 'invalid']),
  organizationId: z.number().int().optional(), organizationName: z.string().optional()
});
export type OrganizationInvitationResponse = z.infer<typeof organizationInvitationResponseSchema>;
export type AcceptOrganizationInvitationResponse = z.infer<typeof acceptOrganizationInvitationResponseSchema>;
