import { z } from 'zod';
import '../config/openapi-registry';

export const COHORT_TEMPLATE_RESOURCES_MAX = 50;

/** Canonical URLs make scheme/host casing and implicit HTTPS duplicates comparable. */
const resourceUrlSchema = z.preprocess(
  value => value == null ? '' : value,
  z.string().trim().transform((value, ctx) => {
    if (value === '') return '';
    const hasHttpScheme = /^https?:\/\//i.test(value);
    const hasOtherScheme = /^[a-z][a-z\d+.-]*:/i.test(value)
      && !/^(?:localhost|[^/?#:]+\.[^/?#:]+):\d+(?:[/?#]|$)/i.test(value);
    try {
      if ((!hasHttpScheme && hasOtherScheme) || /[\\\s]/.test(value)) throw new Error('Invalid URL');
      const parsed = new URL(hasHttpScheme ? value : `https://${value}`);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('Invalid URL');
      if (parsed.href.length > 1000) throw new Error('URL too long');
      return parsed.href;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請輸入有效的 HTTP 或 HTTPS 連結' });
      return z.NEVER;
    }
  })
);

const relevantDateSchema = z.iso.date('日期必須為有效的 YYYY-MM-DD');

export const cohortTemplateResourceInputSchema = z.object({
  id: z.number().int().positive().optional().openapi({ description: '既有場次資源識別碼；新增時不填', example: 12 }),
  name: z.string({ message: '請輸入資源名稱' }).trim().min(1, '請輸入資源名稱').max(100, '資源名稱不可超過100字').openapi({ description: '資源名稱，去除前後空白', example: '活動講義' }),
  url: resourceUrlSchema.openapi({ type: 'string', description: 'HTTP/HTTPS 連結；未填協定補 HTTPS；無連結輸出空字串', example: 'https://example.com/course' }),
  relevantDate: relevantDateSchema.nullable().default(null).openapi({ description: '選填參考日期，不影響資源可見時間；null 表示清除日期', example: '2026-12-01' })
});

export const updateCohortTemplateResourcesSchema = z.object({
  resources: z.array(cohortTemplateResourceInputSchema).max(COHORT_TEMPLATE_RESOURCES_MAX, '場次資源最多50筆').openapi({ description: '場次共用資源完整清單，依顯示順序排列，最多50筆', example: [{ name: '活動講義', url: 'https://example.com/course', relevantDate: null }] })
}).superRefine(({ resources }, ctx) => {
  const ids = new Set<number>();
  const urls = new Set<string>();
  const namesWithoutUrl = new Set<string>();
  resources.forEach((resource, index) => {
    if (resource.id !== undefined) {
      if (ids.has(resource.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['resources', index, 'id'], message: '資源識別碼不可重複' });
      ids.add(resource.id);
    }
    const values = resource.url ? urls : namesWithoutUrl;
    // Match the existing editor's comparison while preserving the display URL.
    const key = resource.url ? resource.url.replace(/#.*$/, '').replace(/\/+$/, '') : resource.name.toLowerCase();
    if (values.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['resources', index, resource.url ? 'url' : 'name'], message: resource.url ? '相同網址不可重複加入' : '無連結的資源名稱不可重複' });
    values.add(key);
  });
});

export const cohortTemplateResourceResponseSchema = z.object({
  id: z.number().int().positive().openapi({ description: '場次資源穩定識別碼', example: 12 }),
  name: z.string().openapi({ description: '資源名稱', example: '活動講義' }),
  url: z.string().openapi({ description: '資源連結；無連結時為空字串', example: 'https://example.com/course' }),
  relevantDate: relevantDateSchema.nullable().openapi({ description: '選填參考日期，非排程條件', example: '2026-12-01' })
});
export const cohortTemplateResourcesResponseSchema = z.array(cohortTemplateResourceResponseSchema).max(COHORT_TEMPLATE_RESOURCES_MAX);

export type CohortTemplateResourceInput = z.infer<typeof cohortTemplateResourceInputSchema>;
export type UpdateCohortTemplateResourcesInput = z.infer<typeof updateCohortTemplateResourcesSchema>;
export type CohortTemplateResource = z.infer<typeof cohortTemplateResourceResponseSchema>;

export const cohortResourceBindingListSchema = z.array(z.object({
  organizationId: z.number().int().positive().openapi({ description: '所屬組織識別碼', example: 1 }),
  templateId: z.number().int().positive().openapi({ description: '模板識別碼', example: 2 }),
  cohortId: z.number().int().positive().openapi({ description: '負責場次識別碼', example: 3 }),
  cohortName: z.string().openapi({ description: '場次名稱', example: '秋季場次' }),
  templateName: z.string().openapi({ description: '模板名稱', example: '每天閱讀' })
}));
