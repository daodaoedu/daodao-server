/**
 * 資源心得評價服務
 * 處理資源心得評價相關的業務邏輯
 */

import { Transaction, Op, WhereOptions, Includeable, Order } from 'sequelize';
import ResourceReview from '@/models/resourceReview';
import Resource from '@/models/resource';
const { User } = require('@/models/index'); // 從 JS models 中引入
import Tag from '@/models/tag';
import EntityTag from '@/models/entityTag';
import { ResourceReviewAttributes } from '@/models/resourceReview';
import { ResourceAttributes } from '@/models/resource';
import { 
  transformReviewToApi, 
  transformReviewToDb 
} from '@/services/transformService';
import { 
  NotFoundError, 
  BadRequestError, 
  ConflictError, 
  ForbiddenError 
} from '@/utils/errorHandler';
import { 
  decodeCursor, 
  generatePaginationMetadata 
} from '@/utils/transformUtils';
import { 
  ResourceReviewSchema, 
  UpdateResourceReviewSchema 
} from '@/validators/resourceReview.validator';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@/constants/mappings';
import sequelize from '@/config/database';
import tagService from '@/services/tagService';

// 定義篩選參數介面
interface ReviewFilterParams {
  resourceId?: number;
  userId?: number;
  status?: string;
  tags?: string[];
}

// 定義分頁參數介面
interface PaginationParams {
  cursor?: string;
  limit?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * 根據 ID 獲取心得評價
 * @param id - 心得評價 ID
 * @returns 心得評價詳情
 */
export async function getReviewById(id: number) {
  // 查詢心得評價，包含關聯資料
  const review = await ResourceReview.findByPk(id, {
    include: [
      { model: User, as: 'User' },
      { model: Resource, as: 'Resource' },
      {
        model: Tag,
        as: 'tags',
        through: {
          attributes: [],
          where: { entity_type: 'resource_review' }
        }
      }
    ]
  });

  if (!review) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
  }

  // 查詢統計資料
  const stats = {
    likes_count: 0 // 在實際項目中，可以從 Redis 或其他快取系統中獲取
  };

  // 將心得評價資料轉換為 API 格式
  const result = transformReviewToApi({
    ...review.toJSON(),
    stats
  });

  return result;
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
) {
  // 處理分頁參數
  const limit = Math.min(
    pagination.limit || DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT
  );

  // 處理排序參數
  const sortField = pagination.sortField || 'createdAt';
  const sortDirection = pagination.sortDirection || 'desc';
  
  // 把 API 的排序欄位名稱轉換為數據庫欄位名稱
  const dbSortField = 
    sortField === 'createdAt' ? 'created_at' :
    sortField === 'updatedAt' ? 'updated_at' :
    'created_at';

  const order: Order = [[dbSortField, sortDirection]];

  // 處理游標分頁
  let cursorWhere: WhereOptions = {};
  if (pagination.cursor) {
    const decoded = decodeCursor(pagination.cursor);
    if (decoded) {
      cursorWhere = {
        [Op.or]: [
          {
            [dbSortField]: {
              [sortDirection === 'desc' ? Op.lt : Op.gt]: decoded.timestamp
            }
          },
          {
            [dbSortField]: decoded.timestamp,
            id: {
              [sortDirection === 'desc' ? Op.lt : Op.gt]: decoded.id
            }
          }
        ]
      };
    }
  }

  // 構建篩選條件
  const where: WhereOptions = {
    ...cursorWhere,
    ...(filters.resourceId && { resource_id: filters.resourceId }),
    ...(filters.userId && { user_id: filters.userId }),
    status: filters.status || 'published'
  };

  // 構建包含關係
  const include: Includeable[] = [
    { model: User, as: 'author' },
    { model: Resource, as: 'resource' }
  ];

  // 如果有標籤篩選，添加標籤包含關係
  if (filters.tags && filters.tags.length > 0) {
    include.push({
      model: Tag,
      as: 'tags',
      through: {
        attributes: [],
        where: { entity_type: 'resource_review' }
      },
      where: {
        name: { [Op.in]: filters.tags }
      }
    });
  } else {
    // 沒有標籤篩選時，也包含標籤但不添加篩選條件
    include.push({
      model: Tag,
      as: 'tags',
      through: {
        attributes: [],
        where: { entity_type: 'resource_review' }
      }
    });
  }

  // 查詢心得評價列表
  const { rows, count } = await ResourceReview.findAndCountAll({
    where,
    include,
    order,
    limit: limit + 1 // 多查詢一條記錄，用於判斷是否有下一頁
  });

  // 判斷是否有更多記錄
  const hasMore = rows.length > limit;
  if (hasMore) {
    rows.pop(); // 移除多查詢的記錄
  }

  // 轉換為 API 格式
  const reviews = rows.map(row => {
    const review = row.toJSON();
    return transformReviewToApi({
      ...review,
      // 統計數據可以在實際項目中從 Redis 或其他快取系統中獲取
      stats: {
        likes_count: 0
      }
    });
  });

  // 生成分頁元數據
  const pagination_meta = generatePaginationMetadata(
    rows,
    count,
    limit,
    dbSortField,
    hasMore
  );

  return { reviews, pagination: pagination_meta };
}

