/**
 * Practice 業務邏輯驗證
 *
 * 驗證開始日期、核心設定修改權限、日期位移計算等業務規則
 * 使用 moment-timezone 處理日期（專案已使用，不引入 date-fns）
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

import moment from 'moment-timezone';

/**
 * 驗證結果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 錯誤訊息（若無效） */
  errorMessage?: string;
  /** 錯誤代碼（若無效） */
  errorCode?: string;
}

/**
 * 日期位移結果
 */
export interface DateShiftResult {
  /** 新的開始日期 */
  newStartDate: Date;
  /** 新的結束日期 */
  newEndDate: Date;
  /** 位移天數（負數表示提前） */
  shiftDays: number;
  /** 是否需要位移 */
  needsShift: boolean;
}

/**
 * 核心設定（有打卡後不可修改）
 */
export const LOCKED_FIELDS_AFTER_CHECKIN = [
  'startDate',
  'frequencyMinDays',
  'frequencyMaxDays',
  'durationDays',
] as const;

export type LockedField = (typeof LOCKED_FIELDS_AFTER_CHECKIN)[number];

/**
 * 開始日期最大提前天數
 */
export const MAX_START_DATE_ADVANCE_DAYS = 14;

/**
 * 預設時區
 */
export const DEFAULT_TIMEZONE = 'Asia/Taipei';

/**
 * 驗證開始日期
 *
 * 規則：
 * 1. 不能是過去的日期
 * 2. 不能超過 14 天後
 *
 * @param startDate 開始日期
 * @param timezone 時區（預設 Asia/Taipei）
 * @returns 驗證結果
 */
export function validateStartDate(
  startDate: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): ValidationResult {
  const start = moment.tz(startDate, timezone).startOf('day');
  const today = moment.tz(timezone).startOf('day');
  const maxDate = today.clone().add(MAX_START_DATE_ADVANCE_DAYS, 'days');

  if (!start.isValid()) {
    return {
      isValid: false,
      errorMessage: '無效的日期格式',
      errorCode: 'INVALID_DATE_FORMAT',
    };
  }

  if (start.isBefore(today)) {
    return {
      isValid: false,
      errorMessage: '開始日期不能是過去的日期',
      errorCode: 'START_DATE_IN_PAST',
    };
  }

  if (start.isAfter(maxDate)) {
    return {
      isValid: false,
      errorMessage: `開始日期不能超過 ${MAX_START_DATE_ADVANCE_DAYS} 天後`,
      errorCode: 'START_DATE_TOO_FAR',
    };
  }

  return { isValid: true };
}

/**
 * 檢查是否可以修改核心設定
 *
 * @param hasCheckIns 是否有打卡記錄
 * @returns 是否可以修改
 */
export function canModifyCoreSettings(hasCheckIns: boolean): boolean {
  return !hasCheckIns;
}

/**
 * 驗證更新請求中的欄位是否可修改
 *
 * @param updateFields 要更新的欄位名稱列表
 * @param hasCheckIns 是否有打卡記錄
 * @returns 驗證結果
 */
export function validateUpdateFields(
  updateFields: string[],
  hasCheckIns: boolean
): ValidationResult {
  if (!hasCheckIns) {
    return { isValid: true };
  }

  const lockedFieldsInRequest = updateFields.filter((field) =>
    LOCKED_FIELDS_AFTER_CHECKIN.includes(field as LockedField)
  );

  if (lockedFieldsInRequest.length > 0) {
    return {
      isValid: false,
      errorMessage: `有打卡記錄後，以下欄位不可修改：${lockedFieldsInRequest.join(', ')}`,
      errorCode: 'FIELDS_LOCKED_AFTER_CHECKIN',
    };
  }

  return { isValid: true };
}

/**
 * 計算日期位移（提早打卡時使用）
 *
 * 當使用者在 start_date 之前打卡時，自動將實踐日期往前調整
 *
 * @param originalStartDate 原始開始日期
 * @param firstCheckinDate 首次打卡日期
 * @param durationDays 實踐持續天數
 * @param timezone 時區
 * @returns 日期位移結果
 */
