/**
 * Collection 相關的 Zod 驗證器
 */

import { z } from 'zod';
import {
  COLLECTION_PLATFORMS,
  COLLECTION_SOURCE_TYPES,
  COLLECTED_CONTENT_STATUS,
} from '@/types/collection.types';

// 平台列舉
const platformEnum = z.enum([
  COLLECTION_PLATFORMS.YOUTUBE,
  COLLECTION_PLATFORMS.GITHUB,
  COLLECTION_PLATFORMS.THREADS,
  COLLECTION_PLATFORMS.TIKTOK,
  COLLECTION_PLATFORMS.PODCAST,
  COLLECTION_PLATFORMS.FACEBOOK,
  COLLECTION_PLATFORMS.INSTAGRAM,
  COLLECTION_PLATFORMS.TWITTER,
  COLLECTION_PLATFORMS.DCARD,
  COLLECTION_PLATFORMS.PTT,
  COLLECTION_PLATFORMS.MEDIUM,
  COLLECTION_PLATFORMS.HAHOW,
  COLLECTION_PLATFORMS.PRESSPLAY,
  COLLECTION_PLATFORMS.RSS,
  COLLECTION_PLATFORMS.OTHER,
]);

// 來源類型列舉
const sourceTypeEnum = z.enum([
  COLLECTION_SOURCE_TYPES.CHANNEL,
  COLLECTION_SOURCE_TYPES.PLAYLIST,
  COLLECTION_SOURCE_TYPES.USER,
  COLLECTION_SOURCE_TYPES.HASHTAG,
  COLLECTION_SOURCE_TYPES.KEYWORD,
  COLLECTION_SOURCE_TYPES.TOPIC,
  COLLECTION_SOURCE_TYPES.REPOSITORY,
  COLLECTION_SOURCE_TYPES.RSS_FEED,
  COLLECTION_SOURCE_TYPES.OTHER,
]);

// 內容狀態列舉
const contentStatusEnum = z.enum([
  COLLECTED_CONTENT_STATUS.PENDING,
  COLLECTED_CONTENT_STATUS.CLASSIFIED,
  COLLECTED_CONTENT_STATUS.APPROVED,
  COLLECTED_CONTENT_STATUS.REJECTED,
  COLLECTED_CONTENT_STATUS.CONVERTED,
]);

// ============================================
// 收集來源 Schemas
// ============================================

/**
 * 建立收集來源 Schema
 */
export const createCollectionSourceSchema = z.object({
  platform: platformEnum,
  sourceType: sourceTypeEnum,
  sourceValue: z.string().min(1).max(500),
  sourceName: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional().default(true),
  fetchInterval: z.number().int().min(60).max(86400).optional().default(3600),
  settings: z.record(z.unknown()).optional(),
});

/**
 * 更新收集來源 Schema
 */
export const updateCollectionSourceSchema = z.object({
  sourceName: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  fetchInterval: z.number().int().min(60).max(86400).optional(),
  settings: z.record(z.unknown()).optional(),
});

/**
 * 收集來源查詢參數 Schema
 */
export const collectionSourceQuerySchema = z.object({
  platform: platformEnum.optional(),
  sourceType: sourceTypeEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});

// ============================================
// 收集內容 Schemas
// ============================================

/**
 * 收集內容查詢參數 Schema
 */
export const collectedContentQuerySchema = z.object({
  platform: platformEnum.optional(),
  status: contentStatusEnum.optional(),
  isLearningContent: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sourceId: z.string().uuid().optional(),
  minConfidence: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z
    .enum(['createdAt', 'publishedAt', 'engagementCount', 'confidenceScore'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * 審核內容 Schema
 */
export const reviewContentSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNote: z.string().max(1000).optional(),
  overrideName: z.string().max(255).optional(),
  overrideDescription: z.string().max(5000).optional(),
  overrideType: z.string().max(100).optional(),
  overrideLevel: z.string().max(50).optional(),
  overrideTags: z.array(z.string().max(100)).max(10).optional(),
  overrideCategoryId: z.number().int().positive().optional(),
});

/**
 * 批次審核 Schema
 */
export const bulkReviewSchema = z.object({
  contentIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['approve', 'reject']),
  reviewNote: z.string().max(1000).optional(),
});

// ============================================
// 抓取 Schemas
// ============================================

/**
 * 手動抓取 Schema
 */
export const fetchSourceSchema = z.object({
  sourceId: z.string().uuid(),
});

/**
 * 批次抓取 Schema
 */
export const fetchAllSourcesSchema = z.object({
  platforms: z.array(platformEnum).optional(),
  force: z.boolean().optional().default(false),
});

// ============================================
// 回應 Schemas
// ============================================

/**
 * 收集來源回應 Schema
 */
export const collectionSourceResponseSchema = z.object({
  id: z.string().uuid(),
  platform: platformEnum,
  sourceType: sourceTypeEnum,
  sourceValue: z.string(),
  sourceName: z.string().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  fetchInterval: z.number(),
  lastFetchedAt: z.string().nullable(),
  fetchCount: z.number(),
  errorCount: z.number(),
  lastError: z.string().nullable(),
  settings: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * 收集內容回應 Schema
 */
export const collectedContentResponseSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string(),
  platform: platformEnum,
  platformContentId: z.string(),
  originalUrl: z.string().url(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  videoUrl: z.string().url().nullable(),
  authorName: z.string().nullable(),
  authorUrl: z.string().url().nullable(),
  authorAvatarUrl: z.string().url().nullable(),
  publishedAt: z.string().nullable(),
  engagementCount: z.number(),
  stats: z.record(z.unknown()).nullable(),
  language: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  status: contentStatusEnum,
  processedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  reviewNote: z.string().nullable(),
  isLearningContent: z.boolean().nullable(),
  confidenceScore: z.number().nullable(),
  suggestedType: z.string().nullable(),
  suggestedLevel: z.string().nullable(),
  suggestedTags: z.array(z.string()),
  suggestedCategory: z.number().nullable(),
  classificationReason: z.string().nullable(),
  resourceId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * 收集統計回應 Schema
 */
export const collectionStatsResponseSchema = z.object({
  totalSources: z.number(),
  activeSources: z.number(),
  totalContents: z.number(),
  contentsByStatus: z.object({
    pending: z.number(),
    classified: z.number(),
    approved: z.number(),
    rejected: z.number(),
    converted: z.number(),
  }),
  contentsByPlatform: z.record(z.number()),
  recentFetches: z.object({
    last24Hours: z.number(),
    last7Days: z.number(),
    last30Days: z.number(),
  }),
});

// 匯出類型
export type CreateCollectionSourceInput = z.infer<typeof createCollectionSourceSchema>;
export type UpdateCollectionSourceInput = z.infer<typeof updateCollectionSourceSchema>;
export type CollectionSourceQueryInput = z.infer<typeof collectionSourceQuerySchema>;
export type CollectedContentQueryInput = z.infer<typeof collectedContentQuerySchema>;
export type ReviewContentInput = z.infer<typeof reviewContentSchema>;
export type BulkReviewInput = z.infer<typeof bulkReviewSchema>;
