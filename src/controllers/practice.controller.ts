/**
 * Practice Controller
 * 實踐控制器 - 處理實踐相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import * as practiceService from '../services/practice.service';
import * as practiceCheckInService from '../services/practice-checkin.service';
import * as practiceInteractionService from '../services/practice-interaction.service';
import * as encouragementService from '../services/encouragement.service';
import * as tagPromptService from '../services/tag-prompt.service';
import * as practiceTemplateService from '../services/practice-template.service';
import { externalToInternalId } from '../services/id-converter.service';
import { asyncHandler } from '../middleware/error.middleware';
import { BadRequestError, UnauthorizedError } from '../middleware/error.middleware';
import type {
  CreatePracticeRequest,
  UpdatePracticeRequest,
  PracticeQueryParams,
  CheckInRequest,
  CreateCheckInRequest,
  CreateCheckInWithFilesRequest,
  CheckInQueryParams,
  PracticeStatus,
  SortField,
  SortOrder,
  CheckInMood
} from '../types/practice.types';
import {
  // Response validation schemas
  practiceApiResponseSchema,
  practicesListApiResponseSchema,
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
  createCheckInApiResponseSchema,
  updateCheckInApiResponseSchema,
  updatePracticeApiResponseSchema,
  operationSuccessApiResponseSchema,
  copyPracticeApiResponseSchema,
  // Request validation schemas
  checkInSchema,
  updateCheckInSchema
} from '../validators/practice.validators';

// ===== 參數驗證 Schemas =====

/** UUID 格式驗證 Schema */
const uuidParamSchema = z.string().uuid('Practice ID 格式不正確，應為 UUID 格式');

/** 年份參數驗證 Schema */
const yearParamSchema = z.coerce.number()
  .int('年份必須是整數')
  .min(2020, '年份不能早於 2020 年')
  .max(2050, '年份不能晚於 2050 年');

/** 月份參數驗證 Schema */
const monthParamSchema = z.coerce.number()
  .int('月份必須是整數')
  .min(1, '月份必須在 1-12 之間')
  .max(12, '月份必須在 1-12 之間');

/**
 * 驗證並轉換 practice external ID 為 internal ID
 * @param externalId - UUID 格式的外部 ID
 * @returns 內部數字 ID
 * @throws BadRequestError 如果 UUID 格式不正確
 */
