/**
 * GitHub Platform Adapter
 * 使用 GitHub API 抓取學習相關的 Repository
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
import { BaseAdapter } from './base.adapter';

// GitHub API 回應類型
interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  default_branch: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

/**
 * GitHub Adapter
 */
export class GitHubAdapter extends BaseAdapter {
  platform: CollectionPlatform = COLLECTION_PLATFORMS.GITHUB;

  private readonly token: string;
  private readonly baseUrl = 'https://api.github.com';

  constructor() {
    super();
    this.token = process.env.GITHUB_TOKEN || '';

    if (!this.token) {
      console.warn('[GitHubAdapter] GITHUB_TOKEN is not set, rate limits will be restricted');
    }
  }

  /**
   * 根據來源設定抓取內容
   */
  async fetchContents(
    source: CollectionSourceDbModel,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    const maxResults = options?.maxResults || 100;

    switch (source.source_type) {
      case COLLECTION_SOURCE_TYPES.TOPIC:
        return this.fetchByTopic(source.source_value, maxResults, options);

      case COLLECTION_SOURCE_TYPES.USER:
        return this.fetchFromUser(source.source_value, maxResults);

      case COLLECTION_SOURCE_TYPES.KEYWORD:
        return this.fetchByKeyword(source.source_value, maxResults, options);

      case COLLECTION_SOURCE_TYPES.REPOSITORY:
        return this.fetchRepository(source.source_value);

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
    try {
      switch (sourceType) {
        case COLLECTION_SOURCE_TYPES.TOPIC:
          // Topic 不需要驗證
          return sourceValue.length > 0;

        case COLLECTION_SOURCE_TYPES.USER:
          return this.validateUser(sourceValue);

        case COLLECTION_SOURCE_TYPES.KEYWORD:
          return sourceValue.length > 0;

        case COLLECTION_SOURCE_TYPES.REPOSITORY:
          return this.validateRepository(sourceValue);

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * 取得單一 Repository 的詳細資訊
   */
  async getContentDetails(fullName: string): Promise<RawCollectedContent | null> {
    try {
      const repo = await this.getRepository(fullName);
      if (!repo) return null;

      return this.transformRepository(repo);
    } catch {
      return null;
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 取得 API 請求標頭
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 根據 Topic 搜尋 Repository
   */
  private async fetchByTopic(
    topic: string,
    maxResults: number,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    const perPage = Math.min(maxResults, 100);
    const query = `topic:${topic}`;

    return this.searchRepositories(query, perPage, options);
  }

  /**
   * 從用戶抓取 Repository
   */
  private async fetchFromUser(
    username: string,
    maxResults: number
  ): Promise<RawCollectedContent[]> {
    const perPage = Math.min(maxResults, 100);
    const url = `${this.baseUrl}/users/${username}/repos?per_page=${perPage}&sort=updated&direction=desc`;

    const response = await this.withRetry(() =>
      fetch(url, { headers: this.getHeaders() })
    );

    if (!response.ok) {
      throw this.createError(
        `GitHub API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const repos: GitHubRepository[] = await response.json();
    return repos
      .filter((repo) => !repo.fork) // 排除 fork
      .map((repo) => this.transformRepository(repo));
  }

  /**
   * 根據關鍵字搜尋 Repository
   */
  private async fetchByKeyword(
    keyword: string,
    maxResults: number,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    const perPage = Math.min(maxResults, 100);
    // 加入學習相關的搜尋條件
    const query = `${keyword} in:name,description,readme`;

    return this.searchRepositories(query, perPage, options);
  }

  /**
   * 抓取單一 Repository
   */
  private async fetchRepository(fullName: string): Promise<RawCollectedContent[]> {
    const repo = await this.getRepository(fullName);
    if (!repo) return [];

    return [this.transformRepository(repo)];
  }

  /**
   * 搜尋 Repository
   */
  private async searchRepositories(
    query: string,
    perPage: number,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]> {
    let fullQuery = query;

    // 加入時間過濾
    if (options?.publishedAfter) {
      const dateStr = options.publishedAfter.toISOString().split('T')[0];
      fullQuery += ` pushed:>=${dateStr}`;
    }

    // 排除 fork，排序by stars
    fullQuery += ' fork:false';

    const params = new URLSearchParams({
      q: fullQuery,
      sort: 'stars',
      order: 'desc',
      per_page: String(perPage),
    });

    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/search/repositories?${params}`, {
        headers: this.getHeaders(),
      })
    );

    if (!response.ok) {
      throw this.createError(
        `GitHub API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const data: GitHubSearchResponse = await response.json();
    return data.items.map((repo) => this.transformRepository(repo));
  }

  /**
   * 取得單一 Repository
   */
  private async getRepository(fullName: string): Promise<GitHubRepository | null> {
    const response = await this.withRetry(() =>
      fetch(`${this.baseUrl}/repos/${fullName}`, {
        headers: this.getHeaders(),
      })
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  /**
   * 驗證用戶是否存在
   */
  private async validateUser(username: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/users/${username}`, {
      headers: this.getHeaders(),
    });

    return response.ok;
  }

  /**
   * 驗證 Repository 是否存在
   */
  private async validateRepository(fullName: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/repos/${fullName}`, {
      headers: this.getHeaders(),
    });

    return response.ok;
  }

  /**
   * 轉換 GitHub Repository 為標準格式
   */
  private transformRepository(repo: GitHubRepository): RawCollectedContent {
    // 計算互動數 (stars + forks + watchers)
    const engagementCount =
      repo.stargazers_count + repo.forks_count + repo.watchers_count;

    // 建立描述
    let description = repo.description || '';
    if (repo.topics && repo.topics.length > 0) {
      description += `\n\nTopics: ${repo.topics.join(', ')}`;
    }
    if (repo.license) {
      description += `\nLicense: ${repo.license.name}`;
    }

    return {
      platform: COLLECTION_PLATFORMS.GITHUB,
      platformContentId: repo.node_id,
      originalUrl: repo.html_url,
      title: repo.full_name,
      description: this.truncate(description, 5000),
      thumbnailUrl: repo.owner.avatar_url,
      videoUrl: null,
      authorName: repo.owner.login,
      authorUrl: repo.owner.html_url,
      authorAvatarUrl: repo.owner.avatar_url,
      publishedAt: new Date(repo.created_at),
      engagementCount,
      stats: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count,
        size: repo.size,
        language: repo.language,
        topics: repo.topics,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
      },
      rawData: repo,
      language: this.mapLanguageCode(repo.language),
      durationSeconds: null,
    };
  }

  /**
   * 映射程式語言到語言代碼
   */
  private mapLanguageCode(language: string | null): string | null {
    if (!language) return null;

    // 程式語言不是內容語言，但我們可以儲存它
    // 這裡返回 null，讓 AI 分類時再判斷
    return null;
  }
}

/**
 * 建立 GitHub Adapter 實例
 */
export const createGitHubAdapter = (): GitHubAdapter => {
  return new GitHubAdapter();
};