export function calculateDateShift(
  originalStartDate: string | Date,
  firstCheckinDate: string | Date,
  durationDays: number,
  timezone: string = DEFAULT_TIMEZONE
): DateShiftResult {
  const originalStart = moment.tz(originalStartDate, timezone).startOf('day');
  const checkinDate = moment.tz(firstCheckinDate, timezone).startOf('day');

  // 計算位移天數
  const shiftDays = checkinDate.diff(originalStart, 'days');

  // 只有當打卡日期早於開始日期時才需要位移
  const needsShift = shiftDays < 0;

  if (!needsShift) {
    return {
      newStartDate: originalStart.toDate(),
      newEndDate: originalStart.clone().add(durationDays, 'days').toDate(),
      shiftDays: 0,
      needsShift: false,
    };
  }

  // 計算新的日期
  const newStartDate = checkinDate.toDate();
  const newEndDate = checkinDate.clone().add(durationDays, 'days').toDate();

  return {
    newStartDate,
    newEndDate,
    shiftDays,
    needsShift: true,
  };
}

/**
 * 驗證打卡日期
 *
 * @param checkInDate 打卡日期
 * @param practiceStartDate 實踐開始日期
 * @param practiceEndDate 實踐結束日期
 * @param timezone 時區
 * @returns 驗證結果
 */
export function validateCheckInDate(
  checkInDate: string | Date,
  practiceStartDate: string | Date,
  practiceEndDate: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): ValidationResult {
  const checkin = moment.tz(checkInDate, timezone).startOf('day');
  const start = moment.tz(practiceStartDate, timezone).startOf('day');
  const end = moment.tz(practiceEndDate, timezone).startOf('day');

  if (!checkin.isValid()) {
    return {
      isValid: false,
      errorMessage: '無效的打卡日期格式',
      errorCode: 'INVALID_CHECKIN_DATE',
    };
  }

  // 允許提早打卡（會觸發日期位移）
  // 但不允許在結束日期之後打卡
  if (checkin.isAfter(end)) {
    return {
      isValid: false,
      errorMessage: '實踐已結束，無法打卡',
      errorCode: 'PRACTICE_ENDED',
    };
  }

  return { isValid: true };
}

/**
 * 驗證打卡頻率
 *
 * @param lastCheckInDate 上次打卡日期
 * @param currentDate 當前日期
 * @param frequencyMinDays 最低頻率（天）
 * @param timezone 時區
 * @returns 驗證結果
 */
export function validateCheckInFrequency(
  lastCheckInDate: string | Date | null,
  currentDate: string | Date,
  frequencyMinDays: number,
  timezone: string = DEFAULT_TIMEZONE
): ValidationResult {
  if (!lastCheckInDate) {
    return { isValid: true };
  }

  const last = moment.tz(lastCheckInDate, timezone).startOf('day');
  const current = moment.tz(currentDate, timezone).startOf('day');
  const daysSinceLastCheckIn = current.diff(last, 'days');

  if (daysSinceLastCheckIn < frequencyMinDays) {
    return {
      isValid: false,
      errorMessage: `距離上次打卡未滿 ${frequencyMinDays} 天`,
      errorCode: 'CHECKIN_TOO_FREQUENT',
    };
  }

  return { isValid: true };
}

/**
 * 計算實踐結束日期
 *
 * @param startDate 開始日期
 * @param durationDays 持續天數
 * @param timezone 時區
 * @returns 結束日期
 */
export function calculateEndDate(
  startDate: string | Date,
  durationDays: number,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  return moment.tz(startDate, timezone)
    .startOf('day')
    .add(durationDays, 'days')
    .toDate();
}

/**
 * 格式化日期為 YYYY-MM-DD
 *
 * @param date 日期
 * @param timezone 時區
 * @returns 格式化字串
 */
export function formatDate(
  date: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return moment.tz(date, timezone).format('YYYY-MM-DD');
}

/**
 * 取得當前日期（開始時間）
 *
 * @param timezone 時區
 * @returns 當前日期
 */
export function getToday(timezone: string = DEFAULT_TIMEZONE): Date {
  return moment.tz(timezone).startOf('day').toDate();
}
