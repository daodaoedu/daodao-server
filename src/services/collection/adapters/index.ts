/**
 * Platform Adapters 統一匯出
 */

export { BaseAdapter, AdapterError } from './base.adapter';
export { YouTubeAdapter, createYouTubeAdapter } from './youtube.adapter';
export { GitHubAdapter, createGitHubAdapter } from './github.adapter';
export { ThreadsAdapter, createThreadsAdapter } from './threads.adapter';

import {
  CollectionPlatform,
  COLLECTION_PLATFORMS,
  PlatformAdapter,
} from '@/types/collection.types';
import { createYouTubeAdapter } from './youtube.adapter';
import { createGitHubAdapter } from './github.adapter';
import { createThreadsAdapter } from './threads.adapter';

/**
 * Adapter 工廠函式
 * 根據平台類型建立對應的 Adapter
 */
export const createAdapter = (platform: CollectionPlatform): PlatformAdapter | null => {
  switch (platform) {
    case COLLECTION_PLATFORMS.YOUTUBE:
      return createYouTubeAdapter();

    case COLLECTION_PLATFORMS.GITHUB:
      return createGitHubAdapter();

    case COLLECTION_PLATFORMS.THREADS:
      return createThreadsAdapter();

    // 其他平台尚未實作
    case COLLECTION_PLATFORMS.TIKTOK:
    case COLLECTION_PLATFORMS.PODCAST:
    case COLLECTION_PLATFORMS.FACEBOOK:
    case COLLECTION_PLATFORMS.INSTAGRAM:
    case COLLECTION_PLATFORMS.TWITTER:
    case COLLECTION_PLATFORMS.DCARD:
    case COLLECTION_PLATFORMS.PTT:
    case COLLECTION_PLATFORMS.MEDIUM:
    case COLLECTION_PLATFORMS.HAHOW:
    case COLLECTION_PLATFORMS.PRESSPLAY:
    case COLLECTION_PLATFORMS.RSS:
    case COLLECTION_PLATFORMS.OTHER:
    default:
      console.warn(`[AdapterFactory] No adapter available for platform: ${platform}`);
      return null;
  }
};

/**
 * 取得所有已實作的平台列表
 */
export const getImplementedPlatforms = (): CollectionPlatform[] => {
  return [
    COLLECTION_PLATFORMS.YOUTUBE,
    COLLECTION_PLATFORMS.GITHUB,
    COLLECTION_PLATFORMS.THREADS,
  ];
};

/**
 * 檢查平台是否已實作
 */
export const isPlatformImplemented = (platform: CollectionPlatform): boolean => {
  return getImplementedPlatforms().includes(platform);
};
