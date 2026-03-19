/**
 * Practice 互動服務
 * 
 * 提供實踐互動相關功能，包含點讚、分享、收藏等社群互動功能
 * 遵循 practice-api-v1.md 規範，整合 Prisma ORM 與資料驗證
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { NotFoundError, InternalServerError } from '../middleware/error.middleware';
import { recordView as trackView, getViewCount } from './view-tracking.service';
import { upsertReaction, removeReaction, getReactionsByTarget } from './reaction.service';
import { ReactionTargetTypeValue, ReactionTypeValue } from '../types/reaction.types';
import {
  ApiSuccessResponse
} from '../types/api-response.types';
import {
  createSuccessResponse
} from '../utils/response-helper';

const prismaClient = prisma;

/**
 * 點讚/取消點讚
 */
export async function toggleLike(practiceId: number, userId: number, reactionType?: ReactionTypeValue): Promise<ApiSuccessResponse<{ isLiked: boolean; likeCount: number }>> {
  try {
    const practice = await prismaClient.practices.findUnique({
      where: { id: practiceId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    const targetType: ReactionTargetTypeValue = 'practice';
    const type = reactionType ?? 'useful';

    // 查詢當前用戶是否已有此反應
    const existing = await prismaClient.reactions.findUnique({
      where: {
        target_type_target_id_user_id: {
          target_type: targetType,
          target_id: practiceId,
          user_id: userId,
        },
      },
    });

    if (existing && existing.reaction_type === type) {
      // 相同反應 → 取消
      await removeReaction({ targetType, targetId: practiceId, userId });
      const stats = await getReactionsByTarget({ targetType, targetId: practiceId, currentUserId: userId });
      const total = stats.data.reactions.reduce((sum, r) => sum + r.count, 0);
      return createSuccessResponse({ isLiked: false, likeCount: total });
    } else {
      // 不同或無反應 → upsert
      await upsertReaction({ targetType, targetId: practiceId, userId, reactionType: type });
      const stats = await getReactionsByTarget({ targetType, targetId: practiceId, currentUserId: userId });
      const total = stats.data.reactions.reduce((sum, r) => sum + r.count, 0);
      return createSuccessResponse({ isLiked: true, likeCount: total });
    }
  } catch (error) {
    loggerService.error('Failed to toggle practice like', { practiceId, userId, error });
    throw error;
  }
}

/**
 * 記錄分享事件
 */
export async function recordShare(practiceId: number, userId: number, shareData?: {
  platform?: string;
  shareUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<ApiSuccessResponse<{ shareCount: number }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: practiceId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    // TODO: 實作 share 表格後再啟用分享功能
    // 暫時只記錄日誌
    const shareCount = 0; // 暫時固定為 0

    loggerService.info('Practice share recorded', {
      practiceId,
      userId,
      platform: shareData?.platform,
      shareCount
    });

    return createSuccessResponse({ shareCount });

  } catch (error) {
    loggerService.error('Failed to record practice share', { practiceId, userId, error });
    if (error instanceof NotFoundError) throw error;
    throw new InternalServerError('記錄分享失敗');
  }
}

/**
 * 收藏/取消收藏
 */
export async function toggleFavorite(practiceId: number, userId: number): Promise<ApiSuccessResponse<{ isFavorited: boolean; favoriteCount: number }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: practiceId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    // TODO: 實作 favorite 表格後再啟用收藏功能
    // 暫時返回固定值
    const isFavorited = false; // 暫時固定為未收藏
    const favoriteCount = 0; // 暫時固定為 0

    loggerService.info('Practice favorite toggled', {
      practiceId,
      userId,
      isFavorited,
      favoriteCount
    });

    return createSuccessResponse({
      isFavorited,
      favoriteCount
    });

  } catch (error) {
    loggerService.error('Failed to toggle practice favorite', { practiceId, userId, error });
    throw error;
  }
}

/**
 * 記錄瀏覽事件
 */
export async function recordView(practiceId: number, userId: number, _viewData?: {
  duration?: number;
  referrer?: string;
  metadata?: Record<string, unknown>;
}): Promise<ApiSuccessResponse<{ viewCount: number }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: practiceId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    const viewCount = await trackView('practice', practiceId, userId);
    return createSuccessResponse({ viewCount });

  } catch (error) {
    loggerService.error('Failed to record practice view', { practiceId, userId, error });
    if (error instanceof NotFoundError) throw error;
    throw new InternalServerError('記錄瀏覽失敗');
  }
}

