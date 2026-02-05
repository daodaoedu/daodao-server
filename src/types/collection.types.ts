/**
 * 學習資源收集功能相關類型定義
 * Learning Resource Collection Types
 */

// ============================================
// 常數定義
// ============================================

/**
 * 收集平台類型
 */
export const COLLECTION_PLATFORMS = {
  // 影音平台
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  PODCAST: 'podcast',

  // 社群平台
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  THREADS: 'threads',
  TWITTER: 'twitter',

  // 台灣論壇
  DCARD: 'dcard',
  PTT: 'ptt',

  // 技術/文章平台
  MEDIUM: 'medium',
  GITHUB: 'github',

  // 台灣課程平台
  HAHOW: 'hahow',
  PRESSPLAY: 'pressplay',

  // 通用
  RSS: 'rss',
  OTHER: 'other',
} as const;

export type CollectionPlatform = typeof COLLECTION_PLATFORMS[keyof typeof COLLECTION_PLATFORMS];

/**
 * 收集來源類型
 */
export const COLLECTION_SOURCE_TYPES = {
  CHANNEL: 'channel',         // YouTube 頻道
  PLAYLIST: 'playlist',       // YouTube 播放清單
  USER: 'user',               // 用戶帳號
  HASHTAG: 'hashtag',         // Hashtag
  KEYWORD: 'keyword',         // 搜尋關鍵字
  TOPIC: 'topic',             // GitHub Topic
  REPOSITORY: 'repository',   // GitHub Repo
  RSS_FEED: 'rss_feed',       // RSS Feed
  OTHER: 'other',
} as const;

export type CollectionSourceType = typeof COLLECTION_SOURCE_TYPES[keyof typeof COLLECTION_SOURCE_TYPES];

/**
 * 收集內容狀態
 */
export const COLLECTED_CONTENT_STATUS = {
  PENDING: 'pending',         // 待處理
  CLASSIFIED: 'classified',   // 已分類
  APPROVED: 'approved',       // 已核准
  REJECTED: 'rejected',       // 已拒絕
  CONVERTED: 'converted',     // 已轉換為 resource
} as const;

export type CollectedContentStatus = typeof COLLECTED_CONTENT_STATUS[keyof typeof COLLECTED_CONTENT_STATUS];

// ============================================
// 資料庫模型介面
// ============================================

/**
 * 收集來源設定 - 資料庫模型
 */
export interface CollectionSourceDbModel {
  id: number;
  external_id: string;
  platform: CollectionPlatform;
  source_type: CollectionSourceType;
  source_value: string;
  source_name: string | null;
  description: string | null;
  is_active: boolean;
  fetch_interval: number;
  last_fetched_at: Date | null;
  fetch_count: number;
  error_count: number;
  last_error: string | null;
  settings: Record<string, unknown> | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * 收集內容 - 資料庫模型
 */
export interface CollectedContentDbModel {
  id: number;
  external_id: string;
  source_id: number;
  platform: CollectionPlatform;
  platform_content_id: string;
  original_url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  author_name: string | null;
  author_url: string | null;
  author_avatar_url: string | null;
  published_at: Date | null;
  engagement_count: number;
  stats: Record<string, unknown> | null;
  raw_data: Record<string, unknown> | null;
  language: string | null;
  duration_seconds: number | null;
  status: CollectedContentStatus;
  processed_at: Date | null;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  review_note: string | null;
  is_learning_content: boolean | null;
  confidence_score: number | null;
  suggested_type: string | null;
  suggested_level: string | null;
  suggested_tags: string[];
  suggested_category: number | null;
  classification_reason: string | null;
  resource_id: number | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// API 回應格式
// ============================================

/**
 * 收集來源 - API 回應格式
 */
export interface CollectionSourceResponse {
  id: string;
  platform: CollectionPlatform;
  sourceType: CollectionSourceType;
  sourceValue: string;
  sourceName: string | null;
  description: string | null;
  isActive: boolean;
  fetchInterval: number;
  lastFetchedAt: string | null;
  fetchCount: number;
  errorCount: number;
  lastError: string | null;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 收集內容 - API 回應格式
 */
export interface CollectedContentResponse {
  id: string;
  sourceId: string;
  platform: CollectionPlatform;
  platformContentId: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  authorName: string | null;
  authorUrl: string | null;
  authorAvatarUrl: string | null;
  publishedAt: string | null;
  engagementCount: number;
  stats: Record<string, unknown> | null;
  language: string | null;
  durationSeconds: number | null;
  status: CollectedContentStatus;
  processedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  isLearningContent: boolean | null;
  confidenceScore: number | null;
  suggestedType: string | null;
  suggestedLevel: string | null;
  suggestedTags: string[];
  suggestedCategory: number | null;
  classificationReason: string | null;
  resourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DTO (Data Transfer Objects)
// ============================================

/**
 * 建立收集來源 DTO
 */
export interface CreateCollectionSourceDto {
  platform: CollectionPlatform;
  sourceType: CollectionSourceType;
  sourceValue: string;
  sourceName?: string;
  description?: string;
  isActive?: boolean;
  fetchInterval?: number;
  settings?: Record<string, unknown>;
}

/**
 * 更新收集來源 DTO
 */
export interface UpdateCollectionSourceDto {
  sourceName?: string;
  description?: string;
  isActive?: boolean;
  fetchInterval?: number;
  settings?: Record<string, unknown>;
}

/**
 * 審核內容 DTO
 */
export interface ReviewContentDto {
  action: 'approve' | 'reject';
  reviewNote?: string;
  // 審核時可以覆蓋 AI 建議
  overrideName?: string;
  overrideDescription?: string;
  overrideType?: string;
  overrideLevel?: string;
  overrideTags?: string[];
  overrideCategoryId?: number;
}

/**
 * 批次審核 DTO
 */
export interface BulkReviewDto {
  contentIds: string[];
  action: 'approve' | 'reject';
  reviewNote?: string;
}

// ============================================
// Platform Adapter 介面
// ============================================

/**
 * 原始收集內容格式 (從平台抓取後的標準格式)
 */
export interface RawCollectedContent {
  platform: CollectionPlatform;
  platformContentId: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  authorName: string | null;
  authorUrl: string | null;
  authorAvatarUrl: string | null;
  publishedAt: Date | null;
  engagementCount: number;
  stats: Record<string, unknown> | null;
  rawData: Record<string, unknown>;
  language: string | null;
  durationSeconds: number | null;
}

/**
 * 平台 Adapter 介面
 * 每個平台需要實作這個介面
 */
export interface PlatformAdapter {
  /** 平台名稱 */
  platform: CollectionPlatform;

