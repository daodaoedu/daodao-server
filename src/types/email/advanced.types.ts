/**
 * 郵件進階型別定義
 * 包含隊列、統計、訂閱等進階功能的型別
 */

import type { EmailTypeValue, EmailStatusValue } from './base.types';
import type { EmailTemplate } from './options.types';

/**
 * 郵件隊列項目
 */
export interface EmailQueueItem {
  id: string;
  type: EmailTypeValue;
  to: string;
  from?: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  status: EmailStatusValue;
  createdAt: Date;
  sentAt?: Date;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
}

/**
 * 郵件統計
 */
export interface EmailStats {
  sent: number;
  failed: number;
  pending: number;
  bounced: number;
  openRate?: number;
  clickRate?: number;
}

/**
 * 郵件驗證結果
 */
export interface EmailValidationResult {
  isValid: boolean;
  email: string;
  reason?: string;
  suggestions?: string[];
}

/**
 * 批量郵件選項
 */
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

/**
 * 郵件訂閱狀態
 */
export const SUBSCRIPTION_STATUS = {
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  BOUNCED: 'bounced',
  PENDING: 'pending',
} as const;

export type SubscriptionStatusValue = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/**
 * 郵件訂閱者
 */
export interface EmailSubscriber {
  id: string;
  email: string;
  name?: string;
  status: SubscriptionStatusValue;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 郵件活動
 */
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

/**
 * 郵件附件
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  cid?: string; // Content-ID for inline attachments
}

/**
 * 進階郵件選項
 */
export interface AdvancedEmailOptions {
  to: string;
  from?: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  trackOpens?: boolean;
  trackClicks?: boolean;
  unsubscribeUrl?: string;
  tags?: string[];
}
