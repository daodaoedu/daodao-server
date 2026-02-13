/**
 * 使用者統計服務層
 * 處理所有統計相關的業務邏輯和資料庫查詢
 * 已遷移至 Prisma ORM
 */

import { Prisma, education_stage_t } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import {
  OverviewStats,
  TimeSeriesStats,
  LocationStats,
  RoleStats,
  EducationStageStats,
  ActivityStats,
  ActiveUsersStats,
  DeviceAnalytics,
  RetentionStats,
  PopularProfilesStats,
  UserActivitySegmentation,
  UserActivityLabel
} from '@/types/user-stats.types';
import {
  RegistrationStatsQuery,
  ActivityStatsQuery,
  DeviceAnalyticsQuery,
  RetentionQuery,
  PopularProfilesQuery
} from '@/validators/user-stats.validator';
import { formatDate, getMonthStart, getDaysAgo } from '@/utils/date-utils';

/**
 * 獲取總覽統計
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const now = new Date();
  const thisMonthStart = getMonthStart(now);
  const lastMonthStart = getMonthStart(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );
  const activeThreshold = getDaysAgo(30);

  // 總使用者數
  const totalUsers = await prisma.users.count();

  // 本月新增使用者
  const newUsersThisMonth = await prisma.users.count({
    where: {
      created_at: {
        gte: thisMonthStart
      }
    }
  });

  // 上月新增使用者
  const newUsersLastMonth = await prisma.users.count({
    where: {
      created_at: {
        gte: lastMonthStart,
        lt: thisMonthStart
      }
    }
  });

  // 計算增長率
  const growthRate =
    newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : newUsersThisMonth > 0
        ? 100
        : 0;

  // 活躍使用者數（透過 user_activity_stats 關聯查詢）
  const activeUsers = await prisma.users.count({
    where: {
      user_activity_stats: {
        OR: [
          { last_active_at: { gte: activeThreshold } },
          { last_login_at: { gte: activeThreshold } }
        ]
      }
    }
  });

  // 活躍率
  const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  return {
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    growthRate: Math.round(growthRate * 100) / 100,
    activeUsers,
    activeRate: Math.round(activeRate * 100) / 100
  };
}

/**
 * 獲取註冊統計
 */
export async function getRegistrationStats(
  query: RegistrationStatsQuery
): Promise<
  TimeSeriesStats[] | LocationStats[] | RoleStats[] | EducationStageStats[]
