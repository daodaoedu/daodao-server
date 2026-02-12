/**
 * GitHub Search API collector.
 * Searches for educational repositories (awesome lists, tutorials, courses)
 * and maps them to CollectedResource format with metrics for quality scoring.
 *
 * GITHUB_TOKEN env var is optional but recommended (increases rate limit from 10 to 30 req/min).
 * API docs: https://docs.github.com/en/rest/search/search#search-repositories
 */

import { githubConfig } from '../config';
import type {
  CollectedResource,
  CollectorConfig,
  CollectorResult,
  ResourceType,
} from '../types';
import { COST_TYPE, LEVEL_TYPE, RESOURCE_TYPE } from '../types';

/** GitHub search result repository item */
interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  has_wiki: boolean;
  has_pages: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
  message?: string;
}

/** Keywords that suggest specific resource types */
const TYPE_HINTS: Record<string, ResourceType> = {
  awesome: RESOURCE_TYPE.BOOKS_ARTICLES,
  tutorial: RESOURCE_TYPE.BOOKS_ARTICLES,
  course: RESOURCE_TYPE.WORKSHOPS_COURSES,
  'learning-resources': RESOURCE_TYPE.BOOKS_ARTICLES,
  roadmap: RESOURCE_TYPE.BOOKS_ARTICLES,
  book: RESOURCE_TYPE.BOOKS_ARTICLES,
  tool: RESOURCE_TYPE.LEARNING_TOOLS,
  framework: RESOURCE_TYPE.LEARNING_TOOLS,
  library: RESOURCE_TYPE.LEARNING_TOOLS,
  platform: RESOURCE_TYPE.LEARNING_PLATFORM_APP,
};

/**
 * Search GitHub repositories for a given query.
 */
async function searchRepos(
  query: string,
  maxResults: number,
): Promise<GitHubRepo[]> {
  const params = new URLSearchParams({
    q: `${query} stars:>50`,
    sort: 'stars',
    order: 'desc',
    per_page: String(Math.min(maxResults, 100)),
  });

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'daodao-resource-collector',
  };

  if (githubConfig.token) {
    headers['Authorization'] = `Bearer ${githubConfig.token}`;
  }

  const response = await fetch(
    `${githubConfig.baseUrl}/search/repositories?${params}`,
    { headers },
  );

  const data = (await response.json()) as GitHubSearchResponse;
  if (data.message) throw new Error(`GitHub API: ${data.message}`);
  return data.items ?? [];
}

/**
 * Infer resource type from repo topics and name.
 */
function inferResourceType(repo: GitHubRepo): ResourceType {
  const searchText = [
    repo.full_name,
    ...(repo.topics ?? []),
    repo.description ?? '',
  ]
    .join(' ')
    .toLowerCase();

  for (const [hint, type] of Object.entries(TYPE_HINTS)) {
    if (searchText.includes(hint)) return type;
  }
  return RESOURCE_TYPE.OTHER;
}

/**
 * Map a GitHub repo to a CollectedResource with metrics.
 */
function mapToResource(repo: GitHubRepo): CollectedResource {
  const tags = [
    ...(repo.topics ?? []).slice(0, 8),
    repo.language ? repo.language.toLowerCase() : null,
    `stars:${repo.stargazers_count}`,
  ].filter((t): t is string => t != null);

  const description = (repo.description ?? `GitHub repository: ${repo.full_name}`).slice(0, 2000);

  return {
    name: repo.full_name.slice(0, 255),
    url: repo.html_url,
    image_url: repo.owner.avatar_url,
    description,
    video_url: '',
    type: inferResourceType(repo),
    cost: COST_TYPE.FREE,
    level: LEVEL_TYPE.ALL_LEVELS,
    tags: tags.join(','),
    source_platform: 'github',
    source_id: String(repo.id),
    published_at: repo.created_at,
    quality_score: 0,
    metrics: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      last_updated: repo.updated_at,
      has_wiki: repo.has_wiki,
      has_pages: repo.has_pages,
      has_license: repo.license != null,
      description_length: description.length,
    },
  };
}

/**
 * Collect learning resources from GitHub.
 */
export async function collectGitHub(
  config: CollectorConfig,
): Promise<CollectorResult> {
  const resources: CollectedResource[] = [];
  const errors: string[] = [];
  const seenIds = new Set<number>();

  const educationQueries = config.keywords.map(
    (kw) => `${kw} topic:education OR topic:tutorial OR topic:awesome-list OR topic:learning`,
  );

  const extraQueries = [
    'awesome-list topic:education',
    'tutorial topic:learning',
    'roadmap developer',
  ];

  const allQueries = [...educationQueries, ...extraQueries];

  for (const query of allQueries) {
    try {
      console.log(`  [GitHub] Searching: "${query}"`);
      const repos = await searchRepos(query, config.maxResultsPerKeyword);

      for (const repo of repos) {
        if (seenIds.has(repo.id)) continue;
        seenIds.add(repo.id);
        resources.push(mapToResource(repo));
      }

      // Respect GitHub search API rate limit
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`[GitHub] query="${query}": ${msg}`);
      console.error(`  [GitHub] Error for "${query}": ${msg}`);
    }
  }

  console.log(`  [GitHub] Collected ${resources.length} resources`);
  return { platform: 'github', resources, errors };
}
