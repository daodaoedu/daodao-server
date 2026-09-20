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
  recordSkippedEmail,
  resolveUserIdByEmail,
  updateEmailLogStatus,
} from './email-log.service';
import { isSkipped, resolveTemplate, type TemplateDescriptor } from './template-resolver.service';
import {
  marathonDescriptor,
  passwordResetDescriptor,
  verificationDescriptor,
  welcomeLetterDescriptor,
} from './template-descriptors';
import type { EmailTemplateContent, WelcomeEmailData } from '../../types/email';
import { EMAIL_TYPES } from '../../types/email';
import type { EmailTypeValue } from '../../types/email';
import { EMAIL_ERROR_CODES, getErrorMessage } from '../../constants/errors';
import type { Logger } from '../../types/logger.types';
import loggerService from '../logging/logger.service';
import { enqueueEmail } from '../../queues/email.queue';

export interface EmailSendOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
  /** 追蹤 Token，若提供則自動在 </body> 前注入 1x1 tracking pixel */
  trackingToken?: string;
}

export interface EmailSendResult {
  /** 後台停用該類型模板時為 true（daodao#236 AC-02），信沒有寄出但已記錄 */
  skipped?: boolean;
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
      this.logger?.warn('郵件配置初始化失敗，將在實際使用時重試: 缺少必要的郵件環境變數: EMAIL_ADDRESS, EMAIL_PASSWORD, FRONTEND_URL');
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

