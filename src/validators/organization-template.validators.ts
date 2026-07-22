import { z } from 'zod';
export const organizationTemplateParamsSchema = z.object({ organizationId: z.coerce.number().int().positive(), templateId: z.coerce.number().int().positive() });
export const organizationTemplateBindingParamsSchema = organizationTemplateParamsSchema.extend({ cohortId: z.coerce.number().int().positive() });
export const createOrganizationTemplateSchema = z.object({
  title: z.string().trim().min(1).max(100), practiceAction: z.string().trim().max(2000).nullable().optional(),
  durationDays: z.number().int().positive().nullable().optional(), frequencyMinDays: z.number().int().positive().nullable().optional(),
  frequencyMaxDays: z.number().int().positive().nullable().optional(), sessionDurationMinutes: z.number().int().positive().nullable().optional(),
  practiceTimePeriods: z.array(z.string().trim().min(1)).max(20).optional().default([])
}).refine(v => !v.frequencyMinDays || !v.frequencyMaxDays || v.frequencyMinDays <= v.frequencyMaxDays, { message: '最小頻率不可大於最大頻率' });
export const updateOrganizationTemplateSchema = createOrganizationTemplateSchema.partial().refine(v => Object.keys(v).length > 0, { message: '至少提供一個欄位' });
export const organizationTemplateResponseSchema = z.object({
  id: z.number().int(), externalId: z.string().uuid(), organizationId: z.number().int(), title: z.string(), practiceAction: z.string().nullable(),
  durationDays: z.number().int().nullable(), frequencyMinDays: z.number().int().nullable(), frequencyMaxDays: z.number().int().nullable(),
  sessionDurationMinutes: z.number().int().nullable(), practiceTimePeriods: z.array(z.string()), boundCohortIds: z.array(z.number().int()),
  generatedDraftCount: z.number().int().nonnegative(),
  createdAt: z.date().nullable(), updatedAt: z.date().nullable()
});
export const organizationTemplateListResponseSchema = z.array(organizationTemplateResponseSchema);
export const templateBindingResponseSchema = z.object({ templateId: z.number().int(), cohortId: z.number().int(), bound: z.boolean() });
export type CreateOrganizationTemplateInput = z.infer<typeof createOrganizationTemplateSchema>;
export type UpdateOrganizationTemplateInput = z.infer<typeof updateOrganizationTemplateSchema>;
