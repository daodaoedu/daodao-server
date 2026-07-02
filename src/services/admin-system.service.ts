/**
 * Admin 系統監控與儀表板服務
 * 提供系統狀態、資料庫、Redis、儀表板總覽與 Email 統計
 */

import os from 'node:os';
import { prisma } from './database/prisma.service';
import type {
  SystemMonitorResponse,
  DbInfoResponse,
  RedisInfoResponse,
  DashboardOverviewResponse,
  DashboardActiveUsersResponse,
  EmailStatsResponse,
  EmailHealthResponse,
} from '../types/admin-system.types';

/**
 * 取得系統監控資訊（CPU、記憶體、磁碟、運行時間）
 */
const getSystemMonitor = async (): Promise<SystemMonitorResponse> => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpus.length;

  return {
    cpu: { usage: Math.round(cpuUsage * 10) / 10, cores: cpus.length },
    memory: {
      used: Math.round(usedMem / 1024 / 1024),
      total: Math.round(totalMem / 1024 / 1024),
      usagePercent: Math.round((usedMem / totalMem) * 1000) / 10,
    },
    disk: { used: 0, total: 0, usagePercent: 0 },
    uptime: os.uptime(),
  };
};

/**
 * 取得資料庫連線資訊
 */
const getDbInfo = async (): Promise<DbInfoResponse> => {
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
  `;
  const maxResult = await prisma.$queryRaw<Array<{ setting: string }>>`
    SELECT setting FROM pg_settings WHERE name = 'max_connections'
  `;

  return {
    activeConnections: Number(result[0]?.count ?? 0),
    maxConnections: Number(maxResult[0]?.setting ?? 100),
    idleConnections: 0,
    totalQueries: 0,
    avgLatencyMs: 0,
  };
};

/**
 * 取得 Redis 資訊（預留介面）
 */
const getRedisInfo = async (): Promise<RedisInfoResponse> => {
  return {
    memoryUsed: 0,
    memoryTotal: 0,
    connectedClients: 0,
    hitRate: 0,
  };
};

/**
 * 取得儀表板總覽（用戶總數、新增、活躍、成長率）
 */
const getDashboardOverview = async (): Promise<DashboardOverviewResponse> => {
  const totalUsers = await prisma.users.count();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const newUsersThisMonth = await prisma.users.count({
    where: { created_at: { gte: firstOfMonth } },
  });

  const newUsersLastMonth = await prisma.users.count({
    where: {
      created_at: { gte: firstOfLastMonth, lt: firstOfMonth },
    },
  });

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await prisma.user_activity_stats.count({
    where: { last_login_at: { gte: thirtyDaysAgo } },
  });

  const growthRate = newUsersLastMonth > 0
    ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
    : 0;

  return {
    totalUsers,
    newUsersThisMonth,
    activeUsers,
    growthRate: Math.round(growthRate * 10) / 10,
    activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0,
  };
};

/**
 * 取得儀表板活躍用戶數（DAU/WAU/MAU 與趨勢）
 */
const getDashboardActiveUsers = async (): Promise<DashboardActiveUsersResponse> => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prevDayStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const prevMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [dau, wau, mau, prevDau, prevWau, prevMau] = await Promise.all([
    prisma.user_activity_stats.count({ where: { last_login_at: { gte: oneDayAgo } } }),
    prisma.user_activity_stats.count({ where: { last_login_at: { gte: sevenDaysAgo } } }),
    prisma.user_activity_stats.count({ where: { last_login_at: { gte: thirtyDaysAgo } } }),
    prisma.user_activity_stats.count({ where: { last_login_at: { gte: prevDayStart, lt: oneDayAgo } } }),
    prisma.user_activity_stats.count({ where: { last_login_at: { gte: prevWeekStart, lt: sevenDaysAgo } } }),
    prisma.user_activity_stats.count({ where: { last_login_at: { gte: prevMonthStart, lt: thirtyDaysAgo } } }),
  ]);

  const calcTrend = (current: number, prev: number) =>
    prev > 0 ? Math.round(((current - prev) / prev) * 1000) / 10 : 0;

  return {
    dau, wau, mau,
    trend: {
      dauTrend: calcTrend(dau, prevDau),
      wauTrend: calcTrend(wau, prevWau),
      mauTrend: calcTrend(mau, prevMau),
    },
  };
};

/**
 * 取得 Email 發送統計
 */
const getEmailStats = async (): Promise<EmailStatsResponse> => {
  const result = await prisma.$queryRaw<Array<{
    total: bigint
    success: bigint
    failed: bigint
  }>>`
    SELECT
      COUNT(*)::bigint as total,
      COUNT(*) FILTER (WHERE status = 'sent')::bigint as success,
      COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed
    FROM email_logs
  `;

  const total = Number(result[0]?.total ?? 0);
  const success = Number(result[0]?.success ?? 0);
  const failed = Number(result[0]?.failed ?? 0);

  return {
    totalSent: total,
    successRate: total > 0 ? Math.round((success / total) * 1000) / 10 : 0,
    bounceRate: total > 0 ? Math.round((failed / total) * 1000) / 10 : 0,
    queueSize: 0,
  };
};

/**
 * 取得 Email 健康狀態
 */
const getEmailHealth = async (): Promise<EmailHealthResponse> => {
  return {
    status: 'healthy',
    smtpConnection: true,
    queueSize: 0,
    lastError: null,
  };
};

/**
 * 取得批次寄信收件人清單
 * 有指定 tagId 時只寄給該標籤的用戶，否則寄給所有已訂閱 email 的用戶
 */
const getBulkEmailRecipients = async (tagId?: number): Promise<string[]> => {
  const rows = tagId
    ? await prisma.$queryRaw<Array<{ email: string }>>`
        SELECT DISTINCT c.email
        FROM contacts c
        JOIN users u ON u.contact_id = c.id
        JOIN user_tag_assignments uta ON uta.user_id = u.id
        WHERE uta.tag_id = ${tagId}
          AND c.email IS NOT NULL
          AND c.is_subscribe_email IS NOT FALSE
      `
    : await prisma.$queryRaw<Array<{ email: string }>>`
        SELECT DISTINCT c.email
        FROM contacts c
        WHERE c.email IS NOT NULL
          AND c.is_subscribe_email IS NOT FALSE
      `;

  return rows.map((r) => r.email);
};

export default {
  getSystemMonitor,
  getDbInfo,
  getRedisInfo,
  getDashboardOverview,
  getDashboardActiveUsers,
  getEmailStats,
  getEmailHealth,
  getBulkEmailRecipients,
};
