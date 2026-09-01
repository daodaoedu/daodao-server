/**
 * 主題（programs.kind）種類。
 * DB 不設 CHECK constraint，值域由本常量 + Zod 管控（沿用 daily-inspiration-card 慣例）。
 */
export const PROGRAM_KINDS = {
  /** 燈塔系列 */
  LIGHTHOUSE: 'lighthouse',
  /** 共同挑戰主題 */
  CHALLENGE: 'challenge',
} as const;

export type ProgramKind = (typeof PROGRAM_KINDS)[keyof typeof PROGRAM_KINDS];
