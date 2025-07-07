/**
 * 郵件相關型別定義
 */

// 郵件模板類型
export type EmailTemplate = 'welcome' | 'verification' | 'password-reset' | 'contact';

// 基本郵件選項
export interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

// 歡迎郵件選項
export interface WelcomeEmailOptions {
  to: string;
  subject: string;
  template: 'welcome';
  data: {
    name: string;
  };
}

// 驗證郵件選項
export interface VerificationEmailOptions {
  to: string;
  subject: string;
  template: 'verification';
  data: {
    verifyLink: string;
  };
}

// 密碼重設郵件選項
export interface PasswordResetEmailOptions {
  to: string;
  subject: string;
  template: 'password-reset';
  data: {
    resetLink: string;
  };
}

// 聯絡郵件選項
export interface ContactEmailOptions {
  to: string;
  from: string;
  subject: string;
  name: string;
  message: string;
  userInfo?: string | string[];
  activityTitle?: string;
  data: {
    name: string;
    message: string;
    userInfo?: string | string[];
    activityTitle?: string;
  };
}

// 郵件服務介面
export interface EmailService {
  /**
   * 發送歡迎郵件
   */
  sendWelcomeEmail(email: string, name: string): Promise<boolean>;

  /**
   * 發送驗證郵件
   */
  sendVerificationEmail(email: string, token: string): Promise<boolean>;

  /**
   * 發送密碼重設郵件
   */
  sendPasswordResetEmail(email: string, token: string): Promise<boolean>;

  /**
   * 發送聯絡郵件
   */
  sendContactEmail(options: ContactEmailOptions): Promise<boolean>;

  /**
   * 發送自定義郵件
   */
  sendCustomEmail(to: string, subject: string, htmlContent: string): Promise<boolean>;
}

// 郵件配置
export interface EmailConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

// 郵件發送結果
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// 郵件模板數據類型
export interface EmailTemplateData {
  welcome: {
    name: string;
  };
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

// 郵件發送狀態
export enum EmailStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

// 郵件類型
export enum EmailType {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
  CONTACT = 'contact',
  NOTIFICATION = 'notification',
  MARKETING = 'marketing'
}

// 郵件隊列項目
export interface EmailQueueItem {
  id: string;
  type: EmailType;
  to: string;
  from?: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  status: EmailStatus;
  createdAt: Date;
  sentAt?: Date;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
}

// 郵件統計
export interface EmailStats {
  sent: number;
  failed: number;
  pending: number;
  bounced: number;
  openRate?: number;
  clickRate?: number;
}

// 郵件驗證結果
export interface EmailValidationResult {
  isValid: boolean;
  email: string;
  reason?: string;
  suggestions?: string[];
}

// 批量郵件選項
export interface BulkEmailOptions {
  template: EmailTemplate;
  subject: string;
  recipients: Array<{
    email: string;
    data: Record<string, unknown>;
  }>;
  from?: string;
  scheduledAt?: Date;
}

// 郵件訂閱狀態
export enum SubscriptionStatus {
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced',
  PENDING = 'pending'
}

// 郵件訂閱者
export interface EmailSubscriber {
  id: string;
  email: string;
  name?: string;
  status: SubscriptionStatus;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// 郵件活動
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  template: EmailTemplate;
  recipients: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  stats: EmailStats;
  createdAt: Date;
  updatedAt: Date;
}

// 郵件附件
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  cid?: string; // Content-ID for inline attachments
}

// 進階郵件選項
export interface AdvancedEmailOptions extends EmailOptions {
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  trackOpens?: boolean;
  trackClicks?: boolean;
  unsubscribeUrl?: string;
  tags?: string[];
}