> {
  const {
    groupBy,
    startDate,
    endDate,
    locationId,
    roleId,
    educationStage,
    limit = 100,
    offset = 0
  } = query;

  // 構建基本 where 條件
  const whereConditions: Prisma.usersWhereInput = {};

  if (startDate && endDate) {
    whereConditions.created_at = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  if (locationId) {
    whereConditions.location_id = locationId;
  }

  if (roleId) {
    whereConditions.role_id = roleId;
  }

  if (educationStage) {
    whereConditions.education_stage = educationStage as education_stage_t;
  }

  // 根據 groupBy 執行不同的查詢
  switch (groupBy) {
    case 'day':
      return getDailyStats(whereConditions);
    case 'week':
      return getWeeklyStats(whereConditions);
    case 'month':
      return getMonthlyStats(whereConditions);
    case 'year':
      return getYearlyStats(whereConditions);
    case 'location':
      return getLocationStats(whereConditions, limit as number, offset as number);
    case 'role':
      return getRoleStats(whereConditions, limit as number, offset as number);
    case 'education_stage':
      return getEducationStageStats(whereConditions, limit as number, offset as number);
    default:
      throw new Error(`不支援的 groupBy 類型: ${groupBy}`);
  }
}

/**
 * 按日統計
 */
async function getDailyStats(
  where: Prisma.usersWhereInput
): Promise<TimeSeriesStats[]> {
  // 使用原始 SQL 查詢進行日期分組
  const createdAtFilter = where.created_at;
  let hasDateRange = false;
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (createdAtFilter && typeof createdAtFilter === 'object' && !(createdAtFilter instanceof Date)) {
    if ('gte' in createdAtFilter && 'lte' in createdAtFilter && createdAtFilter.gte && createdAtFilter.lte) {
      hasDateRange = true;
      startDate = createdAtFilter.gte as Date;
      endDate = createdAtFilter.lte as Date;
    }
  }

  const results = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT
      DATE(created_at) as date,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${startDate} AND created_at <= ${endDate}` : Prisma.sql`1=1`}
      ${where.location_id ? Prisma.sql`AND location_id = ${where.location_id}` : Prisma.empty}
      ${where.role_id ? Prisma.sql`AND role_id = ${where.role_id}` : Prisma.empty}
      ${where.education_stage ? Prisma.sql`AND education_stage = ${where.education_stage}` : Prisma.empty}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;

  return results.map((r) => ({
    date: r.date instanceof Date ? formatDate(r.date) : String(r.date),
    count: Number(r.count),
    label: r.date instanceof Date ? formatDate(r.date) : String(r.date)
  }));
}

/**
 * 按週統計
 */
async function getWeeklyStats(
  where: Prisma.usersWhereInput
): Promise<TimeSeriesStats[]> {
  // 使用原始 SQL 查詢進行週分組
  const createdAtFilter = where.created_at;
  let hasDateRange = false;
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (createdAtFilter && typeof createdAtFilter === 'object' && !(createdAtFilter instanceof Date)) {
    if ('gte' in createdAtFilter && 'lte' in createdAtFilter && createdAtFilter.gte && createdAtFilter.lte) {
      hasDateRange = true;
      startDate = createdAtFilter.gte as Date;
      endDate = createdAtFilter.lte as Date;
    }
  }

  const results = await prisma.$queryRaw<Array<{ week_start: Date; count: bigint }>>`
    SELECT
      DATE_TRUNC('week', created_at) as week_start,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${startDate} AND created_at <= ${endDate}` : Prisma.sql`1=1`}
      ${where.location_id ? Prisma.sql`AND location_id = ${where.location_id}` : Prisma.empty}
      ${where.role_id ? Prisma.sql`AND role_id = ${where.role_id}` : Prisma.empty}
      ${where.education_stage ? Prisma.sql`AND education_stage = ${where.education_stage}` : Prisma.empty}
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY DATE_TRUNC('week', created_at) ASC
  `;

  return results.map((r) => {
    const date = new Date(r.week_start);
    const dateStr = formatDate(date);
    return {
      date: dateStr,
      count: Number(r.count),
      label: `第${dateStr}週`
    };
  });
}

/**
 * 按月統計
 */
async function getMonthlyStats(
  where: Prisma.usersWhereInput
): Promise<TimeSeriesStats[]> {
  // 使用原始 SQL 查詢進行月分組
  const createdAtFilter = where.created_at;
  let hasDateRange = false;
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (createdAtFilter && typeof createdAtFilter === 'object' && !(createdAtFilter instanceof Date)) {
    if ('gte' in createdAtFilter && 'lte' in createdAtFilter && createdAtFilter.gte && createdAtFilter.lte) {
      hasDateRange = true;
      startDate = createdAtFilter.gte as Date;
      endDate = createdAtFilter.lte as Date;
    }
  }

  const results = await prisma.$queryRaw<Array<{ month_start: Date; count: bigint }>>`
    SELECT
      DATE_TRUNC('month', created_at) as month_start,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${startDate} AND created_at <= ${endDate}` : Prisma.sql`1=1`}
      ${where.location_id ? Prisma.sql`AND location_id = ${where.location_id}` : Prisma.empty}
      ${where.role_id ? Prisma.sql`AND role_id = ${where.role_id}` : Prisma.empty}
      ${where.education_stage ? Prisma.sql`AND education_stage = ${where.education_stage}` : Prisma.empty}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) ASC
  `;

  return results.map((r) => {
    const date = new Date(r.month_start);
    const dateStr = formatDate(date);
    return {
      date: dateStr,
      count: Number(r.count),
      label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    };
  });
}

/**
 * 按年統計
 */
async function getYearlyStats(
  where: Prisma.usersWhereInput
): Promise<TimeSeriesStats[]> {
  // 使用原始 SQL 查詢進行年分組
  const createdAtFilter = where.created_at;
  let hasDateRange = false;
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (createdAtFilter && typeof createdAtFilter === 'object' && !(createdAtFilter instanceof Date)) {
    if ('gte' in createdAtFilter && 'lte' in createdAtFilter && createdAtFilter.gte && createdAtFilter.lte) {
      hasDateRange = true;
      startDate = createdAtFilter.gte as Date;
      endDate = createdAtFilter.lte as Date;
    }
  }

  const results = await prisma.$queryRaw<Array<{ year_start: Date; count: bigint }>>`
    SELECT
      DATE_TRUNC('year', created_at) as year_start,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${startDate} AND created_at <= ${endDate}` : Prisma.sql`1=1`}
      ${where.location_id ? Prisma.sql`AND location_id = ${where.location_id}` : Prisma.empty}
      ${where.role_id ? Prisma.sql`AND role_id = ${where.role_id}` : Prisma.empty}
      ${where.education_stage ? Prisma.sql`AND education_stage = ${where.education_stage}` : Prisma.empty}
    GROUP BY DATE_TRUNC('year', created_at)
    ORDER BY DATE_TRUNC('year', created_at) ASC
  `;

  return results.map((r) => {
    const date = new Date(r.year_start);
    return {
      date: formatDate(date),
      count: Number(r.count),
      label: `${date.getFullYear()}`
    };
  });
}

