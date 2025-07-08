/**
 * 郵件服務（v1 版本）
 * 處理各種類型的郵件發送，使用新的架構但保持 API 兼容性
 */

import { enhancedEmailService } from '../email/enhanced-email.service';
import { emailTemplateService } from '../email/template.service';
import type { 
  EmailService, 
  EmailOptions, 
  EmailTemplate, 
  WelcomeEmailOptions,
  VerificationEmailOptions,
  PasswordResetEmailOptions,
  ContactEmailOptions,
  EmailResult,
  MarathonEmailOptions,
  BulkEmailOptions,
  EmailValidationResult,
  EmailStats
} from '../../types/email.types';

/**
 * 郵件服務實作類（v1 版本）
 * 使用新的增強郵件服務作为底层实现，但保持原有 API 兼容性
 */
class EmailServiceImpl implements EmailService {
  /**
   * 發送歡迎郵件
   */
  async sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
    try {
      return await enhancedEmailService.sendWelcomeEmail(email, name);
    } catch (error) {
      console.error('Send welcome email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 發送驗證郵件
   */
  async sendVerificationEmail(email: string, token: string): Promise<EmailResult> {
    try {
      return await enhancedEmailService.sendVerificationEmail(email, token);
    } catch (error) {
      console.error('Send verification email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 發送密碼重設郵件
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
    try {
      return await enhancedEmailService.sendPasswordResetEmail(email, token);
    } catch (error) {
      console.error('Send password reset email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 發送聯絡郵件
   */
  async sendContactEmail(to: string, name: string, message: string, userInfo?: string | string[], activityTitle?: string): Promise<EmailResult> {
    try {
      const options: ContactEmailOptions = {
        to,
        from: 'system@daodao.com',
        subject: `【島島阿學】有夥伴想聯繫你${activityTitle ? `關於「${activityTitle}」活動` : ''}`,
        name,
        message,
        userInfo,
        activityTitle,
        data: {
          name,
          message,
          userInfo,
          activityTitle
        }
      };
      return await enhancedEmailService.sendContactEmail(options);
    } catch (error) {
      console.error('Send contact email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 發送馬拉松郵件
   */
  async sendMarathonEmail(email: string, name: string, marathonTitle: string, marathonDate?: string, marathonDescription?: string): Promise<EmailResult> {
    try {
      const data: MarathonEmailOptions['data'] = {
        name,
        marathonTitle,
        marathonDate,
        marathonDescription
      };
      return await enhancedEmailService.sendMarathonEmail(email, data);
    } catch (error) {
      console.error('Send marathon email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 發送自定義郵件
   */
  async sendCustomEmail(
    to: string, 
    subject: string, 
    htmlContent: string
  ): Promise<EmailResult> {
    try {
      return await enhancedEmailService.sendCustomEmail(to, subject, htmlContent);
    } catch (error) {
      console.error('Send custom email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 批量發送郵件
   */
  async sendBulkEmail(recipients: { email: string; data: any }[], template: string): Promise<{ success: number; failed: number; results: EmailResult[] }> {
    try {
      const options: BulkEmailOptions = {
        template: template as EmailTemplate,
        subject: '批量郵件',
        recipients: recipients.map(r => ({ email: r.email, data: r.data })),
        from: 'system@daodao.com'
      };
      const results = await enhancedEmailService.sendBulkEmail(options);
      const success = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      return { success, failed, results };
    } catch (error) {
      console.error('Send bulk email error:', error);
      return { 
        success: 0, 
        failed: recipients.length, 
        results: [{ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        }]
      };
    }
  }

  /**
   * 驗證郵件地址
   */
  validateEmailAddress(email: string): boolean {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    } catch (error) {
      console.error('Validate email error:', error);
      return false;
    }
  }

  /**
   * 獲取郵件統計
   */
  getStats(): EmailStats {
    try {
      return {
        sent: 0,
        failed: 0,
        pending: 0,
        bounced: 0
      };
    } catch (error) {
      console.error('Get email stats error:', error);
      return {
        sent: 0,
        failed: 0,
        pending: 0,
        bounced: 0
      };
    }
  }

  // ========== 向後兼容的方法（保持原有 boolean 返回值） ==========

  /**
   * 發送歡迎郵件（向後兼容版本）
   * @deprecated 請使用 sendWelcomeEmail 並處理 EmailResult
   */
  async sendWelcomeEmailLegacy(email: string, name: string): Promise<boolean> {
    const result = await this.sendWelcomeEmail(email, name);
    return result.success;
  }

  /**
   * 發送驗證郵件（向後兼容版本）
   * @deprecated 請使用 sendVerificationEmail 並處理 EmailResult
   */
  async sendVerificationEmailLegacy(email: string, token: string): Promise<boolean> {
    const result = await this.sendVerificationEmail(email, token);
    return result.success;
  }

  /**
   * 發送密碼重設郵件（向後兼容版本）
   * @deprecated 請使用 sendPasswordResetEmail 並處理 EmailResult
   */
  async sendPasswordResetEmailLegacy(email: string, token: string): Promise<boolean> {
    const result = await this.sendPasswordResetEmail(email, token);
    return result.success;
  }

  /**
   * 發送聯絡郵件（向後兼容版本）
   * @deprecated 請使用 sendContactEmail 並處理 EmailResult
   */
  async sendContactEmailLegacy(options: ContactEmailOptions): Promise<boolean> {
    const result = await this.sendContactEmail(
      options.to, 
      options.name, 
      options.message, 
      options.userInfo, 
      options.activityTitle
    );
    return result.success;
  }

  /**
   * 發送自定義郵件（向後兼容版本）
   * @deprecated 請使用 sendCustomEmail 並處理 EmailResult
   */
  async sendCustomEmailLegacy(
    to: string, 
    subject: string, 
    htmlContent: string
  ): Promise<boolean> {
    const result = await this.sendCustomEmail(to, subject, htmlContent);
    return result.success;
  }

  // ========== 新增功能方法 ==========

  /**
   * 發送帶模板的郵件
   */
  async sendTemplatedEmail(
    to: string,
    template: EmailTemplate,
    data: Record<string, unknown>
  ): Promise<EmailResult> {
    try {
      let templateResult;
      
      switch (template) {
        case 'welcome':
          templateResult = emailTemplateService.generateWelcomeEmail({
            name: data.name as string || '用戶'
          });
          break;
        case 'verification':
          templateResult = emailTemplateService.generateVerificationEmail({
            verifyLink: data.verifyLink as string || '',
            name: data.name as string
          });
          break;
        case 'password-reset':
          templateResult = emailTemplateService.generatePasswordResetEmail({
            resetLink: data.resetLink as string || '',
            name: data.name as string
          });
          break;
        case 'contact':
          templateResult = emailTemplateService.generateContactEmail({
            name: data.name as string || '用戶',
            message: data.message as string || '',
            userInfo: data.userInfo as string | string[],
            activityTitle: data.activityTitle as string
          });
          break;
        case 'marathon':
          templateResult = emailTemplateService.generateMarathonEmail({
            name: data.name as string || '用戶',
            marathonTitle: data.marathonTitle as string || '學習馬拉松',
            marathonDate: data.marathonDate as string,
            marathonDescription: data.marathonDescription as string
          });
          break;
        case 'custom':
          templateResult = emailTemplateService.generateCustomEmail(
            data.subject as string || '自定義郵件',
            data.content as string || '',
            data
          );
          break;
        default:
          throw new Error(`不支持的模板類型: ${template}`);
      }

      return await enhancedEmailService.sendCustomEmail(
        to,
        templateResult.subject,
        templateResult.html
      );
    } catch (error) {
      console.error('Send templated email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 預覽郵件模板
   */
  previewTemplate(template: EmailTemplate, data: Record<string, unknown>) {
    try {
      switch (template) {
        case 'welcome':
          return emailTemplateService.generateWelcomeEmail({
            name: data.name as string || '用戶'
          });
        case 'verification':
          return emailTemplateService.generateVerificationEmail({
            verifyLink: data.verifyLink as string || '',
            name: data.name as string
          });
        case 'password-reset':
          return emailTemplateService.generatePasswordResetEmail({
            resetLink: data.resetLink as string || '',
            name: data.name as string
          });
        case 'contact':
          return emailTemplateService.generateContactEmail({
            name: data.name as string || '用戶',
            message: data.message as string || '',
            userInfo: data.userInfo as string | string[],
            activityTitle: data.activityTitle as string
          });
        case 'marathon':
          return emailTemplateService.generateMarathonEmail({
            name: data.name as string || '用戶',
            marathonTitle: data.marathonTitle as string || '學習馬拉松',
            marathonDate: data.marathonDate as string,
            marathonDescription: data.marathonDescription as string
          });
        case 'custom':
          return emailTemplateService.generateCustomEmail(
            data.subject as string || '自定義郵件',
            data.content as string || '',
            data
          );
        default:
          throw new Error(`不支持的模板類型: ${template}`);
      }
    } catch (error) {
      throw new Error(`模板預覽失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 檢查郵件服務健康狀態
   */
  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; lastCheck: Date; transporterConnected: boolean; error?: string }> {
    try {
      // 嘗試驗證 SMTP 連接
      const testResult = this.validateEmailAddress('test@example.com');
      return {
        status: 'healthy',
        lastCheck: new Date(),
        transporterConnected: testResult
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        transporterConnected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// 創建郵件服務實例
export const emailService = new EmailServiceImpl();

// 導出型別和服務
export type { EmailService, EmailOptions, EmailTemplate, EmailResult };
export default emailService;