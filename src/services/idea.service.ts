/**
 * 想法服務 - Prisma 架構
 * 處理想法相關的業務邏輯
 */

import { prisma } from '@/services/database/prisma.service';
import type { Prisma } from '../../generated/prisma';
import {
  IdeaEntity,
  IdeaFilters,
  IdeaStats,
  IdeaStatus,
  ResourceStatus
} from '@/types/idea.types';
import {
  ApiSuccessResponse,
  PaginatedApiResponse
} from '@/types/api-response.types';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '@/utils/response-helper';
import {
  CreateIdeaRequest,
  UpdateIdeaRequest
} from '@/validators/idea.validators';
import {
  NotFoundError,
  ForbiddenError
} from '@/middleware/error.middleware';
import tagService from '@/services/tag.service';

// 定義分頁參數介面
interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

/**
 * 根據 external_id 獲取想法
 * @param externalId - 想法的 external_id (UUID)
 * @param userId - 當前使用者 ID（用於查詢互動狀態）
 * @returns 想法詳情
 */
export async function getIdeaById(externalId: string, _userId?: number): Promise<ApiSuccessResponse<IdeaEntity>> {
  // 查詢想法，使用 external_id，並確保未被軟刪除
  const idea = await prisma.ideas.findFirst({
    where: {
      external_id: externalId,
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
      }
    }
  });

  if (!idea) {
    throw new NotFoundError('想法不存在');
  }

  // 查詢標籤
  const tags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'idea',
      entity_id: idea.id
    },
    include: {
      tags: true
    }
  });

  // 查詢資源
  const resources = await prisma.entity_resources.findMany({
    where: {
      entity_type: 'idea',
      entity_id: idea.id
    },
    include: {
      resources: {
        include: {
          users: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      }
    }
  });

  // 構建返回的想法實體
  const ideaEntity: IdeaEntity = {
    id: idea.external_id || '',
    content: idea.content,
    status: (idea.status || 'active') as IdeaStatus,
    hasResources: idea.has_resources || false,
    user: {
      id: idea.users.id.toString(),
      name: idea.users.nickname || '',
      photoURL: idea.users.contacts?.photo_url || undefined
    },
    tags: tags.map(tag => tag.tags.name),
    resources: resources.map(entityResource => ({
      id: entityResource.resources.external_id || '',
      name: entityResource.resources.name,
      url: entityResource.resources.url
    })),
    likeCount: 0, // 可以後續實現
    commentCount: 0, // 可以後續實現
    viewCount: 0, // 可以後續實現
    shareCount: 0, // 可以後續實現
    resourceCount: resources.length,
    isLiked: false, // 可以後續實現
    isFavorited: false, // 可以後續實現
    createdAt: idea.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: idea.updated_at?.toISOString() || new Date().toISOString()
  };

  return createSuccessResponse(ideaEntity, {
    cacheHit: false
  });
}

/**
 * 獲取想法列表
 * @param filters - 篩選條件
 * @param pagination - 分頁參數
 * @param userId - 當前使用者 ID（用於查詢互動狀態）
 * @returns 想法列表和分頁資訊
 */