/**
 * 按地區統計
 */
async function getLocationStats(
  where: Prisma.usersWhereInput,
  limit: number,
  offset: number
): Promise<LocationStats[]> {
  // 使用 Prisma groupBy 功能，但需要原始查詢來處理關聯和計數
  const createdAtFilter = where.created_at;
  let hasDateRange = false;
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (createdAtFilter && typeof createdAtFilter === 'object' && !(createdAtFilter instanceof Date)) {
    if ('gte' in createdAtFilter && 'lte' in createdAtFilter && createdAtFilter.gte && createdAtFilter.lte) {
      hasDateRange = true;
      startDate = createdAtFilter.gte as Date;
      endDate = createdAtFilter.lte as Date;
    }
  }

  const results = await prisma.$queryRaw<Array<{
    location_id: number | null;
    country_name: string | null;
    city_name: string | null;
    is_taiwan: boolean | null;
    user_count: bigint;
  }>>`
    SELECT
      u.location_id,
      co.name as country_name,
      ci.name as city_name,
      l."isTaiwan" as is_taiwan,
      COUNT(u.id)::bigint as user_count
    FROM users u
    LEFT JOIN location l ON u.location_id = l.id
    LEFT JOIN city ci ON l.city_id = ci.id
    LEFT JOIN country co ON l.country_id = co.id
    WHERE ${hasDateRange ? Prisma.sql`u.created_at >= ${startDate} AND u.created_at <= ${endDate}` : Prisma.sql`1=1`}
      ${where.location_id ? Prisma.sql`AND u.location_id = ${where.location_id}` : Prisma.empty}
      ${where.role_id ? Prisma.sql`AND u.role_id = ${where.role_id}` : Prisma.empty}
      ${where.education_stage ? Prisma.sql`AND u.education_stage = ${where.education_stage}` : Prisma.empty}
    GROUP BY u.location_id, co.name, ci.name, l."isTaiwan"
    ORDER BY user_count DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return results.map((r) => ({
    locationId: r.location_id,
    country: r.country_name,
    city: r.city_name,
    isTaiwan: r.is_taiwan,
    userCount: Number(r.user_count)
  }));
}

/**
 * 按角色統計
 */
async function getRoleStats(
  where: Prisma.usersWhereInput,
  limit: number,
  offset: number
): Promise<RoleStats[]> {
  // 使用原始查詢來處理關聯和計數
  const createdAtFilter = where.created_at;
  let hasDateRange = false;
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (createdAtFilter && typeof createdAtFilter === 'object' && !(createdAtFilter instanceof Date)) {
    if ('gte' in createdAtFilter && 'lte' in createdAtFilter && createdAtFilter.gte && createdAtFilter.lte) {
      hasDateRange = true;
      startDate = createdAtFilter.gte as Date;
      endDate = createdAtFilter.lte as Date;
    }
  }

  const results = await prisma.$queryRaw<Array<{
    role_id: number;
    role_name: string;
    user_count: bigint;
  }>>`
    SELECT
      u.role_id,
      r.name as role_name,
      COUNT(u.id)::bigint as user_count
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE ${hasDateRange ? Prisma.sql`u.created_at >= ${startDate} AND u.created_at <= ${endDate}` : Prisma.sql`1=1`}
      ${where.location_id ? Prisma.sql`AND u.location_id = ${where.location_id}` : Prisma.empty}
      ${where.role_id ? Prisma.sql`AND u.role_id = ${where.role_id}` : Prisma.empty}
      ${where.education_stage ? Prisma.sql`AND u.education_stage = ${where.education_stage}` : Prisma.empty}
    GROUP BY u.role_id, r.name
    ORDER BY user_count DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return results.map((r) => ({
    roleId: r.role_id,
    roleName: r.role_name,
    userCount: Number(r.user_count)
  }));
}

