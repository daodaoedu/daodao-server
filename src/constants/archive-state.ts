/**
 * 燈塔封存狀態的共用 where 片段（migration 089 起）。
 * - programs：`archived_at` 為封存（可從封存區恢復），`deleted_at` 為封存區刪除（軟刪）；
 *   089 之前 `deleted_at` 即封存，已 backfill 到 `archived_at`
 * - cohorts：封存以 `status = 'archived'` 表示並同時寫 `archived_at`；`deleted_at` 為封存區刪除
 * - practice_templates：`archived_at` 封存、`deleted_at` 封存區刪除
 */
export const ACTIVE_PROGRAM_WHERE = { archived_at: null, deleted_at: null } as const;
export const NOT_DELETED_WHERE = { deleted_at: null } as const;

export const COHORT_ARCHIVE_REASONS = {
  MANUAL: 'manual',
  PROGRAM_CASCADE: 'program_cascade'
} as const;
export type CohortArchiveReason = (typeof COHORT_ARCHIVE_REASONS)[keyof typeof COHORT_ARCHIVE_REASONS];

export const ARCHIVE_ITEM_TYPES = ['templates', 'cohorts', 'programs'] as const;
export type ArchiveItemType = (typeof ARCHIVE_ITEM_TYPES)[number];
