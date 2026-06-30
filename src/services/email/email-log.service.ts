/**
 * 郵件發送紀錄服務
 * 用於記錄郵件發送狀態、避免重複發送、追蹤發送歷史
 * @see docs/email/implementation-guide.md 第 0 章
 */

import crypto from 'crypto';
import { prisma } from '../database/prisma.service';
import type { EmailLogData, EmailTypeValue, EmailStatusValue } from '../../types/email';
import { EMAIL_STATUS } from '../../types/email';
import loggerService from '../logging/logger.service';

/**
 * 記錄郵件發送
 */
export const createEmailLog = async (data: EmailLogData) => {
  const trackingToken = data.trackingToken ?? crypto.randomUUID();

  return prisma.email_logs.create({
    data: {
      user_id: data.userId,
      email_type: data.emailType,
      entity_type: data.entityType ?? null,
      entity_id: data.entityId ?? null,
      email_code: data.emailCode ?? null,
      subject: data.subject,
      status: data.status || EMAIL_STATUS.SENT,
      tracking_token: trackingToken,
      sent_at: new Date(),
    },
  });
};

/**
 * 記錄 email 開啟事件
 * 首次開啟時設定 opened_at，每次開啟時遞增 open_count
 */
export const recordEmailOpen = async (trackingToken: string) => {
  const log = await prisma.email_logs.findUnique({
    where: { tracking_token: trackingToken },
    select: { id: true, opened_at: true },
  });

  if (!log) return null;

  return prisma.email_logs.update({
    where: { id: log.id },
    data: {
      opened_at: log.opened_at ?? new Date(),
      open_count: { increment: 1 },
    },
  });
};

/**
 * 更新郵件發送狀態
 */
export const updateEmailLogStatus = async (
  logId: number,
  status: EmailStatusValue
) => {
  return prisma.email_logs.update({
    where: { id: logId },
    data: {
      status,
      ...(status === EMAIL_STATUS.SENT && { sent_at: new Date() }),
    },
  });
};

/**
 * 檢查是否已發送過特定郵件（避免重複發送）
 * @param params.since 若提供，只檢查此日期之後的發送紀錄（用於週報等週期性郵件）
 */
export const hasEmailBeenSent = async (params: {
  userId: number;
  emailType: EmailTypeValue;
  entityType?: string;
  entityId?: number;
  emailCode?: string;
  since?: Date;
}): Promise<boolean> => {
  const { userId, emailType, entityType, entityId, emailCode, since } = params;

  const existing = await prisma.email_logs.findFirst({
    where: {
      user_id: userId,
      email_type: emailType,
      ...(entityType && { entity_type: entityType }),
      ...(entityId && { entity_id: entityId }),
      ...(emailCode && { email_code: emailCode }),
      status: EMAIL_STATUS.SENT,
      ...(since && { sent_at: { gte: since } }),
    },
  });

  return !!existing;
};

/**
 * 取得用戶的郵件發送歷史
 */
export const getUserEmailHistory = async (
  userId: number,
  options?: {
    emailType?: EmailTypeValue;
    limit?: number;
  }
) => {
  return prisma.email_logs.findMany({
    where: {
      user_id: userId,
      ...(options?.emailType && { email_type: options.emailType }),
    },
    orderBy: { sent_at: 'desc' },
    take: options?.limit || 50,
  });
};

/**
 * 計算特定時間內的發送次數（用於沉默邏輯）
 */
export const getEmailCountInPeriod = async (params: {
  userId: number;
  emailType: EmailTypeValue;
  sinceDate: Date;
}): Promise<number> => {
  const { userId, emailType, sinceDate } = params;

  return prisma.email_logs.count({
    where: {
      user_id: userId,
      email_type: emailType,
      sent_at: { gte: sinceDate },
      status: EMAIL_STATUS.SENT,
    },
  });
};

/**
 * 取得特定實體的郵件發送紀錄
 */
export const getEntityEmailLogs = async (params: {
  entityType: string;
  entityId: number;
  emailType?: EmailTypeValue;
}) => {
  const { entityType, entityId, emailType } = params;

  return prisma.email_logs.findMany({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      ...(emailType && { email_type: emailType }),
    },
    orderBy: { sent_at: 'desc' },
  });
};

