/**
 * 郵件模板資料介面
 * 各種郵件模板所需的資料結構
 */

/**
 * 歡迎信資料
 * 根據 referralGroup 決定使用哪個版本：
 * - 'social-media': 社群媒體來源版本（強調學習社群）
 * - 'community': 社群/朋友介紹版本（強調學習夥伴）
 * - 'default': 預設版本（詳細引導）
 */
export interface WelcomeEmailData {
  /** 使用者名稱 */
  name: string;

  /** 來源管道群組（由 referral_source 決定） */
  referralGroup: 'social-media' | 'community' | 'default';

  /** 主題實踐連結 */
  practiceUrl?: string;

  /** 海星插圖 URL */
  illustrationUrl?: string;

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
