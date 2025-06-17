/**
 * 資料轉換服務
 * 處理資料庫記錄與 API 格式之間的轉換
 */

import { ResourceAttributes } from '@/models/resource';
import { ResourceReviewAttributes } from '@/models/resourceReview';
import { 
  contentFeaturesMappings, 
  resourceUsageMappings
} from '@/constants/mappings';
import { 
  booleanFieldsToObject, 
  objectToBooleanFields 
} from '@/utils/transformUtils';
import { ResourceResponse } from '@/types/resource.types';
import { 
  ResourceReviewResponse,
  ContentFeatures,
  ResourceUsage
} from '@/types/resourceReview.types';

/**
 * 將資料庫 Resource 記錄轉換為 API 回應格式
 * @param dbResource - 資料庫資源記錄
 * @param includeAssociations - 是否包含關聯資料
 * @returns API格式的資源對象
 */
export function transformResourceToApi(
  dbResource: any,
  includeAssociations = true
): ResourceResponse {
  // 基本資源轉換
  const resource: ResourceResponse = {
    id: dbResource.id,
    name: dbResource.name,
    url: dbResource.url,
    imageUrl: dbResource.image_url,
    description: dbResource.description,
    videoUrl: dbResource.video_url,
    type: dbResource.type,
    cost: dbResource.cost,
    level: dbResource.level,
    majorCategory: null,
    subCategory: null,
    status: dbResource.status,
    avgRating: null,
    tags: [],
    user: {
      id: dbResource.created_by,
      name: '',
      _id: '',
      roleList: [],
      photoURL: null
    },
    createdAt: dbResource.created_at ? dbResource.created_at.toISOString() : new Date().toISOString(),
    updatedAt: dbResource.updated_at ? dbResource.updated_at.toISOString() : new Date().toISOString(),
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    reviewCount: 0
  };

  // 處理關聯資料
  if (includeAssociations) {
    // 處理使用者資訊
    if (dbResource.User) {
      resource.user = {
        id: dbResource.User.id,
        name: dbResource.User.display_name || dbResource.User.username || '',
        _id: dbResource.User._id || '',
        roleList: dbResource.User.roleList || [],
        photoURL: dbResource.User.avatar_url
      };
    }

    // 處理主分類
    if (dbResource.MajorCategory) {
      resource.majorCategory = dbResource.MajorCategory.name;
    }

    // 處理子分類
    if (dbResource.SubCategory) {
      resource.subCategory = dbResource.SubCategory.name;
    }

    // 處理標籤
    if (dbResource.tags && Array.isArray(dbResource.tags)) {
      resource.tags = dbResource.tags.map((tag: any) => tag.name);
    }

    // 處理統計數據
    if (dbResource.stats) {
      resource.viewCount = dbResource.stats.view_count || 0;
      resource.favoriteCount = dbResource.stats.favorite_count || 0;
      resource.shareCount = dbResource.stats.share_count || 0;
      resource.reviewCount = dbResource.stats.review_count || 0;
    }

    // 處理評分
    if (dbResource.avgRating !== undefined) {
      resource.avgRating = dbResource.avgRating;
    }
  }

  return resource;
}

/**
 * 將 API 資源格式轉換為資料庫格式
 * @param apiResource - API 格式的資源
 * @param userId - 當前用戶 ID
 * @returns 資料庫格式的資源對象
 */
export function transformResourceToDb(
  apiResource: any,
  userId: number
): Partial<ResourceAttributes> {
  return {
    name: apiResource.name,
    url: apiResource.url,
    image_url: apiResource.imageUrl,
    description: apiResource.description,
    video_url: apiResource.videoUrl,
    type: apiResource.type,
    cost: apiResource.cost,
    level: apiResource.level,
    major_category_id: apiResource.majorCategoryId,
    sub_category_id: apiResource.subCategoryId,
    created_by: userId,
    status: apiResource.status || 'active'
  };
}

/**
 * 將資料庫 ResourceReview 記錄轉換為 API 回應格式
 * @param dbReview - 資料庫心得評價記錄
 * @param includeAssociations - 是否包含關聯資料
 * @returns API格式的心得評價對象
 */
