/**
 * 標籤服務 - Prisma 架構
 * 處理標籤相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import type { tags } from '../../generated/prisma';
import type { ApiSuccessResponse } from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';

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
 * 獲取熱門標籤 (內部工具函數)
 * @param limit - 限制數量
 * @returns 熱門標籤列表
 */
export async function getPopularTags(limit = 20): Promise<Array<{
  tag: tags;
  usageCount: number;
}>> {
  const tagUsage = await prisma.entity_tags.groupBy({
    by: ['tag_id'],
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

  const popularTags = await Promise.all(
    tagUsage.map(async (usage) => {
      const tag = await prisma.tags.findUnique({
        where: { id: usage.tag_id }
      });
      
      return {
        tag: tag as tags,
        usageCount: usage._count.tag_id
      };
    })
  );

  return popularTags;
}

/**
 * 獲取熱門標籤 (API 版本)
 * @param limit - 限制數量
 * @returns API 回應格式的熱門標籤列表
 */
export async function getPopularTagsApi(limit = 20): Promise<ApiSuccessResponse<Array<{
  tag: tags;
  usageCount: number;
}>>> {
  try {
    const popularTags = await getPopularTags(limit);
    return createSuccessResponse(popularTags, {
      filters: {
        limit
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
  setEntityTags,
  getEntityTags,
  removeEntityTag,
  getTagUsageStats,
  getPopularTags,
  cleanupUnusedTags,
  
  // API 版本函數
  getTagByIdApi,
  getAllTagsApi,
  searchTagsApi,
  getEntityTagsApi,
  getTagUsageStatsApi,
  getPopularTagsApi,
  cleanupUnusedTagsApi
};