/**
 * 模型索引和關聯設定
 * 本文件將所有 TypeScript 模型集中匯出，並設定模型之間的關聯關係
 */

import Resource from './resource';
import ResourceReview from './resource-review';
import Tag from './tag';
import EntityTag from './entity-tag';
import Category from './category';
import { createIdeaModel } from './idea';
import { createEntityResourceModel } from './entity-resource';
import sequelize from '@/config/database';

// 創建 Idea 模型實例
const Idea = createIdeaModel(sequelize);
// 創建 EntityResource 模型實例
const EntityResource = createEntityResourceModel(sequelize);

// 設定 TypeScript 模型之間的關聯關係
const setupTsModelAssociations = () => {
  // 此處設置所有 TypeScript 模型之間的關聯

  // Resource 與 Category 的關聯
  Resource.belongsTo(Category, {
    foreignKey: 'major_category_id',
    as: 'majorCategory'
  });
  
  Resource.belongsTo(Category, {
    foreignKey: 'sub_category_id',
    as: 'subCategory'
  });
  
  Category.hasMany(Resource, {
    foreignKey: 'major_category_id',
    as: 'resourcesAsMajor'
  });
  
  Category.hasMany(Resource, {
    foreignKey: 'sub_category_id',
    as: 'resourcesAsSub'
  });

  // Category 自關聯（父子分類）
  Category.belongsTo(Category, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  Category.hasMany(Category, {
    foreignKey: 'parent_id',
    as: 'children'
  });

  // Tag 與 EntityTag 關聯
  Tag.hasMany(EntityTag, {
    foreignKey: 'tag_id',
    as: 'entityTags'
  });
  
  EntityTag.belongsTo(Tag, {
    foreignKey: 'tag_id',
    as: 'tag'
  });

  // Resource 與 Tag 的多對多關聯（透過 EntityTag）
  Resource.belongsToMany(Tag, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(Resource, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'tag_id',
    otherKey: 'entity_id',
    as: 'resources',
    constraints: false
  });

  // ResourceReview 與 Tag 的多對多關聯（透過 EntityTag）
  ResourceReview.belongsToMany(Tag, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(ResourceReview, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'tag_id',
    otherKey: 'entity_id',
    as: 'resourceReviews',
    constraints: false
  });

  // ResourceReview 與 Resource 的關聯
  Resource.hasMany(ResourceReview, {
    foreignKey: 'resource_id',
    as: 'reviews'
  });
  
  ResourceReview.belongsTo(Resource, {
    foreignKey: 'resource_id',
    as: 'resource'
  });

  // Idea 與 Tag 的多對多關聯（透過 EntityTag）
  Idea.belongsToMany(Tag, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(Idea, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'tag_id',
    otherKey: 'entity_id',
    as: 'ideas',
    constraints: false
  });

  // EntityResource 與 Resource 的關聯
  EntityResource.belongsTo(Resource, {
    foreignKey: 'resource_id',
    as: 'resource'
  });
  
  Resource.hasMany(EntityResource, {
    foreignKey: 'resource_id',
    as: 'entityResources'
  });

  // Idea 與 Resource 的多對多關聯（透過 EntityResource）
  Idea.belongsToMany(Resource, {
    through: {
      model: EntityResource,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'resource_id',
    as: 'resources',
    constraints: false
  });
  
  Resource.belongsToMany(Idea, {
    through: {
      model: EntityResource,
      unique: false
    },
    foreignKey: 'resource_id',
    otherKey: 'entity_id',
    as: 'ideas',
    constraints: false
  });
};

// 執行關聯設置（跳過測試環境）
if (process.env.NODE_ENV !== 'test') {
  setupTsModelAssociations();
}

// 為 TypeScript 使用提供類型安全的匯出
export {
  Resource,
  ResourceReview,
  Tag,
  EntityTag,
  Category,
  Idea,
  EntityResource
};

// 重新匯出類型定義
export type { TagAttributes } from './tag';

// 提供預設匯出
const models = {
  Resource,
  ResourceReview,
  Tag,
  EntityTag,
  Category,
  Idea,
  EntityResource
};

export default models;
