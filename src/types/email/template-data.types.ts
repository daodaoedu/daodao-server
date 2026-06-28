/**
 * 郵件模板資料介面
 * 各種郵件模板所需的資料結構
 */

/**
 * 歡迎信資料
 */
export interface WelcomeEmailData {
  /** 使用者名稱 */
  name: string;

  /** @deprecated 已統一版本，不再分版 */
  referralGroup?: 'social-media' | 'community' | 'default';

  /** CTA 連結（預設為前台首頁） */
  practiceUrl?: string;

  /** 取消訂閱連結 */
  unsubscribeUrl?: string;
}

export interface VerificationEmailData {
  name?: string;
  verifyLink: string;
}

export interface ContactEmailData {
  name: string;
  message: string;
  userInfo?: string | string[];
  activityTitle?: string;
  url?: string;
  userId?: string;
  roleList?: string[];
  photoUrl?: string;
}

export interface MarathonEmailData {
  name: string;
  marathonTitle: string;
  marathonDate?: string;
  marathonDescription?: string;
}

export interface PasswordResetEmailData {
  name?: string;
  resetLink: string;
}

export interface CustomEmailData {
  subject: string;
  content: string;
}

/**
 * 郵件模板數據類型映射
 * 用於類型安全的模板渲染
 */
export interface EmailTemplateDataMap {
  welcome: WelcomeEmailData;
  verification: {
    verifyLink: string;
    name?: string;
  };
  'password-reset': {
    resetLink: string;
    name?: string;
  };
  contact: {
    name: string;
    message: string;
    userInfo?: string | string[];
    activityTitle?: string;
    url?: string;
    userId?: string;
    roleList?: string[];
    photoUrl?: string;
  };
}
