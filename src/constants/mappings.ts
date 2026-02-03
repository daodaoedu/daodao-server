/**
 * 常數映射
 */

// 默認分頁限制
export const DEFAULT_PAGE_LIMIT = 20;

// 最大分頁限制
export const MAX_PAGE_LIMIT = 100;

// 資源分頁限制 (查看更多模式)
export const DEFAULT_RESOURCE_PAGE_LIMIT = 5;  // 資源預設每頁 5 筆
export const MAX_RESOURCE_PAGE_LIMIT = 20;     // 資源最大每頁 20 筆

// 評論分頁限制 (查看更多模式)
export const DEFAULT_REVIEW_PAGE_LIMIT = 2;  // 心得預設每頁 2 筆
export const MAX_REVIEW_PAGE_LIMIT = 10;     // 心得最大每頁 10 筆

// 資源類型
export const RESOURCE_TYPES = {
  LEARNING_PLATFORM_APP: 'learning_platform_app',
  LEARNING_TOOLS: 'learning_tools',
  BOOKS_ARTICLES: 'books_articles',
  VIDEO_CONTENT: 'video_content',
  PODCAST_CONTENT: 'podcast_content',
  WORKSHOPS_COURSES: 'workshops_courses',
  PROFESSIONAL_CERTIFICATES: 'professional_certificates',
  COMMUNITY_ORGANIZATION: 'community_organization',
  OTHER: 'other'
};

// 費用類型
export const COST_TYPES = {
  FREE: 'free',
  PAID: 'paid',
  PARTIAL_FREE: 'partial_free'
};

// 難度等級
export const LEVEL_TYPES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  EXPERT: 'expert',
  ALL_LEVELS: 'all_levels'
};

// 資源狀態
export const RESOURCE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  REPORTED: 'reported'
};

// 評價狀態
export const REVIEW_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  REPORTED: 'reported'
};

// 內容特徵欄位映射 (API格式 -> 資料庫格式)
export const contentFeaturesMappings = {
  wellStructured: 'well_structured',
  practiceFocused: 'practice_focused',
  wellRoundedConcepts: 'well_rounded_concepts',
  thoughtProvoking: 'thought_provoking',
  progressiveLearning: 'progressive_learning',
  problemBased: 'problem_based',
  realWorldExamples: 'real_world_examples',
  interactive: 'interactive',
  visuallyRich: 'visually_rich'
};

// 資源使用方式欄位映射 (API格式 -> 資料庫格式)
export const resourceUsageMappings = {
  withOnlineCourses: 'with_online_courses',
  withBooks: 'with_books',
  withOtherTools: 'with_other_tools',
  withCommunity: 'with_community',
  onlyThisResource: 'only_this_resource',
  notApplicableResource: 'not_applicable_resource'
};

// 排序欄位
export const SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  NAME: 'name'
} as const;

// 排序方向
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

// ============================================
// 學習資源收集功能常數
// ============================================

// 收集內容分頁限制
export const DEFAULT_COLLECTION_PAGE_LIMIT = 20;
export const MAX_COLLECTION_PAGE_LIMIT = 100;

// 預設抓取間隔 (秒)
export const DEFAULT_FETCH_INTERVAL = 3600; // 1 小時

// 自動核准的最低信心分數
export const AUTO_APPROVE_MIN_CONFIDENCE = 0.9;

// 平台特定設定
export const PLATFORM_CONFIG = {
  youtube: {
    maxResultsPerFetch: 50,
    defaultFetchInterval: 3600,
  },
  github: {
    maxResultsPerFetch: 100,
    defaultFetchInterval: 7200,
  },
  threads: {
    maxResultsPerFetch: 25,
    defaultFetchInterval: 1800,
  },
} as const;
