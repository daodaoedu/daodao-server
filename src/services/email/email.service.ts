/**
 * 增強的郵件服務類
 * 基於原本的 JavaScript 邏輯實現 TypeScript 版本
 */

import nodemailer from 'nodemailer';
import { emailConfig } from '../../config/email.config';
import { EmailTemplateService } from './template.service';
import { createSuccessResponse } from '../../utils/response-helper';
import { ApiSuccessResponse } from '../../types/api-response.types';
import { isValidEmail } from '../../utils/sanitize';
import {
  createEmailLog,
  hasEmailBeenSent,
  recordEmailOpen,
  updateEmailLogStatus,
} from './email-log.service';
import type { EmailTemplateContent, WelcomeEmailData } from '../../types/email';
import { EMAIL_TYPES } from '../../types/email';
import { EMAIL_ERROR_CODES, getErrorMessage } from '../../constants/errors';
import type { Logger } from '../../types/logger.types';

export interface EmailSendOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  accepted?: string[];
  rejected?: string[];
}

/**
 * 帶有用戶 ID 的歡迎信資料
 * 用於整合 email_logs 記錄功能
 */
export interface WelcomeEmailDataWithUser extends WelcomeEmailData {
  userId: number;
}

export interface EmailServiceStats {
  totalSent: number;
  totalFailed: number;
  lastSentAt?: Date;
  lastFailedAt?: Date;
  isHealthy: boolean;
}

export interface EmailServiceHealthCheck {
  status: 'healthy' | 'unhealthy';
  lastCheck: Date;
  transporterConnected: boolean;
  error?: string;
}

/**
 * 郵件服務類
 * 處理所有郵件發送相關的邏輯
 */
export class EmailService {
  private transporter?: nodemailer.Transporter;
  private templateService: EmailTemplateService;
  private logger?: Logger;
  private stats: EmailServiceStats;
  private isConfigured: boolean = false;

  constructor(templateService: EmailTemplateService, logger?: Logger) {
    this.templateService = templateService;
    this.logger = logger;
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      isHealthy: true
    };
    
    // 創建 nodemailer 傳輸器（如果配置可用）
    if (!emailConfig) {
      console.warn('郵件配置初始化失敗，將在實際使用時重試: 缺少必要的郵件環境變數: EMAIL_ADDRESS, EMAIL_PASSWORD, FRONTEND_URL');
      return;
    }
    
