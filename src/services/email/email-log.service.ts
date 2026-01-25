/**
 * 郵件發送紀錄服務
 * 用於記錄郵件發送狀態、避免重複發送、追蹤發送歷史
 * @see docs/email/implementation-guide.md 第 0 章
 */

import { prisma } from '../database/prisma.service';
import type { EmailLogData, EmailTypeValue, EmailStatusValue } from '../../types/email';
import { EMAIL_STATUS } from '../../types/email';

/**
 * 記錄郵件發送
 */
export const createEmailLog = async (data: EmailLogData) => {
  return prisma.email_logs.create({
    data: {
      user_id: data.userId,
      email_type: data.emailType,
      entity_type: data.entityType ?? null,
      entity_id: data.entityId ?? null,
      email_code: data.emailCode ?? null,
      subject: data.subject,
      status: data.status || EMAIL_STATUS.SENT,
      sent_at: new Date(),
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
 */
export const hasEmailBeenSent = async (params: {
  userId: number;
  emailType: EmailTypeValue;
  entityType?: string;
  entityId?: number;
  emailCode?: string;
}): Promise<boolean> => {
  const { userId, emailType, entityType, entityId, emailCode } = params;

  const existing = await prisma.email_logs.findFirst({
    where: {
      user_id: userId,
      email_type: emailType,
      ...(entityType && { entity_type: entityType }),
      ...(entityId && { entity_id: entityId }),
      ...(emailCode && { email_code: emailCode }),
      status: EMAIL_STATUS.SENT,
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
