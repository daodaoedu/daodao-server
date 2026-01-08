/**
 * 使用者統計路由定義
 * 所有路由僅限管理員訪問
 */

import { Router } from 'express';
import userStatsController from '@/controllers/user-stats-controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  registrationStatsQuerySchema,
  activityStatsQuerySchema,
  exportStatsQuerySchema
} from '@/validators/user-stats.validator';

const router = Router();

// 所有路由都需要管理員權限
const adminOnly = [authenticate, requireRole(['admin'])];

/**
 * GET /api/v1/admin/userStats/overview
 * 獲取總覽儀表板
 *
 * @returns {OverviewStats} 總覽統計資料
 */
router.get('/overview', ...adminOnly, userStatsController.getOverview);

/**
 * GET /api/v1/admin/userStats/registrations
 * 獲取註冊統計
 *
 * @query {string} groupBy - 統計分組方式（必選）：day, week, month, year, location, role, education_stage
 * @query {string} [startDate] - 開始日期 (YYYY-MM-DD)
 * @query {string} [endDate] - 結束日期 (YYYY-MM-DD)
 * @query {number} [locationId] - 地區 ID 篩選
 * @query {number} [roleId] - 角色 ID 篩選
 * @query {string} [educationStage] - 教育階段篩選
 * @query {number} [limit=100] - 分頁限制（最大 1000）
 * @query {number} [offset=0] - 分頁偏移
 *
 * @returns {TimeSeriesStats[] | LocationStats[] | RoleStats[] | EducationStageStats[]} 註冊統計資料
 */
router.get(
  '/registrations',
  ...adminOnly,
  validate(registrationStatsQuerySchema, 'query'),
  userStatsController.getRegistrationStats
);

/**
 * GET /api/v1/admin/userStats/activity
 * 獲取活躍度統計
 *
 * @query {number} [activeWithinDays=30] - 活躍度時間範圍（天數，最大 365）
 * @query {string} [groupBy] - 統計分組方式：role, location, education_stage
 * @query {number} [limit=100] - 分頁限制（最大 1000）
 * @query {number} [offset=0] - 分頁偏移
 *
 * @returns {ActivityStats} 活躍度統計資料
 */
router.get(
  '/activity',
  ...adminOnly,
  validate(activityStatsQuerySchema, 'query'),
  userStatsController.getActivityStats
);

/**
 * GET /api/v1/admin/userStats/export
 * 匯出統計資料
 *
 * @query {string} format - 匯出格式（必選）：csv, excel
 * @query {string} type - 匯出類型（必選）：registrations, activity, full
 * @query {string} [startDate] - 開始日期 (YYYY-MM-DD)
 * @query {string} [endDate] - 結束日期 (YYYY-MM-DD)
 * @query {string} [groupBy] - 統計分組方式（type=registrations 時必選）
 *
 * @returns {File} CSV 或 Excel 檔案
 */
router.get(
  '/export',
  ...adminOnly,
  validate(exportStatsQuerySchema, 'query'),
  userStatsController.exportStats
);

export default router;
