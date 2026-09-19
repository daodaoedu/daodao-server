import { z } from 'zod';
import { ARCHIVE_ITEM_TYPES } from '../constants/archive-state';

export const archiveItemTypeSchema = z.enum(ARCHIVE_ITEM_TYPES).openapi({ description: '封存分類：templates（模板）、cohorts（場次）、programs（系列）' });

export const archiveListQuerySchema = z.object({ type: archiveItemTypeSchema });
export const archiveItemParamsSchema = z.object({
  organizationId: z.coerce.number().int().positive(),
  type: archiveItemTypeSchema,
  itemId: z.coerce.number().int().positive()
});

export const archiveItemSchema = z.object({
  type: z.enum(['template', 'cohort', 'program']),
  id: z.number().int(),
  name: z.string(),
  archivedAt: z.date().nullable().openapi({ description: '封存時間（archived_at）' }),
  archivedBy: z.object({ id: z.number().int(), name: z.string() }).nullable().openapi({ description: '封存操作人；089 前封存的資料為 null' }),
  archivedFromStatus: z.string().nullable().openapi({ description: '場次封存前的狀態；恢復時還原' }),
  archivedReason: z.string().nullable().openapi({ description: '場次：manual（手動）| program_cascade（隨系列封存）' }),
  parentName: z.string().nullable().openapi({ description: '場次所屬系列名稱' }),
  parentArchived: z.boolean().openapi({ description: '場次所屬系列仍在封存中，需先恢復系列' })
});
export const archiveListResponseSchema = z.object({ type: archiveItemTypeSchema, items: z.array(archiveItemSchema) });

export const archiveRestoreResultSchema = z.object({
  type: z.enum(['template', 'cohort', 'program']),
  id: z.number().int(),
  name: z.string(),
  restoredCohortCount: z.number().int().nonnegative().openapi({ description: '恢復系列時一併復活的場次數（只含隨系列封存的場次）' })
});

export type ArchiveItem = z.infer<typeof archiveItemSchema>;
export type ArchiveRestoreResult = z.infer<typeof archiveRestoreResultSchema>;
