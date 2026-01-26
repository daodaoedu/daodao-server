/**
 * 郵件模板資料介面
 * 各種郵件模板所需的資料結構
 */

/**
 * 歡迎信資料
 * 根據 hasCompletedQuiz 決定使用哪個版本：
 * - true: 已做測驗版本（簡短，1 個 CTA）
 * - false: 未做測驗版本（詳細，2 個 CTA）
 */
export interface WelcomeEmailData {
  /** 使用者名稱 */
  name: string;

  /** 是否已完成學習類型測驗 */
  hasCompletedQuiz: boolean;

  /** 主題實踐連結（兩版本共用） */
  practiceUrl?: string;

  /** 學習類型測驗連結（僅未做測驗版本使用） */
  quizUrl?: string;

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
