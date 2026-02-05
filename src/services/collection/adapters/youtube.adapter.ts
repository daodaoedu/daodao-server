/**
 * YouTube Platform Adapter
 * 使用 YouTube Data API v3 抓取學習資源
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
import { BaseAdapter, AdapterError } from './base.adapter';

// YouTube API 回應類型
interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      maxres?: { url: string };
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      maxres?: { url: string };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
}

interface YouTubePlaylistItem {
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
}

interface YouTubeSearchResponse {
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

interface YouTubeVideoResponse {
  items: YouTubeVideoItem[];
}

interface YouTubePlaylistItemsResponse {
  nextPageToken?: string;
  items: YouTubePlaylistItem[];
}

/**
 * YouTube Adapter
 */
export class YouTubeAdapter extends BaseAdapter {
  platform: CollectionPlatform = COLLECTION_PLATFORMS.YOUTUBE;

  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    super();
    this.apiKey = process.env.YOUTUBE_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[YouTubeAdapter] YOUTUBE_API_KEY is not set');
    }
  }

  /**
   * 根據來源設定抓取內容
   */
  async fetchContents(
    source: CollectionSourceDbModel,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    if (!this.apiKey) {
      throw this.createError('YouTube API key is not configured', 'NO_API_KEY');
    }

    const maxResults = options?.maxResults || 50;

    switch (source.source_type) {
      case COLLECTION_SOURCE_TYPES.CHANNEL:
        return this.fetchFromChannel(source.source_value, maxResults, options);

      case COLLECTION_SOURCE_TYPES.PLAYLIST:
        return this.fetchFromPlaylist(source.source_value, maxResults, options);

      case COLLECTION_SOURCE_TYPES.KEYWORD:
        return this.fetchByKeyword(source.source_value, maxResults, options);

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
    if (!this.apiKey) return false;

    try {
      switch (sourceType) {
        case COLLECTION_SOURCE_TYPES.CHANNEL:
          return this.validateChannel(sourceValue);

        case COLLECTION_SOURCE_TYPES.PLAYLIST:
          return this.validatePlaylist(sourceValue);

        case COLLECTION_SOURCE_TYPES.KEYWORD:
          // 關鍵字不需要驗證
          return sourceValue.length > 0;

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * 取得單一影片的詳細資訊
   */
  async getContentDetails(videoId: string): Promise<RawCollectedContent | null> {
    if (!this.apiKey) return null;

    try {
      const video = await this.getVideoDetails(videoId);
      if (!video) return null;

      return this.transformVideo(video);
    } catch {
      return null;
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 從頻道抓取影片
   */
  private async fetchFromChannel(
    channelId: string,
    maxResults: number,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    // 先搜尋頻道的影片
    const params = new URLSearchParams({
      key: this.apiKey,
      channelId: channelId,
      part: 'snippet',
      type: 'video',
      order: 'date',
      maxResults: String(Math.min(maxResults, 50)),
    });

    if (options?.publishedAfter) {
      params.set('publishedAfter', options.publishedAfter.toISOString());
    }

    if (options?.pageToken) {
      params.set('pageToken', options.pageToken);
    }

    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/search?${params}`)
    );

    if (!response.ok) {
      throw this.createError(
        `YouTube API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const data: YouTubeSearchResponse = await response.json();
    const videoIds = data.items
      .filter((item) => item.id.videoId)
      .map((item) => item.id.videoId as string);

    if (videoIds.length === 0) {
      return [];
    }

    // 取得影片詳細資訊
    return this.getVideosDetails(videoIds);
  }

  /**
   * 從播放清單抓取影片
   */
  private async fetchFromPlaylist(
    playlistId: string,
    maxResults: number,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      playlistId: playlistId,
      part: 'snippet',
      maxResults: String(Math.min(maxResults, 50)),
    });

    if (options?.pageToken) {
      params.set('pageToken', options.pageToken);
    }

    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/playlistItems?${params}`)
    );

    if (!response.ok) {
      throw this.createError(
        `YouTube API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const data: YouTubePlaylistItemsResponse = await response.json();
    const videoIds = data.items
      .filter((item) => item.snippet.resourceId.videoId)
      .map((item) => item.snippet.resourceId.videoId);

    if (videoIds.length === 0) {
      return [];
    }

    // 取得影片詳細資訊
    return this.getVideosDetails(videoIds);
  }

  /**
   * 用關鍵字搜尋影片
   */
  private async fetchByKeyword(
    keyword: string,
    maxResults: number,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      q: keyword,
      part: 'snippet',
      type: 'video',
      order: 'relevance',
      maxResults: String(Math.min(maxResults, 50)),
      // 過濾可能的學習內容
      videoCategoryId: '27', // Education category
    });

    if (options?.publishedAfter) {
      params.set('publishedAfter', options.publishedAfter.toISOString());
    }

    if (options?.pageToken) {
      params.set('pageToken', options.pageToken);
    }

    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/search?${params}`)
    );

    if (!response.ok) {
      throw this.createError(
        `YouTube API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const data: YouTubeSearchResponse = await response.json();
    const videoIds = data.items
      .filter((item) => item.id.videoId)
      .map((item) => item.id.videoId as string);

    if (videoIds.length === 0) {
      return [];
    }

    // 取得影片詳細資訊
    return this.getVideosDetails(videoIds);
  }

  /**
   * 批次取得影片詳細資訊
   */
  private async getVideosDetails(
    videoIds: string[]
  ): Promise<RawCollectedContent[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      id: videoIds.join(','),
      part: 'snippet,contentDetails,statistics',
    });

    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/videos?${params}`)
    );

    if (!response.ok) {
      throw this.createError(
        `YouTube API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const data: YouTubeVideoResponse = await response.json();
    return data.items.map((video) => this.transformVideo(video));
  }

  /**
   * 取得單一影片詳細資訊
   */
  private async getVideoDetails(
    videoId: string
  ): Promise<YouTubeVideoItem | null> {
    const params = new URLSearchParams({
      key: this.apiKey,
      id: videoId,
      part: 'snippet,contentDetails,statistics',
    });

    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/videos?${params}`)
    );

    if (!response.ok) {
      return null;
    }

    const data: YouTubeVideoResponse = await response.json();
    return data.items[0] || null;
  }

  /**
   * 驗證頻道是否存在
   */
  private async validateChannel(channelId: string): Promise<boolean> {
    const params = new URLSearchParams({
      key: this.apiKey,
      id: channelId,
      part: 'snippet',
    });

    const response = await fetch(`${this.baseUrl}/channels?${params}`);
    if (!response.ok) return false;

    const data = await response.json();
    return data.items && data.items.length > 0;
  }

  /**
   * 驗證播放清單是否存在
   */
  private async validatePlaylist(playlistId: string): Promise<boolean> {
    const params = new URLSearchParams({
      key: this.apiKey,
      id: playlistId,
      part: 'snippet',
    });

    const response = await fetch(`${this.baseUrl}/playlists?${params}`);
    if (!response.ok) return false;

    const data = await response.json();
    return data.items && data.items.length > 0;
  }

  /**
   * 轉換 YouTube 影片為標準格式
   */
  private transformVideo(video: YouTubeVideoItem): RawCollectedContent {
    const thumbnails = video.snippet.thumbnails;
    const thumbnailUrl =
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      null;

    const viewCount = parseInt(video.statistics.viewCount || '0', 10);
    const likeCount = parseInt(video.statistics.likeCount || '0', 10);

    return {
      platform: COLLECTION_PLATFORMS.YOUTUBE,
      platformContentId: video.id,
      originalUrl: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.snippet.title,
      description: this.truncate(video.snippet.description, 5000),
      thumbnailUrl,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      authorName: video.snippet.channelTitle,
      authorUrl: `https://www.youtube.com/channel/${video.snippet.channelId}`,
      authorAvatarUrl: null, // YouTube API 不直接提供頻道頭像
      publishedAt: new Date(video.snippet.publishedAt),
      engagementCount: viewCount + likeCount,
      stats: {
        viewCount,
        likeCount,
        commentCount: parseInt(video.statistics.commentCount || '0', 10),
      },
      rawData: video,
      language:
        video.snippet.defaultLanguage ||
        video.snippet.defaultAudioLanguage ||
        this.detectLanguage(video.snippet.title),
      durationSeconds: this.parseIsoDuration(video.contentDetails.duration),
    };
  }
}

/**
 * 建立 YouTube Adapter 實例
 */
export const createYouTubeAdapter = (): YouTubeAdapter => {
  return new YouTubeAdapter();
};
