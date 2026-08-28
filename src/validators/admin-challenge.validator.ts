/**
 * 共同挑戰管理（admin）驗證 schema
 *
 * openspec: challenge-authoring — admin 後台以 lighthouse 模式管理挑戰：
 * 主題（programs.kind='challenge'）→ 期（cohorts）→ 模板與開始日（cohort_templates）→ 發佈。
 */

import { z } from 'zod';
import { practiceResourceInputSchema, practiceTimePeriodSchema } from './practice.validators';
import { challengeRunStatusSchema } from './challenge.validator';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD');
const cohortEditStatusSchema = z.enum(['draft', 'published', 'archived']);

// ── params / query ──────────────────────────────────────────────

export const adminProgramParamsSchema = z.object({
  programId: z.coerce.number().int().positive().openapi({ description: '挑戰主題（program）ID' })
});
export const adminCohortParamsSchema = adminProgramParamsSchema.extend({
  cohortId: z.coerce.number().int().positive().openapi({ description: '挑戰（cohort）ID' })
});
export const adminTemplateParamsSchema = z.object({
  templateId: z.coerce.number().int().positive().openapi({ description: '模板 ID' })
});
export const adminProgramListQuerySchema = z.object({
  organizationId: z.coerce.number().int().positive().optional().openapi({ description: '只列某組織底下的挑戰主題' })
});
export const adminTemplateListQuerySchema = z.object({
  organizationId: z.coerce.number().int().positive().openapi({ description: '組織 ID（模板隸屬組織）' })
});

// ── program ─────────────────────────────────────────────────────

export const adminCreateProgramSchema = z.object({
  organizationId: z.number().int().positive().openapi({ description: '所屬組織 ID（通常為島島官方組織）' }),
  name: z.string().trim().min(1).max(100).openapi({ example: '晨間書寫' }),
  description: z.string().trim().max(2000).nullable().optional()
});
export const adminUpdateProgramSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional()
}).refine(value => Object.keys(value).length > 0, { message: '至少需要提供一個可更新欄位' });

export const adminProgramResponseSchema = z.object({
  id: z.number().int(),
  organizationId: z.number().int(),
  organizationName: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  cohortCount: z.number().int().nonnegative(),
  publishedCohortCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date().nullable()
});
export const adminProgramListResponseSchema = z.array(adminProgramResponseSchema);

// ── cohort ──────────────────────────────────────────────────────

const cohortFieldsSchema = z.object({
  displayName: z.string().trim().min(1).max(100).openapi({ example: '2026 秋季・21 天晨間書寫' }),
  startDate: dateSchema.openapi({ description: '固定開始日，所有參與者共用' }),
  endDate: dateSchema.optional().openapi({ description: '固定結束日；綁定的模板有持續天數時由系統推算，可省略' }),
  joinDeadline: dateSchema.nullable().optional().openapi({ description: '加入截止日；未設則可加入至結束日' }),
  capacity: z.number().int().positive().nullable().optional(),
  templateId: z.number().int().positive().nullable().optional().openapi({ description: '綁定的實踐模板；發佈前必須綁定' })
});
export const adminCreateCohortSchema = cohortFieldsSchema;
export const adminUpdateCohortSchema = cohortFieldsSchema.partial()
  .refine(value => Object.keys(value).length > 0, { message: '至少需要提供一個可更新欄位' });
export const adminSetCohortStatusSchema = z.object({
  status: z.enum(['draft', 'published']).openapi({ description: 'published＝發佈至探索共同挑戰頁；draft＝下架' })
});

export const adminCohortResponseSchema = z.object({
  id: z.number().int(),
  programId: z.number().int(),
  slug: z.string(),
  displayName: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  joinDeadline: z.date().nullable(),
  capacity: z.number().int().nullable(),
  status: cohortEditStatusSchema,
  runStatus: challengeRunStatusSchema,
  participantCount: z.number().int().nonnegative(),
  template: z.object({
    id: z.number().int(),
    title: z.string(),
    durationDays: z.number().int().nullable()
  }).nullable(),
  decks: z.array(z.object({ id: z.number().int(), name: z.string() })),
  createdAt: z.date(),
  updatedAt: z.date().nullable()
});
export const adminCohortListResponseSchema = z.array(adminCohortResponseSchema);

