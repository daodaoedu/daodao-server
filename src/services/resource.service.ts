/**
 * 資源服務 - Prisma 架構
 * 處理資源相關的業務邏輯
 */

import { prisma } from '@/services/database/prisma.service';
import type { resources, resource_review, tags, categories, users, Prisma } from '../../generated/prisma';
import { 
  transformResourceToApi, 
  transformResourceToDb, 
  transformReviewToDb 
} from '@/services/transform.service';
import { ResourceDbModel } from '@/types/resource.types';
import { 
  NotFoundError, 
  ForbiddenError 
} from '@/utils/error-handler';
import { 
  decodeCursor, 
  generatePaginationMetadata 
} from '@/utils/transform-utils';
import { createResourceSchema, updateResourceSchema, UpdateResourceSchema } from '@/validators/resource.validator';
import { DEFAULT_RESOURCE_PAGE_LIMIT, MAX_RESOURCE_PAGE_LIMIT } from '@/constants/mappings';
import tagService from '@/services/tag.service';

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
export async function getResourceById(id: string) {
  // 查詢資源，使用 external_id
  const resource = await prisma.resources.findUnique({
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

  // 查詢標籤
  const tags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      entity_id: resource.external_id || ''
    },
    include: {
      tags: true
    }
  });

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
    author: {
      id: resource.users.id,
      nickname: resource.users.nickname || '',
      photoUrl: resource.users.contacts?.photo_url || null
    },
    majorCategory: resource.categories_resources_major_category_idTocategories ? {
      id: resource.categories_resources_major_category_idTocategories.id,
      name: resource.categories_resources_major_category_idTocategories.name
    } : null,
    subCategory: resource.categories_resources_sub_category_idTocategories ? {
      id: resource.categories_resources_sub_category_idTocategories.id,
      name: resource.categories_resources_sub_category_idTocategories.name
    } : null,
    tags: tags.map(tag => ({
      id: tag.tags.id,
      name: tag.tags.name
    })),
    reviewStats: {
      totalReviews: reviewStats._count.id,
      averageScores: {
        impact: reviewStats._avg.score_impact || 0,
        mindset: reviewStats._avg.score_mindset || 0,
        problems: reviewStats._avg.score_problems || 0,
        perspectives: reviewStats._avg.score_perspectives || 0,
        goals: reviewStats._avg.score_goals || 0
      }
    },
    createdAt: resource.created_at,
    updatedAt: resource.updated_at
  };

  return transformResourceToApi(resourceDetail);
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
) {
  const { cursor, limit = DEFAULT_RESOURCE_PAGE_LIMIT, sort = 'created_at', order = 'desc' } = pagination;
  const actualLimit = Math.min(limit, MAX_RESOURCE_PAGE_LIMIT);

  // 預先處理標籤篩選
  let resourceExternalIds: string[] | undefined;
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
    
    resourceExternalIds = taggedResourceIds.map(tag => tag.entity_id);
    if (resourceExternalIds.length === 0) {
      // 如果沒有找到任何標籤匹配的資源，返回空結果
      return {
        resources: [],
        pagination: {
          hasNext: false,
          hasPrev: false,
          totalCount: 0,
          nextCursor: null,
          prevCursor: null
        }
      };
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
  if (resourceExternalIds) {
    where.external_id = {
      in: resourceExternalIds
    };
  }

  // 處理 cursor 分頁
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (sort === 'created_at') {
      where.created_at = order === 'desc' ? { lt: decodedCursor } : { gt: decodedCursor };
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

  // 批量查詢標籤
  const resourceIds = resourcesData.map(resource => resource.external_id || '');
  const allTags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      entity_id: { in: resourceIds }
    },
    include: {
      tags: true
    }
  });

  // 將標籤按資源 ID 分組
  const tagsByResourceId = allTags.reduce((acc, tag) => {
    if (!acc[tag.entity_id]) {
      acc[tag.entity_id] = [];
    }
    acc[tag.entity_id].push({
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
    tags: tagsByResourceId[resource.external_id || ''] || [],
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

  return {
    resources: resourceList.map((resource) => transformResourceToApi(resource)),
    pagination: paginationMetadata
  };
}

/**
 * 創建資源
 * @param data - 資源數據
 * @param userId - 創建者 ID
 * @returns 創建的資源
 */
export async function createResource(data: any, userId: number) {
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
      }
    });

    // 處理標籤
    if (validatedData.tags && validatedData.tags.length > 0) {
      await tagService.setEntityTags('resource', resource.external_id || '', validatedData.tags, userId, tx);
    }

    return await getResourceById(resource.external_id || '');
  });
}

/**
 * 更新資源
 * @param id - 資源 ID
 * @param data - 更新數據
 * @param userId - 當前使用者 ID
 * @returns 更新後的資源
 */
export async function updateResource(id: string, data: any, userId: number) {
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
    const updatedResource = await tx.resources.update({
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
    if (validatedData.tags !== undefined) {
      await tagService.setEntityTags('resource', id, validatedData.tags, userId, tx);
    }

    return await getResourceById(id);
  });
}

/**
 * 刪除資源
 * @param id - 資源 ID
 * @param userId - 當前使用者 ID
 */
export async function deleteResource(id: string, userId: number): Promise<void> {
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
  });
}

/**
 * 獲取資源統計資訊
 * @param userId - 使用者 ID（可選）
 * @returns 統計資訊
 */
export async function getResourceStats(userId?: number) {
  const where: Prisma.resourcesWhereInput = {
    deleted_at: null
  };

  if (userId) {
    where.created_by = userId;
  }

  const [totalCount, activeCount, typeStats] = await Promise.all([
    prisma.resources.count({ where }),
    prisma.resources.count({ 
      where: { ...where, status: 'active' } 
    }),
    prisma.resources.groupBy({
      by: ['type'],
      where,
      _count: {
        type: true
      }
    })
  ]);

  return {
    totalCount,
    activeCount,
    typeStats: typeStats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.type;
      return acc;
    }, {} as Record<string, number>)
  };
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