/**
 * Learning Resources Collector CLI
 *
 * Collects learning resources from YouTube, GitHub, and Threads,
 * applies deduplication and quality scoring, then outputs as CSV.
 *
 * Pipeline: Collect → Deduplicate → Score & Filter → CSV
 *
 * Usage:
 *   npx tsx scripts/collect-learning-resources/index.ts
 *   npx tsx scripts/collect-learning-resources/index.ts --platform youtube
 *   npx tsx scripts/collect-learning-resources/index.ts --keywords "React,TypeScript,學習"
 *   npx tsx scripts/collect-learning-resources/index.ts --output ./data/resources.csv
 *   npx tsx scripts/collect-learning-resources/index.ts --max-results 20
 *   npx tsx scripts/collect-learning-resources/index.ts --min-score 50
 *
 * Environment variables:
 *   YOUTUBE_API_KEY       - YouTube Data API v3 key
 *   GITHUB_TOKEN          - GitHub personal access token (optional, raises rate limit)
 *   THREADS_ACCESS_TOKEN  - Meta Threads API long-lived access token
 */

import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { buildCollectorConfig } from './config';
import { collectYouTube } from './collectors/youtube.collector';
import { collectGitHub } from './collectors/github.collector';
import { collectThreads } from './collectors/threads.collector';
import { deduplicateResources } from './utils/dedup';
import { scoreAndFilter, MIN_QUALITY_SCORE } from './utils/quality-scorer';
import { writeCsv } from './utils/csv-writer';
import type { CollectedResource, CollectorResult, SourcePlatform } from './types';

/** Supported platform names */
const VALID_PLATFORMS: SourcePlatform[] = ['youtube', 'github', 'threads'];

/** Parse CLI arguments */
function parseArgs(): {
  platforms: SourcePlatform[];
  keywords: string[] | undefined;
  output: string;
  maxResults: number;
  minScore: number;
} {
  const args = process.argv.slice(2);
  let platforms: SourcePlatform[] = [...VALID_PLATFORMS];
  let keywords: string[] | undefined;
  let output = '';
  let maxResults = 10;
  let minScore = MIN_QUALITY_SCORE;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--platform':
      case '-p': {
        const val = args[++i];
        if (val) {
          const requested = val.split(',') as SourcePlatform[];
          const invalid = requested.filter((p) => !VALID_PLATFORMS.includes(p));
          if (invalid.length > 0) {
            console.error(
              `Invalid platform(s): ${invalid.join(', ')}. Valid: ${VALID_PLATFORMS.join(', ')}`,
            );
            process.exit(1);
          }
          platforms = requested;
        }
        break;
      }
      case '--keywords':
      case '-k': {
        const val = args[++i];
        if (val) keywords = val.split(',').map((k) => k.trim());
        break;
      }
      case '--output':
      case '-o': {
        output = args[++i] ?? '';
        break;
      }
      case '--max-results':
      case '-m': {
        const val = args[++i];
        if (val) maxResults = parseInt(val, 10);
        break;
      }
      case '--min-score':
      case '-s': {
        const val = args[++i];
        if (val) minScore = parseInt(val, 10);
        break;
      }
      case '--help':
      case '-h': {
        console.log(`
Learning Resources Collector

Usage:
  npx tsx scripts/collect-learning-resources/index.ts [options]

Options:
  -p, --platform <name>       Platform(s): youtube,github,threads (default: all)
  -k, --keywords <list>       Comma-separated search keywords
  -o, --output <path>         Output CSV file path
  -m, --max-results <number>  Max results per keyword per platform (default: 10)
  -s, --min-score <number>    Minimum quality score 0-100 (default: ${MIN_QUALITY_SCORE})
  -h, --help                  Show this help message

Pipeline:
  1. Collect     - Fetch resources from each platform via API
  2. Deduplicate - Remove duplicates (local history + URL normalization)
  3. Score       - Calculate quality (engagement, content, authority, freshness)
  4. Filter      - Keep only resources above --min-score threshold
  5. Output      - Write to CSV sorted by quality score
        `);
        process.exit(0);
      }
    }
  }

  if (!output) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    output = resolve(
      process.cwd(),
      'scripts/collect-learning-resources/output',
      `resources-${timestamp}.csv`,
    );
  }

  return { platforms, keywords, output, maxResults, minScore };
}

/** Collector function lookup */
const collectors: Record<
  SourcePlatform,
  (config: ReturnType<typeof buildCollectorConfig>) => Promise<CollectorResult>
> = {
  youtube: collectYouTube,
  github: collectGitHub,
  threads: collectThreads,
};

/** Main entry point */
async function main(): Promise<void> {
  const { platforms, keywords, output, maxResults, minScore } = parseArgs();
  const config = buildCollectorConfig(keywords, maxResults);

  console.log('=== Learning Resources Collector ===');
  console.log(`Platforms:   ${platforms.join(', ')}`);
  console.log(`Keywords:    ${config.keywords.join(', ')}`);
  console.log(`Max results: ${config.maxResultsPerKeyword} per keyword`);
  console.log(`Min score:   ${minScore}`);
  console.log(`Output:      ${output}\n`);

  // Step 1: Collect from all platforms
  const allResources: CollectedResource[] = [];
  const allErrors: string[] = [];

  for (const platform of platforms) {
    console.log(`--- Collecting from ${platform} ---`);
    const result = await collectors[platform](config);
    allResources.push(...result.resources);
    allErrors.push(...result.errors);
  }

  // Step 2: Deduplicate (history file + URL normalization + cross-platform)
  console.log(`\n--- Deduplication ---`);
  const { unique, skippedExisting, skippedDuplicate } =
    deduplicateResources(allResources);

  // Step 3: Score and filter
  console.log(`\n--- Quality Scoring ---`);
  const { passed, filtered } = scoreAndFilter(unique, minScore);

  // Step 4: Write CSV
  mkdirSync(dirname(output), { recursive: true });
  writeCsv(passed, output);

  // Summary
  console.log('\n=== Summary ===');
  console.log('Collection:');
  for (const platform of platforms) {
    const count = allResources.filter((r) => r.source_platform === platform).length;
    console.log(`  ${platform}: ${count} raw`);
  }
  console.log(`\nDeduplication:`);
  console.log(`  Already collected: ${skippedExisting}`);
  console.log(`  Batch duplicates:  ${skippedDuplicate}`);
  console.log(`  Unique:            ${unique.length}`);
  console.log(`\nQuality filter (min ${minScore}):`);
  console.log(`  Passed:   ${passed.length}`);
  console.log(`  Filtered: ${filtered}`);

  if (passed.length > 0) {
    const scores = passed.map((r) => r.quality_score);
    console.log(`  Score range: ${Math.min(...scores)} - ${Math.max(...scores)}`);
  }

  if (allErrors.length > 0) {
    console.log(`\nWarnings/Errors (${allErrors.length}):`);
    for (const err of allErrors) {
      console.log(`  - ${err}`);
    }
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
