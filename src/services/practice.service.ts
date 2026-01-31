/**
 * Practice 核心服務
 * 
 * 提供 Practice 相關的業務邏輯實作，包含 CRUD 操作、查詢、統計等功能
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/error.middleware';
import {
  PracticeEntity,
  PracticeStats,
  CreatePracticeRequest,
  UpdatePracticeRequest,
  PracticeQueryParams,
  PracticeStatus,
  PracticeResourceEntity
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
import {
  INITIAL_PROGRESS
} from '../utils/practice-progress';
import {
  determineNewStatus,
  canEdit,
  type PracticeStatusType
} from '../utils/practice-status';
import {
  validateUpdateFields
} from '../validators/practice-business.validators';
import { enqueuePracticeEmail } from '../queues';

const prismaClient = prisma;

// 主題色循環順序
const THEME_COLORS = ['#FCDD84', '#C3EEFF', '#FFC0C8', '#A0E8D0'] as const;

/**
 * 取得實踐列表（支援篩選、分頁、搜尋）
 */
export async function findAll(params: PracticeQueryParams): Promise<PaginatedApiResponse<PracticeEntity>> {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      contentType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId
    } = params;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // 限制最大數量

    // 建構查詢條件
    // 預設排除 archived 狀態，除非明確指定 status=archived
    const where: Prisma.practicesWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { practice_action: { contains: search, mode: 'insensitive' } }
        ]
      }),
      // status 過濾邏輯：
      // - 'archived': 只顯示 archived（需明確指定）
      // - 其他具體狀態: 只顯示該狀態
      // - 'all' 或無指定: 排除 archived
      ...(status === 'archived'
        ? { status: 'archived' }
        : status && status !== 'all'
          ? { status }
          : { status: { not: 'archived' } }),
      ...(userId && { user_id: userId }),
      // 排除已刪除的實踐（deleted_at 不為 null 表示已刪除）
      deleted_at: null
    };

    // 建構排序條件
    const orderBy: Prisma.practicesOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') {
      orderBy.created_at = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updated_at = sortOrder;
    }

    // 執行查詢
    const [practices, total] = await Promise.all([
      prismaClient.practices.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          users: {
            select: {
              id: true,
              external_id: true,
              nickname: true,
              contacts: {
                select: {
                  photo_url: true
                }
              },
              user_positions: {
                select: {
                  position: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prismaClient.practices.count({ where })
    ]);

    // 取得統計數據 - 暫時只查詢存在的表格
    const practiceIds: number[] = practices.map(p => p.id);
    const [comments, allTags, checkInCounts, lastCheckInDates, allResources] = await Promise.all([
      getCommentCounts(practiceIds),
      // 批量查詢標籤
      prismaClient.entity_tags.findMany({
        where: {
          entity_type: 'practice',
          entity_id: { in: practiceIds }
        },
        include: {
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      // 批量查詢打卡次數
      getCheckInCounts(practiceIds),
      // 批量查詢最後打卡時間
      getLastCheckInDates(practiceIds),
      // 批量查詢資源
      prismaClient.entity_resources.findMany({
        where: {
          entity_type: 'practice',
          entity_id: { in: practiceIds },
          deleted_at: null
        },
        include: {
          resources: {
            select: {
              id: true,
              external_id: true,
              name: true,
              url: true
            }
          }
        }
      })
    ]);

    // 將標籤按實踐 ID 分組
    const tagsByPracticeId = allTags.reduce((acc, tag) => {
      if (!acc[tag.entity_id]) {
        acc[tag.entity_id] = [];
      }
      acc[tag.entity_id].push({
        id: tag.tags.id,
        name: tag.tags.name
      });
      return acc;
    }, {} as Record<number, Array<{ id: number; name: string }>>);

    // 將資源按實踐 ID 分組
    const resourcesByPracticeId = allResources.reduce((acc, er) => {
      if (!acc[er.entity_id]) {
        acc[er.entity_id] = [];
      }
      acc[er.entity_id].push({
        id: er.resources.external_id || String(er.resources.id),
        name: er.resources.name,
        url: er.resources.url || undefined
      });
      return acc;
    }, {} as Record<number, PracticeResourceEntity[]>);


    // 轉換為 API 格式 - 基於 Prisma schema practices 表
    const practiceEntities: PracticeEntity[] = practices.map(practice => ({
      id: practice.external_id || '',
      title: practice.title,
      practiceAction: practice.practice_action || undefined,
      startDate: practice.start_date?.toISOString().split('T')[0],
      endDate: practice.end_date?.toISOString().split('T')[0],
      durationDays: practice.duration_days || undefined,
      frequencyMinDays: practice.frequency_min_days || undefined,
      frequencyMaxDays: practice.frequency_max_days || undefined,
            sessionDurationMinutes: practice.session_duration_minutes || undefined,
      practiceTimePeriods: practice.practice_time_periods || [],
      otherContext: practice.other_context || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      resources: resourcesByPracticeId[practice.id] || undefined,
      progressPercentage: practice.progress_percentage ? Number(practice.progress_percentage) : INITIAL_PROGRESS,
      firstCheckinAt: practice.first_checkin_at?.toISOString(),
      lastCheckinAt: lastCheckInDates[practice.id]?.toISOString(),
      checkInCount: checkInCounts[practice.id] || 0,
      themeColor: practice.theme_color || undefined,
      createdAt: practice.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.external_id || '',
        name: practice.users.nickname || 'Unknown User',
        photoURL: practice.users.contacts?.photo_url || null,
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || []
      },
      tags: tagsByPracticeId[practice.id]?.map(tag => tag.name) || [],
      stats: {
        likeCount: 0, // TODO: 待實作 reaction 表格
        viewCount: 0, // TODO: 待實作 view 表格
        favoriteCount: 0, // TODO: 待實作 favorite 表格
        shareCount: 0, // TODO: 待實作 share 表格
        commentCount: comments[practice.id] || 0
      }
    }));

    const paginationInfo = calculatePagination(page, take, total);

    loggerService.info('Practice list retrieved', {
      count: practiceEntities.length,
      total,
      page,
      filters: { search, contentType, status, userId }
    });

    return createPaginatedResponse(
      practiceEntities,
      paginationInfo,
      {
        searchQuery: search,
        filters: { contentType, status, userId },
        searchTime: Date.now() - Date.now()
      }
    );

  } catch (error) {
    loggerService.error('Failed to retrieve practice list', error as Record<string, unknown>);
    throw error;
  }
}

/**
 * 取得單一實踐詳情
 */
export async function findById(id: number, userId?: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  try {
    const practice = await prismaClient.practices.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            external_id: true,
            nickname: true,
            contacts: {
              select: {
                photo_url: true
              }
            },
            user_positions: {
              select: {
                position: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // 驗證：存在性（含軟刪除）
    if (!practice || practice.deleted_at !== null) {
      throw new NotFoundError('實踐不存在');
    }

    // 記錄瀏覽事件（暫時只記錄日誌）
    if (userId) {
      loggerService.info('Practice view recorded', { practiceId: id, userId });
    }

    // 取得統計數據、標籤和資源 - 暫時只查詢存在的表格
    const [comments, tags, checkInCounts, lastCheckInDates, entityResources] = await Promise.all([
      getCommentCounts([id]),
      // 查詢標籤
      prismaClient.entity_tags.findMany({
        where: {
          entity_type: 'practice',
          entity_id: id
        },
        include: {
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      // 查詢打卡次數
      getCheckInCounts([id]),
      // 查詢最後打卡時間
      getLastCheckInDates([id]),
      // 查詢資源
      prismaClient.entity_resources.findMany({
        where: {
          entity_type: 'practice',
          entity_id: id,
          deleted_at: null
        },
        include: {
          resources: {
            select: {
              id: true,
              external_id: true,
              name: true,
              url: true
            }
          }
        }
      })
    ]);

    // 轉換資源為 API 格式
    const resources: PracticeResourceEntity[] = entityResources.map(er => ({
      id: er.resources.external_id || String(er.resources.id),
      name: er.resources.name,
      url: er.resources.url || undefined
    }));

    const practiceEntity: PracticeEntity = {
      id: practice.external_id || '',
      title: practice.title,
      practiceAction: practice.practice_action || undefined,
      startDate: practice.start_date?.toISOString().split('T')[0],
      endDate: practice.end_date?.toISOString().split('T')[0],
      durationDays: practice.duration_days || undefined,
      frequencyMinDays: practice.frequency_min_days || undefined,
      frequencyMaxDays: practice.frequency_max_days || undefined,
            sessionDurationMinutes: practice.session_duration_minutes || undefined,
      practiceTimePeriods: practice.practice_time_periods || [],
      otherContext: practice.other_context || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      resources: resources.length > 0 ? resources : undefined,
      progressPercentage: practice.progress_percentage ? Number(practice.progress_percentage) : INITIAL_PROGRESS,
      firstCheckinAt: practice.first_checkin_at?.toISOString(),
      lastCheckinAt: lastCheckInDates[id]?.toISOString(),
      checkInCount: checkInCounts[id] || 0,
      themeColor: practice.theme_color || undefined,
      createdAt: practice.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.external_id || '',
        name: practice.users.nickname || 'Unknown User',
        photoURL: practice.users.contacts?.photo_url || null,
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || []
      },
      tags: tags.map(tag => tag.tags.name),
      stats: {
        likeCount: 0, // TODO: 待實作 reaction 表格
        viewCount: 0, // TODO: 待實作 view 表格
        favoriteCount: 0, // TODO: 待實作 favorite 表格
        shareCount: 0, // TODO: 待實作 share 表格
        commentCount: comments[id] || 0
      }
    };

    loggerService.info('Practice detail retrieved', { practiceId: id, userId, resourceCount: resources.length });

    return createSuccessResponse(practiceEntity);

  } catch (error) {
    loggerService.error('Failed to retrieve practice detail', { practiceId: id, error });
    throw error;
  }
}

/**
 * 建立實踐（包含資源關聯）
 *
 * 變更：
 * - 設定初始進度 progress_percentage: 20
 * - 設定初始狀態 status: 'draft' 或 'not_started'（依據 isDraft 參數）
 */
export async function create(data: CreatePracticeRequest, userId: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  try {
    // 計算結束日期
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const durationDays = data.durationDays || 14;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);

    // 查詢用戶最後一個實踐的顏色，用於分配下一個主題色
    const lastPractice = await prismaClient.practices.findFirst({
      where: { user_id: userId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      select: { theme_color: true }
    });

    // 根據最後一個實踐的顏色，選擇下一個顏色
    const lastColorIndex = lastPractice?.theme_color
      ? THEME_COLORS.indexOf(lastPractice.theme_color as typeof THEME_COLORS[number])
      : -1;
    const themeColor = THEME_COLORS[(lastColorIndex + 1) % THEME_COLORS.length];

    loggerService.info('Theme color assigned for new practice', {
      userId,
      lastPracticeColor: lastPractice?.theme_color || 'none',
      lastColorIndex,
      assignedColor: themeColor
    });

    // 根據 isDraft 決定初始狀態
    const initialStatus = data.isDraft ? 'draft' : 'not_started';

    const practice = await prismaClient.practices.create({
      data: {
        user_id: userId,
        title: data.title,
        practice_action: data.practiceAction,
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        frequency_min_days: data.frequencyMinDays,
        frequency_max_days: data.frequencyMaxDays,
        session_duration_minutes: data.sessionDurationMinutes,
        practice_time_periods: data.practiceTimePeriods || [],
        other_context: data.otherContext,
        status: initialStatus,
        has_resources: Boolean(data.resources && data.resources.length > 0),
        progress_percentage: INITIAL_PROGRESS,
        theme_color: themeColor
      },
      select: {
        id: true,
        external_id: true,
        title: true,
        practice_action: true,
        start_date: true,
        end_date: true,
        duration_days: true,
        frequency_min_days: true,
        frequency_max_days: true,
        session_duration_minutes: true,
        practice_time_periods: true,
        other_context: true,
        status: true,
        has_resources: true,
        progress_percentage: true,
        first_checkin_at: true,
        theme_color: true,
        created_at: true,
        updated_at: true,
        users: {
          select: {
            id: true,
            external_id: true,
            nickname: true,
            contacts: {
              select: {
                photo_url: true
              }
            },
            user_positions: {
              select: {
                position: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // 處理標籤關聯（如果有提供）
    if (data.tags && data.tags.length > 0) {
      await linkTags(practice.id, data.tags);
    }

    // 處理資源關聯（如果有提供）
    if (data.resources && data.resources.length > 0) {
      await linkResources(practice.id, data.resources, userId);
    }


    const practiceEntity: PracticeEntity = {
      id: practice.external_id || '',
      title: practice.title,
      practiceAction: practice.practice_action || undefined,
      startDate: practice.start_date?.toISOString().split('T')[0],
      endDate: practice.end_date?.toISOString().split('T')[0],
      durationDays: practice.duration_days || undefined,
      frequencyMinDays: practice.frequency_min_days || undefined,
      frequencyMaxDays: practice.frequency_max_days || undefined,
            sessionDurationMinutes: practice.session_duration_minutes || undefined,
      practiceTimePeriods: practice.practice_time_periods || [],
      otherContext: practice.other_context || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      progressPercentage: practice.progress_percentage ? Number(practice.progress_percentage) : INITIAL_PROGRESS,
      firstCheckinAt: practice.first_checkin_at?.toISOString(),
      lastCheckinAt: undefined,
      checkInCount: 0,
      themeColor: practice.theme_color || undefined,
      createdAt: practice.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.external_id || '',
        name: practice.users.nickname || 'Unknown User',
        photoURL: practice.users.contacts?.photo_url || null,
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || []
      },
      tags: data.tags || [],
      stats: {
        likeCount: 0,
        viewCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        commentCount: 0
      }
    };

    loggerService.info('Practice created', { practiceId: practice.id, userId });

    // 觸發 PE01 實踐建立郵件（非阻塞）
    enqueuePracticeEmail('PE01', practice.id, userId).catch(err => {
      loggerService.error('Failed to enqueue PE01 email', { practiceId: practice.id, error: err });
    });

    return createSuccessResponse(practiceEntity);

  } catch (error) {
    loggerService.error('Failed to create practice', { userId, error });
    throw error;
  }
}

/**
 * 更新實踐
 *
 * 變更：
 * - 檢查是否有打卡記錄
 * - 有打卡時鎖定：startDate, frequencyMinDays, frequencyMaxDays, durationDays
 * - 檢查狀態是否允許編輯
 */
export async function update(id: number, data: UpdatePracticeRequest, userId: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  try {
    // 檢查權限
    const existingPractice = await prismaClient.practices.findUnique({
      where: { id }
    });

    // 驗證順序：1. 存在性（含軟刪除）→ 2. 權限 → 3. 業務邏輯
    if (!existingPractice || existingPractice.deleted_at !== null) {
      throw new NotFoundError('實踐不存在');
    }

    if (existingPractice.user_id !== userId) {
      throw new ForbiddenError('沒有權限修改此實踐');
    }

    // 檢查狀態是否允許編輯
    if (!canEdit(existingPractice.status as PracticeStatusType)) {
      throw new BadRequestError('此實踐狀態不允許編輯');
    }

    // 檢查是否有打卡記錄
    const checkInCount = await prismaClient.practice_checkins.count({
      where: { practice_id: id }
    });
    const hasCheckIns = checkInCount > 0;

    // 驗證更新欄位是否允許（有打卡後部分欄位不可修改）
    const updateFields = Object.keys(data);
    const validation = validateUpdateFields(updateFields, hasCheckIns);
    if (!validation.isValid) {
      throw new BadRequestError(validation.errorMessage || '無法修改已鎖定的欄位');
    }

    const updateData: Prisma.practicesUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.practiceAction !== undefined) updateData.practice_action = data.practiceAction;
    if (data.otherContext !== undefined) updateData.other_context = data.otherContext;
    if (data.status !== undefined) updateData.status = data.status;

    // 處理頻率相關欄位
    if (data.frequencyMinDays !== undefined) updateData.frequency_min_days = data.frequencyMinDays;
    if (data.frequencyMaxDays !== undefined) updateData.frequency_max_days = data.frequencyMaxDays;
    if (data.sessionDurationMinutes !== undefined) updateData.session_duration_minutes = data.sessionDurationMinutes;
    if (data.practiceTimePeriods !== undefined) updateData.practice_time_periods = data.practiceTimePeriods;

    // 處理日期相關欄位（需要重新計算 end_date）
    if (data.startDate !== undefined || data.durationDays !== undefined) {
      const newStartDate = data.startDate
        ? new Date(data.startDate)
        : existingPractice.start_date;
      const newDurationDays = data.durationDays ?? existingPractice.duration_days ?? 14;

      if (data.startDate !== undefined) {
        updateData.start_date = newStartDate;
      }
      if (data.durationDays !== undefined) {
        updateData.duration_days = newDurationDays;
      }

      // 重新計算 end_date
      if (newStartDate) {
        const endDate = new Date(newStartDate);
        endDate.setDate(endDate.getDate() + newDurationDays - 1);
        updateData.end_date = endDate;
      }
    }

    updateData.updated_at = new Date();

    const practice = await prismaClient.practices.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            external_id: true,
            nickname: true,
            contacts: {
              select: {
                photo_url: true
              }
            },
            user_positions: {
              select: {
                position: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // 處理標籤更新（如果有提供）
    if (data.tags !== undefined) {
      await updateTags(id, data.tags);
    }

    // 處理資源更新（如果有提供）
    if (data.resources !== undefined) {
      await updateResources(id, data.resources, userId);
      await prismaClient.practices.update({
        where: { id },
        data: { has_resources: data.resources.length > 0 }
      });
    }

    // 取得統計數據和標籤 - 暫時只查詢存在的表格
    const [comments, updatedTags, checkInCounts, lastCheckInDates] = await Promise.all([
      getCommentCounts([id]),
      // 查詢更新後的標籤
      prismaClient.entity_tags.findMany({
        where: {
          entity_type: 'practice',
          entity_id: id
        },
        include: {
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      // 查詢打卡次數
      getCheckInCounts([id]),
      // 查詢最後打卡時間
      getLastCheckInDates([id])
    ]);


    const practiceEntity: PracticeEntity = {
      id: practice.external_id || '',
      title: practice.title,
      practiceAction: practice.practice_action || undefined,
      startDate: practice.start_date?.toISOString().split('T')[0],
      endDate: practice.end_date?.toISOString().split('T')[0],
      durationDays: practice.duration_days || undefined,
      frequencyMinDays: practice.frequency_min_days || undefined,
      frequencyMaxDays: practice.frequency_max_days || undefined,
            sessionDurationMinutes: practice.session_duration_minutes || undefined,
      practiceTimePeriods: practice.practice_time_periods || [],
      otherContext: practice.other_context || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      progressPercentage: practice.progress_percentage ? Number(practice.progress_percentage) : INITIAL_PROGRESS,
      firstCheckinAt: practice.first_checkin_at?.toISOString(),
      lastCheckinAt: lastCheckInDates[id]?.toISOString(),
      checkInCount: checkInCounts[id] || 0,
      themeColor: practice.theme_color || undefined,
      createdAt: practice.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.external_id || '',
        name: practice.users.nickname || 'Unknown User',
        photoURL: practice.users.contacts?.photo_url || null,
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || []
      },
      tags: updatedTags.map(tag => tag.tags.name),
      stats: {
        likeCount: 0, // TODO: 待實作 reaction 表格
        viewCount: 0, // TODO: 待實作 view 表格
        favoriteCount: 0, // TODO: 待實作 favorite 表格
        shareCount: 0, // TODO: 待實作 share 表格
        commentCount: comments[id] || 0
      }
    };

    loggerService.info('Practice updated', { practiceId: id, userId });

    return createSuccessResponse(practiceEntity);

  } catch (error) {
    loggerService.error('Failed to update practice', { practiceId: id, userId, error });
    throw error;
  }
}

/**
 * 軟刪除實踐
 */
export async function deleteFunction(id: number, userId: number): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    const practice = await prismaClient.practices.findUnique({
      where: { id }
    });

    // 驗證順序：1. 存在性（含軟刪除）→ 2. 權限
    if (!practice || practice.deleted_at !== null) {
      throw new NotFoundError('實踐不存在');
    }

    if (practice.user_id !== userId) {
      throw new ForbiddenError('沒有權限刪除此實踐');
    }

    // 軟刪除：設置 deleted_at 時間戳（與封存區分）
    await prismaClient.practices.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date()
      }
    });

    loggerService.info('Practice deleted', { practiceId: id, userId });

    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to delete practice', { practiceId: id, userId, error });
    throw error;
  }
}

/**
 * 取得使用者的實踐列表
 */
export async function findUserPractices(userId: number, params: PracticeQueryParams): Promise<PaginatedApiResponse<PracticeEntity>> {
  return findAll({ ...params, userId });
}

/**
 * 取得使用者實踐統計
 */
export async function getUserStats(userId: number): Promise<ApiSuccessResponse<PracticeStats>> {
  try {
    const [practiceStats, checkInStats] = await Promise.all([
      prismaClient.practices.aggregate({
        where: {
          user_id: userId,
          status: { not: 'archived' }
        },
        _count: {
          id: true
        }
        // Note: streak and max_streak fields don't exist in schema
      }),
      prismaClient.practice_checkins.aggregate({
        where: {
          user_id: userId,
          practices: {
            status: { not: 'archived' }
          }
        },
        _count: {
          id: true
        }
      })
    ]);

    const statusCounts = await prismaClient.practices.groupBy({
      by: ['status'],
      where: {
        user_id: userId,
        status: { not: 'archived' }
      },
      _count: {
        id: true
      }
    });

    const stats: PracticeStats = {
      totalPractices: practiceStats._count?.id || 0,
      activePractices: statusCounts.find(s => s.status === 'active')?._count.id || 0,
      completedPractices: statusCounts.find(s => s.status === 'completed')?._count.id || 0,
      totalCheckIns: checkInStats._count.id,
      averageStreak: 0, // Field doesn't exist in DB - would need to calculate from check-ins
      maxStreak: 0 // Field doesn't exist in DB - would need to calculate from check-ins
    };

    loggerService.info('User practice stats retrieved', { userId, stats });

    return createSuccessResponse(stats);

  } catch (error) {
    loggerService.error('Failed to retrieve user practice stats', { userId, error });
    throw error;
  }
}

/**
 * 連結標籤
 */
async function linkTags(practiceId: number, tagNames: string[]): Promise<void> {
  if (!tagNames.length) return;

  try {
    // 取得或建立標籤
    const tags = await Promise.all(
      tagNames.map(name =>
        prismaClient.tags.upsert({
          where: { name },
          update: {},
          create: { name }
        })
      )
    );

    // 建立關聯
    await Promise.all(
      tags.map(tag =>
        prismaClient.entity_tags.upsert({
          where: {
            entity_type_entity_id_tag_id: {
              entity_type: 'practice',
              entity_id: practiceId,
              tag_id: tag.id
            }
          },
          update: {},
          create: {
            entity_type: 'practice',
            entity_id: practiceId,
            tag_id: tag.id
          }
        })
      )
    );
  } catch (error) {
    loggerService.warn('Failed to link tags', { practiceId, tagNames, error });
  }
}

/**
 * 連結資源
 * 創建資源記錄並建立 practice-resource 關聯
 */
async function linkResources(practiceId: number, resources: Array<{ name: string; url?: string }>, userId: number): Promise<void> {
  if (!resources.length) return;

  try {
    for (const resource of resources) {
      try {
        // 1. 創建資源記錄
        const createdResource = await prismaClient.resources.create({
          data: {
            name: resource.name,
            url: resource.url || '',
            description: '',
            type: 'other',
            cost: 'free',
            created_by: userId
          }
        });

        // 2. 建立 practice-resource 關聯
        await prismaClient.entity_resources.create({
          data: {
            resource_id: createdResource.id,
            entity_type: 'practice',
            entity_id: practiceId,
            created_by: userId
          }
        });
      } catch (error) {
        loggerService.warn('Failed to create resource', { practiceId, resource, error });
      }
    }

    loggerService.info('Resources linked to practice', {
      practiceId,
      resourceCount: resources.length
    });
  } catch (error) {
    loggerService.warn('Failed to link resources', { practiceId, resources, error });
  }
}

/**
 * 更新標籤
 */
async function updateTags(practiceId: number, tagNames: string[]): Promise<void> {
  try {
    // 刪除現有標籤關聯
    await prismaClient.entity_tags.deleteMany({
      where: {
        entity_type: 'practice',
        entity_id: practiceId
      }
    });

    // 建立新的標籤關聯
    if (tagNames.length > 0) {
      await linkTags(practiceId, tagNames);
    }
  } catch (error) {
    loggerService.warn('Failed to update tags', { practiceId, tagNames, error });
  }
}

/**
 * 更新資源
 * 軟刪除現有關聯並建立新的資源關聯
 */
async function updateResources(practiceId: number, resources: Array<{ name: string; url?: string }>, userId: number): Promise<void> {
  try {
    // 1. 取得現有的 practice-resource 關聯
    const existingRelations = await prismaClient.entity_resources.findMany({
      where: {
        entity_type: 'practice',
        entity_id: practiceId,
        deleted_at: null
      }
    });

    // 2. 軟刪除現有關聯（設置 deleted_at）
    if (existingRelations.length > 0) {
      await prismaClient.entity_resources.updateMany({
        where: {
          entity_type: 'practice',
          entity_id: practiceId,
          deleted_at: null
        },
        data: {
          deleted_at: new Date()
        }
      });
    }

    // 3. 建立新的資源和關聯
    if (resources.length > 0) {
      await linkResources(practiceId, resources, userId);
    }

    loggerService.info('Resources updated for practice', {
      practiceId,
      previousCount: existingRelations.length,
      newCount: resources.length
    });
  } catch (error) {
    loggerService.error('Failed to update resources', { practiceId, resources, error });
    throw error;
  }
}

/**
 * 取得評論統計
 */
async function getCommentCounts(practiceIds: number[]): Promise<Record<number, number>> {
  if (!practiceIds.length) return {};

  try {
    const comments = await prismaClient.comments.groupBy({
      by: ['target_id'],
      where: {
        target_type: 'practice',
        target_id: { in: practiceIds }
      },
      _count: { id: true }
    });

    return comments.reduce((acc, comment) => {
      acc[comment.target_id] = comment._count?.id || 0;
      return acc;
    }, {} as Record<number, number>);
  } catch (error) {
    loggerService.warn('Failed to get comment counts', { practiceIds, error });
    return {};
  }
}

/**
 * 取得打卡次數統計
 */
async function getCheckInCounts(practiceIds: number[]): Promise<Record<number, number>> {
  if (!practiceIds.length) return {};

  try {
    const checkIns = await prismaClient.practice_checkins.groupBy({
      by: ['practice_id'],
      where: {
        practice_id: { in: practiceIds }
      },
      _count: { id: true }
    });

    return checkIns.reduce((acc, checkIn) => {
      acc[checkIn.practice_id] = checkIn._count?.id || 0;
      return acc;
    }, {} as Record<number, number>);
  } catch (error) {
    loggerService.warn('Failed to get check-in counts', { practiceIds, error });
    return {};
  }
}

/**
 * 取得最後打卡日期統計
 */
async function getLastCheckInDates(practiceIds: number[]): Promise<Record<number, Date | null>> {
  if (!practiceIds.length) return {};

  try {
    const checkIns = await prismaClient.practice_checkins.groupBy({
      by: ['practice_id'],
      where: {
        practice_id: { in: practiceIds }
      },
      _max: { checkin_date: true }
    });

    return checkIns.reduce((acc, checkIn) => {
      acc[checkIn.practice_id] = checkIn._max?.checkin_date || null;
      return acc;
    }, {} as Record<number, Date | null>);
  } catch (error) {
    loggerService.warn('Failed to get last check-in dates', { practiceIds, error });
    return {};
  }
}

/**
 * 封存實踐
 */
export async function archive(id: number, userId: number): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    const practice = await prismaClient.practices.findUnique({
      where: { id }
    });

    // 驗證順序：1. 存在性（含軟刪除）→ 2. 權限 → 3. 業務邏輯
    if (!practice || practice.deleted_at !== null) {
      throw new NotFoundError('實踐不存在');
    }

    if (practice.user_id !== userId) {
      throw new ForbiddenError('沒有權限封存此實踐');
    }

    if (practice.status === 'archived') {
      throw new BadRequestError('實踐已經是封存狀態');
    }

    // 保存封存前的狀態（如果需要取消封存時使用）
    const previousStatus = practice.status;

    await prismaClient.practices.update({
      where: { id },
      data: {
        status: 'archived',
        // 可選：存儲封存前狀態，以便取消封存時恢復
        // previous_status: previousStatus,
        updated_at: new Date()
      }
    });

    loggerService.info('Practice archived', { practiceId: id, userId, previousStatus });

    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to archive practice', { practiceId: id, userId, error });
    throw error;
  }
}

/**
 * 取消封存實踐
 */
export async function unarchive(id: number, userId: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  try {
    const practice = await prismaClient.practices.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            external_id: true,
            nickname: true,
            contacts: {
              select: {
                photo_url: true
              }
            },
            user_positions: {
              select: {
                position: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // 驗證順序：1. 存在性（含軟刪除）→ 2. 權限 → 3. 業務邏輯
    if (!practice || practice.deleted_at !== null) {
      throw new NotFoundError('實踐不存在');
    }

    if (practice.user_id !== userId) {
      throw new ForbiddenError('沒有權限取消封存此實踐');
    }

    if (practice.status !== 'archived') {
      throw new BadRequestError('實踐不是封存狀態');
    }

    // 檢查是否有打卡記錄，決定恢復到什麼狀態
    const checkInCount = await prismaClient.practice_checkins.count({
      where: { practice_id: id }
    });
    const hasCheckIns = checkInCount > 0;

    // 根據是否有打卡記錄決定恢復狀態
    const newStatus = determineNewStatus({
      currentStatus: 'archived',
      hasCheckIns,
      hasReachedTarget: false,
      isUnarchiving: true
    });

    const updatedPractice = await prismaClient.practices.update({
      where: { id },
      data: {
        status: newStatus,
        updated_at: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            external_id: true,
            nickname: true,
            contacts: {
              select: {
                photo_url: true
              }
            },
            user_positions: {
              select: {
                position: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // 取得統計數據和標籤
    const [comments, tags, lastCheckInDates] = await Promise.all([
      getCommentCounts([id]),
      prismaClient.entity_tags.findMany({
        where: {
          entity_type: 'practice',
          entity_id: id
        },
        include: {
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      getLastCheckInDates([id])
    ]);

    const practiceEntity: PracticeEntity = {
      id: updatedPractice.external_id || '',
      title: updatedPractice.title,
      practiceAction: updatedPractice.practice_action || undefined,
      startDate: updatedPractice.start_date?.toISOString().split('T')[0],
      endDate: updatedPractice.end_date?.toISOString().split('T')[0],
      durationDays: updatedPractice.duration_days || undefined,
      frequencyMinDays: updatedPractice.frequency_min_days || undefined,
      frequencyMaxDays: updatedPractice.frequency_max_days || undefined,
      sessionDurationMinutes: updatedPractice.session_duration_minutes || undefined,
      practiceTimePeriods: updatedPractice.practice_time_periods || [],
      otherContext: updatedPractice.other_context || undefined,
      status: updatedPractice.status as PracticeStatus || 'not_started',
      hasResources: updatedPractice.has_resources || false,
      progressPercentage: Number(updatedPractice.progress_percentage) || INITIAL_PROGRESS,
      firstCheckinAt: updatedPractice.first_checkin_at?.toISOString(),
      lastCheckinAt: lastCheckInDates[id]?.toISOString(),
      checkInCount: checkInCount,
      themeColor: updatedPractice.theme_color || undefined,
      createdAt: updatedPractice.created_at?.toISOString() || '',
      updatedAt: updatedPractice.updated_at?.toISOString(),
      user: {
        id: updatedPractice.users.external_id || '',
        name: updatedPractice.users.nickname || 'Unknown User',
        photoURL: updatedPractice.users.contacts?.photo_url || null,
        roleList: updatedPractice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || []
      },
      tags: tags.map(tag => tag.tags.name),
      stats: {
        likeCount: 0,
        viewCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        commentCount: comments[id] || 0
      }
    };

    loggerService.info('Practice unarchived', { practiceId: id, userId, newStatus });

    return createSuccessResponse(practiceEntity);

  } catch (error) {
    loggerService.error('Failed to unarchive practice', { practiceId: id, userId, error });
    throw error;
  }
}

