/**
 * 郵件控制器（v1 版本）
 * 處理郵件發送相關的 API 請求，使用增強的郵件服務
 */

import { Request, Response } from 'express';
import { emailService, sendWelcomeEmailWithLog } from '../services/email/email.service';
import type { EmailSendResult } from '../services/email/email.service';
import {
  createEmailLog,
  updateEmailLogStatus,
  resolveUserIdByEmail,
  prepareBulkEmailLogs,
} from '../services/email/email-log.service';
import { EMAIL_TYPES, EMAIL_STATUS } from '../types/email';
import { EMAIL_ERROR_CODES, getErrorMessage } from '../constants/errors';
import { emailHistoryService } from '../services/email-history.service';

const EMAIL_ALREADY_SENT_MESSAGE = getErrorMessage(EMAIL_ERROR_CODES.ALREADY_SENT);
/** 後台停用該類型模板時不寄出，屬營運選擇而非錯誤（daodao#236 AC-02） */
const EMAIL_TEMPLATE_DISABLED_MESSAGE = getErrorMessage(EMAIL_ERROR_CODES.TEMPLATE_DISABLED);
import { prisma } from '../services/database/prisma.service';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import loggerService from '../services/logging/logger.service';

/**
 * 發送郵件並記錄到 email_logs（內部輔助函式）
 * 若能解析出 userId，則建立 pending log、注入 tracking token、更新最終狀態；
 * 若無法解析，則直接發送不記錄。
 */