  /**
   * 根據來源設定抓取內容
   * @param source 來源設定
   * @param options 額外選項
   * @returns 抓取到的原始內容陣列
   */
  fetchContents(
    source: CollectionSourceDbModel,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]>;

  /**
   * 驗證來源設定是否有效
   * @param sourceType 來源類型
   * @param sourceValue 來源值
   * @returns 是否有效
   */
  validateSource(
    sourceType: CollectionSourceType,
    sourceValue: string
  ): Promise<boolean>;

  /**
   * 取得單一內容的詳細資訊 (選用)
   * @param platformContentId 平台內容 ID
   * @returns 內容詳細資訊
   */
  getContentDetails?(platformContentId: string): Promise<RawCollectedContent | null>;
}

/**
 * 抓取選項
 */
export interface FetchOptions {
  /** 最大抓取數量 */
  maxResults?: number;
  /** 從特定時間之後 */
  publishedAfter?: Date;
  /** 頁面 token (用於分頁) */
  pageToken?: string;
}

// ============================================
// AI 分類相關
// ============================================

/**
 * AI 分類結果
 */
export interface ClassificationResult {
  /** 是否為學習內容 */
  isLearningContent: boolean;
  /** 信心分數 (0.0 - 1.0) */
  confidenceScore: number;
  /** 建議的資源類型 */
  suggestedType: string;
  /** 建議的難度等級 */
  suggestedLevel: string;
  /** 建議的標籤 */
  suggestedTags: string[];
  /** 建議的分類 ID */
  suggestedCategoryId: number | null;
  /** 分類理由 */
  reasoning: string;
}

// ============================================
// 查詢參數
// ============================================

/**
 * 收集來源查詢參數
 */
export interface CollectionSourceQueryParams {
  platform?: CollectionPlatform;
  sourceType?: CollectionSourceType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 收集內容查詢參數
 */
export interface CollectedContentQueryParams {
  platform?: CollectionPlatform;
  status?: CollectedContentStatus;
  isLearningContent?: boolean;
  sourceId?: string;
  minConfidence?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'publishedAt' | 'engagementCount' | 'confidenceScore';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// 統計資訊
// ============================================

/**
 * 收集統計資訊
 */
export interface CollectionStats {
  totalSources: number;
  activeSources: number;
  totalContents: number;
  contentsByStatus: {
    pending: number;
    classified: number;
    approved: number;
    rejected: number;
    converted: number;
  };
  contentsByPlatform: Record<CollectionPlatform, number>;
  recentFetches: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}