async function validateAndConvertPracticeId(externalId: string): Promise<number> {
  const validationResult = uuidParamSchema.safeParse(externalId);
  if (!validationResult.success) {
    throw new BadRequestError(validationResult.error.issues[0]?.message || 'Practice ID 格式不正確');
  }
  return externalToInternalId('practice', externalId);
}

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
   * 取得指定用戶的實踐列表
   * GET /api/v1/practices/user/:userId
   */
  getUserPractices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userExternalId = req.params.userId;

    // 將 user external_id 轉換為 internal id
    const userId = await externalToInternalId('user', userExternalId);

    const queryParams: PracticeQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string,
      status: req.query.status as PracticeStatus,
      sortBy: req.query.sortBy as SortField,
      sortOrder: req.query.sortOrder as SortOrder
    };

    const result = await practiceService.findUserPractices(userId, queryParams);

    // 驗證響應格式
    const validatedResponse = practicesListApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取得單一實踐詳情
   * GET /api/v1/practices/:id
   */
  getPractice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const userId = req.user?.id;

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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
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
    const userId = req.user!.id;

    const result = await practiceService.getUserStats(userId);

    // 驗證響應格式
    const validatedResponse = practiceStatsApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 解析 FormData 中的 JSON 欄位
   * 注意：空字串應該被保留，以便使用者可以清空欄位
   */
  private parseCheckInFormData(body: Record<string, unknown>): Partial<CheckInRequest> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      // 只跳過 undefined 和 null，保留空字串以支援清空欄位
      if (value === undefined || value === null) {
        continue;
      }

      // 需要解析為 JSON 的陣列欄位
      if ((key === 'tags' || key === 'imageUrls') && typeof value === 'string') {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result as Partial<CheckInRequest>;
  }

  /**
   * 創建簽到記錄
   * POST /api/v1/practices/:id/checkins
   * 支援 multipart/form-data（含 images 檔案）或 application/json
   */
  createCheckIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);

    // 檢查是否為 multipart/form-data（有檔案上傳）
    const imageFiles = req.files as Express.Multer.File[] | undefined;
    const contentType = req.headers['content-type'] || '';
    const isFormData = contentType.includes('multipart/form-data');

    // 解析表單資料
    const parsedBody = isFormData
      ? this.parseCheckInFormData(req.body)
      : req.body;

    // 驗證請求資料
    const validation = checkInSchema.safeParse(parsedBody);
    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw new BadRequestError(`驗證失敗: ${errorMessage}`);
    }

    const requestBody = validation.data;

    // 如果有圖片檔案，使用新的服務函數
    if (imageFiles && imageFiles.length > 0) {
      const checkInData: CreateCheckInWithFilesRequest = {
        note: requestBody.note,
        mood: requestBody.mood as CheckInMood | undefined,
        ogImageUrl: requestBody.ogImageUrl,
        tags: requestBody.tags,
        imageFiles
      };
      const result = await practiceCheckInService.createCheckInWithImages(
        practiceId,
        checkInData,
        req.user.id
      );

      const validatedResponse = createCheckInApiResponseSchema.parse(result);
      res.status(201).json(validatedResponse);
      return;
    }

    // 沒有圖片檔案，使用原有邏輯
    const checkInData: CreateCheckInRequest = {
      note: requestBody.note,
      mood: requestBody.mood as CheckInMood | undefined,
      imageUrls: requestBody.imageUrls || [],
      ogImageUrl: requestBody.ogImageUrl,
      tags: requestBody.tags
    };
    const result = await practiceCheckInService.createCheckIn(practiceId, checkInData, req.user.id);

    // 驗證響應格式（使用含鼓勵句和進度的 schema）
    const validatedResponse = createCheckInApiResponseSchema.parse(result);

    res.status(201).json(validatedResponse);
  });

  /**
   * 更新簽到記錄
   * PUT /api/v1/practices/:id/checkins/:checkInId
   */
  updateCheckIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const checkInId = parseInt(req.params.checkInId, 10);

    if (isNaN(checkInId) || checkInId <= 0) {
      throw new BadRequestError('無效的簽到記錄 ID');
    }

    // 檢查是否有上傳檔案
    const imageFiles = req.files as Express.Multer.File[] | undefined;

    // 檢查是否為 multipart/form-data
    const contentType = req.headers['content-type'] || '';
    const isFormData = contentType.includes('multipart/form-data');

    // 解析表單資料
    const parsedBody = isFormData
      ? this.parseCheckInFormData(req.body)
      : req.body;

    // 驗證請求資料
    const validation = updateCheckInSchema.safeParse(parsedBody);
    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw new BadRequestError(`驗證失敗: ${errorMessage}`);
    }

    const updateData = validation.data;

    // 如果有圖片檔案，先上傳到 R2 再更新
    let imageUrls = updateData.imageUrls;
    if (imageFiles && imageFiles.length > 0) {
      imageUrls = await practiceCheckInService.uploadCheckInImages(imageFiles);
    }

    const result = await practiceCheckInService.updateCheckIn(
      checkInId,
      practiceId,
      req.user.id,
      {
        mood: updateData.mood as CheckInMood | undefined,
        note: updateData.note,
        imageUrls,
        ogImageUrl: updateData.ogImageUrl,
        tags: updateData.tags
      }
    );

    // 驗證響應格式
    const validatedResponse = updateCheckInApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 刪除簽到記錄
   * DELETE /api/v1/practices/:id/checkins/:checkInId
   */
  deleteCheckIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const checkInId = parseInt(req.params.checkInId, 10);

    if (isNaN(checkInId) || checkInId <= 0) {
      throw new BadRequestError('無效的簽到記錄 ID');
    }

    const result = await practiceCheckInService.deleteCheckIn(checkInId, practiceId, req.user.id);

    res.json(result);
  });

  /**
   * 取得簽到記錄列表
   * GET /api/v1/practices/:id/checkins
   */
  getCheckIns = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const practiceId = await validateAndConvertPracticeId(req.params.id);

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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
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

    const practiceId = await validateAndConvertPracticeId(req.params.id);

    // 驗證並解析年月參數
    const yearResult = yearParamSchema.safeParse(req.params.year);
    const monthResult = monthParamSchema.safeParse(req.params.month);

    if (!yearResult.success) {
      throw new BadRequestError(yearResult.error.issues[0]?.message || '無效的年份參數');
    }
    if (!monthResult.success) {
      throw new BadRequestError(monthResult.error.issues[0]?.message || '無效的月份參數');
    }

    const calendar = await practiceCheckInService.getMonthlyCheckInCalendar(
      practiceId,
      req.user.id,
      yearResult.data,
      monthResult.data
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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const viewData = req.body;
    const result = await practiceInteractionService.recordView(practiceId, req.user.id, viewData);

    // 驗證響應格式
    const validatedResponse = recordViewApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  recordReadProgress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }
    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const { depthPercent } = req.body as { depthPercent: number };
    const result = await practiceInteractionService.recordReadProgress(practiceId, req.user.id, depthPercent);
    res.json(result);
  });

  recordTimeSpent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }
    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const { seconds } = req.body as { seconds: number };
    const result = await practiceInteractionService.recordTimeSpent(practiceId, req.user.id, seconds);
    res.json(result);
  });

  /**
   * 取得實踐互動統計
   * GET /api/v1/practices/:id/stats
   */
  getInteractionStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const practiceId = await validateAndConvertPracticeId(req.params.id);
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

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceInteractionService.getUserInteractionStatus(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = userInteractionStatusApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  // ============================================================================
  // 新增：模板、鼓勵句、引導句、封存功能
  // ============================================================================

  /**
   * 取得實踐模板列表
   * GET /api/v1/practices/templates
   */
  getTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      category: req.query.category as string,
      search: req.query.search as string
    };

    const result = await practiceTemplateService.getTemplates(params);
    res.json(result);
  });

  /**
   * 取得單一實踐模板
   * GET /api/v1/practices/templates/:id
   */
  getTemplateById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const templateId = req.params.id;
    const result = await practiceTemplateService.getTemplateById(templateId);
    res.json(result);
  });

  /**
   * 隨機取得實踐模板
   * GET /api/v1/practices/templates/random
   */
  getRandomTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = {
      count: parseInt(req.query.count as string) || 3,
      category: req.query.category as string
    };

    const result = await practiceTemplateService.getRandomTemplates(params);
    res.json(result);
  });

  /**
   * 取得模板分類列表
   * GET /api/v1/practices/templates/categories
   */
  getTemplateCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await practiceTemplateService.getTemplateCategories();
    res.json(result);
  });

  /**
   * 創建實踐模板
   * POST /api/v1/practices/templates
   */
  createTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = req.body;
    const result = await practiceTemplateService.createTemplate(input);
    res.status(201).json(result);
  });

  /**
   * 更新實踐模板
   * PUT /api/v1/practices/templates/:id
   */
  updateTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const templateId = req.params.id;
    const input = req.body;
    const result = await practiceTemplateService.updateTemplate(templateId, input);
    res.json(result);
  });

  /**
   * 刪除實踐模板
   * DELETE /api/v1/practices/templates/:id
   */
  deleteTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const templateId = req.params.id;
    const result = await practiceTemplateService.deleteTemplate(templateId);
    res.json(result);
  });

  /**
   * 取得隨機鼓勵句
   * GET /api/v1/checkin-encouragements/random
   */
  getRandomEncouragement = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await encouragementService.getRandomEncouragement();
    res.json(result);
  });

  /**
   * 取得引導句列表
   * GET /api/v1/tag-prompts
   */
  getTagPrompts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 將舊的類型映射到新的類型
    const usageTypeMap: Record<string, tagPromptService.TagPromptUsageType> = {
      'checkin': 'practice_checkin',
      'practice': 'practice_checkin',
      'general': 'practice_checkin',
      'practice_checkin': 'practice_checkin',
      'reflection': 'reflection',
      'summary': 'summary'
    };
    const usageTypeInput = req.query.usageType as string || 'checkin';
    const usageType = usageTypeMap[usageTypeInput] || 'practice_checkin';

    // 將舊的 locale 映射到新的 locale
    const localeMap: Record<string, tagPromptService.TagPromptLocale> = {
      'zh-TW': 'zh-TW',
      'en': 'en-US',
      'en-US': 'en-US'
    };
    const localeInput = req.query.locale as string || 'zh-TW';
    const locale = localeMap[localeInput] || 'zh-TW';

    const result = await tagPromptService.getTagPrompts(usageType, locale);
    res.json(result);
  });

  /**
   * 複製實踐
   * POST /api/v1/practices/:id/copy
   */
  copyPractice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceService.copyPractice(practiceId, req.user.id);

    const validatedResponse = copyPracticeApiResponseSchema.parse(result);

    res.status(201).json(validatedResponse);
  });

  /**
   * 更新實踐反思文字
   * PATCH /api/v1/practices/:id/reflection
   */
  patchReflection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceService.updateReflection(practiceId, req.user.id, req.body.reflection);

    res.json(result);
  });

  /**
   * 更新「接下來我想」文字
   * PATCH /api/v1/practices/:id/next-intent
   */
  patchNextIntent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceService.updateNextIntent(
      practiceId,
      req.user.id,
      req.body.nextIntent,
      req.body.saveDraft
    );

    res.json(result);
  });

  /**
   * 更新精選打卡列表
   * PATCH /api/v1/practices/:id/selected-checkins
   */
  patchSelectedCheckins = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceService.updateSelectedCheckins(practiceId, req.user.id, req.body.checkinIds);

    res.json(result);
  });

  /**
   * 建立 AI 洞察回饋
   * POST /api/v1/practices/:id/insight-feedback
   */
  createInsightFeedback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceService.createInsightFeedback(
      practiceId,
      req.user.id,
      req.body.type,
      req.body.reasons
    );

    res.json(result);
  });

  /**
   * 封存實踐
   * POST /api/v1/practices/:id/archive
   */
  archive = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceService.archive(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = operationSuccessApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });

  /**
   * 取消封存實踐
   * POST /api/v1/practices/:id/unarchive
   */
  unarchive = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || typeof req.user.id !== 'number') {
      throw new UnauthorizedError('未授權存取');
    }

    const practiceId = await validateAndConvertPracticeId(req.params.id);
    const result = await practiceService.unarchive(practiceId, req.user.id);

    // 驗證響應格式
    const validatedResponse = practiceApiResponseSchema.parse(result);

    res.json(validatedResponse);
  });
}

// 建立並導出控制器實例
export const practiceController = new PracticeController();
export default practiceController;