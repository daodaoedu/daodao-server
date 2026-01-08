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

export default {
  getOverview,
  getRegistrationStats,
  getActivityStats,
  exportStats
};
