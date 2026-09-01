import { z } from 'zod';
import {
  DURATION_DAYS_MAX, DURATION_DAYS_MIN, SESSION_MINUTES_MAX, SESSION_MINUTES_MIN,
  practiceResourceInputSchema, practiceTimePeriodSchema
} from './practice.validators';

// 數值範圍必須與 practice_templates 的 CHECK 約束一致（daodao-storage migration 083：1–90 天／1–999 分鐘），否則會在寫入時炸成 500
const durationDaysSchema = z.number().int().min(DURATION_DAYS_MIN, `持續天數最少 ${DURATION_DAYS_MIN} 天`).max(DURATION_DAYS_MAX, `持續天數最多 ${DURATION_DAYS_MAX} 天`);
const sessionMinutesSchema = z.number().int().min(SESSION_MINUTES_MIN, `每次時長最少 ${SESSION_MINUTES_MIN} 分鐘`).max(SESSION_MINUTES_MAX, `每次時長最多 ${SESSION_MINUTES_MAX} 分鐘`);

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
  bindings: z.array(z.object({ cohortId: z.number().int(), startDate: z.date().nullable() })),
  resources: z.array(z.object({ id: z.string(), name: z.string(), url: z.string().nullable(), dayNumber: z.number().int().nullable() })),
  generatedDraftCount: z.number().int().nonnegative(),
  createdAt: z.date().nullable(), updatedAt: z.date().nullable()
});
export const organizationTemplateListResponseSchema = z.array(organizationTemplateResponseSchema);
// 綁定時可指定草稿開始日；不給就由 API 回退為該期的 start_date
export const bindOrganizationTemplateSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').nullable().optional()
});
export const templateBindingResponseSchema = z.object({ templateId: z.number().int(), cohortId: z.number().int(), bound: z.boolean(), startDate: z.date().nullable() });
export type CreateOrganizationTemplateInput = z.infer<typeof createOrganizationTemplateSchema>;
export type UpdateOrganizationTemplateInput = z.infer<typeof updateOrganizationTemplateSchema>;
export type BindOrganizationTemplateInput = z.infer<typeof bindOrganizationTemplateSchema>;
