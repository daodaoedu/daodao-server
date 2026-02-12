/**
 * Quality scoring module for collected resources.
 *
 * Calculates a 0-100 score based on five dimensions:
 *   - Engagement      (0-30): platform-specific popularity signals
 *   - Content         (0-30): description quality and educational signals
 *   - Authority       (0-20): source credibility
 *   - Freshness       (0-20): recency of publication/update
 *   - Cross-platform  (0-10): bonus for appearing on multiple platforms
 *
 * The cross-platform bonus can push scores above 100; they are clamped to 100.
 * Resources below the minimum threshold are filtered out.
 */

import type { CollectedResource } from '../types';

/** Minimum quality score to include in output */
export const MIN_QUALITY_SCORE = 40;

/** Educational keywords for content scoring (bilingual) */
const EDUCATIONAL_KEYWORDS = [
  '教學', '學習', '課程', '入門', '進階', '實戰', '教程', '指南',
  '推薦', '資源', '筆記', '心得', '觀念', '原理', '基礎',
  'tutorial', 'learn', 'course', 'beginner', 'guide', 'roadmap',
  'how to', 'introduction', 'fundamentals', 'best practices',
  'explained', 'step by step', 'hands-on', 'workshop', 'bootcamp',
];

/** Negative signals that reduce quality score */
const NEGATIVE_SIGNALS = [
  'giveaway', '抽獎', 'subscribe to win', '點擊連結',
  'clickbait', 'shocking', '驚人', 'spam',
  'buy now', '立即購買', 'limited offer', '限時優惠',
];

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Score a value on a logarithmic scale.
 * Useful for metrics like views/stars where the distribution is highly skewed.
 *
 * @param value - Raw metric value
 * @param baseline - Value that scores ~50% of max points
 * @param maxPoints - Maximum points for this metric
 */
function logScore(value: number, baseline: number, maxPoints: number): number {
  if (value <= 0) return 0;
  // log(value+1) / log(baseline*10+1) gives ~1.0 at baseline*10
  const ratio = Math.log(value + 1) / Math.log(baseline * 10 + 1);
  return clamp(ratio * maxPoints, 0, maxPoints);
}

/**
 * Calculate engagement score (0-30) based on platform metrics.
 */
function scoreEngagement(resource: CollectedResource): number {
  const m = resource.metrics;
  const platform = resource.source_platform;

  switch (platform) {
    case 'youtube': {
      // View count: baseline 10k → ~15pts at 100k
      const viewScore = logScore(m.view_count ?? 0, 10_000, 15);
      // Like/view ratio: >4% is excellent
      const likeRatio =
        m.view_count && m.view_count > 0
          ? (m.like_count ?? 0) / m.view_count
          : 0;
      const ratioScore = clamp(likeRatio / 0.04 * 15, 0, 15);
      return viewScore + ratioScore;
    }
    case 'github': {
      // Stars: baseline 500 → ~20pts at 5000
      const starScore = logScore(m.stars ?? 0, 500, 20);
      // Forks: baseline 100 → ~10pts at 1000
      const forkScore = logScore(m.forks ?? 0, 100, 10);
      return starScore + forkScore;
    }
    case 'threads': {
      // Likes: baseline 50 → ~20pts at 500
      const likeScore = logScore(m.thread_likes ?? 0, 50, 20);
      // Replies: baseline 10 → ~10pts at 100
      const replyScore = logScore(m.reply_count ?? 0, 10, 10);
      return likeScore + replyScore;
    }
    case 'reddit': {
      // Upvotes: baseline 100 → ~20pts at 1000
      const upvoteScore = logScore(m.upvotes ?? 0, 100, 20);
      // Comments: baseline 20 → ~10pts at 200 (high discussion signal)
      const commentScore = logScore(m.num_comments ?? 0, 20, 10);
      return upvoteScore + commentScore;
    }
    case 'hackernews': {
      // Points: baseline 50 → ~20pts at 500 (HN is selective)
      const pointScore = logScore(m.points ?? 0, 50, 20);
      // Comments: baseline 20 → ~10pts at 200
      const commentScore = logScore(m.hn_num_comments ?? 0, 20, 10);
      return pointScore + commentScore;
    }
    default:
      return 0;
  }
}

/**
 * Calculate content quality score (0-30) based on text analysis.
 */
function scoreContent(resource: CollectedResource): number {
  const text = `${resource.name} ${resource.description}`.toLowerCase();
  let score = 0;

  // Description length (0-10)
  // Too short (<50 chars) = low effort, sweet spot 200-1000
  const descLen = resource.description.length;
  if (descLen >= 200) score += 10;
  else if (descLen >= 100) score += 7;
  else if (descLen >= 50) score += 4;
  else score += 1;

  // Educational keyword density (0-12)
  // Count how many unique educational keywords appear
  const matchCount = EDUCATIONAL_KEYWORDS.filter((kw) =>
    text.includes(kw.toLowerCase()),
  ).length;
  score += clamp(matchCount * 3, 0, 12);

  // Structured content bonus (0-4)
  // Bullet points, numbered lists, sections suggest structured content
  const structureSignals = ['\n-', '\n•', '\n1.', '\n##', '📌', '👉', '✅'];
  const hasStructure = structureSignals.some((s) => resource.description.includes(s));
  if (hasStructure) score += 4;

  // Negative signal penalty (0 to -8)
  const negativeCount = NEGATIVE_SIGNALS.filter((kw) =>
    text.includes(kw.toLowerCase()),
  ).length;
  score -= negativeCount * 4;

  // URL in description bonus for community platforms (suggests sharing actual resources)
  const isCommunityPlatform =
    resource.source_platform === 'threads' ||
    resource.source_platform === 'reddit';
  if (isCommunityPlatform && (resource.metrics.url_count ?? 0) > 0) {
    score += 4;
  }

  return clamp(score, 0, 30);
}

