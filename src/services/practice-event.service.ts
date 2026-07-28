/**
 * Practice 事件記錄服務
 * 
 * 提供使用者行為事件記錄功能，包含瀏覽、點擊、分享、收藏等各種事件的統一處理
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { NotFoundError, BadRequestError, InternalServerError } from '../middleware/error.middleware';
import { recordView as trackView } from './view-tracking.service';
import {
  ViewEventRequest,
  ClickEventRequest,
  ShareEventRequest,
  FavoriteEventRequest
} from '../types/practice.types';
import {
  ApiSuccessResponse
} from '../types/api-response.types';
import {
  createSuccessResponse
} from '../utils/response-helper';

const prismaClient = prisma;

/**
 * 記錄瀏覽事件
 */
export async function recordViewEvent(data: ViewEventRequest, userId: number): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: data.entityId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    trackView('practice', data.entityId, userId).catch((err: unknown) => {
      loggerService.warn('Failed to track view event', { entityId: data.entityId, userId, err });
    });
    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to record view event', { data, userId, error });
    throw error;
  }
}

/**
 * 記錄點擊事件
 */
export async function recordClickEvent(data: ClickEventRequest, userId: number): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: data.entityId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    // 記錄點擊事件（暫時只記錄日誌）
    // TODO: 實作 click_events 或 view 表格後再啟用資料庫記錄

    loggerService.info('Click event recorded', {
      entityId: data.entityId,
      entityType: data.entityType,
      userId,
      clickType: data.clickType,
      clickTarget: data.clickTarget,
      clickPosition: data.clickPosition
    });

    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to record click event', { data, userId, error });
    throw error;
  }
}

/**
 * 記錄分享事件
 */
export async function recordShareEvent(data: ShareEventRequest, userId: number): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: data.entityId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    // 記錄分享事件（暫時只記錄日誌）
    // TODO: 實作 share 表格後再啟用資料庫記錄

    loggerService.info('Share event recorded', {
      entityId: data.entityId,
      entityType: data.entityType,
      userId,
      platform: data.platform,
      shareUrl: data.shareUrl
    });

    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to record share event', { data, userId, error });
    throw error;
  }
}

/**
 * 記錄收藏事件
 */
export async function recordFavoriteEvent(data: FavoriteEventRequest, userId: number): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: data.entityId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    // 新增收藏記錄（暫時只記錄日誌）
    // TODO: 實作 favorite 表格後再啟用資料庫記錄

    loggerService.info('Favorite event recorded', {
      entityId: data.entityId,
      entityType: data.entityType,
      userId
    });

    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to record favorite event', { data, userId, error });
    throw error;
  }
}

/**
 * 移除收藏事件
 */
export async function removeFavoriteEvent(entityId: number, entityType: string, userId: number): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: entityId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    // 移除收藏記錄（暫時只記錄日誌）
    // TODO: 實作 favorite 表格後再啟用資料庫記錄

    loggerService.info('Favorite event removed', {
      entityId,
      entityType,
      userId
    });

    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to remove favorite event', { entityId, entityType, userId, error });
    throw error;
  }
}

/**
 * 批量記錄事件
 */
export async function recordBatchEvents(
  events: Array<{
    type: 'view' | 'click' | 'share' | 'favorite';
    data: ViewEventRequest | ClickEventRequest | ShareEventRequest | FavoriteEventRequest;
  }>,
  userId: number
): Promise<ApiSuccessResponse<{ successCount: number; errorCount: number; errors: string[] }>> {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    for (const event of events) {
      try {
        switch (event.type) {
          case 'view':
            await recordViewEvent(event.data as ViewEventRequest, userId);
            break;
          case 'click':
            await recordClickEvent(event.data as ClickEventRequest, userId);
            break;
          case 'share':
            await recordShareEvent(event.data as ShareEventRequest, userId);
            break;
          case 'favorite':
            await recordFavoriteEvent(event.data as FavoriteEventRequest, userId);
            break;
          default:
            throw new BadRequestError(`不支援的事件類型: ${event.type}`);
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

    return createSuccessResponse({
      successCount,
      errorCount,
      errors
    });

  } catch (error) {
    loggerService.error('Failed to process batch events', { userId, events: events.length, error });
    throw new InternalServerError('批量處理事件失敗');
  }
}

/**
 * 取得使用者事件歷史
 */
export async function getUserEventHistory(
  userId: number,
  params: {
    entityType?: string;
    eventType?: 'view' | 'click' | 'share' | 'favorite';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ApiSuccessResponse<Array<{
  eventType: string;
  entityId: number;
  entityType: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}>>> {
  try {
    const {
      entityType = 'practice',
      eventType,
      page = 1,
      limit = 50
    } = params;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const events: Array<{
      eventType: string;
      entityId: number;
      entityType: string;
      timestamp: string;
      metadata?: Record<string, unknown>;
    }> = [];

    // 查詢不同類型的事件（暫時返回空陣列）
    if (!eventType || eventType === 'view') {
      // TODO: 實作 view 表格後再啟用
      const views: Array<{
        target_id: number;
        target_type: string;
        created_at: Date;
        duration: number;
      }> = []; // 暫時返回空陣列

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
      // TODO: 實作 share 表格後再啟用
      const shares: Array<{
        target_id: number;
        target_type: string;
        created_at: Date;
        channel: string;
        share_method: string;
      }> = []; // 暫時返回空陣列

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
      // TODO: 實作 favorite 表格後再啟用
      const favorites: Array<{
        target_id: number;
        target_type: string;
        created_at: Date;
      }> = []; // 暫時返回空陣列

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

    return createSuccessResponse(sortedEvents);

  } catch (error) {
    loggerService.error('Failed to get user event history', { userId, params, error });
    throw new InternalServerError('取得使用者事件歷史失敗');
  }
}