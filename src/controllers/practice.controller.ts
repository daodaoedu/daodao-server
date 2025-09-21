/**
 * Practice Controller
 * 實踐控制器 - 處理實踐相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import * as practiceService from '../services/practice.service';
import * as practiceCheckInService from '../services/practice-checkin.service';
import * as practiceInteractionService from '../services/practice-interaction.service';
import { asyncHandler } from '../middleware/error.middleware';
import { BadRequestError, UnauthorizedError } from '../middleware/error.middleware';
import type {
  CreatePracticeRequest,
  UpdatePracticeRequest,
  PracticeQueryParams,
  CheckInRequest,
  CreateCheckInRequest,
  CheckInQueryParams,
  ContentType,
  PracticeStatus,
  SortField,
  SortOrder,
  CheckInMood
} from '../types/practice.types';
import {
  // Response validation schemas
  practiceApiResponseSchema,
  practicesListApiResponseSchema,
  checkInApiResponseSchema,
  checkInsListApiResponseSchema,
  practiceStatsApiResponseSchema,
  checkInStatsApiResponseSchema,
  monthlyCalendarApiResponseSchema,
  toggleLikeApiResponseSchema,
  toggleFavoriteApiResponseSchema,
  recordShareApiResponseSchema,
  recordViewApiResponseSchema,
  interactionStatsApiResponseSchema,
  userInteractionStatusApiResponseSchema,
  createPracticeApiResponseSchema,
  updatePracticeApiResponseSchema,
  operationSuccessApiResponseSchema
} from '../validators/practice.validators';

export class PracticeController {
  /**
   * 取得實踐列表（支援篩選、分頁、搜尋）
   * GET /api/v1/practices
   */
  getPractices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const queryParams: PracticeQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string,
      contentType: req.query.contentType as ContentType,
      status: req.query.status as PracticeStatus,
      sortBy: req.query.sortBy as SortField,
      sortOrder: req.query.sortOrder as SortOrder,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined
    };

    const result = await practiceService.findAll(queryParams);

    // 驗證響應格式
    const validatedResponse = practicesListApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取得我的實踐列表
   * GET /api/v1/practices/me
   */
  getMyPractices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const queryParams: PracticeQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string,
      contentType: req.query.contentType as ContentType,
      status: req.query.status as PracticeStatus,
      sortBy: req.query.sortBy as SortField,
      sortOrder: req.query.sortOrder as SortOrder
      // 移除 userId，因為 findUserPractices 會自動設定
    };

    const result = await practiceService.findUserPractices(req.user.id, queryParams);

    // 驗證響應格式
    const validatedResponse = practicesListApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取得單一實踐詳情
   * GET /api/v1/practices/:id
   */
  getPractice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const practiceExternalId = req.params.id;
    const userId = req.user?.id;

    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const result = await practiceService.findById(practiceId, userId);

    // 驗證響應格式
    const validatedResponse = practiceApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 創建新實踐
   * POST /api/v1/practices
   */
  createPractice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceData: CreatePracticeRequest = req.body;
    const result = await practiceService.create(practiceData, req.user.id);

    // 驗證響應格式
    const validatedResponse = createPracticeApiResponseSchema.parse(result);

    res.status(201).json(validatedResponse);
  });

  /**
   * 更新實踐
   * PUT /api/v1/practices/:id
   */
  updatePractice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;

    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const updateData: UpdatePracticeRequest = req.body;
    const result = await practiceService.update(practiceId, updateData, req.user.id);

    // 驗證響應格式
    const validatedResponse = updatePracticeApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 刪除實踐（軟刪除）
   * DELETE /api/v1/practices/:id
   */
  deletePractice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;

    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const result = await practiceService.deleteFunction(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = operationSuccessApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取得使用者實踐統計
   * GET /api/v1/practices/stats
   */
  getUserPracticeStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.query.userId
      ? parseInt(req.query.userId as string)
      : req.user?.id;

    if (!userId) {
      throw new BadRequestError('需要指定使用者 ID');
    }

    const result = await practiceService.getUserStats(userId);

    // 驗證響應格式
    const validatedResponse = practiceStatsApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 創建簽到記錄
   * POST /api/v1/practices/:id/checkins
   */
  createCheckIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const requestBody: CheckInRequest = req.body;
    const checkInData: CreateCheckInRequest = {
      progressAmount: requestBody.progress,
      note: requestBody.note,
      mood: requestBody.mood,
      reflectionText: requestBody.reflectionText,
      relatedResourceId: requestBody.relatedResourceId
    };
    const result = await practiceCheckInService.createCheckIn(practiceId, checkInData, req.user.id);

    // 驗證響應格式
    const validatedResponse = checkInApiResponseSchema.parse(result);

    res.status(201).json(validatedResponse);
  });

  /**
   * 取得簽到記錄列表
   * GET /api/v1/practices/:id/checkins
   */
  getCheckIns = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const queryParams: CheckInQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      mood: req.query.mood as CheckInMood
    };

    const userId = req.user?.id;
    const result = await practiceCheckInService.getCheckIns(practiceId, queryParams, userId);

    // 驗證響應格式
    const validatedResponse = checkInsListApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取得簽到統計
   * GET /api/v1/practices/:id/checkins/stats
   */
  getCheckInStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const stats = await practiceCheckInService.getCheckInStats(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = checkInStatsApiResponseSchema.parse({ success: true, data: stats, timestamp: new Date().toISOString() });

    res.json(validatedResponse);
  });

  /**
   * 取得月度簽到日曆
   * GET /api/v1/practices/:id/checkins/calendar/:year/:month
   */
  getMonthlyCheckInCalendar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month)) {
      throw new BadRequestError('無效的年份或月份參數');
    }

    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const calendar = await practiceCheckInService.getMonthlyCheckInCalendar(
      practiceId,
      req.user.id,
      year,
      month
    );

    // 驗證響應格式
    const validatedResponse = monthlyCalendarApiResponseSchema.parse({ success: true, data: calendar, timestamp: new Date().toISOString() });

    res.json(validatedResponse);
  });

  /**
   * 點讚/取消點讚
   * POST /api/v1/practices/:id/like
   */
  toggleLike = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const result = await practiceInteractionService.toggleLike(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = toggleLikeApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 收藏/取消收藏
   * POST /api/v1/practices/:id/favorite
   */
  toggleFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const result = await practiceInteractionService.toggleFavorite(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = toggleFavoriteApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 記錄分享事件
   * POST /api/v1/practices/:id/share
   */
  recordShare = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const shareData = req.body;
    const result = await practiceInteractionService.recordShare(practiceId, req.user.id, shareData);

    // 驗證響應格式
    const validatedResponse = recordShareApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 記錄瀏覽事件
   * POST /api/v1/practices/:id/view
   */
  recordView = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const viewData = req.body;
    const result = await practiceInteractionService.recordView(practiceId, req.user.id, viewData);

    // 驗證響應格式
    const validatedResponse = recordViewApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取得實踐互動統計
   * GET /api/v1/practices/:id/stats
   */
  getInteractionStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const result = await practiceInteractionService.getInteractionStats(practiceId);

    // 驗證響應格式
    const validatedResponse = interactionStatsApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取得使用者互動狀態
   * GET /api/v1/practices/:id/user-status
   */
  getUserInteractionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceExternalId = req.params.id;
    
    // 使用 id-converter 服務將 UUID 轉換為內部 ID
    const { externalToInternalId } = await import('../services/id-converter.service');
    const practiceId = await externalToInternalId('practice', practiceExternalId);

    const result = await practiceInteractionService.getUserInteractionStatus(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = userInteractionStatusApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });
}

// 建立並導出控制器實例
export const practiceController = new PracticeController();
export default practiceController;