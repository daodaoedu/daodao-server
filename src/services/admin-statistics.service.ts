/**
 * Admin 統計服務
 * 提供全站統計數據
 */

import { prisma } from './database/prisma.service';
import type { Prisma } from '../../generated/prisma';
import type {
  PracticeStatsResponse,
  PracticeStatsFilters,
  ActiveUsersTrendResponse,
  ActiveUsersTrendDataPoint,
  ActiveUsersTrendFilters
} from '../types/admin-statistics.types';

/**
 * 取得全站實踐統計
 * @param filters - 查詢參數
 */
const getPracticeStats = async (filters: PracticeStatsFilters): Promise<PracticeStatsResponse> => {
  const { startDate, endDate } = filters;

  // 建構 where 條件
  const where: Prisma.practicesWhereInput = {};

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.created_at.lte = end;
    }
  }

  // 查詢總數
  const totalPractices = await prisma.practices.count({ where });

  // 依狀態分組統計
  const statusGroups = await prisma.practices.groupBy({
    by: ['status'],
    where,
    _count: { id: true }
  });

  // 計算各狀態數量
  let activePractices = 0;
  let completedPractices = 0;
  const practicesByStatus: Array<{ status: string; count: number }> = [];

  for (const group of statusGroups) {
    const status = group.status ?? 'unknown';
    const count = group._count.id;
    practicesByStatus.push({ status, count });

    if (status === 'active' || status === 'in_progress') {
      activePractices += count;
    } else if (status === 'completed' || status === 'done') {
      completedPractices += count;
    }
  }

  // 計算平均完成率
  const averageCompletionRate = totalPractices > 0
    ? Number(((completedPractices / totalPractices) * 100).toFixed(2))
    : 0;

  // 依分類統計（透過 template）
  const practicesWithTemplate = await prisma.practices.findMany({
    where: {
      ...where,
      template_id: { not: null }
    },
    select: {
      practice_templates: {
        select: {
          practice_template_categories: {
            select: {
              content_categories: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  // 統計各分類數量
  const categoryCountMap = new Map<string, number>();
  for (const practice of practicesWithTemplate) {
    if (practice.practice_templates?.practice_template_categories) {
      for (const tc of practice.practice_templates.practice_template_categories) {
        const categoryName = tc.content_categories.name;
        categoryCountMap.set(categoryName, (categoryCountMap.get(categoryName) ?? 0) + 1);
      }
    }
  }

  const practicesByCategory = Array.from(categoryCountMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPractices,
    activePractices,
    completedPractices,
    averageCompletionRate,
    practicesByCategory,
    practicesByStatus
  };
};

/**
 * 取得活躍用戶趨勢（DAU/WAU/MAU 時間序列）
 * @param filters - 查詢參數
 */
const getActiveUsersTrend = async (filters: ActiveUsersTrendFilters): Promise<ActiveUsersTrendResponse> => {
  let { days = 30 } = filters;
  const MAX_DAYS = 90;
  const isLimited = days > MAX_DAYS;

  // 限制最大天數
  if (days > MAX_DAYS) {
    days = MAX_DAYS;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  // 使用 raw SQL 計算每日 DAU
  // DAU: 當天有登入的不重複用戶數
  const dauQuery = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT DATE(login_at AT TIME ZONE 'UTC') as date, COUNT(DISTINCT user_id) as count
    FROM user_login_history
    WHERE login_at >= ${startDate}
      AND login_at <= ${endDate}
    GROUP BY DATE(login_at AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `;

  // 將結果轉換為 Map
  const dauMap = new Map<string, number>();
  for (const row of dauQuery) {
    const dateStr = row.date.toISOString().split('T')[0];
    dauMap.set(dateStr, Number(row.count));
  }

  // 計算每天的 WAU 和 MAU
  const trend: ActiveUsersTrendDataPoint[] = [];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // DAU - 當天
    const dau = dauMap.get(dateStr) ?? 0;

    // WAU - 過去 7 天（含當天）
    const wauStart = new Date(currentDate);
    wauStart.setDate(currentDate.getDate() - 6);

    const wauCount = await prisma.user_login_history.groupBy({
      by: ['user_id'],
      where: {
        login_at: {
          gte: wauStart,
          lte: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      }
    });
    const wau = wauCount.length;

    // MAU - 過去 30 天（含當天）
    const mauStart = new Date(currentDate);
    mauStart.setDate(currentDate.getDate() - 29);

    const mauCount = await prisma.user_login_history.groupBy({
      by: ['user_id'],
      where: {
        login_at: {
          gte: mauStart,
          lte: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      }
    });
    const mau = mauCount.length;

    trend.push({
      date: dateStr,
      dau,
      wau,
      mau
    });
  }

  return {
    trend,
    metadata: {
      days,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      isLimited,
      generatedAt: new Date().toISOString()
    }
  };
};

export const adminStatisticsService = {
  getPracticeStats,
  getActiveUsersTrend
};

export default adminStatisticsService;
