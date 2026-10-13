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

// === 邀請寄送資格 ===

/** 邀請信帶個人 token，暫停加入不擋受邀者，所以不會出現 paused */
export type InvitationBlockReason = Exclude<CohortUnavailableReason, 'paused'>;

/** 寄邀請信前的檢查：受邀者點連結時已無法加入（截止、未發布、額滿）就不該寄出 */
export const getInvitationBlockReason = (
  input: Omit<CohortJoinEligibilityInput, 'joinPaused' | 'hasInvitation'>
): InvitationBlockReason | null =>
  getCohortUnavailableReason({ ...input, joinPaused: false, hasInvitation: true }) as InvitationBlockReason | null;

/** 名單狀態（FR-RS-03 預覽結果）：new 新邀請、invited 已邀請、joined 已加入、rejoin 曾退出將重新邀請、invalid 格式錯誤 */
export type InviteItemState = 'new' | 'invited' | 'joined' | 'rejoin' | 'invalid';

/** 已加入者略過、不重寄邀請信；格式錯誤的 email 不寄 */
export const isInvitationSendable = (state: InviteItemState): boolean =>
  state === 'new' || state === 'invited' || state === 'rejoin';
