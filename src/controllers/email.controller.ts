/**
 * 郵件控制器（v1 版本）
 * 處理郵件發送相關的 API 請求，使用增強的郵件服務
 */

import { Request, Response } from 'express';
import { emailService, sendWelcomeEmailWithLog } from '../services/email/email.service';
import { createEmailLog, updateEmailLogStatus } from '../services/email/email-log.service';
import { EMAIL_TYPES, EMAIL_STATUS } from '../types/email';
import type { EmailTypeValue } from '../types/email';
import { emailHistoryService } from '../services/email-history.service';
import { prisma } from '../services/database/prisma.service';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';

/**
 * 透過 email 查找對應的用戶 ID
 * @param email - 收件人 email
 * @returns userId 或 null（找不到用戶時）
 */
const resolveUserIdByEmail = async (email: string): Promise<number | null> => {
  const user = await prisma.users.findFirst({
    where: {
      contacts: {
        email: { equals: email, mode: 'insensitive' }
      }
    },
    select: { id: true }
  });
  return user?.id ?? null;
};

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

  // 查找用戶 ID 以啟用 email_logs 記錄
  const userId = await resolveUserIdByEmail(to) ?? undefined;

  // 發送郵件
  const result = await emailService.sendContactEmail(to, name, text, information, activityTitle, userId);

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

  // 查找用戶 ID 以啟用 email_logs 記錄
  const userId = await resolveUserIdByEmail(email) ?? undefined;

  const result = await emailService.sendVerificationEmail(email, verifyLink, name, userId);

  if (!result.success) {
    throw new Error(result.error || '發送驗證郵件失敗');
  }

  const response = createSuccessResponse({
    messageId: result.messageId
  }, {
    message: '驗證郵件發送成功',
    aggregateData: {
      emailInfo: {
        recipient: email,
        template: 'verification',
        sentAt: new Date().toISOString()
      }
    }
  });

  res.json(response);
});

/**
 * 發送歡迎郵件
 * POST /api/v1/email/welcome
 */
