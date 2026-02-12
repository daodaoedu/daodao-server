/**
 * Reddit collector using the public JSON API (no authentication required).
 * Searches learning-related subreddits for highly-upvoted posts that share
 * or recommend educational resources.
 *
 * Rate limit: ~60 requests/minute (be respectful with delays).
 * API: Append .json to any Reddit URL for JSON response.
 */

import { redditConfig } from '../config';
import type {
  CollectedResource,
  CollectorConfig,
  CollectorResult,
  ResourceType,
} from '../types';
import { COST_TYPE, LEVEL_TYPE, RESOURCE_TYPE } from '../types';

/** Reddit post data shape (subset of the full API response) */
interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  subreddit: string;
  author: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: number;
  is_self: boolean;
  link_flair_text?: string | null;
  thumbnail?: string;
  domain?: string;
}

interface RedditListingResponse {
  data?: {
    children?: Array<{ data: RedditPost }>;
    after?: string | null;
  };
  error?: number;
  message?: string;
}

/**
 * Convert recentDays to Reddit time filter parameter.
 * Reddit API supports: hour, day, week, month, year, all
 */
function getTimeFilter(recentDays: number): string {
  if (recentDays <= 0) return 'all';
  if (recentDays <= 1) return 'day';
  if (recentDays <= 7) return 'week';
  if (recentDays <= 30) return 'month';
  if (recentDays <= 365) return 'year';
  return 'all';
}

/**
 * Search a subreddit for posts matching a keyword, sorted by top.
 */
async function searchSubreddit(
  subreddit: string,
  keyword: string,
  timeFilter: string,
  maxResults: number,
): Promise<RedditPost[]> {
  const params = new URLSearchParams({
    q: keyword,
    sort: 'top',
    t: timeFilter,
    limit: String(Math.min(maxResults, 100)),
    restrict_sr: '1',
    type: 'link',
  });

  const url = `${redditConfig.baseUrl}/r/${subreddit}/search.json?${params}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'daodao-resource-collector/1.0 (educational; research)',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as RedditListingResponse;
  if (data.error) {
    throw new Error(`Reddit API error ${data.error}: ${data.message ?? 'Unknown'}`);
  }

  return (data.data?.children ?? []).map((c) => c.data);
}

/**
 * Extract external URLs from post selftext content.
 */
function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s,)}\]>]+/g;
  return text.match(urlPattern) ?? [];
}

/**
 * Determine if a Reddit post contains learning-related content.
 */
function isLearningRelated(post: RedditPost): boolean {
  const text = `${post.title} ${post.selftext} ${post.link_flair_text ?? ''}`.toLowerCase();

  const signals = [
    '學習', '教學', '課程', '推薦', '資源', '入門', '教程',
    'learn', 'tutorial', 'course', 'resource', 'guide', 'roadmap',
    'beginner', 'how to', 'tips', 'recommend', 'best',
    'free', 'open source', 'github', 'youtube',
    'book', 'video', 'project', 'practice', 'study',
  ];

  return signals.some((signal) => text.includes(signal));
}

/**
 * Infer resource type from Reddit post content.
 */
function inferResourceType(post: RedditPost): ResourceType {
  const text = `${post.title} ${post.selftext} ${post.domain ?? ''}`.toLowerCase();

  if (text.includes('youtube') || text.includes('video')) return RESOURCE_TYPE.VIDEO_CONTENT;
  if (text.includes('course') || text.includes('udemy') || text.includes('coursera')) {
    return RESOURCE_TYPE.WORKSHOPS_COURSES;
  }
  if (text.includes('book') || text.includes('article') || text.includes('blog')) {
    return RESOURCE_TYPE.BOOKS_ARTICLES;
  }
  if (text.includes('tool') || text.includes('library') || text.includes('framework')) {
    return RESOURCE_TYPE.LEARNING_TOOLS;
  }
  if (text.includes('platform') || text.includes('app')) {
    return RESOURCE_TYPE.LEARNING_PLATFORM_APP;
  }
  if (text.includes('podcast')) return RESOURCE_TYPE.PODCAST_CONTENT;
  return RESOURCE_TYPE.COMMUNITY_ORGANIZATION;
}

/**
 * Map a Reddit post to a CollectedResource.
 */
function mapToResource(post: RedditPost): CollectedResource {
  const selfTextUrls = extractUrls(post.selftext);
  const primaryUrl = post.is_self
    ? (selfTextUrls[0] ?? `https://www.reddit.com${post.permalink}`)
    : post.url;

  const description = post.selftext
    ? post.selftext.slice(0, 2000)
    : `Reddit post in r/${post.subreddit}: ${post.title}`;

  const tags = [
    `r/${post.subreddit}`,
    `u/${post.author}`,
    post.link_flair_text ? post.link_flair_text.toLowerCase() : null,
    `score:${post.score}`,
    'reddit',
  ].filter((t): t is string => t != null);

  const imageUrl = post.thumbnail && post.thumbnail.startsWith('http')
    ? post.thumbnail
    : '';

  return {
    name: post.title.slice(0, 255),
    url: primaryUrl,
    image_url: imageUrl,
    description,
    video_url: '',
    type: inferResourceType(post),
    cost: COST_TYPE.FREE,
    level: LEVEL_TYPE.ALL_LEVELS,
    tags: tags.join(','),
    source_platform: 'reddit',
    source_id: post.id,
    published_at: new Date(post.created_utc * 1000).toISOString(),
    quality_score: 0,
    metrics: {
      upvotes: post.score,
      upvote_ratio: post.upvote_ratio,
      num_comments: post.num_comments,
      subreddit: post.subreddit,
      description_length: description.length,
      url_count: selfTextUrls.length,
    },
  };
}

/**
 * Collect learning resources from Reddit.
 * Searches configured subreddits with each keyword, respecting time window.
 */
export async function collectReddit(
  config: CollectorConfig,
): Promise<CollectorResult> {
  const resources: CollectedResource[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const timeFilter = getTimeFilter(config.recentDays);

  for (const subreddit of redditConfig.subreddits) {
    for (const keyword of config.keywords) {
      try {
        console.log(`  [Reddit] Searching r/${subreddit}: "${keyword}"`);
        const posts = await searchSubreddit(
          subreddit,
          keyword,
          timeFilter,
          config.maxResultsPerKeyword,
        );

        for (const post of posts) {
          if (seenIds.has(post.id)) continue;
          seenIds.add(post.id);

          // Skip low-quality posts (< 5 upvotes)
          if (post.score < 5) continue;

          if (!isLearningRelated(post)) continue;
          resources.push(mapToResource(post));
        }

        // Respect Reddit rate limits
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`[Reddit] r/${subreddit} keyword="${keyword}": ${msg}`);
        console.error(`  [Reddit] Error for r/${subreddit} "${keyword}": ${msg}`);
      }
    }
  }

  console.log(`  [Reddit] Collected ${resources.length} resources`);
  return { platform: 'reddit', resources, errors };
}
