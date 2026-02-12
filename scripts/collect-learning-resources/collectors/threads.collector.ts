/**
 * Threads API collector (Official Meta Threads API).
 * Uses the keyword_search endpoint to find learning-related posts.
 * Collects engagement metrics (likes, replies) for quality scoring.
 *
 * Requires THREADS_ACCESS_TOKEN environment variable.
 * Rate limit: 500 queries per rolling 7-day period.
 *
 * API docs: https://developers.facebook.com/docs/threads/keyword-search
 */

import { threadsConfig } from '../config';
import type {
  CollectedResource,
  CollectorConfig,
  CollectorResult,
} from '../types';
import { COST_TYPE, LEVEL_TYPE, RESOURCE_TYPE } from '../types';

/** Threads keyword search result item */
interface ThreadsPost {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
  media_type?: 'TEXT_POST' | 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink?: string;
  shortcode?: string;
  thumbnail_url?: string;
  like_count?: number;
  reply_count?: number;
}

interface ThreadsSearchResponse {
  data?: ThreadsPost[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { message: string; type: string; code: number };
}

const SEARCH_FIELDS = [
  'id', 'text', 'username', 'timestamp', 'media_type',
  'media_url', 'permalink', 'shortcode', 'thumbnail_url',
  'like_count', 'reply_count',
].join(',');

/**
 * Search Threads for posts matching a keyword.
 */
async function searchPosts(keyword: string): Promise<ThreadsPost[]> {
  const params = new URLSearchParams({
    q: keyword,
    fields: SEARCH_FIELDS,
    access_token: threadsConfig.accessToken,
  });

  const response = await fetch(`${threadsConfig.baseUrl}/keyword_search?${params}`);
  const data = (await response.json()) as ThreadsSearchResponse;

  if (data.error) {
    throw new Error(`Threads API (${data.error.code}): ${data.error.message}`);
  }

  return data.data ?? [];
}

/**
 * Extract URLs from post text content.
 */
function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s,)}\]]+/g;
  return text.match(urlPattern) ?? [];
}

/**
 * Build a permalink for a Threads post.
 */
function buildPermalink(post: ThreadsPost): string {
  if (post.permalink) return post.permalink;
  if (post.username && post.shortcode) {
    return `https://www.threads.net/@${post.username}/post/${post.shortcode}`;
  }
  return `https://www.threads.net`;
}

/**
 * Determine if a post contains learning-related content.
 * Filters out noise by checking for educational signals.
 */
function isLearningRelated(post: ThreadsPost): boolean {
  if (!post.text) return false;

  const text = post.text.toLowerCase();
  const signals = [
    '學習', '教學', '課程', '推薦', '資源', '入門', '教程',
    'learn', 'tutorial', 'course', 'resource', 'guide',
    'beginner', 'how to', 'tips', 'roadmap', '分享',
    'free', 'open source', 'github', 'youtube',
  ];

  return signals.some((signal) => text.includes(signal));
}

/**
 * Map a Threads post to a CollectedResource with metrics.
 */
function mapToResource(post: ThreadsPost): CollectedResource {
  const text = post.text ?? '';
  const urls = extractUrls(text);
  const primaryUrl = urls[0] ?? buildPermalink(post);

  const firstLine = text.split('\n')[0] ?? '';
  const name = firstLine.slice(0, 255) || `Threads post by @${post.username ?? 'unknown'}`;

  const imageUrl = post.thumbnail_url ?? post.media_url ?? '';
  const hasMedia = post.media_type != null && post.media_type !== 'TEXT_POST';

  const tags = [
    post.username ? `@${post.username}` : null,
    post.media_type ? post.media_type.toLowerCase() : null,
    'threads',
  ].filter((t): t is string => t != null);

  return {
    name,
    url: primaryUrl,
    image_url: imageUrl,
    description: text.slice(0, 2000),
    video_url: post.media_type === 'VIDEO' ? (post.media_url ?? '') : '',
    type: RESOURCE_TYPE.COMMUNITY_ORGANIZATION,
    cost: COST_TYPE.FREE,
    level: LEVEL_TYPE.ALL_LEVELS,
    tags: tags.join(','),
    source_platform: 'threads',
    source_id: post.id,
    published_at: post.timestamp ?? new Date().toISOString(),
    quality_score: 0,
    metrics: {
      thread_likes: post.like_count ?? 0,
      reply_count: post.reply_count ?? 0,
      has_media: hasMedia,
      description_length: text.length,
      url_count: urls.length,
    },
  };
}

/**
 * Check if a post is within the recent time window.
 * @param post - Threads post with timestamp
 * @param recentDays - Number of days to look back (0 = no limit)
 */
function isWithinTimeWindow(post: ThreadsPost, recentDays: number): boolean {
  if (recentDays <= 0) return true;
  if (!post.timestamp) return true; // Unknown date, keep it

  const postDate = new Date(post.timestamp).getTime();
  if (isNaN(postDate)) return true;

  const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
  return postDate >= cutoff;
}

/**
 * Collect learning resources from Threads.
 */
export async function collectThreads(
  config: CollectorConfig,
): Promise<CollectorResult> {
  const resources: CollectedResource[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (!threadsConfig.accessToken) {
    return {
      platform: 'threads',
      resources: [],
      errors: [
        'THREADS_ACCESS_TOKEN is not set. Skipping Threads collection. ' +
          'See: https://developers.facebook.com/docs/threads/keyword-search',
      ],
    };
  }

  for (const keyword of config.keywords) {
    try {
      console.log(`  [Threads] Searching: "${keyword}"`);
      const posts = await searchPosts(keyword);

      for (const post of posts) {
        if (seenIds.has(post.id)) continue;
        seenIds.add(post.id);
        if (!isLearningRelated(post)) continue;
        if (!isWithinTimeWindow(post, config.recentDays)) continue;
        resources.push(mapToResource(post));
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`[Threads] keyword="${keyword}": ${msg}`);
      console.error(`  [Threads] Error for "${keyword}": ${msg}`);
    }
  }

  console.log(`  [Threads] Collected ${resources.length} resources`);
  return { platform: 'threads', resources, errors };
}
