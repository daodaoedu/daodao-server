/**
 * 想法服務
 * 處理想法相關的業務邏輯
 */

import { Op, WhereOptions, Order, Includeable } from 'sequelize';
import { Idea, Tag } from '@/models/index';
import { User, BasicInfo } from '../../models/index';
import { IdeaModel } from '@/models/idea';
import { ResourceInstance } from '@/models/resource';
import { 
  IdeaEntity, 
  IdeaQueryResult, 
  IdeaFilters, 
  CreateIdeaResponse,
  IdeaStats,
  InteractionStatus,
  PaginationInfo,
  IdeaResource
} from '@/types/idea.types';
import { 
  CreateIdeaRequest, 
  UpdateIdeaRequest
} from '@/validators/idea.validators';
import { 
  NotFoundError, 
  ForbiddenError
} from '@/utils/error-handler';
import sequelize from '@/config/database';
import tagService from '@/services/tag-service';
import { Resource, EntityResource } from '@/models/index';

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
export async function getIdeaById(externalId: string, userId?: number): Promise<IdeaEntity> {
  // 查詢想法，使用 external_id
  const idea = await Idea.findOne({
    where: { external_id: externalId },
    include: [
      { 
        model: User, 
        as: 'author',
        include: [
          { model: BasicInfo }
        ]
      },
      {
        model: Tag,
        as: 'tags',
        through: {
          attributes: [],
          where: { entity_type: 'idea' }
        }
      }
    ]
  });

  if (!idea) {
    throw new NotFoundError(`找不到 ID 為 ${externalId} 的想法`);
  }

  // 查詢統計資料和互動狀態
  const [stats, interactionStatus] = await Promise.all([
    getIdeaStats(),
    userId ? getInteractionStatus() : { isLiked: false, isFavorited: false }
  ]);

  // 轉換為 API 格式
  return transformIdeaToApi(idea, stats, interactionStatus);
}

/**
 * 獲取想法列表
 * @param filters - 篩選條件
 * @param pagination - 分頁參數
 * @param userId - 當前使用者 ID（用於查詢互動狀態）
 * @returns 想法列表和分頁元數據
 */
export async function getIdeas(
  filters: IdeaFilters = { sort: 'createdAt', order: 'desc' },
  pagination: PaginationParams = { page: 1, limit: 20, sort: 'createdAt', order: 'desc' },
  userId?: number
): Promise<IdeaQueryResult> {
  // 處理排序參數
  const dbSortField = 
    pagination.sort === 'createdAt' ? 'created_at' :
    pagination.sort === 'updatedAt' ? 'updated_at' :
    'created_at';

  const order: Order = [[dbSortField, pagination.order]];

  // 構建基本篩選條件
  const baseWhere: WhereOptions = {
    ...(filters.userId && { user_id: filters.userId }),
    ...(filters.status && filters.status !== 'all' && { status: filters.status }),
    ...(!filters.status || filters.status === 'all' ? {} : {})
  };

  // 構建搜索條件
  const searchWhere: WhereOptions = {};
  if (filters.query) {
    Object.assign(searchWhere, {
      [Op.or]: [
        { content: { [Op.iLike]: `%${filters.query}%` } }
      ]
    });
  }

  // 合併所有條件
  const whereConditions = [baseWhere];
  
  if (Object.keys(searchWhere).length > 0) {
    whereConditions.push(searchWhere);
  }
  
  const where: WhereOptions = {
    [Op.and]: whereConditions
  };

  // 構建 include 條件
  const include: Includeable[] = [
    { 
      model: User, 
      as: 'author',
      include: [
        { model: BasicInfo }
      ]
    }
  ];

  // 標籤篩選需要特殊處理
  if (filters.tags && filters.tags.length > 0) {
    include.push({
      model: Tag,
      as: 'tags',
      where: { name: { [Op.in]: filters.tags } },
      through: {
        attributes: [],
        where: { entity_type: 'idea' }
      }
    });
  } else {
    // 如果沒有標籤篩選，則正常包含所有標籤
    include.push({
      model: Tag,
      as: 'tags',
      through: {
        attributes: [],
        where: { entity_type: 'idea' }
      }
    });
  }

  // 執行查詢
  const offset = (pagination.page - 1) * pagination.limit;
  const { rows: ideas, count: total } = await Idea.findAndCountAll({
    where,
    include,
    order,
    limit: pagination.limit,
    offset,
    distinct: true
  });

  // 批次查詢統計資料和互動狀態
  const [statsMap, interactionStatusMap] = await Promise.all([
    getIdeasStats(),
    userId ? getIdeasInteractionStatus() : new Map()
  ]);

  // 轉換為 API 格式
  const transformedIdeas = ideas.map(idea => {
    const stats = statsMap.get(idea.external_id) || {
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      shareCount: 0,
      resourceCount: 0,
      hasResources: false
    };
    const interactionStatus = interactionStatusMap.get(idea.external_id) || {
      isLiked: false,
      isFavorited: false
    };
    return transformIdeaToApi(idea, stats, interactionStatus);
  });

  // 計算分頁信息
  const totalPages = Math.ceil(total / pagination.limit);
  const paginationInfo: PaginationInfo = {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages
  };

  return {
    ideas: transformedIdeas,
    pagination: paginationInfo
  };
}

