/**
 * 資源心得評價服務 - Prisma 架構
 * 處理資源心得評價相關的業務邏輯
 */

import { prisma } from '@/services/database/prisma.service';
import type { Prisma, tags } from '../../generated/prisma';
import { 
  transformReviewToApi, 
  transformReviewToDb 
} from '@/services/transform.service';
import { 
  ResourceReviewResponse
} from '@/types/resource-review.types';
import { 
  NotFoundError, 
  ConflictError, 
  ForbiddenError 
} from '@/middleware/error.middleware';
import { 
  ApiResponse, 
  ApiSuccessResponse,
  CursorPaginatedApiResponse
} from '@/types/api-response.types';
import { 
  createSuccessResponse, 
  createCursorPaginatedResponse 
} from '@/utils/response-helper';
import { 
  decodeCursor, 
  generatePaginationMetadata 
} from '@/utils/transform-utils';
import { 
  ResourceReviewSchema, 
  UpdateResourceReviewSchema 
} from '@/validators/resource-review.validator';
import { DEFAULT_REVIEW_PAGE_LIMIT, MAX_REVIEW_PAGE_LIMIT } from '@/constants/mappings';
import tagService from '@/services/tag.service';

// 定義篩選參數介面
interface ReviewFilterParams {
  resourceId?: string; // resourceId 是 external_id (UUID)
  userId?: number;
  status?: string;
  tags?: string[];
  minScore?: number;
  maxScore?: number;
}

// 定義分頁參數介面
interface PaginationParams {
  cursor?: string;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * 根據 ID 獲取心得評價
 * @param id - 心得評價 ID
 * @returns 心得評價詳情
 */
export async function getReviewById(id: number): Promise<ApiSuccessResponse<ResourceReviewResponse>> {
  // 查詢心得評價，包含關聯資料
  const review = await prisma.resource_review.findUnique({
    where: { 
      id,
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
      resources: {
        select: {
          id: true,
          external_id: true,
          name: true,
          url: true
        }
      }
    }
  });

  if (!review) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
  }

  // 查詢標籤
  const tags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource_review',
      entity_id: review.id
    },
    include: {
      tags: true
    }
  });

  // 查詢統計資料
  const stats = {
    likes_count: 0 // 在實際項目中，可以從 Redis 或其他快取系統中獲取
  };

  // 將心得評價資料轉換為 API 格式
  const result = await transformReviewToApi({
    ...review,
    tags: tags.map(tag => tag.tags),
    stats
  });

  return createSuccessResponse(result, {
    requestId: `review_${id}`,
    processingTime: Date.now() - Date.now()
  });
}

/**
 * 獲取心得評價列表
 * @param filters - 篩選條件
 * @param pagination - 分頁參數
 * @returns 心得評價列表和分頁元數據
 */