const sendEmailAndLog = async (params: {
  to: string;
  subject: string;
  sendFn: (trackingToken?: string) => Promise<EmailSendResult>;
}): Promise<EmailSendResult> => {
  const { to, subject, sendFn } = params;

  let logRecord: { id: number; tracking_token: string | null } | undefined;
  try {
    const userId = await resolveUserIdByEmail(to);
    if (userId) {
      logRecord = await createEmailLog({
        userId,
        emailType: EMAIL_TYPES.NOTIFICATION,
        subject,
        status: EMAIL_STATUS.PENDING,
      });
    }
  } catch (error) {
    const errorDetail = error instanceof Error ? error.message : String(error);
    loggerService.error(`建立郵件日誌記錄失敗 - email: ${to}: ${errorDetail}`);
  }

  const result = await sendFn(logRecord?.tracking_token ?? undefined);

  if (logRecord) {
    try {
      await updateEmailLogStatus(logRecord.id, result.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED);
    } catch (error) {
      const errorDetail = error instanceof Error ? error.message : String(error);
      loggerService.error(`更新郵件日誌狀態失敗 - email: ${to}: ${errorDetail}`);
    }
  }

  return result;
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
    if (result.skipped) {
      res.json(createSuccessResponse({ messageId: undefined }, { message: EMAIL_TEMPLATE_DISABLED_MESSAGE }));
      return;
    }
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
  const { email, name, practiceUrl, unsubscribeUrl } = req.body;

  if (!email || !name) {
    throw new BadRequestError('email 和 name 為必填項');
  }

  // 查找用戶 ID 以啟用 email_logs 記錄
  const userId = await resolveUserIdByEmail(email);

  const emailData = {
    name,
    practiceUrl,
    unsubscribeUrl,
  };

  const result = userId
    ? await sendWelcomeEmailWithLog(email, { ...emailData, userId })
    : await emailService.sendWelcomeEmail(email, emailData);

  if (!result.success) {
    // 已寄送過：視為冪等成功，不拋出錯誤
    if (result.error === EMAIL_ALREADY_SENT_MESSAGE) {
      res.json(createSuccessResponse({ messageId: undefined }, { message: '歡迎郵件已於先前寄送' }));
      return;
    }
    if (result.skipped) {
      res.json(createSuccessResponse({ messageId: undefined }, { message: EMAIL_TEMPLATE_DISABLED_MESSAGE }));
      return;
    }
    throw new Error(result.error || '發送歡迎郵件失敗');
  }

  const response = createSuccessResponse({
    messageId: result.messageId
  }, {
    message: '歡迎郵件發送成功',
    aggregateData: {
      emailInfo: {
        recipient: email,
        template: 'welcome',
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
    if (result.skipped) {
      res.json(createSuccessResponse({ messageId: undefined }, { message: EMAIL_TEMPLATE_DISABLED_MESSAGE }));
      return;
    }
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
    if (result.skipped) {
      res.json(createSuccessResponse({ messageId: undefined }, { message: EMAIL_TEMPLATE_DISABLED_MESSAGE }));
      return;
    }
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

  // 組裝郵件內容
  let emailHtml: string;
  let emailSubject: string = subject;

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
    emailHtml = emailTemplate.html;
    emailSubject = emailTemplate.subject;
  } else if (htmlContent) {
    emailHtml = htmlContent;
  } else {
    throw new BadRequestError('必須提供 htmlContent 或 (template + data)');
  }

  // 對每位收件人分別發送並記錄日誌
  const recipients = Array.isArray(to) ? to : [to];
  const sendResults = await Promise.allSettled(
    recipients.map(recipientEmail =>
      sendEmailAndLog({
        to: recipientEmail,
        subject: emailSubject,
        sendFn: (trackingToken) => emailService.sendEmail({
          to: recipientEmail,
          subject: emailSubject,
          html: emailHtml,
          trackingToken,
        }),
      })
    )
  );

  const firstResult = sendResults[0];
  if (firstResult?.status === 'rejected') {
    throw new Error(String(firstResult.reason) || '自定義郵件發送失敗');
  }
  const emailResult = firstResult?.status === 'fulfilled' ? firstResult.value : null;
  if (emailResult && !emailResult.success) {
    throw new Error(emailResult.error || '自定義郵件發送失敗');
  }

  const response = createSuccessResponse({
    messageId: emailResult?.messageId
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


  // 為有對應帳號的收件人預先建立 pending email_logs
  const recipientEmails = recipients.map((r: { email: string }) => r.email);
  const logRecords = await prepareBulkEmailLogs(
    recipientEmails,
    EMAIL_TYPES.NOTIFICATION,
    subject,
  );

  // 發送批量郵件
  const results = await emailService.sendBulkEmail(recipients, template as 'welcome' | 'verification' | 'contact' | 'marathon' | 'custom');

  // 根據發送結果批次更新 log 狀態
  await Promise.allSettled(
    recipients.map(async (recipient: { email: string }, index: number) => {
      const logId = logRecords.get(recipient.email.toLowerCase());
      if (!logId) return;
      const sendResult = results.results[index];
      if (!sendResult) return;
      await updateEmailLogStatus(logId, sendResult.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED);
    })
  );

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

/**
 * 手動重試失敗的郵件（批次）
 * POST /api/v1/email/retry-failed
 */
export const retryFailedEmailsHandler = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.body?.limit ?? 50;

  const { retryFailedEmails } = await import('../queues/email.queue');
  const result = await retryFailedEmails({ limit });

  const response = createSuccessResponse(result, {
    message: `重試完成：${result.retried} 封重新排入佇列，${result.failed} 封失敗`,
  });

  res.json(response);
});

/**
 * 重試單封失敗的郵件
 * POST /api/v1/email/retry/:logId
 */
export const retrySingleEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const logId = parseInt(req.params.logId, 10);
  if (isNaN(logId) || logId <= 0) {
    throw new BadRequestError('logId 必須為正整數');
  }

  const { retrySingleFailedEmail } = await import('../queues/email.queue');
  const success = await retrySingleFailedEmail(logId);

  if (!success) {
    const response = createSuccessResponse({ retried: false }, {
      message: '找不到對應的失敗郵件，可能已過期或不在失敗佇列中',
    });
    res.status(404).json(response);
    return;
  }

  const response = createSuccessResponse({ retried: true }, {
    message: '郵件已重新排入發送佇列',
  });

  res.json(response);
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
  checkEmailHealth,
  retryFailedEmailsHandler,
  retrySingleEmailHandler,
};

export default emailController;