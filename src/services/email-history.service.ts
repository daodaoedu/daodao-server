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
    sortOrder = 'desc'
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
    emailType: log.email_type,
    subject: log.subject,
    status: (log.status as 'sent' | 'failed' | 'pending') ?? 'sent',
    sentAt: log.sent_at?.toISOString() ?? null,
    createdAt: log.created_at?.toISOString() ?? null,
    entityType: log.entity_type,
    entityId: log.entity_id
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
  let totalRecords = 0;

  for (const group of statusGroups) {
    const count = group._count.id;
    totalRecords += count;

    switch (group.status) {
      case 'sent':
        sentCount = count;
        break;
      case 'failed':
        failedCount = count;
        break;
      case 'pending':
        pendingCount = count;
        break;
      default:
        // 其他狀態計入已發送
        sentCount += count;
        break;
    }
  }

  // 計算成功率
  const successRate = totalRecords > 0
    ? Number(((sentCount / totalRecords) * 100).toFixed(2))
    : 0;

  return {
    totalRecords,
    sentCount,
    failedCount,
    pendingCount,
    successRate
  };
};

export const emailHistoryService = {
  getEmailHistory,
  getEmailHistoryStats
};

export default emailHistoryService;
