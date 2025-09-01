/**
 * 實踐路由
 * 處理實踐相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { practiceController } from '../controllers/practice.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /practices
 * 取得實踐列表
 * 查詢參數：page, limit, search, contentType, status, sortBy, sortOrder, userId
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  // TODO: validate(practiceQuerySchema, 'query'),
  practiceController.getPractices as RequestHandler);

/**
 * GET /practices/me
 * 取得我的實踐列表
 * 查詢參數：page, limit, search, contentType, status, sortBy, sortOrder
 * 需要身份驗證
 */
router.get('/me',
  authenticate,
  // TODO: validate(practiceQuerySchema, 'query'),
  practiceController.getMyPractices as RequestHandler);

/**
 * GET /practices/stats
 * 取得實踐統計資訊
 * 查詢參數：userId（可選）
 * 支援可選身份驗證
 */
router.get('/stats',
  optionalAuth,
  // TODO: validate(practiceStatsQuerySchema, 'query'),
  practiceController.getUserPracticeStats as RequestHandler);

/**
 * GET /practices/:id
 * 取得實踐詳情
 * 路徑參數：id - 實踐 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id',
  optionalAuth,
  // TODO: validate(practiceParamsSchema, 'params'),
  practiceController.getPractice as RequestHandler);

/**
 * POST /practices
 * 創建新實踐
 * 請求體：CreatePracticeRequest
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  // TODO: validate(createPracticeSchema, 'body'),
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
  // TODO: validate(practiceParamsSchema, 'params'),
  // TODO: validate(updatePracticeSchema, 'body'),
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
  // TODO: validate(practiceParamsSchema, 'params'),
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
  // TODO: validate(practiceParamsSchema, 'params'),
  // TODO: validate(createCheckInSchema, 'body'),
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
  // TODO: validate(practiceParamsSchema, 'params'),
  // TODO: validate(checkInQuerySchema, 'query'),
  practiceController.getCheckIns as RequestHandler);

/**
 * GET /practices/:id/checkins/stats
 * 取得簽到統計
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證和擁有權驗證
 */
router.get('/:id/checkins/stats',
  authenticate,
  // TODO: validate(practiceParamsSchema, 'params'),
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
  // TODO: validate(monthlyCalendarParamsSchema, 'params'),
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
  // TODO: validate(practiceParamsSchema, 'params'),
  practiceController.toggleLike as RequestHandler);

/**
 * POST /practices/:id/favorite
 * 收藏/取消收藏
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.post('/:id/favorite',
  authenticate,
  // TODO: validate(practiceParamsSchema, 'params'),
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
  // TODO: validate(practiceParamsSchema, 'params'),
  // TODO: validate(shareEventSchema, 'body'),
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
  // TODO: validate(practiceParamsSchema, 'params'),
  // TODO: validate(viewEventSchema, 'body'),
  practiceController.recordView as RequestHandler);

/**
 * GET /practices/:id/stats
 * 取得實踐互動統計
 * 路徑參數：id - 實踐 ID
 * 支援可選身份驗證
 */
router.get('/:id/stats',
  optionalAuth,
  // TODO: validate(practiceParamsSchema, 'params'),
  practiceController.getInteractionStats as RequestHandler);

/**
 * GET /practices/:id/user-status
 * 取得使用者對實踐的互動狀態
 * 路徑參數：id - 實踐 ID
 * 需要身份驗證
 */
router.get('/:id/user-status',
  authenticate,
  // TODO: validate(practiceParamsSchema, 'params'),
  practiceController.getUserInteractionStatus as RequestHandler);

export default router;