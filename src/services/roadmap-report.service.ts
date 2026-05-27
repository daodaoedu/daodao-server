/**
 * Roadmap Report Service
 *
 * 後台趨勢報表四指標：熱門分類、熱門項目、許願量趨勢、待處理積壓。
 */

import { prisma } from './database/prisma.service';
import { createSuccessResponse } from '../utils/response-helper';
import { ApiSuccessResponse } from '../types/api-response.types';
import { RoadmapReport, WishCategory, RoadmapStatus } from '../types/wishpool.types';
import { RoadmapReportQuery } from '../validators/roadmap.validators';

function rangeStart(range: RoadmapReportQuery['range']): Date {
  const now = new Date();
  switch (range) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'month':
    default:
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}

/** 趨勢分桶粒度：week/month 以日為桶，quarter/year 以月為桶（與 rangeStart 同採本地時區） */
function bucketKey(date: Date, range: RoadmapReportQuery['range']): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  if (range === 'quarter' || range === 'year') return `${y}-${m}`;
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getReport(
  query: RoadmapReportQuery,
): Promise<ApiSuccessResponse<RoadmapReport>> {
  const start = rangeStart(query.range);

  const [categoryGroups, popularItemRows, trendRows, pendingCount, oldestPending] =
    await Promise.all([
      // 1. 熱門分類
      prisma.wishes.groupBy({
        by: ['category'],
        where: { created_at: { gte: start } },
        _count: { _all: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      // 2. 熱門項目（依票數，可篩 status）
      prisma.roadmap_items.findMany({
        where: query.status ? { status: query.status } : {},
        orderBy: { support_count: 'desc' },
        take: 10,
        select: { external_id: true, title: true, status: true, support_count: true },
      }),
      // 3. 許願量趨勢（取期間內 created_at，於 JS 分桶）
      prisma.wishes.findMany({
        where: { created_at: { gte: start } },
        select: { created_at: true },
        orderBy: { created_at: 'asc' },
      }),
      // 4a. 待處理積壓數
      prisma.wishes.count({ where: { status: 'pending' } }),
      // 4b. 最舊待處理
      prisma.wishes.findFirst({
        where: { status: 'pending' },
        orderBy: { created_at: 'asc' },
        select: { created_at: true },
      }),
    ]);

  const popularCategories = categoryGroups.map((g) => ({
    category: g.category as WishCategory,
    count: g._count._all,
  }));

  const popularItems = popularItemRows.map((r) => ({
    external_id: r.external_id,
    title: r.title,
    status: r.status as RoadmapStatus,
    support_count: r.support_count,
  }));

  const trendMap = new Map<string, number>();
  for (const row of trendRows) {
    const key = bucketKey(row.created_at, query.range);
    trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }
  const wishTrend = [...trendMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, count]) => ({ period, count }));

  const oldestPendingWaitingHours = oldestPending
    ? Math.floor((Date.now() - oldestPending.created_at.getTime()) / (60 * 60 * 1000))
    : null;

  const report: RoadmapReport = {
    popularCategories,
    popularItems,
    wishTrend,
    backlog: { pendingCount, oldestPendingWaitingHours },
  };

  return createSuccessResponse(report);
}

export const roadmapReportService = {
  getReport,
};
