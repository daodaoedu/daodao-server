/**
 * 資源服務 - Prisma 架構
 * 處理資源相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import type { Prisma } from '../../generated/prisma';
import { 
  transformResourceToApi, 
  transformResourceToDb
} from './transform.service';
import { 
  NotFoundError, 
  ForbiddenError 
} from '../middleware/error.middleware';
import { 
  decodeCursor, 
  generatePaginationMetadata 
} from '../utils/transform-utils';
import { createResourceSchema, updateResourceSchema } from '../validators/resource.validator';
import { DEFAULT_RESOURCE_PAGE_LIMIT, MAX_RESOURCE_PAGE_LIMIT } from '../constants/mappings';
import * as tagService from './tag.service';
import { createSuccessResponse, createCursorPaginatedResponse } from '../utils/response-helper';
import { ApiResponse, CursorPaginatedApiResponse } from '../types/api-response.types';

// 定義篩選參數介面
interface ResourceFilterParams {
  type?: string;
  cost?: string;
  level?: string;
  majorCategory?: string;
  subCategory?: string;
  status?: string;
  tags?: string[];
  query?: string;
  createdBy?: number;
  [key: string]: unknown;
}

// 定義分頁參數介面
interface PaginationParams {
  cursor?: string;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * 根據 ID 獲取資源
 * @param id - 資源的 external_id (UUID)
 * @returns 資源詳情
 */
