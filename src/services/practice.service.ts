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
import { encodeResourceDay, parseResourceDay } from '../utils/resource-day';
import {
  INITIAL_PROGRESS
} from '../utils/practice-progress';
import {
  determineNewStatus,
  canEdit,
  checkHasPassedEndDate,
  type PracticeStatusType
} from '../utils/practice-status';
import {
  stripLockedFields
} from '../validators/practice-business.validators';
import { enqueuePracticeEmail } from '../queues';
import { privacyService } from './privacy.service';
import { getViewCount } from './view-tracking.service';
import { notificationEventService } from './notification-event.service';
import { NOTIFICATION_TYPES } from '../constants/notification-type';

/** Cached dynamic import to avoid per-call overhead (breaks circular dep if imported statically) */
let _fanoutModule: Promise<typeof import('./social-notification-fanout.service')> | null = null;
function getFanoutModule() {
  if (!_fanoutModule) _fanoutModule = import('./social-notification-fanout.service');
  return _fanoutModule;
}

const prismaClient = prisma;

// 主題色循環順序
const THEME_COLORS = ['#FCDD84', '#C3EEFF', '#FFC0C8', '#A0E8D0'] as const;

async function notifyPracticeCreatedAudience(params: {
  actorId: number;
  practiceId: number;
  practiceTitle: string;
  privacyStatus?: string | null;
}): Promise<void> {
  const { actorId, practiceId, practiceTitle, privacyStatus } = params;

  // 只有 public practice 通知 followers / connected partners，避免 private / delayed 內容提早曝光
  if (privacyStatus !== 'public') {
    return;
  }

  const [followers, connections] = await Promise.all([
    prismaClient.follows.findMany({
      where: { target_type: 'user', target_id: actorId },
      select: { follower_id: true },
    }),
    prismaClient.connections.findMany({
      where: { OR: [{ user_a_id: actorId }, { user_b_id: actorId }] },
      select: { user_a_id: true, user_b_id: true },
    }),
  ]);

  const recipientIds = new Set<number>();
  for (const follower of followers) {
    if (follower.follower_id !== actorId) {
      recipientIds.add(follower.follower_id);
    }
  }
  for (const connection of connections) {
    const partnerId = connection.user_a_id === actorId ? connection.user_b_id : connection.user_a_id;
    if (partnerId !== actorId) {
      recipientIds.add(partnerId);
    }
  }

  await Promise.all([...recipientIds].map(recipientId =>
    notificationEventService.createEvent({
      type: NOTIFICATION_TYPES.PRACTICE_CREATED,
      actorId,
      recipientId,
      entityType: 'practice',
      entityId: practiceId,
      priority: 'P1',
      payload: { practice_title: practiceTitle },
    })
  ));
}

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
      userId,
      excludePrivate,
      excludeNonPublic,
      privacyStatus,
      includeArchived
    } = params;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // 限制最大數量

    // 建構查詢條件
    // 預設排除 archived 狀態，除非明確指定 status=archived
    const andConditions: Prisma.practicesWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { practice_action: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // 公開存取：排除 private，且排除未完成的 delayed（完成後才公開）
    if (excludeNonPublic) {
      andConditions.push({
        OR: [
          { privacy_status: 'public' },
          { privacy_status: 'delayed', status: 'completed' },
        ],
      });
    }

    const where: Prisma.practicesWhereInput = {
      ...(andConditions.length > 0 && { AND: andConditions }),
      // status 過濾邏輯：
      // - 'archived': 只顯示 archived（需明確指定）
      // - 其他具體狀態: 只顯示該狀態
      // - 'all' 或無指定: 排除 archived（admin 帶 includeArchived 時不排除）
      ...(status === 'archived'
        ? { status: 'archived' }
        : status && status !== 'all'
          ? { status }
          : includeArchived
            ? {}
            : { status: { not: 'archived' } }),
      ...(userId && { user_id: userId }),
      // 依隱私狀態篩選（admin 用；與 excludeNonPublic 互斥使用）
      ...(!excludeNonPublic && privacyStatus && privacyStatus !== 'all' && { privacy_status: privacyStatus }),
      // 向後相容：僅排除 private
      ...(!excludeNonPublic && !privacyStatus && excludePrivate && { privacy_status: { not: 'private' } }),
      // 排除已刪除的實踐（deleted_at 不為 null 表示已刪除）
      deleted_at: null
    };

    // 建構排序條件（其餘 sortBy 值 fallback 到 created_at，避免無排序造成分頁不穩定）
    const orderBy: Prisma.practicesOrderByWithRelationInput = {};
    if (sortBy === 'updatedAt') {
      orderBy.updated_at = sortOrder;
    } else {
      orderBy.created_at = sortOrder;
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
              custom_id: true,
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

    // 取得統計數據、標籤和資源
    const practiceIds: number[] = practices.map(p => p.id);
    const [comments, allTags, checkInCounts, lastCheckInDates, resourcesByPracticeId, viewCounts, reactionCounts] = await Promise.all([
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
      getPracticeResources(practiceIds),
      // 批量查詢瀏覽數
      getViewCounts(practiceIds),
      // 批量查詢迴響數
      getReactionCounts(practiceIds)
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
      privacyStatus: practice.privacy_status || 'public',
      hasResources: (resourcesByPracticeId[practice.id]?.length || 0) > 0,
      resources: resourcesByPracticeId[practice.id]?.length ? resourcesByPracticeId[practice.id] : undefined,
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
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || [],
        customId: practice.users.custom_id ?? null
      },
      tags: tagsByPracticeId[practice.id]?.map(tag => tag.name) || [],
      stats: {
        likeCount: reactionCounts[practice.id] || 0,
        viewCount: viewCounts[practice.id] || 0,
        favoriteCount: 0,
        shareCount: 0,
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
            custom_id: true,
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

    // 隱私控制：依 privacy_status 判斷存取權限
    const privacyStatus = practice.privacy_status ?? 'public';
    const isDelayedAndCompleted = privacyStatus === 'delayed' && practice.status === 'completed';
    if (privacyStatus !== 'public' && !isDelayedAndCompleted) {
      const canAccess = await privacyService.canAccessContent(
        userId ?? null,
        practice.user_id,
        privacyStatus,
      );
      if (!canAccess) {
        if (privacyStatus === 'private') {
          throw new ForbiddenError('此實踐為私人');
        }
        throw new ForbiddenError('此實踐尚未公開');
      }
    }

    // 記錄瀏覽事件（暫時只記錄日誌）
    if (userId) {
      loggerService.info('Practice view recorded', { practiceId: id, userId });
    }

    // 取得統計數據、標籤和資源
    const [comments, tags, checkInCounts, lastCheckInDates, resourcesMap, viewCount, reactionCounts] = await Promise.all([
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
      getPracticeResources([id]),
      // 查詢瀏覽數
      getViewCount('practice', id),
      // 查詢迴響數
      getReactionCounts([id])
    ]);

    const resources = resourcesMap[id] || [];

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
      privacyStatus: practice.privacy_status || 'public',
      hasResources: resources.length > 0,
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
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || [],
        customId: practice.users.custom_id ?? null
      },
      tags: tags.map(tag => tag.tags.name),
      stats: {
        likeCount: reactionCounts[id] || 0,
        viewCount,
        favoriteCount: 0,
        shareCount: 0,
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
 * - 支援 templateId 參數追蹤模版使用情況
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

    // 如果有 templateId，查詢模版的內部 ID
    let templateInternalId: number | null = null;
    if (data.templateId) {
      const template = await prismaClient.practice_templates.findFirst({
        where: {
          OR: [
            { external_id: data.templateId },
            { id: parseInt(data.templateId, 10) || -1 }
          ]
        },
        select: { id: true }
      });
      if (template) {
        templateInternalId = template.id;
      } else {
        loggerService.warn('Template not found for practice creation', {
          templateId: data.templateId,
          userId
        });
      }
    }

    const practice = await prismaClient.practices.create({
      data: {
        user_id: userId,
        template_id: templateInternalId,
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
        privacy_status: data.privacyStatus ?? 'public',
        theme_color: themeColor,
        creation_source: data.creationMethod ?? 'self_created'
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
        privacy_status: true,
        theme_color: true,
        created_at: true,
        updated_at: true,
        users: {
          select: {
            id: true,
            external_id: true,
            nickname: true,
            custom_id: true,
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
    let createdResources: PracticeResourceEntity[] = [];
    if (data.resources && data.resources.length > 0) {
      createdResources = await linkResources(practice.id, data.resources, userId);
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
      privacyStatus: practice.privacy_status || 'public',
      hasResources: practice.has_resources || false,
      resources: createdResources.length > 0 ? createdResources : undefined,
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
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || [],
        customId: practice.users.custom_id ?? null
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

    loggerService.info('Practice created', { practiceId: practice.id, userId, isDraft: data.isDraft, resourceCount: createdResources.length });

    // 只有非草稿才觸發 PE01 實踐建立郵件（非阻塞）
    if (!data.isDraft) {
      enqueuePracticeEmail('PE01', practice.id, userId).catch(err => {
        loggerService.error('Failed to enqueue PE01 email', { practiceId: practice.id, error: err });
      });

      // 通知關注此用戶的 followers 與 connected partners（非阻塞）
      notifyPracticeCreatedAudience({
        actorId: userId,
        practiceId: practice.id,
        practiceTitle: practice.title,
        privacyStatus: practice.privacy_status,
      }).catch(err => {
        loggerService.error('Failed to notify practice created audience', { practiceId: practice.id, error: err });
      });
    }

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
      throw new BadRequestError('此實踐已封存，請先取消封存再進行編輯');
    }

    // 檢查是否有打卡記錄
    const checkInCount = await prismaClient.practice_checkins.count({
      where: { practice_id: id }
    });
    const hasCheckIns = checkInCount > 0;

    // 有打卡記錄時，自動移除鎖定欄位，允許其餘欄位正常更新
    data = stripLockedFields(data, hasCheckIns);

    // 檢查移除鎖定欄位後是否還有可更新的欄位
    const updateFields = Object.keys(data);
    if (updateFields.length === 0) {
      throw new BadRequestError('沒有可更新的欄位（計算相關欄位在有打卡記錄後不可修改）');
    }

    const updateData: Prisma.practicesUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.practiceAction !== undefined) updateData.practice_action = data.practiceAction;
    if (data.otherContext !== undefined) updateData.other_context = data.otherContext;

    // 處理 isDraft 欄位：優先於 status
    if (data.isDraft !== undefined) {
      updateData.status = data.isDraft ? 'draft' : 'not_started';
    } else if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.privacyStatus !== undefined) updateData.privacy_status = data.privacyStatus;

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
            custom_id: true,
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

    // 取得統計數據、標籤和資源
    const [comments, updatedTags, checkInCounts, lastCheckInDates, resourcesMap, viewCount, reactionCounts] = await Promise.all([
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
      getLastCheckInDates([id]),
      // 查詢資源
      getPracticeResources([id]),
      // 查詢瀏覽數
      getViewCount('practice', id),
      // 查詢迴響數
      getReactionCounts([id])
    ]);

    const resources = resourcesMap[id] || [];

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
      privacyStatus: practice.privacy_status || 'public',
      hasResources: resources.length > 0,
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
        roleList: practice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || [],
        customId: practice.users.custom_id ?? null
      },
      tags: updatedTags.map(tag => tag.tags.name),
      stats: {
        likeCount: reactionCounts[id] || 0,
        viewCount: viewCount,
        favoriteCount: 0,
        shareCount: 0,
        commentCount: comments[id] || 0
      }
    };

    loggerService.info('Practice updated', { practiceId: id, userId });

    // 草稿發布時觸發 PE01 實踐建立郵件（非阻塞）
    // 支援 isDraft=false 或 status='not_started' 來發布草稿
    const isPublishingDraft = existingPractice.status === 'draft' &&
      (data.isDraft === false || data.status === 'not_started');
    if (isPublishingDraft) {
      enqueuePracticeEmail('PE01', id, userId).catch(err => {
        loggerService.error('Failed to enqueue PE01 email for published draft', { practiceId: id, error: err });
      });

      // 通知關注此用戶的 followers 與 connected partners（非阻塞）
      notifyPracticeCreatedAudience({
        actorId: userId,
        practiceId: id,
        practiceTitle: practice.title,
        privacyStatus: practice.privacy_status,
      }).catch(err => {
        loggerService.error('Failed to notify published practice audience', { practiceId: id, error: err });
      });
    }

    // Fire-and-forget: fan-out 更新通知給追蹤者和連結夥伴
    // 草稿發布已送 PracticeCreated；private / delayed 不通知以避免曝光非公開內容
    if (!isPublishingDraft && practice.privacy_status === 'public') {
      const updatePayload = { practiceId: id };
      getFanoutModule().then(({ fanoutToPracticeFollowers, fanoutToConnectedPartners }) => {
        fanoutToPracticeFollowers('follow.practice_update', userId, id, updatePayload).catch(() => {});
        fanoutToConnectedPartners('connect.partner_update', userId, updatePayload).catch(() => {});
      }).catch(() => {});
    }

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
 * @param viewerIsOwner 觀看者是否為該使用者本人；非本人時排除 private 及未完成的 delayed
 */
export async function findUserPractices(userId: number, params: PracticeQueryParams, viewerIsOwner = true): Promise<PaginatedApiResponse<PracticeEntity>> {
  return findAll({ ...params, userId, excludeNonPublic: !viewerIsOwner });
}

/**
 * Admin 直接更新實踐狀態（不受擁有者與可編輯狀態限制）
 */
export async function adminUpdateStatus(
  id: number,
  status: PracticeStatus
): Promise<ApiSuccessResponse<{ id: string; status: PracticeStatus; privacyStatus: string; updatedAt?: string }>> {
  const existing = await prismaClient.practices.findFirst({
    where: { id, deleted_at: null },
    select: { id: true }
  });

  if (!existing) {
    throw new NotFoundError('實踐不存在');
  }

  const updated = await prismaClient.practices.update({
    where: { id },
    data: { status, updated_at: new Date() }
  });

  loggerService.info('Admin updated practice status', { practiceId: id, status });

  return createSuccessResponse({
    id: updated.external_id || '',
    status: updated.status as PracticeStatus,
    privacyStatus: updated.privacy_status || 'public',
    updatedAt: updated.updated_at?.toISOString()
  });
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
 * @returns 建立的資源列表（包含 external_id）
 */
async function linkResources(practiceId: number, resources: Array<{ name: string; url?: string; dayNumber?: number | null }>, userId: number): Promise<PracticeResourceEntity[]> {
  if (!resources.length) return [];

  const createdResources: PracticeResourceEntity[] = [];

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

        // 2. 建立 practice-resource 關聯（note 承載「第幾天使用」）
        await prismaClient.entity_resources.create({
          data: {
            resource_id: createdResource.id,
            entity_type: 'practice',
            entity_id: practiceId,
            created_by: userId,
            note: encodeResourceDay(resource.dayNumber)
          }
        });

        // 3. 收集建立的資源
        createdResources.push({
          id: createdResource.external_id || String(createdResource.id),
          name: createdResource.name,
          url: createdResource.url || undefined,
          dayNumber: resource.dayNumber ?? null
        });
      } catch (error) {
        loggerService.warn('Failed to create resource', { practiceId, resource, error });
      }
    }

    loggerService.info('Resources linked to practice', {
      practiceId,
      resourceCount: createdResources.length
    });
  } catch (error) {
    loggerService.warn('Failed to link resources', { practiceId, resources, error });
  }

  return createdResources;
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
async function updateResources(practiceId: number, resources: Array<{ name: string; url?: string; dayNumber?: number | null }>, userId: number): Promise<void> {
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

async function getViewCounts(practiceIds: number[]): Promise<Record<number, number>> {
  if (!practiceIds.length) return {};
  try {
    const rows = await prismaClient.entity_stats.findMany({
      where: { entity_type: 'practice', entity_id: { in: practiceIds } },
      select: { entity_id: true, view_count: true }
    });
    return rows.reduce((acc, row) => {
      acc[row.entity_id] = row.view_count;
      return acc;
    }, {} as Record<number, number>);
  } catch (error) {
    loggerService.warn('Failed to get view counts', { practiceIds, error });
    return {};
  }
}

async function getReactionCounts(practiceIds: number[]): Promise<Record<number, number>> {
  if (!practiceIds.length) return {};
  try {
    const rows = await prismaClient.reactions.groupBy({
      by: ['target_id'],
      where: { target_type: 'practice', target_id: { in: practiceIds } },
      _count: { id: true }
    });
    return rows.reduce((acc, row) => {
      acc[row.target_id] = row._count?.id || 0;
      return acc;
    }, {} as Record<number, number>);
  } catch (error) {
    loggerService.warn('Failed to get reaction counts', { practiceIds, error });
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
 * 批次取得實踐的資源列表
 * @param practiceIds 實踐 ID 陣列
 * @returns 以實踐 ID 為 key 的資源列表 Record
 */
async function getPracticeResources(practiceIds: number[]): Promise<Record<number, PracticeResourceEntity[]>> {
  if (!practiceIds.length) return {};

  try {
    const entityResources = await prismaClient.entity_resources.findMany({
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
    });

    return entityResources.reduce((acc, er) => {
      if (!acc[er.entity_id]) {
        acc[er.entity_id] = [];
      }
      acc[er.entity_id].push({
        id: er.resources.external_id || String(er.resources.id),
        name: er.resources.name,
        url: er.resources.url || undefined,
        dayNumber: parseResourceDay(er.note)
      });
      return acc;
    }, {} as Record<number, PracticeResourceEntity[]>);
  } catch (error) {
    loggerService.warn('Failed to get practice resources', { practiceIds, error });
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
            custom_id: true,
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

    // 檢查是否已過期（小時制：created_at + duration_days * 24h）
    const durationDays = (practice as { duration_days?: number }).duration_days || 14;
    const hasPassedEndDate = checkHasPassedEndDate(practice.end_date, {
      createdAt: practice.created_at,
      durationDays
    });

    // 根據是否有打卡記錄和是否過期決定恢復狀態
    const newStatus = determineNewStatus({
      currentStatus: 'archived',
      hasCheckIns,
      hasPassedEndDate,
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
            custom_id: true,
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
    const [comments, tags, lastCheckInDates, viewCount, reactionCounts] = await Promise.all([
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
      getLastCheckInDates([id]),
      // 查詢瀏覽數
      getViewCount('practice', id),
      // 查詢迴響數
      getReactionCounts([id])
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
      privacyStatus: updatedPractice.privacy_status || 'public',
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
        roleList: updatedPractice.users.user_positions?.map((up: { position: { name: string } }) => up.position.name) || [],
        customId: updatedPractice.users.custom_id ?? null
      },
      tags: tags.map(tag => tag.tags.name),
      stats: {
        likeCount: reactionCounts[id] || 0,
        viewCount: viewCount,
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

/**
 * 完成已到期的實踐
 * 用於排程任務自動將到期的實踐標記為完成
 *
 * 冪等性設計：
 * - 使用 updateMany 的 where 條件確保只更新符合條件的記錄
 * - 即使重複執行也不會造成錯誤（已完成的不會再被查詢到）
 * - 郵件發送透過 enqueuePracticeEmail 的 jobId 去重機制保護
 */
export async function completeExpiredPractices(): Promise<{
  completedCount: number;
  practiceIds: number[];
}> {
  try {
    // 使用事務確保原子性：查詢並更新在同一個事務中
    const result = await prismaClient.$transaction(async (tx) => {
      // 小時制到期 = created_at + duration * 24h
      // 無法用 end_date 預篩（start_date 在未來時 end_date 可能遠大於到期時間）
      const activePractices = await tx.practices.findMany({
        where: {
          status: { in: ['not_started', 'active'] },
          deleted_at: null
        },
        select: {
          id: true,
          user_id: true,
          created_at: true,
          duration_days: true,
          end_date: true
        }
      });

      // 小時制：逐筆精確檢查是否已過期（created_at + duration * 24h）
      const expiredPractices = activePractices.filter(p =>
        checkHasPassedEndDate(p.end_date, {
          createdAt: p.created_at,
          durationDays: p.duration_days || 14
        })
      );

      if (expiredPractices.length === 0) {
        return { expiredPractices: [], updatedCount: 0, checkInCounts: [] };
      }

      const practiceIds = expiredPractices.map(p => p.id);

      // 批量更新狀態為 completed
      // 再次檢查狀態以防止競爭條件
      const updateResult = await tx.practices.updateMany({
        where: {
          id: { in: practiceIds },
          status: { in: ['not_started', 'active'] } // 雙重檢查
        },
        data: {
          status: 'completed',
          updated_at: new Date()
        }
      });

      // 在 transaction 內查詢各實踐的打卡數，避免與並行打卡請求產生競態條件
      const checkInCounts = await Promise.all(
        expiredPractices.map(async (p) => ({
          practiceId: p.id,
          userId: p.user_id,
          count: await tx.practice_checkins.count({ where: { practice_id: p.id } })
        }))
      );

      return { expiredPractices, updatedCount: updateResult.count, checkInCounts };
    });

    if (result.updatedCount === 0) {
      loggerService.info('No expired practices to complete');
      return { completedCount: 0, practiceIds: [] };
    }

    const practiceIds = result.expiredPractices.map(p => p.id);

    loggerService.info('Expired practices completed', {
      count: result.updatedCount,
      practiceIds
    });

    // 觸發結束總結郵件（非阻塞）
    // 有打卡 → PE07，無打卡 → PE08
    // enqueuePracticeEmail 內部使用 jobId 去重，不會重複發送
    // 打卡數在 transaction 內已查詢，避免競態條件
    for (const item of result.checkInCounts) {
      const emailCode = item.count > 0 ? 'PE07' : 'PE08';
      enqueuePracticeEmail(emailCode, item.practiceId, item.userId).catch(err => {
        loggerService.error('Failed to enqueue final summary email', {
          practiceId: item.practiceId,
          error: err
        });
      });
    }

    return { completedCount: result.updatedCount, practiceIds };
  } catch (error) {
    loggerService.error('Failed to complete expired practices', { error });
    throw error;
  }
}

/**
 * 複製實踐（複製他人或自己的實踐）
 * - 複製他人：僅允許 public 實踐
 * - 複製自己：不限 privacy_status
 */
export async function copyPractice(sourceId: number, userId: number): Promise<ApiSuccessResponse<{ id: string }>> {
  try {
    const [source, resourcesMap, tags] = await Promise.all([
      prismaClient.practices.findUnique({ where: { id: sourceId } }),
      getPracticeResources([sourceId]),
      prismaClient.entity_tags.findMany({
        where: { entity_type: 'practice', entity_id: sourceId },
        include: { tags: { select: { id: true, name: true } } }
      })
    ]);

    if (!source || source.deleted_at !== null) {
      throw new NotFoundError('實踐不存在');
    }

    const isSelf = source.user_id === userId;
    if (!isSelf) {
      const ps = source.privacy_status ?? 'public';
      const isAccessible = ps === 'public' || (ps === 'delayed' && source.status === 'completed');
      if (!isAccessible) {
        throw new ForbiddenError('此實踐不公開，無法複製');
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = source.duration_days
      ? (() => {
          const d = new Date(today);
          d.setDate(d.getDate() + source.duration_days - 1);
          return d;
        })()
      : null;

    const sourceResources = resourcesMap[sourceId] ?? [];

    const [newPractice] = await prismaClient.$transaction([
      prismaClient.practices.create({
        data: {
          user_id: userId,
          title: source.title,
          practice_action: source.practice_action,
          duration_days: source.duration_days,
          session_duration_minutes: source.session_duration_minutes,
          frequency_min_days: source.frequency_min_days,
          frequency_max_days: source.frequency_max_days,
          practice_time_periods: source.practice_time_periods,
          other_context: source.other_context,
          has_resources: sourceResources.length > 0,
          theme_color: source.theme_color,
          template_id: source.template_id,
          source_practice_id: sourceId,
          creation_source: 'copied',
          status: 'not_started',
          progress_percentage: INITIAL_PROGRESS,
          start_date: today,
          end_date: endDate
        },
        select: { id: true, external_id: true }
      }),
      prismaClient.practices.update({
        where: { id: sourceId },
        data: { copy_count: { increment: 1 } }
      })
    ]);

    const tagNames = tags.map(t => t.tags.name);
    if (tagNames.length > 0) await linkTags(newPractice.id, tagNames);
    if (sourceResources.length > 0) {
      await linkResources(newPractice.id, sourceResources.map(r => ({ name: r.name, url: r.url })), userId);
    }

    if (!newPractice.external_id) {
      throw new Error('新建立的實踐缺少 external_id');
    }

    loggerService.info('Practice copied', { sourceId, newId: newPractice.id, userId });

    return createSuccessResponse({ id: newPractice.external_id });

  } catch (error) {
    loggerService.error('Failed to copy practice', { sourceId, userId, error });
    throw error;
  }
}

/**
 * 查詢特定用戶在最近 N 天內的實踐數
 */
export async function getRecentPracticeCount(userId: number, days = 7): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prismaClient.practices.count({
    where: {
      user_id: userId,
      created_at: {
        gte: since
      }
    }
  });
}
