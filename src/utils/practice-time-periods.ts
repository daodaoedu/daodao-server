/**
 * 實踐時段（practice_time_periods）允許值與容錯處理
 *
 * 寫入端以 enum 嚴格驗證；讀取端可能遇到舊資料（例如燈塔模板在 2026-07-25 前寫入的 "30"），
 * 回應前一律濾掉不在允許清單的值，避免單筆髒資料讓整個列表回應驗證失敗（daodao#382）。
 */
export const PRACTICE_TIME_PERIODS = ['morning', 'afternoon', 'evening', 'night', 'commute'] as const;

export type AllowedPracticeTimePeriod = (typeof PRACTICE_TIME_PERIODS)[number];

const ALLOWED = new Set<string>(PRACTICE_TIME_PERIODS);

export const isPracticeTimePeriod = (value: unknown): value is AllowedPracticeTimePeriod =>
  typeof value === 'string' && ALLOWED.has(value);

/**
 * 只保留允許的時段值（保留原順序、去除重複）；非陣列輸入回傳空陣列。
 */
export const sanitizePracticeTimePeriods = (values: unknown): AllowedPracticeTimePeriod[] => {
  if (!Array.isArray(values)) return [];
  const result: AllowedPracticeTimePeriod[] = [];
  for (const value of values) {
    if (isPracticeTimePeriod(value) && !result.includes(value)) result.push(value);
  }
  return result;
};
