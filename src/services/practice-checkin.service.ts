/**
 * Practice 簽到服務
 * 
 * 提供實踐簽到相關的業務邏輯，包含簽到記錄建立、查詢、連續簽到計算、進度更新等功能
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { ConflictError, NotFoundError, InternalServerError, BadRequestError } from '../middleware/error.middleware';
import {
  CheckInEntity,
  CheckInResponseWithEncouragement,
  CreateCheckInRequest,
  CreateCheckInWithFilesRequest,
  CheckInQueryParams,
  CheckInMood,
  PracticeStatus
} from '../types/practice.types';
import { uploadToR2, deleteFromR2 } from './r2.service';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiSuccessResponse,
  PaginatedApiResponse
} from '../types/api-response.types';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '../utils/response-helper';
import { calculatePagination } from '../utils/pagination-helper';
import {
  calculateProgress,
  type PracticeProgressConfig
} from '../utils/practice-progress';
import {
  determineNewStatus,
  canCheckIn,
  checkHasPassedEndDate,
  type PracticeStatusType
} from '../utils/practice-status';
import { enqueuePracticeEmail } from '../queues';
import { setEntityTags } from './tag.service';

const prismaClient = prisma;

/** 打卡記錄的 entity_type */
const CHECKIN_ENTITY_TYPE = 'practice_checkin';

/** 一天的毫秒數 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 建立簽到記錄
 *
 * 變更：
 * 1. 移除 progressAmount 參數要求（不再從前端接收）
 * 2. 檢查是否為首次打卡（查詢現有打卡數量）
 * 3. 若提早打卡（今日 < start_date），執行日期位移
 * 4. 使用 calculateProgress() 計算新進度（基於打卡次數）
 * 5. 更新 practices.progress_percentage 和 status: 'active'
 * 6. 首次打卡設定 first_checkin_at
 * 7. 回傳隨機鼓勵句
 */