/**
 * 按教育階段統計
 */
async function getEducationStageStats(
  where: Prisma.usersWhereInput,
  limit: number,
  offset: number
): Promise<EducationStageStats[]> {
  // 使用 Prisma groupBy 功能
  const results = await prisma.users.groupBy({
    by: ['education_stage'],
    where,
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: limit,
    skip: offset
  });

  return results.map((r) => ({
    educationStage: r.education_stage || 'Unknown',
    userCount: r._count.id
  }));
}

/**
 * 獲取活躍度統計
 */
export async function getActivityStats(
  query: ActivityStatsQuery
): Promise<ActivityStats> {
  const { activeWithinDays = 30, groupBy } = query;

  const activeThreshold = getDaysAgo(activeWithinDays as number);

  // 活躍使用者數（透過 user_activity_stats 關聯查詢）
  const activeUsers = await prisma.users.count({
    where: {
      user_activity_stats: {
        OR: [
          { last_active_at: { gte: activeThreshold } },
          { last_login_at: { gte: activeThreshold } }
        ]
      }
    }
  });

  // 總使用者數
  const totalUsers = await prisma.users.count();

  // 非活躍使用者數
  const inactiveUsers = totalUsers - activeUsers;

  // 活躍率
  const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  const baseStats: ActivityStats = {
    activeUsers,
    inactiveUsers,
    totalUsers,
    activeRate: Math.round(activeRate * 100) / 100
  };

  // 如果有 groupBy，添加細分統計
  if (groupBy) {
    const activeWhere: Prisma.usersWhereInput = {
      user_activity_stats: {
        OR: [
          { last_active_at: { gte: activeThreshold } },
          { last_login_at: { gte: activeThreshold } }
        ]
      }
    };

    const breakdown: ActivityStats['breakdown'] = {};

    switch (groupBy) {
      case 'role':
        breakdown.role = await getRoleStats(activeWhere, 100, 0);
        break;
      case 'location':
        breakdown.location = await getLocationStats(activeWhere, 100, 0);
        break;
      case 'education_stage':
        breakdown.educationStage = await getEducationStageStats(
          activeWhere,
          100,
          0
        );
        break;
    }

    baseStats.breakdown = breakdown;
  }

  return baseStats;
}

/**
 * 獲取 DAU/WAU/MAU 統計
 */
