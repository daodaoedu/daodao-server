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

/**
 * Build collector config from CLI args or defaults.
 * @param overrideKeywords - Optional keyword override from CLI --keywords flag
 * @param maxResults - Max results per keyword (default 10)
 */
export function buildCollectorConfig(
  overrideKeywords?: string[],
  maxResults = 10,
): CollectorConfig {
  return {
    keywords: overrideKeywords ?? DEFAULT_KEYWORDS,
    maxResultsPerKeyword: maxResults,
  };
}