/**
 * 記錄點擊事件
 */
export async function recordClick(practiceId: number, userId: number, clickData: {
  clickType: string;
  clickTarget?: string;
  metadata?: Record<string, unknown>;
}): Promise<ApiSuccessResponse<{ success: boolean }>> {
  try {
    // 檢查實踐是否存在
    const practice = await prismaClient.practices.findUnique({
      where: { id: practiceId }
    });

    if (!practice) {
      throw new NotFoundError('實踐不存在');
    }

    // TODO: 實作 click_events 或 view 表格後再啟用點擊記錄功能
    // 暫時只記錄日誌

    loggerService.info('Practice click recorded', {
      practiceId,
      userId,
      clickType: clickData.clickType,
      clickTarget: clickData.clickTarget
    });

    return createSuccessResponse({ success: true });

  } catch (error) {
    loggerService.error('Failed to record practice click', { practiceId, userId, clickData, error });
    if (error instanceof NotFoundError) throw error;
    throw new InternalServerError('記錄點擊失敗');
  }
}

/**
 * 取得使用者對實踐的互動狀態
 */
export async function getUserInteractionStatus(practiceId: number, userId: number): Promise<ApiSuccessResponse<{
  isLiked: boolean;
  isFavorited: boolean;
  hasViewed: boolean;
}>> {
  try {
    // TODO: 實作 reaction、favorite、view 表格後再啟用互動狀態查詢
    // 暫時返回固定值
    const reaction = null;
    const favorite = null;
    const view = null;

    return createSuccessResponse({
      isLiked: Boolean(reaction),
      isFavorited: Boolean(favorite),
      hasViewed: Boolean(view)
    });

  } catch (error) {
    loggerService.error('Failed to get user interaction status', { practiceId, userId, error });
    throw new InternalServerError('取得互動狀態失敗');
  }
}

/**
 * 取得實踐的所有互動統計
 */
export async function getInteractionStats(practiceId: number): Promise<ApiSuccessResponse<{
  likeCount: number;
  favoriteCount: number;
  shareCount: number;
  viewCount: number;
  commentCount: number;
}>> {
  try {
    // TODO: 實作 reaction、favorite、share 表格後再啟用完整統計
    // 暫時只查詢存在的表格
    const likeCount = 0; // 暫時固定為 0
    const favoriteCount = 0; // 暫時固定為 0
    const shareCount = 0; // 暫時固定為 0
    const viewCount = await getViewCount('practice', practiceId);

    // 查詢評論數（comments 表格存在）
    const commentCount = await prismaClient.comments.count({
      where: {
        target_id: practiceId,
        target_type: 'practice'
      }
    });

    return createSuccessResponse({
      likeCount,
      favoriteCount,
      shareCount,
      viewCount,
      commentCount
    });

  } catch (error) {
    loggerService.error('Failed to get interaction stats', { practiceId, error });
    throw new InternalServerError('取得互動統計失敗');
  }
}

/**
 * 取得使用者收藏的實踐列表
 */
export async function getUserFavorites(userId: number, params: {
  page?: number;
  limit?: number;
} = {}): Promise<ApiSuccessResponse<Array<{
  practiceId: number;
  favoriteAt: string;
  practice: {
    id: number;
    title: string;
    contentType: string;
    status: string;
    user: {
      id: number;
      name: string;
    };
  };
}>>> {
  try {
    // TODO: 實作 favorite 表格後再啟用收藏列表查詢
    // 暫時抑制未使用參數警告
    void params;
    
    // 暫時返回空收藏列表
    const favorites: Array<{
      practiceId: number;
      userId: number;
      createdAt: string;
      practice?: {
        id: number;
        title: string;
        description?: string;
      };
    }> = []; // 暫時返回空陣列

    const favoriteList = favorites.map(favorite => ({
      practiceId: favorite.practiceId,
      favoriteAt: favorite.createdAt,
      practice: {
        id: favorite.practiceId,
        title: 'Practice',
        contentType: 'unknown',
        status: 'active',
        user: {
          id: 0,
          name: 'Unknown User'
        }
      }
    }));

    return createSuccessResponse(favoriteList);

  } catch (error) {
    loggerService.error('Failed to get user favorites', { userId, error });
    throw new InternalServerError('取得收藏列表失敗');
  }
}