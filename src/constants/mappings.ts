/**
 * 常數映射
 */

// 默認分頁限制
export const DEFAULT_PAGE_LIMIT = 20;

// 最大分頁限制
export const MAX_PAGE_LIMIT = 100;

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
