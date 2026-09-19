import { z } from 'zod';

export const organizationIdParamsSchema = z.object({
  organizationId: z.coerce.number().int().positive().openapi({ example: 1 })
});

export const organizationMemberParamsSchema = organizationIdParamsSchema.extend({
  userId: z.coerce.number().int().positive().openapi({ example: 42 })
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(100).openapi({ example: '島島學習社群' }),
  bio: z.string().trim().max(2000).nullable().optional().openapi({ example: '陪伴學習者持續行動' }),
  externalLink: z.string().url().nullable().optional().openapi({ example: 'https://example.com' }),
  ownerUserId: z.number().int().positive().openapi({ example: 42 })
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional().openapi({ example: '島島學習社群' }),
  bio: z.string().trim().max(2000).nullable().optional().openapi({ example: '陪伴學習者持續行動' }),
  externalLink: z.string().url().nullable().optional().openapi({ example: 'https://example.com' })
}).refine(value => Object.keys(value).length > 0, {
  message: '至少需要提供一個可更新欄位'
});

export const adminUpdateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  externalLink: z.string().url().nullable().optional(),
  status: z.enum(['active', 'suspended']).optional()
}).refine(value => Object.keys(value).length > 0, { message: '至少需要提供一個可更新欄位' });

export const addOrganizationMemberSchema = z.object({
  userId: z.number().int().positive().openapi({ example: 42 }),
  role: z.literal('owner').optional().default('owner').openapi({ example: 'owner' })
});

export const organizationResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  bio: z.string().nullable(),
  externalLink: z.string().nullable(),
  status: z.enum(['active', 'suspended']),
  approvedBy: z.number().int().nullable(),
  approvedAt: z.date().nullable(),
  timezone: z.string().openapi({ description: 'IANA 時區；動態頁最近 7 天與已開始場次判定的基準，預設 Asia/Taipei' }),
  createdAt: z.date(),
  updatedAt: z.date().nullable().openapi({ description: '組織資訊最後更新時間' })
});

export const organizationListResponseSchema = z.array(organizationResponseSchema);

export const organizationMemberResponseSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  nickname: z.string().nullable(),
  role: z.literal('owner'),
  createdAt: z.date()
});

export const organizationMemberListResponseSchema = z.array(organizationMemberResponseSchema);

// 只有 requireAdmin 的後台端點才回 email；組織自己的成員清單維持不含 email
export const adminOrganizationMemberResponseSchema = organizationMemberResponseSchema.extend({
  email: z.string().nullable()
});

export const adminOrganizationMemberListResponseSchema = z.array(adminOrganizationMemberResponseSchema);

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type AdminUpdateOrganizationInput = z.infer<typeof adminUpdateOrganizationSchema>;
export type AddOrganizationMemberInput = z.infer<typeof addOrganizationMemberSchema>;
export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;
export type OrganizationMemberResponse = z.infer<typeof organizationMemberResponseSchema>;
export type AdminOrganizationMemberResponse = z.infer<typeof adminOrganizationMemberResponseSchema>;