export const sendWelcomeEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, hasCompletedQuiz, practiceUrl, quizUrl, illustrationUrl, unsubscribeUrl } = req.body;

  if (!email || !name) {
    throw new BadRequestError('email 和 name 為必填項');
  }

  // 查找用戶 ID 以啟用 email_logs 記錄
  const userId = await resolveUserIdByEmail(email);

  let result;

  if (userId) {
    // 有用戶 ID 時使用含 log 記錄的版本
    result = await sendWelcomeEmailWithLog(email, {
      name,
      hasCompletedQuiz: hasCompletedQuiz ?? false,
      practiceUrl,
      quizUrl,
      illustrationUrl,
      unsubscribeUrl,
      userId
    });
  } else {
    // 找不到用戶時直接發送（不記錄）
    result = await emailService.sendWelcomeEmail(email, {
      name,
      hasCompletedQuiz: hasCompletedQuiz ?? false,
      practiceUrl,
      quizUrl,
      illustrationUrl,
      unsubscribeUrl
    });
  }

  if (!result.success) {
    throw new Error(result.error || '發送歡迎郵件失敗');
  }

  const response = createSuccessResponse({
    messageId: result.messageId
  }, {
    message: '歡迎郵件發送成功',
    aggregateData: {
      emailInfo: {
        recipient: email,
        template: hasCompletedQuiz ? 'welcome-completed' : 'welcome-pending',
        sentAt: new Date().toISOString()
      }
    }
  });

  res.json(response);
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

  // 查找用戶 ID 以啟用 email_logs 記錄
  const userId = await resolveUserIdByEmail(email) ?? undefined;

  // 發送密碼重設郵件
  const result = await emailService.sendPasswordResetEmail(email, resetLink, name, userId);

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


  // 查找用戶 ID 以啟用 email_logs 記錄
  const userId = await resolveUserIdByEmail(email) ?? undefined;

  // 發送馬拉松郵件
  const result = await emailService.sendMarathonEmail(email, name, marathonTitle, marathonDate, marathonDescription, userId);

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

  // 查找用戶 ID 以啟用 email_logs 記錄
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  const userId = await resolveUserIdByEmail(recipientEmail);

  let result;
  let finalSubject = subject;

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

    finalSubject = emailTemplate.subject;

    // 建立 email_logs 記錄（若有用戶 ID）
    let logRecord;
    if (userId) {
      try {
        logRecord = await createEmailLog({
          userId,
          emailType: EMAIL_TYPES.NOTIFICATION as EmailTypeValue,
          subject: finalSubject,
          status: EMAIL_STATUS.PENDING,
        });
      } catch {
        // 記錄失敗不影響發送
      }
    }

    result = await emailService.sendEmail({
      to,
      subject: finalSubject,
      html: emailTemplate.html,
      trackingToken: logRecord?.tracking_token ?? undefined,
    });

    if (logRecord) {
      try {
        await updateEmailLogStatus(logRecord.id, result.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED);
      } catch {
        // 更新失敗不影響回應
      }
    }
  } else if (htmlContent) {
    // 建立 email_logs 記錄（若有用戶 ID）
    let logRecord;
    if (userId) {
      try {
        logRecord = await createEmailLog({
          userId,
          emailType: EMAIL_TYPES.NOTIFICATION as EmailTypeValue,
          subject: finalSubject,
          status: EMAIL_STATUS.PENDING,
        });
      } catch {
        // 記錄失敗不影響發送
      }
    }

    // 發送自定義 HTML 內容
    result = await emailService.sendEmail({
      to,
      subject,
      html: htmlContent,
      trackingToken: logRecord?.tracking_token ?? undefined,
    });

    if (logRecord) {
      try {
        await updateEmailLogStatus(logRecord.id, result.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED);
      } catch {
        // 更新失敗不影響回應
      }
    }
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


  // 批次查找用戶 ID 以啟用 email_logs 記錄
  const recipientEmails = recipients.map((r: { email: string }) => r.email);
  const users = await prisma.users.findMany({
    where: {
      contacts: {
        email: { in: recipientEmails, mode: 'insensitive' }
      }
    },
    select: { id: true, contacts: { select: { email: true } } }
  });
  const emailToUserId = new Map(
    users.map(u => [u.contacts?.email?.toLowerCase() ?? '', u.id])
  );

  // 為每個收件人建立 pending 的 email_logs 記錄
  const logRecords: Map<string, number> = new Map();
  for (const recipient of recipients) {
    const uid = emailToUserId.get(recipient.email.toLowerCase());
    if (uid) {
      try {
        const log = await createEmailLog({
          userId: uid,
          emailType: EMAIL_TYPES.NOTIFICATION as EmailTypeValue,
          subject: template,
          status: EMAIL_STATUS.PENDING,
        });
        logRecords.set(recipient.email.toLowerCase(), log.id);
      } catch {
        // 記錄失敗不影響發送
      }
    }
  }

  // 發送批量郵件
  const results = await emailService.sendBulkEmail(recipients, template as 'welcome' | 'verification' | 'contact' | 'marathon' | 'custom');

  // 更新 email_logs 狀態
  for (let i = 0; i < recipients.length; i++) {
    const logId = logRecords.get(recipients[i].email.toLowerCase());
    if (logId) {
      try {
        await updateEmailLogStatus(logId, results.results[i]?.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED);
      } catch {
        // 更新失敗不影響回應
      }
    }
  }

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

  // 建構日期篩選條件
  const where: { sent_at?: { gte?: Date; lte?: Date } } = {};

  if (startDate) {
    const start = new Date(startDate as string);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('startDate 格式無效');
    }
    where.sent_at = { ...where.sent_at, gte: start };
  }

  if (endDate) {
    const end = new Date(endDate as string);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('endDate 格式無效');
    }
    end.setHours(23, 59, 59, 999);
    where.sent_at = { ...where.sent_at, lte: end };
  }

  // 從資料庫取得統計（非記憶體）
  const historyStats = await emailHistoryService.getEmailHistoryStats(where);

  // 依模板（email_type）分組統計
  const templateGroups = await prisma.email_logs.groupBy({
    by: ['email_type'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  const byTemplate = templateGroups.map(group => ({
    template: group.email_type,
    count: group._count.id
  }));

  const response = createSuccessResponse({
    totalSent: historyStats.sentCount,
    totalFailed: historyStats.failedCount,
    successRate: historyStats.successRate,
    byTemplate
  }, {
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