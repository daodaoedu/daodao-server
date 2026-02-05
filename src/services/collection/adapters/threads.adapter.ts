/**
 * Threads Platform Adapter
 *
 * 注意：Threads 目前沒有官方 Public API
 * 此 Adapter 使用 Meta 的 Threads API (需要 Meta Developer 帳號)
 * 或者可以考慮使用 RSS 橋接服務
 *
 * Meta Threads API 文件: https://developers.facebook.com/docs/threads
 */

import {
  COLLECTION_PLATFORMS,
  CollectionPlatform,
  CollectionSourceType,
  CollectionSourceDbModel,
  RawCollectedContent,
  FetchOptions,
  COLLECTION_SOURCE_TYPES,
} from '@/types/collection.types';
import { BaseAdapter } from './base.adapter';

// Threads API 回應類型 (Meta Threads API)
interface ThreadsPost {
  id: string;
  media_product_type: string;
  media_type: 'TEXT_POST' | 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  owner: {
    id: string;
  };
  username: string;
  text?: string;
  timestamp: string;
  shortcode: string;
  thumbnail_url?: string;
  children?: {
    data: Array<{
      id: string;
      media_type: string;
      media_url?: string;
    }>;
  };
  is_quote_post: boolean;
}

interface ThreadsUserProfile {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

interface ThreadsMediaResponse {
  data: ThreadsPost[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Threads Adapter
 *
 * 需要設定環境變數:
 * - THREADS_ACCESS_TOKEN: Meta Threads API Access Token
 * - THREADS_USER_ID: 你的 Threads User ID (用於抓取特定用戶)
 */
export class ThreadsAdapter extends BaseAdapter {
  platform: CollectionPlatform = COLLECTION_PLATFORMS.THREADS;

  private readonly accessToken: string;
  private readonly baseUrl = 'https://graph.threads.net/v1.0';

  constructor() {
    super();
    this.accessToken = process.env.THREADS_ACCESS_TOKEN || '';

    if (!this.accessToken) {
      console.warn('[ThreadsAdapter] THREADS_ACCESS_TOKEN is not set');
    }
  }

  /**
   * 根據來源設定抓取內容
   */
  async fetchContents(
    source: CollectionSourceDbModel,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    if (!this.accessToken) {
      throw this.createError('Threads access token is not configured', 'NO_ACCESS_TOKEN');
    }

    const maxResults = options?.maxResults || 25;

    switch (source.source_type) {
      case COLLECTION_SOURCE_TYPES.USER:
        return this.fetchFromUser(source.source_value, maxResults, options);

      case COLLECTION_SOURCE_TYPES.HASHTAG:
        // Threads API 目前不支援 hashtag 搜尋
        // 可以考慮使用其他方式
        console.warn('[ThreadsAdapter] Hashtag search is not supported by Threads API');
        return [];

      case COLLECTION_SOURCE_TYPES.KEYWORD:
        // Threads API 目前不支援關鍵字搜尋
        console.warn('[ThreadsAdapter] Keyword search is not supported by Threads API');
        return [];

      default:
        throw this.createError(
          `Unsupported source type: ${source.source_type}`,
          'UNSUPPORTED_SOURCE_TYPE'
        );
    }
  }

  /**
   * 驗證來源設定是否有效
   */
  async validateSource(
    sourceType: CollectionSourceType,
    sourceValue: string
  ): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      switch (sourceType) {
        case COLLECTION_SOURCE_TYPES.USER:
          // 只能驗證自己的帳號或有權限存取的帳號
          return sourceValue.length > 0;

        case COLLECTION_SOURCE_TYPES.HASHTAG:
        case COLLECTION_SOURCE_TYPES.KEYWORD:
          // 目前不支援
          return false;

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * 取得單一貼文的詳細資訊
   */
  async getContentDetails(postId: string): Promise<RawCollectedContent | null> {
    if (!this.accessToken) return null;

    try {
      const post = await this.getPost(postId);
      if (!post) return null;

      return this.transformPost(post);
    } catch {
      return null;
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 從用戶抓取貼文
   * 注意：需要該用戶授權或使用自己的 access token
   */
  private async fetchFromUser(
    userId: string,
    maxResults: number,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    const fields = [
      'id',
      'media_product_type',
      'media_type',
      'media_url',
      'permalink',
      'owner',
      'username',
      'text',
      'timestamp',
      'shortcode',
      'thumbnail_url',
      'is_quote_post',
    ].join(',');

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken,
      limit: String(Math.min(maxResults, 25)), // Threads API 限制
    });

    if (options?.pageToken) {
      params.set('after', options.pageToken);
    }

    const url = `${this.baseUrl}/${userId}/threads?${params}`;

    const response = await this.withRetry(() => fetch(url));

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.createError(
        `Threads API error: ${response.status} - ${JSON.stringify(error)}`,
        'API_ERROR'
      );
    }

    const data: ThreadsMediaResponse = await response.json();

    // 過濾出可能是學習相關的貼文
    const posts = data.data.filter((post) => {
      // 只保留有文字內容的貼文
      return post.text && post.text.length > 0;
    });

    return posts.map((post) => this.transformPost(post));
  }

  /**
   * 取得單一貼文
   */
  private async getPost(postId: string): Promise<ThreadsPost | null> {
    const fields = [
      'id',
      'media_product_type',
      'media_type',
      'media_url',
      'permalink',
      'owner',
      'username',
      'text',
      'timestamp',
      'shortcode',
      'thumbnail_url',
      'is_quote_post',
    ].join(',');

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken,
    });

    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/${postId}?${params}`)
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  /**
   * 取得用戶資訊
   */
  private async getUserProfile(userId: string): Promise<ThreadsUserProfile | null> {
    const fields = [
      'id',
      'username',
      'name',
      'threads_profile_picture_url',
      'threads_biography',
    ].join(',');

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken,
    });

    const response = await fetch(`${this.baseUrl}/${userId}?${params}`);

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  /**
   * 轉換 Threads 貼文為標準格式
   */
  private transformPost(post: ThreadsPost): RawCollectedContent {
    // 取得縮圖
    let thumbnailUrl = post.thumbnail_url || null;
    if (!thumbnailUrl && post.media_type === 'IMAGE' && post.media_url) {
      thumbnailUrl = post.media_url;
    }

    // 取得影片 URL
    let videoUrl: string | null = null;
    if (post.media_type === 'VIDEO' && post.media_url) {
      videoUrl = post.media_url;
    }

    // 建立標題 (取文字前 100 字)
    const title = post.text
      ? this.truncate(post.text.split('\n')[0], 100)
      : null;

    return {
      platform: COLLECTION_PLATFORMS.THREADS,
      platformContentId: post.id,
      originalUrl: post.permalink,
      title,
      description: post.text || null,
      thumbnailUrl,
      videoUrl,
      authorName: post.username,
      authorUrl: `https://www.threads.net/@${post.username}`,
      authorAvatarUrl: null, // 需要額外 API 呼叫取得
      publishedAt: new Date(post.timestamp),
      engagementCount: 0, // Threads API 目前不提供互動數
      stats: {
        mediaType: post.media_type,
        isQuotePost: post.is_quote_post,
      },
      rawData: post,
      language: this.detectLanguage(post.text),
      durationSeconds: null,
    };
  }
}

/**
 * 建立 Threads Adapter 實例
 */
export const createThreadsAdapter = (): ThreadsAdapter => {
  return new ThreadsAdapter();
};

/**
 * ============================================
 * 替代方案說明
 * ============================================
 *
 * 由於 Threads API 有諸多限制，以下是一些替代方案：
 *
 * 1. RSS 橋接服務
 *    - 使用 RSS Bridge (https://github.com/RSS-Bridge/rss-bridge)
 *    - 可以將 Threads 用戶的貼文轉換為 RSS Feed
 *
 * 2. 手動匯入
 *    - 讓管理員手動輸入 Threads 貼文連結
 *    - 系統解析連結並擷取內容
 *
 * 3. 使用 Puppeteer/Playwright 爬蟲
 *    - 模擬瀏覽器行為抓取內容
 *    - 需要注意 rate limit 和 ToS
 *
 * 4. 使用第三方服務
 *    - 如 Apify、ScrapingBee 等
 *    - 提供現成的 Threads 爬蟲 API
 *
 * 建議：
 * 對於學習資源收集，建議優先使用有完整 API 的平台 (YouTube, GitHub)
 * Threads 可以作為補充來源，使用手動匯入或 RSS 橋接方式
 */
