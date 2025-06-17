/**
 * 模型索引和關聯設定
 * 本文件將所有 TypeScript 模型集中匯出，並設定模型之間的關聯關係
 */

import Resource from './resource';
import ResourceReview from './resourceReview';
import Tag from './tag';
import EntityTag from './entityTag';
import Category from './category';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database';

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
      unique: false,
      scope: {
        entity_type: 'resource'
      }
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(Resource, {
    through: {
      model: EntityTag,
      unique: false,
      scope: {
        entity_type: 'resource'
      }
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
      unique: false,
      scope: {
        entity_type: 'resource_review'
      }
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(ResourceReview, {
    through: {
      model: EntityTag,
      unique: false,
      scope: {
        entity_type: 'resource_review'
      }
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
};

// 執行關聯設置
setupTsModelAssociations();

// 為 TypeScript 使用提供類型安全的匯出
export {
  Resource,
  ResourceReview,
  Tag,
  EntityTag,
  Category
};

// 提供預設匯出
const models = {
  Resource,
  ResourceReview,
  Tag,
  EntityTag,
  Category
};

export default models;
