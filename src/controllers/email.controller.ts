/**
 * 郵件控制器（v1 版本）
 * 處理郵件發送相關的 API 請求，使用增強的郵件服務
 */

import { Request, Response } from 'express';
import { emailService, sendWelcomeEmailApi, sendVerificationEmailApi } from '../services/email/email.service';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';

/**
 * 發送聯絡郵件
 * POST /api/v1/email/contact
 */
export const sendContactEmail = asyncHandler(async (req: Request, res: Response) => {
  const {
    from,
    to,
    subject,
    text,
    information,
    name,
    activityTitle
  } = req.body;

  // 驗證必填欄位
  if (!from || !to || !subject || !text || !name) {
    throw new BadRequestError('缺少必要的郵件資訊：from, to, subject, text, name');
  }

  // 發送郵件
  const result = await emailService.sendContactEmail(to, name, text, information, activityTitle);

  if (!result.success) {
    throw new Error(result.error || '聯絡郵件發送失敗');
  }

  const response = createSuccessResponse({
    messageId: result.messageId
  }, {
    message: '聯絡郵件發送成功',
    aggregateData: {
      emailInfo: {
        recipient: to,
        template: 'contact',
        sentAt: new Date().toISOString()
      }
    }
  });

  res.json(response);
});

/**
 * 發送驗證郵件
 * POST /api/v1/email/verification
 */
export const sendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, verifyLink, name } = req.body;

  if (!email) {
    throw new BadRequestError('電子郵件為必填項');
  }

  if (!verifyLink) {
    throw new BadRequestError('驗證連結為必填項');
  }

  // 使用 API 版本
  const result = await sendVerificationEmailApi(email, verifyLink, name);
  res.json(result);
});

/**
 * 發送歡迎郵件
 * POST /api/v1/email/welcome
 */
export const sendWelcomeEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email || !name) {
    throw new BadRequestError('email 和 name 為必填項');
  }

  // 使用 API 版本
  const result = await sendWelcomeEmailApi(email, name);
  res.json(result);
});

/**
 * 發送密碼重設郵件
 * POST /api/v1/email/password-reset
 */
export const sendPasswordResetEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, resetLink, name } = req.body;

  if (!email) {
    throw new BadRequestError('email 為必填項');
  }

  if (!resetLink) {
    throw new BadRequestError('resetLink 為必填項');
  }

  // 發送密碼重設郵件
  const result = await emailService.sendPasswordResetEmail(email, resetLink, name);

  if (!result.success) {
    throw new Error(result.error || '密碼重設郵件發送失敗');
  }

  const response = createSuccessResponse({
    messageId: result.messageId
  }, {
    message: '密碼重設郵件發送成功'
  });

  res.json(response);
});

/**
 * 發送馬拉松郵件
 * POST /api/v1/email/marathon
 */
export const sendMarathonEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, marathonTitle, marathonDate, marathonDescription } = req.body;

  if (!email || !name || !marathonTitle) {
    throw new BadRequestError('email, name, marathonTitle 為必填項');
  }


  // 發送馬拉松郵件
  const result = await emailService.sendMarathonEmail(email, name, marathonTitle, marathonDate, marathonDescription);

  if (!result.success) {
    throw new Error(result.error || '馬拉松郵件發送失敗');
  }

  const response = createSuccessResponse({
    messageId: result.messageId
  }, {
    message: '馬拉松郵件發送成功'
  });

  res.json(response);
});

/**
 * 發送自定義郵件
 * POST /api/v1/email/custom
 */
export const sendCustomEmail = asyncHandler(async (req: Request, res: Response) => {
  const { to, subject, htmlContent, template, data } = req.body;

  if (!to || !subject) {
    throw new BadRequestError('to 和 subject 為必填項');
  }

  let result;

  if (template && data) {
    // 使用模板發送
    const { EmailTemplateService } = await import('../services/email/template.service');
    const templateService = new EmailTemplateService();

    let emailTemplate;
    switch (template) {
      case 'welcome':
        emailTemplate = templateService.generateWelcomeEmail(data);
        break;
      case 'verification':
        emailTemplate = templateService.generateVerificationEmail(data);
        break;
      case 'contact':
        emailTemplate = templateService.generateContactEmail(data);
        break;
      case 'marathon':
        emailTemplate = templateService.generateMarathonEmail(data);
        break;
      case 'passwordReset':
        emailTemplate = templateService.generatePasswordResetEmail(data);
        break;
      default:
        throw new BadRequestError('不支援的模板類型');
    }

    result = await emailService.sendEmail({
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });
  } else if (htmlContent) {
    // 發送自定義 HTML 內容
    result = await emailService.sendEmail({
      to,
      subject,
      html: htmlContent
    });
  } else {
    throw new BadRequestError('必須提供 htmlContent 或 (template + data)');
  }

  if (!result.success) {
    throw new Error(result.error || '自定義郵件發送失敗');
  }

  const response = createSuccessResponse({
    messageId: result.messageId
  }, {
    message: '自定義郵件發送成功'
  });

  res.json(response);
});

