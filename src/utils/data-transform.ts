/**
 * 資料轉換工具函數
 * 處理資料庫欄位與 API 欄位之間的轉換
 */

import {
  ResourceDbModel,
  ResourceResponse,
  CreateResourceDto,
  UpdateResourceDto
} from '../types/resource.types';

import {
  ResourceReviewDbModel,
  ResourceReviewResponse,
  CreateResourceReviewDto,
  UpdateResourceReviewDto,
  ContentFeatures,
  ResourceUsage,
  DtoToBooleanFields,
  ScoreValue
} from '../types/resource-review.types';

import { TimeUsage, UserBasicInfo } from '../types/common.types';

// ==========================================
// Resource 資料轉換函數
// ==========================================

/**
 * 從資料庫 Resource 模型轉換為 API 回應格式
 */
export function transformResourceDbToApi(
  dbModel: ResourceDbModel,
  user: UserBasicInfo,
  tags: string[] = [],
  avgRating: number | null = null,
  stats = {
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    reviewCount: 0,
    likeCount: 0
  }
): ResourceResponse {
  return {
    id: dbModel.external_id,               // 使用 external_id 作為前端 ID
    name: dbModel.name,                    // 直接對應
    url: dbModel.url,                      // 直接對應
    imageUrl: dbModel.image_url,           // 蛇形 → 駝峰
    description: dbModel.description,       // 直接對應
    videoUrl: dbModel.video_url,           // 蛇形 → 駝峰
    type: dbModel.type,                    // 直接對應
    level: dbModel.level,                  // 直接對應
    cost: dbModel.cost,
    status: dbModel.status,
    avgRating,
    majorCategory: null, // 需要從 categories 表取得
    subCategory: null,   // 需要從 categories 表取得
    user,
    tags,
    createdAt: dbModel.created_at.toISOString(),
    updatedAt: dbModel.updated_at.toISOString(),
    // 統計數據
    viewCount: stats.viewCount,
    favoriteCount: stats.favoriteCount,
    shareCount: stats.shareCount,
    reviewCount: stats.reviewCount,
    likeCount: stats.likeCount
  };
}

/**
 * 從 API 請求 DTO 轉換為資料庫欄位格式
 */
export function transformResourceApiToDb(
  dto: CreateResourceDto | UpdateResourceDto,
  createdBy?: number
): Partial<ResourceDbModel> {
  const dbData: Partial<ResourceDbModel> = {
    name: dto.name,
    url: dto.url,
    image_url: dto.imageUrl || null,       // 駝峰 → 蛇形
    description: dto.description,
    video_url: dto.videoUrl || null,       // 駝峰 → 蛇形
    type: dto.type,
    level: dto.level,
    cost: dto.cost
  };

  // 建立資源時需要 created_by
  if (createdBy !== undefined) {
    dbData.created_by = createdBy;
  }

  return dbData;
}

// ==========================================
// ResourceReview 資料轉換函數
// ==========================================

/**
 * 從資料庫 ResourceReview 模型轉換為 API 回應格式
 */
export function transformResourceReviewDbToApi(
  dbModel: ResourceReviewDbModel,
  user: UserBasicInfo,
  resourceExternalId: string, // 需要從外部提供 resource 的 external_id
  tags: string[] = [],
  likeCount = 0
): ResourceReviewResponse {
  // 計算平均評分
  const avgRating = calculateAvgRating({
    overallImpact: dbModel.score_impact,
    changeMindset: dbModel.score_mindset,
    solveProblems: dbModel.score_problems,
    gainPerspectives: dbModel.score_perspectives,
    achieveGoals: dbModel.score_goals
  });

  // 轉換 Boolean 欄位為物件
  const { contentFeatures, resourceUsage } = transformBooleansToObjects(dbModel);

  return {
    id: String(dbModel.id),
    content: dbModel.content,
    // 評分欄位：蛇形 → 駝峰
    overallImpact: dbModel.score_impact,
    changeMindset: dbModel.score_mindset,
    solveProblems: dbModel.score_problems,
    gainPerspectives: dbModel.score_perspectives,
    achieveGoals: dbModel.score_goals,
    avgRating,
    // 時間使用
    timeUsage: dbModel.time_usage,
    // Boolean 欄位轉換為物件
    contentFeatures,
    resourceUsage,
    status: dbModel.status,
    likeCount,
    user,
    resourceId: resourceExternalId, // 使用傳入的 resource external_id
    tags,
    createdAt: dbModel.created_at.toISOString(),
    updatedAt: dbModel.updated_at.toISOString()
  };
}

