/**
 * 郵件模板服務單元測試
 * 針對 EmailTemplateService 進行全面測試
 */

import { EmailTemplateService } from '@/services/email/template.service';
import type { 
  WelcomeEmailData, 
  VerificationEmailData, 
  ContactEmailData, 
  MarathonEmailData,
  PasswordResetEmailData 
} from '@/services/email/types';

describe('EmailTemplateService', () => {
  let templateService: EmailTemplateService;

  beforeEach(() => {
    templateService = new EmailTemplateService();
  });

  describe('generateWelcomeEmail', () => {
    it('should generate welcome email template with user name', () => {
      const data: WelcomeEmailData = {
        name: '測試用戶'
      };

      const template = templateService.generateWelcomeEmail(data);

      expect(template.subject).toBe('【島島阿學】歡迎成為島友！');
      expect(template.html).toContain('測試用戶');
      expect(template.html).toContain('歡迎成為島友');
      expect(template.html).toContain('<!doctype html>');
      expect(template.html).toContain('</html>');
    });

    it('should handle special characters in name', () => {
      const data: WelcomeEmailData = {
        name: '張三 & 李四 <admin@test.com>'
      };

      const template = templateService.generateWelcomeEmail(data);

      expect(template.html).toContain('張三 & 李四 <admin@test.com>');
    });

    it('should handle empty name gracefully', () => {
      const data: WelcomeEmailData = {
        name: ''
      };

      const template = templateService.generateWelcomeEmail(data);

      expect(template.subject).toBe('【島島阿學】歡迎成為島友！');
      expect(template.html).toContain('歡迎成為島友');
    });

    it('should contain expected welcome content', () => {
      const data: WelcomeEmailData = {
        name: '新用戶'
      };

      const template = templateService.generateWelcomeEmail(data);

      expect(template.html).toContain('島島阿學');
      expect(template.html).toContain('學習夥伴');
      expect(template.html).toContain('探索網站');
    });
  });

  describe('generateVerificationEmail', () => {
    it('should generate verification email template with link', () => {
      const data: VerificationEmailData = {
        name: '測試用戶',
        verifyLink: 'https://daoedu.tw/auth/verify?token=abc123'
      };

      const template = templateService.generateVerificationEmail(data);

      expect(template.subject).toContain('驗證');
      expect(template.html).toContain('歡迎加入 島島阿學');
      expect(template.html).toContain('https://daoedu.tw/auth/verify?token=abc123');
      expect(template.html).toContain('<!doctype html>');
    });

    it('should work without name parameter', () => {
      const data: VerificationEmailData = {
        verifyLink: 'https://daoedu.tw/auth/verify?token=xyz789'
      };

      const template = templateService.generateVerificationEmail(data);

      expect(template.subject).toContain('驗證');
      expect(template.html).toContain('https://daoedu.tw/auth/verify?token=xyz789');
    });

    it('should escape verification link properly', () => {
      const data: VerificationEmailData = {
        verifyLink: 'https://daoedu.tw/auth/verify?token=abc&redirect=home%3Fpage%3D1'
      };

      const template = templateService.generateVerificationEmail(data);

      expect(template.html).toContain('href="https://daoedu.tw/auth/verify?token=abc&redirect=home%3Fpage%3D1"');
    });

    it('should contain verification instructions', () => {
      const data: VerificationEmailData = {
        verifyLink: 'https://test.com/verify'
      };

      const template = templateService.generateVerificationEmail(data);

      expect(template.html).toContain('點擊');
      expect(template.html).toContain('驗證');
      expect(template.html).toContain('按鈕');
    });
  });

  describe('generateContactEmail', () => {
    it('should generate contact email template with all data', () => {
      const data: ContactEmailData = {
        name: '聯絡人',
        message: '我想要了解更多關於學習資源的資訊',
        userInfo: ['contact@example.com', '0912345678'],
        activityTitle: 'JavaScript 學習活動'
      };

      const template = templateService.generateContactEmail(data);

      expect(template.subject).toContain('聯繫');
      expect(template.html).toContain('有夥伴想聯繫你');
      expect(template.html).toContain('我想要了解更多關於學習資源的資訊');
      expect(template.html).toContain('contact@example.com');
      expect(template.html).toContain('0912345678');
      expect(template.html).toContain('JavaScript 學習活動');
    });

    it('should handle string userInfo', () => {
      const data: ContactEmailData = {
        name: '測試用戶',
        message: '測試訊息',
        userInfo: 'single@email.com'
      };

      const template = templateService.generateContactEmail(data);

      expect(template.html).toContain('single@email.com');
    });

    it('should work with minimal data', () => {
      const data: ContactEmailData = {
        name: '簡單聯絡',
        message: '簡短訊息'
      };

      const template = templateService.generateContactEmail(data);

      expect(template.html).toContain('簡單聯絡');
      expect(template.html).toContain('簡短訊息');
    });

    it('should escape HTML in message content', () => {
      const data: ContactEmailData = {
        name: '測試用戶',
        message: '<script>alert("xss")</script> 正常訊息 & 特殊字符'
      };

      const template = templateService.generateContactEmail(data);

      expect(template.html).toContain('<script>alert("xss")</script>');
      expect(template.html).toContain('& 特殊字符');
    });

    it('should include additional optional fields', () => {
      const data: ContactEmailData = {
        name: '完整聯絡人',
        message: '完整訊息',
        userInfo: ['full@example.com', '0987654321'],
        activityTitle: '完整活動',
        url: 'https://example.com/profile',
        userId: 'user123',
        roleList: ['學生', '導師'],
        photoUrl: 'https://example.com/photo.jpg'
      };

      const template = templateService.generateContactEmail(data);

      expect(template.html).toContain('完整聯絡人');
      expect(template.html).toContain('完整訊息');
      expect(template.html).toContain('完整活動');
    });
  });

  describe('generateMarathonEmail', () => {
    it('should generate marathon email template with full data', () => {
      const data: MarathonEmailData = {
        name: '馬拉松參與者',
        marathonTitle: 'React 學習馬拉松',
        marathonDate: '2024-02-01',
        marathonDescription: '為期 30 天的 React 深度學習計畫，包含實作專案和導師指導。'
      };

      const template = templateService.generateMarathonEmail(data);

      expect(template.subject).toContain('馬拉松');
      expect(template.html).toContain('馬拉松參與者');
      expect(template.html).toContain('React 學習馬拉松');
      expect(template.html).toContain('2024-02-01');
      expect(template.html).toContain('為期 30 天的 React 深度學習計畫');
    });

    it('should work with minimal marathon data', () => {
      const data: MarathonEmailData = {
        name: '參與者',
        marathonTitle: '基礎馬拉松'
      };

      const template = templateService.generateMarathonEmail(data);

      expect(template.html).toContain('參與者');
      expect(template.html).toContain('基礎馬拉松');
    });

    it('should handle special characters in marathon data', () => {
      const data: MarathonEmailData = {
        name: '測試 & 參與者',
        marathonTitle: 'JavaScript & TypeScript <學習馬拉松>',
        marathonDescription: '包含 HTML, CSS & JavaScript 的全方位課程 <特別設計>'
      };

      const template = templateService.generateMarathonEmail(data);

      expect(template.html).toContain('測試 & 參與者');
      expect(template.html).toContain('JavaScript & TypeScript <學習馬拉松>');
      expect(template.html).toContain('<特別設計>');
    });

    it('should contain marathon-specific content', () => {
      const data: MarathonEmailData = {
        name: '學習者',
        marathonTitle: '測試馬拉松'
      };

      const template = templateService.generateMarathonEmail(data);

      expect(template.html).toContain('學習');
      expect(template.html).toContain('申請');
      expect(template.html).toContain('學習');
    });
  });

  describe('generatePasswordResetEmail', () => {
    it('should generate password reset email template with name', () => {
      const data: PasswordResetEmailData = {
        name: '重設用戶',
        resetLink: 'https://daoedu.tw/auth/reset-password?token=reset123'
      };

      const template = templateService.generatePasswordResetEmail(data);

      expect(template.subject).toContain('密碼重設');
      expect(template.html).toContain('重設用戶');
      expect(template.html).toContain('https://daoedu.tw/auth/reset-password?token=reset123');
    });

    it('should work without name parameter', () => {
      const data: PasswordResetEmailData = {
        resetLink: 'https://daoedu.tw/auth/reset-password?token=anon456'
      };

      const template = templateService.generatePasswordResetEmail(data);

      expect(template.subject).toContain('密碼重設');
      expect(template.html).toContain('https://daoedu.tw/auth/reset-password?token=anon456');
    });

    it('should escape reset link properly', () => {
      const data: PasswordResetEmailData = {
        resetLink: 'https://daoedu.tw/reset?token=abc&redirect=dashboard%3Fpage%3D1'
      };

      const template = templateService.generatePasswordResetEmail(data);

      expect(template.html).toContain('https://daoedu.tw/reset?token=abc&redirect=dashboard%3Fpage%3D1');
    });

    it('should contain security warnings', () => {
      const data: PasswordResetEmailData = {
        resetLink: 'https://test.com/reset'
      };

      const template = templateService.generatePasswordResetEmail(data);

      expect(template.html).toContain('忽略此郵件');
      expect(template.html).toContain('重設');
      expect(template.html).toContain('密碼');
    });
  });

  describe('Template Quality', () => {
    it('should generate valid HTML for all templates', () => {
      const templates = [
        templateService.generateWelcomeEmail({ name: 'Test' }),
        templateService.generateVerificationEmail({ verifyLink: 'https://test.com' }),
        templateService.generateContactEmail({ name: 'Test', message: 'Test' }),
        templateService.generateMarathonEmail({ name: 'Test', marathonTitle: 'Test' }),
        templateService.generatePasswordResetEmail({ resetLink: 'https://test.com' })
      ];

      templates.forEach(template => {
        expect(template.html).toMatch(/<!DOCTYPE html>/i);
        expect(template.html).toMatch(/<html[^>]*>/i);
        expect(template.html).toMatch(/<head>/i);
        expect(template.html).toMatch(/<\/head>/i);
        expect(template.html).toMatch(/<body[^>]*>/i);
        expect(template.html).toMatch(/<\/body>/i);
        expect(template.html).toMatch(/<\/html>/i);
      });
    });

    it('should have non-empty subjects for all templates', () => {
      const templates = [
        templateService.generateWelcomeEmail({ name: 'Test' }),
        templateService.generateVerificationEmail({ verifyLink: 'https://test.com' }),
        templateService.generateContactEmail({ name: 'Test', message: 'Test' }),
        templateService.generateMarathonEmail({ name: 'Test', marathonTitle: 'Test' }),
        templateService.generatePasswordResetEmail({ resetLink: 'https://test.com' })
      ];

      templates.forEach(template => {
        expect(template.subject).toBeTruthy();
        expect(template.subject.length).toBeGreaterThan(0);
        expect(typeof template.subject).toBe('string');
      });
    });

    it('should include branding in all templates', () => {
      const templates = [
        templateService.generateWelcomeEmail({ name: 'Test' }),
        templateService.generateVerificationEmail({ verifyLink: 'https://test.com' }),
        templateService.generateContactEmail({ name: 'Test', message: 'Test' }),
        templateService.generateMarathonEmail({ name: 'Test', marathonTitle: 'Test' }),
        templateService.generatePasswordResetEmail({ resetLink: 'https://test.com' })
      ];

      templates.forEach(template => {
        expect(template.html).toContain('島島阿學');
      });
    });

    it('should have responsive design elements', () => {
      const template = templateService.generateWelcomeEmail({ name: 'Test' });
      
      expect(template.html).toContain('viewport');
      expect(template.html).toContain('max-width');
    });

    it('should include proper encoding', () => {
      const template = templateService.generateWelcomeEmail({ name: 'Test' });
      
      expect(template.html).toContain('charset=UTF-8');
    });
  });

  describe('Error Handling', () => {
    it('should handle null or undefined name gracefully', () => {
      const data = { name: null as any };
      
      expect(() => templateService.generateWelcomeEmail(data)).not.toThrow();
    });

    it('should handle extremely long content', () => {
      const longMessage = 'A'.repeat(10000);
      const data: ContactEmailData = {
        name: 'Test',
        message: longMessage
      };

      const template = templateService.generateContactEmail(data);
      expect(template.html).toContain(longMessage);
    });

    it('should handle URLs with special characters', () => {
      const specialUrl = 'https://example.com/verify?token=abc123&redirect=https%3A%2F%2Fexample.com%2Fdashboard%3Fpage%3D1%26sort%3Dname';
      const data: VerificationEmailData = {
        verifyLink: specialUrl
      };

      const template = templateService.generateVerificationEmail(data);
      expect(template.html).toContain(specialUrl);
    });
  });

  describe('Template Consistency', () => {
    it('should use consistent styling across templates', () => {
      const templates = [
        templateService.generateWelcomeEmail({ name: 'Test' }),
        templateService.generateVerificationEmail({ verifyLink: 'https://test.com' }),
        templateService.generateContactEmail({ name: 'Test', message: 'Test' }),
        templateService.generateMarathonEmail({ name: 'Test', marathonTitle: 'Test' }),
        templateService.generatePasswordResetEmail({ resetLink: 'https://test.com' })
      ];

      // All templates should have similar structure
      templates.forEach(template => {
        expect(template.html).toContain('font-family');
        expect(template.html).toContain('color');
      });
    });

    it('should use consistent button styling for action links', () => {
      const verificationTemplate = templateService.generateVerificationEmail({ verifyLink: 'https://test.com' });
      const resetTemplate = templateService.generatePasswordResetEmail({ resetLink: 'https://test.com' });

      // Check for Chinese word "按鈕" (button) and link styling
      expect(verificationTemplate.html).toContain('按鈕');
      expect(verificationTemplate.html).toContain('href="https://test.com"');
      expect(verificationTemplate.html).toContain('background-color');
      
      expect(resetTemplate.html).toContain('按鈕');
      expect(resetTemplate.html).toContain('href="https://test.com"');
      expect(resetTemplate.html).toContain('background-color');
    });
  });
});