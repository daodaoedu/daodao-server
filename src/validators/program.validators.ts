import { z } from 'zod';

export const programIdParamsSchema = z.object({ programId: z.coerce.number().int().positive().openapi({ example: 1 }) });
export const programListQuerySchema = z.object({ organizationId: z.coerce.number().int().positive().openapi({ example: 1 }) });
export const createProgramSchema = z.object({
  organizationId: z.number().int().positive().openapi({ example: 1 }),
  name: z.string().trim().min(1).max(100).openapi({ example: '持續行動系列' }),
  description: z.string().trim().max(2000).nullable().optional()
});
export const updateProgramSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional()
}).refine(value => Object.keys(value).length > 0, { message: '至少需要提供一個可更新欄位' });
export const programResponseSchema = z.object({
  id: z.number().int(), organizationId: z.number().int(), name: z.string(),
  description: z.string().nullable(),
  archivedAt: z.date().nullable().openapi({ description: '封存時間；有值表示在封存區（migration 089 起，deleted_at 改為封存區刪除）' }),
  deletedAt: z.date().nullable(),
  createdAt: z.date(), updatedAt: z.date().nullable()
});
export const programListResponseSchema = z.array(programResponseSchema);
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type ProgramResponse = z.infer<typeof programResponseSchema>;

