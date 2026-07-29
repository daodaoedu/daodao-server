/**
 * Me service
 * Handles personal user data endpoints for /api/v1/me
 * Integrates with existing services while providing clean interfaces
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import * as practiceService from './practice.service';
import * as resourceService from './resource.service';
import {
  MyPracticeItem,
  MyLearningFootprintItem,
  PracticeStatsData,
  MyResourceItem,
  UserPreference
} from '../types/me.types';
import {
  ApiSuccessResponse,
  PaginatedApiResponse
} from '../types/api-response.types';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '../utils/response-helper';
import { calculatePagination } from '../utils/pagination-helper';
import { z } from 'zod';
import {
  MePracticesQueryParams,
  PracticeStatsQueryParams,
  ResourcesQueryParams,
  PreferencesQueryParams,
  MyFootprintsQueryParams,
  myResourcesApiResponseSchema,
  myPreferencesApiResponseSchema,
  updatePreferencesApiResponseSchema
} from '../validators/me.validators';

/**
 * Get user's practices with filtering and pagination
 */
const getMyPractices = async (userId: number, params: MePracticesQueryParams): Promise<PaginatedApiResponse<MyPracticeItem>> => {
  try {
    // Leverage existing practice service
    const result = await practiceService.findUserPractices(userId, {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status,
      sortBy: params.sortBy as 'createdAt' | 'updatedAt' | 'likeCount',
      sortOrder: params.sortOrder,
      userId
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to fetch practices');
    }

    // Transform to match MyPracticeItem interface（排除 user、checkIns 與 stats 中尚未實作的欄位，
    // 只帶出有真實資料的 viewCount / commentCount）
    const practices: MyPracticeItem[] = result.data.map(practice => ({
      id: practice.id,
      title: practice.title,
      practiceAction: practice.practiceAction,
      startDate: practice.startDate,
      endDate: practice.endDate,
      durationDays: practice.durationDays,
      frequencyMinDays: practice.frequencyMinDays,
      frequencyMaxDays: practice.frequencyMaxDays,
      sessionDurationMinutes: practice.sessionDurationMinutes,
      practiceTimePeriods: practice.practiceTimePeriods,
      otherContext: practice.otherContext,
      status: practice.status,
      privacyStatus: practice.privacyStatus,
      hasResources: practice.hasResources,
      progressPercentage: practice.progressPercentage,
      firstCheckinAt: practice.firstCheckinAt,
      lastCheckinAt: practice.lastCheckinAt,
      checkInCount: practice.checkInCount,
      themeColor: practice.themeColor,
      createdAt: practice.createdAt,
      updatedAt: practice.updatedAt,
      tags: practice.tags,
      viewCount: practice.stats.viewCount,
      commentCount: practice.stats.commentCount
    }));

    loggerService.info('User practices retrieved', { 
      userId, 
      count: practices.length,
      filters: params 
    });

    const totalItems = result.pagination?.totalItems || practices.length;
    const paginationInfo = calculatePagination(params.page, params.limit, totalItems);

    return createPaginatedResponse(
      practices,
      paginationInfo,
      {
        filters: params
      }
    );

  } catch (error) {
    loggerService.error('Failed to get user practices', { userId, error });
    throw error;
  }
};

/**
 * Get user's practice statistics
 */
const getMyPracticeStats = async (userId: number, params: PracticeStatsQueryParams): Promise<ApiSuccessResponse<PracticeStatsData>> => {
  try {
    // Get basic stats from existing service
    const basicStats = await practiceService.getUserStats(userId);
    
    if (!basicStats.success || !basicStats.data) {
      throw new Error('Failed to fetch basic stats');
    }

    // Calculate additional statistics
    const [practicesByCategory, recentActivity, achievements] = await Promise.all([
      getPracticesByCategory(userId, params.includeArchived),
      getRecentActivity(userId, params.timeRange),
      getAchievements(userId)
    ]);

    const [timeStats, progressStats] = await Promise.all([
      getTimeStats(userId, params.timeRange),
      getProgressStats(userId)
    ]);

    const stats: PracticeStatsData = {
      totalPractices: basicStats.data.totalPractices,
      activePractices: basicStats.data.activePractices,
      completedPractices: basicStats.data.completedPractices,
      archivedPractices: 0, // Will calculate separately if needed
      totalCheckIns: basicStats.data.totalCheckIns,
      currentStreak: basicStats.data.maxStreak, // Use max streak as current for now
      maxStreak: basicStats.data.maxStreak,
      averageProgress: progressStats.averageProgress,
      timeSpentToday: timeStats.today,
      timeSpentThisWeek: timeStats.week,
      timeSpentThisMonth: timeStats.month,
      practicesByCategory,
      recentActivity,
      achievements
    };

    loggerService.info('User practice stats calculated', { userId, timeRange: params.timeRange });

    return createSuccessResponse(stats, {
      timeRange: params.timeRange,
      includeArchived: params.includeArchived
    });

  } catch (error) {
    loggerService.error('Failed to get user practice stats', { userId, error });
    throw error;
  }
};

/**
 * Get user's personal resource drafts
 */
type MyResourcesApiResponse = z.infer<typeof myResourcesApiResponseSchema>;

const getMyResources = async (userId: number, params: ResourcesQueryParams): Promise<MyResourcesApiResponse> => {
  try {
    const { page, limit, category, type, status, search, sortBy, sortOrder, tags } = params;

    // Use existing resource service
    const result = await resourceService.getResources(
      {
        createdBy: userId,
        majorCategory: category,
        type: type,
        status: status || 'draft', // Default to drafts for personal resources
        query: search,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : undefined
      },
      {
        limit: Math.min(limit, 100),
        sort: sortBy,
        order: sortOrder
      }
    );

    // Transform to MyResourceItem format
    const myResources: MyResourceItem[] = result.data.map((resource: unknown) => {
      const resourceData = resource as Record<string, unknown>;
      return {
        id: resourceData.id as string, // external_id as string
        name: resourceData.name as string,
        description: (resourceData.description as string) || undefined,
        url: (resourceData.url as string) || undefined,
        type: mapResourceType((resourceData.type as string) || ''),
        category: (resourceData.majorCategory as string) || undefined,
        status: (resourceData.status as 'draft' | 'published' | 'archived') || 'draft',
        tags: (resourceData.tags as string[]) || [],
        createdAt: resourceData.createdAt as string,
        updatedAt: resourceData.updatedAt as string,
        visibility: 'private', // Personal resources are private by default
        metadata: undefined // ResourceResponse doesn't include metadata
      };
    });

    // Get stats using existing resource service
    const stats = await getResourceStatsFromService(userId);

    // Convert cursor-based pagination to page-based for consistent API
    const totalItems = result.pagination?.count || myResources.length;
    const paginationInfo = calculatePagination(page, limit, totalItems);

    loggerService.info('User resources retrieved', { userId, count: myResources.length });

    // Return response with stats at top level (matching myResourcesApiResponseSchema)
    return {
      success: true as const,
      data: myResources,
      pagination: paginationInfo,
      stats,
      timestamp: new Date().toISOString(),
      meta: { filters: params }
    };

  } catch (error) {
    loggerService.error('Failed to get user resources', { userId, error });
    throw error;
  }
};

/**
 * Get user's preferences
 */
type MyPreferencesApiResponse = z.infer<typeof myPreferencesApiResponseSchema>;

const getMyPreferences = async (userId: number, _params: PreferencesQueryParams): Promise<MyPreferencesApiResponse> => {
  try {
    const where: Record<string, unknown> = { user_id: userId };

    const userPreferences = await prisma.user_preferences.findMany({
      where,
      include: {
        preference_options: {
          include: {
            preference_types: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Transform preferences
    const preferences: UserPreference[] = userPreferences.map(pref => ({
      id: pref.id,
      preferenceTypeId: pref.preference_options.preference_types.id,
      optionId: pref.preference_option_id,
      isSelected: pref.is_selected || false,
      preferenceType: {
        id: pref.preference_options.preference_types.id,
        name: pref.preference_options.preference_types.name,
        value: pref.preference_options.preference_types.value,
        description: pref.preference_options.preference_types.description ?? null,
        maxSelections: pref.preference_options.preference_types.max_selections ?? null,
        options: [] // Will be populated separately if needed
      },
      option: {
        id: pref.preference_options.id,
        value: pref.preference_options.value,
        name: pref.preference_options.name,
        description: pref.preference_options.description ?? null
      }
    }));

    // Group by preference types for categories
    const categoriesMap = new Map();
    preferences.forEach(pref => {
      const typeId = pref.preferenceTypeId;
      if (!categoriesMap.has(typeId)) {
        categoriesMap.set(typeId, {
          type: pref.preferenceType,
          userSelections: []
        });
      }
      categoriesMap.get(typeId).userSelections.push({
        optionId: pref.optionId,
        isSelected: pref.isSelected,
      });
    });

    const categories = Array.from(categoriesMap.values());

    // Get last updated timestamp
    const lastUpdated = userPreferences.length > 0 && userPreferences[0].updated_at
      ? userPreferences[0].updated_at.toISOString()
      : undefined;

    const stats = {
      totalPreferences: preferences.length,
      activeSelections: preferences.filter(p => p.isSelected).length,
      lastUpdated
    };

    loggerService.info('User preferences retrieved', { userId, count: preferences.length });

    // Return response with stats at top level (matching myPreferencesApiResponseSchema)
    return {
      success: true as const,
      data: { preferences, categories },
      stats,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    loggerService.error('Failed to get user preferences', { userId, error });
    throw error;
  }
};

/**
 * Update user preferences
 */
type UpdatePreferencesApiResponse = z.infer<typeof updatePreferencesApiResponseSchema>;

const updateMyPreferences = async (userId: number, request: { preferences: Array<{ preferenceTypeId: number; optionId: number; isSelected: boolean }> }): Promise<UpdatePreferencesApiResponse> => {
  try {
    let updated = 0;
    let created = 0;
    let deleted = 0;

    // Process each preference update
    for (const pref of request.preferences) {
      if (pref.isSelected) {
        // Check if preference exists
        const existing = await prisma.user_preferences.findFirst({
          where: {
            user_id: userId,
            preference_option_id: pref.optionId
          }
        });

        if (existing) {
          // Update existing preference
          await prisma.user_preferences.update({
            where: { id: existing.id },
            data: {
              is_selected: pref.isSelected,
              updated_at: new Date()
            }
          });
          updated++;
        } else {
          // Create new preference
          await prisma.user_preferences.create({
            data: {
              user_id: userId,
              preference_option_id: pref.optionId,
              is_selected: pref.isSelected,
              access_count: 0
            }
          });
          created++;
        }
      } else {
        // Delete preference if not selected
        const deleteResult = await prisma.user_preferences.deleteMany({
          where: {
            user_id: userId,
            preference_option_id: pref.optionId
          }
        });
        deleted += deleteResult.count;
      }
    }

    loggerService.info('User preferences updated', {
      userId,
      updated,
      created,
      deleted
    });

    // Return response with message at top level (matching updatePreferencesApiResponseSchema)
    return {
      success: true as const,
      data: { updated, created, deleted },
      message: `偏好設定已更新：更新 ${updated} 項，新增 ${created} 項，刪除 ${deleted} 項`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    loggerService.error('Failed to update user preferences', { userId, error });
    throw error;
  }
};

/**
 * Get user's learning footprints (comments on practices), paginated
 */
const getMyLearningFootprints = async (
  userId: number,
  params: MyFootprintsQueryParams
): Promise<PaginatedApiResponse<MyLearningFootprintItem>> => {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    // Fetch comments left by the user on practices
    const [comments, totalItems] = await Promise.all([
      prisma.comments.findMany({
        where: {
          user_id: userId,
          target_type: 'practice'
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          created_at: true,
          target_id: true
        }
      }),
      prisma.comments.count({
        where: {
          user_id: userId,
          target_type: 'practice'
        }
      })
    ]);

    // Batch-fetch associated practices to avoid N+1
    const practiceIds = [...new Set(comments.map(c => c.target_id))];
    const practices = practiceIds.length > 0
      ? await prisma.practices.findMany({
          where: { id: { in: practiceIds } },
          select: {
            id: true,
            external_id: true,
            title: true,
            deleted_at: true
          }
        })
      : [];

    const practicesById = new Map(practices.map(p => [p.id, p]));

    const footprints: MyLearningFootprintItem[] = comments.map(comment => {
      const practice = practicesById.get(comment.target_id);
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at?.toISOString() ?? new Date().toISOString(),
        practiceId: practice?.external_id ?? '',
        practiceTitle: practice?.title ?? '',
        practiceDeleted: practice === undefined || (practice.deleted_at !== null && practice.deleted_at !== undefined)
      };
    });

    loggerService.info('User learning footprints retrieved', {
      userId,
      count: footprints.length,
      page,
      limit
    });

    const paginationInfo = calculatePagination(page, limit, totalItems);

    return createPaginatedResponse(footprints, paginationInfo);
  } catch (error) {
    loggerService.error('Failed to get user learning footprints', { userId, error });
    throw error;
  }
};

// Helper functions

const getPracticesByCategory = async (userId: number, includeArchived: boolean): Promise<Array<{ category: string; count: number; avgProgress: number }>> => {
  const where: Record<string, unknown> = { user_id: userId };
  if (!includeArchived) {
    where.status = { not: 'archived' };
  }

  // Note: content_type field doesn't exist in schema
  // Group by status instead as a fallback
  const practices = await prisma.practices.groupBy({
    by: ['status'],
    where,
    _count: { id: true }
  });

  return practices.map(p => ({
    category: p.status || 'unknown',
    count: p._count?.id || 0,
    avgProgress: 0 // current_progress field doesn't exist in schema
  }));
};

const getRecentActivity = async (_userId: number, timeRange: string): Promise<Array<{ date: string; checkInCount: number; timeSpent: number }>> => {
  const days = getTimeRangeDays(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // This is a simplified implementation
  // In a real scenario, you'd query check-in data
  const activity = [];
  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    activity.push({
      date: date.toISOString().split('T')[0],
      checkInCount: Math.floor(Math.random() * 5), // Mock data
      timeSpent: Math.floor(Math.random() * 120) // Mock data
    });
  }

  return activity.reverse();
};

const getAchievements = async (userId: number): Promise<Array<{ type: 'streak' | 'completion' | 'consistency'; milestone: number; achievedAt: string; description: string }>> => {
  // This would typically query an achievements table
  // For now, return mock data based on user stats
  const stats = await practiceService.getUserStats(userId);
  const achievements = [];

  if (stats.success && stats.data) {
    if (stats.data.maxStreak >= 7) {
      achievements.push({
        type: 'streak' as const,
        milestone: 7,
        achievedAt: new Date().toISOString(),
        description: '連續簽到 7 天'
      });
    }

    if (stats.data.completedPractices > 0) {
      achievements.push({
        type: 'completion' as const,
        milestone: stats.data.completedPractices,
        achievedAt: new Date().toISOString(),
        description: `完成 ${stats.data.completedPractices} 個實踐`
      });
    }
  }

  return achievements;
};

const getTimeStats = async (_userId: number, _timeRange: string): Promise<{ today: number; week: number; month: number }> => {
  // This would typically query check-in time data
  // For now, return mock data
  return {
    today: Math.floor(Math.random() * 120),
    week: Math.floor(Math.random() * 500),
    month: Math.floor(Math.random() * 2000)
  };
};

const getProgressStats = async (userId: number): Promise<{ averageProgress: number }> => {
  // 進度改用打卡次數計算
  const result = await prisma.practice_checkins.count({
    where: {
      user_id: userId,
      practices: {
        status: { not: 'archived' }
      }
    }
  });

  // 計算每個 practice 的平均打卡次數
  const practiceCount = await prisma.practices.count({
    where: {
      user_id: userId,
      status: { not: 'archived' }
    }
  });

  return {
    averageProgress: practiceCount > 0 ? Math.round(result / practiceCount) : 0
  };
};

const getResourceStatsFromService = async (userId: number): Promise<{ totalResources: number; draftCount: number; publishedCount: number; byCategory: Record<string, number> }> => {
  try {
    // Use existing resource service stats method if available
    const serviceStats = await resourceService.getResourceStats(userId);
    
    // Check if it's a success response and has data
    if ('success' in serviceStats && serviceStats.success && serviceStats.data) {
      return {
        totalResources: serviceStats.data.totalResources || 0,
        draftCount: 0, // Current service doesn't provide status breakdown
        publishedCount: serviceStats.data.activeResources || 0,
        byCategory: serviceStats.data.typeStats || {}
      };
    }
    
    // Fallback for non-standard response
    return {
      totalResources: (serviceStats as unknown as Record<string, unknown>).totalResources as number || 0,
      draftCount: 0,
      publishedCount: (serviceStats as unknown as Record<string, unknown>).activeResources as number || 0,
      byCategory: (serviceStats as unknown as Record<string, unknown>).typeStats as Record<string, number> || {}
    };
  } catch (error) {
    // Fallback to direct database query if service method fails
    loggerService.warn('Failed to get stats from resource service, using fallback', { userId, error });
    return getResourceStatsFallback(userId);
  }
};

const getResourceStatsFallback = async (userId: number): Promise<{ totalResources: number; draftCount: number; publishedCount: number; byCategory: Record<string, number> }> => {
  const [totalCount, statusCounts] = await Promise.all([
    prisma.resources.count({
      where: { created_by: userId }
    }),
    prisma.resources.groupBy({
      by: ['status'],
      where: { created_by: userId },
      _count: { id: true }
    })
  ]);

  return {
    totalResources: totalCount,
    draftCount: statusCounts.find(s => s.status === 'draft')?._count.id || 0,
    publishedCount: statusCounts.find(s => s.status === 'published')?._count.id || 0,
    byCategory: {} // Would need proper category mapping
  };
};

const mapResourceType = (type: string): 'link' | 'file' | 'note' | 'draft' => {
  switch (type.toLowerCase()) {
    case 'url':
    case 'link':
      return 'link';
    case 'file':
    case 'document':
      return 'file';
    case 'note':
    case 'text':
      return 'note';
    default:
      return 'draft';
  }
};

const getTimeRangeDays = (timeRange: string): number => {
  switch (timeRange) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
};

// 匯出服務函數
export const meService = {
  getMyPractices,
  getMyPracticeStats,
  getMyResources,
  getMyPreferences,
  updateMyPreferences,
  getMyLearningFootprints
} as const;

export default meService;