/**
 * Learning Resources Collector CLI
 *
 * Collects learning resources from YouTube, GitHub, and Threads,
 * then outputs them as a CSV file matching the `resources` table schema.
 *
 * Usage:
 *   npx tsx scripts/collect-learning-resources/index.ts
 *   npx tsx scripts/collect-learning-resources/index.ts --platform youtube
 *   npx tsx scripts/collect-learning-resources/index.ts --keywords "React,TypeScript,學習"
 *   npx tsx scripts/collect-learning-resources/index.ts --output ./data/resources.csv
 *   npx tsx scripts/collect-learning-resources/index.ts --max-results 20
 *
 * Environment variables:
 *   YOUTUBE_API_KEY       - YouTube Data API v3 key
 *   GITHUB_TOKEN          - GitHub personal access token (optional, raises rate limit)
 *   THREADS_ACCESS_TOKEN  - Meta Threads API long-lived access token
 */

import { resolve } from 'node:path';
import { buildCollectorConfig } from './config';
import { collectYouTube } from './collectors/youtube.collector';
import { collectGitHub } from './collectors/github.collector';
import { collectThreads } from './collectors/threads.collector';
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
} {
  const args = process.argv.slice(2);
  let platforms: SourcePlatform[] = [...VALID_PLATFORMS];
  let keywords: string[] | undefined;
  let output = '';
  let maxResults = 10;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--platform':
      case '-p': {
        const val = args[++i];
        if (val) {
          const requested = val.split(',') as SourcePlatform[];
          const invalid = requested.filter(
            (p) => !VALID_PLATFORMS.includes(p),
          );
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
        if (val) {
          keywords = val.split(',').map((k) => k.trim());
        }
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
      case '--help':
      case '-h': {
        console.log(`
Learning Resources Collector

Usage:
  npx tsx scripts/collect-learning-resources/index.ts [options]

Options:
  -p, --platform <name>       Platform(s) to collect from: youtube,github,threads (default: all)
  -k, --keywords <list>       Comma-separated search keywords
  -o, --output <path>         Output CSV file path (default: ./output/resources-<timestamp>.csv)
  -m, --max-results <number>  Max results per keyword per platform (default: 10)
  -h, --help                  Show this help message
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

  return { platforms, keywords, output, maxResults };
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
  const { platforms, keywords, output, maxResults } = parseArgs();
  const config = buildCollectorConfig(keywords, maxResults);

  console.log('=== Learning Resources Collector ===');
  console.log(`Platforms: ${platforms.join(', ')}`);
  console.log(`Keywords: ${config.keywords.join(', ')}`);
  console.log(`Max results per keyword: ${config.maxResultsPerKeyword}`);
  console.log(`Output: ${output}\n`);

  const allResources: CollectedResource[] = [];
  const allErrors: string[] = [];

  // Run collectors sequentially to respect rate limits
  for (const platform of platforms) {
    console.log(`--- Collecting from ${platform} ---`);
    const result = await collectors[platform](config);
    allResources.push(...result.resources);
    allErrors.push(...result.errors);
  }

  // Ensure output directory exists
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(output), { recursive: true });

  // Write CSV
  writeCsv(allResources, output);

  // Summary
  console.log('\n=== Summary ===');
  for (const platform of platforms) {
    const count = allResources.filter(
      (r) => r.source_platform === platform,
    ).length;
    console.log(`  ${platform}: ${count} resources`);
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
