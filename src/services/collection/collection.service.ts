/**
 * 學習資源收集服務
 * Learning Resource Collection Service
 */

import { PrismaClient } from '../../../generated/prisma';
import {
  CollectionPlatform,
  CollectionSourceType,
  CollectedContentStatus,
  COLLECTED_CONTENT_STATUS,
  CollectionSourceDbModel,
  CollectedContentDbModel,
  CollectionSourceResponse,
  CollectedContentResponse,
  CreateCollectionSourceDto,
  UpdateCollectionSourceDto,
  ReviewContentDto,
  BulkReviewDto,
  RawCollectedContent,
  CollectionSourceQueryParams,
  CollectedContentQueryParams,
  CollectionStats,
} from '@/types/collection.types';
import { createAdapter, isPlatformImplemented } from './adapters';
import {
  DEFAULT_COLLECTION_PAGE_LIMIT,
  MAX_COLLECTION_PAGE_LIMIT,
} from '@/constants/mappings';

// Prisma client instance
const prisma = new PrismaClient();

// ============================================
// 轉換函式
// ============================================

/**
 * 轉換收集來源為 API 回應格式
 */
const transformSourceToResponse = (
  source: CollectionSourceDbModel
): CollectionSourceResponse => ({
  id: source.external_id,
  platform: source.platform,
  sourceType: source.source_type,
  sourceValue: source.source_value,
  sourceName: source.source_name,
  description: source.description,
  isActive: source.is_active,
  fetchInterval: source.fetch_interval,
  lastFetchedAt: source.last_fetched_at?.toISOString() || null,
  fetchCount: source.fetch_count,
  errorCount: source.error_count,
  lastError: source.last_error,
  settings: source.settings as Record<string, unknown> | null,
  createdAt: source.created_at.toISOString(),
  updatedAt: source.updated_at.toISOString(),
});

/**
 * 轉換收集內容為 API 回應格式
 */
const transformContentToResponse = (
  content: CollectedContentDbModel & { source?: { external_id: string } }
): CollectedContentResponse => ({
  id: content.external_id,
  sourceId: content.source?.external_id || '',
  platform: content.platform,
  platformContentId: content.platform_content_id,
  originalUrl: content.original_url,
  title: content.title,
  description: content.description,
  thumbnailUrl: content.thumbnail_url,
  videoUrl: content.video_url,
  authorName: content.author_name,
  authorUrl: content.author_url,
  authorAvatarUrl: content.author_avatar_url,
  publishedAt: content.published_at?.toISOString() || null,
  engagementCount: content.engagement_count,
  stats: content.stats as Record<string, unknown> | null,
  language: content.language,
  durationSeconds: content.duration_seconds,
  status: content.status,
  processedAt: content.processed_at?.toISOString() || null,
  reviewedAt: content.reviewed_at?.toISOString() || null,
  reviewNote: content.review_note,
  isLearningContent: content.is_learning_content,
  confidenceScore: content.confidence_score ? Number(content.confidence_score) : null,
  suggestedType: content.suggested_type,
  suggestedLevel: content.suggested_level,
  suggestedTags: content.suggested_tags || [],
  suggestedCategory: content.suggested_category,
  classificationReason: content.classification_reason,
  resourceId: null, // TODO: 從 resource 取得 external_id
  createdAt: content.created_at.toISOString(),
  updatedAt: content.updated_at.toISOString(),
});

// ============================================
// 收集來源管理
// ============================================

/**
 * 建立收集來源
 */
export const createCollectionSource = async (
  data: CreateCollectionSourceDto,
  userId?: number
): Promise<CollectionSourceResponse> => {
  // 檢查平台是否已實作
  if (!isPlatformImplemented(data.platform)) {
    throw new Error(`Platform ${data.platform} is not implemented yet`);
  }

  // 驗證來源
  const adapter = createAdapter(data.platform);
  if (adapter) {
    const isValid = await adapter.validateSource(data.sourceType, data.sourceValue);
    if (!isValid) {
      throw new Error(`Invalid source: ${data.sourceType} - ${data.sourceValue}`);
    }
  }

  const source = await prisma.collection_sources.create({
    data: {
      platform: data.platform,
      source_type: data.sourceType,
      source_value: data.sourceValue,
      source_name: data.sourceName || null,
      description: data.description || null,
      is_active: data.isActive ?? true,
      fetch_interval: data.fetchInterval || 3600,
      settings: data.settings || null,
      created_by: userId || null,
    },
  });

  return transformSourceToResponse(source as unknown as CollectionSourceDbModel);
};

