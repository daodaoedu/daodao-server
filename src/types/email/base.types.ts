/**
 * 郵件基礎型別定義
 * 包含核心常量和基礎介面
 */

/**
 * 郵件模板內容結構
 */
export interface EmailTemplateContent {
  subject: string;
  html: string;
}

/**
 * 郵件類型
 * 對應 email_logs 資料表的 email_type 欄位
 */
export const EMAIL_TYPES = {
  // 認證相關
  AUTH_REGISTER: 'auth_register',
  AUTH_PASSWORD_RESET: 'auth_password_reset',
  AUTH_EMAIL_VERIFY: 'auth_email_verify',
  // 主題實踐相關
  PRACTICE_CREATED: 'practice_created',
  PRACTICE_FIRST_CHECKIN: 'practice_first_checkin',
  PRACTICE_WEEKLY_SUMMARY: 'practice_weekly_summary',
  PRACTICE_FINAL_SUMMARY: 'practice_final_summary',
  // 聯絡 / 活動
  CONTACT: 'contact',
  MARATHON: 'marathon',
  // 其他
  NOTIFICATION: 'notification',
  WELCOME_LETTER: 'welcome_letter',
  NOTIFICATION_DIGEST: 'notification_digest',
  NOTIFICATION_WEEKLY: 'notification_weekly',
  REACTION_NOTIFICATION: 'reaction_notification',
  // Onboarding 系列
  ONBOARDING_L0: 'onboarding_l0',
  ONBOARDING_A: 'onboarding_a',
  ONBOARDING_B: 'onboarding_b',
  ONBOARDING_C: 'onboarding_c',
  ONBOARDING_D: 'onboarding_d',
  ONBOARDING_E: 'onboarding_e',
} as const;

export type EmailTypeValue = (typeof EMAIL_TYPES)[keyof typeof EMAIL_TYPES];

/**
 * 郵件發送狀態
 */
export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type EmailStatusValue = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS];

/**
 * 郵件記錄資料
 * 用於記錄到 email_logs 資料表
 */
export interface EmailLogData {
  userId: number;
  emailType: EmailTypeValue;
  entityType?: string;
  entityId?: number;
  emailCode?: string;
  subject: string;
  status?: EmailStatusValue;
  trackingToken?: string;
}
