/**
 * 期（cohorts.visibility）的探索活動頁可見性。
 * DB 不設 CHECK constraint，值域由本常量 + Zod 管控（沿用 programs.kind 慣例）。
 * 僅 programs.kind = 'lighthouse' 的期使用；共同挑戰走 /challenges，不讀此欄位。
 */
export const COHORT_VISIBILITY = {
  /** 僅透過邀請連結加入（預設） */
  PRIVATE: 'private',
  /** 列於探索活動頁，任何人可取得加入連結 */
  PUBLIC: 'public',
} as const;

export const COHORT_VISIBILITIES = [COHORT_VISIBILITY.PRIVATE, COHORT_VISIBILITY.PUBLIC] as const;

export type CohortVisibility = (typeof COHORT_VISIBILITY)[keyof typeof COHORT_VISIBILITY];
