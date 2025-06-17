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
