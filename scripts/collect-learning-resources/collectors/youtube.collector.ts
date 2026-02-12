/**
 * YouTube Data API v3 collector.
 * Searches for educational videos and maps them to CollectedResource format.
 * Fetches video statistics (views, likes) and channel info (subscribers) for quality scoring.
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

/** YouTube search result item */
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
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: { message: string };
}

/** YouTube video details (snippet + statistics + contentDetails) */
interface YouTubeVideoDetails {
  id: string;
  snippet: {
    tags?: string[];
    channelId: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails: {
    duration: string;
  };
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoDetails[];
  error?: { message: string };
}

/** YouTube channel info */
interface YouTubeChannelInfo {
  id: string;
  statistics: {
    subscriberCount?: string;
  };
}

interface YouTubeChannelsResponse {
  items?: YouTubeChannelInfo[];
  error?: { message: string };
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to total seconds.
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  const s = parseInt(match[3] ?? '0', 10);
  return h * 3600 + m * 60 + s;
}

/**
 * Search YouTube for videos matching a keyword.
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
    videoCategoryId: '27',
    key: youtubeConfig.apiKey,
  });

  const response = await fetch(`${youtubeConfig.baseUrl}/search?${params}`);
  const data = (await response.json()) as YouTubeSearchResponse;
  if (data.error) throw new Error(`YouTube search: ${data.error.message}`);
  return data.items ?? [];
}

/**
 * Fetch video details including statistics for quality scoring.
 */
async function fetchVideoDetails(
  videoIds: string[],
): Promise<Map<string, YouTubeVideoDetails>> {
  if (videoIds.length === 0) return new Map();

  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
    key: youtubeConfig.apiKey,
  });

  const response = await fetch(`${youtubeConfig.baseUrl}/videos?${params}`);
  const data = (await response.json()) as YouTubeVideosResponse;
  if (data.error) throw new Error(`YouTube videos: ${data.error.message}`);

  const map = new Map<string, YouTubeVideoDetails>();
  for (const item of data.items ?? []) {
    map.set(item.id, item);
  }
  return map;
}

/**
 * Fetch subscriber counts for a batch of channel IDs.
 */
async function fetchChannelStats(
  channelIds: string[],
): Promise<Map<string, number>> {
  if (channelIds.length === 0) return new Map();

  const uniqueIds = [...new Set(channelIds)];
  const params = new URLSearchParams({
    part: 'statistics',
    id: uniqueIds.join(','),
    key: youtubeConfig.apiKey,
  });

  const response = await fetch(`${youtubeConfig.baseUrl}/channels?${params}`);
  const data = (await response.json()) as YouTubeChannelsResponse;
  if (data.error) throw new Error(`YouTube channels: ${data.error.message}`);

  const map = new Map<string, number>();
  for (const item of data.items ?? []) {
    map.set(item.id, parseInt(item.statistics.subscriberCount ?? '0', 10));
  }
  return map;
}

/**
 * Map a YouTube search item + details to a CollectedResource.
 */
function mapToResource(
  item: YouTubeSearchItem,
  details: YouTubeVideoDetails | undefined,
  subscriberCount: number,
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

  const viewCount = parseInt(details?.statistics.viewCount ?? '0', 10);
  const likeCount = parseInt(details?.statistics.likeCount ?? '0', 10);
  const durationSeconds = details ? parseDuration(details.contentDetails.duration) : 0;

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
    quality_score: 0,
    metrics: {
      view_count: viewCount,
      like_count: likeCount,
      subscriber_count: subscriberCount,
      duration_seconds: durationSeconds,
      description_length: item.snippet.description.length,
    },
  };
}

/**
 * Collect learning resources from YouTube.
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

      const videoIds = items
        .map((item) => item.id.videoId)
        .filter((id): id is string => id != null && !seenIds.has(id));

      const detailsMap = await fetchVideoDetails(videoIds);

      // Collect unique channel IDs for subscriber count lookup
      const channelIds = items.map((item) => item.snippet.channelId);
      const channelStats = await fetchChannelStats(channelIds);

      for (const item of items) {
        const videoId = item.id.videoId;
        if (!videoId || seenIds.has(videoId)) continue;
        seenIds.add(videoId);

        const details = detailsMap.get(videoId);
        const subs = channelStats.get(item.snippet.channelId) ?? 0;
        resources.push(mapToResource(item, details, subs));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`[YouTube] keyword="${keyword}": ${msg}`);
      console.error(`  [YouTube] Error for "${keyword}": ${msg}`);
    }
  }

  console.log(`  [YouTube] Collected ${resources.length} resources`);
  return { platform: 'youtube', resources, errors };
}
