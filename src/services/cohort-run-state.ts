/**
 * 共同挑戰與探索活動共用的「期」運行狀態推導。
 * cohorts.status 僅表示編輯狀態（draft/published/archived），運行狀態一律由日期推導。
 */

export type CohortRunStatus = 'upcoming' | 'ongoing' | 'ended';
export type CohortUnavailableReason = 'ended' | 'expired' | 'full' | 'paused';

/** 取 UTC 日期字串（YYYY-MM-DD），日期欄位皆為 DATE 型別故以 UTC 日比較 */
export const day = (value: Date): string => value.toISOString().slice(0, 10);

/** 依日期推導運行狀態（含頭含尾） */
export const deriveRunStatus = (startDate: Date, endDate: Date, now = new Date()): CohortRunStatus => {
  const today = day(now);
  if (today < day(startDate)) return 'upcoming';
  if (today > day(endDate)) return 'ended';
  return 'ongoing';
};

/**
 * 判斷是否可加入與不可加入原因。
 * 結束後不再接受新加入；join_deadline 未設時可加入至結束日；join_paused 視為暫停加入。
 */
export const deriveJoinability = (
  row: { start_date: Date; end_date: Date; join_deadline: Date | null; capacity: number | null; join_paused?: boolean },
  participantCount: number,
  now = new Date()
): { canJoin: boolean; unavailableReason: CohortUnavailableReason | null } => {
  const today = day(now);
  if (today > day(row.end_date)) return { canJoin: false, unavailableReason: 'ended' };
  if (row.join_deadline !== null && today > day(row.join_deadline)) return { canJoin: false, unavailableReason: 'expired' };
  if (row.capacity !== null && participantCount >= row.capacity) return { canJoin: false, unavailableReason: 'full' };
  if (row.join_paused === true) return { canJoin: false, unavailableReason: 'paused' };
  return { canJoin: true, unavailableReason: null };
};
