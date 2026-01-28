/**
 * 標籤服務 - Prisma 架構
 * 處理標籤相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import { redis } from './database/redis.service';
import type { tags } from '../../generated/prisma';
import type { ApiSuccessResponse } from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';

// ============================================================================
// 快取設定
// ============================================================================

/** 熱門標籤快取過期時間（秒） */
const POPULAR_TAGS_CACHE_TTL = 5 * 60; // 5 分鐘

/** 快取 key 前綴 */
const CACHE_PREFIX = 'tags:';

/**
 * 生成熱門標籤快取 key
 */
function getPopularTagsCacheKey(
  limit: number,
  entityType?: string,
  timeRange?: string
): string {
  return `${CACHE_PREFIX}popular:${limit}:${entityType || 'all'}:${timeRange || 'all'}`;
}

/**
 * 從快取取得資料
 */
async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    // 快取錯誤不應影響正常功能，僅記錄錯誤
    console.error('Redis cache get error:', error);
    return null;
  }
}

/**
 * 設定快取資料
 */
async function setCache(key: string, data: unknown, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    // 快取錯誤不應影響正常功能，僅記錄錯誤
    console.error('Redis cache set error:', error);
  }
}

/**
 * 清除熱門標籤相關快取
 * 當標籤資料變更時呼叫
 */
export async function clearPopularTagsCache(): Promise<void> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}popular:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis cache clear error:', error);
  }
}

// ============================================================================
// 核心服務函數
// ============================================================================

// 定義事務類型
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * 創建標籤
 * @param name - 標籤名稱
 * @param transaction - 事務對象
 * @returns 創建的標籤
 */
export async function createTag(
  name: string,
  transaction?: TransactionClient | typeof prisma
): Promise<tags> {
  const tx = transaction || prisma;

  // 檢查標籤是否已存在
  let tag = await tx.tags.findUnique({
    where: { name }
  });

  if (!tag) {
    // 創建新標籤
    tag = await tx.tags.create({ 
      data: { name } 
    });
  }

  return tag;
}

/**
 * 根據 ID 獲取標籤 (內部工具函數)
 * @param id - 標籤 ID
 * @returns 標籤信息
 */
export async function getTagById(id: number): Promise<tags | null> {
  return await prisma.tags.findUnique({
    where: { id }
  });
}

/**
 * 根據 ID 獲取標籤 (API 版本)
 * @param id - 標籤 ID
 * @returns API 回應格式的標籤信息
 */
export async function getTagByIdApi(id: number): Promise<ApiSuccessResponse<tags | null>> {
  try {
    const tag = await getTagById(id);
    return createSuccessResponse(tag);
  } catch (error) {
    throw error instanceof Error ? error : new Error('獲取標籤失敗');
  }
}

/**
 * 根據名稱獲取標籤
 * @param name - 標籤名稱
 * @returns 標籤信息
 */
export async function getTagByName(name: string): Promise<tags | null> {
  return await prisma.tags.findUnique({
    where: { name }
  });
}

/**
 * 獲取所有標籤 (內部工具函數)
 * @param limit - 限制數量
 * @param offset - 偏移量
 * @returns 標籤列表
 */
export async function getAllTags(limit?: number, offset?: number): Promise<tags[]> {
  return await prisma.tags.findMany({
    orderBy: { name: 'asc' },
    take: limit,
    skip: offset
  });
}

/**
 * 獲取所有標籤 (API 版本)
 * @param limit - 限制數量
 * @param offset - 偏移量
 * @returns API 回應格式的標籤列表
 */
export async function getAllTagsApi(limit?: number, offset?: number): Promise<ApiSuccessResponse<tags[]>> {
  try {
    const tags = await getAllTags(limit, offset);
    return createSuccessResponse(tags, {
      filters: {
        limit,
        offset
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('獲取標籤列表失敗');
  }
}

/**
 * 搜尋標籤 (內部工具函數)
 * @param query - 搜尋關鍵字
 * @param limit - 限制數量
 * @returns 標籤列表
 */
export async function searchTags(query: string, limit = 10): Promise<tags[]> {
  return await prisma.tags.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    },
    orderBy: { name: 'asc' },
    take: limit
  });
}

