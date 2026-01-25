/**
 * 郵件服務介面
 * 定義郵件服務的核心介面和結果類型
 */

import type { WelcomeEmailData } from './template-data.types';
import type { EmailTemplate } from './options.types';
import type { EmailStats } from './advanced.types';

/**
 * 郵件發送結果
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 郵件配置
 */
export interface EmailConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * 郵件服務介面
 */
export interface EmailServiceInterface {
  /**
   * 發送歡迎郵件
   * @param email 收件人 Email
   * @param data 歡迎信資料（包含 hasCompletedQuiz 決定使用哪個版本）
   */
  sendWelcomeEmail(email: string, data: WelcomeEmailData): Promise<EmailResult>;

  /**
   * 發送驗證郵件
   */
  sendVerificationEmail(email: string, token: string): Promise<EmailResult>;

  /**
   * 發送密碼重設郵件
   */
  sendPasswordResetEmail(email: string, token: string): Promise<EmailResult>;

  /**
   * 發送聯絡郵件
   */
  sendContactEmail(to: string, name: string, message: string, userInfo?: string | string[], activityTitle?: string): Promise<EmailResult>;

  /**
   * 發送馬拉松郵件
   */
  sendMarathonEmail(email: string, name: string, marathonTitle: string, marathonDate?: string, marathonDescription?: string): Promise<EmailResult>;

  /**
   * 發送自定義郵件
   */
  sendCustomEmail(to: string, subject: string, htmlContent: string): Promise<EmailResult>;

  /**
   * 批量發送郵件
   */
  sendBulkEmail(recipients: { email: string; data: unknown }[], template: string): Promise<{ success: number; failed: number; results: EmailResult[] }>;

  /**
   * 驗證郵件地址
   */
  validateEmailAddress(email: string): boolean;

  /**
   * 獲取郵件統計
   */
  getStats(): EmailStats;

  /**
   * 檢查郵件服務健康狀態
   */
  checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; lastCheck: Date; transporterConnected: boolean; error?: string }>;

  /**
   * 發送帶模板的郵件
   */
  sendTemplatedEmail(to: string, template: EmailTemplate, data: Record<string, unknown>): Promise<EmailResult>;
}