/**
 * 取得收集來源列表
 */
export const getCollectionSources = async (
  params: CollectionSourceQueryParams
): Promise<{ data: CollectionSourceResponse[]; total: number }> => {
  const page = params.page || 1;
  const limit = Math.min(params.limit || DEFAULT_COLLECTION_PAGE_LIMIT, MAX_COLLECTION_PAGE_LIMIT);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params.platform) {
    where.platform = params.platform;
  }

  if (params.sourceType) {
    where.source_type = params.sourceType;
  }

  if (params.isActive !== undefined) {
    where.is_active = params.isActive;
  }

  const [sources, total] = await Promise.all([
    prisma.collection_sources.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.collection_sources.count({ where }),
  ]);

  return {
    data: sources.map((s) => transformSourceToResponse(s as unknown as CollectionSourceDbModel)),
    total,
  };
};

/**
 * 取得單一收集來源
 */
export const getCollectionSourceById = async (
  externalId: string
): Promise<CollectionSourceResponse | null> => {
  const source = await prisma.collection_sources.findUnique({
    where: { external_id: externalId },
  });

  if (!source) return null;

  return transformSourceToResponse(source as unknown as CollectionSourceDbModel);
};

/**
 * 更新收集來源
 */
export const updateCollectionSource = async (
  externalId: string,
  data: UpdateCollectionSourceDto
): Promise<CollectionSourceResponse | null> => {
  const source = await prisma.collection_sources.update({
    where: { external_id: externalId },
    data: {
      source_name: data.sourceName,
      description: data.description,
      is_active: data.isActive,
      fetch_interval: data.fetchInterval,
      settings: data.settings,
    },
  });

  return transformSourceToResponse(source as unknown as CollectionSourceDbModel);
};

/**
 * 刪除收集來源
 */
