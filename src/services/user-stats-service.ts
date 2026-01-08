/**
 * 使用者統計服務層
 * 處理所有統計相關的業務邏輯和資料庫查詢
 * 已遷移至 Prisma ORM
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import {
  OverviewStats,
  TimeSeriesStats,
  LocationStats,
  RoleStats,
  EducationStageStats,
  ActivityStats
} from '@/types/user-stats.types';
import {
  RegistrationStatsQuery,
  ActivityStatsQuery
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

  // 活躍使用者數（使用 updated_at 作為活躍度指標）
  const activeUsers = await prisma.users.count({
    where: {
      updated_at: {
        gte: activeThreshold
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
    whereConditions.education_stage = educationStage as any;
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
      return getLocationStats(whereConditions, limit, offset);
    case 'role':
      return getRoleStats(whereConditions, limit, offset);
    case 'education_stage':
      return getEducationStageStats(whereConditions, limit, offset);
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
  const createdAtFilter = where.created_at as any;
  const hasDateRange = createdAtFilter && typeof createdAtFilter === 'object' && createdAtFilter.gte && createdAtFilter.lte;

  const results = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT
      DATE(created_at) as date,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${createdAtFilter.gte} AND created_at <= ${createdAtFilter.lte}` : Prisma.sql`1=1`}
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
  const createdAtFilter = where.created_at as any;
  const hasDateRange = createdAtFilter && typeof createdAtFilter === 'object' && createdAtFilter.gte && createdAtFilter.lte;

  const results = await prisma.$queryRaw<Array<{ week_start: Date; count: bigint }>>`
    SELECT
      DATE_TRUNC('week', created_at) as week_start,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${createdAtFilter.gte} AND created_at <= ${createdAtFilter.lte}` : Prisma.sql`1=1`}
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
  const createdAtFilter = where.created_at as any;
  const hasDateRange = createdAtFilter && typeof createdAtFilter === 'object' && createdAtFilter.gte && createdAtFilter.lte;

  const results = await prisma.$queryRaw<Array<{ month_start: Date; count: bigint }>>`
    SELECT
      DATE_TRUNC('month', created_at) as month_start,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${createdAtFilter.gte} AND created_at <= ${createdAtFilter.lte}` : Prisma.sql`1=1`}
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
  const createdAtFilter = where.created_at as any;
  const hasDateRange = createdAtFilter && typeof createdAtFilter === 'object' && createdAtFilter.gte && createdAtFilter.lte;

  const results = await prisma.$queryRaw<Array<{ year_start: Date; count: bigint }>>`
    SELECT
      DATE_TRUNC('year', created_at) as year_start,
      COUNT(id)::bigint as count
    FROM users
    WHERE ${hasDateRange ? Prisma.sql`created_at >= ${createdAtFilter.gte} AND created_at <= ${createdAtFilter.lte}` : Prisma.sql`1=1`}
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
  const createdAtFilter = where.created_at as any;
  const hasDateRange = createdAtFilter && typeof createdAtFilter === 'object' && createdAtFilter.gte && createdAtFilter.lte;

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
    WHERE ${hasDateRange ? Prisma.sql`u.created_at >= ${createdAtFilter.gte} AND u.created_at <= ${createdAtFilter.lte}` : Prisma.sql`1=1`}
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
  const createdAtFilter = where.created_at as any;
  const hasDateRange = createdAtFilter && typeof createdAtFilter === 'object' && createdAtFilter.gte && createdAtFilter.lte;

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
    WHERE ${hasDateRange ? Prisma.sql`u.created_at >= ${createdAtFilter.gte} AND u.created_at <= ${createdAtFilter.lte}` : Prisma.sql`1=1`}
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

  const activeThreshold = getDaysAgo(activeWithinDays);

  // 活躍使用者數
  const activeUsers = await prisma.users.count({
    where: {
      updated_at: {
        gte: activeThreshold
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
      updated_at: {
        gte: activeThreshold
      }
    };

    let breakdown: ActivityStats['breakdown'] = {};

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

export default {
  getOverviewStats,
  getRegistrationStats,
  getActivityStats
};
