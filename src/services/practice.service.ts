/**
 * Practice 核心服務
 * 
 * 提供 Practice 相關的業務邏輯實作，包含 CRUD 操作、查詢、統計等功能
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { PrismaClient, Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import {
  PracticeEntity,
  PracticeStats,
  CreatePracticeRequest,
  UpdatePracticeRequest,
  PracticeQueryParams,
  ApiResponse,
  PaginationInfo,
  ContentType,
  PracticeStatus,
  DailyGoalType
} from '../types/practice.types';

export class PracticeService {
  private prismaClient: PrismaClient;

  constructor() {
    this.prismaClient = prisma;
  }

  /**
   * 取得實踐列表（支援篩選、分頁、搜尋）
   */
  async findAll(params: PracticeQueryParams): Promise<ApiResponse<PracticeEntity[]>> {
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
        ...(status && { status }),
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
        this.prismaClient.practices.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            users: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        }),
        this.prismaClient.practices.count({ where })
      ]);

      // 並行取得統計數據
      const practiceIds = practices.map(p => p.id);
      const [reactions, views, favorites, shares, comments] = await Promise.all([
        this.getReactionCounts(practiceIds),
        this.getViewCounts(practiceIds),
        this.getFavoriteCounts(practiceIds),
        this.getShareCounts(practiceIds),
        this.getCommentCounts(practiceIds)
      ]);

      // 轉換為 API 格式
      const practiceEntities: PracticeEntity[] = practices.map(practice => ({
        id: practice.id,
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
          id: practice.users.id.toString(),
          name: practice.users.nickname || 'Unknown User',
          photoUrl: undefined,
          role: undefined
        },
        tags: [],
        stats: {
          likeCount: reactions[practice.id] || 0,
          viewCount: views[practice.id] || 0,
          favoriteCount: favorites[practice.id] || 0,
          shareCount: shares[practice.id] || 0,
          commentCount: comments[practice.id] || 0
        }
      }));

      const pagination: PaginationInfo = {
        currentPage: page,
        totalPages: Math.ceil(total / take),
        totalItems: total,
        itemsPerPage: take,
        hasNext: page < Math.ceil(total / take),
        hasPrev: page > 1
      };

      loggerService.info('Practice list retrieved', {
        count: practiceEntities.length,
        total,
        page,
        filters: { search, contentType, status, userId }
      });

      return {
        success: true,
        data: practiceEntities,
        pagination
      };

    } catch (error) {
      loggerService.error('Failed to retrieve practice list', error as Record<string, unknown>);
      throw new Error('取得實踐列表失敗');
    }
  }

  /**
   * 取得單一實踐詳情
   */
  async findById(id: string, userId?: number): Promise<ApiResponse<PracticeEntity>> {
    try {
      const practice = await this.prismaClient.practices.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 如果有使用者ID，記錄瀏覽事件
      if (userId) {
        await this.recordViewEvent(id, userId);
      }

      // 取得統計數據
      const [reactions, views, favorites, shares, comments] = await Promise.all([
        this.getReactionCounts([id]),
        this.getViewCounts([id]),
        this.getFavoriteCounts([id]),
        this.getShareCounts([id]),
        this.getCommentCounts([id])
      ]);

      const practiceEntity: PracticeEntity = {
        id: practice.id,
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
          id: practice.users.id.toString(),
          name: practice.users.nickname || 'Unknown User',
          photoUrl: undefined,
          role: undefined
        },
        tags: [], // TODO: Implement entity_tags relation
        stats: {
          likeCount: reactions[id] || 0,
          viewCount: views[id] || 0,
          favoriteCount: favorites[id] || 0,
          shareCount: shares[id] || 0,
          commentCount: comments[id] || 0
        }
      };

      loggerService.info('Practice detail retrieved', { practiceId: id, userId });

      return {
        success: true,
        data: practiceEntity
      };

    } catch (error) {
      loggerService.error('Failed to retrieve practice detail', { practiceId: id, error });
      throw error;
    }
  }

  /**
   * 建立實踐（包含資源關聯）
   */
  async create(data: CreatePracticeRequest, userId: number): Promise<ApiResponse<PracticeEntity>> {
    try {
      const practice = await this.prismaClient.practices.create({
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
        include: {
          users: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      });

      // 處理標籤關聯（如果有提供）
      if (data.tags && data.tags.length > 0) {
        await this.linkTags(practice.id, data.tags);
      }

      // 處理資源關聯（如果有提供）
      if (data.resources && data.resources.length > 0) {
        await this.linkResources(practice.id, data.resources, userId);
      }

      const practiceEntity: PracticeEntity = {
        id: practice.id,
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
          id: practice.users.id.toString(),
          name: practice.users.nickname || 'Unknown User',
          photoUrl: undefined,
          role: undefined
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

      return {
        success: true,
        data: practiceEntity
      };

    } catch (error) {
      loggerService.error('Failed to create practice', { userId, error });
      throw new Error('建立實踐失敗');
    }
  }

  /**
   * 更新實踐
   */
  async update(id: string, data: UpdatePracticeRequest, userId: number): Promise<ApiResponse<PracticeEntity>> {
    try {
      // 檢查權限
      const existingPractice = await this.prismaClient.practices.findUnique({
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

      const practice = await this.prismaClient.practices.update({
        where: { id },
        data: updateData,
        include: {
          users: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      });

      // 處理標籤更新（如果有提供）
      if (data.tags !== undefined) {
        await this.updateTags(id, data.tags);
      }

      // 處理資源更新（如果有提供）
      if (data.resources !== undefined) {
        await this.updateResources(id, data.resources, userId);
        await this.prismaClient.practices.update({
          where: { id },
          data: { has_resources: data.resources.length > 0 }
        });
      }

      // 取得統計數據
      const [reactions, views, favorites, shares, comments] = await Promise.all([
        this.getReactionCounts([id]),
        this.getViewCounts([id]),
        this.getFavoriteCounts([id]),
        this.getShareCounts([id]),
        this.getCommentCounts([id])
      ]);

      const practiceEntity: PracticeEntity = {
        id: practice.id,
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
          id: practice.users.id.toString(),
          name: practice.users.nickname || 'Unknown User',
          photoUrl: undefined,
          role: undefined
        },
        tags: [], // TODO: Implement entity_tags relation
        stats: {
          likeCount: reactions[id] || 0,
          viewCount: views[id] || 0,
          favoriteCount: favorites[id] || 0,
          shareCount: shares[id] || 0,
          commentCount: comments[id] || 0
        }
      };

      loggerService.info('Practice updated', { practiceId: id, userId });

      return {
        success: true,
        data: practiceEntity
      };

    } catch (error) {
      loggerService.error('Failed to update practice', { practiceId: id, userId, error });
      throw error;
    }
  }

  /**
   * 軟刪除實踐
   */
  async delete(id: string, userId: number): Promise<ApiResponse<void>> {
    try {
      // 檢查權限
      const practice = await this.prismaClient.practices.findUnique({
        where: { id }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      if (practice.user_id !== userId) {
        throw new Error('沒有權限刪除此實踐');
      }

      // 軟刪除：更新狀態為 archived
      await this.prismaClient.practices.update({
        where: { id },
        data: {
          status: 'archived',
          updated_at: new Date()
        }
      });

      loggerService.info('Practice deleted', { practiceId: id, userId });

      return {
        success: true,
        data: undefined
      };

    } catch (error) {
      loggerService.error('Failed to delete practice', { practiceId: id, userId, error });
      throw error;
    }
  }

  /**
   * 取得使用者的實踐列表
   */
  async findUserPractices(userId: number, params: PracticeQueryParams): Promise<ApiResponse<PracticeEntity[]>> {
    return this.findAll({ ...params, userId });
  }

  /**
   * 取得使用者實踐統計
   */
  async getUserStats(userId: number): Promise<ApiResponse<PracticeStats>> {
    try {
      const [practiceStats, checkInStats] = await Promise.all([
        this.prismaClient.practices.aggregate({
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
        this.prismaClient.practice_checkins.aggregate({
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

      const statusCounts = await this.prismaClient.practices.groupBy({
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

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      loggerService.error('Failed to retrieve user practice stats', { userId, error });
      throw new Error('取得使用者統計失敗');
    }
  }

  /**
   * 記錄瀏覽事件（私有方法）
   */
  private async recordViewEvent(practiceId: string, userId: number): Promise<void> {
    try {
      await this.prismaClient.view.create({
        data: {
          user_id: userId,
          target_type: 'practice',
          target_id: practiceId
        }
      });
    } catch (error) {
      loggerService.warn('Failed to record view event', { practiceId, userId, error });
    }
  }

  /**
   * 連結標籤（私有方法）
   */
  private async linkTags(practiceId: string, tagNames: string[]): Promise<void> {
    if (!tagNames.length) return;

    try {
      // 取得或建立標籤
      const tags = await Promise.all(
        tagNames.map(name =>
          this.prismaClient.tags.upsert({
            where: { name },
            update: {},
            create: { name }
          })
        )
      );

      // 建立關聯
      await Promise.all(
        tags.map(tag =>
          this.prismaClient.entity_tags.upsert({
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
   * 連結資源（私有方法）
   */
  private async linkResources(practiceId: string, resources: Array<{ name: string; url?: string }>, userId: number): Promise<void> {
    if (!resources.length) return;

    try {
      // 創建資源
      await Promise.all(
        resources.map(resource =>
          this.prismaClient.resources.create({
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
   * 更新標籤（私有方法）
   */
  private async updateTags(practiceId: string, tagNames: string[]): Promise<void> {
    try {
      // 刪除現有標籤關聯
      await this.prismaClient.entity_tags.deleteMany({
        where: {
          entity_type: 'practice',
          entity_id: practiceId
        }
      });

      // 建立新的標籤關聯
      if (tagNames.length > 0) {
        await this.linkTags(practiceId, tagNames);
      }
    } catch (error) {
      loggerService.warn('Failed to update tags', { practiceId, tagNames, error });
    }
  }

  /**
   * 更新資源（私有方法）
   */
  private async updateResources(practiceId: string, resources: Array<{ name: string; url?: string }>, _userId: number): Promise<void> {
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
   * 取得反應統計（私有方法）
   */
  private async getReactionCounts(practiceIds: string[]): Promise<Record<string, number>> {
    if (!practiceIds.length) return {};
    
    try {
      const reactions = await this.prismaClient.reaction.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'practice',
          target_id: { in: practiceIds }
        },
        _count: { id: true }
      });

      return reactions.reduce((acc, reaction) => {
        acc[reaction.target_id] = reaction._count.id;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      loggerService.warn('Failed to get reaction counts', { practiceIds, error });
      return {};
    }
  }

  /**
   * 取得瀏覽統計（私有方法）
   */
  private async getViewCounts(practiceIds: string[]): Promise<Record<string, number>> {
    if (!practiceIds.length) return {};
    
    try {
      const views = await this.prismaClient.view.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'practice',
          target_id: { in: practiceIds }
        },
        _count: { id: true }
      });

      return views.reduce((acc, view) => {
        acc[view.target_id] = view._count.id;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      loggerService.warn('Failed to get view counts', { practiceIds, error });
      return {};
    }
  }

  /**
   * 取得收藏統計（私有方法）
   */
  private async getFavoriteCounts(practiceIds: string[]): Promise<Record<string, number>> {
    if (!practiceIds.length) return {};
    
    try {
      const favorites = await this.prismaClient.favorite.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'practice',
          target_id: { in: practiceIds }
        },
        _count: { id: true }
      });

      return favorites.reduce((acc, favorite) => {
        acc[favorite.target_id] = favorite._count.id;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      loggerService.warn('Failed to get favorite counts', { practiceIds, error });
      return {};
    }
  }

  /**
   * 取得分享統計（私有方法）
   */
  private async getShareCounts(practiceIds: string[]): Promise<Record<string, number>> {
    if (!practiceIds.length) return {};
    
    try {
      const shares = await this.prismaClient.share.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'practice',
          target_id: { in: practiceIds }
        },
        _count: { id: true }
      });

      return shares.reduce((acc, share) => {
        acc[share.target_id] = share._count.id;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      loggerService.warn('Failed to get share counts', { practiceIds, error });
      return {};
    }
  }

  /**
   * 取得評論統計（私有方法）
   */
  private async getCommentCounts(practiceIds: string[]): Promise<Record<string, number>> {
    if (!practiceIds.length) return {};
    
    try {
      const comments = await this.prismaClient.comments.groupBy({
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
      }, {} as Record<string, number>);
    } catch (error) {
      loggerService.warn('Failed to get comment counts', { practiceIds, error });
      return {};
    }
  }
}

// 建立並導出服務實例
export const practiceService = new PracticeService();
export default practiceService;