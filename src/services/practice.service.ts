/**
 * Practice 核心服務
 * 
 * 提供 Practice 相關的業務邏輯實作，包含 CRUD 操作、查詢、統計等功能
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import {
  PracticeEntity,
  PracticeStats,
  CreatePracticeRequest,
  UpdatePracticeRequest,
  PracticeQueryParams,
  ContentType,
  PracticeStatus,
  DailyGoalType
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
    const where: Prisma.practicesWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { practice_action: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(contentType && { content_type: contentType }),
      ...(status && status !== 'all' && { status }),
      ...(userId && { user_id: userId })
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
    const [comments, allTags] = await Promise.all([
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


    // 轉換為 API 格式
    const practiceEntities: PracticeEntity[] = practices.map(practice => ({
      id: practice.external_id || '',
      title: practice.title,
      contentType: practice.content_type as ContentType,
      customContentType: practice.custom_content_type || undefined,
      totalAmount: practice.total_amount,
      currentProgress: Number(practice.current_progress) || 0,
      startDate: practice.start_date?.toISOString().split('T')[0],
      dailyGoal: {
        type: practice.daily_goal_type as DailyGoalType,
        timeMinutes: practice.daily_goal_time_minutes || undefined,
        amount: practice.daily_goal_amount || undefined,
        unit: practice.daily_goal_unit || undefined
      },
      practiceAction: practice.practice_action || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      streak: practice.streak || 0,
      maxStreak: practice.max_streak || 0,
      lastCheckInDate: practice.last_checkin_date?.toISOString().split('T')[0],
      createdAt: practice.created_at?.toISOString() || '',
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.id,
        _id: practice.users.external_id || '',
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
    throw new Error('取得實踐列表失敗');
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

    if (!practice) {
      throw new Error('實踐不存在');
    }

    // 記錄瀏覽事件（暫時只記錄日誌）
    if (userId) {
      loggerService.info('Practice view recorded', { practiceId: id, userId });
    }

    // 取得統計數據和標籤 - 暫時只查詢存在的表格
    const [comments, tags] = await Promise.all([
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
      })
    ]);


    const practiceEntity: PracticeEntity = {
      id: practice.external_id || '',
      title: practice.title,
      contentType: practice.content_type as ContentType,
      customContentType: practice.custom_content_type || undefined,
      totalAmount: practice.total_amount,
      currentProgress: Number(practice.current_progress) || 0,
      startDate: practice.start_date?.toISOString().split('T')[0],
      dailyGoal: {
        type: practice.daily_goal_type as DailyGoalType,
        timeMinutes: practice.daily_goal_time_minutes || undefined,
        amount: practice.daily_goal_amount || undefined,
        unit: practice.daily_goal_unit || undefined
      },
      practiceAction: practice.practice_action || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      streak: practice.streak || 0,
      maxStreak: practice.max_streak || 0,
      lastCheckInDate: practice.last_checkin_date?.toISOString().split('T')[0],
      createdAt: practice.created_at?.toISOString() || '',
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.id,
        _id: practice.users.external_id || '',
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

    loggerService.info('Practice detail retrieved', { practiceId: id, userId });

    return createSuccessResponse(practiceEntity);

  } catch (error) {
    loggerService.error('Failed to retrieve practice detail', { practiceId: id, error });
    throw error;
  }
}

/**
 * 建立實踐（包含資源關聯）
 */
