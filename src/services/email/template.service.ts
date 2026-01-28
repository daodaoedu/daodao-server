import type { 
  EmailTemplate, 
  WelcomeEmailData, 
  VerificationEmailData, 
  ContactEmailData, 
  MarathonEmailData, 
  PasswordResetEmailData 
} from './types';
import { generateWelcomeEmail } from './welcome-template';
import { generateVerificationEmail } from './verification-template';
import { generateContactEmail } from './contact-template';
import { generateMarathonEmail } from './marathon-template';
import { generatePasswordResetEmail } from './password-reset-template';

/**
 * 郵件模板服務
 * 統一管理所有郵件模板的生成
 */
export class EmailTemplateService {
  /**
   * 生成歡迎郵件模板
   */
  generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
    return generateWelcomeEmail(data);
  }

  /**
   * 生成驗證郵件模板
   */
  generateVerificationEmail(data: VerificationEmailData): EmailTemplate {
    return generateVerificationEmail(data);
  }

  /**
   * 生成聯絡郵件模板
   */
  generateContactEmail(data: ContactEmailData): EmailTemplate {
    return generateContactEmail(data);
  }

  /**
   * 生成馬拉松郵件模板
   */
  generateMarathonEmail(data: MarathonEmailData): EmailTemplate {
    return generateMarathonEmail(data);
  }

  /**
   * 生成密碼重設郵件模板
   */
  generatePasswordResetEmail(data: PasswordResetEmailData): EmailTemplate {
    return generatePasswordResetEmail(data);
  }

  /**
   * 生成自定義郵件模板
   */
  generateCustomEmail(subject: string, content: string, data?: unknown): EmailTemplate {
    return {
      subject,
      html: content
    };
  }
}

// 導出單例實例
export const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;