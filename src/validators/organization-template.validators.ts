import { z } from 'zod';
import { practiceResourceInputSchema, practiceTimePeriodSchema } from './practice.validators';

// 以下三個列舉必須與 practice_templates 的 CHECK 約束一致，否則會在寫入時炸成 500
export const TEMPLATE_DURATION_DAYS = [7, 14, 21, 30] as const;
export const TEMPLATE_SESSION_MINUTES = [15, 30, 45, 60] as const;
const durationDaysSchema = z.union([z.literal(7), z.literal(14), z.literal(21), z.literal(30)], { message: '持續天數只能是 7 / 14 / 21 / 30 天' });
const sessionMinutesSchema = z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)], { message: '每次時長只能是 15 / 30 / 45 / 60 分鐘' });

export const organizationTemplateParamsSchema = z.object({ organizationId: z.coerce.number().int().positive(), templateId: z.coerce.number().int().positive() });
export const organizationTemplateBindingParamsSchema = organizationTemplateParamsSchema.extend({ cohortId: z.coerce.number().int().positive() });
export const createOrganizationTemplateSchema = z.object({
  title: z.string().trim().min(1).max(100), practiceAction: z.string().trim().max(2000).nullable().optional(),
  durationDays: durationDaysSchema.nullable().optional(), frequencyMinDays: z.number().int().min(1).max(7).nullable().optional(),
  frequencyMaxDays: z.number().int().min(1).max(7).nullable().optional(), sessionDurationMinutes: sessionMinutesSchema.nullable().optional(),
  practiceTimePeriods: z.array(practiceTimePeriodSchema).max(5).optional().default([]),
  resources: z.array(practiceResourceInputSchema).max(5, '資源最多 5 個').optional()
}).refine(v => !v.frequencyMinDays || !v.frequencyMaxDays || v.frequencyMinDays <= v.frequencyMaxDays, { message: '最小頻率不可大於最大頻率' });
export const updateOrganizationTemplateSchema = createOrganizationTemplateSchema.partial().refine(v => Object.keys(v).length > 0, { message: '至少提供一個欄位' });
export const organizationTemplateResponseSchema = z.object({
  id: z.number().int(), externalId: z.string().uuid(), organizationId: z.number().int(), title: z.string(), practiceAction: z.string().nullable(),
  durationDays: z.number().int().nullable(), frequencyMinDays: z.number().int().nullable(), frequencyMaxDays: z.number().int().nullable(),
  sessionDurationMinutes: z.number().int().nullable(), practiceTimePeriods: z.array(z.string()), boundCohortIds: z.array(z.number().int()),
  resources: z.array(z.object({ id: z.string(), name: z.string(), url: z.string().nullable() })),
  generatedDraftCount: z.number().int().nonnegative(),
  createdAt: z.date().nullable(), updatedAt: z.date().nullable()
});
export const organizationTemplateListResponseSchema = z.array(organizationTemplateResponseSchema);
export const templateBindingResponseSchema = z.object({ templateId: z.number().int(), cohortId: z.number().int(), bound: z.boolean() });
export type CreateOrganizationTemplateInput = z.infer<typeof createOrganizationTemplateSchema>;
export type UpdateOrganizationTemplateInput = z.infer<typeof updateOrganizationTemplateSchema>;
