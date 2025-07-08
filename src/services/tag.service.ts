/**
 * 標籤服務 - Prisma 架構
 * 處理標籤相關的業務邏輯
 */

import { prisma } from '@/services/database/prisma.service';
import type { tags, entity_tags, Prisma } from '../../generated/prisma';

/**
 * 創建標籤
 * @param name - 標籤名稱
 * @param transaction - 事務對象
 * @returns 創建的標籤
 */
export async function createTag(
  name: string,
  transaction?: any
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
 * 根據 ID 獲取標籤
 * @param id - 標籤 ID
 * @returns 標籤信息
 */
export async function getTagById(id: number): Promise<tags | null> {
  return await prisma.tags.findUnique({
    where: { id }
  });
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
 * 獲取所有標籤
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
 * 搜尋標籤
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
 * 為實體設置標籤
 * @param entityType - 實體類型 (resource, idea, etc.)
 * @param entityId - 實體 ID
 * @param tagNames - 標籤名稱列表
 * @param userId - 創建者 ID
 * @param transaction - 事務對象
 */
export async function setEntityTags(
  entityType: string,
  entityId: string,
  tagNames: string[],
  userId: number,
  transaction?: any
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
 * 獲取實體的標籤
 * @param entityType - 實體類型
 * @param entityId - 實體 ID
 * @returns 標籤列表
 */
export async function getEntityTags(
  entityType: string,
  entityId: string
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
 * 刪除實體標籤關聯
 * @param entityType - 實體類型
 * @param entityId - 實體 ID
 * @param tagId - 標籤 ID
 * @param transaction - 事務對象
 */
export async function removeEntityTag(
  entityType: string,
  entityId: string,
  tagId: number,
  transaction?: any
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
 * 獲取標籤使用統計
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
 * 獲取熱門標籤
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
        tag: tag!,
        usageCount: usage._count.tag_id
      };
    })
  );

  return popularTags;
}

/**
 * 刪除未使用的標籤
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

// 匯出所有函數
export default {
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
  cleanupUnusedTags
};