export async function getReviews(
  filters: ReviewFilterParams = {},
  pagination: PaginationParams = {}
): Promise<CursorPaginatedApiResponse<ResourceReviewResponse>> {
  // 處理分頁參數
  const limit = Math.min(
    pagination.limit || DEFAULT_REVIEW_PAGE_LIMIT,
    MAX_REVIEW_PAGE_LIMIT
  );

  // 處理排序參數
  const sortField = pagination.sort || 'createdAt';
  const sortDirection = pagination.order || 'desc';
  
  // 把 API 的排序欄位名稱轉換為數據庫欄位名稱
  const dbSortField = 
    sortField === 'createdAt' ? 'created_at' :
    sortField === 'updatedAt' ? 'updated_at' :
    'created_at';

  // 構建查詢條件
  const where: Prisma.resource_reviewWhereInput = {
    deleted_at: null,
    status: filters.status || 'published'
  };

  // 添加篩選條件
  if (filters.userId) {
    where.user_id = filters.userId;
  }

  // 處理評分範圍篩選
  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    const scoreCondition: Prisma.IntFilter = {};
    if (filters.minScore !== undefined) {
      scoreCondition.gte = filters.minScore;
    }
    if (filters.maxScore !== undefined) {
      scoreCondition.lte = filters.maxScore;
    }
    where.score_impact = scoreCondition;
  }

  // 如果有 resourceId 篩選
  if (filters.resourceId) {
    where.resources = {
      external_id: filters.resourceId
    };
  }

  // 處理游標分頁
  if (pagination.cursor) {
    const decoded = decodeCursor(pagination.cursor);
    if (decoded) {
      if (sortField === 'createdAt') {
        where.created_at = sortDirection === 'desc' ? 
          { lt: decoded.timestamp } : 
          { gt: decoded.timestamp };
      }
    }
  }

  // 如果有標籤篩選 - 直接查詢 entity_tags 表
  if (filters.tags && filters.tags.length > 0) {
    // 由於 resource_review 沒有直接的 entity_tags 關聯，我們需要通過 id 查詢
    const taggedReviewIds = await prisma.entity_tags.findMany({
      where: {
        entity_type: 'resource_review',
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
    
    if (taggedReviewIds.length > 0) {
      where.id = {
        in: taggedReviewIds.map(tag => Number(tag.entity_id))
      };
    } else {
      // 如果沒有符合的標籤，返回空結果
      where.id = -1;
    }
  }

  // 構建排序條件
  const orderBy: Prisma.resource_reviewOrderByWithRelationInput = {};
  if (sortField === 'createdAt') {
    orderBy.created_at = sortDirection as 'asc' | 'desc';
  } else if (sortField === 'updatedAt') {
    orderBy.updated_at = sortDirection as 'asc' | 'desc';
  }

  // 查詢心得評價列表
  const reviews = await prisma.resource_review.findMany({
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
      resources: {
        select: {
          id: true,
          external_id: true,
          name: true,
          url: true
        }
      }
    },
    orderBy,
    take: limit + 1 // 多查詢一條記錄，用於判斷是否有下一頁
  });

  // 判斷是否有更多記錄
  const hasMore = reviews.length > limit;
  const reviewsData = hasMore ? reviews.slice(0, limit) : reviews;

  // 批量查詢標籤
  const reviewIds = reviewsData.map(review => review.id);
  const allTags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource_review',
      entity_id: { in: reviewIds }
    },
    include: {
      tags: true
    }
  });

  // 將標籤按評價 ID 分組
  const tagsByReviewId = allTags.reduce((acc, tag) => {
    if (!acc[tag.entity_id]) {
      acc[tag.entity_id] = [];
    }
    acc[tag.entity_id].push(tag.tags);
    return acc;
  }, {} as Record<number, Array<tags>>);

  // 轉換為 API 格式
  const reviewList = await Promise.all(reviewsData.map(async (review) => {
    return await transformReviewToApi({
      ...review,
      tags: tagsByReviewId[review.id] || [],
      // 統計數據可以在實際項目中從 Redis 或其他快取系統中獲取
      stats: {
        likes_count: 0
      }
    });
  }));

  // 生成分頁元數據
  const pagination_meta = generatePaginationMetadata(
    reviewsData,
    reviewsData.length, // count
    limit,
    dbSortField,
    hasMore
  );

  return createCursorPaginatedResponse(reviewList, {
    cursors: pagination_meta.cursors,
    hasMore: pagination_meta.hasMore,
    count: pagination_meta.count
  }, {
    searchQuery: filters.tags?.join(','),
    filters: {
      resourceId: filters.resourceId,
      userId: filters.userId,
      status: filters.status,
      minScore: filters.minScore,
      maxScore: filters.maxScore
    }
  });
}

/**
 * 創建心得評價
 * @param resourceId - 資源 ID
 * @param data - 心得評價數據
 * @param userId - 創建者 ID
 * @returns 創建的心得評價
 */
export async function createReview(
  resourceExternalId: string,
  data: ResourceReviewSchema,
  userId: number
): Promise<ApiSuccessResponse<ResourceReviewResponse>> {
  return await prisma.$transaction(async (tx) => {
    // 檢查資源是否存在（使用 external_id）
    const resource = await tx.resources.findUnique({
      where: { external_id: resourceExternalId }
    });
    if (!resource) {
      throw new NotFoundError(`找不到 ID 為 ${resourceExternalId} 的資源`);
    }

    // 檢查用戶是否已經評價過該資源
    const existingReview = await tx.resource_review.findFirst({
      where: {
        user_id: userId,
        resource_id: resource.id,
        deleted_at: null
      }
    });

    if (existingReview) {
      throw new ConflictError('您已經評價過此資源，請修改現有評價');
    }

    // 轉換心得評價數據為數據庫格式
    const reviewData = transformReviewToDb(data, userId, resource.id);

    // 創建心得評價
    const review = await tx.resource_review.create({
      data: {
        user_id: userId,
        resource_id: resource.id,
        content: reviewData.content || '',
        score_impact: reviewData.score_impact ?? 0,
        score_mindset: reviewData.score_mindset ?? 0,
        score_problems: reviewData.score_problems ?? 0,
        score_perspectives: reviewData.score_perspectives ?? 0,
        score_goals: reviewData.score_goals ?? 0,
        status: reviewData.status || 'published'
      }
    });

    // 處理標籤
    if (data.tags && data.tags.length > 0) {
      await tagService.setEntityTags(
        'resource_review',
        review.id,
        data.tags,
        userId,
        tx
      );
    }

    // 查詢完整的心得評價數據（包含關聯數據）
    const reviewResponse = await getReviewById(review.id);
    return reviewResponse;
  });
}