export const deleteCollectionSource = async (externalId: string): Promise<boolean> => {
  try {
    await prisma.collection_sources.delete({
      where: { external_id: externalId },
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// 內容抓取
// ============================================

/**
 * 執行抓取 (單一來源)
 */
export const fetchFromSource = async (
  sourceExternalId: string
): Promise<{ fetched: number; errors: string[] }> => {
  const source = await prisma.collection_sources.findUnique({
    where: { external_id: sourceExternalId },
  });

  if (!source) {
    throw new Error('Source not found');
  }

  const adapter = createAdapter(source.platform as CollectionPlatform);
  if (!adapter) {
    throw new Error(`No adapter available for platform: ${source.platform}`);
  }

  const errors: string[] = [];
  let fetchedCount = 0;

  try {
    // 抓取內容
    const contents = await adapter.fetchContents(source as unknown as CollectionSourceDbModel);

    // 儲存內容
    for (const content of contents) {
      try {
        await saveCollectedContent(source.id, content);
        fetchedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        // 如果是重複的內容，不算錯誤
        if (!errorMsg.includes('Unique constraint')) {
          errors.push(`Failed to save content ${content.platformContentId}: ${errorMsg}`);
        }
      }
    }

    // 更新來源狀態
    await prisma.collection_sources.update({
      where: { id: source.id },
      data: {
        last_fetched_at: new Date(),
        fetch_count: { increment: 1 },
        last_error: errors.length > 0 ? errors.join('; ') : null,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMsg);

    // 更新錯誤狀態
    await prisma.collection_sources.update({
      where: { id: source.id },
      data: {
        error_count: { increment: 1 },
        last_error: errorMsg,
      },
    });
  }

  return { fetched: fetchedCount, errors };
};

/**
 * 執行抓取 (所有啟用的來源)
 */
export const fetchAllActiveSources = async (): Promise<{
  totalFetched: number;
  sourceResults: Array<{ sourceId: string; fetched: number; errors: string[] }>;
}> => {
  const sources = await prisma.collection_sources.findMany({
    where: { is_active: true },
  });

  const results: Array<{ sourceId: string; fetched: number; errors: string[] }> = [];
  let totalFetched = 0;

  for (const source of sources) {
    // 檢查是否需要抓取 (根據 fetch_interval)
    if (source.last_fetched_at) {
      const timeSinceLastFetch = Date.now() - source.last_fetched_at.getTime();
      if (timeSinceLastFetch < source.fetch_interval * 1000) {
        continue; // 跳過尚未到期的來源
      }
    }

    try {
      const result = await fetchFromSource(source.external_id);
      results.push({
        sourceId: source.external_id,
        fetched: result.fetched,
        errors: result.errors,
      });
      totalFetched += result.fetched;
    } catch (error) {
      results.push({
        sourceId: source.external_id,
        fetched: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  return { totalFetched, sourceResults: results };
};

/**
 * 儲存收集到的內容
 */
const saveCollectedContent = async (
  sourceId: number,
  content: RawCollectedContent
): Promise<void> => {
  await prisma.collected_contents.create({
    data: {
      source_id: sourceId,
      platform: content.platform,
      platform_content_id: content.platformContentId,
      original_url: content.originalUrl,
      title: content.title,
      description: content.description,
      thumbnail_url: content.thumbnailUrl,
      video_url: content.videoUrl,
      author_name: content.authorName,
      author_url: content.authorUrl,
      author_avatar_url: content.authorAvatarUrl,
      published_at: content.publishedAt,
      engagement_count: content.engagementCount,
      stats: content.stats,
      raw_data: content.rawData,
      language: content.language,
      duration_seconds: content.durationSeconds,
      status: COLLECTED_CONTENT_STATUS.PENDING,
    },
  });
};

// ============================================
// 收集內容管理
// ============================================

/**
 * 取得收集內容列表
 */
export const getCollectedContents = async (
  params: CollectedContentQueryParams
): Promise<{ data: CollectedContentResponse[]; total: number }> => {
  const page = params.page || 1;
  const limit = Math.min(params.limit || DEFAULT_COLLECTION_PAGE_LIMIT, MAX_COLLECTION_PAGE_LIMIT);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params.platform) {
    where.platform = params.platform;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.isLearningContent !== undefined) {
    where.is_learning_content = params.isLearningContent;
  }

  if (params.sourceId) {
    const source = await prisma.collection_sources.findUnique({
      where: { external_id: params.sourceId },
      select: { id: true },
    });
    if (source) {
      where.source_id = source.id;
    }
  }

  if (params.minConfidence !== undefined) {
    where.confidence_score = { gte: params.minConfidence };
  }

  // 排序
  const orderBy: Record<string, string> = {};
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';

  switch (sortBy) {
    case 'publishedAt':
      orderBy.published_at = sortOrder;
      break;
    case 'engagementCount':
      orderBy.engagement_count = sortOrder;
      break;
    case 'confidenceScore':
      orderBy.confidence_score = sortOrder;
      break;
    default:
      orderBy.created_at = sortOrder;
  }

  const [contents, total] = await Promise.all([
    prisma.collected_contents.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        source: {
          select: { external_id: true },
        },
      },
    }),
    prisma.collected_contents.count({ where }),
  ]);

  return {
    data: contents.map((c) =>
      transformContentToResponse(c as unknown as CollectedContentDbModel & { source: { external_id: string } })
    ),
    total,
  };
};

/**
 * 取得單一收集內容
 */
export const getCollectedContentById = async (
  externalId: string
): Promise<CollectedContentResponse | null> => {
  const content = await prisma.collected_contents.findUnique({
    where: { external_id: externalId },
    include: {
      source: {
        select: { external_id: true },
      },
    },
  });

  if (!content) return null;

  return transformContentToResponse(
    content as unknown as CollectedContentDbModel & { source: { external_id: string } }
  );
};

/**
 * 審核內容
 */
export const reviewContent = async (
  externalId: string,
  data: ReviewContentDto,
  reviewerId: number
): Promise<CollectedContentResponse | null> => {
  const content = await prisma.collected_contents.findUnique({
    where: { external_id: externalId },
  });

  if (!content) return null;

  if (data.action === 'approve') {
    // 核准 - 轉換為 resource
    const resourceData = {
      name: data.overrideName || content.title || 'Untitled',
      description: data.overrideDescription || content.description || '',
      url: content.original_url,
      image_url: content.thumbnail_url,
      video_url: content.video_url,
      type: data.overrideType || content.suggested_type || 'other',
      level: data.overrideLevel || content.suggested_level || 'all_levels',
      cost: 'free', // 預設免費
      created_by: reviewerId,
    };

    // 使用 transaction 確保原子性
    const [resource, updatedContent] = await prisma.$transaction([
      prisma.resources.create({
        data: resourceData,
      }),
      prisma.collected_contents.update({
        where: { external_id: externalId },
        data: {
          status: COLLECTED_CONTENT_STATUS.CONVERTED,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          review_note: data.reviewNote,
          resource_id: undefined, // 會在下面更新
        },
        include: {
          source: {
            select: { external_id: true },
          },
        },
      }),
    ]);

    // 更新 resource_id
    await prisma.collected_contents.update({
      where: { external_id: externalId },
      data: { resource_id: resource.id },
    });

    // 如果有標籤，建立標籤關聯
    const tags = data.overrideTags || content.suggested_tags || [];
    if (tags.length > 0) {
      for (const tagName of tags) {
        // 取得或建立標籤
        const tag = await prisma.tags.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        // 建立 entity_tags 關聯
        await prisma.entity_tags.create({
          data: {
            entity_type: 'resource',
            entity_id: resource.id,
            tag_id: tag.id,
            created_by: reviewerId,
          },
        });
      }
    }

    return transformContentToResponse(
      updatedContent as unknown as CollectedContentDbModel & { source: { external_id: string } }
    );
  } else {
    // 拒絕
    const updatedContent = await prisma.collected_contents.update({
      where: { external_id: externalId },
      data: {
        status: COLLECTED_CONTENT_STATUS.REJECTED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        review_note: data.reviewNote,
      },
      include: {
        source: {
          select: { external_id: true },
        },
      },
    });

    return transformContentToResponse(
      updatedContent as unknown as CollectedContentDbModel & { source: { external_id: string } }
    );
  }
};

/**
 * 批次審核
 */
export const bulkReviewContents = async (
  data: BulkReviewDto,
  reviewerId: number
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const contentId of data.contentIds) {
    try {
      await reviewContent(
        contentId,
        {
          action: data.action,
          reviewNote: data.reviewNote,
        },
        reviewerId
      );
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
};

// ============================================
// 統計
// ============================================

/**
 * 取得收集統計資訊
 */
export const getCollectionStats = async (): Promise<CollectionStats> => {
  const [
    totalSources,
    activeSources,
    totalContents,
    statusCounts,
    platformCounts,
    recentFetches,
  ] = await Promise.all([
    // 總來源數
    prisma.collection_sources.count(),

    // 啟用來源數
    prisma.collection_sources.count({ where: { is_active: true } }),

    // 總內容數
    prisma.collected_contents.count(),

    // 各狀態數量
    prisma.collected_contents.groupBy({
      by: ['status'],
      _count: { status: true },
    }),

    // 各平台數量
    prisma.collected_contents.groupBy({
      by: ['platform'],
      _count: { platform: true },
    }),

    // 最近抓取數量
    Promise.all([
      prisma.collected_contents.count({
        where: {
          created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.collected_contents.count({
        where: {
          created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.collected_contents.count({
        where: {
          created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]),
  ]);

  // 轉換狀態計數
  const contentsByStatus = {
    pending: 0,
    classified: 0,
    approved: 0,
    rejected: 0,
    converted: 0,
  };

  for (const item of statusCounts) {
    const status = item.status as CollectedContentStatus;
    contentsByStatus[status] = item._count.status;
  }

  // 轉換平台計數
  const contentsByPlatform: Record<CollectionPlatform, number> = {} as Record<CollectionPlatform, number>;
  for (const item of platformCounts) {
    contentsByPlatform[item.platform as CollectionPlatform] = item._count.platform;
  }

  return {
    totalSources,
    activeSources,
    totalContents,
    contentsByStatus,
    contentsByPlatform,
    recentFetches: {
      last24Hours: recentFetches[0],
      last7Days: recentFetches[1],
      last30Days: recentFetches[2],
    },
  };
};

// 匯出服務物件
export const collectionService = {
  // 來源管理
  createSource: createCollectionSource,
  getSources: getCollectionSources,
  getSourceById: getCollectionSourceById,
  updateSource: updateCollectionSource,
  deleteSource: deleteCollectionSource,

  // 內容抓取
  fetchFromSource,
  fetchAllActiveSources,

  // 內容管理
  getContents: getCollectedContents,
  getContentById: getCollectedContentById,
  reviewContent,
  bulkReviewContents,

  // 統計
  getStats: getCollectionStats,
};
