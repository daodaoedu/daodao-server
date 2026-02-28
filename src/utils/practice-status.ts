import { MS_PER_DAY } from './date-utils';

/**
 * Practice 狀態流轉管理
 *
 * 狀態流程：
 * draft → not_started → active → completed
 *           ↓            ↓          ↓
 *        archived ← archived ← archived
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

/**
 * 實踐狀態類型
 *
 * @see FRD 狀態定義：
 * - draft: 草稿（建立流程未完成）
 * - not_started: 未開始（已建立但未開始打卡）
 * - active: 進行中（已有打卡記錄）
 * - completed: 完成（到達結束日）
 * - archived: 封存（使用者手動封存）
 */
export type PracticeStatusType =
  | 'draft'
  | 'not_started'
  | 'active'
  | 'completed'
  | 'archived';

/**
 * 狀態流轉上下文
 */
export interface StatusTransitionContext {
  /** 當前狀態 */
  currentStatus: PracticeStatusType;
  /** 是否有打卡記錄 */
  hasCheckIns: boolean;
  /** 是否已過結束日期（FRD: 完成條件是到期日，非進度） */
  hasPassedEndDate?: boolean;
  /** 是否手動封存 */
  isArchiving?: boolean;
  /** 是否取消封存 */
  isUnarchiving?: boolean;
  /** 封存前的狀態（用於取消封存） */
  previousStatus?: PracticeStatusType;
}

/**
 * 狀態優先順序（用於排序和比較）
 */
export const STATUS_PRIORITY: Record<PracticeStatusType, number> = {
  draft: 0,
  not_started: 1,
  active: 2,
  completed: 3,
  archived: 4,
} as const;

/**
 * 有效的狀態轉換映射
 */
export const VALID_TRANSITIONS: Record<PracticeStatusType, PracticeStatusType[]> = {
  draft: ['not_started', 'archived'],
  not_started: ['active', 'archived'],
  active: ['completed', 'archived'],
  completed: ['archived'],
  archived: ['not_started', 'active', 'completed'], // 取消封存可回到之前狀態
} as const;

/**
 * 判斷狀態轉換是否有效
 *
 * @param from 來源狀態
 * @param to 目標狀態
 * @returns 是否允許轉換
 */
export function isValidTransition(
  from: PracticeStatusType,
  to: PracticeStatusType
): boolean {
  if (from === to) {
    return true; // 相同狀態視為有效
  }

  const validTargets = VALID_TRANSITIONS[from];
  return validTargets?.includes(to) ?? false;
}

/**
 * 根據上下文決定新狀態
 *
 * FRD 規定：
 * - 完成條件是「到期日」，不是進度達到 100%
 * - 即便進度已達 100%，若時間未到，狀態仍為「進行中」
 * - 時間到達結束日，無論進度為何，狀態轉為「完成」
 *
 * @param ctx 狀態轉換上下文
 * @returns 新狀態
 */
export function determineNewStatus(ctx: StatusTransitionContext): PracticeStatusType {
  const { currentStatus, hasCheckIns, hasPassedEndDate, isArchiving, isUnarchiving, previousStatus } = ctx;

  // 手動封存
  if (isArchiving) {
    return 'archived';
  }

  // 已過結束日期：轉為完成（FRD: 到期日即完成日）
  // 包含取消封存時，如果已過期也應該變成 completed
  if (hasPassedEndDate && (currentStatus !== 'archived' || isUnarchiving)) {
    return 'completed';
  }

  // 取消封存：回到之前的狀態（僅限未過期的實踐）
  if (isUnarchiving && currentStatus === 'archived') {
    if (previousStatus && previousStatus !== 'archived') {
      return previousStatus;
    }
    // 根據是否有打卡記錄決定回到哪個狀態
    return hasCheckIns ? 'active' : 'not_started';
  }

  // 首次打卡：not_started → active
  if (hasCheckIns && currentStatus === 'not_started') {
    return 'active';
  }

  // 保持當前狀態
  return currentStatus;
}