export async function create(data: CreatePracticeRequest, userId: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  try {
    const practice = await prismaClient.practices.create({
      data: {
        user_id: userId,
        title: data.title,
        content_type: data.contentType,
        custom_content_type: data.customContentType,
        total_amount: data.totalAmount,
        start_date: data.startDate ? new Date(data.startDate) : null,
        daily_goal_type: data.dailyGoal.type,
        daily_goal_time_minutes: data.dailyGoal.timeMinutes,
        daily_goal_amount: data.dailyGoal.amount,
        daily_goal_unit: data.dailyGoal.unit,
        practice_action: data.practiceAction,
        status: 'active', // CreatePracticeRequest doesn't have status field
        has_resources: Boolean(data.resources && data.resources.length > 0)
      },
      select: {
        id: true,
        external_id: true,
        title: true,
        content_type: true,
        custom_content_type: true,
        total_amount: true,
        current_progress: true,
        start_date: true,
        daily_goal_type: true,
        daily_goal_time_minutes: true,
        daily_goal_amount: true,
        daily_goal_unit: true,
        practice_action: true,
        status: true,
        has_resources: true,
        streak: true,
        max_streak: true,
        last_checkin_date: true,
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
      contentType: practice.content_type as ContentType,
      customContentType: practice.custom_content_type || undefined,
      totalAmount: practice.total_amount,
      currentProgress: Number(practice.current_progress) || 0,
      startDate: practice.start_date?.toISOString().split('T')[0],
      dailyGoal: {
        type: practice.daily_goal_type as DailyGoalType,
        timeMinutes: practice.daily_goal_time_minutes || undefined,
        amount: practice.daily_goal_amount || undefined,
        unit: practice.daily_goal_unit || undefined
      },
      practiceAction: practice.practice_action || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      streak: practice.streak || 0,
      maxStreak: practice.max_streak || 0,
      lastCheckInDate: practice.last_checkin_date?.toISOString().split('T')[0],
      createdAt: practice.created_at?.toISOString() || '',
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.id,
        _id: practice.users.external_id || '',
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

    return createSuccessResponse(practiceEntity);

  } catch (error) {
    loggerService.error('Failed to create practice', { userId, error });
    throw new Error('建立實踐失敗');
  }
}

/**
 * 更新實踐
 */
export async function update(id: number, data: UpdatePracticeRequest, userId: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  try {
    // 檢查權限
    const existingPractice = await prismaClient.practices.findUnique({
      where: { id }
    });

    if (!existingPractice) {
      throw new Error('實踐不存在');
    }

    if (existingPractice.user_id !== userId) {
      throw new Error('沒有權限修改此實踐');
    }

    const updateData: Prisma.practicesUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.totalAmount !== undefined) updateData.total_amount = data.totalAmount;
    if (data.startDate !== undefined) {
      updateData.start_date = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.dailyGoal !== undefined) {
      updateData.daily_goal_type = data.dailyGoal.type;
      updateData.daily_goal_time_minutes = data.dailyGoal.timeMinutes;
      updateData.daily_goal_amount = data.dailyGoal.amount;
      updateData.daily_goal_unit = data.dailyGoal.unit;
    }
    if (data.practiceAction !== undefined) updateData.practice_action = data.practiceAction;
    if (data.status !== undefined) updateData.status = data.status;

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
    const [comments, updatedTags] = await Promise.all([
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
      })
    ]);


    const practiceEntity: PracticeEntity = {
      id: practice.external_id || '',
      title: practice.title,
      contentType: practice.content_type as ContentType,
      customContentType: practice.custom_content_type || undefined,
      totalAmount: practice.total_amount,
      currentProgress: Number(practice.current_progress) || 0,
      startDate: practice.start_date?.toISOString().split('T')[0],
      dailyGoal: {
        type: practice.daily_goal_type as DailyGoalType,
        timeMinutes: practice.daily_goal_time_minutes || undefined,
        amount: practice.daily_goal_amount || undefined,
        unit: practice.daily_goal_unit || undefined
      },
      practiceAction: practice.practice_action || undefined,
      status: practice.status as PracticeStatus || 'active',
      hasResources: practice.has_resources || false,
      streak: practice.streak || 0,
      maxStreak: practice.max_streak || 0,
      lastCheckInDate: practice.last_checkin_date?.toISOString().split('T')[0],
      createdAt: practice.created_at?.toISOString() || '',
      updatedAt: practice.updated_at?.toISOString(),
      user: {
        id: practice.users.id,
        _id: practice.users.external_id || '',
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
    // 檢查權限
    const practice = await prismaClient.practices.findUnique({
      where: { id }
    });

    if (!practice) {
      throw new Error('實踐不存在');
    }

    if (practice.user_id !== userId) {
      throw new Error('沒有權限刪除此實踐');
    }

    // 軟刪除：更新狀態為 archived
    await prismaClient.practices.update({
      where: { id },
      data: {
        status: 'archived',
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
        },
        _avg: {
          streak: true
        },
        _max: {
          max_streak: true
        }
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
      totalPractices: practiceStats._count.id,
      activePractices: statusCounts.find(s => s.status === 'active')?._count.id || 0,
      completedPractices: statusCounts.find(s => s.status === 'completed')?._count.id || 0,
      pausedPractices: statusCounts.find(s => s.status === 'paused')?._count.id || 0,
      totalCheckIns: checkInStats._count.id,
      averageStreak: Math.round(practiceStats._avg.streak || 0),
      maxStreak: practiceStats._max.max_streak || 0
    };

    loggerService.info('User practice stats retrieved', { userId, stats });

    return createSuccessResponse(stats);

  } catch (error) {
    loggerService.error('Failed to retrieve user practice stats', { userId, error });
    throw new Error('取得使用者統計失敗');
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
 */
async function linkResources(practiceId: number, resources: Array<{ name: string; url?: string }>, userId: number): Promise<void> {
  if (!resources.length) return;

  try {
    // 創建資源
    await Promise.all(
      resources.map(resource =>
        prismaClient.resources.create({
          data: {
            name: resource.name,
            url: resource.url || '',
            description: '',
            type: 'practice_resource',
            cost: 'free',
            created_by: userId
          }
        }).catch(error => {
          loggerService.warn('Failed to create resource', { practiceId, resource, error });
        })
      )
    );
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
 */
async function updateResources(practiceId: number, resources: Array<{ name: string; url?: string }>, _userId: number): Promise<void> {
  try {
    // 注意：這裡需要根據實際的資源關聯表結構來實作
    // 目前 resources 表沒有直接的 practice 關聯字段
    // 可能需要通過其他方式關聯，或者建立新的關聯表

    // 暫時只記錄日誌，實際實作需要根據資源關聯的具體設計
    loggerService.info('Resources update - needs proper relation design', { practiceId, resources });
  } catch (error) {
    loggerService.warn('Failed to update resources', { practiceId, resources, error });
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