      // 若有 trackingToken，在 </body> 前注入 1x1 tracking pixel
      let html = options.html;
      if (options.trackingToken) {
        const backendUrl = emailConfig?.urls.backend || process.env.BACKEND_URL || 'http://localhost:3000';
        const trackingPixel = `<img src="${backendUrl}/api/v1/email/track/open/${options.trackingToken}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
        html = html.replace('</body>', `${trackingPixel}</body>`);
      }

      const mailOptions = {
        from: options.from || `${emailConfig?.sender.name} <${emailConfig?.sender.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
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
   * 解析後台模板；後台已停用該類型時記一筆 skipped 並回傳 null
   *
   * @param descriptor 該 slug 的接線設定
   * @param data 模板資料物件
   * @param context 記 skipped log 需要的收件人與郵件類型
   * @returns 可寄送的內容；後台停用時為 null
   */
  private async resolveOrSkip<D>(
    descriptor: TemplateDescriptor<D>,
    data: D,
    context: { to: string; userId?: number; emailType: EmailTypeValue; subject: string }
  ): Promise<EmailTemplateContent | null> {
    const resolved = await resolveTemplate(descriptor, data);
    if (!isSkipped(resolved)) return resolved;

    const userId = context.userId ?? (await resolveUserIdByEmail(context.to).catch(() => null));
    if (userId) {
      await recordSkippedEmail({
        userId,
        emailType: context.emailType,
        // 記後台當下的主旨；查不到才退回預設值
        subject: resolved.subject || context.subject,
      });
    } else {
      this.logger?.info(
        `郵件因後台停用未寄出（查無用戶，未記錄 email_logs） - emailType: ${context.emailType}, 收件人: ${context.to}`
      );
    }
    return null;
  }

  /** 後台停用時的統一回傳 */
  private skippedResult(): EmailSendResult {
    return {
      success: false,
      skipped: true,
      error: getErrorMessage(EMAIL_ERROR_CODES.TEMPLATE_DISABLED),
    };
  }

  /**
   * 發送歡迎郵件
   * @param to 收件人 Email
   * @param data 歡迎信資料（包含 referralGroup 決定使用哪個版本）
   */
  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<EmailSendResult> {
    const template = await this.resolveOrSkip(welcomeLetterDescriptor(data), data, {
      to,
      emailType: EMAIL_TYPES.WELCOME_LETTER,
      subject: '【島島阿學】歡迎來到島島阿學！',
    });
    if (!template) return this.skippedResult();

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
   * @param data 歡迎信資料（包含 userId 和 referralGroup 用於記錄）
   */
  async sendWelcomeEmailWithLog(to: string, data: WelcomeEmailDataWithUser): Promise<EmailSendResult> {
    const { userId, ...templateData } = data;

    // 1. 檢查是否已發送過歡迎信
    try {
      const alreadySent = await hasEmailBeenSent({
        userId,
        emailType: EMAIL_TYPES.WELCOME_LETTER,
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

    // 2. 解析後台模板；後台停用該類型時記一筆 skipped 並結束
    const resolved = await resolveTemplate(welcomeLetterDescriptor(templateData), templateData);
    if (isSkipped(resolved)) {
      await recordSkippedEmail({
        userId,
        emailType: EMAIL_TYPES.WELCOME_LETTER,
        subject: resolved.subject || '【島島阿學】歡迎來到島島阿學！',
      });
      return this.skippedResult();
    }

    // 3. 先建立發送紀錄（含 tracking_token），狀態為 pending
    let logRecord;
    try {
      logRecord = await createEmailLog({
        userId,
        emailType: EMAIL_TYPES.WELCOME_LETTER,
        // 用解析後的主旨，後台改過主旨時紀錄才與實際寄出的信一致
        subject: resolved.subject,
        status: 'pending',
      });
    } catch (error) {
      const errorDetail = error instanceof Error ? error.message : String(error);
      this.logger?.error(`建立歡迎信發送紀錄失敗 - 用戶 ID: ${userId}: ${errorDetail}`);
      return { success: false, error: '建立郵件紀錄失敗' };
    }

    // 4. 透過 queue 發送（worker 負責更新 log 狀態）
    return this.enqueueOrSend({
      to,
      subject: resolved.subject,
      html: resolved.html,
      trackingToken: logRecord.tracking_token ?? undefined,
      emailLogId: logRecord.id,
      emailType: EMAIL_TYPES.WELCOME_LETTER,
      userId,
    });
  }

  /**
   * 發送歡迎郵件 (API 版本)
   * @param to 收件人 Email
   * @param data 歡迎信資料（包含 referralGroup 決定使用哪個版本）
   */
  async sendWelcomeEmailApi(to: string, data: WelcomeEmailData): Promise<ApiSuccessResponse<{ messageId?: string }>> {
    const result = await this.sendWelcomeEmail(to, data);

    if (!result.success) {
      throw new Error(result.error || '發送歡迎郵件失敗');
    }

    const templateVersion = 'welcome';

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
   * @param to 收件人 Email
   * @param verifyLink 驗證連結
   * @param name 用戶名稱
   * @param userId 用戶 ID（提供時會記錄到 email_logs 並注入追蹤像素）
   */
  async sendVerificationEmail(to: string, verifyLink: string, name?: string, userId?: number): Promise<EmailSendResult> {
    const template = await this.resolveOrSkip(
      verificationDescriptor,
      { verifyLink, name },
      { to, userId, emailType: EMAIL_TYPES.AUTH_EMAIL_VERIFY, subject: '【島島阿學】驗證您的電子郵件' }
    );
    if (!template) return this.skippedResult();

    return this.sendWithOptionalLog({
      to,
      subject: template.subject,
      html: template.html,
      userId,
      emailType: EMAIL_TYPES.AUTH_EMAIL_VERIFY,
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
   * @param to 收件人 Email
   * @param fromName 寄件人名稱
   * @param message 訊息內容
   * @param userInfo 用戶資訊
   * @param activityTitle 活動標題
   * @param userId 用戶 ID（提供時會記錄到 email_logs 並注入追蹤像素）
   */
  async sendContactEmail(
    to: string,
    fromName: string,
    message: string,
    userInfo?: string | string[],
    activityTitle?: string,
    userId?: number
  ): Promise<EmailSendResult> {
    const template = this.templateService.generateContactEmail({
      name: fromName,
      message,
      userInfo,
      activityTitle
    });

    return this.sendWithOptionalLog({
      to,
      subject: template.subject,
      html: template.html,
      userId,
      emailType: EMAIL_TYPES.CONTACT,
    });
  }

  /**
   * 發送馬拉松郵件
   * @param to 收件人 Email
   * @param name 用戶名稱
   * @param marathonTitle 馬拉松標題
   * @param marathonDate 馬拉松日期
   * @param marathonDescription 馬拉松描述
   * @param userId 用戶 ID（提供時會記錄到 email_logs 並注入追蹤像素）
   */
  async sendMarathonEmail(
    to: string,
    name: string,
    marathonTitle: string,
    marathonDate?: string,
    marathonDescription?: string,
    userId?: number
  ): Promise<EmailSendResult> {
    const template = await this.resolveOrSkip(
      marathonDescriptor,
      { name, marathonTitle, marathonDate, marathonDescription },
      { to, userId, emailType: EMAIL_TYPES.MARATHON, subject: '【島島阿學】馬拉松報名成功確認' }
    );
    if (!template) return this.skippedResult();

    return this.sendWithOptionalLog({
      to,
      subject: template.subject,
      html: template.html,
      userId,
      emailType: EMAIL_TYPES.MARATHON,
    });
  }

  /**
   * 發送密碼重設郵件
   * @param to 收件人 Email
   * @param resetLink 重設連結
   * @param name 用戶名稱
   * @param userId 用戶 ID（提供時會記錄到 email_logs 並注入追蹤像素）
   */
  async sendPasswordResetEmail(to: string, resetLink: string, name?: string, userId?: number): Promise<EmailSendResult> {
    const template = await this.resolveOrSkip(
      passwordResetDescriptor,
      { resetLink, name },
      { to, userId, emailType: EMAIL_TYPES.AUTH_PASSWORD_RESET, subject: '【島島阿學】密碼重設' }
    );
    if (!template) return this.skippedResult();

    return this.sendWithOptionalLog({
      to,
      subject: template.subject,
      html: template.html,
      userId,
      emailType: EMAIL_TYPES.AUTH_PASSWORD_RESET,
    });
  }

  /**
   * 內部輔助方法：先建立 email_logs (pending) 取得 trackingToken，
   * 再透過 BullMQ queue 發送郵件。Worker 負責實際發送及更新 log 狀態。
   * Queue 未初始化時自動 fallback 為同步直送。
   */
  private async sendWithOptionalLog(params: {
    to: string;
    subject: string;
    html: string;
    userId?: number;
    emailType: EmailTypeValue;
  }): Promise<EmailSendResult> {
    const { to, subject, html, emailType } = params;
    let { userId } = params;

    // 若無 userId，嘗試從收件人 email 自動解析
    if (!userId) {
      try {
        const resolvedId = await resolveUserIdByEmail(to);
        if (resolvedId) {
          userId = resolvedId;
        }
      } catch (error) {
        const errorDetail = error instanceof Error ? error.message : String(error);
        this.logger?.warn(`自動解析收件人用戶 ID 失敗 - email: ${to}: ${errorDetail}`);
      }
    }

    if (!userId) {
      return this.enqueueOrSend({ to, subject, html });
    }

    // 1. 建立 pending 紀錄，取得 trackingToken
    let logRecord;
    try {
      logRecord = await createEmailLog({
        userId,
        emailType,
        subject,
        status: 'pending',
      });
    } catch (error) {
      const errorDetail = error instanceof Error ? error.message : String(error);
      this.logger?.error(`建立郵件紀錄失敗 - emailType: ${emailType}, userId: ${userId}: ${errorDetail}`);
      return this.enqueueOrSend({ to, subject, html });
    }

    // 2. 透過 queue 發送（worker 負責更新 log 狀態）
    return this.enqueueOrSend({
      to,
      subject,
      html,
      trackingToken: logRecord.tracking_token ?? undefined,
      emailLogId: logRecord.id,
      emailType,
      userId,
    });
  }

  /**
   * 嘗試透過 queue 發送；queue 未初始化時 fallback 為直送
   */
  private async enqueueOrSend(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    trackingToken?: string;
    emailLogId?: number;
    emailType?: string;
    userId?: number;
  }): Promise<EmailSendResult> {
    let jobId: string | null = null;
    try {
      jobId = await enqueueEmail(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error(`Enqueue email 失敗，改為直接發送 - 收件人: ${params.to}, 錯誤: ${errorMessage}`);
    }

    if (jobId) {
      return { success: true };
    }

    // Queue 未初始化 — fallback 同步直送
    const result = await this.sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      from: params.from,
      replyTo: params.replyTo,
      cc: params.cc,
      bcc: params.bcc,
      trackingToken: params.trackingToken,
    });

    // Fallback 時需要自行更新 log
    if (params.emailLogId) {
      try {
        await updateEmailLogStatus(
          params.emailLogId,
          result.success ? 'sent' : 'failed'
        );
      } catch (error) {
        const errorDetail = error instanceof Error ? error.message : String(error);
        this.logger?.error(`更新郵件紀錄狀態失敗 - emailLogId: ${params.emailLogId}: ${errorDetail}`);
      }
    }

    return result;
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
      let template: EmailTemplateContent | null;

      if (templateType === 'custom' && customTemplate) {
        template = customTemplate;
      } else {
        // 有後台模板的類型一律走解析層，否則批量寄送會繞過後台的編輯與停用（daodao#236）
        switch (templateType) {
          case 'welcome':
            template = await this.resolveOrSkip(
              welcomeLetterDescriptor(recipient.data),
              recipient.data,
              {
                to: recipient.email,
                emailType: EMAIL_TYPES.WELCOME_LETTER,
                subject: '【島島阿學】歡迎來到島島阿學！',
              }
            );
            break;
          case 'verification':
            template = await this.resolveOrSkip(verificationDescriptor, recipient.data, {
              to: recipient.email,
              emailType: EMAIL_TYPES.AUTH_EMAIL_VERIFY,
              subject: '【島島阿學】驗證您的電子郵件',
            });
            break;
          case 'contact':
            // 聯絡信沒有對應的後台模板（email_templates 無此 slug），維持程式碼模板
            template = this.templateService.generateContactEmail(recipient.data);
            break;
          case 'marathon':
            template = await this.resolveOrSkip(marathonDescriptor, recipient.data, {
              to: recipient.email,
              emailType: EMAIL_TYPES.MARATHON,
              subject: '【島島阿學】馬拉松報名成功確認',
            });
            break;
          default:
            template = { subject: '無效模板', html: '無效模板' };
        }
      }

      // 後台已停用該類型：不寄出，計入 failed 並在結果標 skipped
      if (!template) {
        const skipped = this.skippedResult();
        results.push(skipped);
        failed++;
        continue;
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
export const emailService = new EmailService(templateService, loggerService);

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