/**
 * 從 API 請求 DTO 轉換為資料庫欄位格式
 */
export function transformResourceReviewApiToDb(
  dto: CreateResourceReviewDto | UpdateResourceReviewDto,
  userId?: number,
  resourceId?: number
): Partial<ResourceReviewDbModel> {
  const dbData: Partial<ResourceReviewDbModel> = {
    content: dto.content,
    // 評分欄位：駝峰 → 蛇形
    score_impact: dto.overallImpact,
    score_mindset: dto.changeMindset,
    score_problems: dto.solveProblems,
    score_perspectives: dto.gainPerspectives,
    score_goals: dto.achieveGoals,
    // 時間使用
    time_usage: dto.timeUsage || null
  };

  // 物件轉換為 Boolean 欄位
  const booleanFields = transformObjectsToBooleans(
    dto.contentFeatures,
    dto.resourceUsage
  );
  Object.assign(dbData, booleanFields);

  // 建立心得時需要的欄位
  if (userId !== undefined) {
    dbData.user_id = userId;
  }
  if (resourceId !== undefined) {
    dbData.resource_id = resourceId;
  }

  return dbData;
}

// ==========================================
// Boolean 欄位與物件互轉函數
// ==========================================

/**
 * 將資料庫的 Boolean 欄位轉換為結構化物件
 */
export function transformBooleansToObjects(dbModel: ResourceReviewDbModel): {
  contentFeatures: ContentFeatures;
  resourceUsage: ResourceUsage;
} {
  const contentFeatures: ContentFeatures = {
    wellStructured: dbModel.well_structured,
    practiceFocused: dbModel.practice_focused,
    wellRoundedConcepts: dbModel.well_rounded_concepts,
    thoughtProvoking: dbModel.thought_provoking,
    progressiveLearning: dbModel.progressive_learning,
    problemBased: dbModel.problem_based,
    realWorldExamples: dbModel.real_world_examples,
    interactive: dbModel.interactive,
    visuallyRich: dbModel.visually_rich
  };

  const resourceUsage: ResourceUsage = {
    withOnlineCourses: dbModel.with_online_courses,
    withBooks: dbModel.with_books,
    withOtherTools: dbModel.with_other_tools,
    withCommunity: dbModel.with_community,
    onlyThisResource: dbModel.only_this_resource,
    notApplicableResource: dbModel.not_applicable_resource
  };

  return { contentFeatures, resourceUsage };
}

/**
 * 將結構化物件轉換為資料庫的 Boolean 欄位
 */