export async function getActiveUsersStats(): Promise<ActiveUsersStats> {
  const oneDayAgo = getDaysAgo(1);
  const oneWeekAgo = getDaysAgo(7);
  const oneMonthAgo = getDaysAgo(30);
  const twoDaysAgo = getDaysAgo(2);
  const twoWeeksAgo = getDaysAgo(14);
  const twoMonthsAgo = getDaysAgo(60);

  // 總用戶數
  const totalUsers = await prisma.users.count();

  // DAU: 今天登入的不重複用戶
  const dau = await prisma.user_login_history.groupBy({
    by: ['user_id'],
    where: {
      login_at: { gte: oneDayAgo }
    }
  }).then(result => result.length);

  // WAU: 最近 7 天登入的不重複用戶
  const wau = await prisma.user_login_history.groupBy({
    by: ['user_id'],
    where: {
      login_at: { gte: oneWeekAgo }
    }
  }).then(result => result.length);

  // MAU: 最近 30 天登入的不重複用戶
  const mau = await prisma.user_login_history.groupBy({
    by: ['user_id'],
    where: {
      login_at: { gte: oneMonthAgo }
    }
  }).then(result => result.length);

  // 計算趨勢（與前一期比較）
  const dauYesterday = await prisma.user_login_history.groupBy({
    by: ['user_id'],
    where: {
      login_at: { gte: twoDaysAgo, lt: oneDayAgo }
    }
  }).then(result => result.length);

  const wauLastWeek = await prisma.user_login_history.groupBy({
    by: ['user_id'],
    where: {
      login_at: { gte: twoWeeksAgo, lt: oneWeekAgo }
    }
  }).then(result => result.length);

  const mauLastMonth = await prisma.user_login_history.groupBy({
    by: ['user_id'],
    where: {
      login_at: { gte: twoMonthsAgo, lt: oneMonthAgo }
    }
  }).then(result => result.length);

  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  };

  return {
    dau,
    wau,
    mau,
    dauRate: totalUsers > 0 ? Math.round((dau / totalUsers) * 100 * 100) / 100 : 0,
    wauRate: totalUsers > 0 ? Math.round((wau / totalUsers) * 100 * 100) / 100 : 0,
    mauRate: totalUsers > 0 ? Math.round((mau / totalUsers) * 100 * 100) / 100 : 0,
    totalUsers,
    trend: {
      dauTrend: calculateTrend(dau, dauYesterday),
      wauTrend: calculateTrend(wau, wauLastWeek),
      mauTrend: calculateTrend(mau, mauLastMonth)
    }
  };
}

/**
 * 獲取裝置分析
 */
