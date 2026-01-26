/**
 * Practice Email Types
 *
 * 定義主題實踐相關的郵件類型和變數
 * 包含 8 種郵件代碼 (PE01-PE08)
 *
 * @see docs/practice-mvp/practice-email-spec.md
 */

/**
 * 郵件代碼常數
 */
export const PRACTICE_EMAIL_CODES = {
  /** PE01: 實踐建立確認郵件 */
  PRACTICE_CREATED: 'PE01',
  /** PE02: 首次打卡鼓勵郵件 */
  FIRST_CHECKIN: 'PE02',
  /** PE03: 週報（當週有打卡且有文字記錄） */
  WEEKLY_ACTIVE: 'PE03',
  /** PE04: 週報（當週有打卡但無文字記錄） */
  WEEKLY_INACTIVE: 'PE04',
  /** PE05: 週報（從建立至今從未打卡） */
  WEEKLY_NEVER_CHECKIN: 'PE05',
  /** PE06: 週報（當週無打卡但累積有打卡） */
  WEEKLY_SKIP: 'PE06',
  /** PE07: 結束總結（有打卡記錄） */
  FINAL_SUCCESS: 'PE07',
  /** PE08: 結束總結（無打卡記錄） */
  FINAL_INCOMPLETE: 'PE08',
} as const;

export type PracticeEmailCode = typeof PRACTICE_EMAIL_CODES[keyof typeof PRACTICE_EMAIL_CODES];

/**
 * 打卡統計資訊
 */
export interface CheckInStats {
  /** 總打卡次數 */
  totalCheckIns: number;
  /** 目標打卡次數 */
  targetCheckIns: number;
  /** 當前連續天數 */
  currentStreak: number;
  /** 最高連續天數 */
  maxStreak: number;
  /** 完成百分比 */
  completionPercentage: number;
}

/**
 * 實踐郵件基礎變數
 */
export interface PracticeEmailBaseVariables {
  /** 使用者名稱 */
  userName: string;
  /** 使用者 Email */
  userEmail: string;
  /** 實踐標題 */
  practiceTitle: string;
  /** 實踐 ID */
  practiceId: string;
  /** 實踐連結 */
  practiceUrl: string;
  /** 取消訂閱連結 */
  unsubscribeUrl?: string;
}

/**
 * PE01: 實踐建立確認郵件變數
 */
export interface PracticeCreatedEmailVariables extends PracticeEmailBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.PRACTICE_CREATED;
  /** 開始日期 */
  startDate: string;
  /** 結束日期 */
  endDate: string;
  /** 持續天數 */
  durationDays: number;
  /** 最低打卡頻率 */
  frequencyMinDays: number;
  /** 最高打卡頻率 */
  frequencyMaxDays: number;
  /** 目標打卡次數 */
  targetCheckIns: number;
}

/**
 * PE02: 首次打卡鼓勵郵件變數
 */
export interface FirstCheckInEmailVariables extends PracticeEmailBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.FIRST_CHECKIN;
  /** 打卡日期 */
  checkInDate: string;
  /** 進度百分比 */
  progressPercentage: number;
  /** 鼓勵句 */
  encouragement: string;
}

/**
 * 週報郵件基礎變數
 */
export interface WeeklySummaryBaseVariables extends PracticeEmailBaseVariables {
  /** 週次 */
  weekNumber: number;
  /** 本週打卡次數 */
  weeklyCheckIns: number;
  /** 累計打卡次數 */
  totalCheckIns: number;
  /** 目標打卡次數 */
  targetCheckIns: number;
  /** 進度百分比 */
  progressPercentage: number;
  /** 剩餘天數 */
  remainingDays: number;
}

/**
 * PE03: 週報（進行中，有打卡）
 */
export interface WeeklyActiveEmailVariables extends WeeklySummaryBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.WEEKLY_ACTIVE;
  /** 當前連續天數 */
  currentStreak: number;
}

/**
 * PE04: 週報（進行中，無打卡）
 */
export interface WeeklyInactiveEmailVariables extends WeeklySummaryBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.WEEKLY_INACTIVE;
  /** 距上次打卡天數 */
  daysSinceLastCheckIn: number;
}

/**
 * PE05: 週報（從建立至今從未打卡）
 */
export interface WeeklyNeverCheckInEmailVariables extends WeeklySummaryBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.WEEKLY_NEVER_CHECKIN;
  /** 建立至今天數 */
  daysSinceCreation: number;
}

/**
 * PE06: 週報（當週無打卡但累積有打卡）
 */
