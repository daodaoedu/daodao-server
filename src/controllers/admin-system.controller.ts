/**
 * Admin 系統監控與儀表板控制器
 * 處理系統狀態、資料庫、Redis、儀表板與 Email 相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminSystemService from '../services/admin-system.service';
import { emailService } from '../services/email/email.service';
import { generateStandardEmail } from '../services/email/base-template';
import { emailSendSchema, emailBulkSendSchema } from '../validators/admin-system.validator';
import { bulkEnqueueEmails } from '../queues/email.queue';

/**
 * 取得系統監控資訊
 * GET /admin/system/monitor
 */
const getSystemMonitor = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminSystemService.getSystemMonitor();
  res.json(createSuccessResponse(data));
});

/**
 * 取得資料庫連線資訊
 * GET /admin/system/db-info
 */
const getDbInfo = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminSystemService.getDbInfo();
  res.json(createSuccessResponse(data));
});

/**
 * 取得 Redis 資訊
 * GET /admin/system/redis-info
 */
const getRedisInfo = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminSystemService.getRedisInfo();
  res.json(createSuccessResponse(data));
});

/**
 * 取得儀表板總覽
 * GET /admin/dashboard/overview
 */
const getDashboardOverview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminSystemService.getDashboardOverview();
  res.json(createSuccessResponse(data));
});

/**
 * 取得儀表板活躍用戶數
 * GET /admin/dashboard/active-users
 */
const getDashboardActiveUsers = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminSystemService.getDashboardActiveUsers();
  res.json(createSuccessResponse(data));
});

/**
 * 取得 Email 統計
 * GET /admin/email/stats
 */
const getEmailStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminSystemService.getEmailStats();
  res.json(createSuccessResponse(data));
});

/**
 * 取得 Email 健康狀態
 * GET /admin/email/health
 */
const getEmailHealth = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminSystemService.getEmailHealth();
  res.json(createSuccessResponse(data));
});

/**
 * 發送單封 Email
 * POST /admin/email/send
 */
const sendEmail = asyncHandler(async (req: Request, res: Response) => {
  const input = emailSendSchema.parse(req.body);
  const isFullHtml = input.body.trimStart().startsWith('<!DOCTYPE') || input.body.trimStart().startsWith('<html');
  const html = isFullHtml
    ? input.body
    : generateStandardEmail({ title: input.subject, subject: input.subject, preheader: '', content: input.body }).html;
  const result = await emailService.sendEmail({
    to: input.to,
    subject: input.subject,
    html,
  });
  if (!result.success) {
    res.status(500).json({ success: false, error: { code: 'EMAIL_SEND_FAILED', message: result.error ?? '發送失敗' } });
    return;
  }
  res.json(createSuccessResponse({ sent: true, to: input.to }));
});

/**
 * 批次發送 Email
 * POST /admin/email/bulk-send
 */
const sendBulkEmail = asyncHandler(async (req: Request, res: Response) => {
  const input = emailBulkSendSchema.parse(req.body);

  const recipients = await adminSystemService.getBulkEmailRecipients(input.tagId);
  if (recipients.length === 0) {
    throw new BadRequestError('找不到符合條件的收件人');
  }

  const isFullHtml = input.body.trimStart().startsWith('<!DOCTYPE') || input.body.trimStart().startsWith('<html');
  const html = isFullHtml
    ? input.body
    : generateStandardEmail({ title: input.subject, subject: input.subject, preheader: '', content: input.body }).html;

  await bulkEnqueueEmails(
    recipients.map((to) => ({
      to,
      subject: input.subject,
      html,
      emailType: 'bulk_admin',
    }))
  );

  res.json(createSuccessResponse({ queued: true, subject: input.subject, recipientCount: recipients.length }));
});

export default {
  getSystemMonitor,
  getDbInfo,
  getRedisInfo,
  getDashboardOverview,
  getDashboardActiveUsers,
  getEmailStats,
  getEmailHealth,
  sendEmail,
  sendBulkEmail,
};
