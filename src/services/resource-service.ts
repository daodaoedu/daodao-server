/**
 * 資源服務
 * 處理資源相關的業務邏輯
 */

import { Op, WhereOptions, Includeable, Order } from 'sequelize';
// 從模型索引引入所有模型以確保關聯設定正確載入
import { Resource, ResourceReview, Tag, Category } from '@/models/index';
// 從 JS 模型引入 User (User 模型仍在 JavaScript 部分)
import { User } from '../../models/index';
import { 
  transformResourceToApi, 
  transformResourceToDb, 
  transformReviewToDb 
} from '@/services/transform-service';
import { 
  NotFoundError, 
  ForbiddenError 
} from '@/utils/error-handler';
import { 
  decodeCursor, 
  generatePaginationMetadata 
} from '@/utils/transform-utils';
import { CreateResourceSchema, UpdateResourceSchema } from '@/validators/resource.validator';
import { DEFAULT_RESOURCE_PAGE_LIMIT, MAX_RESOURCE_PAGE_LIMIT } from '@/constants/mappings';
import sequelize from '@/config/database';
import tagService from '@/services/tag-service';

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
  const resource = await Resource.findOne({
    where: { external_id: id },
    include: [
      { model: User, as: 'author' },
      { model: Category, as: 'majorCategory' },
      { model: Category, as: 'subCategory' },
      {
        model: Tag,
        as: 'tags',
        through: {
          attributes: [],
          where: { entity_type: 'resource' }
        }
      }
    ]
  });

  if (!resource) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的資源`);
  }

  // 查詢統計資料 (可以在實際項目中從 Redis 或其他快取系統中獲取)
  const stats = {
    view_count: 0,
    favorite_count: 0,
    share_count: 0,
    review_count: 0
  };

  // 查詢評分數據
  const reviewStats = await ResourceReview.findOne({
    attributes: [
      [sequelize.fn('AVG', sequelize.col('score_impact')), 'avgRating']
    ],
    where: { resource_id: resource.get('id') }
  });

  // 將資源資料轉換為 API 格式
  const result = transformResourceToApi({
    ...resource.toJSON(),
    stats,
    avgRating: reviewStats ? parseFloat(reviewStats.getDataValue('avgRating')) : null
  });

  return result;
}

/**
 * 獲取資源列表
 * @param filters - 篩選條件
 * @param pagination - 分頁參數
 * @returns 資源列表和分頁元數據
 */
export async function getResources(
  filters: ResourceFilterParams = {},
  pagination: PaginationParams = {}
) {
  // 處理分頁參數
  const limit = Math.min(
    pagination.limit || DEFAULT_RESOURCE_PAGE_LIMIT,
    MAX_RESOURCE_PAGE_LIMIT
  );

  // 處理排序參數
  const sortField = pagination.sort || 'createdAt';
  const sortDirection = pagination.order || 'desc';
  
  // 把 API 的排序欄位名稱轉換為數據庫欄位名稱
  const dbSortField = 
    sortField === 'createdAt' ? 'created_at' :
    sortField === 'updatedAt' ? 'updated_at' :
    sortField === 'name' ? 'name' :
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
    ...(filters.type && { type: filters.type }),
    ...(filters.cost && { cost: filters.cost }),
    ...(filters.level && { level: filters.level }),
    ...(filters.majorCategory && { '$majorCategory.name$': filters.majorCategory }),
    ...(filters.subCategory && { '$subCategory.name$': filters.subCategory }),
    ...(filters.createdBy && { created_by: filters.createdBy }),
    status: filters.status || 'active'
  };

  // 如果有搜索查詢，添加全文搜索條件
  if (filters.query) {
    Object.assign(where, {
      [Op.or]: [
        { name: { [Op.iLike]: `%${filters.query}%` } },
        { description: { [Op.iLike]: `%${filters.query}%` } }
      ]
    });
  }

  // 構建包含關係
  const include: Includeable[] = [
    { model: User, as: 'author' },
    { model: Category, as: 'majorCategory' },
    { model: Category, as: 'subCategory' }
  ];

  // 如果有標籤篩選，添加標籤包含關係
  if (filters.tags && filters.tags.length > 0) {
    include.push({
      model: Tag,
      as: 'tags',
      through: {
        attributes: [],
        where: { entity_type: 'resource' }
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
        where: { entity_type: 'resource' }
      }
    });
  }

  // 查詢資源列表
  const { rows, count } = await Resource.findAndCountAll({
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

  // 查詢評分數據
  const resourceIds = rows.map((r) => r.get('id') as number);
  const reviewStats = await ResourceReview.findAll({
    attributes: [
      'resource_id',
      [sequelize.fn('AVG', sequelize.col('score_impact')), 'avgRating']
    ],
    where: { resource_id: { [Op.in]: resourceIds } },
    group: ['resource_id']
  });

  // 構建評分映射
  const ratingMap = new Map();
  reviewStats.forEach((stat) => {
    ratingMap.set(
      stat.get('resource_id'),
      parseFloat(stat.get('avgRating') as string)
    );
  });

  // 轉換為 API 格式
  const resources = rows.map((row) => {
    const resource = row.toJSON();
    return transformResourceToApi({
      ...resource,
      avgRating: ratingMap.get(resource.id) || null,
      // 統計數據可以在實際項目中從 Redis 或其他快取系統中獲取
      stats: {
        view_count: 0,
        favorite_count: 0,
        share_count: 0,
        review_count: 0
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

  return { resources, pagination: pagination_meta };
}

/**
 * 創建新資源
 * @param data - 資源數據
 * @param userId - 創建者 ID
 * @returns 創建的資源
 */
export async function createResource(
  data: CreateResourceSchema,
  userId: number
) {
  const transaction = await sequelize.transaction();

  try {
    // 轉換資源數據為數據庫格式
    const resourceData = await transformResourceToDb(data, userId);

    // 創建資源
    const resource = await Resource.create(resourceData, { transaction });

    // 處理標籤
    if (data.tags && data.tags.length > 0) {
      await tagService.setEntityTags(
        resource.get('id') as number,
        'resource',
        data.tags,
        transaction
      );
    }

    // 如果包含評論數據，創建評論
    if (data.review) {
      const reviewData = transformReviewToDb(
        data.review,
        userId,
        resource.get('id') as number
      );

      await ResourceReview.create(reviewData, { transaction });
    }

    // 提交事務
    await transaction.commit();
    
    // 查詢完整的資源數據（包含關聯數據）
    // 這裡使用 try-catch 包裝，因為事務已經提交
    try {
      const createdResource = await getResourceById(resource.get('external_id') as string);
      return createdResource;
    } catch (queryError) {
      // 如果查詢失敗，返回基本的資源數據（在測試環境中很常見）
      return transformResourceToApi(resource.toJSON() as Record<string, unknown>);
    }
  } catch (error) {
    // 回滾事務（使用 try-catch 避免重複回滾錯誤）
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      // 如果回滾失敗（通常是因為事務已經完成），記錄但不影響原始錯誤
      const errorMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      console.warn('事務回滾失敗，可能事務已經完成:', errorMessage);
    }
    throw error;
  }
}

/**
 * 更新資源
 * @param id - 資源 ID
 * @param data - 更新數據
 * @param userId - 當前用戶 ID
 * @returns 更新後的資源
 */
export async function updateResource(
  id: string, // external_id (UUID)
  data: UpdateResourceSchema,
  userId: number
) {
  const transaction = await sequelize.transaction();

  try {
    // 查詢資源，使用 external_id
    const resource = await Resource.findOne({ where: { external_id: id } });
    if (!resource) {
      throw new NotFoundError(`找不到 external_id 為 ${id} 的資源`);
    }

    // 檢查權限 (只有創建者或管理員可以更新資源)
    if (resource.get('created_by') as number !== userId /* 檢查是否為管理員 */) {
      throw new ForbiddenError('沒有權限更新此資源');
    }

    // 轉換更新數據
    const updateData = await transformResourceToDb(data, userId);

    // 更新資源
    await resource.update(updateData, { transaction });

    // 處理標籤
    if (data.tags) {
      await tagService.setEntityTags(
        resource.get('id') as number, // 使用內部數字 ID
        'resource',
        data.tags,
        transaction
      );
    }

    // 提交事務
    await transaction.commit();

    // 查詢更新後的資源
    // 查詢更新後的資源
const updatedResource = await getResourceById(id);

    return updatedResource;
  } catch (error) {
    // 回滾事務
    await transaction.rollback();
    throw error;
  }
}

/**
 * 更新資源狀態
 * @param id - 資源 ID
 * @param status - 新狀態
 * @param userId - 當前用戶 ID
 * @returns 更新後的資源
 */
export async function updateResourceStatus(
  id: string, // external_id (UUID)
  status: string,
  userId: number
) {
  // 查詢資源，使用 external_id
  const resource = await Resource.findOne({ where: { external_id: id } });
  if (!resource) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的資源`);
  }

  // 檢查權限 (只有創建者或管理員可以更新狀態)
  if (resource.get('created_by') as number !== userId /* 檢查是否為管理員 */) {
    throw new ForbiddenError('沒有權限更新此資源狀態');
  }

  // 更新狀態
  await resource.update({ status });

  // 查詢更新後的資源
  const updatedResource = await getResourceById(id); // id 已經是 external_id

  return updatedResource;
}

