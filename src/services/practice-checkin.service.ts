/**
 * Practice 簽到服務
 * 
 * 提供實踐簽到相關的業務邏輯，包含簽到記錄建立、查詢、連續簽到計算、進度更新等功能
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { ConflictError, NotFoundError } from '../middleware/error.middleware';
import {
  CheckInEntity,
  CreateCheckInRequest,
  CheckInQueryParams,
  CheckInMood
} from '../types/practice.types';
import {
  ApiSuccessResponse,
  PaginatedApiResponse
} from '../types/api-response.types';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '../utils/response-helper';
import { calculatePagination } from '../utils/pagination-helper';

const prismaClient = prisma;

/**
 * 建立簽到記錄
 */
export async function createCheckIn(practiceId: number, data: CreateCheckInRequest, userId: number): Promise<ApiSuccessResponse<CheckInEntity>> {
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

    // 檢查當日是否已簽到
    // 使用 UTC 時間確保跨時區一致性
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const existingCheckIn = await prismaClient.practice_checkins.findFirst({
      where: {
        practice_id: practiceId,
        user_id: userId,
        checkin_date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingCheckIn) {
      throw new ConflictError('今日已完成簽到');
    }

    // 計算新的累積進度 (從所有 check-ins 累加)
    const previousCheckIns = await prismaClient.practice_checkins.aggregate({
      where: {
        practice_id: practiceId,
        user_id: userId
      },
      _sum: {
        progress_amount: true
      }
    });
    const newCumulativeProgress = Number(previousCheckIns._sum.progress_amount || 0) + data.progressAmount;

    // 計算連續簽到天數
    const streakInfo = await calculateStreak(practiceId, userId, today);

    // 建立簽到記錄
    const checkIn = await prismaClient.practice_checkins.create({
      data: {
        practice_id: practiceId,
        user_id: userId,
        checkin_date: today,
        progress_amount: data.progressAmount,
        note: data.note,
        mood: data.mood,
        reflection_text: data.reflectionText,
        // Note: related_resource_id and streak_day fields don't exist in schema
        cumulative_progress: newCumulativeProgress
      },
      include: {
        practices: {
          select: {
            title: true
          }
        }
      }
    });

    // Note: Practice progress tracking fields don't exist in schema
    // Progress and streak would need to be calculated from check-ins when needed

    const checkInEntity: CheckInEntity = {
      id: checkIn.id,
      practiceId: checkIn.practice_id,
      userId: checkIn.user_id,
      checkInDate: checkIn.checkin_date.toISOString().split('T')[0],
      progressAmount: Number(checkIn.progress_amount),
      unit: undefined, // Field doesn't exist in DB
      note: checkIn.note || undefined,
      mood: checkIn.mood as CheckInMood,
      reflectionText: checkIn.reflection_text || undefined,
      relatedResourceId: undefined, // Field doesn't exist in DB
      streakDay: streakInfo.newStreak, // Calculated, not from DB
      cumulativeProgress: Number(checkIn.cumulative_progress),
      createdAt: checkIn.created_at?.toISOString() || '',
      updatedAt: checkIn.updated_at?.toISOString()
    };

    loggerService.info('Check-in created', {
      practiceId,
      userId,
      progressAmount: data.progressAmount,
      streak: streakInfo.newStreak
    });

    return createSuccessResponse(checkInEntity);

  } catch (error) {
    loggerService.error('Failed to create check-in', { practiceId, userId, error });
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

    const checkInEntities: CheckInEntity[] = checkIns.map(checkIn => ({
      id: checkIn.id,
      practiceId: checkIn.practice_id,
      userId: checkIn.user_id,
      checkInDate: checkIn.checkin_date.toISOString().split('T')[0],
      progressAmount: Number(checkIn.progress_amount),
      unit: undefined, // Field doesn't exist in DB
      note: checkIn.note || undefined,
      mood: checkIn.mood as CheckInMood,
      reflectionText: checkIn.reflection_text || undefined,
      relatedResourceId: undefined, // Field doesn't exist in DB
      streakDay: 1, // Field doesn't exist in DB - would need calculation
      cumulativeProgress: Number(checkIn.cumulative_progress),
      createdAt: checkIn.created_at?.toISOString() || '',
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
    throw new Error('取得簽到記錄失敗');
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
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);

    // 檢查是否與昨天連續
    const yesterdayCheckIn = recentCheckIns.find(checkIn => 
      checkIn.checkin_date.toDateString() === yesterday.toDateString()
    );

    if (yesterdayCheckIn) {
      // 從昨天開始往前計算連續天數
      const checkDate = new Date(yesterday);
      
      for (const checkIn of recentCheckIns) {
        if (checkIn.checkin_date.toDateString() === checkDate.toDateString()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
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
    lastCheckInDate: Date;
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
    throw new Error('更新實踐失敗');
  }
}

/**
 * 驗證每日簽到限制
 */
export async function validateDailyCheckIn(practiceId: number, userId: number): Promise<boolean> {
  try {
    // 使用 UTC 時間確保跨時區一致性
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingCheckIn = await prismaClient.practice_checkins.findFirst({
      where: {
        practice_id: practiceId,
        user_id: userId,
        checkin_date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    return !existingCheckIn;

  } catch (error) {
    loggerService.error('Failed to validate daily check-in', { practiceId, userId, error });
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
  averageProgress: number;
  lastCheckInDate?: string;
}> {
  try {
    const checkInStats = await prismaClient.practice_checkins.aggregate({
      where: {
        practice_id: practiceId,
        user_id: userId
      },
      _count: { id: true },
      _avg: { progress_amount: true },
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
      averageProgress: Number(checkInStats._avg.progress_amount) || 0,
      lastCheckInDate: checkInStats._max.checkin_date?.toISOString().split('T')[0]
    };

  } catch (error) {
    loggerService.error('Failed to get check-in stats', { practiceId, userId, error });
    throw new Error('取得簽到統計失敗');
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
    throw new Error('取得月度簽到日曆失敗');
  }
}