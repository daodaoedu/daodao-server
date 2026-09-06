import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD');
const cohortStatusSchema = z.enum(['draft', 'published', 'archived']);

export const cohortProgramParamsSchema = z.object({
  programId: z.coerce.number().int().positive().openapi({ example: 1 })
});
export const cohortParamsSchema = cohortProgramParamsSchema.extend({
  cohortId: z.coerce.number().int().positive().openapi({ example: 1 })
});
export const createCohortSchema = z.object({
  slug: z.string().trim().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).openapi({ example: '2026-summer' }),
  displayName: z.string().trim().min(1).max(100).openapi({ example: '2026 夏季期' }),
  startDate: dateSchema,
  endDate: dateSchema,
  joinDeadline: dateSchema.nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  inviteMessage: z.string().trim().max(2000).nullable().optional(),
  status: cohortStatusSchema.optional().default('draft')
}).refine(value => value.startDate <= value.endDate, { message: '開始日期不可晚於結束日期', path: ['endDate'] });
export const updateCohortSchema = z.object({
  slug: z.string().trim().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  displayName: z.string().trim().min(1).max(100).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  joinDeadline: dateSchema.nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  inviteMessage: z.string().trim().max(2000).nullable().optional(),
  status: cohortStatusSchema.optional()
}).refine(value => Object.keys(value).length > 0, { message: '至少需要提供一個可更新欄位' });
export const cohortResponseSchema = z.object({
  id: z.number().int(), programId: z.number().int(), slug: z.string(), displayName: z.string(),
  startDate: z.date(), endDate: z.date(), joinToken: z.string().uuid().nullable(),
  joinPaused: z.boolean().openapi({ description: '是否暫停透過邀請連結加入（token 保留，重新開放沿用原連結）' }),
  joinDeadline: z.date().nullable(), capacity: z.number().int().nullable(),
  inviteMessage: z.string().nullable(), status: cohortStatusSchema,
  createdAt: z.date(), updatedAt: z.date().nullable()
});
export const cohortListResponseSchema = z.array(cohortResponseSchema);
export const organizationCohortResponseSchema = cohortResponseSchema.extend({
  programName: z.string().openapi({ description: '所屬系列名稱' }),
  joinedCount: z.number().int().nonnegative().openapi({ description: '已加入的參與者人數（不含帶領人）' }),
  encourageCount: z.number().int().nonnegative().openapi({ description: '需要鼓勵的參與者×實踐數（>3天未打卡）' }),
  celebrateCount: z.number().int().nonnegative().openapi({ description: '值得慶祝的時刻數' }),
});
export const organizationCohortListResponseSchema = z.array(organizationCohortResponseSchema);
export const cohortJoinTokenResponseSchema = z.object({ cohortId: z.number().int(), joinToken: z.string().uuid().nullable(), joinPaused: z.boolean() });
export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortInput = z.infer<typeof updateCohortSchema>;
export type CohortResponse = z.infer<typeof cohortResponseSchema>;
export type OrganizationCohortResponse = z.infer<typeof organizationCohortResponseSchema>;