/**
 * Calculate source authority score (0-20).
 */
function scoreAuthority(resource: CollectedResource): number {
  const m = resource.metrics;
  const platform = resource.source_platform;

  switch (platform) {
    case 'youtube': {
      // Subscriber count: baseline 10k → ~20pts at 100k+
      return logScore(m.subscriber_count ?? 0, 10_000, 20);
    }
    case 'github': {
      let score = 0;
      // Has wiki/pages = documented project (+5 each)
      if (m.has_wiki) score += 5;
      if (m.has_pages) score += 5;
      // Has license = proper open source (+5)
      if (m.has_license) score += 5;
      // Active issues = maintained (+5)
      if ((m.open_issues ?? 0) > 0) score += 5;
      return clamp(score, 0, 20);
    }
    case 'threads': {
      // Has media = more effort (+10)
      if (m.has_media) return 10;
      return 5; // Text-only posts get baseline
    }
    case 'reddit': {
      let score = 0;
      // High upvote ratio = community agrees (>0.85 = strong signal)
      const ratio = m.upvote_ratio ?? 0;
      if (ratio >= 0.90) score += 10;
      else if (ratio >= 0.80) score += 7;
      else if (ratio >= 0.70) score += 4;
      else score += 2;
      // Active discussion = valuable (>10 comments)
      if ((m.num_comments ?? 0) >= 50) score += 10;
      else if ((m.num_comments ?? 0) >= 20) score += 7;
      else if ((m.num_comments ?? 0) >= 5) score += 4;
      return clamp(score, 0, 20);
    }
    case 'hackernews': {
      // HN's community is highly selective — high points = strong signal
      const points = m.points ?? 0;
      if (points >= 200) return 20;
      if (points >= 100) return 16;
      if (points >= 50) return 12;
      if (points >= 20) return 8;
      return 4;
    }
    default:
      return 0;
  }
}

/**
 * Calculate freshness score (0-20) based on publication/update date.
 */
function scoreFreshness(resource: CollectedResource): number {
  const now = Date.now();

  // Use last_updated for GitHub, published_at for others
  const dateStr =
    resource.source_platform === 'github' && resource.metrics.last_updated
      ? resource.metrics.last_updated
      : resource.published_at;

  if (!dateStr) return 5; // Unknown date gets baseline

  const publishedAt = new Date(dateStr).getTime();
  if (isNaN(publishedAt)) return 5;

  const daysSince = (now - publishedAt) / (1000 * 60 * 60 * 24);

  // Within 30 days: full score
  if (daysSince <= 30) return 20;
  // Within 90 days: high score
  if (daysSince <= 90) return 16;
  // Within 180 days: decent
  if (daysSince <= 180) return 12;
  // Within 1 year: ok
  if (daysSince <= 365) return 8;
  // Within 2 years: low
  if (daysSince <= 730) return 4;
  // Older: minimal
  return 2;
}

/**
 * Calculate cross-platform bonus score (0-10).
 * Resources that appear on multiple platforms are more likely to be genuinely valuable.
 *
 * @param resource - Resource with cross_platform_count set during dedup
 * @returns Bonus score 0-10
 */
function scoreCrossPlatform(resource: CollectedResource): number {
  const count = resource.metrics.cross_platform_count ?? 1;
  if (count >= 4) return 10;
  if (count >= 3) return 7;
  if (count >= 2) return 4;
  return 0;
}

/**
 * Calculate overall quality score for a resource.
 * @param resource - Collected resource with metrics
 * @returns Score between 0-100
 */
export function calculateQualityScore(resource: CollectedResource): number {
  const engagement = scoreEngagement(resource);
  const content = scoreContent(resource);
  const authority = scoreAuthority(resource);
  const freshness = scoreFreshness(resource);
  const crossPlatform = scoreCrossPlatform(resource);

  return Math.round(
    clamp(engagement + content + authority + freshness + crossPlatform, 0, 100),
  );
}

/**
 * Score and filter resources by quality.
 * @param resources - All collected resources
 * @param minScore - Minimum score threshold (default: MIN_QUALITY_SCORE)
 * @returns Object with passed/filtered resources and score breakdown
 */
export function scoreAndFilter(
  resources: CollectedResource[],
  minScore = MIN_QUALITY_SCORE,
): { passed: CollectedResource[]; filtered: number } {
  let filtered = 0;
  const passed: CollectedResource[] = [];

  for (const resource of resources) {
    resource.quality_score = calculateQualityScore(resource);

    if (resource.quality_score >= minScore) {
      passed.push(resource);
    } else {
      filtered++;
    }
  }

  // Sort by quality score descending
  passed.sort((a, b) => b.quality_score - a.quality_score);

  console.log(
    `  [Quality] ${passed.length} passed (>= ${minScore}), ${filtered} filtered out`,
  );

  return { passed, filtered };
}
