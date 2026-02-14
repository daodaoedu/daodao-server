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

/** 視為「進行中」的實踐狀態 */
const ACTIVE_PRACTICE_STATUSES = ['active', 'in_progress'] as const;
/** 視為「已完成」的實踐狀態 */
const COMPLETED_PRACTICE_STATUSES = ['completed', 'done'] as const;

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
  const total = await prisma.practices.count({ where });

  // 查詢總簽到數
  const totalCheckIns = await prisma.practice_checkins.count({
    where: where.created_at ? {
      practices: { created_at: where.created_at }
    } : undefined
  });

  // 依狀態分組統計
  const statusGroups = await prisma.practices.groupBy({
    by: ['status'],
    where,
    _count: { id: true }
  });

  // 計算各狀態數量
  let active = 0;
  let completed = 0;
  const practicesByStatus: Array<{ status: string; count: number }> = [];

  for (const group of statusGroups) {
    const status = group.status ?? 'unknown';
    const count = group._count.id;
    practicesByStatus.push({ status, count });

    if ((ACTIVE_PRACTICE_STATUSES as readonly string[]).includes(status)) {
      active += count;
    } else if ((COMPLETED_PRACTICE_STATUSES as readonly string[]).includes(status)) {
      completed += count;
    }
  }

  // 計算平均完成率
  const averageCompletionRate = total > 0
    ? Number(((completed / total) * 100).toFixed(2))
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
    total,
    active,
    completed,
    totalCheckIns,
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

  // WAU/MAU 計算需要額外回溯 29 天的資料
  const extendedStart = new Date(startDate);
  extendedStart.setDate(startDate.getDate() - 29);

  // 一次查出整個時間範圍（含回溯期）的每日不重複用戶數
  const dailyUsers = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT DATE(login_at AT TIME ZONE 'UTC') as date, COUNT(DISTINCT user_id) as count
    FROM user_login_history
    WHERE login_at >= ${extendedStart}
      AND login_at <= ${endDate}
    GROUP BY DATE(login_at AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `;

  // 一次查出整個時間範圍（含回溯期）的每日登入用戶 ID 集合
  const dailyUserIds = await prisma.$queryRaw<Array<{ date: Date; user_id: number }>>`
    SELECT DISTINCT DATE(login_at AT TIME ZONE 'UTC') as date, user_id
    FROM user_login_history
    WHERE login_at >= ${extendedStart}
      AND login_at <= ${endDate}
    ORDER BY date ASC
  `;

  // 建立每日 DAU Map
  const dauMap = new Map<string, number>();
  for (const row of dailyUsers) {
    const dateStr = row.date.toISOString().split('T')[0];
    dauMap.set(dateStr, Number(row.count));
  }

  // 建立每日用戶 ID Set Map（用於計算滑動視窗的 WAU/MAU）
  const dailyUserSetMap = new Map<string, Set<number>>();
  for (const row of dailyUserIds) {
    const dateStr = row.date.toISOString().split('T')[0];
    if (!dailyUserSetMap.has(dateStr)) {
      dailyUserSetMap.set(dateStr, new Set());
    }
    dailyUserSetMap.get(dateStr)!.add(row.user_id);
  }

  // 在記憶體中計算每天的 DAU/WAU/MAU
  const trend: ActiveUsersTrendDataPoint[] = [];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // DAU - 當天
    const dau = dauMap.get(dateStr) ?? 0;

    // WAU - 過去 7 天（含當天）的不重複用戶
    const wauUsers = new Set<number>();
    for (let d = 0; d < 7; d++) {
      const lookbackDate = new Date(currentDate);
      lookbackDate.setDate(currentDate.getDate() - d);
      const lookbackStr = lookbackDate.toISOString().split('T')[0];
      const users = dailyUserSetMap.get(lookbackStr);
      if (users) {
        for (const uid of users) {
          wauUsers.add(uid);
        }
      }
    }

    // MAU - 過去 30 天（含當天）的不重複用戶
    const mauUsers = new Set<number>();
    for (let d = 0; d < 30; d++) {
      const lookbackDate = new Date(currentDate);
      lookbackDate.setDate(currentDate.getDate() - d);
      const lookbackStr = lookbackDate.toISOString().split('T')[0];
      const users = dailyUserSetMap.get(lookbackStr);
      if (users) {
        for (const uid of users) {
          mauUsers.add(uid);
        }
      }
    }

    trend.push({
      date: dateStr,
      dau,
      wau: wauUsers.size,
      mau: mauUsers.size
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