/**
 * 更新心得評價
 * @param id - 心得評價 ID
 * @param data - 更新數據
 * @param userId - 當前用戶 ID
 * @returns 更新後的心得評價
 */
export async function updateReview(
  id: number,
  data: UpdateResourceReviewSchema,
  userId: number
): Promise<ApiSuccessResponse<ResourceReviewResponse>> {
  return await prisma.$transaction(async (tx) => {
    // 查詢心得評價
    const review = await tx.resource_review.findUnique({
      where: { 
        id,
        deleted_at: null
      }
    });
    if (!review) {
      throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
    }

    // 檢查權限 (只有創建者或管理員可以更新心得評價)
    if (review.user_id !== userId /* 檢查是否為管理員 */) {
      throw new ForbiddenError('沒有權限更新此心得評價');
    }

    // 轉換更新數據
    const updateData = transformReviewToDb(
      data,
      userId,
      review.resource_id
    );

    // 更新心得評價
    await tx.resource_review.update({
      where: { id },
      data: {
        content: updateData.content || '',
        score_impact: updateData.score_impact ?? 0,
        score_mindset: updateData.score_mindset ?? 0,
        score_problems: updateData.score_problems ?? 0,
        score_perspectives: updateData.score_perspectives ?? 0,
        score_goals: updateData.score_goals ?? 0,
        status: updateData.status
      }
    });

    // 處理標籤
    if (data.tags !== undefined) {
      await tagService.setEntityTags(
        'resource_review',
        id,
        data.tags,
        userId,
        tx
      );
    }

    // 查詢更新後的心得評價
    return await getReviewById(id);
  });
}

/**
 * 更新心得評價狀態
 * @param id - 心得評價 ID
 * @param status - 新狀態
 * @param userId - 當前用戶 ID
 * @returns 更新後的心得評價
 */
export async function updateReviewStatus(
  id: number,
  status: string,
  userId: number
): Promise<ApiSuccessResponse<ResourceReviewResponse>> {
  // 查詢心得評價
  const review = await prisma.resource_review.findUnique({
    where: { 
      id,
      deleted_at: null
    }
  });
  if (!review) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
  }

  // 檢查權限 (只有創建者或管理員可以更新狀態)
  if (review.user_id !== userId /* 檢查是否為管理員 */) {
    throw new ForbiddenError('沒有權限更新此心得評價狀態');
  }

  // 更新狀態
  await prisma.resource_review.update({
    where: { id },
    data: { status }
  });

  // 查詢更新後的心得評價
  return await getReviewById(id);
}

/**
 * 刪除心得評價 (軟刪除)
 * @param id - 心得評價 ID
 * @param userId - 當前用戶 ID
 * @returns 是否成功
 */
export async function deleteReview(
  id: number,
  userId: number
): Promise<ApiSuccessResponse<{ success: boolean }>> {
  return await prisma.$transaction(async (tx) => {
    // 查詢心得評價
    const review = await tx.resource_review.findUnique({
      where: { 
        id,
        deleted_at: null
      }
    });
    if (!review) {
      throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
    }

    // 檢查權限 (只有創建者或管理員可以刪除心得評價)
    if (review.user_id !== userId /* 檢查是否為管理員 */) {
      throw new ForbiddenError('沒有權限刪除此心得評價');
    }

    // 軟刪除心得評價
    await tx.resource_review.update({
      where: { id },
      data: {
        deleted_at: new Date()
      }
    });

    return createSuccessResponse({ success: true }, {
      requestId: `delete_review_${id}`,
      processingTime: Date.now() - Date.now()
    });
  });
}

/**
 * 點讚/取消點讚心得評價
 * @param id - 心得評價 ID
 * @returns 是否成功
 */
export async function toggleLikeReview(
  id: number
): Promise<ApiSuccessResponse<{ success: boolean }>> {
  // 查詢心得評價
  const review = await prisma.resource_review.findUnique({
    where: { 
      id,
      deleted_at: null
    }
  });
  if (!review) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
  }

  // 在實際項目中，可以使用 Redis 或數據庫表來記錄點讚
  // 這裡只是一個示例

  // 返回成功
  return createSuccessResponse({ success: true }, {
    requestId: `like_review_${id}`,
    processingTime: Date.now() - Date.now()
  });
}

export const resourceReviewService = {
  getReviewById,
  getReviews,
  createReview,
  updateReview,
  updateReviewStatus,
  deleteReview,
  toggleLikeReview
};

export default resourceReviewService;