export async function createCheckIn(
  practiceId: number,
  data: Omit<CreateCheckInRequest, 'progressAmount'>,
  userId: number
): Promise<ApiSuccessResponse<CheckInResponseWithEncouragement>> {
  try {
    // 驗證實踐存在且屬於使用者
    const practice = await prismaClient.practices.findUnique({
      where: {
        id: practiceId,
        user_id: userId
      }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在或沒有權限');
    }

    // 檢查狀態是否允許打卡
    if (!canCheckIn(practice.status as PracticeStatusType)) {
      throw new ConflictError('此實踐狀態不允許打卡');
    }

    // 小時制：檢查距離上次打卡是否已過 24 小時
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - MS_PER_DAY);

    const recentCheckIn = await prismaClient.practice_checkins.findFirst({
      where: {
        practice_id: practiceId,
        user_id: userId,
        created_at: {
          gte: twentyFourHoursAgo
        }
      }
    });

    if (recentCheckIn) {
      throw new ConflictError('距離上次打卡未滿 24 小時');
    }

    // 用於日期位移邏輯（保留 UTC 零點）
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 取得實踐配置用於進度計算
    const durationDays = (practice as { duration_days?: number }).duration_days || 14;
    const progressConfig: PracticeProgressConfig = {
      frequencyMinDays: (practice as { frequency_min_days?: number }).frequency_min_days || 1,
      frequencyMaxDays: (practice as { frequency_max_days?: number }).frequency_max_days || 7,
      durationDays
    };

    // 使用交易確保資料一致性，避免 race condition
    const { checkIn, isFirstCheckIn, progressResult, newStatus, streakInfo, newCheckInCount } = await prismaClient.$transaction(async (tx) => {
      // 在 transaction 內查詢打卡數量，確保原子性
      const currentCheckInCount = await tx.practice_checkins.count({
        where: {
          practice_id: practiceId,
          user_id: userId
        }
      });

      const txIsFirstCheckIn = currentCheckInCount === 0;
      const newCheckInCount = currentCheckInCount + 1;

      // 計算新進度
      const txProgressResult = calculateProgress(progressConfig, newCheckInCount);

      // 準備更新實踐的資料
      const practiceUpdateData: Prisma.practicesUpdateInput = {
        progress_percentage: txProgressResult.percentage,
        updated_at: new Date()
      };

      // 決定新狀態（小時制：first_checkin_at + duration_days * 24h）
      const hasPassedEndDate = checkHasPassedEndDate(practice.end_date, {
        firstCheckinAt: practice.first_checkin_at,
        createdAt: practice.created_at,
        durationDays: durationDays
      });

      const txNewStatus = determineNewStatus({
        currentStatus: practice.status as PracticeStatusType,
        hasCheckIns: true,
        hasPassedEndDate
      });
      practiceUpdateData.status = txNewStatus;

      // 首次打卡：設定 first_checkin_at 和日期位移
      if (txIsFirstCheckIn) {
        practiceUpdateData.first_checkin_at = new Date();

        // 日期位移：若提早打卡（今日 < start_date），執行日期位移
        const practiceStartDate = practice.start_date ? new Date(practice.start_date) : null;
        if (practiceStartDate) {
          practiceStartDate.setUTCHours(0, 0, 0, 0);

          if (today.getTime() < practiceStartDate.getTime()) {
            // 計算需要位移的天數
            const shiftDays = Math.ceil((practiceStartDate.getTime() - today.getTime()) / MS_PER_DAY);

            // 更新 start_date 為今天
            practiceUpdateData.start_date = today;

            // 從 start_date + duration_days 重新計算 end_date（而非減法位移）
            const newEndDate = new Date(today);
            newEndDate.setUTCDate(newEndDate.getUTCDate() + durationDays - 1);
            practiceUpdateData.end_date = newEndDate;

            loggerService.info('Practice dates shifted due to early check-in', {
              practiceId,
              userId,
              shiftDays,
              originalStartDate: practiceStartDate.toISOString(),
              newStartDate: today.toISOString(),
              newEndDate: newEndDate.toISOString()
            });
          }
        }
      }

      // 建立簽到記錄
      const txCheckIn = await tx.practice_checkins.create({
        data: {
          practice_id: practiceId,
          user_id: userId,
          checkin_date: today,
          mood: data.mood,
          note: data.note,
          image_urls: data.imageUrls || [],
          og_image_url: data.ogImageUrl
        },
        include: {
          practices: {
            select: {
              title: true
            }
          }
        }
      });

      // 更新實踐進度和狀態
      await tx.practices.update({
        where: { id: practiceId },
        data: practiceUpdateData
      });

      // 計算連續簽到天數
      const txStreakInfo = await calculateStreakInTransaction(tx, practiceId, userId, today);

      return {
        checkIn: txCheckIn,
        isFirstCheckIn: txIsFirstCheckIn,
        progressResult: txProgressResult,
        newStatus: txNewStatus,
        streakInfo: txStreakInfo,
        newCheckInCount
      };
    });

    // 設置打卡標籤（如果有提供）
    const tags = data.tags || [];
    if (tags.length > 0) {
      await setEntityTags(CHECKIN_ENTITY_TYPE, checkIn.id, tags, userId);
    }

    // 取得隨機鼓勵句
    const encouragement = await getRandomEncouragement();

    const response: CheckInResponseWithEncouragement = {
      id: checkIn.id,
      practiceId: checkIn.practice_id,
      userId: checkIn.user_id,
      checkinDate: checkIn.checkin_date.toISOString().split('T')[0],
      mood: checkIn.mood as CheckInMood,
      note: checkIn.note || undefined,
      imageUrls: checkIn.image_urls || [],
      ogImageUrl: checkIn.og_image_url ?? null,
      tags,
      createdAt: checkIn.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: checkIn.updated_at?.toISOString(),
      // 擴展欄位
      encouragement,
      practiceProgressPercentage: progressResult.percentage,
      practiceStatus: newStatus as PracticeStatus,
      isFirstCheckIn,
      hasReachedTarget: progressResult.hasReachedMinTarget
    };

    loggerService.info('Check-in created', {
      practiceId,
      userId,
      checkInCount: newCheckInCount,
      progressPercentage: progressResult.percentage,
      streak: streakInfo.newStreak,
      isFirstCheckIn,
      hasReachedTarget: progressResult.hasReachedMinTarget
    });

    // 觸發 PE02 首次打卡郵件（非阻塞）
    if (isFirstCheckIn) {
      enqueuePracticeEmail('PE02', practiceId, userId).catch(err => {
        loggerService.error('Failed to enqueue PE02 email', { practiceId, error: err });
      });
    }

    return createSuccessResponse(response);

  } catch (error) {
    loggerService.error('Failed to create check-in', { practiceId, userId, error });
    throw error;
  }
}