/**
 * 搜尋標籤 (API 版本)
 * @param query - 搜尋關鍵字
 * @param limit - 限制數量
 * @returns API 回應格式的標籤列表
 */
export async function searchTagsApi(query: string, limit = 10): Promise<ApiSuccessResponse<tags[]>> {
  try {
    const tags = await searchTags(query, limit);
    return createSuccessResponse(tags, {
      searchQuery: query,
      filters: {
        limit
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('搜尋標籤失敗');
  }
}

/**
 * 標籤建議結果類型
 */
export interface TagSuggestion {
  id: number;
  name: string;
  count: number;
  matchType: 'exact' | 'prefix' | 'contains';
}

/**
 * 標籤建議 (內部工具函數)
 * 用於輸入時的自動補全，優先顯示前綴匹配和熱門標籤
 * @param query - 搜尋關鍵字
 * @param limit - 限制數量
 * @returns 標籤建議列表（含使用次數和匹配類型）
 */
export async function suggestTags(query: string, limit = 10): Promise<TagSuggestion[]> {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  // 查詢所有匹配的標籤（包含匹配）
  const matchingTags = await prisma.tags.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    },
    take: limit * 3 // 多取一些以便排序後篩選
  });

  if (matchingTags.length === 0) {
    return [];
  }

  // 取得這些標籤的使用次數
  const tagIds = matchingTags.map(tag => tag.id);
  const usageCounts = await prisma.entity_tags.groupBy({
    by: ['tag_id'],
    where: {
      tag_id: { in: tagIds }
    },
    _count: {
      tag_id: true
    }
  });

  // 建立使用次數映射
  const countMap = new Map(
    usageCounts.map(item => [item.tag_id, item._count.tag_id])
  );

  // 計算每個標籤的排序分數
  const scoredTags = matchingTags.map(tag => {
    const tagNameLower = tag.name.toLowerCase();
    const count = countMap.get(tag.id) || 0;

    // 判斷匹配類型
    let matchType: 'exact' | 'prefix' | 'contains';
    let matchScore: number;

    if (tagNameLower === normalizedQuery) {
      matchType = 'exact';
      matchScore = 100;
    } else if (tagNameLower.startsWith(normalizedQuery)) {
      matchType = 'prefix';
      matchScore = 80;
    } else {
      matchType = 'contains';
      matchScore = 40;
    }

    // 總分 = 匹配類型分數 + 使用次數加權（使用 log 避免熱門標籤過度主導）
    const totalScore = matchScore + Math.log(count + 1) * 5;

    return {
      id: tag.id,
      name: tag.name,
      count,
      matchType,
      score: totalScore
    };
  });

  // 按分數排序並取前 limit 個
  return scoredTags
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ id, name, count, matchType }) => ({
      id,
      name,
      count,
      matchType
    }));
}

/**
 * 標籤建議 (API 版本)
 * @param query - 搜尋關鍵字
 * @param limit - 限制數量
 * @returns API 回應格式的標籤建議列表
 */
