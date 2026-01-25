/**
 * 郵件選項介面
 * 定義各種郵件發送選項
 */

import type {
  WelcomeEmailData,
  ContactEmailData,
} from './template-data.types';

/**
 * 郵件模板類型
 */
export type EmailTemplate = 'welcome' | 'verification' | 'password-reset' | 'contact' | 'marathon' | 'custom';

/**
 * 基本郵件選項
 */
export interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

/**
 * 歡迎郵件選項
 */
export interface WelcomeEmailOptions {
  to: string;
  subject: string;
  template: 'welcome';
  data: WelcomeEmailData;
}

/**
 * 驗證郵件選項
 */
export interface VerificationEmailOptions {
  to: string;
  subject: string;
  template: 'verification';
  data: {
    verifyLink: string;
  };
}

/**
 * 密碼重設郵件選項
 */
export interface PasswordResetEmailOptions {
  to: string;
  subject: string;
  template: 'password-reset';
  data: {
    resetLink: string;
  };
}

/**
 * 聯絡郵件選項
 */
export interface ContactEmailOptions {
  to: string;
  from: string;
  subject: string;
  name: string;
  message: string;
  userInfo?: string | string[];
  activityTitle?: string;
  data: ContactEmailData;
}

/**
 * 馬拉松郵件選項
 */
export interface MarathonEmailOptions {
  to: string;
  subject: string;
  template: 'marathon';
  data: {
    name: string;
    marathonTitle: string;
    marathonDate?: string;
    marathonDescription?: string;
  };
}
