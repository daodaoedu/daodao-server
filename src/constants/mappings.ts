/**
 * 欄位映射常數配置
 */

// 內容特色欄位映射配置
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
} as const;

// 資源使用欄位映射配置
export const resourceUsageMappings = {
  withOnlineCourses: 'with_online_courses',
  withBooks: 'with_books',
  withOtherTools: 'with_other_tools',
  withCommunity: 'with_community',
  onlyThisResource: 'only_this_resource',
  notApplicableResource: 'not_applicable_resource'
} as const;

// 映射配置類型
export type MappingConfig = Record<string, string>;

// 資源類型選項
export const RESOURCE_TYPES = [
  'learning_platform_app',
  'learning_tools',
  'books_articles',
  'video_content',
  'podcast_content',
  'workshops_courses',
  'professional_certificates',
  'community_organization',
  'other'
] as const;

// 費用類型選項
export const COST_TYPES = [
  'free',
  'paid',
  'partial_free'
] as const;

// 程度類型選項
export const LEVEL_TYPES = [
  'beginner',
  'intermediate',
  'expert',
  'all_levels'
] as const;

// 資源狀態選項
export const RESOURCE_STATUSES = [
  'draft',
  'active',
  'archived',
  'reported'
] as const;

// 心得評價狀態選項
export const REVIEW_STATUSES = [
  'draft',
  'published',
  'archived',
  'reported'
] as const;

// 時間使用選項
export const TIME_USAGES = [
  '1_2_hours_daily',
  'few_intensive_days_week',
  'spare_moments',
  'not_applicable_time'
] as const;

// 排序欄位選項
export const SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'avgRating',
  'viewCount',
  'reviewCount'
] as const;

// 排序方向選項
export const SORT_DIRECTIONS = [
  'asc',
  'desc'
] as const;

// 預設分頁限制
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
