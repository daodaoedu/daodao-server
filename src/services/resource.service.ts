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
  ForbiddenError,
  BadRequestError 
} from '../middleware/error.middleware';
import { externalToInternalId } from './id-converter.service';
import { 
  decodeCursor, 
  generatePaginationMetadata 
} from '../utils/transform-utils';
import { createResourceSchema, updateResourceSchema } from '../validators/resource.validator';
import { DEFAULT_RESOURCE_PAGE_LIMIT, MAX_RESOURCE_PAGE_LIMIT } from '../constants/mappings';
import * as tagService from './tag.service';
import { assertResourceNotCoachLocked } from './practice.service';
import { createSuccessResponse, createCursorPaginatedResponse } from '../utils/response-helper';
import { ApiResponse, CursorPaginatedApiResponse, Facets, FacetValue } from '../types/api-response.types';

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


  // 準備資料庫記錄格式以供轉換
  const dbResourceForTransform = {
    ...resource,
    User: resource.users,
    majorCategory: resource.categories_resources_major_category_idTocategories,
    subCategory: resource.categories_resources_sub_category_idTocategories,
    tags: tags.map(tag => ({ name: tag.tags.name }))
  };

  const transformedResource = await transformResourceToApi(dbResourceForTransform);
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
          count: 0,
          limit: limit,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 0,
          parentTotalEstimate: null
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

  // 批量查詢評價統計
  const reviewStatsData = await prisma.resource_review.groupBy({
    by: ['resource_id'],
    where: {
      resource_id: {
        in: resourceIds
      },
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

  // 將評價統計按資源 ID 分組
  const reviewStatsByResourceId = reviewStatsData.reduce((acc, stats) => {
    acc[stats.resource_id.toString()] = {
      totalReviews: stats._count.id,
      averageScores: {
        impact: Number(stats._avg.score_impact) || 0,
        mindset: Number(stats._avg.score_mindset) || 0,
        problems: Number(stats._avg.score_problems) || 0,
        perspectives: Number(stats._avg.score_perspectives) || 0,
        goals: Number(stats._avg.score_goals) || 0
      }
    };
    return acc;
  }, {} as Record<string, {
    totalReviews: number;
    averageScores: {
      impact: number;
      mindset: number;
      problems: number;
      perspectives: number;
      goals: number;
    };
  }>);

  // 構建資源列表
  const resourceList = resourcesData.map(resource => ({
    id: resource.external_id,
    name: resource.name,
    url: resource.url,
    imageUrl: resource.image_url,
    description: resource.description,
    videoUrl: null, // 添加缺少的欄位
    type: resource.type,
    cost: resource.cost,
    level: resource.level,
    status: resource.status,
    author: {
      id: resource.users.id,
      nickname: resource.users.nickname || '',
      photoUrl: resource.users.contacts?.photo_url || null // 添加 photoUrl 欄位
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
    reviewStats: reviewStatsByResourceId[resource.id.toString()] || {
      totalReviews: 0,
      averageScores: {
        impact: 0,
        mindset: 0,
        problems: 0,
        perspectives: 0,
        goals: 0
      }
    },
    createdAt: resource.created_at?.toISOString(), // 轉換為 ISO 字串
    updatedAt: resource.updated_at?.toISOString()  // 轉換為 ISO 字串
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

  // 查詢 facets（分類統計）- 基於基礎條件（排除 deleted_at）
  const facetsBaseWhere: Prisma.resourcesWhereInput = {
    deleted_at: null
  };

  // 並行查詢主分類和子分類的統計
  const [majorCategoryStats, subCategoryStats] = await Promise.all([
    prisma.resources.groupBy({
      by: ['major_category_id'],
      where: facetsBaseWhere,
      _count: {
        major_category_id: true
      }
    }),
    prisma.resources.groupBy({
      by: ['sub_category_id'],
      where: facetsBaseWhere,
      _count: {
        sub_category_id: true
      }
    })
  ]);

  // 收集所有分類 ID
  const majorCategoryIds = majorCategoryStats
    .map(stat => stat.major_category_id)
    .filter((id): id is number => id !== null);
  const subCategoryIds = subCategoryStats
    .map(stat => stat.sub_category_id)
    .filter((id): id is number => id !== null);
  const allCategoryIds = [...new Set([...majorCategoryIds, ...subCategoryIds])];

  // 查詢分類名稱
  const categories = allCategoryIds.length > 0
    ? await prisma.categories.findMany({
        where: { id: { in: allCategoryIds } },
        select: { id: true, name: true }
      })
    : [];

  const categoryNameMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<number, string>);

  // 構建 facets 結構
  const majorCategoryFacets: FacetValue[] = majorCategoryStats
    .filter((stat): stat is typeof stat & { major_category_id: number } => stat.major_category_id !== null)
    .map(stat => ({
      value: categoryNameMap[stat.major_category_id] || `Unknown (${stat.major_category_id})`,
      count: stat._count.major_category_id
    }))
    .sort((a, b) => b.count - a.count);

  const subCategoryFacets: FacetValue[] = subCategoryStats
    .filter((stat): stat is typeof stat & { sub_category_id: number } => stat.sub_category_id !== null)
    .map(stat => ({
      value: categoryNameMap[stat.sub_category_id] || `Unknown (${stat.sub_category_id})`,
      count: stat._count.sub_category_id
    }))
    .sort((a, b) => b.count - a.count);

  const facets: Facets = {
    majorCategory: majorCategoryFacets,
    subCategory: subCategoryFacets
  };

  return createCursorPaginatedResponse(
    transformedResources,
    paginationMetadata,
    {
      searchQuery: filters.query,
      filters: filters
    },
    facets
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
    // 驗證數據 - 使用 safeParse 避免驗證錯誤
    const validationResult = createResourceSchema.safeParse(data);
    if (!validationResult.success) {
      throw new BadRequestError(`驗證失敗: ${validationResult.error.message}`);
    }
    const validatedData = validationResult.data;

    // 驗證分類 - 改為可選驗證，允許跳過不存在的分類
    if (validatedData.majorCategory) {
      const majorCategory = await tx.categories.findUnique({
        where: { name: validatedData.majorCategory }
      });
      if (!majorCategory) {
        console.warn(`主分類不存在: ${validatedData.majorCategory}，將設為 null`);
        validatedData.majorCategory = undefined;
      }
    }

    if (validatedData.subCategory) {
      const subCategory = await tx.categories.findUnique({
        where: { name: validatedData.subCategory }
      });
      if (!subCategory) {
        console.warn(`子分類不存在: ${validatedData.subCategory}，將設為 null`);
        validatedData.subCategory = undefined;
      }
    }

    // 轉換數據
    const dbData = await transformResourceToDb(validatedData, userId);

    // 創建資源並獲取完整信息
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
    console.log(`創建資源完成 - resource.created_by=${resource.created_by}, 期望=${userId}`);

    // 處理標籤
    let tags: Array<{ id: number; name: string }> = [];
    if (validatedData.tags && validatedData.tags.length > 0) {
      await tagService.setEntityTags('resource', resource.id, validatedData.tags, userId, tx);
      
      // 查詢剛創建的標籤
      interface TagResult {
        tag_id: number;
        tag_name: string;
      }
      
      const tagResults = await tx.$queryRaw<TagResult[]>`
        SELECT 
          t.id as tag_id,
          t.name as tag_name
        FROM entity_tags et
        INNER JOIN tags t ON et.tag_id = t.id
        WHERE et.entity_type = 'resource'
        AND et.entity_id::integer = ${resource.id}
      `;
      
      tags = tagResults.map(row => ({
        id: row.tag_id,
        name: row.tag_name
      }));
    }

    // 處理嵌套評論（如果提供）
    if (validatedData.review) {
      // 這裡可以添加創建評論的邏輯，但需要先確認評論服務是否支持事務
      // 暫時跳過，專注於修復主要的資源創建問題
    }

    // 在事務內轉換為 API 格式
    const transformedResource = await transformResourceToApi({
      ...resource,
      tags
    });

    return createSuccessResponse(transformedResource);
  });
}

/**
 * 更新資源
 * @param id - 資源 ID
 * @param data - 更新數據
 * @param userId - 當前使用者 ID
 * @returns 更新後的資源
 */
export async function updateResource(externalId: string, data: Record<string, unknown>, userId: number): Promise<ApiResponse<import('../types/resource.types').ResourceResponse | null>> {
  return await prisma.$transaction(async (tx) => {
    // 轉換 external_id 為內部 id
    console.log(`🔍 嘗試轉換 external_id: ${externalId}`);
    let resourceId: number;
    try {
      resourceId = await externalToInternalId('resource', externalId);
      console.log(`✅ 轉換成功，內部 id: ${resourceId}`);
    } catch (error) {
      console.log(`❌ 轉換失敗:`, error);
      throw error;
    }
    
    // 檢查資源是否存在
    const existingResource = await tx.resources.findFirst({
      where: { 
        id: resourceId,
        deleted_at: null 
      }
    });

    if (!existingResource) {
      throw new NotFoundError('資源不存在');
    }

    // 檢查權限：只有資源建立者可改（daodao#355 移除寫死 user 2 的測試例外，錯誤訊息不帶 user id）
    if (existingResource.created_by !== userId) {
      throw new ForbiddenError('無權限修改此資源');
    }

    // 燈塔本期實踐上的教練資源：學員不可改（daodao#331）
    await assertResourceNotCoachLocked(existingResource, userId);

    // 驗證數據 - 使用 safeParse 避免驗證錯誤
    const validationResult = updateResourceSchema.safeParse(data);
    if (!validationResult.success) {
      throw new BadRequestError(`驗證失敗: ${validationResult.error.message}`);
    }
    const validatedData = validationResult.data;

    // 驗證分類 - 改為可選驗證，允許跳過不存在的分類
    
    if (validatedData.majorCategory) {
      const majorCategory = await tx.categories.findUnique({
        where: { name: validatedData.majorCategory }
      });
      if (!majorCategory) {
        console.warn(`主分類不存在: ${validatedData.majorCategory}，將設為 null`);
        // 移除不存在的分類
        validatedData.majorCategory = undefined;
      }
    }

    if (validatedData.subCategory) {
      const subCategory = await tx.categories.findUnique({
        where: { name: validatedData.subCategory }
      });
      if (!subCategory) {
        console.warn(`子分類不存在: ${validatedData.subCategory}，將設為 null`);
        // 移除不存在的分類
        validatedData.subCategory = undefined;
      }
    }

    // 轉換數據
    const dbData = await transformResourceToDb(validatedData, userId);

    // 構建更新數據，排除 undefined 值
    const updateData: Record<string, unknown> = {};
    if (dbData.name !== undefined) updateData.name = dbData.name;
    if (dbData.url !== undefined) updateData.url = dbData.url;
    if (dbData.image_url !== undefined) updateData.image_url = dbData.image_url;
    if (dbData.description !== undefined) updateData.description = dbData.description;
    if (dbData.video_url !== undefined) updateData.video_url = dbData.video_url;
    if (dbData.type !== undefined) updateData.type = dbData.type;
    if (dbData.cost !== undefined) updateData.cost = dbData.cost;
    if (dbData.level !== undefined) updateData.level = dbData.level;
    if (dbData.major_category_id !== undefined) updateData.major_category_id = dbData.major_category_id;
    if (dbData.sub_category_id !== undefined) updateData.sub_category_id = dbData.sub_category_id;

    // 更新資源
    if (Object.keys(updateData).length > 0) {
      await tx.resources.update({
        where: { id: resourceId },
        data: updateData
      });
    }

    // 更新標籤
    if (validatedData.tags !== undefined && validatedData.tags !== null) {
      await tagService.setEntityTags('resource', existingResource.id, validatedData.tags, userId, tx);
    }

    const updatedResource = await getResourceById(externalId);
    return updatedResource;
  });
}

/**
 * 刪除資源
 * @param id - 資源 ID
 * @param userId - 當前使用者 ID
 */
export async function deleteResource(id: string, userId: number): Promise<ApiResponse<{ message: string }>> {
  return await prisma.$transaction(async (tx) => {
    // 檢查資源是否存在
    const existingResource = await tx.resources.findFirst({
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

    // 燈塔本期實踐上的教練資源：學員不可刪（daodao#331）
    await assertResourceNotCoachLocked(existingResource, userId);

    // 軟刪除資源
    await tx.resources.update({
      where: {
        external_id: id,
        deleted_at: null
      },
      data: {
        deleted_at: new Date()
      }
    });

    return createSuccessResponse({ message: '資源已成功刪除' });
  });
}

/**
 * 獲取資源統計資訊
 * @param userId - 使用者 ID（可選）
 * @returns 統計資訊
 */
export async function getResourceStats(userId?: number): Promise<ApiResponse<{
  totalResources: number;
  activeResources: number;
  categoryStats: Record<string, number>;
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

  const [totalCount, activeCount, typeStats, categoryStats] = await Promise.all([
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
    }),
    // 添加分類統計查詢
    prisma.resources.groupBy({
      by: ['major_category_id'],
      where: activeWhere,
      _count: {
        major_category_id: true
      }
    })
  ]);

  // 獲取分類名稱映射
  const categoryIds = categoryStats.map(stat => stat.major_category_id).filter(id => id !== null);
  const categories = await prisma.categories.findMany({
    where: {
      id: {
        in: categoryIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  const categoryNameMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<number, string>);

  const stats = {
    totalResources: totalCount,
    activeResources: activeCount,
    categoryStats: categoryStats.reduce((acc, stat) => {
      if (stat.major_category_id !== null) {
        const categoryName = categoryNameMap[stat.major_category_id] || `Category ${stat.major_category_id}`;
        acc[categoryName] = stat._count.major_category_id;
      }
      return acc;
    }, {} as Record<string, number>),
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