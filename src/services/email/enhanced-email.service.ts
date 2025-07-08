/**
 * 增強的郵件服務
 * 支持重試機制、錯誤處理、批量發送等功能
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { emailConfig } from '../../config/email.config';
import { emailTemplateService, EmailTemplate } from './template.service';
import type { 
  EmailService, 
  EmailResult, 
  EmailValidationResult,
  EmailStats,
  BulkEmailOptions,
  ContactEmailOptions,
  MarathonEmailOptions
} from '../../types/email.types';

/**
 * 邮件发送记录
 */
interface EmailRecord {
  to: string;
  subject: string;
  template: string;
  success: boolean;
  timestamp: Date;
  attempts: number;
  error?: string;
}

/**
 * 增強的郵件服務實現
 */
export class EnhancedEmailService {
  private transporter!: Transporter;
  private emailRecords: EmailRecord[] = [];
  private rateLimitCounter: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.initializeTransporter();
  }

  /**
   * 初始化郵件傳輸器
   */
  private initializeTransporter(): void {
    const { smtp } = emailConfig;
    
    this.transporter = nodemailer.createTransport({
      service: smtp.service,
      auth: smtp.auth,
      // 連接池配置
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // 超時配置
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });

    // 驗證配置
    this.verifyConnection();
  }

  /**
   * 驗證郵件服務連接
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('郵件服務連接成功');
    } catch (error) {
      console.error('郵件服務連接失敗:', error);
      throw new Error(`郵件服務初始化失敗: ${error}`);
    }
  }

  /**
   * 檢查速率限制
   */
  private checkRateLimit(email: string): boolean {
    const now = Date.now();
    const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
    const key = `${email}_${hourStart}`;
    
    const record = this.rateLimitCounter.get(key);
    if (!record) {
      this.rateLimitCounter.set(key, { count: 1, resetTime: hourStart + 60 * 60 * 1000 });
      return true;
    }
    
    if (now > record.resetTime) {
      this.rateLimitCounter.set(key, { count: 1, resetTime: hourStart + 60 * 60 * 1000 });
      return true;
    }
    
    // 設置簡單的速率限制：每小時最多100封郵件
    if (record.count >= 100) {
      return false;
    }
    
    record.count++;
    return true;
  }

  /**
   * 記錄郵件發送結果
   */
  private recordEmail(record: EmailRecord): void {
    this.emailRecords.push(record);
    
    // 保持最近 1000 條記錄
    if (this.emailRecords.length > 1000) {
      this.emailRecords = this.emailRecords.slice(-1000);
    }
  }

  /**
   * 核心郵件發送方法（帶重試機制）
   */
  private async sendEmailWithRetry(
    to: string,
    subject: string,
    html: string,
    text?: string,
    attempts: number = 0
  ): Promise<EmailResult> {
    const { retry } = emailConfig;
    
    try {
      // 檢查速率限制
      if (!this.checkRateLimit(to)) {
        throw new Error(`郵件發送頻率過高，請稍後再試`);
      }

      const mailOptions = {
        from: `${emailConfig.sender.name} <${emailConfig.sender.email}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // 簡單的 HTML 轉文本
        headers: {
          'X-Mailer': '島島阿學 Email Service',
          'X-Priority': '3',
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      const emailRecord: EmailRecord = {
        to,
        subject,
        template: 'unknown',
        success: true,
        timestamp: new Date(),
        attempts: attempts + 1
      };
      this.recordEmail(emailRecord);

      console.log('郵件發送成功:', { to, subject, messageId: result.messageId });
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 如果還有重試次數，則重試
      if (attempts < retry.maxAttempts) {
        const backoffMs = Math.min(
          retry.backoffMs * Math.pow(2, attempts),
          10000 // 最大延遲10秒
        );
        
        console.warn(`郵件發送失敗，${backoffMs}ms 後重試 (${attempts + 1}/${retry.maxAttempts}):`, errorMessage);
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.sendEmailWithRetry(to, subject, html, text, attempts + 1);
      }
      
      // 記錄失敗
      const emailRecord: EmailRecord = {
        to,
        subject,
        template: 'unknown',
        success: false,
        timestamp: new Date(),
        attempts: attempts + 1,
        error: errorMessage
      };
      this.recordEmail(emailRecord);

      console.error('郵件發送最終失敗:', { to, subject, error: errorMessage, attempts: attempts + 1 });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 發送歡迎郵件
   */
  async sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
    // 歡迎郵件功能預設啟用

    try {
      const template = emailTemplateService.generateWelcomeEmail({ name });
      return await this.sendEmailWithRetry(email, template.subject, template.html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `生成歡迎郵件失敗: ${errorMessage}` };
    }
  }

  /**
   * 發送驗證郵件
   */
  async sendVerificationEmail(email: string, token: string): Promise<EmailResult> {
    // 驗證郵件功能預設啟用

    try {
      const verifyLink = `${emailConfig.urls.frontend}/auth/verify?token=${token}`;
      const template = emailTemplateService.generateVerificationEmail({ verifyLink });
      return await this.sendEmailWithRetry(email, template.subject, template.html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `生成驗證郵件失敗: ${errorMessage}` };
    }
  }

  /**
   * 發送密碼重設郵件
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
    // 密碼重設郵件功能預設啟用

    try {
      const resetLink = `${emailConfig.urls.frontend}/auth/reset-password?token=${token}`;
      const template = emailTemplateService.generatePasswordResetEmail({ resetLink });
      return await this.sendEmailWithRetry(email, template.subject, template.html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `生成密碼重設郵件失敗: ${errorMessage}` };
    }
  }

  /**
   * 發送聯絡郵件
   */
  async sendContactEmail(options: ContactEmailOptions): Promise<EmailResult> {
    // 聯絡郵件功能預設啟用

    try {
      const template = emailTemplateService.generateContactEmail(options.data);
      
      // 發送給接收者
      const recipientResult = await this.sendEmailWithRetry(
        options.to, 
        template.subject, 
        template.html
      );
      
      // 發送副本給發送者
      const senderTemplate = emailTemplateService.generateContactEmail({
        ...options.data,
        message: `副本：${options.data.message}`
      });
      
      const senderResult = await this.sendEmailWithRetry(
        options.from,
        `副本：${template.subject}`,
        senderTemplate.html
      );

      return {
        success: recipientResult.success && senderResult.success,
        messageId: recipientResult.messageId,
        error: recipientResult.error || senderResult.error
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `生成聯絡郵件失敗: ${errorMessage}` };
    }
  }

  /**
   * 發送馬拉松郵件
   */
  async sendMarathonEmail(email: string, data: MarathonEmailOptions['data']): Promise<EmailResult> {
    // 馬拉松郵件功能預設啟用

    try {
      const template = emailTemplateService.generateMarathonEmail(data);
      return await this.sendEmailWithRetry(email, template.subject, template.html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `生成馬拉松郵件失敗: ${errorMessage}` };
    }
  }

  /**
   * 發送自定義郵件
   */
  async sendCustomEmail(to: string, subject: string, htmlContent: string): Promise<EmailResult> {
    try {
      return await this.sendEmailWithRetry(to, subject, htmlContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 批量發送郵件
   */
  async sendBulkEmail(options: BulkEmailOptions): Promise<EmailResult[]> {
    // 批量郵件功能預設啟用

    const results: EmailResult[] = [];
    const batchSize = 10; // 批次大小

    for (let i = 0; i < options.recipients.length; i += batchSize) {
      const batch = options.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const template = emailTemplateService.generateCustomEmail(
            options.subject,
            '', // 需要根據 template 類型生成內容
            recipient.data
          );
          
          return await this.sendEmailWithRetry(
            recipient.email,
            template.subject,
            template.html
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, error: errorMessage };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ success: false, error: result.reason?.message || '未知錯誤' });
        }
      });

      // 批次間暫停，避免過載
      if (i + batchSize < options.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * 驗證郵件地址
   */
  async validateEmail(email: string): Promise<EmailValidationResult> {
    // 基本格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        email,
        reason: '郵件地址格式不正確'
      };
    }

    // 檢查常見的打字錯誤
    const suggestions: string[] = [];
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const [localPart, domain] = email.split('@');
    
    if (domain) {
      const similarDomain = commonDomains.find(d => 
        Math.abs(d.length - domain.length) <= 2 && 
        d !== domain
      );
      if (similarDomain) {
        suggestions.push(`${localPart}@${similarDomain}`);
      }
    }

    return {
      isValid: true,
      email,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * 獲取郵件統計
   */
  async getEmailStats(startDate?: Date, endDate?: Date): Promise<EmailStats> {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // 默認過去 24 小時
    const end = endDate || now;

    const filteredRecords = this.emailRecords.filter(record => 
      record.timestamp >= start && record.timestamp <= end
    );

    const sent = filteredRecords.filter(r => r.success).length;
    const failed = filteredRecords.filter(r => !r.success).length;
    
    return {
      sent,
      failed,
      pending: 0, // 當前實現沒有隊列
      bounced: 0  // 需要實現彈回檢測
    };
  }

  /**
   * 關閉郵件服務
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

// 創建並導出增強郵件服務實例
export const enhancedEmailService = new EnhancedEmailService();
export default enhancedEmailService;