/**
 * 取得狀態的顯示名稱
 *
 * @param status 狀態
 * @param locale 語言（預設繁體中文）
 * @returns 顯示名稱
 */
export function getStatusDisplayName(
  status: PracticeStatusType,
  locale: 'zh-TW' | 'en' = 'zh-TW'
): string {
  const names: Record<PracticeStatusType, Record<'zh-TW' | 'en', string>> = {
    draft: { 'zh-TW': '草稿', en: 'Draft' },
    not_started: { 'zh-TW': '未開始', en: 'Not Started' },
    active: { 'zh-TW': '進行中', en: 'Active' },
    completed: { 'zh-TW': '已完成', en: 'Completed' },
    archived: { 'zh-TW': '已封存', en: 'Archived' },
  };

  return names[status]?.[locale] ?? status;
}

/**
 * 判斷狀態是否為終態
 *
 * @param status 狀態
 * @returns 是否為終態
 */
export function isTerminalStatus(status: PracticeStatusType): boolean {
  return status === 'completed' || status === 'archived';
}

/**
 * 判斷狀態是否允許打卡
 *
 * @param status 狀態
 * @returns 是否允許打卡
 */
export function canCheckIn(status: PracticeStatusType): boolean {
  return status === 'not_started' || status === 'active';
}

/**
 * 判斷狀態是否允許編輯
 *
 * @param status 狀態
 * @returns 是否允許編輯
 */
export function canEdit(status: PracticeStatusType): boolean {
  return status !== 'archived';
}

/**
 * 判斷狀態是否允許刪除
 *
 * @param status 狀態
 * @returns 是否允許刪除（軟刪除/封存）
 */
export function canDelete(status: PracticeStatusType): boolean {
  return status !== 'archived';
}

/**
 * 驗證狀態值是否有效
 *
 * @param status 狀態值
 * @returns 是否為有效狀態
 */
export function isValidStatus(status: string): status is PracticeStatusType {
  return ['draft', 'not_started', 'active', 'completed', 'archived'].includes(status);
}

/**
 * 取得指定日期在 Asia/Taipei 時區的日期字串 (YYYY-MM-DD)
 *
 * @param date 日期物件
 * @returns Asia/Taipei 時區的日期字串
 */
function toTaipeiDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
}

/**
 * 檢查實踐是否已過期
 *
 * 優先使用 end_date（使用者可見的到期日）以 Asia/Taipei 時區判斷，
 * 確保實踐在到期日當天全天維持進行中狀態，隔天零時才轉為完成。
 * 若無 end_date，退回到 created_at + duration_days * 24h（相容舊資料）。
 *
 * @param endDate 結束日期（使用者可見的最後一天）
 * @param options 小時制計算所需的額外參數（fallback 用）
 * @returns 是否已過期
 */
export function checkHasPassedEndDate(
  endDate: Date | null | undefined,
  options?: {
    createdAt?: Date | null;
    durationDays?: number | null;
  }
): boolean {
  const now = new Date();

  // 優先使用 end_date（使用者可見的到期日）
  // 以 Asia/Taipei 時區比較日期，到期日當天仍為進行中，隔天才算過期
  if (endDate) {
    const todayTaipei = toTaipeiDateString(now);
    const endDateTaipei = toTaipeiDateString(new Date(endDate));
    return todayTaipei > endDateTaipei;
  }

  // Fallback: 小時制（created_at + durationDays * 24h），用於無 end_date 的舊資料
  if (options?.durationDays && options.createdAt) {
    const expiresAt = new Date(options.createdAt.getTime() + options.durationDays * MS_PER_DAY);
    return now.getTime() > expiresAt.getTime();
  }

  return false;
}

/**
 * 狀態轉換錯誤
 */
export class StatusTransitionError extends Error {
  constructor(
    public readonly from: PracticeStatusType,
    public readonly to: PracticeStatusType,
    message?: string
  ) {
    super(message ?? `無效的狀態轉換：${from} → ${to}`);
    this.name = 'StatusTransitionError';
  }
}
