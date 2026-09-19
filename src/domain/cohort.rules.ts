/**
 * Cohort 領域規則
 *
 * 集中管理期（cohort）的內容生命週期與加入資格判定。
 * 所有函式皆為 pure function，無副作用、無 DB 存取。
 */

// === 內容生命週期 ===
export { type CohortContentState, getCohortContentState } from '../middleware/cohort-content-lifecycle.middleware';

// === 加入資格 ===

export type CohortUnavailableReason = 'not_published' | 'expired' | 'full' | 'paused';

export interface CohortJoinEligibilityInput {
  status: string;
  endDate: Date;
  joinDeadline: Date | null;
  capacity: number | null;
  participantCount: number;
  joinPaused: boolean;
  hasInvitation: boolean;
  now?: Date;
}

export const getCohortUnavailableReason = (input: CohortJoinEligibilityInput): CohortUnavailableReason | null => {
  const { status, endDate, joinDeadline, capacity, participantCount, joinPaused, hasInvitation, now = new Date() } = input;
  const day = (d: Date): string => d.toISOString().slice(0, 10);
  const deadline = joinDeadline ?? endDate;

  if (status !== 'published') return 'not_published';
  if (day(now) > day(deadline)) return 'expired';
  if (capacity !== null && participantCount >= capacity) return 'full';
  if (!hasInvitation && joinPaused) return 'paused';
  return null;
};

export const canJoinCohort = (input: CohortJoinEligibilityInput): boolean =>
  getCohortUnavailableReason(input) === null;