export async function getDeviceAnalytics(query: DeviceAnalyticsQuery): Promise<DeviceAnalytics> {
  const { startDate, endDate, days = 30 } = query;

  let dateFilter: { gte: Date; lte?: Date };
  if (startDate && endDate) {
    dateFilter = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else {
    dateFilter = {
      gte: getDaysAgo(days as number)
    };
  }

  // 裝置類型統計
  const deviceResults = await prisma.$queryRaw<Array<{ device_type: string | null; count: bigint }>>`
    SELECT device_type, COUNT(*)::bigint as count
    FROM user_login_history
    WHERE login_at >= ${dateFilter.gte}
      ${dateFilter.lte ? Prisma.sql`AND login_at <= ${dateFilter.lte}` : Prisma.empty}
    GROUP BY device_type
    ORDER BY count DESC
  `;

  // 瀏覽器統計
  const browserResults = await prisma.$queryRaw<Array<{ browser: string | null; count: bigint }>>`
    SELECT browser, COUNT(*)::bigint as count
    FROM user_login_history
    WHERE login_at >= ${dateFilter.gte}
      ${dateFilter.lte ? Prisma.sql`AND login_at <= ${dateFilter.lte}` : Prisma.empty}
    GROUP BY browser
    ORDER BY count DESC
  `;

  // 作業系統統計
  const osResults = await prisma.$queryRaw<Array<{ os: string | null; count: bigint }>>`
    SELECT os, COUNT(*)::bigint as count
    FROM user_login_history
    WHERE login_at >= ${dateFilter.gte}
      ${dateFilter.lte ? Prisma.sql`AND login_at <= ${dateFilter.lte}` : Prisma.empty}
    GROUP BY os
    ORDER BY count DESC
  `;

  const totalLogins = deviceResults.reduce((sum, d) => sum + Number(d.count), 0);

  return {
    devices: deviceResults.map(d => ({
      deviceType: d.device_type,
      count: Number(d.count),
      percentage: totalLogins > 0 ? Math.round((Number(d.count) / totalLogins) * 100 * 100) / 100 : 0
    })),
    browsers: browserResults.map(b => ({
      browser: b.browser,
      count: Number(b.count),
      percentage: totalLogins > 0 ? Math.round((Number(b.count) / totalLogins) * 100 * 100) / 100 : 0
    })),
    operatingSystems: osResults.map(o => ({
      os: o.os,
      count: Number(o.count),
      percentage: totalLogins > 0 ? Math.round((Number(o.count) / totalLogins) * 100 * 100) / 100 : 0
    })),
    totalLogins,
    dateRange: {
      startDate: formatDate(dateFilter.gte),
      endDate: dateFilter.lte ? formatDate(dateFilter.lte) : formatDate(new Date())
    }
  };
}

/**
 * 獲取用戶留存率
 */
export async function getRetentionStats(query: RetentionQuery): Promise<RetentionStats> {
  const { cohorts = 7, trackDays = 30, granularity = 'day' } = query;

  const cohortResults: Array<{
    cohortDate: string;
    cohortSize: number;
    retentionByDay: Array<{ day: number; retainedUsers: number; retentionRate: number }>;
  }> = [];

  // 獲取最近 N 個群組
  for (let i = 0; i < (cohorts as number); i++) {
    const cohortStart = granularity === 'day'
      ? getDaysAgo(i + (trackDays as number))
      : getDaysAgo((i + 1) * 7 + (trackDays as number));

    const cohortEnd = granularity === 'day'
      ? getDaysAgo(i + (trackDays as number) - 1)
      : getDaysAgo(i * 7 + (trackDays as number));

    // 該群組的新用戶
    const cohortUsers = await prisma.users.findMany({
      where: {
        created_at: {
          gte: cohortStart,
          lt: cohortEnd
        }
      },
      select: { id: true }
    });

    const cohortSize = cohortUsers.length;
    if (cohortSize === 0) continue;

    const userIds = cohortUsers.map(u => u.id);
    const retentionByDay: Array<{ day: number; retainedUsers: number; retentionRate: number }> = [];

    // 計算各天的留存
    const daysToTrack = [1, 3, 7, 14, 30].filter(d => d <= (trackDays as number));

    for (const day of daysToTrack) {
      const checkDate = new Date(cohortStart);
      checkDate.setDate(checkDate.getDate() + day);

      const retainedCount = await prisma.user_login_history.groupBy({
        by: ['user_id'],
        where: {
          user_id: { in: userIds },
          login_at: {
            gte: checkDate,
            lt: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      }).then(result => result.length);

      retentionByDay.push({
        day,
        retainedUsers: retainedCount,
        retentionRate: Math.round((retainedCount / cohortSize) * 100 * 100) / 100
      });
    }

    cohortResults.push({
      cohortDate: formatDate(cohortStart),
      cohortSize,
      retentionByDay
    });
  }

  // 計算平均留存率
  const calculateAverageRetention = (day: number): number => {
    const validCohorts = cohortResults.filter(c =>
      c.retentionByDay.some(r => r.day === day)
    );
    if (validCohorts.length === 0) return 0;

    const sum = validCohorts.reduce((total, c) => {
      const retention = c.retentionByDay.find(r => r.day === day);
      return total + (retention?.retentionRate || 0);
    }, 0);

    return Math.round((sum / validCohorts.length) * 100) / 100;
  };

  return {
    cohorts: cohortResults,
    averageRetention: {
      day1: calculateAverageRetention(1),
      day7: calculateAverageRetention(7),
      day14: calculateAverageRetention(14),
      day30: calculateAverageRetention(30)
    }
  };
}

/**
 * 獲取熱門檔案排行
 */
export async function getPopularProfiles(query: PopularProfilesQuery): Promise<PopularProfilesStats> {
  const { limit = 10, offset = 0, minViews = 0 } = query;

  const profiles = await prisma.users.findMany({
    where: {
      user_activity_stats: {
        profile_views: { gte: minViews as number }
      },
      is_open_profile: true
    },
    select: {
      id: true,
      external_id: true,
      nickname: true,
      user_activity_stats: {
        select: {
          profile_views: true,
          last_active_at: true
        }
      },
      contacts: {
        select: {
          photo_url: true
        }
      }
    },
    orderBy: {
      user_activity_stats: {
        profile_views: 'desc'
      }
    },
    take: limit as number,
    skip: offset as number
  });

  const totalCount = await prisma.users.count({
    where: {
      user_activity_stats: {
        profile_views: { gte: minViews as number }
      },
      is_open_profile: true
    }
  });

  return {
    profiles: profiles.map(p => ({
      userId: p.id,
      externalId: p.external_id || '',
      nickname: p.nickname,
      photoUrl: p.contacts?.photo_url || null,
      profileViews: p.user_activity_stats?.profile_views || 0,
      lastActiveAt: p.user_activity_stats?.last_active_at ? formatDate(p.user_activity_stats.last_active_at) : null
    })),
    totalCount
  };
}

/**
 * 獲取用戶活躍度分類
 */
export async function getUserActivitySegmentation(): Promise<UserActivitySegmentation> {
  const now = new Date();
  const threeDaysAgo = getDaysAgo(3);
  const sevenDaysAgo = getDaysAgo(7);
  const thirtyDaysAgo = getDaysAgo(30);
  const ninetyDaysAgo = getDaysAgo(90);

  // 定義分類標準（透過 user_activity_stats 關聯）
  const segments: Array<{
    label: UserActivityLabel;
    displayName: string;
    description: string;
    criteria: string;
    where: Prisma.usersWhereInput;
  }> = [
    {
      label: 'highly_active',
      displayName: '高度活躍',
      description: '最近 3 天內有活動',
      criteria: 'last_active_at >= 3 days ago',
      where: {
        user_activity_stats: {
          OR: [
            { last_active_at: { gte: threeDaysAgo } },
            { last_login_at: { gte: threeDaysAgo } }
          ]
        }
      }
    },
    {
      label: 'active',
      displayName: '活躍',
      description: '最近 7 天內有活動',
      criteria: 'last_active_at >= 7 days ago',
      where: {
        user_activity_stats: {
          AND: [
            {
              OR: [
                { last_active_at: { gte: sevenDaysAgo, lt: threeDaysAgo } },
                { last_login_at: { gte: sevenDaysAgo, lt: threeDaysAgo } }
              ]
            }
          ]
        }
      }
    },
    {
      label: 'moderate',
      displayName: '一般',
      description: '最近 30 天內有活動',
      criteria: 'last_active_at >= 30 days ago',
      where: {
        user_activity_stats: {
          OR: [
            { last_active_at: { gte: thirtyDaysAgo, lt: sevenDaysAgo } },
            { last_login_at: { gte: thirtyDaysAgo, lt: sevenDaysAgo } }
          ]
        }
      }
    },
    {
      label: 'inactive',
      displayName: '不活躍',
      description: '最近 90 天內有活動',
      criteria: 'last_active_at >= 90 days ago',
      where: {
        user_activity_stats: {
          OR: [
            { last_active_at: { gte: ninetyDaysAgo, lt: thirtyDaysAgo } },
            { last_login_at: { gte: ninetyDaysAgo, lt: thirtyDaysAgo } }
          ]
        }
      }
    },
    {
      label: 'dormant',
      displayName: '沉睡',
      description: '超過 90 天無活動',
      criteria: 'last_active_at < 90 days ago or null',
      where: {
        OR: [
          { activity_stats_id: null },
          {
            user_activity_stats: {
              AND: [
                {
                  OR: [
                    { last_active_at: { lt: ninetyDaysAgo } },
                    { last_active_at: null }
                  ]
                },
                {
                  OR: [
                    { last_login_at: { lt: ninetyDaysAgo } },
                    { last_login_at: null }
                  ]
                }
              ]
            }
          }
        ]
      }
    }
  ];

  const totalUsers = await prisma.users.count();

  const segmentResults = await Promise.all(
    segments.map(async (segment) => {
      const userCount = await prisma.users.count({ where: segment.where });
      return {
        label: segment.label,
        displayName: segment.displayName,
        description: segment.description,
        userCount,
        percentage: totalUsers > 0 ? Math.round((userCount / totalUsers) * 100 * 100) / 100 : 0,
        criteria: segment.criteria
      };
    })
  );

  return {
    segments: segmentResults,
    totalUsers,
    lastUpdated: now.toISOString()
  };
}

export default {
  getOverviewStats,
  getRegistrationStats,
  getActivityStats,
  getActiveUsersStats,
  getDeviceAnalytics,
  getRetentionStats,
  getPopularProfiles,
  getUserActivitySegmentation
};
