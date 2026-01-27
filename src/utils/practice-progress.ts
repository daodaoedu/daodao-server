/**
 * Practice 進度計算工具
 *
 * 進度計算公式：
 * - 建立：20%
 * - 首次打卡：+30%（共 50%）
 * - 後續打卡：50% / (最低目標 - 1)
 * - 達成最低目標：強制 100%
 * - 可超過 100%
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

/**
 * 實踐配置（用於計算進度）
 */
export interface PracticeProgressConfig {
  /** 最低打卡頻率（天） */
  frequencyMinDays: number;
  /** 最高打卡頻率（天） */
  frequencyMaxDays: number;
  /** 實踐持續天數 */
  durationDays: number;
}

/**
 * 進度計算結果
 */
export interface ProgressResult {
  /** 進度百分比 */
  percentage: number;
  /** 是否為首次打卡 */
  isFirstCheckIn: boolean;
  /** 是否達成最低目標 */
  hasReachedMinTarget: boolean;
  /** 最低目標打卡次數 */
  minTargetCheckIns: number;
  /** 當前打卡次數 */
  currentCheckIns: number;
}

/**
 * 初始進度（建立實踐時）
 */
export const INITIAL_PROGRESS = 20;

/**
 * 首次打卡後的進度
 */
export const FIRST_CHECKIN_PROGRESS = 50;

/**
 * 達成目標後的進度
 */
export const COMPLETED_PROGRESS = 100;

/**
 * 計算最低目標打卡次數
 *
 * 公式：Math.floor(durationDays / frequencyMaxDays)
 * 例如：30 天實踐，每 3-7 天打卡 → 最低 30/7 = 4 次
 *
 * @param config 實踐配置
 * @returns 最低目標打卡次數
 */
export function calculateMinTargetCheckIns(config: PracticeProgressConfig): number {
  const { durationDays, frequencyMaxDays } = config;

  if (frequencyMaxDays <= 0) {
    return 1;
  }

  const minTarget = Math.floor(durationDays / frequencyMaxDays);
  return Math.max(minTarget, 1); // 至少 1 次
}

/**
 * 計算實踐進度
 *
 * 進度公式：
 * 1. 建立時：20%
 * 2. 首次打卡：50%（+30%）
 * 3. 後續打卡：每次 +50% / (最低目標 - 1)
 * 4. 達成最低目標：100%
 * 5. 可超過 100%
 *
 * @param config 實踐配置
 * @param checkInCount 當前打卡次數（含本次）
 * @returns 進度計算結果
 */
export function calculateProgress(
  config: PracticeProgressConfig,
  checkInCount: number
): ProgressResult {
  const minTargetCheckIns = calculateMinTargetCheckIns(config);
  const isFirstCheckIn = checkInCount === 1;
  const hasReachedMinTarget = checkInCount >= minTargetCheckIns;

  let percentage: number;

  if (checkInCount === 0) {
    // 尚未打卡
    percentage = INITIAL_PROGRESS;
  } else if (isFirstCheckIn) {
    // 首次打卡：直接跳到 50%
    percentage = FIRST_CHECKIN_PROGRESS;
  } else if (hasReachedMinTarget) {
    // 達成或超過最低目標
    if (checkInCount === minTargetCheckIns) {
      percentage = COMPLETED_PROGRESS;
    } else {
      // 超過目標，繼續累加
      const extraCheckIns = checkInCount - minTargetCheckIns;
      const extraPercentagePerCheckIn = minTargetCheckIns > 1
        ? 50 / (minTargetCheckIns - 1)
        : 50;
      percentage = COMPLETED_PROGRESS + extraCheckIns * extraPercentagePerCheckIn;
    }
  } else {
    // 後續打卡（未達目標）
    // 從 50% 開始，每次增加 50% / (minTarget - 1)
    const remainingCheckIns = checkInCount - 1; // 扣除首次打卡
    const percentagePerCheckIn = minTargetCheckIns > 1
      ? 50 / (minTargetCheckIns - 1)
      : 50;
    percentage = FIRST_CHECKIN_PROGRESS + remainingCheckIns * percentagePerCheckIn;
  }

  // 四捨五入到小數點後兩位
  percentage = Math.round(percentage * 100) / 100;

  return {
    percentage,
    isFirstCheckIn,
    hasReachedMinTarget,
    minTargetCheckIns,
    currentCheckIns: checkInCount,
  };
}

/**
 * 計算完成進度所需的剩餘打卡次數
 *
 * @param config 實踐配置
 * @param currentCheckIns 當前打卡次數
 * @returns 剩餘打卡次數（若已完成則為 0）
 */
export function calculateRemainingCheckIns(
  config: PracticeProgressConfig,
  currentCheckIns: number
): number {
  const minTargetCheckIns = calculateMinTargetCheckIns(config);
  const remaining = minTargetCheckIns - currentCheckIns;
  return Math.max(remaining, 0);
}

/**
 * 驗證進度值是否有效
 *
 * @param percentage 進度百分比
 * @returns 是否有效
 */
export function isValidProgress(percentage: number): boolean {
  return typeof percentage === 'number' && percentage >= 0 && !isNaN(percentage);
}

/**
 * 格式化進度顯示
 *
 * @param percentage 進度百分比
 * @returns 格式化字串（例如 "50.00%"）
 */
export function formatProgress(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}
