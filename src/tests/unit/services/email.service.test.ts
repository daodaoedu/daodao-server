/**
 * 郵件服務單元測試
 */

import nodemailer from 'nodemailer';
import { emailService } from '../../../services/auth/email.service';

// Mock nodemailer
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock JWT service
jest.mock('../../../services/jwt-service', () => ({
  jwtService: {
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
    refreshToken: jest.fn()
  }
}));

describe('Email Service', () => {
  let mockTransporter: {
    sendMail: jest.Mock;
  };
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env.EMAIL_ADDRESS = 'test@daoedu.tw';
    process.env.EMAIL_PASSWORD = 'test-password';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransporter = {
      sendMail: jest.fn()
    };
    
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);
  });

  describe('Environment Variables Validation', () => {
    it('should throw error if EMAIL_ADDRESS is missing', () => {
      delete process.env.EMAIL_ADDRESS;
      
      expect(() => {
        require('../../../services/auth/email.service');
      }).toThrow('Missing required email environment variables');
      
      // Restore env var
      process.env.EMAIL_ADDRESS = 'test@daoedu.tw';
    });

    it('should throw error if EMAIL_PASSWORD is missing', () => {
      delete process.env.EMAIL_PASSWORD;
      
      expect(() => {
        require('../../../services/auth/email.service');
      }).toThrow('Missing required email environment variables');
      
      // Restore env var
      process.env.EMAIL_PASSWORD = 'test-password';
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        response: '250 Message accepted',
        messageId: 'test-id'
      });

      const result = await emailService.sendWelcomeEmail('user@example.com', 'Test User');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@daoedu.tw',
        to: 'user@example.com',
        subject: '【島島阿學】歡迎成為島友！',
        html: expect.stringContaining('歡迎成為島友！')
      });
    });

    it('should handle welcome email sending errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendWelcomeEmail('user@example.com', 'Test User');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Send welcome email error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should include user name in welcome email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendWelcomeEmail('user@example.com', 'Test User');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('Test User');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        response: '250 Message accepted',
        messageId: 'test-id'
      });

      const result = await emailService.sendVerificationEmail('user@example.com', 'test-token');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@daoedu.tw',
        to: 'user@example.com',
        subject: '【島島阿學】點開 驗證email',
        html: expect.stringContaining('http://localhost:3000/auth/verify?token=test-token')
      });
    });

    it('should handle verification email sending errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendVerificationEmail('user@example.com', 'test-token');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Send verification email error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should include correct verification link', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendVerificationEmail('user@example.com', 'verification-token-123');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('http://localhost:3000/auth/verify?token=verification-token-123');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        response: '250 Message accepted',
        messageId: 'test-id'
      });

      const result = await emailService.sendPasswordResetEmail('user@example.com', 'reset-token');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@daoedu.tw',
        to: 'user@example.com',
        subject: '【島島阿學】密碼重設申請',
        html: expect.stringContaining('http://localhost:3000/auth/reset-password?token=reset-token')
      });
    });

    it('should handle password reset email sending errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendPasswordResetEmail('user@example.com', 'reset-token');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Send password reset email error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should include correct reset link', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendPasswordResetEmail('user@example.com', 'reset-token-456');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('http://localhost:3000/auth/reset-password?token=reset-token-456');
    });
  });

  describe('sendContactEmail', () => {
    const contactOptions = {
      to: 'recipient@example.com',
      from: 'sender@example.com',
      subject: 'Contact Request',
      data: {
        name: 'John Doe',
        message: 'Hello, I would like to connect',
        userInfo: ['john@example.com', '0912345678'],
        activityTitle: 'Learning Activity'
      }
    };

    it('should send contact email to both recipient and sender', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        response: '250 Message accepted',
        messageId: 'test-id'
      });

      const result = await emailService.sendContactEmail(contactOptions);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      
      // Check recipient email
      expect(mockTransporter.sendMail).toHaveBeenNthCalledWith(1, {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Contact Request',
        html: expect.stringContaining('John Doe')
      });
      
      // Check sender copy
      expect(mockTransporter.sendMail).toHaveBeenNthCalledWith(2, {
        from: 'sender@example.com',
        to: 'sender@example.com',
        subject: '副本：Contact Request',
        html: expect.stringContaining('John Doe')
      });
    });

    it('should handle contact email sending errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendContactEmail(contactOptions);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Send contact email error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return false if recipient email fails', async () => {
      mockTransporter.sendMail
        .mockRejectedValueOnce(new Error('Recipient email failed'))
        .mockResolvedValueOnce({ response: '250 OK' });

      const result = await emailService.sendContactEmail(contactOptions);

      expect(result).toBe(false);
    });

    it('should return false if sender copy fails', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ response: '250 OK' })
        .mockRejectedValueOnce(new Error('Sender copy failed'));

      const result = await emailService.sendContactEmail(contactOptions);

      expect(result).toBe(false);
    });

    it('should include all contact information in email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendContactEmail(contactOptions);

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('John Doe');
      expect(mailOptions.html).toContain('Hello, I would like to connect');
      expect(mailOptions.html).toContain('Learning Activity');
      expect(mailOptions.html).toContain('john@example.com, 0912345678');
    });

    it('should handle string userInfo', async () => {
      const optionsWithStringUserInfo = {
        ...contactOptions,
        data: {
          ...contactOptions.data,
          userInfo: 'john@example.com'
        }
      };
      
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendContactEmail(optionsWithStringUserInfo);

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('john@example.com');
    });

    it('should handle undefined userInfo', async () => {
      const optionsWithoutUserInfo = {
        ...contactOptions,
        data: {
          ...contactOptions.data,
          userInfo: undefined
        }
      };
      
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      const result = await emailService.sendContactEmail(optionsWithoutUserInfo);

      expect(result).toBe(true);
    });
  });

  describe('sendCustomEmail', () => {
    it('should send custom email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        response: '250 Message accepted',
        messageId: 'test-id'
      });

      const result = await emailService.sendCustomEmail(
        'user@example.com',
        'Custom Subject',
        '<h1>Custom HTML Content</h1>'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@daoedu.tw',
        to: 'user@example.com',
        subject: 'Custom Subject',
        html: '<h1>Custom HTML Content</h1>'
      });
    });

    it('should handle custom email sending errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendCustomEmail(
        'user@example.com',
        'Custom Subject',
        '<h1>Custom HTML Content</h1>'
      );

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Send custom email error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should log successful email sending', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockTransporter.sendMail.mockResolvedValue({
        response: '250 Message accepted'
      });

      await emailService.sendCustomEmail(
        'user@example.com',
        'Test Subject',
        '<p>Test content</p>'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Custom email sent:', '250 Message accepted');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Email Templates', () => {
    it('should generate welcome email template correctly', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendWelcomeEmail('user@example.com', 'TestUser');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      const html = mailOptions.html;
      
      expect(html).toContain('歡迎成為島友！');
      expect(html).toContain('TestUser');
      expect(html).toContain('島島阿學');
      expect(html).toContain('Discord');
      expect(html).toContain('https://discord.gg/2NbQ7cu6jH');
      expect(html).toContain('https://www.daoedu.tw/');
    });

    it('should generate verification email template correctly', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendVerificationEmail('user@example.com', 'test-token');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      const html = mailOptions.html;
      
      expect(html).toContain('信箱驗證！');
      expect(html).toContain('驗證EMAIL');
      expect(html).toContain('http://localhost:3000/auth/verify?token=test-token');
      expect(html).toContain('島島阿學');
    });

    it('should generate password reset email template correctly', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendPasswordResetEmail('user@example.com', 'reset-token');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      const html = mailOptions.html;
      
      expect(html).toContain('密碼重設申請');
      expect(html).toContain('重設密碼');
      expect(html).toContain('http://localhost:3000/auth/reset-password?token=reset-token');
      expect(html).toContain('1 小時後失效');
    });

    it('should generate contact email template correctly', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      const contactOptions = {
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Contact Request',
        data: {
          name: 'John Doe',
          message: 'Hello there',
          userInfo: ['john@example.com'],
          activityTitle: 'Test Activity'
        }
      };

      await emailService.sendContactEmail(contactOptions);

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      const html = mailOptions.html;
      
      expect(html).toContain('有夥伴想聯繫你');
      expect(html).toContain('John Doe');
      expect(html).toContain('Hello there');
      expect(html).toContain('Test Activity');
      expect(html).toContain('john@example.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle nodemailer transport errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Transport error'));

      const result = await emailService.sendWelcomeEmail('user@example.com', 'Test User');

      expect(result).toBe(false);
    });

    it('should handle template generation errors', async () => {
      // This would test private methods, but we can test through public interface
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate an error in template generation by mocking sendMail to throw
      mockTransporter.sendMail.mockImplementation(() => {
        throw new Error('Template error');
      });

      const result = await emailService.sendWelcomeEmail('user@example.com', 'Test User');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete email workflow', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        response: '250 Message accepted',
        messageId: 'msg-123'
      });

      // Test welcome email
      const welcomeResult = await emailService.sendWelcomeEmail('new@example.com', 'New User');
      expect(welcomeResult).toBe(true);

      // Test verification email
      const verifyResult = await emailService.sendVerificationEmail('verify@example.com', 'verify-token');
      expect(verifyResult).toBe(true);

      // Test password reset email
      const resetResult = await emailService.sendPasswordResetEmail('reset@example.com', 'reset-token');
      expect(resetResult).toBe(true);

      // Test custom email
      const customResult = await emailService.sendCustomEmail(
        'custom@example.com',
        'Custom Test',
        '<p>Custom content</p>'
      );
      expect(customResult).toBe(true);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(4);
    });

    it('should handle mixed success/failure scenarios', async () => {
      // First call succeeds, second fails
      mockTransporter.sendMail
        .mockResolvedValueOnce({ response: '250 OK' })
        .mockRejectedValueOnce(new Error('Second email failed'));

      const result1 = await emailService.sendWelcomeEmail('user1@example.com', 'User 1');
      const result2 = await emailService.sendWelcomeEmail('user2@example.com', 'User 2');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should use correct email configuration', () => {
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: 'test@daoedu.tw',
          pass: 'test-password'
        }
      });
    });

    it('should use correct frontend URL for links', async () => {
      mockTransporter.sendMail.mockResolvedValue({ response: '250 OK' });

      await emailService.sendVerificationEmail('user@example.com', 'token');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('http://localhost:3000/auth/verify?token=token');
    });
  });
});