export async function getIdeas(
  filters: IdeaFilters,
  pagination: PaginationParams,
  _userId?: number
): Promise<PaginatedApiResponse<IdeaEntity>> {
  const { page, limit, sort, order } = pagination;
  const skip = (page - 1) * limit;

  // 預先處理標籤篩選
  let ideaInternalIds: number[] | undefined;
  if (filters.tags && filters.tags.length > 0) {
    const taggedIdeaIds = await prisma.entity_tags.findMany({
      where: {
        entity_type: 'idea',
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

    ideaInternalIds = taggedIdeaIds.map(tag => tag.entity_id);
    if (ideaInternalIds.length === 0) {
      // 如果沒有找到任何標籤匹配的想法，返回空結果
      return createPaginatedResponse<IdeaEntity>(
        [],
        {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNext: false,
          hasPrev: false
        },
        {
          searchQuery: filters.search,
          filters: {
            tags: filters.tags,
            status: filters.status,
            authorId: filters.authorId
          }
        }
      );
    }
  }

  // 構建查詢條件
  const where: Prisma.ideasWhereInput = {
    deleted_at: null
  };

  // 添加狀態篩選
  if (filters.status) {
    where.status = filters.status;
  }

  // 添加作者篩選
  if (filters.authorId) {
    where.user_id = parseInt(filters.authorId);
  }

  // 添加內容搜尋
  if (filters.search) {
    where.content = {
      contains: filters.search,
      mode: 'insensitive'
    };
  }

  // 添加標籤篩選結果
  if (ideaInternalIds) {
    where.id = {
      in: ideaInternalIds
    };
  }

  // 構建排序條件
  const orderBy: Prisma.ideasOrderByWithRelationInput = {};
  if (sort === 'created_at') {
    orderBy.created_at = order;
  } else if (sort === 'updated_at') {
    orderBy.updated_at = order;
  }

  // 查詢想法列表
  const [ideas, totalCount] = await Promise.all([
    prisma.ideas.findMany({
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
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.ideas.count({ where })
  ]);

  // 批量查詢標籤
  const ideaIds = ideas.map(idea => idea.id);
  const allTags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'idea',
      entity_id: { in: ideaIds }
    },
    include: {
      tags: true
    }
  });

  // 批量查詢資源
  const allResources = await prisma.entity_resources.findMany({
    where: {
      entity_type: 'idea',
      entity_id: { in: ideaIds }
    },
    include: {
      resources: {
        include: {
          users: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      }
    }
  });

  // 將標籤按想法 ID 分組
  const tagsByIdeaId = allTags.reduce((acc, tag) => {
    if (!acc[tag.entity_id]) {
      acc[tag.entity_id] = [];
    }
    acc[tag.entity_id].push({
      id: tag.tags.id,
      name: tag.tags.name
    });
    return acc;
  }, {} as Record<number, Array<{ id: number; name: string }>>);

  // 將資源按想法 ID 分組
  const resourcesByIdeaId = allResources.reduce((acc, entityResource) => {
    if (!acc[entityResource.entity_id]) {
      acc[entityResource.entity_id] = [];
    }
    acc[entityResource.entity_id].push({
      id: entityResource.resources.external_id || '',
      name: entityResource.resources.name,
      url: entityResource.resources.url,
      description: entityResource.resources.description || undefined,
      type: entityResource.resources.type,
      cost: entityResource.resources.cost,
      level: entityResource.resources.level,
      status: entityResource.resources.status as ResourceStatus,
      majorCategory: undefined, // 需要透過 major_category_id 查詢
      subCategory: undefined, // 需要透過 sub_category_id 查詢
      createdAt: entityResource.resources.created_at?.toISOString(),
    });
    return acc;
  }, {} as Record<number, Array<{
    id: string;
    name: string;
    url: string;
    description?: string;
    type: string;
    cost: string;
    level: string;
    status: ResourceStatus;
    majorCategory?: string;
    subCategory?: string;
    createdAt?: string;
    publishedAt?: string;
  }>>);

  // 構建想法實體列表
  const ideaEntities: IdeaEntity[] = ideas.map(idea => {
    const ideaResources = resourcesByIdeaId[idea.id] || [];
    return {
      id: idea.external_id || '',
      content: idea.content,
      status: (idea.status || 'active') as IdeaStatus,
      hasResources: idea.has_resources || false,
      user: {
        id: idea.users.id.toString(),
        name: idea.users.nickname || '',
        photoURL: idea.users.contacts?.photo_url || undefined
      },
      tags: tagsByIdeaId[idea.id]?.map(tag => tag.name) || [],
      resources: ideaResources,
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      shareCount: 0,
      resourceCount: ideaResources.length,
      isLiked: false,
      isFavorited: false,
      createdAt: (idea.created_at || new Date()).toISOString(),
      updatedAt: (idea.updated_at || new Date()).toISOString()
    };
  });

  const totalPages = Math.ceil(totalCount / limit);

  return createPaginatedResponse(
    ideaEntities,
    {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    {
      searchQuery: filters.search,
      filters: {
        tags: filters.tags,
        status: filters.status,
        authorId: filters.authorId
      },
      sort: sort,
      order: order
    }
  );
}

/**
 * 創建想法
 * @param data - 想法數據
 * @param userId - 創建者 ID
 * @returns 創建結果
 */
export async function createIdea(data: CreateIdeaRequest, userId: number): Promise<ApiSuccessResponse<IdeaEntity>> {
  return await prisma.$transaction(async (tx) => {
    // 創建想法，並包含用戶信息
    const idea = await tx.ideas.create({
      data: {
        user_id: userId,
        content: data.content,
        status: 'active',
        has_resources: data.resources ? data.resources.length > 0 : false
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
        }
      }
    });

    // 處理標籤
    let tagList: string[] = [];
    if (data.tags && data.tags.length > 0) {
      await tagService.setEntityTags('idea', idea.id, data.tags, userId, tx);
      tagList = data.tags;
    }

    // 處理資源 - 創建新資源並關聯到想法
    const createdResources: { id: string; name: string; url: string; }[] = [];
    if (data.resources && data.resources.length > 0) {
      for (const resourceData of data.resources) {
        // 先創建資源
        const resource = await tx.resources.create({
          data: {
            name: resourceData.name,
            url: resourceData.url,
            description: resourceData.description || '',
            type: 'books_articles', // 預設類型為書籍文章
            cost: 'free', // 預設成本
            level: 'all_levels', // 預設難度
            created_by: userId,
            status: 'active'
          }
        });

        // 再關聯到想法
        await tx.entity_resources.create({
          data: {
            entity_type: 'idea',
            entity_id: idea.id,
            resource_id: resource.id,
            created_by: userId
          }
        });

        // 記錄創建的資源（簡化格式）
        createdResources.push({
          id: resource.external_id || '',
          name: resource.name,
          url: resource.url
        });
      }
    }

    // 直接構建返回的想法實體，避免重新查詢
    const ideaEntity: IdeaEntity = {
      id: idea.external_id || '',
      content: idea.content,
      status: (idea.status || 'active') as IdeaStatus,
      hasResources: idea.has_resources || false,
      user: {
        id: idea.users.id.toString(),
        name: idea.users.nickname || '',
        photoURL: idea.users.contacts?.photo_url || undefined
      },
      tags: tagList,
      resources: createdResources,
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      shareCount: 0,
      resourceCount: createdResources.length,
      isLiked: false,
      isFavorited: false,
      createdAt: idea.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: idea.updated_at?.toISOString() || new Date().toISOString()
    };

    return createSuccessResponse(ideaEntity, {
      cacheHit: false
    });
  });
}

/**
 * 更新想法
 * @param ideaId - 想法 ID
 * @param data - 更新數據
 * @param userId - 當前使用者 ID
 * @returns 更新後的想法
 */
export async function updateIdea(ideaId: string, data: UpdateIdeaRequest, userId: number): Promise<ApiSuccessResponse<IdeaEntity>> {
  return await prisma.$transaction(async (tx) => {
    // 檢查想法是否存在且未被軟刪除
    const existingIdea = await tx.ideas.findFirst({
      where: {
        external_id: ideaId,
        deleted_at: null
      }
    });

    if (!existingIdea) {
      throw new NotFoundError('想法不存在');
    }

    // 檢查權限
    if (existingIdea.user_id !== userId) {
      throw new ForbiddenError('無權限修改此想法');
    }

    // 構建更新數據
    const updateData: Record<string, unknown> = {};
    if (data.content !== undefined) {
      updateData.content = data.content;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.resources !== undefined) {
      updateData.has_resources = data.resources.length > 0;
    }

    // 更新想法
    await tx.ideas.update({
      where: { external_id: ideaId },
      data: updateData
    });

    // 更新標籤
    if (data.tags !== undefined) {
      await tagService.setEntityTags('idea', existingIdea.id, data.tags, userId, tx);
    }

    // 更新資源
    if (data.resources !== undefined) {
      // 刪除現有資源關聯
      await tx.entity_resources.deleteMany({
        where: {
          entity_type: 'idea',
          entity_id: existingIdea.id
        }
      });

      // 添加新的資源關聯
      for (const resourceData of data.resources) {
        // 先創建資源
        const resource = await tx.resources.create({
          data: {
            name: resourceData.name,
            url: resourceData.url,
            description: resourceData.description || '',
            type: 'books_articles', // 預設類型為書籍文章
            cost: 'free', // 預設成本
            level: 'all_levels', // 預設難度
            created_by: userId,
            status: 'active'
          }
        });

        // 再關聯到想法
        await tx.entity_resources.create({
          data: {
            entity_type: 'idea',
            entity_id: existingIdea.id,
            resource_id: resource.id,
            created_by: userId
          }
        });
      }
    }

    // 返回更新後的想法
    return await getIdeaById(ideaId, userId);
  });
}

/**
 * 刪除想法
 * @param ideaId - 想法 ID
 * @param userId - 當前使用者 ID
 */
export async function deleteIdea(ideaId: string, userId: number): Promise<ApiSuccessResponse<{ message: string }>> {
  await prisma.$transaction(async (tx) => {
    // 檢查想法是否存在且未被軟刪除
    const existingIdea = await tx.ideas.findFirst({
      where: {
        external_id: ideaId,
        deleted_at: null
      }
    });

    if (!existingIdea) {
      throw new NotFoundError('想法不存在');
    }

    // 檢查權限
    if (existingIdea.user_id !== userId) {
      throw new ForbiddenError('無權限刪除此想法');
    }

    // 軟刪除想法
    await tx.ideas.update({
      where: { external_id: ideaId },
      data: {
        deleted_at: new Date()
      }
    });
  });

  return createSuccessResponse({ message: '想法已刪除' });
}

/**
 * 獲取想法統計資訊
 * @param userId - 使用者 ID（可選）
 * @returns 統計資訊
 */
export async function getIdeaStats(userId?: number): Promise<ApiSuccessResponse<IdeaStats>> {
  const where: Prisma.ideasWhereInput = {
    deleted_at: null
  };

  if (userId) {
    where.user_id = userId;
  }

  const [/* totalCount */, /* activeCount */, withResourcesCount] = await Promise.all([
    prisma.ideas.count({ where }),
    prisma.ideas.count({
      where: { ...where, status: 'active' }
    }),
    prisma.ideas.count({
      where: { ...where, has_resources: true }
    })
  ]);

  const stats: IdeaStats = {
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    shareCount: 0,
    resourceCount: withResourcesCount,
    hasResources: withResourcesCount > 0
  };

  return createSuccessResponse(stats, {
    userId: userId?.toString()
  });
}

// 匯出所有函數
export default {
  getIdeaById,
  getIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  getIdeaStats
};