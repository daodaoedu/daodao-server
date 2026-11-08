import { z } from 'zod';
import { DURATION_DAYS_MAX, DURATION_DAYS_MIN, SESSION_MINUTES_MIN, practiceTimePeriodSchema } from './practice.validators';

/**
 * 燈塔模板庫的欄位上限依 FRD（frd-templates-org-archive.md FR-TPL-02）收緊：
 * 名稱 ≤20、實踐行動 ≤50、天數 ≤90、每週頻率 ≤7、每次分鐘 ≤240、自訂時段 ≤20。
 * DB CHECK（1–90 天／1–999 分鐘）比這裡寬，不用動。
 */
export const ORG_TEMPLATE_TITLE_MAX = 20;
export const ORG_TEMPLATE_ACTION_MAX = 50;
export const ORG_TEMPLATE_MINUTES_MAX = 240;
export const ORG_TEMPLATE_TIMING_OTHER_MAX = 20;
export const ORG_TEMPLATE_TAGS_MAX = 10;
export const ORG_TEMPLATE_TAG_LENGTH_MAX = 30;
export const ORG_TEMPLATE_RESOURCES_MAX = 5;
export const ORG_TEMPLATE_SEARCH_MAX = 100;

const durationDaysSchema = z.number().int().min(DURATION_DAYS_MIN, `持續天數最少 ${DURATION_DAYS_MIN} 天`).max(DURATION_DAYS_MAX, `持續天數最多 ${DURATION_DAYS_MAX} 天`);
const sessionMinutesSchema = z.number().int().min(SESSION_MINUTES_MIN, `每次時長最少 ${SESSION_MINUTES_MIN} 分鐘`).max(ORG_TEMPLATE_MINUTES_MAX, `每次時長最多 ${ORG_TEMPLATE_MINUTES_MAX} 分鐘`);
const frequencyDaysSchema = z.number().int().min(1, '每週頻率最少 1 天').max(7, '每週頻率最多 7 天');

export const organizationTemplateStatusSchema = z.enum(['draft', 'ready']).openapi({ description: 'draft：儲存草稿；ready：完成新增／更新' });

/** 模板資源：只收 HTTPS 連結；手動資源可無 URL（FR-TPL-03） */
export const organizationTemplateResourceInputSchema = z.object({
  name: z.string({ message: '請輸入資源名稱' }).trim().min(1, '請輸入資源名稱').max(100, '資源名稱不可超過100字'),
  url: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().url('請輸入有效的連結').refine(value => value.toLowerCase().startsWith('https://'), '資源連結必須是 HTTPS').optional()
  ),
  dayNumber: z.number().int().min(DURATION_DAYS_MIN).max(DURATION_DAYS_MAX).nullable().optional()
});

export const organizationTemplateParamsSchema = z.object({ organizationId: z.coerce.number().int().positive(), templateId: z.coerce.number().int().positive() });
export const organizationTemplateBindingParamsSchema = organizationTemplateParamsSchema.extend({ cohortId: z.coerce.number().int().positive() });
export const organizationTemplateListQuerySchema = z.object({
  q: z.string().trim().max(ORG_TEMPLATE_SEARCH_MAX).optional().openapi({ description: '搜尋模板名稱、實踐行動、標籤、資源名稱與連結（不分大小寫）' })
});

const templateFieldsSchema = z.object({
  title: z.string().trim().max(ORG_TEMPLATE_TITLE_MAX, `模板名稱最多 ${ORG_TEMPLATE_TITLE_MAX} 字`).optional().openapi({ description: '模板名稱；未填時由實踐行動推導' }),
  practiceAction: z.string().trim().max(ORG_TEMPLATE_ACTION_MAX, `實踐行動最多 ${ORG_TEMPLATE_ACTION_MAX} 字`).nullable().optional(),
  durationDays: durationDaysSchema.nullable().optional(),
  frequencyMinDays: frequencyDaysSchema.nullable().optional(),
  frequencyMaxDays: frequencyDaysSchema.nullable().optional(),
  sessionDurationMinutes: sessionMinutesSchema.nullable().optional(),
  practiceTimePeriods: z.array(practiceTimePeriodSchema).max(5).optional(),
  timingOther: z.string().trim().max(ORG_TEMPLATE_TIMING_OTHER_MAX, `自訂時段最多 ${ORG_TEMPLATE_TIMING_OTHER_MAX} 字`).nullable().optional().openapi({ description: '自訂執行時段（practice_templates.other_context）' }),
  tags: z.array(z.string().trim().min(1).max(ORG_TEMPLATE_TAG_LENGTH_MAX)).max(ORG_TEMPLATE_TAGS_MAX, `標籤最多 ${ORG_TEMPLATE_TAGS_MAX} 個`).optional(),
  resources: z.array(organizationTemplateResourceInputSchema).max(ORG_TEMPLATE_RESOURCES_MAX, `資源最多 ${ORG_TEMPLATE_RESOURCES_MAX} 個`).optional(),
  status: organizationTemplateStatusSchema.optional()
});

