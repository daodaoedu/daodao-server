/**
 * Deduplication utility for collected resources.
 * Uses a local JSON file to track previously collected URLs — no DB dependency.
 *
 * Three layers of deduplication:
 * 1. History file — skip URLs already collected in previous runs
 * 2. URL normalization — catch equivalent URLs with different formats
 * 3. Cross-platform dedup — same resource shared on multiple platforms
 *
 * Cross-platform counting:
 * Before removing duplicates, counts how many platforms each URL appeared on.
 * The surviving resource gets a cross_platform_count metric for quality scoring.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { CollectedResource } from '../types';

/** Path to the local history file that tracks collected URLs */
const HISTORY_FILE = resolve(
  __dirname,
  '../data/collected-history.json',
);

/** Structure of the history file */
interface CollectionHistory {
  /** Last updated timestamp */
  updated_at: string;
  /** Total entries ever collected */
  total_collected: number;
  /** Map of normalized URL → collection metadata */
  entries: Record<
    string,
    {
      original_url: string;
      source_platform: string;
      name: string;
      collected_at: string;
    }
  >;
}

/**
 * Normalize a URL for comparison.
 * Handles common variations:
 *   - youtube.com/watch?v=X vs youtu.be/X
 *   - trailing slashes
 *   - http vs https
 *   - www vs non-www
 *   - utm_* tracking params
 *   - reddit short links and old/new reddit domains
 *   - news.ycombinator.com item links
 *
 * @param rawUrl - URL string to normalize
 * @returns Normalized URL string for comparison
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    // 1. Force https
    url.protocol = 'https:';

    // 2. Remove www prefix
    url.hostname = url.hostname.replace(/^www\./, '');

    // 3. YouTube short link → standard format
    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      return `https://youtube.com/watch?v=${videoId}`;
    }

    // 4. YouTube — keep only `v` param
    if (url.hostname === 'youtube.com' && url.pathname === '/watch') {
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return `https://youtube.com/watch?v=${videoId}`;
      }
    }

    // 5. GitHub — normalize to lowercase, remove trailing .git
    if (url.hostname === 'github.com') {
      url.pathname = url.pathname.toLowerCase().replace(/\.git$/, '');
    }

    // 6. Reddit — normalize old.reddit.com, new.reddit.com, redd.it
    if (url.hostname === 'old.reddit.com' || url.hostname === 'new.reddit.com') {
      url.hostname = 'reddit.com';
    }
    if (url.hostname === 'redd.it') {
      // redd.it/abc123 → reddit.com short link, keep as-is for dedup
      url.hostname = 'reddit.com';
    }

    // 7. Remove tracking params
    const trackingPrefixes = ['utm_', 'ref', 'fbclid', 'gclid', 'si'];
    const keysToRemove: string[] = [];
    url.searchParams.forEach((_, key) => {
      if (trackingPrefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach((key) => url.searchParams.delete(key));

    // 8. Sort remaining params for consistent comparison
    url.searchParams.sort();

    // 9. Remove trailing slash
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';

    // 10. Remove hash
    url.hash = '';

    return url.toString();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Load collection history from local JSON file.
 * Creates a new history if the file doesn't exist.
 */
function loadHistory(): CollectionHistory {
  if (!existsSync(HISTORY_FILE)) {
    return { updated_at: '', total_collected: 0, entries: {} };
  }

  try {
    const raw = readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) as CollectionHistory;
  } catch {
    console.warn('  [Dedup] Failed to parse history file, starting fresh');
    return { updated_at: '', total_collected: 0, entries: {} };
  }
}

/**
 * Save collection history to local JSON file.
 */
function saveHistory(history: CollectionHistory): void {
  const dir = dirname(HISTORY_FILE);
  mkdirSync(dir, { recursive: true });

  history.updated_at = new Date().toISOString();
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  console.log(`  [Dedup] History saved (${history.total_collected} total entries)`);
}

/** Result of deduplication */
export interface DedupResult {
  /** Resources that passed dedup (new, unique) */
  unique: CollectedResource[];
  /** Resources skipped because they exist in history */
  skippedExisting: number;
  /** Resources skipped as duplicates within the collected batch */
  skippedDuplicate: number;
}

/**
 * Count how many unique platforms each URL appears on.
 * Used to set cross_platform_count before dedup removes duplicates.
 *
 * @param resources - All collected resources from all platforms
 * @returns Map of normalized URL → number of unique platforms
 */
function countCrossPlatform(
  resources: CollectedResource[],
): Map<string, number> {
  const urlPlatforms = new Map<string, Set<string>>();

  for (const resource of resources) {
    const normalized = normalizeUrl(resource.url);
    const platforms = urlPlatforms.get(normalized) ?? new Set<string>();
    platforms.add(resource.source_platform);
    urlPlatforms.set(normalized, platforms);
  }

  const counts = new Map<string, number>();
  urlPlatforms.forEach((platforms, url) => {
    counts.set(url, platforms.size);
  });

  return counts;
}

/**
 * Deduplicate collected resources against history file and within the batch.
 * Also tracks cross-platform appearances for quality scoring.
 *
 * @param resources - All collected resources from all platforms
 * @returns DedupResult with unique resources and skip counts
 */
export function deduplicateResources(resources: CollectedResource[]): DedupResult {
  const history = loadHistory();
  const existingUrls = new Set(Object.keys(history.entries));

  // Count cross-platform appearances before dedup removes duplicates
  const crossPlatformCounts = countCrossPlatform(resources);
  const crossPlatformHits = Array.from(crossPlatformCounts.values()).filter((c) => c >= 2).length;
  if (crossPlatformHits > 0) {
    console.log(`  [Dedup] Found ${crossPlatformHits} URLs appearing on 2+ platforms`);
  }

  const seenUrls = new Set<string>();
  const unique: CollectedResource[] = [];
  let skippedExisting = 0;
  let skippedDuplicate = 0;

  console.log(`  [Dedup] Checking ${resources.length} resources against ${existingUrls.size} history entries`);

  for (const resource of resources) {
    const normalized = normalizeUrl(resource.url);

    // Set cross-platform count on the resource (even if it gets skipped,
    // this ensures the surviving copy has the correct count)
    const cpCount = crossPlatformCounts.get(normalized) ?? 1;
    resource.metrics.cross_platform_count = cpCount;

    // Skip if exists in history
    if (existingUrls.has(normalized)) {
      skippedExisting++;
      continue;
    }

    // Skip if already seen in this batch (cross-platform dedup)
    if (seenUrls.has(normalized)) {
      skippedDuplicate++;
      continue;
    }

    seenUrls.add(normalized);
    unique.push(resource);
  }

  // Record new entries into history
  const now = new Date().toISOString();
  for (const resource of unique) {
    const normalized = normalizeUrl(resource.url);
    history.entries[normalized] = {
      original_url: resource.url,
      source_platform: resource.source_platform,
      name: resource.name,
      collected_at: now,
    };
  }

  history.total_collected += unique.length;
  saveHistory(history);

  console.log(
    `  [Dedup] Result: ${unique.length} unique, ` +
      `${skippedExisting} already collected, ` +
      `${skippedDuplicate} batch duplicates`,
  );

  return { unique, skippedExisting, skippedDuplicate };
}