/**
 * 取得隨機鼓勵句
 * 使用 encouragement.service.ts 提供的功能
 */
async function getRandomEncouragement(): Promise<string> {
  const { getRandomEncouragement: getEncouragement } = await import('./encouragement.service');
  const result = await getEncouragement();
  return result.data.message;
}

/**
 * 建立簽到記錄（含圖片檔案上傳）
 * 實作 FormData 統一提交方案
 *
 * 流程：
 * 1. 驗證表單資料
 * 2. 上傳圖片到 R2
 * 3. 建立資料庫記錄
 * 4. 失敗時刪除已上傳的圖片
 */
export async function createCheckInWithImages(
  practiceId: number,
  data: CreateCheckInWithFilesRequest,
  userId: number
): Promise<ApiSuccessResponse<CheckInResponseWithEncouragement>> {
  const { imageFiles, ...checkInData } = data;
  const uploadedImageUrls: string[] = [];
  const uploadedFilenames: string[] = [];

  // 驗證檔案類型和大小
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

  for (const file of imageFiles) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        `不支援的圖片格式: ${file.mimetype}。支援格式: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestError(
        `檔案大小超過限制: ${Math.round(file.size / 1024)}KB (最大: ${MAX_IMAGE_SIZE / 1024}KB)`
      );
    }
  }

  try {
    // Step 1: 上傳所有圖片到 R2
    const baseUrl = process.env.R2_PUBLIC_URL ||
      `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ENDPOINT?.replace('https://', '')}`;

    for (const file of imageFiles) {
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const filename = `checkins/${uuidv4()}.${fileExtension}`;

      await uploadToR2(file, filename);
      uploadedFilenames.push(filename);
      uploadedImageUrls.push(`${baseUrl}/${filename}`);
    }

    // Step 2: 使用上傳後的 URL 建立打卡記錄
    const createData: CreateCheckInRequest = {
      ...checkInData,
      imageUrls: uploadedImageUrls
    };

    const result = await createCheckIn(practiceId, createData, userId);

    loggerService.info('Check-in with images created', {
      practiceId,
      userId,
      imageCount: uploadedImageUrls.length
    });

    return result;

  } catch (error) {
    // Step 3: 如果失敗，刪除已上傳的圖片
    for (const filename of uploadedFilenames) {
      await deleteFromR2(filename).catch(err => {
        loggerService.warn('Failed to cleanup uploaded image', { filename, err });
      });
    }

    loggerService.error('Failed to create check-in with images', { practiceId, userId, error });
    throw error;
  }
}

/**
 * 取得簽到記錄列表
 */
export async function getCheckIns(practiceId: number, params: CheckInQueryParams, userId?: number): Promise<PaginatedApiResponse<CheckInEntity>> {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      mood
    } = params;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    // 建構查詢條件
    const where: Prisma.practice_checkinsWhereInput = {
      practice_id: practiceId,
      ...(userId && { user_id: userId }),
      ...(startDate && {
        checkin_date: {
          gte: new Date(startDate)
        }
      }),
      ...(endDate && {
        checkin_date: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          lte: new Date(endDate)
        }
      }),
      ...(mood && { mood })
    };

    // 執行查詢
    const [checkIns, total] = await Promise.all([
      prismaClient.practice_checkins.findMany({
        where,
        skip,
        take,
        orderBy: { checkin_date: 'desc' },
        include: {
          practices: {
            select: {
              title: true
            }
          }
        }
      }),
      prismaClient.practice_checkins.count({ where })
    ]);

    // 批量獲取所有打卡記錄的標籤
    const checkInIds = checkIns.map(c => c.id);
    const entityTagsMap = new Map<number, string[]>();

    if (checkInIds.length > 0) {
      const entityTags = await prismaClient.entity_tags.findMany({
        where: {
          entity_type: CHECKIN_ENTITY_TYPE,
          entity_id: { in: checkInIds }
        },
        include: {
          tags: true
        }
      });

      // 建立 checkInId -> tags[] 的映射
      for (const et of entityTags) {
        const existing = entityTagsMap.get(et.entity_id) || [];
        existing.push(et.tags.name);
        entityTagsMap.set(et.entity_id, existing);
      }
    }

    const checkInEntities: CheckInEntity[] = checkIns.map(checkIn => ({
      id: checkIn.id,
      practiceId: checkIn.practice_id,
      userId: checkIn.user_id,
      checkinDate: checkIn.checkin_date.toISOString().split('T')[0],
      mood: checkIn.mood as CheckInMood,
      note: checkIn.note || undefined,
      imageUrls: checkIn.image_urls || [],
      ogImageUrl: checkIn.og_image_url ?? null,
      tags: entityTagsMap.get(checkIn.id) || [],
      createdAt: checkIn.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: checkIn.updated_at?.toISOString()
    }));

    const paginationInfo = calculatePagination(page, take, total);

    loggerService.info('Check-ins retrieved', {
      practiceId,
      count: checkInEntities.length,
      total,
      filters: { startDate, endDate, mood }
    });

    return createPaginatedResponse(
      checkInEntities,
      paginationInfo,
      {
        filters: { startDate, endDate, mood }
      }
    );

  } catch (error) {
    loggerService.error('Failed to retrieve check-ins', { practiceId, error });
    throw new InternalServerError('取得簽到記錄失敗');
  }
}

/**
 * 計算連續簽到天數
 */
export async function calculateStreak(practiceId: number, userId: number, currentDate: Date): Promise<{ newStreak: number; isNewRecord: boolean }> {
  try {
    // 取得最近的簽到記錄
    const recentCheckIns = await prismaClient.practice_checkins.findMany({
      where: {
        practice_id: practiceId,
        user_id: userId,
        checkin_date: {
          lt: currentDate
        }
      },
      orderBy: { checkin_date: 'desc' },
      take: 30 // 取最近30天的記錄來計算連續性
    });

    if (recentCheckIns.length === 0) {
      return { newStreak: 1, isNewRecord: true };
    }

    let streak = 1; // 包含今天

    // 統一使用 UTC 日期字串比較，避免時區問題
    const toUTCDateStr = (date: Date): string => date.toISOString().split('T')[0];

    const yesterday = new Date(currentDate);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    // 檢查是否與昨天連續
    const yesterdayStr = toUTCDateStr(yesterday);
    const yesterdayCheckIn = recentCheckIns.find(checkIn =>
      toUTCDateStr(checkIn.checkin_date) === yesterdayStr
    );

    if (yesterdayCheckIn) {
      // 從昨天開始往前計算連續天數
      const checkDate = new Date(yesterday);

      for (const checkIn of recentCheckIns) {
        if (toUTCDateStr(checkIn.checkin_date) === toUTCDateStr(checkDate)) {
          streak++;
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }

    // Note: max_streak field doesn't exist in schema
    // Would need to calculate historical max from check-ins
    const isNewRecord = false; // Cannot determine without max_streak field

    return { newStreak: streak, isNewRecord };

  } catch (error) {
    loggerService.error('Failed to calculate streak', { practiceId, userId, error });
    return { newStreak: 1, isNewRecord: false };
  }
}

/**
 * 計算連續簽到天數（Transaction 版本）
 * 用於在 transaction 內計算連續天數
 */
async function calculateStreakInTransaction(
  tx: Prisma.TransactionClient,
  practiceId: number,
  userId: number,
  currentDate: Date
): Promise<{ newStreak: number; isNewRecord: boolean }> {
  try {
    const recentCheckIns = await tx.practice_checkins.findMany({
      where: {
        practice_id: practiceId,
        user_id: userId,
        checkin_date: {
          lt: currentDate
        }
      },
      orderBy: { checkin_date: 'desc' },
      take: 30
    });

    if (recentCheckIns.length === 0) {
      return { newStreak: 1, isNewRecord: true };
    }

    let streak = 1;
    const toUTCDateStr = (date: Date): string => date.toISOString().split('T')[0];

    const yesterday = new Date(currentDate);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const yesterdayStr = toUTCDateStr(yesterday);
    const yesterdayCheckIn = recentCheckIns.find(checkIn =>
      toUTCDateStr(checkIn.checkin_date) === yesterdayStr
    );

    if (yesterdayCheckIn) {
      const checkDate = new Date(yesterday);
      for (const checkIn of recentCheckIns) {
        if (toUTCDateStr(checkIn.checkin_date) === toUTCDateStr(checkDate)) {
          streak++;
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }

    return { newStreak: streak, isNewRecord: false };
  } catch (error) {
    loggerService.error('Failed to calculate streak in transaction', { practiceId, userId, error });
    return { newStreak: 1, isNewRecord: false };
  }
}

/**
 * 更新實踐進度
 * Note: This function is deprecated as the progress tracking fields don't exist in the schema
 * Progress should be calculated from check-ins when needed
 */
export async function updatePracticeProgress(
  practiceId: number,
  updates: {
    currentProgress: number;
    streak: number;
    maxStreak: number;
    lastCheckinAt: Date;
  }
): Promise<void> {
  try {
    // Only update the timestamp since progress fields don't exist
    await prismaClient.practices.update({
      where: { id: practiceId },
      data: {
        updated_at: new Date()
      }
    });

    loggerService.info('Practice timestamp updated', {
      practiceId,
      note: 'Progress tracking fields do not exist in schema'
    });

  } catch (error) {
    loggerService.error('Failed to update practice', { practiceId, updates, error });
    throw new InternalServerError('更新實踐失敗');
  }
}

/**
 * 驗證打卡間隔限制（小時制：24 小時）
 */
export async function validateDailyCheckIn(practiceId: number, userId: number): Promise<boolean> {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - MS_PER_DAY);

    const recentCheckIn = await prismaClient.practice_checkins.findFirst({
      where: {
        practice_id: practiceId,
        user_id: userId,
        created_at: {
          gte: twentyFourHoursAgo
        }
      }
    });

    return !recentCheckIn;

  } catch (error) {
    loggerService.error('Failed to validate check-in interval', { practiceId, userId, error });
    return false;
  }
}

/**
 * 取得簽到統計資訊
 */
export async function getCheckInStats(practiceId: number, userId: number): Promise<{
  totalCheckIns: number;
  currentStreak: number;
  maxStreak: number;
  lastCheckinAt?: string;
}> {
  try {
    const checkInStats = await prismaClient.practice_checkins.aggregate({
      where: {
        practice_id: practiceId,
        user_id: userId
      },
      _count: { id: true },
      _max: { checkin_date: true }
    });

    // Calculate current streak from check-ins
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const streakInfo = await calculateStreak(practiceId, userId, today);

    return {
      totalCheckIns: checkInStats._count.id,
      currentStreak: streakInfo.newStreak, // Calculated from check-ins
      maxStreak: 0, // Field doesn't exist in DB - would need historical calculation
      lastCheckinAt: checkInStats._max.checkin_date?.toISOString()
    };

  } catch (error) {
    loggerService.error('Failed to get check-in stats', { practiceId, userId, error });
    throw new InternalServerError('取得簽到統計失敗');
  }
}

/**
 * 取得使用者的月度簽到日曆
 */
export async function getMonthlyCheckInCalendar(practiceId: number, userId: number, year: number, month: number): Promise<{
  checkInDates: string[];
  totalCheckIns: number;
  streakDays: Array<{ date: string; streakDay: number }>;
}> {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const checkIns = await prismaClient.practice_checkins.findMany({
      where: {
        practice_id: practiceId,
        user_id: userId,
        checkin_date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        checkin_date: true
      },
      orderBy: { checkin_date: 'asc' }
    });

    const checkInDates = checkIns.map(checkIn =>
      checkIn.checkin_date.toISOString().split('T')[0]
    );

    // Calculate streak day for each check-in (field doesn't exist in DB)
    const streakDays = checkIns.map((checkIn, index) => ({
      date: checkIn.checkin_date.toISOString().split('T')[0],
      streakDay: index + 1 // Simple sequential numbering as fallback
    }));

    return {
      checkInDates,
      totalCheckIns: checkIns.length,
      streakDays
    };

  } catch (error) {
    loggerService.error('Failed to get monthly check-in calendar', { practiceId, userId, year, month, error });
    throw new InternalServerError('取得月度簽到日曆失敗');
  }
}

/**
 * 更新簽到記錄請求類型
 */
export interface UpdateCheckInData {
  mood?: 'give_up' | 'frustrated' | 'bored' | 'neutral' | 'good' | 'happy';
  note?: string;
  imageUrls?: string[];
  ogImageUrl?: string | null;
  tags?: string[];
}

/**
 * 更新簽到記錄
 * 只允許擁有者編輯自己的打卡記錄
 */
export async function updateCheckIn(
  checkInId: number,
  practiceId: number,
  userId: number,
  data: UpdateCheckInData
): Promise<ApiSuccessResponse<CheckInEntity>> {
  // 驗證簽到記錄存在且屬於該用戶
  const existingCheckIn = await prismaClient.practice_checkins.findFirst({
    where: {
      id: checkInId,
      practice_id: practiceId,
      user_id: userId
    }
  });

  if (!existingCheckIn) {
    throw new NotFoundError('簽到記錄不存在或沒有權限編輯');
  }

  try {
    // 使用事務更新簽到記錄和標籤
    const updatedCheckIn = await prismaClient.$transaction(async (tx) => {
      // 準備更新資料
      const updateData: {
        mood?: string;
        note?: string;
        image_urls?: string[];
        og_image_url?: string | null;
        updated_at: Date;
      } = {
        updated_at: new Date()
      };

      if (data.mood !== undefined) {
        updateData.mood = data.mood;
      }
      if (data.note !== undefined) {
        updateData.note = data.note;
      }
      if (data.imageUrls !== undefined) {
        updateData.image_urls = data.imageUrls;
      }
      if (data.ogImageUrl !== undefined) {
        updateData.og_image_url = data.ogImageUrl;
      }

      // 更新簽到記錄
      const checkIn = await tx.practice_checkins.update({
        where: { id: checkInId },
        data: updateData
      });

      // 如果有提供 tags，更新標籤
      if (data.tags !== undefined) {
        // 先清除現有標籤
        await tx.entity_tags.deleteMany({
          where: {
            entity_type: CHECKIN_ENTITY_TYPE,
            entity_id: checkInId
          }
        });

        // 設置新標籤
        if (data.tags.length > 0) {
          await setEntityTags(CHECKIN_ENTITY_TYPE, checkInId, data.tags, userId);
        }
      }

      return checkIn;
    });

    // 取得更新後的標籤
    let tags: string[] = [];
    if (data.tags !== undefined) {
      tags = data.tags;
    } else {
      // 從資料庫取得現有標籤
      const entityTags = await prismaClient.entity_tags.findMany({
        where: {
          entity_type: CHECKIN_ENTITY_TYPE,
          entity_id: checkInId
        },
        include: {
          tags: true
        }
      });
      tags = entityTags.map(et => et.tags.name);
    }

    const response: CheckInEntity = {
      id: updatedCheckIn.id,
      practiceId: updatedCheckIn.practice_id,
      userId: updatedCheckIn.user_id,
      checkinDate: updatedCheckIn.checkin_date.toISOString().split('T')[0],
      mood: updatedCheckIn.mood as CheckInMood,
      note: updatedCheckIn.note || undefined,
      imageUrls: updatedCheckIn.image_urls || [],
      ogImageUrl: updatedCheckIn.og_image_url ?? null,
      tags,
      createdAt: updatedCheckIn.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: updatedCheckIn.updated_at?.toISOString()
    };

    loggerService.info('Check-in updated', {
      checkInId,
      practiceId,
      userId,
      updatedFields: Object.keys(data)
    });

    return createSuccessResponse(response);

  } catch (error) {
    loggerService.error('Failed to update check-in', { checkInId, practiceId, userId, error });
    throw new InternalServerError('更新簽到記錄失敗');
  }
}

/**
 * 刪除簽到記錄
 */
export async function deleteCheckIn(
  checkInId: number,
  practiceId: number,
  userId: number
): Promise<ApiSuccessResponse<{ deleted: boolean }>> {
  // 驗證簽到記錄存在且屬於該用戶和實踐
  const checkIn = await prismaClient.practice_checkins.findFirst({
    where: {
      id: checkInId,
      practice_id: practiceId,
      user_id: userId
    }
  });

  if (!checkIn) {
    throw new NotFoundError('簽到記錄不存在或沒有權限刪除');
  }

  try {
    const remainingCheckIns = await prismaClient.$transaction(async (tx) => {
      // 刪除關聯的標籤
      await tx.entity_tags.deleteMany({
        where: {
          entity_type: CHECKIN_ENTITY_TYPE,
          entity_id: checkInId
        }
      });

      // 刪除簽到記錄
      await tx.practice_checkins.delete({
        where: { id: checkInId }
      });

      // 重新計算實踐進度
      const currentRemainingCheckIns = await tx.practice_checkins.count({
        where: {
          practice_id: practiceId,
          user_id: userId
        }
      });

      // 取得實踐配置
      const practice = await tx.practices.findUnique({
        where: { id: practiceId }
      });

      if (practice) {
        const progressConfig: PracticeProgressConfig = {
          frequencyMinDays: (practice as { frequency_min_days?: number }).frequency_min_days || 1,
          frequencyMaxDays: (practice as { frequency_max_days?: number }).frequency_max_days || 7,
          durationDays: (practice as { duration_days?: number }).duration_days || 30
        };

        const progressResult = calculateProgress(progressConfig, currentRemainingCheckIns);

        // 更新實踐進度
        await tx.practices.update({
          where: { id: practiceId },
          data: {
            progress_percentage: progressResult.percentage,
            updated_at: new Date()
          }
        });
      }

      return currentRemainingCheckIns;
    });

    loggerService.info('Check-in deleted', {
      checkInId,
      practiceId,
      userId,
      remainingCheckIns
    });

    return createSuccessResponse({ deleted: true });

  } catch (error) {
    loggerService.error('Failed to delete check-in', { checkInId, practiceId, userId, error });
    throw new InternalServerError('刪除簽到記錄失敗');
  }
}