/**
 * 透過 email 查找對應的用戶 ID
 * 注意：contacts.email 無唯一約束，若有多筆匹配將回傳最早建立的用戶
 * @param email - 收件人 email
 * @returns userId 或 null（找不到用戶時）
 */
export const resolveUserIdByEmail = async (email: string): Promise<number | null> => {
  const user = await prisma.users.findFirst({
    where: {
      contacts: {
        email: { equals: email, mode: 'insensitive' }
      }
    },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  return user?.id ?? null;
};

/**
 * 批次更新郵件日誌狀態
 * @param logIds - 要更新的 log ID 陣列
 * @param status - 目標狀態
 */
export const batchUpdateEmailLogStatus = async (
  logIds: number[],
  status: EmailStatusValue
) => {
  if (logIds.length === 0) return;
  return prisma.email_logs.updateMany({
    where: { id: { in: logIds } },
    data: {
      status,
      ...(status === EMAIL_STATUS.SENT && { sent_at: new Date() }),
    },
  });
};

/**
 * 批次為多個收件人建立 pending email_logs
 * 找不到對應用戶的 email 會略過（不報錯）
 * @returns Map<email 小寫, logId>
 */
export const prepareBulkEmailLogs = async (
  emails: string[],
  emailType: EmailTypeValue,
  subject: string,
): Promise<Map<string, number>> => {
  const users = await prisma.users.findMany({
    where: { contacts: { email: { in: emails, mode: 'insensitive' } } },
    select: { id: true, contacts: { select: { email: true } } },
  });

  const emailToUserId = new Map(
    users.map(u => [(u.contacts?.email ?? '').toLowerCase(), u.id])
  );

  const logRecords = new Map<string, number>();
  const results = await Promise.allSettled(
    emails.map(async (email) => {
      const uid = emailToUserId.get(email.toLowerCase());
      if (!uid) return;
      const log = await createEmailLog({
        userId: uid,
        emailType,
        subject,
        status: EMAIL_STATUS.PENDING,
      });
      logRecords.set(email.toLowerCase(), log.id);
    })
  );

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    loggerService.error(`批次建立郵件日誌失敗 ${failures.length} 筆`);
  }

  return logRecords;
};

/**
 * 撈取可重試的失敗郵件（status='failed', retry_count < maxRetries, 在指定時間範圍內）
 */
export const findFailedEmailsForRetry = async (params: {
  maxRetries?: number;
  sinceHours?: number;
  limit?: number;
} = {}) => {
  const { maxRetries = 3, sinceHours = 24, limit = 50 } = params;
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  return prisma.email_logs.findMany({
    where: {
      status: EMAIL_STATUS.FAILED,
      retry_count: { lt: maxRetries },
      created_at: { gte: since },
    },
    include: {
      users: {
        select: { contacts: { select: { email: true } } },
      },
    },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
};

/**
 * 將 email_log 標記為已重新排入佇列（retry_count + 1, status → pending）
 */
export const markEmailLogRetrying = async (logId: number) => {
  return prisma.email_logs.update({
    where: { id: logId },
    data: {
      status: EMAIL_STATUS.PENDING,
      retry_count: { increment: 1 },
      last_retry_at: new Date(),
    },
  });
};

/**
 * 取得最近一次特定類型郵件的發送時間
 */
export const getLastEmailSentAt = async (params: {
  userId: number;
  emailType: EmailTypeValue;
  entityType?: string;
  entityId?: number;
}): Promise<Date | null> => {
  const { userId, emailType, entityType, entityId } = params;

  const log = await prisma.email_logs.findFirst({
    where: {
      user_id: userId,
      email_type: emailType,
      ...(entityType && { entity_type: entityType }),
      ...(entityId && { entity_id: entityId }),
      status: EMAIL_STATUS.SENT,
    },
    orderBy: { sent_at: 'desc' },
    select: { sent_at: true },
  });

  return log?.sent_at ?? null;
};
