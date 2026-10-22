/**
 * 日期處理工具函數
 */

/** 一天的毫秒數 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 今天的台北日曆日（存成 UTC 零點的 Date，對齊 @db.Date 欄位）。
 * 不受程序時區影響：台北 00:00–08:00 時 UTC 仍是前一天，不能用 setHours(0, 0, 0, 0)（daodao#336）。
 */
export function taipeiToday(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + TAIPEI_OFFSET_MS);
  return new Date(`${shifted.toISOString().slice(0, 10)}T00:00:00Z`);
}

/**
 * 期間結束日：含開始日當天共 durationDays 天，結束日 = 開始日 + 天數 − 1。
 * 範本綁定、共同挑戰、梯次指派複製的實踐與個人實踐共用這一條規則（daodao#277）。
 * 以 UTC 日曆日運算：DATE 欄位由 Prisma 讀成 UTC 午夜，結果不受程序時區影響。
 */
export function inclusiveEndDate(startDate: Date, durationDays: number): Date {
  const end = new Date(startDate);
  end.setUTCDate(end.getUTCDate() + durationDays - 1);
  return end;
}

/**
 * 格式化日期為 YYYY-MM-DD
 * @param date - 日期物件
 * @returns 格式化後的日期字串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 獲取週起始日期（週一）
 * @param date - 日期物件
 * @returns 該週的週一日期
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整到週一
  return new Date(d.setDate(diff));
}

/**
 * 獲取月起始日期
 * @param date - 日期物件
 * @returns 該月的第一天
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 獲取年起始日期
 * @param date - 日期物件
 * @returns 該年的第一天
 */
export function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * 計算兩個日期之間的天數差
 * @param date1 - 第一個日期
 * @param date2 - 第二個日期
 * @returns 天數差（絕對值）
 */
export function daysBetween(date1: Date, date2: Date): number {
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / MS_PER_DAY));
}

/**
 * 獲取 N 天前的日期
 * @param days - 天數
 * @returns N 天前的日期
 */
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * 獲取月結束日期
 * @param date - 日期物件
 * @returns 該月的最後一天
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 獲取年結束日期
 * @param date - 日期物件
 * @returns 該年的最後一天
 */
export function getYearEnd(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}