/**
 * 批量發送郵件
 * POST /api/v1/email/bulk
 */
export const sendBulkEmail = asyncHandler(async (req: Request, res: Response) => {
  const { template, subject, recipients /* from, scheduledAt */ } = req.body;

  if (!template || !subject || !recipients || !Array.isArray(recipients)) {
    throw new BadRequestError('template, subject, recipients (array) 為必填項');
  }

  if (recipients.length === 0) {
    throw new BadRequestError('recipients 不能為空陣列');
  }

  if (recipients.length > 100) {
    throw new BadRequestError('單次批量發送不能超過 100 個收件人');
  }


  // 發送批量郵件
  const results = await emailService.sendBulkEmail(recipients, template as 'welcome' | 'verification' | 'contact' | 'marathon' | 'custom');

  const successCount = results.success;
  const failureCount = results.failed;

  const response = createSuccessResponse({
    total: results.results.length,
    success: successCount,
    failed: failureCount,
    results: results.results
  }, {
    message: `批量郵件發送完成：成功 ${successCount} 件，失敗 ${failureCount} 件`,
    aggregateData: {
      batchEmail: {
        totalRecipients: results.results.length,
        successCount,
        failureCount,
        processedAt: new Date().toISOString()
      }
    }
  });

  res.json(response);
});

/**
 * 驗證郵件地址
 * POST /api/v1/email/validate
 */
export const validateEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError('email 為必填項');
  }

  const isValid = emailService.validateEmailAddress(email);

  const response = createSuccessResponse({
    email,
    isValid
  }, {
    message: isValid ? '郵件地址有效' : '郵件地址無效'
  });

  res.json(response);
});

/**
 * 預覽郵件模板
 * POST /api/v1/email/preview
 */
export const previewEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { template, data } = req.body;

  if (!template || !data) {
    throw new BadRequestError('template 和 data 為必填項');
  }

  try {
    const { EmailTemplateService } = await import('../services/email/template.service');
    const templateService = new EmailTemplateService();

    let preview;

    switch (template) {
      case 'welcome':
        preview = templateService.generateWelcomeEmail(data);
        break;
      case 'verification':
        preview = templateService.generateVerificationEmail(data);
        break;
      case 'contact':
        preview = templateService.generateContactEmail(data);
        break;
      case 'marathon':
        preview = templateService.generateMarathonEmail(data);
        break;
      case 'passwordReset':
        preview = templateService.generatePasswordResetEmail(data);
        break;
      default:
        throw new Error('不支援的模板類型');
    }

    const response = createSuccessResponse(preview, {
      message: '模板預覽生成成功'
    });

    res.json(response);
  } catch (error) {
    throw new BadRequestError(`模板預覽失敗: ${error instanceof Error ? error.message : String(error)}`);
  }
});

/**
 * 獲取郵件統計
 * GET /api/v1/email/stats
 */
export const getEmailStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  let start: Date | undefined;
  let end: Date | undefined;

  if (startDate) {
    start = new Date(startDate as string);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('startDate 格式無效');
    }
  }

  if (endDate) {
    end = new Date(endDate as string);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('endDate 格式無效');
    }
  }

  const stats = emailService.getStats();

  const response = createSuccessResponse(stats, {
    message: '郵件統計獲取成功'
  });

  res.json(response);
});

/**
 * 檢查郵件服務健康狀態
 * GET /api/v1/email/health
 */
export const checkEmailHealth = asyncHandler(async (req: Request, res: Response) => {
  const healthStatus = await emailService.checkHealth();

  const response = createSuccessResponse({
    status: healthStatus.status,
    lastCheck: healthStatus.lastCheck,
    transporterConnected: healthStatus.transporterConnected,
    error: healthStatus.error
  }, {
    message: healthStatus.status === 'healthy' ? '郵件服務健康狀態正常' : '郵件服務健康狀態異常'
  });

  res.status(healthStatus.status === 'healthy' ? 200 : 503).json(response);
});

// 導出所有控制器方法
export const emailController = {
  sendContactEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMarathonEmail,
  sendCustomEmail,
  sendBulkEmail,
  validateEmail,
  previewEmailTemplate,
  getEmailStats,
  checkEmailHealth
};

export default emailController;