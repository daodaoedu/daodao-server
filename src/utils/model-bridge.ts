/**
 * 模型橋接工具
 * 用於連接 JavaScript 和 TypeScript 模型系統
 */

// 從 TypeScript 模型系統引入
import { Resource, ResourceReview } from '@/models/index';

// 從 JavaScript 模型系統引入
import { User } from '../../models/index';

/**
 * 設定 JavaScript 與 TypeScript 模型之間的關聯
 */
export function setupModelBridge() {
  console.log('🔄 設定 JavaScript 與 TypeScript 模型之間的關聯...');

  // 只在模型存在時設定關聯
  if (User && Resource) {
    // Resource 與 User 的關聯
    User.hasMany(Resource, {
      foreignKey: 'created_by',
      as: 'createdResources'
    });
    
    Resource.belongsTo(User, {
      foreignKey: 'created_by',
      as: 'author'
    });
  }

  // ResourceReview 與 User 的關聯
  if (User && ResourceReview) {
    User.hasMany(ResourceReview, {
      foreignKey: 'user_id',
      as: 'reviews'
    });
    
    ResourceReview.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'author'
    });
  }
  
  console.log('✅ JavaScript 與 TypeScript 模型橋接完成');
}

export default setupModelBridge;
