/**
 * 共同挑戰與探索活動共用的「期」運行狀態推導。
 * cohorts.status 僅表示編輯狀態（draft/published/archived），運行狀態一律由日期推導。
 */

export type CohortRunStatus = 'upcoming' | 'ongoing' | 'ended';
export type CohortUnavailableReason = 'ended' | 'expired' | 'full' | 'paused';

/** 產品時區（與 email 排程一致） */
export const APP_TIMEZONE = 'Asia/Taipei';

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/**
 * 取「日曆日」字串（YYYY-MM-DD）。
 * DATE 欄位由 Prisma 讀成 UTC 午夜的 Date，直接取 UTC 日；「現在」則換算成 Asia/Taipei 的日曆日，
 * 避免台灣 00:00–08:00 之間仍把昨天結束的期當成進行中。
 */
export const day = (value: Date): string => value.toISOString().slice(0, 10);
export const today = (now = new Date()): string => dayFormatter.format(now);

/** 將日曆日字串轉成 DATE 欄位可比較的 UTC 午夜 Date */
export const dateOf = (calendarDay: string): Date => new Date(`${calendarDay}T00:00:00.000Z`);

/** 依日期推導運行狀態（含頭含尾） */
export const deriveRunStatus = (startDate: Date, endDate: Date, now = new Date()): CohortRunStatus => {
  const current = today(now);
  if (current < day(startDate)) return 'upcoming';
  if (current > day(endDate)) return 'ended';
  return 'ongoing';
};

/**
 * 判斷是否可加入與不可加入原因。
 * 結束後不再接受新加入；join_deadline 未設時可加入至結束日；join_paused 視為暫停加入（優先於額滿）。
 */
export const deriveJoinability = (
  row: { start_date: Date; end_date: Date; join_deadline: Date | null; capacity: number | null; join_paused: boolean },
  participantCount: number,
  now = new Date()
): { canJoin: boolean; unavailableReason: CohortUnavailableReason | null } => {
  const current = today(now);
  if (current > day(row.end_date)) return { canJoin: false, unavailableReason: 'ended' };
  if (row.join_deadline !== null && current > day(row.join_deadline)) return { canJoin: false, unavailableReason: 'expired' };
  if (row.join_paused) return { canJoin: false, unavailableReason: 'paused' };
  if (row.capacity !== null && participantCount >= row.capacity) return { canJoin: false, unavailableReason: 'full' };
  return { canJoin: true, unavailableReason: null };
};
