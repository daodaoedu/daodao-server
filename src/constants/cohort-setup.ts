/**
 * 場次設定面板常量（cohort-setup-panel Phase A）。
 * 值域由本檔 + Zod validator 管控，DB 不設 CHECK constraint（沿用 programs.kind 慣例）。
 */

/** 互動方式多選值域 */
export const COHORT_INTERACTION_MODES = ['sync', 'async', 'physical'] as const;
export type CohortInteractionMode = (typeof COHORT_INTERACTION_MODES)[number];

/** 收費類型 */
export const COHORT_FEE_TYPES = ['free', 'paid'] as const;
export type CohortFeeType = (typeof COHORT_FEE_TYPES)[number];

/** 報名方式 */
export const COHORT_SIGNUP_METHODS = ['island_form', 'external'] as const;
export type CohortSignupMethod = (typeof COHORT_SIGNUP_METHODS)[number];