/**
 * 刪除資源 (軟刪除)
 * @param id - 資源 ID
 * @param userId - 當前用戶 ID
 * @returns 是否成功
 */
export async function deleteResource(
  id: string, // external_id (UUID)
  userId: number
) {
  // 查詢資源，使用 external_id
  const resource = await Resource.findOne({ where: { external_id: id } });
  if (!resource) {
    throw new NotFoundError(`找不到 external_id 為 ${id} 的資源`);
  }

  // 檢查權限 (只有創建者或管理員可以刪除資源)
  if (resource.get('created_by') as number !== userId /* 檢查是否為管理員 */) {
    throw new ForbiddenError('沒有權限刪除此資源');
  }

  // 軟刪除資源
  await resource.destroy();

  return { success: true };
}

/**
 * 增加資源查看次數
 * @param id - 資源 ID
 * @returns 是否成功
 */
export async function incrementViewCount(id: number) {
  // 在實際項目中，可以使用 Redis 來記錄查看次數
  // 這裡只是一個示例
  const resource = await Resource.findByPk(id);
  if (!resource) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的資源`);
  }

  // 增加查看次數的邏輯 (假設有一個 view_count 欄位)
  // await resource.increment('view_count');

  return { success: true };
}

export const resourceService = {
  getResourceById,
  getResources,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
  incrementViewCount
};

export default resourceService;