export interface WeeklySkipEmailVariables extends WeeklySummaryBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.WEEKLY_SKIP;
  /** 距上次打卡天數 */
  daysSinceLastCheckIn: number;
  /** 累計打卡次數 */
  accumulatedCheckIns: number;
}

/**
 * 結束總結郵件基礎變數
 */
export interface FinalSummaryBaseVariables extends PracticeEmailBaseVariables {
  /** 實際持續天數 */
  actualDurationDays: number;
  /** 總打卡次數 */
  totalCheckIns: number;
  /** 目標打卡次數 */
  targetCheckIns: number;
  /** 最高連續天數 */
  maxStreak: number;
  /** 最終進度百分比 */
  finalProgressPercentage: number;
}

/**
 * PE07: 結束總結（成功完成）
 */
export interface FinalSuccessEmailVariables extends FinalSummaryBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.FINAL_SUCCESS;
  /** 成就徽章（如果有） */
  achievementBadge?: string;
}

/**
 * PE08: 結束總結（未達標）
 */
export interface FinalIncompleteEmailVariables extends FinalSummaryBaseVariables {
  code: typeof PRACTICE_EMAIL_CODES.FINAL_INCOMPLETE;
  /** 鼓勵訊息 */
  encouragementMessage: string;
}

/**
 * 週報郵件代碼類型（PE03-PE06）
 */
export type WeeklySummaryEmailCode = 'PE03' | 'PE04' | 'PE05' | 'PE06';

/**
 * 結束總結郵件代碼類型（PE07-PE08）
 */
export type FinalSummaryEmailCode = 'PE07' | 'PE08';

/**
 * 週報郵件簡化變數（PE03-PE06 通用）
 */
export interface WeeklySummaryEmailVariables extends PracticeEmailBaseVariables {
  code: WeeklySummaryEmailCode;
  /** 本週打卡次數 */
  weeklyCount: number;
  /** 累計打卡次數 */
  totalCount: number;
  /** 本週筆記摘要 */
  weeklyNoteSnippet?: string;
  /** 進度百分比 */
  progressPercentage: number;
}

/**
 * 結束總結郵件簡化變數（PE07-PE08 通用）
 */
export interface FinalSummaryEmailVariables extends PracticeEmailBaseVariables {
  code: FinalSummaryEmailCode;
  /** 持續天數 */
  durationDays: number;
  /** 總打卡次數 */
  totalCheckIns: number;
  /** 目標打卡次數 */
  targetCheckIns: number;
  /** 進度百分比 */
  progressPercentage: number;
  /** 最佳筆記摘要 */
  bestNoteSnippet?: string;
  /** 最佳筆記日期 */
  bestNoteDate?: string;
}

/**
 * 所有實踐郵件變數的聯合類型
 */
export type PracticeEmailVariables =
  | PracticeCreatedEmailVariables
  | FirstCheckInEmailVariables
  | WeeklyActiveEmailVariables
  | WeeklyInactiveEmailVariables
  | WeeklyNeverCheckInEmailVariables
  | WeeklySkipEmailVariables
  | FinalSuccessEmailVariables
  | FinalIncompleteEmailVariables
  | WeeklySummaryEmailVariables
  | FinalSummaryEmailVariables;

/**
 * 郵件任務資料
 */
export interface PracticeEmailJobData {
  /** 郵件代碼 */
  emailCode: PracticeEmailCode;
  /** 實踐 ID */
  practiceId: number;
  /** 使用者 ID */
  userId: number;
  /** 額外資料 */
  metadata?: Record<string, unknown>;
}

/**
 * 排程任務類型
 */
export type PracticeEmailScheduleType =
  | 'weekly-summary'    // 每週日寄送週報
  | 'final-summary';    // 實踐結束時寄送

/**
 * 排程任務配置
 */
export interface PracticeEmailScheduleConfig {
  type: PracticeEmailScheduleType;
  /** Cron 表達式（例如：'0 9 * * 0' 表示每週日早上 9 點） */
  cron: string;
  /** 時區 */
  timezone: string;
}

/**
 * 預設排程配置
 */
export const DEFAULT_EMAIL_SCHEDULES: Record<PracticeEmailScheduleType, PracticeEmailScheduleConfig> = {
  'weekly-summary': {
    type: 'weekly-summary',
    cron: '0 9 * * 0', // 每週日早上 9 點
    timezone: 'Asia/Taipei',
  },
  'final-summary': {
    type: 'final-summary',
    cron: '0 10 * * *', // 每天早上 10 點檢查結束的實踐
    timezone: 'Asia/Taipei',
  },
};
