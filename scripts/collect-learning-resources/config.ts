/**
 * Configuration for the learning resources collector.
 * API keys are loaded from environment variables.
 */

import type { CollectorConfig } from './types';

/** Default search keywords for learning resources */
const DEFAULT_KEYWORDS = [
  '程式設計 教學',
  'programming tutorial',
  '線上課程 推薦',
  'learn coding',
  '學習資源',
  'web development',
  'data science tutorial',
  '自學 程式',
];

/**
 * Recommendation-type keywords — find resources "being recommended" by others
 * rather than resources that label themselves as tutorials.
 * These surface highly-discussed, community-validated content.
 */
const RECOMMENDATION_KEYWORDS = [
  '最推薦 課程',
  '學完 心得',
  '後悔沒早學',
  '改變我的 學習',
  '自學 推薦 資源',
  'best resources for learning',
  'must read programming',
  'underrated programming resources',
  'changed how I code',
  'wish I knew earlier',
];

/** YouTube Data API v3 configuration */
export const youtubeConfig = {
  apiKey: process.env.YOUTUBE_API_KEY ?? '',
  baseUrl: 'https://www.googleapis.com/youtube/v3',
};

/** GitHub API configuration */
export const githubConfig = {
  token: process.env.GITHUB_TOKEN ?? '',
  baseUrl: 'https://api.github.com',
};

/** Threads API configuration */
export const threadsConfig = {
  accessToken: process.env.THREADS_ACCESS_TOKEN ?? '',
  baseUrl: 'https://graph.threads.net',
};

/** Reddit API configuration (uses public JSON API, no auth required) */
export const redditConfig = {
  baseUrl: 'https://www.reddit.com',
  /** Learning-related subreddits to search */
  subreddits: [
    'learnprogramming',
    'webdev',
    'datascience',
    'programming',
    'coding',
    'cscareerquestions',
  ],
};

/** Hacker News API configuration (Algolia search, free, no auth required) */
export const hackernewsConfig = {
  baseUrl: 'https://hn.algolia.com/api/v1',
};

/** Default time window in days (90 days = ~3 months of recent content) */
export const DEFAULT_RECENT_DAYS = 90;

/**
 * Build collector config from CLI args or defaults.
 * @param overrideKeywords - Optional keyword override from CLI --keywords flag
 * @param maxResults - Max results per keyword (default 10)
 * @param recentDays - Only collect resources from the last N days (0 = no limit)
 * @param includeRecommendations - Include recommendation-type keywords (default true)
 */
export function buildCollectorConfig(
  overrideKeywords?: string[],
  maxResults = 10,
  recentDays = DEFAULT_RECENT_DAYS,
  includeRecommendations = true,
): CollectorConfig {
  let keywords: string[];

  if (overrideKeywords) {
    keywords = overrideKeywords;
  } else if (includeRecommendations) {
    keywords = [...DEFAULT_KEYWORDS, ...RECOMMENDATION_KEYWORDS];
  } else {
    keywords = DEFAULT_KEYWORDS;
  }

  return {
    keywords,
    maxResultsPerKeyword: maxResults,
    recentDays,
  };
}