export async function suggestTagsApi(
  query: string,
  limit = 10
): Promise<ApiSuccessResponse<TagSuggestion[]>> {
  try {
    const suggestions = await suggestTags(query, limit);
    return createSuccessResponse(suggestions, {
      searchQuery: query,
      filters: { limit }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('取得標籤建議失敗');
  }
}

/**
 * 為實體設置標籤
 * @param entityType - 實體類型 (resource, idea, etc.)
 * @param entityId - 實體 ID
 * @param tagNames - 標籤名稱列表
 * @param userId - 創建者 ID
 * @param transaction - 事務對象
 */
export async function setEntityTags(
  entityType: string,
  entityId: number,
  tagNames: string[],
  userId: number,
  transaction?: TransactionClient | typeof prisma
): Promise<void> {
  const tx = transaction || prisma;

  // 刪除現有的標籤關聯
  await tx.entity_tags.deleteMany({
    where: {
      entity_type: entityType,
      entity_id: entityId
    }
  });

  // 創建新的標籤關聯
  for (const tagName of tagNames) {
    // 創建或獲取標籤
    const tag = await createTag(tagName.trim(), tx);

    // 創建實體標籤關聯
    await tx.entity_tags.create({
      data: {
        entity_type: entityType,
        entity_id: entityId,
        tag_id: tag.id,
        created_by: userId
      }
    });
  }

  // 清除熱門標籤快取（標籤使用次數已變更）
  await clearPopularTagsCache();
}

/**
 * 獲取實體的標籤 (內部工具函數)
 * @param entityType - 實體類型
 * @param entityId - 實體 ID
 * @returns 標籤列表
 */
export async function getEntityTags(
  entityType: string,
  entityId: number
): Promise<tags[]> {
  const entityTags = await prisma.entity_tags.findMany({
    where: {
      entity_type: entityType,
      entity_id: entityId
    },
    include: {
      tags: true
    },
    orderBy: {
      tags: {
        name: 'asc'
      }
    }
  });

  return entityTags.map(et => et.tags);
}

/**
 * 獲取實體的標籤 (API 版本)
 * @param entityType - 實體類型
 * @param entityId - 實體 ID
 * @returns API 回應格式的標籤列表
 */
export async function getEntityTagsApi(
  entityType: string,
  entityId: number
): Promise<ApiSuccessResponse<tags[]>> {
  try {
    const tags = await getEntityTags(entityType, entityId);
    return createSuccessResponse(tags, {
      filters: {
        entityType,
        entityId
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('獲取實體標籤失敗');
  }
}

/**
 * 刪除實體標籤關聯
 * @param entityType - 實體類型
 * @param entityId - 實體 ID
 * @param tagId - 標籤 ID
 * @param transaction - 事務對象
 */
export async function removeEntityTag(
  entityType: string,
  entityId: number,
  tagId: number,
  transaction?: TransactionClient | typeof prisma
): Promise<void> {
  const tx = transaction || prisma;

  await tx.entity_tags.deleteMany({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      tag_id: tagId
    }
  });

  // 清除熱門標籤快取（標籤使用次數已變更）
  await clearPopularTagsCache();
}

/**
 * 獲取標籤使用統計 (內部工具函數)
 * @param tagId - 標籤 ID
 * @returns 使用統計
 */
export async function getTagUsageStats(tagId: number): Promise<{
  totalUsage: number;
  resourceCount: number;
  ideaCount: number;
}> {
  const [totalUsage, resourceCount, ideaCount] = await Promise.all([
    prisma.entity_tags.count({
      where: { tag_id: tagId }
    }),
    prisma.entity_tags.count({
      where: { 
        tag_id: tagId,
        entity_type: 'resource'
      }
    }),
    prisma.entity_tags.count({
      where: { 
        tag_id: tagId,
        entity_type: 'idea'
      }
    })
  ]);

  return {
    totalUsage,
    resourceCount,
    ideaCount
  };
}

/**
 * 獲取標籤使用統計 (API 版本)
 * @param tagId - 標籤 ID
 * @returns API 回應格式的使用統計
 */
export async function getTagUsageStatsApi(tagId: number): Promise<ApiSuccessResponse<{
  totalUsage: number;
  resourceCount: number;
  ideaCount: number;
}>> {
  try {
    const stats = await getTagUsageStats(tagId);
    return createSuccessResponse(stats, {
      aggregateData: {
        tagId,
        breakdown: {
          resources: stats.resourceCount,
          ideas: stats.ideaCount,
          total: stats.totalUsage
        }
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('獲取標籤統計失敗');
  }
}

/**
 * 時間範圍類型
 */
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * 計算時間範圍的起始日期
 */
function getTimeRangeStartDate(timeRange: TimeRange): Date | null {
  if (timeRange === 'all') {
    return null;
  }

  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * 獲取熱門標籤 (內部工具函數)
 * @param limit - 限制數量
 * @param entityType - 可選的實體類型篩選 (resource, idea, project, practice, review)
 * @param timeRange - 時間範圍篩選，用於時間衰減（預設 'all' 表示全部時間）
 * @returns 熱門標籤列表
 */
export async function getPopularTags(
  limit = 20,
  entityType?: string,
  timeRange: TimeRange = 'all'
): Promise<Array<{
  tag: tags;
  usageCount: number;
}>> {
  // 嘗試從快取取得
  const cacheKey = getPopularTagsCacheKey(limit, entityType, timeRange);
  const cached = await getFromCache<Array<{ tag: tags; usageCount: number }>>(cacheKey);
  if (cached) {
    return cached;
  }

  // 建立 where 條件
  const whereCondition: Record<string, unknown> = {};

  if (entityType) {
    whereCondition.entity_type = entityType;
  }

  // 加入時間範圍篩選
  const startDate = getTimeRangeStartDate(timeRange);
  if (startDate) {
    whereCondition.created_at = {
      gte: startDate
    };
  }

  // 統計每個標籤被使用的次數
  const tagUsage = await prisma.entity_tags.groupBy({
    by: ['tag_id'],
    where: whereCondition,
    _count: {
      tag_id: true
    },
    orderBy: {
      _count: {
        tag_id: 'desc'
      }
    },
    take: limit
  });

  // 如果沒有結果，直接返回空陣列
  if (tagUsage.length === 0) {
    return [];
  }

  // 一次查詢取得所有標籤（解決 N+1 問題）
  const tagIds = tagUsage.map(usage => usage.tag_id);
  const tagsData = await prisma.tags.findMany({
    where: {
      id: { in: tagIds }
    }
  });

  // 建立 tagId -> tag 的映射
  const tagMap = new Map(tagsData.map(tag => [tag.id, tag]));

  // 組合結果，保持原本的排序
  const popularTags = tagUsage
    .map(usage => {
      const tag = tagMap.get(usage.tag_id);
      if (!tag) return null;
      return {
        tag,
        usageCount: usage._count.tag_id
      };
    })
    .filter((item): item is { tag: tags; usageCount: number } => item !== null);

  // 寫入快取
  await setCache(cacheKey, popularTags, POPULAR_TAGS_CACHE_TTL);

  return popularTags;
}

/**
 * 獲取熱門標籤 (API 版本)
 * @param limit - 限制數量
 * @param entityType - 可選的實體類型篩選
 * @param timeRange - 時間範圍篩選
 * @returns API 回應格式的熱門標籤列表
 */
export async function getPopularTagsApi(
  limit = 20,
  entityType?: string,
  timeRange: TimeRange = 'all'
): Promise<ApiSuccessResponse<Array<{
  tag: tags;
  usageCount: number;
}>>> {
  try {
    const popularTags = await getPopularTags(limit, entityType, timeRange);
    return createSuccessResponse(popularTags, {
      filters: {
        limit,
        ...(entityType && { entityType }),
        ...(timeRange !== 'all' && { timeRange })
      },
      aggregateData: {
        totalTags: popularTags.length,
        topUsage: popularTags[0]?.usageCount || 0
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('獲取熱門標籤失敗');
  }
}

/**
 * 刪除未使用的標籤 (內部工具函數)
 * @returns 刪除的標籤數量
 */
export async function cleanupUnusedTags(): Promise<number> {
  // 查找沒有被使用的標籤
  const unusedTags = await prisma.tags.findMany({
    where: {
      entity_tags: {
        none: {}
      }
    }
  });

  if (unusedTags.length === 0) {
    return 0;
  }

  // 刪除未使用的標籤
  const result = await prisma.tags.deleteMany({
    where: {
      id: {
        in: unusedTags.map(tag => tag.id)
      }
    }
  });

  return result.count;
}

/**
 * 刪除未使用的標籤 (API 版本)
 * @returns API 回應格式的刪除結果
 */
export async function cleanupUnusedTagsApi(): Promise<ApiSuccessResponse<{ deletedCount: number }>> {
  try {
    const deletedCount = await cleanupUnusedTags();
    return createSuccessResponse({ deletedCount }, {
      message: `已刪除 ${deletedCount} 個未使用的標籤`,
      aggregateData: {
        cleanupResult: {
          deletedTags: deletedCount,
          cleanupDate: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('清理標籤失敗');
  }
}

// 匯出所有函數 (包含 API 版本)
export default {
  // 內部工具函數
  createTag,
  getTagById,
  getTagByName,
  getAllTags,
  searchTags,
  suggestTags,
  setEntityTags,
  getEntityTags,
  removeEntityTag,
  getTagUsageStats,
  getPopularTags,
  cleanupUnusedTags,
  clearPopularTagsCache,

  // API 版本函數
  getTagByIdApi,
  getAllTagsApi,
  searchTagsApi,
  suggestTagsApi,
  getEntityTagsApi,
  getTagUsageStatsApi,
  getPopularTagsApi,
  cleanupUnusedTagsApi
};