export function transformObjectsToBooleans(
  contentFeatures?: Partial<ContentFeatures>,
  resourceUsage?: Partial<ResourceUsage>
): Partial<DtoToBooleanFields> {
  const booleanFields: Partial<DtoToBooleanFields> = {};

  // 內容特色物件 → Boolean 欄位
  if (contentFeatures) {
    if (contentFeatures.wellStructured !== undefined) {
      booleanFields.well_structured = contentFeatures.wellStructured;
    }
    if (contentFeatures.practiceFocused !== undefined) {
      booleanFields.practice_focused = contentFeatures.practiceFocused;
    }
    if (contentFeatures.wellRoundedConcepts !== undefined) {
      booleanFields.well_rounded_concepts = contentFeatures.wellRoundedConcepts;
    }
    if (contentFeatures.thoughtProvoking !== undefined) {
      booleanFields.thought_provoking = contentFeatures.thoughtProvoking;
    }
    if (contentFeatures.progressiveLearning !== undefined) {
      booleanFields.progressive_learning = contentFeatures.progressiveLearning;
    }
    if (contentFeatures.problemBased !== undefined) {
      booleanFields.problem_based = contentFeatures.problemBased;
    }
    if (contentFeatures.realWorldExamples !== undefined) {
      booleanFields.real_world_examples = contentFeatures.realWorldExamples;
    }
    if (contentFeatures.interactive !== undefined) {
      booleanFields.interactive = contentFeatures.interactive;
    }
    if (contentFeatures.visuallyRich !== undefined) {
      booleanFields.visually_rich = contentFeatures.visuallyRich;
    }
  }

  // 資源使用物件 → Boolean 欄位
  if (resourceUsage) {
    if (resourceUsage.withOnlineCourses !== undefined) {
      booleanFields.with_online_courses = resourceUsage.withOnlineCourses;
    }
    if (resourceUsage.withBooks !== undefined) {
      booleanFields.with_books = resourceUsage.withBooks;
    }
    if (resourceUsage.withOtherTools !== undefined) {
      booleanFields.with_other_tools = resourceUsage.withOtherTools;
    }
    if (resourceUsage.withCommunity !== undefined) {
      booleanFields.with_community = resourceUsage.withCommunity;
    }
    if (resourceUsage.onlyThisResource !== undefined) {
      booleanFields.only_this_resource = resourceUsage.onlyThisResource;
    }
    if (resourceUsage.notApplicableResource !== undefined) {
      booleanFields.not_applicable_resource = resourceUsage.notApplicableResource;
    }
  }

  return booleanFields;
}

// ==========================================
// 計算輔助函數
// ==========================================

/**
 * 計算 5 個評分項目的平均值
 */
export function calculateAvgRating(scores: {
  overallImpact: number;
  changeMindset: number;
  solveProblems: number;
  gainPerspectives: number;
  achieveGoals: number;
}): number {
  const total = scores.overallImpact + scores.changeMindset + scores.solveProblems + 
                scores.gainPerspectives + scores.achieveGoals;
  const average = total / 5;
  
  // 四捨五入至小數點後一位（配合 0.5 分間距）
  return Math.round(average * 2) / 2;
}

/**
 * 驗證評分數值是否有效（支援 0.5 分間距）
 */
export function isValidScoreValue(value: number): value is ScoreValue {
  const validScores: ScoreValue[] = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  return validScores.includes(value as ScoreValue);
}

/**
 * 驗證時間使用選項是否有效
 */
export function isValidTimeUsage(value: string): value is TimeUsage {
  const validOptions: TimeUsage[] = [
    '1_2_hours_daily',
    'few_intensive_days_week',
    'spare_moments',
    'not_applicable_time'
  ];
  return validOptions.includes(value as TimeUsage);
}

// ==========================================
// 資料映射常數
// ==========================================

/**
 * 資料庫欄位名稱到 API 欄位名稱的映射表
 */
export const DB_TO_API_FIELD_MAPPING = {
  // Resource 欄位映射
  resource: {
    name: 'name',
    url: 'url',
    image_url: 'imageUrl',
    description: 'description',
    video_url: 'videoUrl',
    type: 'type',
    level: 'level',
    created_by: 'createdBy',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  // ResourceReview 欄位映射
  resourceReview: {
    score_impact: 'overallImpact',
    score_mindset: 'changeMindset',
    score_problems: 'solveProblems',
    score_perspectives: 'gainPerspectives',
    score_goals: 'achieveGoals',
    time_usage: 'timeUsage',
    resource_id: 'resourceId',
    user_id: 'userId',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  }
} as const;
