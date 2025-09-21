/**
 * 實踐路由
 * 處理實踐相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { practiceController } from '../controllers/practice.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  practiceQuerySchema,
  myPracticesQuerySchema,
  practiceParamsSchema,
  createPracticeSchema,
  updatePracticeSchema,
  checkInSchema,
  checkInQuerySchema,
  practiceEventViewSchema,
  practiceEventShareSchema
} from '../validators/practice.validators';
import { z } from 'zod';

// 月度日曆參數 schema
const monthlyCalendarParamsSchema = z.object({
  id: z.string().uuid('Practice ID must be a valid UUID'),
  year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits').transform(Number),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Month must be 1-12').transform(Number)
});

const router = Router();

/**
 * GET /practices
 * 取得實踐列表
 * 查詢參數：page, limit, search, contentType, status, sortBy, sortOrder, userId
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(practiceQuerySchema, 'query'),
  practiceController.getPractices as RequestHandler);

/**
 * GET /practices/me
 * 取得我的實踐列表
 * 查詢參數：page, limit, search, contentType, status, sortBy, sortOrder
 * 需要身份驗證
 */
router.get('/me',
  authenticate,
  validate(myPracticesQuerySchema, 'query'),
  practiceController.getMyPractices as RequestHandler);

/**
 * GET /practices/stats
 * 取得實踐統計資訊
 * 查詢參數：userId（可選）
 * 支援可選身份驗證
 */
router.get('/stats',
  optionalAuth,
  practiceController.getUserPracticeStats as RequestHandler);

/**
 * GET /practices/:id
 * 取得實踐詳情
 * 路徑參數：id - 實踐 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id',
  optionalAuth,
  validate(practiceParamsSchema, 'params'),
  practiceController.getPractice as RequestHandler);

/**
 * POST /practices
 * 創建新實踐
 * 請求體：CreatePracticeRequest
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  validate(createPracticeSchema, 'body'),
  practiceController.createPractice as RequestHandler);

/**
 * PUT /practices/:id
 * 更新實踐
 * 路徑參數：id - 實踐 ID
 * 請求體：UpdatePracticeRequest
 * 需要身份驗證和擁有權驗證
 */
router.put('/:id',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(updatePracticeSchema, 'body'),
  // TODO: requirePracticeOwnership middleware
  practiceController.updatePractice as RequestHandler);

/**
 * DELETE /practices/:id
 * 刪除實踐（軟刪除）
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證和擁有權驗證
 */
router.delete('/:id',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  // TODO: requirePracticeOwnership middleware
  practiceController.deletePractice as RequestHandler);

/**
 * POST /practices/:id/checkins
 * 創建簽到記錄
 * 路徑參數：id - 實踐 ID
 * 請求體：CreateCheckInRequest
 * 需要身份驗證和擁有權驗證
 */
router.post('/:id/checkins',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(checkInSchema, 'body'),
  // TODO: requirePracticeOwnership middleware
  practiceController.createCheckIn as RequestHandler);

/**
 * GET /practices/:id/checkins
 * 取得簽到記錄列表
 * 路徑參數：id - 實踐 ID
 * 查詢參數：page, limit, startDate, endDate, mood
 * 支援可選身份驗證
 */
router.get('/:id/checkins',
  optionalAuth,
  validate(practiceParamsSchema, 'params'),
  validate(checkInQuerySchema, 'query'),
  practiceController.getCheckIns as RequestHandler);

/**
 * GET /practices/:id/checkins/stats
 * 取得簽到統計
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證和擁有權驗證
 */
router.get('/:id/checkins/stats',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  // TODO: requirePracticeOwnership middleware
  practiceController.getCheckInStats as RequestHandler);

/**
 * GET /practices/:id/checkins/calendar/:year/:month
 * 取得月度簽到日曆
 * 路徑參數：id - 實踐 ID, year - 年份, month - 月份
 * 需要身份驗證和擁有權驗證
 */
router.get('/:id/checkins/calendar/:year/:month',
  authenticate,
  validate(monthlyCalendarParamsSchema, 'params'),
  // TODO: requirePracticeOwnership middleware
  practiceController.getMonthlyCheckInCalendar as RequestHandler);

/**
 * POST /practices/:id/like
 * 點讚/取消點讚
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.post('/:id/like',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.toggleLike as RequestHandler);

/**
 * POST /practices/:id/favorite
 * 收藏/取消收藏
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.post('/:id/favorite',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.toggleFavorite as RequestHandler);

/**
 * POST /practices/:id/share
 * 記錄分享事件
 * 路徑參數：id - 實踐 ID
 * 請求體：分享資訊
 * 需要身份驗證
 */
router.post('/:id/share',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(practiceEventShareSchema, 'body'),
  practiceController.recordShare as RequestHandler);

/**
 * POST /practices/:id/view
 * 記錄瀏覽事件
 * 路徑參數：id - 實踐 ID
 * 請求體：瀏覽資訊
 * 需要身份驗證
 */
router.post('/:id/view',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  validate(practiceEventViewSchema, 'body'),
  practiceController.recordView as RequestHandler);

/**
 * GET /practices/:id/stats
 * 取得實踐互動統計
 * 路徑參數：id - 實踐 ID
 * 支援可選身份驗證
 */
router.get('/:id/stats',
  optionalAuth,
  validate(practiceParamsSchema, 'params'),
  practiceController.getInteractionStats as RequestHandler);

/**
 * GET /practices/:id/user-status
 * 取得使用者對實踐的互動狀態
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.get('/:id/user-status',
  authenticate,
  validate(practiceParamsSchema, 'params'),
  practiceController.getUserInteractionStatus as RequestHandler);

export default router;