/**
 * 資料轉換服務
 * 處理資料庫記錄與 API 格式之間的轉換
 */

import { ResourceAttributes } from '@/models/resource';
import { ResourceReviewAttributes } from '@/models/resource-review';
import { Category } from '@/models/index';
import { 
  contentFeaturesMappings, 
  resourceUsageMappings
} from '@/constants/mappings';
import { 
  booleanFieldsToObject, 
  objectToBooleanFields 
} from '@/utils/transform-utils';
import { ResourceResponse } from '@/types/resource.types';
import { 
  ResourceReviewResponse,
  ContentFeatures,
  ResourceUsage,
  TimeUsage
} from '@/types/resource-review.types';

/**
 * 將資料庫 Resource 記錄轉換為 API 回應格式
 * @param dbResource - 資料庫資源記錄
 * @param includeAssociations - 是否包含關聯資料
 * @returns API格式的資源對象
 */
export function transformResourceToApi(
  dbResource: Record<string, unknown>,
  includeAssociations = true
): ResourceResponse {
  // 基本資源轉換
  const resource: ResourceResponse = {
    id: String(dbResource.external_id || dbResource.id), // 使用 external_id (UUID)，如果沒有則降級到 id
    name: String(dbResource.name || ''),
    url: String(dbResource.url || ''),
    imageUrl: dbResource.image_url ? String(dbResource.image_url) : null,
    description: String(dbResource.description || ''),
    videoUrl: dbResource.video_url ? String(dbResource.video_url) : null,
    type: String(dbResource.type || ''),
    cost: String(dbResource.cost || ''),
    level: String(dbResource.level || ''),
    majorCategory: null,
    subCategory: null,
    status: String(dbResource.status || 'active'),
    avgRating: null,
    tags: [],
    user: {
      id: Number(dbResource.created_by || 0),
      name: '',
      _id: '',
      roleList: [],
      photoURL: null
    },
    createdAt: (dbResource.created_at instanceof Date) ? dbResource.created_at.toISOString() : new Date().toISOString(),
    updatedAt: (dbResource.updated_at instanceof Date) ? dbResource.updated_at.toISOString() : new Date().toISOString(),
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    reviewCount: 0,
    likeCount: 0
  };

  // 處理關聯資料
  if (includeAssociations) {
    // 處理使用者資訊
    if (dbResource.User && typeof dbResource.User === 'object') {
      const user = dbResource.User as Record<string, unknown>;
      resource.user = {
        id: Number(user.id || 0),
        name: String(user.display_name || user.username || ''),
        _id: String(user._id || ''),
        roleList: Array.isArray(user.roleList) ? user.roleList : [],
        photoURL: user.avatar_url ? String(user.avatar_url) : null
      };
    }

    // 處理主分類
    if (dbResource.majorCategory && typeof dbResource.majorCategory === 'object') {
      const majorCategory = dbResource.majorCategory as Record<string, unknown>;
      resource.majorCategory = String(majorCategory.name || '');
    }

    // 處理子分類
    if (dbResource.subCategory && typeof dbResource.subCategory === 'object') {
      const subCategory = dbResource.subCategory as Record<string, unknown>;
      resource.subCategory = String(subCategory.name || '');
    }

    // 處理標籤
    if (dbResource.tags && Array.isArray(dbResource.tags)) {
      resource.tags = (dbResource.tags as Array<{name: string}>).map((tag) => tag.name);
    }

    // 處理統計數據
    if (dbResource.stats && typeof dbResource.stats === 'object') {
      const stats = dbResource.stats as Record<string, unknown>;
      resource.viewCount = Number(stats.view_count || 0);
      resource.favoriteCount = Number(stats.favorite_count || 0);
      resource.shareCount = Number(stats.share_count || 0);
      resource.reviewCount = Number(stats.review_count || 0);
      resource.likeCount = Number(stats.like_count || 0);
    }

    // 處理評分
    if (dbResource.avgRating !== undefined && dbResource.avgRating !== null) {
      resource.avgRating = Number(dbResource.avgRating);
    }
  }

  return resource;
}

/**
 * 根據分類名稱查找分類 ID
 * @param categoryName - 分類名稱
 * @returns 分類 ID 或 null
 */
async function getCategoryIdByName(categoryName: string): Promise<number | null> {
  if (!categoryName) return null;
  
  const category = await Category.findOne({
    where: { name: categoryName }
  });
  
  return category ? category.get('id') as number : null;
}

/**
 * 將 API 資源格式轉換為資料庫格式
 * @param apiResource - API 格式的資源
 * @param userId - 當前用戶 ID
 * @returns 資料庫格式的資源對象
 */
export async function transformResourceToDb(
  apiResource: Record<string, unknown>,
  userId: number
): Promise<Partial<ResourceAttributes>> {
  // 如果提供了分類名稱，查找對應的 ID
  let majorCategoryId = null;
  let subCategoryId = null;
  
  if (apiResource.majorCategory && typeof apiResource.majorCategory === 'string') {
    majorCategoryId = await getCategoryIdByName(String(apiResource.majorCategory));
  }
  
  if (apiResource.subCategory && typeof apiResource.subCategory === 'string') {
    subCategoryId = await getCategoryIdByName(String(apiResource.subCategory));
  }
  
  return {
    name: apiResource.name ? String(apiResource.name) : undefined,
    url: apiResource.url ? String(apiResource.url) : undefined,
    image_url: apiResource.imageUrl ? String(apiResource.imageUrl) : undefined,
    description: apiResource.description ? String(apiResource.description) : undefined,
    video_url: apiResource.videoUrl ? String(apiResource.videoUrl) : undefined,
    type: apiResource.type ? String(apiResource.type) : undefined,
    cost: apiResource.cost ? String(apiResource.cost) : undefined,
    level: apiResource.level ? String(apiResource.level) : undefined,
    major_category_id: majorCategoryId ?? undefined,
    sub_category_id: subCategoryId ?? undefined,
    created_by: userId,
    status: apiResource.status ? String(apiResource.status) : 'active'
  };
}