    this.isConfigured = true;
    this.transporter = nodemailer.createTransport({
      service: emailConfig.smtp.service,
      auth: {
        user: emailConfig.smtp.auth.user,
        pass: emailConfig.smtp.auth.pass
      }
    });
  }

  /**
   * 發送郵件的核心方法
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    try {
      // 檢查是否已配置
      if (!this.isConfigured || !this.transporter) {
        return {
          success: false,
          error: getErrorMessage(EMAIL_ERROR_CODES.NOT_CONFIGURED)
        };
      }

      const mailOptions = {
        from: options.from || `${emailConfig?.sender.name} <${emailConfig?.sender.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        attachments: options.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // 更新統計
      this.stats.totalSent++;
      this.stats.lastSentAt = new Date();
      this.stats.isHealthy = true;

      this.logger?.info(`郵件發送成功 - 收件人: ${options.to}, 主旨: ${options.subject}`);

      return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted as string[],
        rejected: result.rejected as string[]
      };
    } catch (error) {
      // 更新統計
      this.stats.totalFailed++;
      this.stats.lastFailedAt = new Date();
      
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      this.logger?.error(`郵件發送失敗 - 收件人: ${options.to}, 錯誤: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 發送歡迎郵件
   * @param to 收件人 Email
   * @param data 歡迎信資料（包含 hasCompletedQuiz 決定使用哪個版本）
   */
  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<EmailSendResult> {
    const template = this.templateService.generateWelcomeEmail(data);

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html
    });
  }

  /**
   * 發送歡迎郵件（含發送紀錄整合）
   * 會自動檢查是否已發送過，並記錄到 email_logs
   * @param to 收件人 Email
   * @param data 歡迎信資料（包含 userId 用於記錄）
   */
  async sendWelcomeEmailWithLog(to: string, data: WelcomeEmailDataWithUser): Promise<EmailSendResult> {
    const { userId, ...templateData } = data;

    // 1. 檢查是否已發送過歡迎信
    try {
      const alreadySent = await hasEmailBeenSent({
        userId,
        emailType: EMAIL_TYPES.AUTH_REGISTER,
      });

      if (alreadySent) {
        this.logger?.warn(`歡迎信已發送過 - 用戶 ID: ${userId}`);
        return { success: false, error: getErrorMessage(EMAIL_ERROR_CODES.ALREADY_SENT) };
      }
    } catch (error) {
      // 檢查失敗應該拒絕發送，採用保守策略
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      this.logger?.error(`檢查歡迎信發送狀態失敗 - 用戶 ID: ${userId}, 錯誤: ${errorMessage}`);
      return {
        success: false,
        error: getErrorMessage(EMAIL_ERROR_CODES.LOG_QUERY_FAILED)
      };
    }

    // 2. 先建立發送紀錄（含 tracking_token），狀態為 pending
    let logRecord;
    try {
      logRecord = await createEmailLog({
        userId,
        emailType: EMAIL_TYPES.AUTH_REGISTER,
        subject: '歡迎加入島島阿學',
        status: 'pending',
      });
    } catch (error) {
      this.logger?.error(`建立歡迎信發送紀錄失敗 - 用戶 ID: ${userId}`);
      return { success: false, error: '建立郵件紀錄失敗' };
    }

    // 3. 用 tracking_token 產生帶追蹤像素的郵件內容
    const template = this.templateService.generateWelcomeEmail(templateData, logRecord.tracking_token ?? undefined);

    // 4. 發送郵件
    const result = await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
    });

    // 5. 更新發送紀錄狀態
    try {
      await updateEmailLogStatus(
        logRecord.id,
        result.success ? 'sent' : 'failed'
      );
    } catch (error) {
      this.logger?.error(`更新歡迎信發送紀錄狀態失敗 - 用戶 ID: ${userId}`);
    }

    return result;
  }

  /**
   * 發送歡迎郵件 (API 版本)
   * @param to 收件人 Email
   * @param data 歡迎信資料（包含 hasCompletedQuiz 決定使用哪個版本）
   */
  async sendWelcomeEmailApi(to: string, data: WelcomeEmailData): Promise<ApiSuccessResponse<{ messageId?: string }>> {
    const result = await this.sendWelcomeEmail(to, data);

    if (!result.success) {
      throw new Error(result.error || '發送歡迎郵件失敗');
    }

    const templateVersion = data.hasCompletedQuiz ? 'welcome-completed' : 'welcome-pending';

    return createSuccessResponse({
      messageId: result.messageId
    }, {
      message: '歡迎郵件發送成功',
      aggregateData: {
        emailInfo: {
          recipient: to,
          template: templateVersion,
          sentAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * 發送驗證郵件
   */
  async sendVerificationEmail(to: string, verifyLink: string, name?: string): Promise<EmailSendResult> {
    const template = this.templateService.generateVerificationEmail({ verifyLink, name });
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html
    });
  }

  /**
   * 發送驗證郵件 (API 版本)
   */
  async sendVerificationEmailApi(to: string, verifyLink: string, name?: string): Promise<ApiSuccessResponse<{ messageId?: string }>> {
    const result = await this.sendVerificationEmail(to, verifyLink, name);
    
    if (!result.success) {
      throw new Error(result.error || '發送驗證郵件失敗');
    }

    return createSuccessResponse({
      messageId: result.messageId
    }, {
      message: '驗證郵件發送成功',
      aggregateData: {
        emailInfo: {
          recipient: to,
          template: 'verification',
          sentAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * 發送聯絡郵件
   */
  async sendContactEmail(
    to: string, 
    fromName: string, 
    message: string, 
    userInfo?: string | string[], 
    activityTitle?: string
  ): Promise<EmailSendResult> {
    const template = this.templateService.generateContactEmail({
      name: fromName,
      message,
      userInfo,
      activityTitle
    });
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html
    });
  }

  /**
   * 發送馬拉松郵件
   */
  async sendMarathonEmail(
    to: string, 
    name: string, 
    marathonTitle: string, 
    marathonDate?: string, 
    marathonDescription?: string
  ): Promise<EmailSendResult> {
    const template = this.templateService.generateMarathonEmail({
      name,
      marathonTitle,
      marathonDate,
      marathonDescription
    });
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html
    });
  }

  /**
   * 發送密碼重設郵件
   */
  async sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<EmailSendResult> {
    const template = this.templateService.generatePasswordResetEmail({ resetLink, name });
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html
    });
  }

  /**
   * 發送自定義郵件
   */
  async sendCustomEmail(
    to: string | string[], 
    subject: string, 
    html: string, 
    options?: {
      from?: string;
      replyTo?: string;
      cc?: string[];
      bcc?: string[];
      attachments?: any[];
    }
  ): Promise<EmailSendResult> {
    return this.sendEmail({
      to,
      subject,
      html,
      ...options
    });
  }

  /**
   * 批量發送郵件
   */
  async sendBulkEmail(
    recipients: { email: string; data: any }[],
    templateType: 'welcome' | 'verification' | 'contact' | 'marathon' | 'custom',
    customTemplate?: { subject: string; html: string }
  ): Promise<{ success: number; failed: number; results: EmailSendResult[] }> {
    const results: EmailSendResult[] = [];
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      let template: EmailTemplateContent;
      
      if (templateType === 'custom' && customTemplate) {
        template = customTemplate;
      } else {
        // 根據類型生成模板
        switch (templateType) {
          case 'welcome':
            template = this.templateService.generateWelcomeEmail(recipient.data);
            break;
          case 'verification':
            template = this.templateService.generateVerificationEmail(recipient.data);
            break;
          case 'contact':
            template = this.templateService.generateContactEmail(recipient.data);
            break;
          case 'marathon':
            template = this.templateService.generateMarathonEmail(recipient.data);
            break;
          default:
            template = { subject: '無效模板', html: '無效模板' };
        }
      }

      const result = await this.sendEmail({
        to: recipient.email,
        subject: template.subject,
        html: template.html
      });

      results.push(result);
      
      if (result.success) {
        success++;
      } else {
        failed++;
      }

      // 為了避免被郵件服務商限制，在批量發送時添加延遲
      await new Promise(resolve => setTimeout(resolve, emailConfig?.bulk.delayMs || 100));
    }

    return { success, failed, results };
  }

  /**
   * 帶重試機制的郵件發送
   */
  async sendEmailWithRetry(options: EmailSendOptions): Promise<EmailSendResult> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= (emailConfig?.retry.maxAttempts || 3); attempt++) {
      const result = await this.sendEmail(options);
      
      if (result.success) {
        if (attempt > 1) {
          this.logger?.info(`郵件在第 ${attempt} 次嘗試後發送成功`);
        }
        return result;
      }
      
      lastError = result.error || '未知錯誤';
      
      if (attempt < (emailConfig?.retry.maxAttempts || 3)) {
        this.logger?.warn(`郵件發送失敗，將在 ${emailConfig?.retry.backoffMs || 1000}ms 後重試 (嘗試 ${attempt}/${emailConfig?.retry.maxAttempts || 3})`);
        await new Promise(resolve => setTimeout(resolve, (emailConfig?.retry.backoffMs || 1000) * attempt));
      }
    }
    
    this.logger?.error(`郵件發送在 ${emailConfig?.retry.maxAttempts || 3} 次嘗試後仍然失敗: ${lastError}`);
    return { success: false, error: `重試失敗: ${lastError}` };
  }

  /**
   * 驗證郵件地址格式（RFC 5322 標準）
   */
  validateEmailAddress(email: string): boolean {
    return isValidEmail(email);
  }

  /**
   * 檢查郵件服務健康狀態
   */
  async checkHealth(): Promise<EmailServiceHealthCheck> {
    try {
      if (!this.isConfigured || !this.transporter) {
        return {
          status: 'unhealthy',
          lastCheck: new Date(),
          transporterConnected: false,
          error: 'Email service is not configured'
        };
      }

      await this.transporter.verify();
      
      return {
        status: 'healthy',
        lastCheck: new Date(),
        transporterConnected: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        transporterConnected: false,
        error: errorMessage
      };
    }
  }

  /**
   * 獲取服務統計
   */
  getStats(): EmailServiceStats {
    return { ...this.stats };
  }

  /**
   * 重置統計
   */
  resetStats(): void {
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      isHealthy: true
    };
  }

  /**
   * 關閉郵件服務（清理資源）
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
    }
    this.logger?.info('郵件服務已關閉');
  }
}

// 創建並導出郵件服務實例
const templateService = new EmailTemplateService();
export const emailService = new EmailService(templateService);

// 導出 API 版本的郵件服務函數
export const sendWelcomeEmailApi = emailService.sendWelcomeEmailApi.bind(emailService);
export const sendVerificationEmailApi = emailService.sendVerificationEmailApi.bind(emailService);

// 導出帶發送紀錄的歡迎郵件函數
export const sendWelcomeEmailWithLog = emailService.sendWelcomeEmailWithLog.bind(emailService);

// 重新導出 email-log.service 的函數
export {
  createEmailLog,
  hasEmailBeenSent,
  recordEmailOpen,
} from './email-log.service';

export default emailService;