export function transformReviewToApi(
  dbReview: any,
  includeAssociations = true
): ResourceReviewResponse {
  // 計算平均評分
  const avgRating = calculateAverageRating(dbReview);
  
  // 基本心得評價轉換
  const review: ResourceReviewResponse = {
    id: dbReview.id,
    content: dbReview.content,
    
    // 評分欄位轉換
    overallImpact: dbReview.score_impact,
    changeMindset: dbReview.score_mindset,
    solveProblems: dbReview.score_problems,
    gainPerspectives: dbReview.score_perspectives,
    achieveGoals: dbReview.score_goals,
    avgRating,
    
    // Boolean 欄位轉物件 - 使用通用函數
    contentFeatures: booleanFieldsToObject<ContentFeatures>(dbReview, contentFeaturesMappings),
    resourceUsage: booleanFieldsToObject<ResourceUsage>(dbReview, resourceUsageMappings),
    
    timeUsage: dbReview.time_usage,
    status: dbReview.status,
    likesCount: 0,
    user: {
      id: dbReview.user_id,
      name: '',
      _id: '',
      roleList: [],
      photoURL: null
    },
    resourceId: dbReview.resource_id,
    tags: [],
    createdAt: dbReview.created_at ? dbReview.created_at.toISOString() : new Date().toISOString(),
    updatedAt: dbReview.updated_at ? dbReview.updated_at.toISOString() : new Date().toISOString()
  };

  // 處理關聯資料
  if (includeAssociations) {
    // 處理使用者資訊
    if (dbReview.User) {
      review.user = {
        id: dbReview.User.id,
        name: dbReview.User.display_name || dbReview.User.username || '',
        _id: dbReview.User._id || '',
        roleList: dbReview.User.roleList || [],
        photoURL: dbReview.User.avatar_url
      };
    }

    // 處理標籤
    if (dbReview.tags && Array.isArray(dbReview.tags)) {
      review.tags = dbReview.tags.map((tag: any) => tag.name);
    }

    // 處理讚數
    if (dbReview.stats) {
      review.likesCount = dbReview.stats.likes_count || 0;
    }
  }

  return review;
}

/**
 * 將 API 心得評價格式轉換為資料庫格式
 * @param apiReview - API格式的心得評價
 * @param userId - 當前用戶 ID
 * @param resourceId - 資源 ID
 * @returns 資料庫格式的心得評價對象
 */
export function transformReviewToDb(
  apiReview: any,
  userId: number,
  resourceId: number
): Partial<ResourceReviewAttributes> {
  // 轉換 Boolean 物件結構 - 使用通用函數
  const contentFeatureFields = objectToBooleanFields(
    apiReview.contentFeatures, 
    contentFeaturesMappings
  );
  
  const resourceUsageFields = objectToBooleanFields(
    apiReview.resourceUsage, 
    resourceUsageMappings
  );
  
  return {
    user_id: userId,
    resource_id: resourceId,
    content: apiReview.content,
    
    // 評分欄位轉換
    score_impact: apiReview.overallImpact,
    score_mindset: apiReview.changeMindset,
    score_problems: apiReview.solveProblems,
    score_perspectives: apiReview.gainPerspectives,
    score_goals: apiReview.achieveGoals,
    
    // 時間使用
    time_usage: apiReview.timeUsage,
    
    // 展開轉換後的 Boolean 欄位
    ...contentFeatureFields,
    ...resourceUsageFields,
    
    status: apiReview.status || 'published'
  };
}

/**
 * 計算評分的平均值
 * @param dbReview - 資料庫心得評價記錄
 * @returns 平均評分
 */
function calculateAverageRating(dbReview: any): number {
  const scores = [
    dbReview.score_impact,
    dbReview.score_mindset,
    dbReview.score_problems,
    dbReview.score_perspectives,
    dbReview.score_goals
  ].filter(score => score !== null && score !== undefined);
  
  if (scores.length === 0) return 0;
  
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  return parseFloat((sum / scores.length).toFixed(1));
}

export const transformService = {
  transformResourceToApi,
  transformResourceToDb,
  transformReviewToApi,
  transformReviewToDb
};

export default transformService;