export async function getResourceById(id: string): Promise<ApiResponse<import('../types/resource.types').ResourceResponse | null>> {
  // 查詢資源，使用 external_id
  const resource = await prisma.resources.findFirst({
    where: { 
      external_id: id,
      deleted_at: null 
    },
    include: {
      users: {
        select: {
          id: true,
          nickname: true,
          contacts: {
            select: {
              photo_url: true
            }
          }
        }
      },
      categories_resources_major_category_idTocategories: {
        select: {
          id: true,
          name: true
        }
      },
      categories_resources_sub_category_idTocategories: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!resource) {
    throw new NotFoundError('資源不存在');
  }

  // 查詢標籤 - entity_tags 使用數字 ID，使用原生 SQL 避免型別問題
  interface TagResult {
    tag_id: number;
    tag_name: string;
  }
  
  const tagResults = await prisma.$queryRaw<TagResult[]>`
    SELECT 
      t.id as tag_id,
      t.name as tag_name
    FROM entity_tags et
    INNER JOIN tags t ON et.tag_id = t.id
    WHERE et.entity_type = 'resource'
    AND et.entity_id::integer = ${resource.id}
  `;
  
  const tags = tagResults.map(row => ({
    tags: {
      id: row.tag_id,
      name: row.tag_name
    }
  }));

  // 查詢評價統計
  const reviewStats = await prisma.resource_review.aggregate({
    where: {
      resource_id: resource.id,
      deleted_at: null
    },
    _avg: {
      score_impact: true,
      score_mindset: true,
      score_problems: true,
      score_perspectives: true,
      score_goals: true
    },
    _count: {
      id: true
    }
  });

  // 構建返回的資源詳情
  const resourceDetail = {
    id: resource.external_id,
    name: resource.name,
    url: resource.url,
    imageUrl: resource.image_url,
    description: resource.description,
    videoUrl: resource.video_url,
    type: resource.type,
    cost: resource.cost,
    level: resource.level,
    status: resource.status,
    author: resource.users ? {
      id: resource.users.id,
      nickname: resource.users.nickname || '',
      photoUrl: resource.users.contacts?.photo_url || null
    } : {
      id: 0,
      nickname: 'Unknown User',
      photoUrl: null
    },
    majorCategory: resource.categories_resources_major_category_idTocategories ? {
      id: resource.categories_resources_major_category_idTocategories.id,
      name: resource.categories_resources_major_category_idTocategories.name
    } : null,
    subCategory: resource.categories_resources_sub_category_idTocategories ? {
      id: resource.categories_resources_sub_category_idTocategories.id,
      name: resource.categories_resources_sub_category_idTocategories.name
    } : null,
    tags: tags ? tags.map(tag => ({
      id: tag.tags.id,
      name: tag.tags.name
    })) : [],
    reviewStats: reviewStats ? {
      totalReviews: reviewStats._count.id,
      averageScores: {
        impact: reviewStats._avg.score_impact || 0,
        mindset: reviewStats._avg.score_mindset || 0,
        problems: reviewStats._avg.score_problems || 0,
        perspectives: reviewStats._avg.score_perspectives || 0,
        goals: reviewStats._avg.score_goals || 0
      }
    } : {
      totalReviews: 0,
      averageScores: {
        impact: 0,
        mindset: 0,
        problems: 0,
        perspectives: 0,
        goals: 0
      }
    },
    createdAt: resource.created_at,
    updatedAt: resource.updated_at
  };

  const transformedResource = await transformResourceToApi(resourceDetail);
  return createSuccessResponse(transformedResource);
}

/**
 * 獲取資源列表
 * @param filters - 篩選條件
 * @param pagination - 分頁參數
 * @returns 資源列表和分頁資訊
 */
export async function getResources(
  filters: ResourceFilterParams,
  pagination: PaginationParams
): Promise<CursorPaginatedApiResponse<import('../types/resource.types').ResourceResponse>> {
  const { cursor, limit = DEFAULT_RESOURCE_PAGE_LIMIT, sort = 'created_at', order = 'desc' } = pagination;
  const actualLimit = Math.min(limit, MAX_RESOURCE_PAGE_LIMIT);

  // 預先處理標籤篩選
  let tagFilteredResourceIds: number[] | undefined;
  if (filters.tags && filters.tags.length > 0) {
    const taggedResourceIds = await prisma.entity_tags.findMany({
      where: {
        entity_type: 'resource',
        tags: {
          name: {
            in: filters.tags
          }
        }
      },
      select: {
        entity_id: true
      }
    });
    
    // entity_id 在 entity_tags 表中存儲的是 resource 的數字 ID
    tagFilteredResourceIds = taggedResourceIds.map(tag => tag.entity_id);
    if (tagFilteredResourceIds.length === 0) {
      // 如果沒有找到任何標籤匹配的資源，返回空結果
      return createCursorPaginatedResponse(
        [],
        {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        }
      );
    }
  }

  // 構建查詢條件
  const where: Prisma.resourcesWhereInput = {
    deleted_at: null
  };

  // 添加篩選條件
  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.cost) {
    where.cost = filters.cost;
  }

  if (filters.level) {
    where.level = filters.level;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.createdBy) {
    where.created_by = filters.createdBy;
  }

  if (filters.majorCategory) {
    where.categories_resources_major_category_idTocategories = {
      name: filters.majorCategory
    };
  }

  if (filters.subCategory) {
    where.categories_resources_sub_category_idTocategories = {
      name: filters.subCategory
    };
  }

  if (filters.query) {
    where.OR = [
      {
        name: {
          contains: filters.query,
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: filters.query,
          mode: 'insensitive'
        }
      }
    ];
  }

  // 添加標籤篩選結果
  if (tagFilteredResourceIds) {
    where.id = {
      in: tagFilteredResourceIds
    };
  }

  // 處理 cursor 分頁
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (sort === 'created_at' && decodedCursor) {
      where.created_at = order === 'desc' ? { lt: decodedCursor.timestamp } : { gt: decodedCursor.timestamp };
    }
  }

  // 構建排序條件
  const orderBy: Prisma.resourcesOrderByWithRelationInput = {};
  if (sort === 'created_at') {
    orderBy.created_at = order;
  } else if (sort === 'updated_at') {
    orderBy.updated_at = order;
  }

  // 查詢資源列表
  const resources = await prisma.resources.findMany({
    where,
    include: {
      users: {
        select: {
          id: true,
          nickname: true,
          contacts: {
            select: {
              photo_url: true
            }
          }
        }
      },
      categories_resources_major_category_idTocategories: {
        select: {
          id: true,
          name: true
        }
      },
      categories_resources_sub_category_idTocategories: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy,
    take: actualLimit + 1 // 多取一個用於判斷是否有下一頁
  });

  // 處理分頁
  const hasMore = resources.length > actualLimit;
  const resourcesData = hasMore ? resources.slice(0, actualLimit) : resources;

  // 批量查詢標籤 - entity_tags 表使用數字 ID，不是 UUID
  const resourceIds = resourcesData
    .map(resource => resource.id)
    .filter((id): id is number => id !== null && id !== undefined);
  
  interface TagQueryResult {
    entity_id: string;
    entity_type: string;
    tag_id: number;
    tag_name: string;
    created_at: Date;
    updated_at: Date;
    created_by: number | null;
  }
  
  interface TagWithEntity {
    entity_id: string;
    resource_id: number;
    tags: {
      id: number;
      name: string;
    };
  }
  
  let allTags: TagWithEntity[] = [];
  if (resourceIds.length > 0) {
    // 使用原生 SQL 查詢，entity_id 實際儲存的是資源的數字 ID
    const rawTags = await prisma.$queryRaw<TagQueryResult[]>`
      SELECT 
        et.*,
        t.id as tag_id,
        t.name as tag_name
      FROM entity_tags et
      INNER JOIN tags t ON et.tag_id = t.id
      WHERE et.entity_type = 'resource'
      AND et.entity_id::integer = ANY(${resourceIds}::integer[])
    `;
    
    // 轉換為預期的格式
    allTags = rawTags.map(row => ({
      entity_id: row.entity_id,
      resource_id: parseInt(row.entity_id),
      tags: {
        id: row.tag_id,
        name: row.tag_name
      }
    }));
  }

  // 將標籤按資源 ID 分組（使用數字 ID）
  const tagsByResourceId = allTags.reduce((acc, tag) => {
    const resourceId = tag.resource_id.toString();
    if (!acc[resourceId]) {
      acc[resourceId] = [];
    }
    acc[resourceId].push({
      id: tag.tags.id,
      name: tag.tags.name
    });
    return acc;
  }, {} as Record<string, Array<{ id: number; name: string }>>);

  // 構建資源列表
  const resourceList = resourcesData.map(resource => ({
    id: resource.external_id,
    name: resource.name,
    url: resource.url,
    imageUrl: resource.image_url,
    description: resource.description,
    type: resource.type,
    cost: resource.cost,
    level: resource.level,
    status: resource.status,
    author: {
      id: resource.users.id,
      nickname: resource.users.nickname || ''
    },
    majorCategory: resource.categories_resources_major_category_idTocategories ? {
      id: resource.categories_resources_major_category_idTocategories.id,
      name: resource.categories_resources_major_category_idTocategories.name
    } : null,
    subCategory: resource.categories_resources_sub_category_idTocategories ? {
      id: resource.categories_resources_sub_category_idTocategories.id,
      name: resource.categories_resources_sub_category_idTocategories.name
    } : null,
    tags: tagsByResourceId[resource.id.toString()] || [],
    createdAt: resource.created_at,
    updatedAt: resource.updated_at
  }));

  // 生成分頁資訊
  const paginationMetadata = generatePaginationMetadata(
    resourcesData,
    resourcesData.length, // count
    actualLimit,
    sort,
    hasMore
  );

  const transformedResources = await Promise.all(resourceList.map((resource) => transformResourceToApi(resource)));
  
  return createCursorPaginatedResponse(
    transformedResources,
    paginationMetadata,
    {
      searchQuery: filters.query,
      filters: filters
    }
  );
}

/**
 * 創建資源
 * @param data - 資源數據
 * @param userId - 創建者 ID
 * @returns 創建的資源
 */
export async function createResource(data: Record<string, unknown>, userId: number): Promise<ApiResponse<import('../types/resource.types').ResourceResponse | null>> {
  return await prisma.$transaction(async (tx) => {
    // 驗證數據
    const validatedData = createResourceSchema.parse(data);

    // 驗證分類
    if (validatedData.majorCategory) {
      const majorCategory = await tx.categories.findUnique({
        where: { name: validatedData.majorCategory }
      });
      if (!majorCategory) {
        throw new NotFoundError('主分類不存在');
      }
    }

    if (validatedData.subCategory) {
      const subCategory = await tx.categories.findUnique({
        where: { name: validatedData.subCategory }
      });
      if (!subCategory) {
        throw new NotFoundError('子分類不存在');
      }
    }

    // 轉換數據
    const dbData = await transformResourceToDb(validatedData, userId);

    // 創建資源
    const resource = await tx.resources.create({
      data: {
        name: dbData.name || '',
        url: dbData.url || '',
        image_url: dbData.image_url,
        description: dbData.description || '',
        video_url: dbData.video_url,
        type: dbData.type || '',
        cost: dbData.cost || '',
        level: dbData.level || '',
        major_category_id: dbData.major_category_id,
        sub_category_id: dbData.sub_category_id,
        created_by: userId,
        status: 'active'
      },
      select: {
        id: true,
        external_id: true,
        name: true,
        url: true,
        image_url: true,
        description: true,
        video_url: true,
        type: true,
        cost: true,
        level: true,
        major_category_id: true,
        sub_category_id: true,
        created_by: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    });

    // 處理標籤
    if (validatedData.tags && validatedData.tags.length > 0) {
      await tagService.setEntityTags('resource', resource.id, validatedData.tags, userId, tx);
    }

    const createdResource = await getResourceById(resource.external_id || '');
    // getResourceById now returns ApiResponse, we need to extract the data
    return createdResource;
  });
}

/**
 * 更新資源
 * @param id - 資源 ID
 * @param data - 更新數據
 * @param userId - 當前使用者 ID
 * @returns 更新後的資源
 */
export async function updateResource(id: string, data: Record<string, unknown>, userId: number): Promise<ApiResponse<import('../types/resource.types').ResourceResponse | null>> {
  return await prisma.$transaction(async (tx) => {
    // 檢查資源是否存在
    const existingResource = await tx.resources.findUnique({
      where: { 
        external_id: id,
        deleted_at: null 
      }
    });

    if (!existingResource) {
      throw new NotFoundError('資源不存在');
    }

    // 檢查權限
    if (existingResource.created_by !== userId) {
      throw new ForbiddenError('無權限修改此資源');
    }

    // 驗證數據
    const validatedData = updateResourceSchema.parse(data);

    // 驗證分類
    if (validatedData.majorCategory) {
      const majorCategory = await tx.categories.findUnique({
        where: { name: validatedData.majorCategory }
      });
      if (!majorCategory) {
        throw new NotFoundError('主分類不存在');
      }
    }

    if (validatedData.subCategory) {
      const subCategory = await tx.categories.findUnique({
        where: { name: validatedData.subCategory }
      });
      if (!subCategory) {
        throw new NotFoundError('子分類不存在');
      }
    }

    // 轉換數據
    const dbData = await transformResourceToDb(validatedData, userId);

    // 更新資源
    await tx.resources.update({
      where: { external_id: id },
      data: {
        name: dbData.name,
        url: dbData.url,
        image_url: dbData.image_url,
        description: dbData.description,
        video_url: dbData.video_url,
        type: dbData.type,
        cost: dbData.cost,
        level: dbData.level,
        major_category_id: dbData.major_category_id,
        sub_category_id: dbData.sub_category_id
      }
    });

    // 更新標籤
    if (validatedData.tags !== undefined && validatedData.tags !== null) {
      await tagService.setEntityTags('resource', existingResource.id, validatedData.tags, userId, tx);
    }

    const updatedResource = await getResourceById(id);
    return updatedResource;
  });
}

/**
 * 刪除資源
 * @param id - 資源 ID
 * @param userId - 當前使用者 ID
 */
export async function deleteResource(id: string, userId: number): Promise<ApiResponse<{ success: boolean }>> {
  return await prisma.$transaction(async (tx) => {
    // 檢查資源是否存在
    const existingResource = await tx.resources.findUnique({
      where: { 
        external_id: id,
        deleted_at: null 
      }
    });

    if (!existingResource) {
      throw new NotFoundError('資源不存在');
    }

    // 檢查權限
    if (existingResource.created_by !== userId) {
      throw new ForbiddenError('無權限刪除此資源');
    }

    // 軟刪除資源
    await tx.resources.update({
      where: { external_id: id },
      data: {
        deleted_at: new Date()
      }
    });

    return createSuccessResponse({ success: true });
  });
}

/**
 * 獲取資源統計資訊
 * @param userId - 使用者 ID（可選）
 * @returns 統計資訊
 */
export async function getResourceStats(userId?: number): Promise<ApiResponse<{
  totalCount: number;
  activeCount: number;
  typeStats: Record<string, number>;
}>> {
  const baseWhere: Prisma.resourcesWhereInput = {};
  const activeWhere: Prisma.resourcesWhereInput = {
    deleted_at: null
  };

  if (userId) {
    baseWhere.created_by = userId;
    activeWhere.created_by = userId;
  }

  const [totalCount, activeCount, typeStats] = await Promise.all([
    prisma.resources.count({ where: baseWhere }), // 包含所有資源（含軟刪除）
    prisma.resources.count({ 
      where: { ...activeWhere, status: 'active' } 
    }),
    prisma.resources.groupBy({
      by: ['type'],
      where: activeWhere, // 類型統計仍排除軟刪除
      _count: {
        type: true
      }
    })
  ]);

  const stats = {
    totalCount,
    activeCount,
    typeStats: typeStats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.type;
      return acc;
    }, {} as Record<string, number>)
  };

  return createSuccessResponse(stats);
}

// 匯出所有函數
export default {
  getResourceById,
  getResources,
  createResource,
  updateResource,
  deleteResource,
  getResourceStats
};