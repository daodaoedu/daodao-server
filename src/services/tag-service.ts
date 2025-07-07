/**
 * 標籤服務
 * 處理標籤相關的業務邏輯
 */

import { Transaction, Op, Model } from 'sequelize';
import { Tag, EntityTag, TagAttributes } from '@/models/index';
import sequelize from '@/config/database';

/**
 * 創建標籤
 * @param name - 標籤名稱
 * @param transaction - 事務對象
 * @returns 創建的標籤
 */
export async function createTag(
  name: string,
  transaction?: Transaction
) {
  // 檢查標籤是否已存在
  let tag = await Tag.findOne({
    where: { name }
  });

  if (!tag) {
    // 創建新標籤
    tag = await Tag.create({ name }, { transaction });
  }

  return tag;
}

/**
 * 獲取或創建多個標籤
 * @param names - 標籤名稱數組
 * @param transaction - 事務對象
 * @returns 標籤數組
 */
export async function getOrCreateTags(
  names: string[],
  transaction?: Transaction
) {
  // 去重
  const uniqueNames = [...new Set(names)];

  // 查詢現有標籤
  const existingTags = await Tag.findAll({
    where: {
      name: { [Op.in]: uniqueNames }
    }
  });

  // 找出需要創建的標籤
  const existingTagNames = existingTags.map((tag: Model<TagAttributes>) => {
    const tagInstance = tag as unknown as TagAttributes;
    return tagInstance.name;
  });
  const newTagNames = uniqueNames.filter(name => !existingTagNames.includes(name));

  // 創建新標籤
  const newTags = await Promise.all(
    newTagNames.map(name => Tag.create({ name }, { transaction }))
  );

  // 合併標籤
  return [...existingTags, ...newTags];
}

/**
 * 設置實體的標籤
 * @param entityId - 實體 ID
 * @param entityType - 實體類型
 * @param tagNames - 標籤名稱數組
 * @param transaction - 事務對象
 */
export async function setEntityTags(
  entityId: number,
  entityType: string,
  tagNames: string[],
  transaction?: Transaction
) {
  // 獲取或創建標籤
  const tags = await getOrCreateTags(tagNames, transaction);

  // 刪除現有的實體標籤關聯
  await EntityTag.destroy({
    where: {
      entity_id: entityId,
      entity_type: entityType
    },
    transaction
  });

  // 創建新的實體標籤關聯
  await Promise.all(
    tags.map(tag => {
      const tagInstance = tag as unknown as TagAttributes;
      return EntityTag.create(
        {
          entity_id: entityId,
          entity_type: entityType,
          tag_id: tagInstance.id
        },
        { transaction }
      );
    })
  );

  return tags;
}

/**
 * 獲取實體的標籤
 * @param entityId - 實體 ID
 * @param entityType - 實體類型
 * @returns 標籤數組
 */
export async function getEntityTags(
  entityId: number,
  entityType: string
) {
  const tags = await Tag.findAll({
    include: [
      {
        model: EntityTag,
        as: 'entityTags',
        where: {
          entity_id: entityId,
          entity_type: entityType
        }
      }
    ]
  });

  return tags;
}

/**
 * 添加實體標籤
 * @param entityId - 實體 ID
 * @param entityType - 實體類型
 * @param tagName - 標籤名稱
 * @returns 添加的標籤
 */
export async function addEntityTag(
  entityId: number,
  entityType: string,
  tagName: string
) {
  const transaction = await Tag.sequelize!.transaction();

  try {
    // 獲取或創建標籤
    const tag = await createTag(tagName, transaction);

    // 檢查標籤是否已經與實體關聯
    const tagInstance = tag as unknown as TagAttributes;
    const existingEntityTag = await EntityTag.findOne({
      where: {
        entity_id: entityId,
        entity_type: entityType,
        tag_id: tagInstance.id
      }
    });

    if (!existingEntityTag) {
      // 創建實體標籤關聯
      await EntityTag.create(
        {
          entity_id: entityId,
          entity_type: entityType,
          tag_id: tagInstance.id
        },
        { transaction }
      );
    }

    // 提交事務
    await transaction.commit();

    return tag;
  } catch (error) {
    // 回滾事務
    await transaction.rollback();
    throw error;
  }
}

/**
 * 移除實體標籤
 * @param entityId - 實體 ID
 * @param entityType - 實體類型
 * @param tagName - 標籤名稱
 * @returns 是否成功
 */
export async function removeEntityTag(
  entityId: number,
  entityType: string,
  tagName: string
) {
  // 查詢標籤
  const tag = await Tag.findOne({
    where: { name: tagName }
  });

  if (!tag) {
    // 標籤不存在，視為已移除
    return { success: true };
  }

  // 刪除實體標籤關聯
  const tagInstance = tag as unknown as TagAttributes;
  await EntityTag.destroy({
    where: {
      entity_id: entityId,
      entity_type: entityType,
      tag_id: tagInstance.id
    }
  });

  return { success: true };
}

/**
 * 獲取熱門標籤
 * @param entityType - 實體類型 (可選)
 * @param limit - 限制數量
 * @returns 熱門標籤數組
 */
export async function getPopularTags(
  entityType?: string,
  limit = 10
) {
  const where = entityType ? { entity_type: entityType } : {};

  // 查詢使用次數最多的標籤
  const tags = await Tag.findAll({
    attributes: [
      'id',
      'name',
      [sequelize.fn('COUNT', sequelize.col('entityTags.id')), 'count']
    ],
    include: [
      {
        model: EntityTag,
        as: 'entityTags',
        attributes: [],
        where
      }
    ],
    group: ['Tag.id', 'Tag.name'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit
  });

  return tags;
}

/**
 * 搜索標籤
 * @param query - 搜索關鍵詞
 * @param limit - 限制數量
 * @returns 匹配的標籤數組
 */
export async function searchTags(
  query: string,
  limit = 10
) {
  const tags = await Tag.findAll({
    where: {
      name: { [Op.iLike]: `%${query}%` }
    },
    limit
  });

  return tags;
}

/**
 * 獲取按實體類型分類的標籤統計
 * @returns 按實體類型分類的標籤統計
 */
export async function getTagStatsByEntityType() {
  const stats = await EntityTag.findAll({
    attributes: [
      'entity_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('tag_id'))), 'uniqueTags']
    ],
    group: ['entity_type']
  });

  return stats;
}

export const tagService = {
  createTag,
  getOrCreateTags,
  setEntityTags,
  getEntityTags,
  addEntityTag,
  removeEntityTag,
  getPopularTags,
  searchTags,
  getTagStatsByEntityType
};

export default tagService;