/**
 * 將資料庫 ResourceReview 記錄轉換為 API 回應格式
 * @param dbReview - 資料庫心得評價記錄
 * @param includeAssociations - 是否包含關聯資料
 * @returns API格式的心得評價對象
 */
export function transformReviewToApi(
  dbReview: Record<string, unknown>,
  includeAssociations = true
): ResourceReviewResponse {
  // 計算平均評分
  const avgRating = calculateAverageRating(dbReview);
  
  // 基本心得評價轉換
  const review: ResourceReviewResponse = {
    id: String(dbReview.id || ''), // 轉換為字串型別
    content: String(dbReview.content || ''),
    
    // 評分欄位轉換
    overallImpact: Number(dbReview.score_impact || 0),
    changeMindset: Number(dbReview.score_mindset || 0),
    solveProblems: Number(dbReview.score_problems || 0),
    gainPerspectives: Number(dbReview.score_perspectives || 0),
    achieveGoals: Number(dbReview.score_goals || 0),
    avgRating,
    
    // Boolean 欄位轉物件 - 使用通用函數
    contentFeatures: booleanFieldsToObject<ContentFeatures>(dbReview as Record<string, unknown>, contentFeaturesMappings),
    resourceUsage: booleanFieldsToObject<ResourceUsage>(dbReview as Record<string, unknown>, resourceUsageMappings),
    
    timeUsage: dbReview.time_usage as TimeUsage | null,
    status: String(dbReview.status || 'published'),
    likeCount: 0,
    user: {
      id: Number(dbReview.user_id || 0),
      name: '',
      _id: '',
      roleList: [],
      photoURL: null
    },
    resourceId: String(dbReview.resource_id || ''),
    tags: [],
    createdAt: (dbReview.created_at instanceof Date) ? dbReview.created_at.toISOString() : new Date().toISOString(),
    updatedAt: (dbReview.updated_at instanceof Date) ? dbReview.updated_at.toISOString() : new Date().toISOString()
  };

  // 處理關聯資料
  if (includeAssociations) {
    // 處理使用者資訊
    if (dbReview.User && typeof dbReview.User === 'object') {
      const user = dbReview.User as Record<string, unknown>;
      review.user = {
        id: Number(user.id || 0),
        name: String(user.display_name || user.username || ''),
        _id: String(user._id || ''),
        roleList: Array.isArray(user.roleList) ? user.roleList : [],
        photoURL: user.avatar_url ? String(user.avatar_url) : null
      };
    }

    // 處理標籤
    if (dbReview.tags && Array.isArray(dbReview.tags)) {
      review.tags = (dbReview.tags as Array<{name: string}>).map((tag) => tag.name);
    }

    // 處理讚數
    if (dbReview.stats && typeof dbReview.stats === 'object') {
      const stats = dbReview.stats as Record<string, unknown>;
      review.likeCount = Number(stats.likes_count || 0);
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
  apiReview: Record<string, unknown>,
  userId: number,
  resourceId: number
): Partial<ResourceReviewAttributes> {
  // 轉換 Boolean 物件結構 - 使用通用函數
  const contentFeatureFields = objectToBooleanFields(
    apiReview.contentFeatures as Record<string, boolean>, 
    contentFeaturesMappings
  );
  
  const resourceUsageFields = objectToBooleanFields(
    apiReview.resourceUsage as Record<string, boolean>, 
    resourceUsageMappings
  );
  
  return {
    user_id: userId,
    resource_id: resourceId,
    content: apiReview.content ? String(apiReview.content) : undefined,
    
    // 評分欄位轉換
    score_impact: apiReview.overallImpact ? Number(apiReview.overallImpact) : undefined,
    score_mindset: apiReview.changeMindset ? Number(apiReview.changeMindset) : undefined,
    score_problems: apiReview.solveProblems ? Number(apiReview.solveProblems) : undefined,
    score_perspectives: apiReview.gainPerspectives ? Number(apiReview.gainPerspectives) : undefined,
    score_goals: apiReview.achieveGoals ? Number(apiReview.achieveGoals) : undefined,
    
    // 時間使用
    time_usage: apiReview.timeUsage ? String(apiReview.timeUsage) : undefined,
    
    // 展開轉換後的 Boolean 欄位
    ...contentFeatureFields,
    ...resourceUsageFields,
    
    status: apiReview.status ? String(apiReview.status) : 'published'
  };
}

/**
 * 計算評分的平均值
 * @param dbReview - 資料庫心得評價記錄
 * @returns 平均評分
 */
function calculateAverageRating(dbReview: Record<string, unknown>): number {
  const scores = [
    dbReview.score_impact,
    dbReview.score_mindset,
    dbReview.score_problems,
    dbReview.score_perspectives,
    dbReview.score_goals
  ].filter(score => score !== null && score !== undefined && typeof score === 'number');
  
  if (scores.length === 0) return 0;
  
  const sum = scores.reduce((acc: number, curr: number) => acc + curr, 0);
  return parseFloat((sum / scores.length).toFixed(1));
}

export const transformService = {
  transformResourceToApi,
  transformResourceToDb,
  transformReviewToApi,
  transformReviewToDb
};

export default transformService;
