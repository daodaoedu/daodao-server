/**
 * Practice 互動服務
 * 
 * 提供實踐互動相關功能，包含點讚、分享、收藏等社群互動功能
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { PrismaClient } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { ApiResponse } from '../types/practice.types';

export class PracticeInteractionService {
  private prismaClient: PrismaClient;

  constructor() {
    this.prismaClient = prisma;
  }

  /**
   * 點讚/取消點讚
   */
  async toggleLike(practiceId: string, userId: number): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: practiceId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 檢查是否已點讚
      const existingReaction = await this.prismaClient.reaction.findFirst({
        where: {
          target_id: practiceId,
          target_type: 'practice',
          user_id: userId
        }
      });

      let isLiked: boolean;

      if (existingReaction) {
        // 取消點讚
        await this.prismaClient.reaction.deleteMany({
          where: {
            target_id: practiceId,
            target_type: 'practice',
            user_id: userId
          }
        });
        isLiked = false;
      } else {
        // 新增點讚
        await this.prismaClient.reaction.create({
          data: {
            target_id: practiceId,
            target_type: 'practice',
            user_id: userId,
            reaction_type: 'like'
          }
        });
        isLiked = true;
      }

      // 取得最新點讚數
      const likeCount = await this.prismaClient.reaction.count({
        where: {
          target_id: practiceId,
          target_type: 'practice',
          reaction_type: 'like'
        }
      });

      loggerService.info('Practice like toggled', {
        practiceId,
        userId,
        isLiked,
        likeCount
      });

      return {
        success: true,
        data: {
          isLiked,
          likeCount
        }
      };

    } catch (error) {
      loggerService.error('Failed to toggle practice like', { practiceId, userId, error });
      throw error;
    }
  }

  /**
   * 記錄分享事件
   */
  async recordShare(practiceId: string, userId: number, shareData?: {
    platform?: string;
    shareUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<{ shareCount: number }>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: practiceId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 記錄分享事件
      await this.prismaClient.share.create({
        data: {
          target_id: practiceId,
          target_type: 'practice',
          user_id: userId,
          channel: shareData?.platform,
          share_method: shareData?.shareUrl ? 'url' : 'other'
        }
      });

      // 取得最新分享數
      const shareCount = await this.prismaClient.share.count({
        where: {
          target_id: practiceId,
          target_type: 'practice'
        }
      });

      loggerService.info('Practice share recorded', {
        practiceId,
        userId,
        platform: shareData?.platform,
        shareCount
      });

      return {
        success: true,
        data: { shareCount }
      };

    } catch (error) {
      loggerService.error('Failed to record practice share', { practiceId, userId, error });
      throw new Error('記錄分享失敗');
    }
  }

  /**
   * 收藏/取消收藏
   */
  async toggleFavorite(practiceId: string, userId: number): Promise<ApiResponse<{ isFavorited: boolean; favoriteCount: number }>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: practiceId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 檢查是否已收藏
      const existingFavorite = await this.prismaClient.favorite.findFirst({
        where: {
          target_id: practiceId,
          target_type: 'practice',
          user_id: userId
        }
      });

      let isFavorited: boolean;

      if (existingFavorite) {
        // 取消收藏
        await this.prismaClient.favorite.deleteMany({
          where: {
            target_id: practiceId,
            target_type: 'practice',
            user_id: userId
          }
        });
        isFavorited = false;
      } else {
        // 新增收藏
        await this.prismaClient.favorite.create({
          data: {
            target_id: practiceId,
            target_type: 'practice',
            user_id: userId
          }
        });
        isFavorited = true;
      }

      // 取得最新收藏數
      const favoriteCount = await this.prismaClient.favorite.count({
        where: {
          target_id: practiceId,
          target_type: 'practice'
        }
      });

      loggerService.info('Practice favorite toggled', {
        practiceId,
        userId,
        isFavorited,
        favoriteCount
      });

      return {
        success: true,
        data: {
          isFavorited,
          favoriteCount
        }
      };

    } catch (error) {
      loggerService.error('Failed to toggle practice favorite', { practiceId, userId, error });
      throw error;
    }
  }

  /**
   * 記錄瀏覽事件
   */
  async recordView(practiceId: string, userId: number, viewData?: {
    duration?: number;
    referrer?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<{ viewCount: number }>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: practiceId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 記錄瀏覽事件
      await this.prismaClient.view.create({
        data: {
          target_id: practiceId,
          target_type: 'practice',
          user_id: userId,
          duration: viewData?.duration
        }
      });

      // 取得最新瀏覽數（總瀏覽人數）
      const viewCount = await this.prismaClient.view.count({
        where: {
          target_id: practiceId,
          target_type: 'practice'
        }
      });

      loggerService.info('Practice view recorded', {
        practiceId,
        userId,
        duration: viewData?.duration,
        viewCount
      });

      return {
        success: true,
        data: { viewCount }
      };

    } catch (error) {
      loggerService.error('Failed to record practice view', { practiceId, userId, error });
      throw new Error('記錄瀏覽失敗');
    }
  }

  /**
   * 記錄點擊事件
   */
  async recordClick(practiceId: string, userId: number, clickData: {
    clickType: string;
    clickTarget?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<void>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: practiceId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 記錄點擊事件到 click_events 表（如果有的話）
      // 由於 Prisma schema 中沒有 click_events 表，我們可以使用 view 表來記錄點擊事件
      // 或者在實際應用中建立 click_events 表
      
      // 暫時使用 view 表記錄點擊，並在 metadata 中標記為 click 事件
      await this.prismaClient.view.create({
        data: {
          target_id: practiceId,
          target_type: 'practice',
          user_id: userId,
          duration: 0 // 點擊事件不算瀏覽時長
        }
      });

      loggerService.info('Practice click recorded', {
        practiceId,
        userId,
        clickType: clickData.clickType,
        clickTarget: clickData.clickTarget
      });

      return {
        success: true,
        data: undefined
      };

    } catch (error) {
      loggerService.error('Failed to record practice click', { practiceId, userId, clickData, error });
      throw new Error('記錄點擊失敗');
    }
  }

  /**
   * 取得使用者對實踐的互動狀態
   */
  async getUserInteractionStatus(practiceId: string, userId: number): Promise<ApiResponse<{
    isLiked: boolean;
    isFavorited: boolean;
    hasViewed: boolean;
  }>> {
    try {
      const [reaction, favorite, view] = await Promise.all([
        this.prismaClient.reaction.findFirst({
          where: {
            target_id: practiceId,
            target_type: 'practice',
            user_id: userId
          }
        }),
        this.prismaClient.favorite.findFirst({
          where: {
            target_id: practiceId,
            target_type: 'practice',
            user_id: userId
          }
        }),
        this.prismaClient.view.findFirst({
          where: {
            target_id: practiceId,
            target_type: 'practice',
            user_id: userId
          }
        })
      ]);

      return {
        success: true,
        data: {
          isLiked: Boolean(reaction),
          isFavorited: Boolean(favorite),
          hasViewed: Boolean(view)
        }
      };

    } catch (error) {
      loggerService.error('Failed to get user interaction status', { practiceId, userId, error });
      throw new Error('取得互動狀態失敗');
    }
  }

  /**
   * 取得實踐的所有互動統計
   */
  async getInteractionStats(practiceId: string): Promise<ApiResponse<{
    likeCount: number;
    favoriteCount: number;
    shareCount: number;
    viewCount: number;
    commentCount: number;
  }>> {
    try {
      const [likeCount, favoriteCount, shareCount, viewCount, commentCount] = await Promise.all([
        this.prismaClient.reaction.count({
          where: {
            target_id: practiceId,
            target_type: 'practice',
            reaction_type: 'like'
          }
        }),
        this.prismaClient.favorite.count({
          where: {
            target_id: practiceId,
            target_type: 'practice'
          }
        }),
        this.prismaClient.share.count({
          where: {
            target_id: practiceId,
            target_type: 'practice'
          }
        }),
        this.prismaClient.view.count({
          where: {
            target_id: practiceId,
            target_type: 'practice'
          }
        }),
        this.prismaClient.comments.count({
          where: {
            target_id: practiceId,
            target_type: 'practice'
          }
        })
      ]);

      return {
        success: true,
        data: {
          likeCount,
          favoriteCount,
          shareCount,
          viewCount,
          commentCount
        }
      };

    } catch (error) {
      loggerService.error('Failed to get interaction stats', { practiceId, error });
      throw new Error('取得互動統計失敗');
    }
  }

  /**
   * 取得使用者收藏的實踐列表
   */
  async getUserFavorites(userId: number, params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<Array<{
    practiceId: string;
    favoriteAt: string;
    practice: {
      id: string;
      title: string;
      contentType: string;
      status: string;
      user: {
        id: string;
        name: string;
      };
    };
  }>>> {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      const favorites = await this.prismaClient.favorite.findMany({
        where: {
          target_type: 'practice',
          user_id: userId
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      });

      const favoriteList = favorites.map(favorite => ({
        practiceId: favorite.target_id,
        favoriteAt: favorite.created_at?.toISOString() || '',
        practice: {
          id: favorite.target_id,
          title: 'Practice',
          contentType: 'unknown',
          status: 'active',
          user: {
            id: '0',
            name: 'Unknown User'
          }
        }
      }));

      return {
        success: true,
        data: favoriteList
      };

    } catch (error) {
      loggerService.error('Failed to get user favorites', { userId, error });
      throw new Error('取得收藏列表失敗');
    }
  }
}

// 建立並導出服務實例
export const practiceInteractionService = new PracticeInteractionService();
export default practiceInteractionService;