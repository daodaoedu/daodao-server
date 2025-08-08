/**
 * Practice 事件記錄服務
 * 
 * 提供使用者行為事件記錄功能，包含瀏覽、點擊、分享、收藏等各種事件的統一處理
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { PrismaClient } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import {
  ViewEventRequest,
  ClickEventRequest,
  ShareEventRequest,
  FavoriteEventRequest,
  ApiResponse
} from '../types/practice.types';

export class PracticeEventService {
  private prismaClient: PrismaClient;

  constructor() {
    this.prismaClient = prisma;
  }

  /**
   * 記錄瀏覽事件
   */
  async recordViewEvent(data: ViewEventRequest, userId: number): Promise<ApiResponse<void>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: data.entityId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 記錄瀏覽事件
      await this.prismaClient.view.create({
        data: {
          target_id: data.entityId,
          target_type: data.entityType,
          user_id: userId,
          duration: data.duration
        }
      });

      loggerService.info('View event recorded', {
        entityId: data.entityId,
        entityType: data.entityType,
        userId,
        duration: data.duration,
        referrer: data.referrer
      });

      return {
        success: true,
        data: undefined
      };

    } catch (error) {
      loggerService.error('Failed to record view event', { data, userId, error });
      throw error;
    }
  }

  /**
   * 記錄點擊事件
   */
  async recordClickEvent(data: ClickEventRequest, userId: number): Promise<ApiResponse<void>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: data.entityId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 由於沒有專門的 click_events 表，我們使用 view 表記錄點擊事件
      await this.prismaClient.view.create({
        data: {
          target_id: data.entityId,
          target_type: data.entityType,
          user_id: userId,
          duration: 0 // 點擊事件不計入瀏覽時長
        }
      });

      loggerService.info('Click event recorded', {
        entityId: data.entityId,
        entityType: data.entityType,
        userId,
        clickType: data.clickType,
        clickTarget: data.clickTarget,
        clickPosition: data.clickPosition
      });

      return {
        success: true,
        data: undefined
      };

    } catch (error) {
      loggerService.error('Failed to record click event', { data, userId, error });
      throw error;
    }
  }

  /**
   * 記錄分享事件
   */
  async recordShareEvent(data: ShareEventRequest, userId: number): Promise<ApiResponse<void>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: data.entityId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 記錄分享事件
      await this.prismaClient.share.create({
        data: {
          target_id: data.entityId,
          target_type: data.entityType,
          user_id: userId,
          channel: data.platform,
          share_method: data.shareUrl ? 'url' : 'other'
        }
      });

      loggerService.info('Share event recorded', {
        entityId: data.entityId,
        entityType: data.entityType,
        userId,
        platform: data.platform,
        shareUrl: data.shareUrl
      });

      return {
        success: true,
        data: undefined
      };

    } catch (error) {
      loggerService.error('Failed to record share event', { data, userId, error });
      throw error;
    }
  }

  /**
   * 記錄收藏事件
   */
  async recordFavoriteEvent(data: FavoriteEventRequest, userId: number): Promise<ApiResponse<void>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: data.entityId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 新增收藏記錄
      await this.prismaClient.favorite.create({
        data: {
          target_id: data.entityId,
          target_type: data.entityType,
          user_id: userId
        }
      });

      loggerService.info('Favorite event recorded', {
        entityId: data.entityId,
        entityType: data.entityType,
        userId
      });

      return {
        success: true,
        data: undefined
      };

    } catch (error) {
      loggerService.error('Failed to record favorite event', { data, userId, error });
      throw error;
    }
  }

  /**
   * 移除收藏事件
   */
  async removeFavoriteEvent(entityId: string, entityType: string, userId: number): Promise<ApiResponse<void>> {
    try {
      // 檢查實踐是否存在
      const practice = await this.prismaClient.practices.findUnique({
        where: { id: entityId }
      });

      if (!practice) {
        throw new Error('實踐不存在');
      }

      // 移除收藏記錄
      await this.prismaClient.favorite.deleteMany({
        where: {
          target_id: entityId,
          target_type: entityType,
          user_id: userId
        }
      });

      loggerService.info('Favorite event removed', {
        entityId,
        entityType,
        userId
      });

      return {
        success: true,
        data: undefined
      };

    } catch (error) {
      loggerService.error('Failed to remove favorite event', { entityId, entityType, userId, error });
      throw error;
    }
  }

  /**
   * 批量記錄事件
   */
  async recordBatchEvents(
    events: Array<{
      type: 'view' | 'click' | 'share' | 'favorite';
      data: ViewEventRequest | ClickEventRequest | ShareEventRequest | FavoriteEventRequest;
    }>,
    userId: number
  ): Promise<ApiResponse<{ successCount: number; errorCount: number; errors: string[] }>> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (const event of events) {
        try {
          switch (event.type) {
            case 'view':
              await this.recordViewEvent(event.data as ViewEventRequest, userId);
              break;
            case 'click':
              await this.recordClickEvent(event.data as ClickEventRequest, userId);
              break;
            case 'share':
              await this.recordShareEvent(event.data as ShareEventRequest, userId);
              break;
            case 'favorite':
              await this.recordFavoriteEvent(event.data as FavoriteEventRequest, userId);
              break;
            default:
              throw new Error(`不支援的事件類型: ${event.type}`);
          }
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${event.type} 事件記錄失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      }

      loggerService.info('Batch events processed', {
        userId,
        totalEvents: events.length,
        successCount,
        errorCount
      });

      return {
        success: true,
        data: {
          successCount,
          errorCount,
          errors
        }
      };

    } catch (error) {
      loggerService.error('Failed to process batch events', { userId, events: events.length, error });
      throw new Error('批量處理事件失敗');
    }
  }

  /**
   * 取得事件統計
   */
  async getEventStats(entityId: string, entityType = 'practice'): Promise<ApiResponse<{
    viewCount: number;
    uniqueViewCount: number;
    clickCount: number;
    shareCount: number;
    favoriteCount: number;
    totalViewDuration: number;
    averageViewDuration: number;
    topReferrers: Array<{ referrer: string; count: number }>;
    topPlatforms: Array<{ platform: string; count: number }>;
  }>> {
    try {
      // 並行查詢各種統計數據
      const [
        viewStats,
        uniqueViewCount,
        clickCount,
        shareCount,
        favoriteCount,
        totalViewDuration,
        topReferrers,
        topPlatforms
      ] = await Promise.all([
        // 瀏覽統計
        this.prismaClient.view.aggregate({
          where: { target_id: entityId, target_type: entityType },
          _sum: { duration: true },
          _avg: { duration: true }
        }),
        // 獨特瀏覽者數
        this.prismaClient.view.count({
          where: { target_id: entityId, target_type: entityType }
        }),
        // 點擊次數（暫時設為 0）
        Promise.resolve(0),
        // 分享次數
        this.prismaClient.share.count({
          where: { target_id: entityId, target_type: entityType }
        }),
        // 收藏次數
        this.prismaClient.favorite.count({
          where: { target_id: entityId, target_type: entityType }
        }),
        // 總瀏覽時長
        this.prismaClient.view.aggregate({
          where: { target_id: entityId, target_type: entityType },
          _sum: { duration: true }
        }),
        // 熱門來源（暫時返回空陣列）
        Promise.resolve([] as Array<{ referrer: string; count: bigint }>),
        // 熱門分享平台
        this.prismaClient.$queryRaw<Array<{ channel: string; count: bigint }>>`
          SELECT channel, COUNT(*) as count
          FROM "share"
          WHERE target_id = ${entityId} AND target_type = ${entityType} AND channel IS NOT NULL
          GROUP BY channel
          ORDER BY count DESC
          LIMIT 10
        `
      ]);

      const stats = {
        viewCount: Number(viewStats._sum.duration) || 0,
        uniqueViewCount,
        clickCount,
        shareCount,
        favoriteCount,
        totalViewDuration: Number(totalViewDuration._sum.duration) || 0,
        averageViewDuration: Number(viewStats._avg.duration) || 0,
        topReferrers: topReferrers.map(item => ({
          referrer: item.referrer || 'direct',
          count: Number(item.count || 0)
        })),
        topPlatforms: topPlatforms.map(item => ({
          platform: item.channel,
          count: Number(item.count)
        }))
      };

      loggerService.info('Event stats retrieved', {
        entityId,
        entityType,
        stats: {
          viewCount: stats.viewCount,
          uniqueViewCount: stats.uniqueViewCount,
          shareCount: stats.shareCount,
          favoriteCount: stats.favoriteCount
        }
      });

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      loggerService.error('Failed to get event stats', { entityId, entityType, error });
      throw new Error('取得事件統計失敗');
    }
  }

  /**
   * 取得使用者事件歷史
   */
  async getUserEventHistory(
    userId: number,
    params: {
      entityType?: string;
      eventType?: 'view' | 'click' | 'share' | 'favorite';
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<Array<{
    eventType: string;
    entityId: string;
    entityType: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>>> {
    try {
      const {
        entityType = 'practice',
        eventType,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = params;

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      const events: Array<{
        eventType: string;
        entityId: string;
        entityType: string;
        timestamp: string;
        metadata?: Record<string, unknown>;
      }> = [];

      // 查詢不同類型的事件
      if (!eventType || eventType === 'view') {
        const views = await this.prismaClient.view.findMany({
          where: {
            user_id: userId,
            target_type: entityType,
            ...(startDate && { created_at: { gte: new Date(startDate) } }),
            ...(endDate && { created_at: { lte: new Date(endDate) } })
          },
          select: {
            target_id: true,
            target_type: true,
            created_at: true,
            duration: true
          },
          orderBy: { created_at: 'desc' }
        });

        events.push(...views.map(view => ({
          eventType: 'view',
          entityId: view.target_id,
          entityType: view.target_type,
          timestamp: view.created_at?.toISOString() || '',
          metadata: {
            duration: view.duration
          }
        })));
      }

      if (!eventType || eventType === 'share') {
        const shares = await this.prismaClient.share.findMany({
          where: {
            user_id: userId,
            target_type: entityType,
            ...(startDate && { created_at: { gte: new Date(startDate) } }),
            ...(endDate && { created_at: { lte: new Date(endDate) } })
          },
          select: {
            target_id: true,
            target_type: true,
            created_at: true,
            channel: true,
            share_method: true
          },
          orderBy: { created_at: 'desc' }
        });

        events.push(...shares.map(share => ({
          eventType: 'share',
          entityId: share.target_id,
          entityType: share.target_type,
          timestamp: share.created_at?.toISOString() || '',
          metadata: {
            platform: share.channel,
            shareMethod: share.share_method
          }
        })));
      }

      if (!eventType || eventType === 'favorite') {
        const favorites = await this.prismaClient.favorite.findMany({
          where: {
            user_id: userId,
            target_type: entityType,
            ...(startDate && { created_at: { gte: new Date(startDate) } }),
            ...(endDate && { created_at: { lte: new Date(endDate) } })
          },
          select: {
            target_id: true,
            target_type: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' }
        });

        events.push(...favorites.map(favorite => ({
          eventType: 'favorite',
          entityId: favorite.target_id,
          entityType: favorite.target_type,
          timestamp: favorite.created_at?.toISOString() || '',
          metadata: undefined
        })));
      }

      // 排序並分頁
      const sortedEvents = events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(skip, skip + take);

      loggerService.info('User event history retrieved', {
        userId,
        entityType,
        eventType,
        count: sortedEvents.length,
        page
      });

      return {
        success: true,
        data: sortedEvents
      };

    } catch (error) {
      loggerService.error('Failed to get user event history', { userId, params, error });
      throw new Error('取得使用者事件歷史失敗');
    }
  }
}

// 建立並導出服務實例
export const practiceEventService = new PracticeEventService();
export default practiceEventService;