/**
 * 創建心得評價
 * @param resourceId - 資源 ID
 * @param data - 心得評價數據
 * @param userId - 創建者 ID
 * @returns 創建的心得評價
 */
export async function createReview(
  resourceId: number,
  data: ResourceReviewSchema,
  userId: number
) {
  const transaction = await sequelize.transaction();

  try {
    // 檢查資源是否存在
    const resource = await Resource.findByPk(resourceId);
    if (!resource) {
      throw new NotFoundError(`找不到 ID 為 ${resourceId} 的資源`);
    }

    // 檢查用戶是否已經評價過該資源
    const existingReview = await ResourceReview.findOne({
      where: {
        user_id: userId,
        resource_id: resourceId
      }
    });

    if (existingReview) {
      throw new ConflictError('您已經評價過此資源，請修改現有評價');
    }

    // 轉換心得評價數據為數據庫格式
    const reviewData = transformReviewToDb(data, userId, resourceId);

    // 創建心得評價
    const review = await ResourceReview.create(reviewData, { transaction });

    // 處理標籤
    if (data.tags && data.tags.length > 0) {
      await tagService.setEntityTags(
        review.get('id') as number,
        'resource_review',
        data.tags,
        transaction
      );
    }

    // 提交事務
    await transaction.commit();

    // 查詢完整的心得評價數據（包含關聯數據）
    const createdReview = await getReviewById(review.get('id') as number);

    return createdReview;
  } catch (error) {
    // 回滾事務
    await transaction.rollback();
    throw error;
  }
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
) {
  const transaction = await sequelize.transaction();

  try {
    // 查詢心得評價
    const review = await ResourceReview.findByPk(id);
    if (!review) {
      throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
    }

    // 檢查權限 (只有創建者或管理員可以更新心得評價)
    if (review.get('user_id') as number !== userId /* 檢查是否為管理員 */) {
      throw new ForbiddenError('沒有權限更新此心得評價');
    }

    // 轉換更新數據
    const updateData = transformReviewToDb(
      data,
      userId,
      review.get('resource_id') as number
    );

    // 更新心得評價
    await review.update(updateData, { transaction });

    // 處理標籤
    if (data.tags) {
      await tagService.setEntityTags(
        id,
        'resource_review',
        data.tags,
        transaction
      );
    }

    // 提交事務
    await transaction.commit();

    // 查詢更新後的心得評價
    const updatedReview = await getReviewById(id);

    return updatedReview;
  } catch (error) {
    // 回滾事務
    await transaction.rollback();
    throw error;
  }
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
) {
  // 查詢心得評價
  const review = await ResourceReview.findByPk(id);
  if (!review) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
  }

  // 檢查權限 (只有創建者或管理員可以更新狀態)
  if (review.get('user_id') as number !== userId /* 檢查是否為管理員 */) {
    throw new ForbiddenError('沒有權限更新此心得評價狀態');
  }

  // 更新狀態
  await review.update({ status });

  // 查詢更新後的心得評價
  const updatedReview = await getReviewById(id);

  return updatedReview;
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
) {
  // 查詢心得評價
  const review = await ResourceReview.findByPk(id);
  if (!review) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
  }

  // 檢查權限 (只有創建者或管理員可以刪除心得評價)
  if (review.get('user_id') as number !== userId /* 檢查是否為管理員 */) {
    throw new ForbiddenError('沒有權限刪除此心得評價');
  }

  // 軟刪除心得評價
  await review.destroy();

  return { success: true };
}

/**
 * 點讚/取消點讚心得評價
 * @param id - 心得評價 ID
 * @param userId - 當前用戶 ID
 * @param like - 是否點讚
 * @returns 是否成功
 */
export async function toggleLikeReview(
  id: number,
  userId: number,
  like: boolean
) {
  // 查詢心得評價
  const review = await ResourceReview.findByPk(id);
  if (!review) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的心得評價`);
  }

  // 在實際項目中，可以使用 Redis 或數據庫表來記錄點讚
  // 這裡只是一個示例

  // 返回成功
  return { success: true };
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