type TemplateFields = z.infer<typeof templateFieldsSchema>;
const hasAnyContent = (value: Partial<TemplateFields>): boolean =>
  Boolean(value.title) || Boolean(value.practiceAction) || value.durationDays != null || value.frequencyMinDays != null
  || value.frequencyMaxDays != null || value.sessionDurationMinutes != null || Boolean(value.practiceTimePeriods?.length)
  || Boolean(value.timingOther) || Boolean(value.tags?.length) || Boolean(value.resources?.length);

/**
 * 完成新增／更新（ready）時的必填：實踐行動、持續天數、每週頻率（FR-TPL-02 步驟 1、2）。
 * 草稿只要求至少有任一內容（TP-TPL-04）。
 */
export const assertTemplateReady = (value: { practiceAction?: string | null; durationDays?: number | null; frequencyMaxDays?: number | null; frequencyMinDays?: number | null }): string[] => {
  const issues: string[] = [];
  if (!value.practiceAction) issues.push('請填寫實踐行動');
  if (value.durationDays == null) issues.push('請設定持續天數');
  if (value.frequencyMaxDays == null && value.frequencyMinDays == null) issues.push('請設定每週頻率');
  if (value.frequencyMinDays != null && value.frequencyMaxDays != null && value.frequencyMinDays > value.frequencyMaxDays) issues.push('最小頻率不可大於最大頻率');
  return issues;
};

export const createOrganizationTemplateSchema = templateFieldsSchema.extend({
  practiceTimePeriods: templateFieldsSchema.shape.practiceTimePeriods.default([]),
  status: templateFieldsSchema.shape.status.default('ready')
}).superRefine((value, ctx) => {
  if (value.status === 'draft') {
    if (!hasAnyContent(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: '草稿至少需要填寫一項內容' });
    return;
  }
  for (const message of assertTemplateReady(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
});
export const updateOrganizationTemplateSchema = templateFieldsSchema.partial().refine(v => Object.keys(v).length > 0, { message: '至少提供一個欄位' });

export const templateBindingSchema = z.object({
  cohortId: z.number().int(),
  cohortName: z.string(),
  cohortStatus: z.string(),
  cohortStartDate: z.date(),
  startDate: z.date().nullable().openapi({ description: '模板在此場次的開始日；null 時沿用場次開始日' }),
  endDate: z.date().nullable().openapi({ description: '開始日 + 天數 - 1；模板無天數時為 null' }),
  locked: z.boolean().openapi({ description: '場次已開始，禁止解除綁定或修改開始日（FR-TPL-05）' })
});

export const organizationTemplateResponseSchema = z.object({
  id: z.number().int(), externalId: z.string().uuid(), organizationId: z.number().int(), title: z.string(), practiceAction: z.string().nullable(),
  durationDays: z.number().int().nullable(), frequencyMinDays: z.number().int().nullable(), frequencyMaxDays: z.number().int().nullable(),
  sessionDurationMinutes: z.number().int().nullable(), practiceTimePeriods: z.array(z.string()), timingOther: z.string().nullable(),
  status: organizationTemplateStatusSchema, archivedAt: z.date().nullable(),
  tags: z.array(z.string()),
  boundCohortIds: z.array(z.number().int()),
  bindings: z.array(templateBindingSchema),
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
export type OrganizationTemplateListQuery = z.infer<typeof organizationTemplateListQuerySchema>;
export type OrganizationTemplateResourceInput = z.infer<typeof organizationTemplateResourceInputSchema>;