export const adminParticipantSchema = z.object({
  enrollmentId: z.number().int(),
  userId: z.number().int(),
  nickname: z.string().nullable(),
  joinedAt: z.date().nullable(),
  practiceId: z.string().nullable(),
  checkinCount: z.number().int().nonnegative()
});
export const adminParticipantListResponseSchema = z.array(adminParticipantSchema);

// ── template ────────────────────────────────────────────────────

const durationDaysSchema = z.union([z.literal(7), z.literal(14), z.literal(21), z.literal(30)], { message: '持續天數只能是 7 / 14 / 21 / 30 天' });
const sessionMinutesSchema = z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)], { message: '每次時長只能是 15 / 30 / 45 / 60 分鐘' });

const templateFieldsSchema = z.object({
  title: z.string().trim().min(1).max(100),
  practiceAction: z.string().trim().max(2000).nullable().optional(),
  durationDays: durationDaysSchema.nullable().optional(),
  frequencyMinDays: z.number().int().min(1).max(7).nullable().optional(),
  frequencyMaxDays: z.number().int().min(1).max(7).nullable().optional(),
  sessionDurationMinutes: sessionMinutesSchema.nullable().optional(),
  practiceTimePeriods: z.array(practiceTimePeriodSchema).max(5).optional().default([]),
  resources: z.array(practiceResourceInputSchema).max(5, '資源最多 5 個').optional()
});
const frequencyOrdered = (v: { frequencyMinDays?: number | null; frequencyMaxDays?: number | null }): boolean =>
  !v.frequencyMinDays || !v.frequencyMaxDays || v.frequencyMinDays <= v.frequencyMaxDays;
export const adminCreateTemplateSchema = templateFieldsSchema
  .extend({ organizationId: z.number().int().positive() })
  .refine(frequencyOrdered, { message: '最小頻率不可大於最大頻率' });
export const adminUpdateTemplateSchema = templateFieldsSchema.partial()
  .refine(v => Object.keys(v).length > 0, { message: '至少提供一個欄位' })
  .refine(frequencyOrdered, { message: '最小頻率不可大於最大頻率' });

export const adminTemplateResponseSchema = z.object({
  id: z.number().int(),
  externalId: z.string().uuid(),
  organizationId: z.number().int(),
  title: z.string(),
  practiceAction: z.string().nullable(),
  durationDays: z.number().int().nullable(),
  frequencyMinDays: z.number().int().nullable(),
  frequencyMaxDays: z.number().int().nullable(),
  sessionDurationMinutes: z.number().int().nullable(),
  practiceTimePeriods: z.array(z.string()),
  boundCohortIds: z.array(z.number().int()),
  bindings: z.array(z.object({ cohortId: z.number().int(), startDate: z.date().nullable() })),
  resources: z.array(z.object({ id: z.string(), name: z.string(), url: z.string().nullable(), dayNumber: z.number().int().nullable() })),
  generatedDraftCount: z.number().int().nonnegative(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable()
});
export const adminTemplateListResponseSchema = z.array(adminTemplateResponseSchema);

export type AdminCreateProgramInput = z.infer<typeof adminCreateProgramSchema>;
export type AdminUpdateProgramInput = z.infer<typeof adminUpdateProgramSchema>;
export type AdminCreateCohortInput = z.infer<typeof adminCreateCohortSchema>;
export type AdminUpdateCohortInput = z.infer<typeof adminUpdateCohortSchema>;
export type AdminCreateTemplateInput = z.infer<typeof adminCreateTemplateSchema>;
export type AdminUpdateTemplateInput = z.infer<typeof adminUpdateTemplateSchema>;
export type AdminCohortResponse = z.infer<typeof adminCohortResponseSchema>;
