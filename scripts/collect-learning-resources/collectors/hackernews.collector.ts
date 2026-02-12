/**
 * Hacker News collector using the Algolia Search API.
 * Searches for learning-related stories with high engagement (points, comments).
 * The HN community naturally filters for quality through upvotes.
 *
 * Free API, no authentication required.
 * API docs: https://hn.algolia.com/api
 */

import { hackernewsConfig } from '../config';
import type {
  CollectedResource,
  CollectorConfig,
  CollectorResult,
  ResourceType,
} from '../types';
import { COST_TYPE, LEVEL_TYPE, RESOURCE_TYPE } from '../types';

/** Hacker News story item from Algolia API */
interface HNStory {
  objectID: string;
  title: string;
  url: string | null;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  created_at_i: number;
  /** HN story text (for Ask HN / Show HN) */
  story_text: string | null;
  _tags: string[];
}

interface HNSearchResponse {
  hits: HNStory[];
  nbHits: number;
  page: number;
  nbPages: number;
}

/**
 * Search Hacker News for stories matching a query.
 * Uses the search endpoint for relevance-sorted results,
 * or search_by_date for recency-sorted results.
 */
async function searchStories(
  query: string,
  maxResults: number,
  recentDays: number,
): Promise<HNStory[]> {
  const params = new URLSearchParams({
    query,
    tags: 'story',
    hitsPerPage: String(Math.min(maxResults, 100)),
  });

  // Apply time window filter
  if (recentDays > 0) {
    const cutoffTimestamp = Math.floor(
      (Date.now() - recentDays * 24 * 60 * 60 * 1000) / 1000,
    );
    params.set('numericFilters', `points>10,created_at_i>${cutoffTimestamp}`);
  } else {
    params.set('numericFilters', 'points>10');
  }

  // Use search_by_date for recent content, search for relevance
  const endpoint = recentDays > 0 && recentDays <= 90
    ? 'search_by_date'
    : 'search';

  const url = `${hackernewsConfig.baseUrl}/${endpoint}?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HN Algolia API ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as HNSearchResponse;
  return data.hits ?? [];
}

/**
 * Determine if a HN story is learning-related.
 */
function isLearningRelated(story: HNStory): boolean {
  const text = `${story.title} ${story.story_text ?? ''}`.toLowerCase();

  const signals = [
    'learn', 'tutorial', 'course', 'guide', 'roadmap',
    'beginner', 'how to', 'introduction', 'fundamentals',
    'best practices', 'explained', 'teach', 'education',
    'book', 'resource', 'recommend', 'free',
    'show hn', 'ask hn',
    '學習', '教學', '課程', '教程', '指南',
  ];

  return signals.some((signal) => text.includes(signal));
}

/**
 * Infer resource type from HN story content.
 */
function inferResourceType(story: HNStory): ResourceType {
  const text = `${story.title} ${story.url ?? ''}`.toLowerCase();

  if (text.includes('youtube') || text.includes('video')) return RESOURCE_TYPE.VIDEO_CONTENT;
  if (text.includes('course') || text.includes('mooc')) return RESOURCE_TYPE.WORKSHOPS_COURSES;
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
  if (text.includes('github.com')) return RESOURCE_TYPE.BOOKS_ARTICLES;
  return RESOURCE_TYPE.OTHER;
}

/**
 * Map a HN story to a CollectedResource.
 */
function mapToResource(story: HNStory): CollectedResource {
  const hnUrl = `https://news.ycombinator.com/item?id=${story.objectID}`;
  const primaryUrl = story.url ?? hnUrl;

  const description = story.story_text
    ? story.story_text.replace(/<[^>]*>/g, '').slice(0, 2000)
    : `Hacker News story: ${story.title} (${story.points} points, ${story.num_comments} comments)`;

  const tags = [
    `hn:${story.objectID}`,
    `points:${story.points}`,
    `comments:${story.num_comments}`,
    `by:${story.author}`,
    'hackernews',
  ];

  return {
    name: story.title.slice(0, 255),
    url: primaryUrl,
    image_url: '',
    description,
    video_url: '',
    type: inferResourceType(story),
    cost: COST_TYPE.FREE,
    level: LEVEL_TYPE.ALL_LEVELS,
    tags: tags.join(','),
    source_platform: 'hackernews',
    source_id: story.objectID,
    published_at: story.created_at,
    quality_score: 0,
    metrics: {
      points: story.points,
      hn_num_comments: story.num_comments,
      description_length: description.length,
    },
  };
}

/**
 * Collect learning resources from Hacker News.
 * Uses Algolia search API with time window and engagement filters.
 */
export async function collectHackerNews(
  config: CollectorConfig,
): Promise<CollectorResult> {
  const resources: CollectedResource[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const keyword of config.keywords) {
    try {
      console.log(`  [HackerNews] Searching: "${keyword}"`);
      const stories = await searchStories(
        keyword,
        config.maxResultsPerKeyword,
        config.recentDays,
      );

      for (const story of stories) {
        if (seenIds.has(story.objectID)) continue;
        seenIds.add(story.objectID);

        if (!isLearningRelated(story)) continue;
        resources.push(mapToResource(story));
      }

      // Algolia rate limit is generous, but be polite
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`[HackerNews] keyword="${keyword}": ${msg}`);
      console.error(`  [HackerNews] Error for "${keyword}": ${msg}`);
    }
  }

  console.log(`  [HackerNews] Collected ${resources.length} resources`);
  return { platform: 'hackernews', resources, errors };
}
