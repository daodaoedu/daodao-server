/**
 * 郵件歷史服務
 * 提供郵件發送記錄查詢功能
 */

import { prisma } from './database/prisma.service';
import type { Prisma } from '../../generated/prisma';
import type {
  EmailHistoryRecord,
  EmailHistoryFilters,
  EmailHistoryStats,
  EmailHistoryResponse
} from '../types/email-history.types';
import { EMAIL_STATUS } from '../types/email';

/**
 * 取得郵件發送歷史
 * @param filters - 查詢參數
 */
const getEmailHistory = async (filters: EmailHistoryFilters): Promise<EmailHistoryResponse> => {
  const {
    emailType,
    status,
    recipient,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sortBy = 'sentAt',
    sortOrder = 'desc',
    opened
  } = filters;

  // 建構 where 條件
  const where: Prisma.email_logsWhereInput = {};

  if (emailType) {
    where.email_type = emailType;
  }

  if (status) {
    where.status = status;
  }

  if (userId) {
    where.user_id = userId;
  }

  // 如果有 recipient 篩選，需要透過 user 關聯查詢
  if (recipient) {
    where.users = {
      contacts: {
        email: { contains: recipient, mode: 'insensitive' }
      }
    };
  }

  // 開啟狀態篩選
  if (opened === 'true') {
    where.open_count = { gt: 0 };
  } else if (opened === 'false') {
    where.open_count = 0;
  }

  if (startDate || endDate) {
    where.sent_at = {};
    if (startDate) {
      where.sent_at.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.sent_at.lte = end;
    }
  }

  // 計算排序
  const orderBy: Prisma.email_logsOrderByWithRelationInput = {};
  if (sortBy === 'sentAt') {
    orderBy.sent_at = sortOrder;
  } else {
    orderBy.created_at = sortOrder;
  }

  // 查詢總數
  const totalCount = await prisma.email_logs.count({ where });

  // 計算分頁
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;

  // 查詢郵件記錄
  const logs = await prisma.email_logs.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    include: {
      users: {
        select: {
          nickname: true,
          contacts: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });

  // 格式化記錄
  const records: EmailHistoryRecord[] = logs.map(log => ({
    id: log.id,
    userId: log.user_id,
    recipientEmail: log.users?.contacts?.email ?? null,
    recipientName: log.users?.nickname ?? null,
    emailType: log.email_type,
    subject: log.subject,
    status: (log.status as EmailHistoryRecord['status']) ?? 'sent',
    sentAt: log.sent_at?.toISOString() ?? null,
    createdAt: log.created_at?.toISOString() ?? null,
    entityType: log.entity_type,
    entityId: log.entity_id,
    trackingToken: log.tracking_token,
    openedAt: log.opened_at?.toISOString() ?? null,
    openCount: log.open_count
  }));

  // 計算統計
  const stats = await getEmailHistoryStats(where);

  return {
    records,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    },
    stats
  };
};

/**
 * 計算郵件歷史統計
 * @param where - 查詢條件（用於反映篩選）
 */
const getEmailHistoryStats = async (
  where: Prisma.email_logsWhereInput = {}
): Promise<EmailHistoryStats> => {
  // 依狀態分組統計
  const statusGroups = await prisma.email_logs.groupBy({
    by: ['status'],
    where,
    _count: { id: true }
  });

  let sentCount = 0;
  let failedCount = 0;
  let pendingCount = 0;
  let skippedCount = 0;
  let totalRecords = 0;

  for (const group of statusGroups) {
    const count = group._count.id;
    totalRecords += count;

    switch (group.status) {
      case EMAIL_STATUS.SENT:
        sentCount += count;
        break;
      case EMAIL_STATUS.FAILED:
        failedCount += count;
        break;
      case EMAIL_STATUS.PENDING:
        pendingCount += count;
        break;
      case EMAIL_STATUS.SKIPPED:
        // 後台停用模板、沒有真的寄出，不算已發送（daodao#294）
        skippedCount += count;
        break;
      default:
        // 未知狀態只計入總數，不灌進已發送
        break;
    }
  }

  // 成功率只看真的嘗試寄出的信（sent + failed），排除 skipped 與 pending
  const attemptedCount = sentCount + failedCount;
  const successRate = attemptedCount > 0
    ? Number(((sentCount / attemptedCount) * 100).toFixed(2))
    : 0;

  // 計算開啟統計
  const openedCount = await prisma.email_logs.count({
    where: {
      ...where,
      open_count: { gt: 0 },
    },
  });

  const openRate = sentCount > 0
    ? Number(((openedCount / sentCount) * 100).toFixed(2))
    : 0;

  return {
    totalRecords,
    sentCount,
    failedCount,
    pendingCount,
    skippedCount,
    successRate,
    openedCount,
    openRate
  };
};

export const emailHistoryService = {
  getEmailHistory,
  getEmailHistoryStats
};

export default emailHistoryService;
