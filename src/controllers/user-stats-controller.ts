/**
 * 使用者統計控制器
 * 處理 HTTP 請求和回應
 */

import { Request, Response } from 'express';
import { asyncHandler as asyncWrapper, BadRequestError } from '../middleware/error.middleware';
import userStatsService from '@/services/user-stats-service';
import {
  exportToCSV,
  exportToExcel,
  cleanupTempFile,
  CsvHeader,
  ExcelHeader
} from '@/utils/export-utils';
import fs from 'fs';

/**
 * 獲取總覽儀表板
 * GET /api/v1/admin/user-stats/overview
 */
export const getOverview = asyncWrapper(
  async (req: Request, res: Response) => {
    const stats = await userStatsService.getOverviewStats();

    res.json({
      success: true,
      data: stats,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 獲取註冊統計
 * GET /api/v1/admin/user-stats/registrations
 */
export const getRegistrationStats = asyncWrapper(
  async (req: Request, res: Response) => {
    // 查詢參數已經由 Zod 驗證並轉換
    const query = req.query as Record<string, unknown>;

    // 查詢統計資料
    const stats = await userStatsService.getRegistrationStats(
      query as Parameters<typeof userStatsService.getRegistrationStats>[0]
    );

    res.json({
      success: true,
      data: stats,
      metadata: {
        groupBy: query.groupBy,
        startDate: query.startDate,
        endDate: query.endDate,
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 獲取活躍度統計
 * GET /api/v1/admin/user-stats/activity
 */
export const getActivityStats = asyncWrapper(
  async (req: Request, res: Response) => {
    // 查詢參數已經由 Zod 驗證並轉換
    const query = req.query as Record<string, unknown>;

    // 查詢統計資料
    const stats = await userStatsService.getActivityStats(
      query as Parameters<typeof userStatsService.getActivityStats>[0]
    );

    res.json({
      success: true,
      data: stats,
      metadata: {
        activeWithinDays: query.activeWithinDays,
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 匯出統計資料
 * GET /api/v1/admin/user-stats/export
 */
export const exportStats = asyncWrapper(
  async (req: Request, res: Response) => {
    // 查詢參數已經由 Zod 驗證並轉換
    const query = req.query as {
      format: 'csv' | 'excel';
      type: 'registrations' | 'activity' | 'full';
      startDate?: string;
      endDate?: string;
      groupBy?: string;
    };

    // 根據類型獲取資料
    let data: Record<string, unknown>[];
    let filename: string;
    let headers: CsvHeader[] | ExcelHeader[];

    if (query.type === 'registrations' && query.groupBy) {
      const stats = await userStatsService.getRegistrationStats({
        groupBy: query.groupBy as 'day' | 'week' | 'month' | 'year' | 'location' | 'role' | 'education_stage',
        startDate: query.startDate,
        endDate: query.endDate
      });
      data = stats as unknown as Record<string, unknown>[];
      filename = `user-registrations-${query.groupBy}-${Date.now()}`;

      // 根據 groupBy 設定不同的 headers
      if (['day', 'week', 'month', 'year'].includes(query.groupBy)) {
        headers = [
          { id: 'date', title: '日期' },
          { id: 'count', title: '使用者數量' },
          { id: 'label', title: '標籤' }
        ];
      } else if (query.groupBy === 'location') {
        headers = [
          { id: 'country', title: '國家' },
          { id: 'city', title: '城市' },
          { id: 'isTaiwan', title: '是否為台灣' },
          { id: 'userCount', title: '使用者數量' }
        ];
      } else if (query.groupBy === 'role') {
        headers = [
          { id: 'roleId', title: '角色ID' },
          { id: 'roleName', title: '角色名稱' },
          { id: 'userCount', title: '使用者數量' }
        ];
      } else {
        headers = [
          { id: 'educationStage', title: '教育階段' },
          { id: 'userCount', title: '使用者數量' }
        ];
      }
    } else if (query.type === 'activity') {
      const stats = await userStatsService.getActivityStats({});
      data = [stats as unknown as Record<string, unknown>];
      filename = `user-activity-${Date.now()}`;
      headers = [
        { id: 'activeUsers', title: '活躍使用者' },
        { id: 'inactiveUsers', title: '非活躍使用者' },
        { id: 'totalUsers', title: '總使用者數' },
        { id: 'activeRate', title: '活躍率(%)' }
      ];
    } else {
      // 全量匯出
      const overview = await userStatsService.getOverviewStats();
      data = [overview as unknown as Record<string, unknown>];
      filename = `user-stats-full-${Date.now()}`;
      headers = [
        { id: 'totalUsers', title: '總使用者數' },
        { id: 'newUsersThisMonth', title: '本月新增' },
        { id: 'newUsersLastMonth', title: '上月新增' },
        { id: 'growthRate', title: '增長率(%)' },
        { id: 'activeUsers', title: '活躍使用者' },
        { id: 'activeRate', title: '活躍率(%)' }
      ];
    }

    // 根據格式匯出
    let filePath: string;
    let mimeType: string;

    if (query.format === 'csv') {
      filePath = await exportToCSV(
        data,
        headers as CsvHeader[],
        filename
      );
      mimeType = 'text/csv';
    } else {
      // 將 CsvHeader 轉換為 ExcelHeader
      const excelHeaders: ExcelHeader[] = (headers as CsvHeader[]).map(h => ({
        key: h.id,
        header: h.title,
        width: 20
      }));

      filePath = await exportToExcel(
        data,
        excelHeaders,
        filename,
        '使用者統計'
      );
      mimeType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // 設定回應標頭並發送檔案
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.${query.format === 'csv' ? 'csv' : 'xlsx'}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // 清理暫存檔案
    fileStream.on('close', () => {
      cleanupTempFile(filePath);
    });

    fileStream.on('error', (error) => {
      console.error('檔案串流錯誤:', error);
      cleanupTempFile(filePath);
      throw new BadRequestError('檔案匯出失敗');
    });
  }
);

/**
 * 獲取 DAU/WAU/MAU 統計
 * GET /api/v1/admin/user-stats/active-users
 */
export const getActiveUsersStats = asyncWrapper(
  async (_req: Request, res: Response) => {
    const stats = await userStatsService.getActiveUsersStats();

    res.json({
      success: true,
      data: stats,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 獲取裝置分析
 * GET /api/v1/admin/user-stats/device-analytics
 */
export const getDeviceAnalytics = asyncWrapper(
  async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    const stats = await userStatsService.getDeviceAnalytics(
      query as Parameters<typeof userStatsService.getDeviceAnalytics>[0]
    );

    res.json({
      success: true,
      data: stats,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 獲取用戶留存率
 * GET /api/v1/admin/user-stats/retention
 */
export const getRetentionStats = asyncWrapper(
  async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    const stats = await userStatsService.getRetentionStats(
      query as Parameters<typeof userStatsService.getRetentionStats>[0]
    );

    res.json({
      success: true,
      data: stats,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 獲取熱門檔案排行
 * GET /api/v1/admin/user-stats/popular-profiles
 */
export const getPopularProfiles = asyncWrapper(
  async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    const stats = await userStatsService.getPopularProfiles(
      query as Parameters<typeof userStatsService.getPopularProfiles>[0]
    );

    res.json({
      success: true,
      data: stats,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 獲取用戶活躍度分類
 * GET /api/v1/admin/user-stats/segmentation
 */
export const getUserActivitySegmentation = asyncWrapper(
  async (_req: Request, res: Response) => {
    const stats = await userStatsService.getUserActivitySegmentation();

    res.json({
      success: true,
      data: stats,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });
  }
);

/**
 * 獲取 DAU/WAU/MAU 每日趨勢
 * GET /api/v1/admin/user-stats/active-users/trend
 */
export const getActiveUsersTrend = asyncWrapper(
  async (req: Request, res: Response) => {
    const { days, startDate, endDate } = req.query as {
      days?: string;
      startDate?: string;
      endDate?: string;
    };

    const stats = await userStatsService.getActiveUsersTrend({
      days: days ? Number(days) : undefined,
      startDate,
      endDate,
    });

    res.json({ success: true, data: stats, metadata: { generated_at: new Date().toISOString() } });
  }
);

/**
 * 取得活躍用戶名單
 * GET /api/v1/admin/user-stats/active-users/list
 */
export const getActiveUsersList = asyncWrapper(
  async (req: Request, res: Response) => {
    const { date, period } = req.query as {
      date?: string;
      period?: string;
    };

    const validPeriods = ['day', 'week', 'month'] as const;
    const safePeriod = validPeriods.includes(period as typeof validPeriods[number])
      ? (period as typeof validPeriods[number])
      : 'day';

    const users = await userStatsService.getActiveUsersList({
      date: date || new Date().toISOString().slice(0, 10),
      period: safePeriod,
    });

    res.json({ success: true, data: users, metadata: { generated_at: new Date().toISOString() } });
  }
);

/**
 * 獲取用戶參與漏斗
 * GET /api/v1/admin/user-stats/funnel
 */
export const getActiveUsersFunnel = asyncWrapper(
  async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    const stats = await userStatsService.getActiveUsersFunnel({ startDate, endDate });

    res.json({ success: true, data: stats, metadata: { generated_at: new Date().toISOString() } });
  }
);

/**
 * 獲取 Cohort 留存率
 * GET /api/v1/admin/user-stats/cohort-retention
 */
export const getUserCohortRetention = asyncWrapper(
  async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    const stats = await userStatsService.getUserCohortRetention({ startDate, endDate });

    res.json({ success: true, data: stats, metadata: { generated_at: new Date().toISOString() } });
  }
);

export default {
  getOverview,
  getRegistrationStats,
  getActivityStats,
  exportStats,
  getActiveUsersStats,
  getDeviceAnalytics,
  getRetentionStats,
  getPopularProfiles,
  getUserActivitySegmentation,
  getActiveUsersTrend,
  getActiveUsersList,
  getActiveUsersFunnel,
  getUserCohortRetention,
};
