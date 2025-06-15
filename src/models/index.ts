/**
 * 模型索引和關聯設定
 * 本文件將所有模型集中匯出，並設定模型之間的關聯關係
 */

import Resource from './resource';
import ResourceReview from './resourceReview';
import Tag from './tag';
import EntityTag from './entityTag';
import { Sequelize } from 'sequelize';

// 從現有 models/index.js 引入其他模型
// 注意：由於我們採用漸進式導入策略，這裡假設其他模型仍然是 JavaScript 模型
// 在實際項目中，需要根據情況調整
try {
  // 動態引入，避免 TypeScript 編譯錯誤
  const existingModels = require('../../models/index.js');
  
  // 提取其他模型
  const { User, Category } = existingModels;
  
  // 關聯關係已在 models/index.js 中設定，這裡不重複設定以避免衝突
  console.log('✅ TypeScript models integrated with existing associations');
  
  // 匯出所有模型
  module.exports = {
    ...existingModels,
    Resource,
    ResourceReview,
    Tag,
    EntityTag
  };
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn('無法載入現有模型或設定關聯關係:', errorMessage);
  
  // 如果無法載入現有模型，僅匯出新模型
  module.exports = {
    Resource,
    ResourceReview,
    Tag,
    EntityTag
  };
}

// 為 TypeScript 使用提供類型安全的匯出
// 使用方式：import { Resource, ResourceReview, Tag, EntityTag } from '../models';
export {
  Resource,
  ResourceReview,
  Tag,
  EntityTag
};

// 提供預設匯出
const models = {
  Resource,
  ResourceReview,
  Tag,
  EntityTag
};

export default models;

// 所有關聯已在 models/index.js 中統一設定
// 避免重複設定造成別名衝突
