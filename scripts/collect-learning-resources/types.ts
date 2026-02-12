/**
 * Types for the learning resources collector script.
 * Aligns with the `resources` table schema in Prisma.
 */

/** Resource types matching RESOURCE_TYPES in src/constants/mappings.ts */
export const RESOURCE_TYPE = {
  LEARNING_PLATFORM_APP: 'learning_platform_app',
  LEARNING_TOOLS: 'learning_tools',
  BOOKS_ARTICLES: 'books_articles',
  VIDEO_CONTENT: 'video_content',
  PODCAST_CONTENT: 'podcast_content',
  WORKSHOPS_COURSES: 'workshops_courses',
  PROFESSIONAL_CERTIFICATES: 'professional_certificates',
  COMMUNITY_ORGANIZATION: 'community_organization',
  OTHER: 'other',
} as const;

/** Cost types matching COST_TYPES in src/constants/mappings.ts */
export const COST_TYPE = {
  FREE: 'free',
  PAID: 'paid',
  PARTIAL_FREE: 'partial_free',
} as const;

/** Level types matching LEVEL_TYPES in src/constants/mappings.ts */
export const LEVEL_TYPE = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  EXPERT: 'expert',
  ALL_LEVELS: 'all_levels',
} as const;

export type ResourceType = (typeof RESOURCE_TYPE)[keyof typeof RESOURCE_TYPE];
export type CostType = (typeof COST_TYPE)[keyof typeof COST_TYPE];
export type LevelType = (typeof LEVEL_TYPE)[keyof typeof LEVEL_TYPE];
export type SourcePlatform = 'youtube' | 'github' | 'threads';

/**
 * A collected resource ready for CSV output.
 * Fields map directly to the `resources` Prisma model.
 */
export interface CollectedResource {
  /** Resource title (max 255 chars) */
  name: string;
  /** Link to the resource (max 1000 chars) */
  url: string;
  /** Thumbnail or preview image URL */
  image_url: string;
  /** Resource description */
  description: string;
  /** Video URL (primarily for YouTube) */
  video_url: string;
  /** Resource type from RESOURCE_TYPES */
  type: ResourceType;
  /** Cost type */
  cost: CostType;
  /** Difficulty level */
  level: LevelType;
  /** Comma-separated tags */
  tags: string;
  /** Platform where this resource was collected from */
  source_platform: SourcePlatform;
  /** Original identifier on the source platform */
  source_id: string;
  /** When the resource was originally published */
  published_at: string;
}

/** Configuration for a collector */
export interface CollectorConfig {
  /** Search keywords to use */
  keywords: string[];
  /** Maximum number of results to fetch per keyword */
  maxResultsPerKeyword: number;
}

/** Result from a collector run */
export interface CollectorResult {
  platform: SourcePlatform;
  resources: CollectedResource[];
  errors: string[];
}