/**
 * 創建想法
 * @param userId - 創建者 ID
 * @param data - 想法資料
 * @returns 創建的想法和關聯資源
 */
export async function createIdea(
  userId: number, 
  data: CreateIdeaRequest
): Promise<CreateIdeaResponse> {
  const transaction = await sequelize.transaction();

  try {
    // 創建想法
    const idea = await Idea.create({
      user_id: userId,
      content: data.content,
      status: 'active',
      has_resources: Boolean(data.resources && data.resources.length > 0)
    }, { transaction });

    // 處理標籤
    if (data.tags && data.tags.length > 0) {
      await tagService.setEntityTags(
        idea.id,
        'idea',
        data.tags,
        transaction
      );
    }

    // 處理資源（如果有）
    let resources: IdeaResource[] = [];
    if (data.resources && data.resources.length > 0) {
      // 為想法創建關聯資源（草稿狀態）
      const createdResources = await Promise.all(
        data.resources.map(async (resourceInput) => {
          const resource = await Resource.create({
            name: resourceInput.name,
            url: resourceInput.url,
            description: resourceInput.description || '',
            type: 'other', // 預設類型
            cost: 'free', // 預設為免費
            level: 'all_levels', // 預設適合所有程度
            status: 'draft', // 從想法創建的資源為草稿狀態
            created_by: userId
          }, { transaction });

          // 建立想法與資源的關聯
          await EntityResource.create({
            resource_id: (resource as ResourceInstance).id,
            entity_type: 'idea',
            entity_id: idea.external_id,
            created_by: userId
          }, { transaction });

          // 轉換為 API 格式
          const resourceInstance = resource as ResourceInstance;
          return {
            id: resourceInstance.external_id,
            name: resourceInstance.name,
            url: resourceInstance.url,
            description: resourceInstance.description || undefined,
            status: 'draft' as const,
            createdFromType: 'idea' as const,
            createdFromId: idea.external_id,
            createdAt: resourceInstance.created_at.toISOString()
          } as IdeaResource;
        })
      );
      
      resources = createdResources;
    }

    await transaction.commit();

    // 重新查詢完整資料
    const createdIdea = await getIdeaById(idea.external_id, userId);

    return {
      idea: createdIdea,
      resources
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * 更新想法
 * @param externalId - 想法的 external_id
 * @param userId - 更新者 ID
 * @param data - 更新資料
 * @returns 更新後的想法
 */
export async function updateIdea(
  externalId: string,
  userId: number,
  data: UpdateIdeaRequest
): Promise<IdeaEntity> {
  const transaction = await sequelize.transaction();

  try {
    // 查詢想法
    const idea = await Idea.findOne({
      where: { external_id: externalId },
      transaction
    });

    if (!idea) {
      throw new NotFoundError(`找不到 ID 為 ${externalId} 的想法`);
    }

    // 檢查權限
    if (idea.user_id !== userId) {
      throw new ForbiddenError('沒有權限更新此想法');
    }

    // 更新想法
    await idea.update({
      ...(data.content && { content: data.content }),
      ...(data.status && { status: data.status }),
      version: idea.version + 1
    }, { transaction });

    // 處理標籤更新
    if (data.tags !== undefined) {
      await tagService.setEntityTags(
        idea.id,
        'idea',
        data.tags,
        transaction
      );
    }

    await transaction.commit();

    // 重新查詢完整資料
    return await getIdeaById(externalId, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * 刪除想法（軟刪除）
 * @param externalId - 想法的 external_id
 * @param userId - 刪除者 ID
 */
export async function deleteIdea(externalId: string, userId: number): Promise<void> {
  const idea = await Idea.findOne({
    where: { external_id: externalId }
  });

  if (!idea) {
    throw new NotFoundError(`找不到 ID 為 ${externalId} 的想法`);
  }

  // 檢查權限
  if (idea.user_id !== userId) {
    throw new ForbiddenError('沒有權限刪除此想法');
  }

  // 執行軟刪除
  await idea.destroy();
}

/**
 * 獲取想法統計資料
 * @param externalId - 想法的 external_id
 * @returns 統計資料
 */
async function getIdeaStats(): Promise<IdeaStats> {
  // 這裡需要整合現有的 reaction, view, comment, share, entity_resources 表
  // 暫時返回預設值
  return {
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    shareCount: 0,
    resourceCount: 0,
    hasResources: false
  };
}

/**
 * 批次獲取想法統計資料
 * @param externalIds - 想法的 external_id 陣列
 * @returns 統計資料 Map
 */
async function getIdeasStats(): Promise<Map<string, IdeaStats>> {
  // 這裡需要整合現有的統計表
  // 暫時返回空 Map
  return new Map();
}

/**
 * 獲取使用者對想法的互動狀態
 * @param externalId - 想法的 external_id
 * @param userId - 使用者 ID
 * @returns 互動狀態
 */
async function getInteractionStatus(): Promise<InteractionStatus> {
  // 這裡需要整合現有的 reaction, favorite 表
  // 暫時返回預設值
  return {
    isLiked: false,
    isFavorited: false
  };
}

/**
 * 批次獲取使用者對想法的互動狀態
 * @param externalIds - 想法的 external_id 陣列
 * @param userId - 使用者 ID
 * @returns 互動狀態 Map
 */
async function getIdeasInteractionStatus(): Promise<Map<string, InteractionStatus>> {
  // 這裡需要整合現有的互動表
  // 暫時返回空 Map
  return new Map();
}

/**
 * 轉換想法資料為 API 格式
 * @param idea - 想法模型資料
 * @param stats - 統計資料
 * @param interactionStatus - 互動狀態
 * @returns API 格式的想法資料
 */
function transformIdeaToApi(
  idea: IdeaModel,
  stats: IdeaStats,
  interactionStatus: InteractionStatus
): IdeaEntity {
  const ideaData = idea.toJSON() as IdeaModel['dataValues'] & {
    author?: {
      external_id?: string;
      username?: string;
      BasicInfo?: {
        nickname?: string;
        avatar_url?: string;
        role?: string;
      };
    };
    tags?: Array<{ name: string }>;
  };
  
  return {
    id: ideaData.external_id,
    content: ideaData.content,
    user: {
      id: ideaData.author?.external_id || '',
      name: ideaData.author?.BasicInfo?.nickname || ideaData.author?.username || '',
      photoUrl: ideaData.author?.BasicInfo?.avatar_url || undefined,
      role: ideaData.author?.BasicInfo?.role || undefined
    },
    tags: ideaData.tags?.map(tag => tag.name) || [],
    likeCount: stats.likeCount,
    commentCount: stats.commentCount,
    viewCount: stats.viewCount,
    shareCount: stats.shareCount,
    hasResources: stats.hasResources,
    resourceCount: stats.resourceCount,
    isLiked: interactionStatus.isLiked,
    isFavorited: interactionStatus.isFavorited,
    status: ideaData.status,
    createdAt: ideaData.created_at.toISOString(),
    updatedAt: ideaData.updated_at.toISOString(),
    deletedAt: ideaData.deleted_at?.toISOString()
  };
}

export default {
  getIdeaById,
  getIdeas,
  createIdea,
  updateIdea,
  deleteIdea
};