/**
 * YouTube Data API v3 collector.
 * Searches for educational videos and maps them to CollectedResource format.
 *
 * Requires YOUTUBE_API_KEY environment variable.
 * API docs: https://developers.google.com/youtube/v3/docs/search/list
 */

import { youtubeConfig } from '../config';
import type {
  CollectedResource,
  CollectorConfig,
  CollectorResult,
} from '../types';
import { COST_TYPE, LEVEL_TYPE, RESOURCE_TYPE } from '../types';

/** YouTube search result item from API response */
interface YouTubeSearchItem {
  id: { kind: string; videoId?: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    channelTitle: string;
    tags?: string[];
  };
}

/** YouTube search API response */
interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  pageInfo?: { totalResults: number };
  error?: { message: string };
}

/** YouTube video details from videos.list API */
interface YouTubeVideoDetails {
  id: string;
  snippet: {
    tags?: string[];
    categoryId: string;
    defaultLanguage?: string;
  };
  contentDetails: {
    duration: string;
  };
}

/** YouTube videos.list API response */
interface YouTubeVideosResponse {
  items?: YouTubeVideoDetails[];
  error?: { message: string };
}

/**
 * Search YouTube for videos matching a keyword.
 * @param keyword - Search query
 * @param maxResults - Maximum number of results
 * @returns Array of search result items
 */
async function searchVideos(
  keyword: string,
  maxResults: number,
): Promise<YouTubeSearchItem[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: keyword,
    type: 'video',
    maxResults: String(maxResults),
    order: 'relevance',
    videoCategoryId: '27', // Education category
    key: youtubeConfig.apiKey,
  });

  const response = await fetch(
    `${youtubeConfig.baseUrl}/search?${params.toString()}`,
  );
  const data = (await response.json()) as YouTubeSearchResponse;

  if (data.error) {
    throw new Error(`YouTube API error: ${data.error.message}`);
  }

  return data.items ?? [];
}

/**
 * Fetch detailed video info (tags, duration) for a batch of video IDs.
 * @param videoIds - Array of YouTube video IDs
 * @returns Map of videoId to video details
 */
async function fetchVideoDetails(
  videoIds: string[],
): Promise<Map<string, YouTubeVideoDetails>> {
  if (videoIds.length === 0) return new Map();

  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    id: videoIds.join(','),
    key: youtubeConfig.apiKey,
  });

  const response = await fetch(
    `${youtubeConfig.baseUrl}/videos?${params.toString()}`,
  );
  const data = (await response.json()) as YouTubeVideosResponse;

  if (data.error) {
    throw new Error(`YouTube Videos API error: ${data.error.message}`);
  }

  const map = new Map<string, YouTubeVideoDetails>();
  for (const item of data.items ?? []) {
    map.set(item.id, item);
  }
  return map;
}

/**
 * Map a YouTube search item to a CollectedResource.
 * @param item - YouTube search result
 * @param details - Optional video details for tags
 */
function mapToResource(
  item: YouTubeSearchItem,
  details?: YouTubeVideoDetails,
): CollectedResource {
  const videoId = item.id.videoId ?? '';
  const thumbnail =
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.default?.url ??
    '';

  const tags = details?.snippet.tags ?? [];
  const channelTag = item.snippet.channelTitle;
  const allTags = [...new Set([channelTag, ...tags.slice(0, 9)])];

  return {
    name: item.snippet.title.slice(0, 255),
    url: `https://www.youtube.com/watch?v=${videoId}`,
    image_url: thumbnail,
    description: item.snippet.description,
    video_url: `https://www.youtube.com/watch?v=${videoId}`,
    type: RESOURCE_TYPE.VIDEO_CONTENT,
    cost: COST_TYPE.FREE,
    level: LEVEL_TYPE.ALL_LEVELS,
    tags: allTags.join(','),
    source_platform: 'youtube',
    source_id: videoId,
    published_at: item.snippet.publishedAt,
  };
}

/**
 * Collect learning resources from YouTube.
 * @param config - Collector configuration with keywords and limits
 * @returns CollectorResult with collected resources and any errors
 */
export async function collectYouTube(
  config: CollectorConfig,
): Promise<CollectorResult> {
  const resources: CollectedResource[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (!youtubeConfig.apiKey) {
    return {
      platform: 'youtube',
      resources: [],
      errors: ['YOUTUBE_API_KEY is not set. Skipping YouTube collection.'],
    };
  }

  for (const keyword of config.keywords) {
    try {
      console.log(`  [YouTube] Searching: "${keyword}"`);
      const items = await searchVideos(keyword, config.maxResultsPerKeyword);

      // Collect video IDs for batch detail fetch
      const videoIds = items
        .map((item) => item.id.videoId)
        .filter((id): id is string => id != null && !seenIds.has(id));

      const detailsMap = await fetchVideoDetails(videoIds);

      for (const item of items) {
        const videoId = item.id.videoId;
        if (!videoId || seenIds.has(videoId)) continue;
        seenIds.add(videoId);

        const details = detailsMap.get(videoId);
        resources.push(mapToResource(item, details));
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unknown error';
      errors.push(`[YouTube] keyword="${keyword}": ${msg}`);
      console.error(`  [YouTube] Error for "${keyword}": ${msg}`);
    }
  }

  console.log(`  [YouTube] Collected ${resources.length} resources`);
  return { platform: 'youtube', resources, errors };
}
