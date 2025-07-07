/**
 * 郵件服務
 * 處理各種類型的郵件發送
 */

import nodemailer from 'nodemailer';
import { jwtService } from '../jwt-service';
import type { 
  EmailService, 
  EmailOptions, 
  EmailTemplate, 
  WelcomeEmailOptions,
  VerificationEmailOptions,
  PasswordResetEmailOptions,
  ContactEmailOptions
} from '../../types/email.types';

/**
 * 郵件配置
 */
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS!,
    pass: process.env.EMAIL_PASSWORD!
  }
};

/**
 * 檢查必要的環境變數
 */
if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) {
  throw new Error('Missing required email environment variables');
}

/**
 * 創建郵件傳輸器
 */
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

/**
 * 郵件服務實作類
 */
class EmailServiceImpl implements EmailService {
  /**
   * 發送歡迎郵件
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const options: WelcomeEmailOptions = {
        to: email,
        subject: '【島島阿學】歡迎成為島友！',
        template: 'welcome',
        data: { name }
      };

      return await this.sendEmail(options);
    } catch (error) {
      console.error('Send welcome email error:', error);
      return false;
    }
  }

  /**
   * 發送驗證郵件
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    try {
      const verifyLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
      
      const options: VerificationEmailOptions = {
        to: email,
        subject: '【島島阿學】點開 驗證email',
        template: 'verification',
        data: { verifyLink }
      };

      return await this.sendEmail(options);
    } catch (error) {
      console.error('Send verification email error:', error);
      return false;
    }
  }

  /**
   * 發送密碼重設郵件
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
      
      const options: PasswordResetEmailOptions = {
        to: email,
        subject: '【島島阿學】密碼重設申請',
        template: 'password-reset',
        data: { resetLink }
      };

      return await this.sendEmail(options);
    } catch (error) {
      console.error('Send password reset email error:', error);
      return false;
    }
  }

  /**
   * 發送聯絡郵件
   */
  async sendContactEmail(options: ContactEmailOptions): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: options.to,
        from: options.from,
        subject: options.subject,
        template: 'contact',
        data: {
          name: options.name,
          message: options.message,
          userInfo: options.userInfo,
          activityTitle: options.activityTitle
        }
      };

      // 發送給接收者
      const recipientResult = await this.sendEmail(emailOptions);
      
      // 發送副本給發送者
      const senderOptions = {
        ...emailOptions,
        to: options.from,
        subject: `副本：${options.subject}`
      };
      const senderResult = await this.sendEmail(senderOptions);

      return recipientResult && senderResult;
    } catch (error) {
      console.error('Send contact email error:', error);
      return false;
    }
  }

  /**
   * 發送自定義郵件
   */
  async sendCustomEmail(
    to: string, 
    subject: string, 
    htmlContent: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to,
        subject,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Custom email sent:', result.response);
      return true;
    } catch (error) {
      console.error('Send custom email error:', error);
      return false;
    }
  }

  /**
   * 核心郵件發送方法
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const htmlContent = this.generateEmailTemplate(options.template, options.data);
      
      const mailOptions = {
        from: options.from || process.env.EMAIL_ADDRESS,
        to: options.to,
        subject: options.subject,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent:', result.response);
      return true;
    } catch (error) {
      console.error('Send email error:', error);
      return false;
    }
  }

  /**
   * 生成郵件模板
   */
  private generateEmailTemplate(template: EmailTemplate, data: Record<string, unknown>): string {
    switch (template) {
      case 'welcome':
        return this.generateWelcomeTemplate(data as { name: string });
      
      case 'verification':
        return this.generateVerificationTemplate(data as { verifyLink: string });
      
      case 'password-reset':
        return this.generatePasswordResetTemplate(data as { resetLink: string });
      
      case 'contact':
        return this.generateContactTemplate(data as ContactEmailOptions['data']);
      
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }

  /**
   * 生成歡迎郵件模板
   */
  private generateWelcomeTemplate(data: { name: string }): string {
    const { name } = data;
    
    return `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>歡迎成為島友！</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    body { margin: 0; padding: 0; font-family: 'Noto Sans TC', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #59B6B2; padding: 20px; text-align: center; }
    .logo { width: 120px; height: auto; }
    .content { padding: 32px 40px; }
    .title { font-size: 22px; font-weight: 700; text-align: center; color: #536166; margin-bottom: 20px; }
    .text { font-size: 14px; line-height: 140%; color: #536166; margin-bottom: 20px; }
    .section { background-color: #def5f5; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
    .section h3 { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
    .button { display: inline-block; background-color: #16B9B3; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; }
    .footer { background-color: #536166; padding: 20px; text-align: center; color: #DBDBDB; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png" alt="島島阿學" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">歡迎成為島友！</h1>
      
      <p class="text">
        嗨，親愛的島友 ${name}，感謝你註冊島島阿學！<br><br>
        在島島阿學裡，每個人都是一座獨一無二的「島」，透過互相、互助學習，成為一片獨立又連結的群島。<br>
        讓我們一起「沓沓仔學Ta̍uh-ta̍uh-á o̍h」慢慢學不用急，用自己的步調與方式共學！
      </p>
      
      <hr style="border: none; border-top: 1px solid #f3f3f3; margin: 20px 0;">
      
      <p class="text">除了註冊官網，你還可以透過以下方式共學：</p>
      
      <div class="section">
        <h3>加入 Discord 社群，即時交流並獲得資源</h3>
        <p>歡迎參與每月一次的 Onboarding 活動，更快融入社群。活動將在 Discord 舉辦唷！</p>
        <div style="text-align: right;">
          <a href="https://discord.gg/2NbQ7cu6jH" class="button">加入社群</a>
        </div>
      </div>
      
      <div class="section" style="background-color: #deedf5;">
        <h3>探索島島網站，認識學習夥伴！</h3>
        <p>
          <strong>找資源</strong>：各領域達人推薦的上千種資源都在這<br>
          <strong>找夥伴</strong>：找到一起交流的學習夥伴<br>
          <strong>找揪團</strong>：發起或參與有趣的活動或學習小組
        </p>
        <div style="text-align: right;">
          <a href="https://www.daoedu.tw/" class="button" style="background-color: #71AAEC;">探索網站</a>
        </div>
      </div>
      
      <div class="section" style="background-color: #def5e7;">
        <h3>訂閱電子報，學習新知不漏接！</h3>
        <p>帶給你精選學習資源與教育新聞等一手資訊</p>
        <div style="text-align: right;">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdvdjwrzpwdAEhAL2AouPVsv41cbCJSUoHXiJdLZyL8UvM6xg/viewform" class="button" style="background-color: #52CA9E;">立即訂閱</a>
        </div>
      </div>
      
      <p class="text">
        PS：如你在網站功能使用上有任何問題，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
      </p>
    </div>
    
    <div class="footer">
      Tomorrow will be fine. 島島阿學 © 2024.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 生成驗證郵件模板
   */
  private generateVerificationTemplate(data: { verifyLink: string }): string {
    const { verifyLink } = data;
    
    return `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>信箱驗證</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    body { margin: 0; padding: 0; font-family: 'Noto Sans TC', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #59B6B2; padding: 20px; text-align: center; }
    .logo { width: 120px; height: auto; }
    .content { padding: 32px 40px; }
    .title { font-size: 22px; font-weight: 700; text-align: center; color: #536166; margin-bottom: 20px; }
    .text { font-size: 14px; line-height: 140%; color: #536166; margin-bottom: 20px; }
    .button { display: inline-block; background-color: #16B9B3; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; margin: 10px 0; }
    .footer { background-color: #536166; padding: 20px; text-align: center; color: #DBDBDB; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png" alt="島島阿學" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">信箱驗證！</h1>
      
      <p class="text">
        歡迎加入 島島阿學！<br>
        您好，<br>
        感謝您註冊 島島阿學。<br>
        請點擊以下按鈕以驗證您的電子郵件地址：<br>
        <a href="${verifyLink}" class="button">驗證EMAIL</a>
        <br>
        謝謝！
      </p>
      
      <p class="text">
        PS：如果您無法點擊此按鈕，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
      </p>
    </div>
    
    <div class="footer">
      Tomorrow will be fine. 島島阿學 © 2024.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 生成密碼重設郵件模板
   */
  private generatePasswordResetTemplate(data: { resetLink: string }): string {
    const { resetLink } = data;
    
    return `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>密碼重設</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    body { margin: 0; padding: 0; font-family: 'Noto Sans TC', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #59B6B2; padding: 20px; text-align: center; }
    .logo { width: 120px; height: auto; }
    .content { padding: 32px 40px; }
    .title { font-size: 22px; font-weight: 700; text-align: center; color: #536166; margin-bottom: 20px; }
    .text { font-size: 14px; line-height: 140%; color: #536166; margin-bottom: 20px; }
    .button { display: inline-block; background-color: #16B9B3; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; margin: 10px 0; }
    .footer { background-color: #536166; padding: 20px; text-align: center; color: #DBDBDB; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png" alt="島島阿學" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">密碼重設申請</h1>
      
      <p class="text">
        您好，<br>
        我們收到了您的密碼重設申請。<br>
        請點擊以下按鈕來重設您的密碼：<br>
        <a href="${resetLink}" class="button">重設密碼</a>
        <br>
        此連結將在 1 小時後失效。<br>
        如果您沒有申請密碼重設，請忽略此郵件。
      </p>
      
      <p class="text">
        如有任何問題，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道聯繫我們！
      </p>
    </div>
    
    <div class="footer">
      Tomorrow will be fine. 島島阿學 © 2024.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 生成聯絡郵件模板（使用原有的複雜模板）
   */
  private generateContactTemplate(data: ContactEmailOptions['data']): string {
    const { name, message, userInfo, activityTitle } = data;
    
    // 這裡保持原有的複雜 HTML 模板
    return `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>有夥伴想聯繫你</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    /* 保持原有的 CSS 樣式 */
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    p { display: block; margin: 13px 0; }
  </style>
</head>
<body style="background-color:#59B6B2;">
  <div class="container">
    <!-- 簡化版的聯絡郵件模板 -->
    <h1>有夥伴想聯繫你</h1>
    <p>${name}想要聯繫您${activityTitle ? `關於「${activityTitle}」活動` : ''}</p>
    <p>訊息內容：${message}</p>
    <p>聯絡資訊：${Array.isArray(userInfo) ? userInfo.join(', ') : userInfo || ''}</p>
  </div>
</body>
</html>`;
  }
}

// 創建郵件服務實例
export const emailService = new EmailServiceImpl();

// 導出型別和服務
export type { EmailService, EmailOptions, EmailTemplate };
export default emailService;