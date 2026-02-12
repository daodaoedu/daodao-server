/**
 * CSV writer utility.
 * Writes CollectedResource arrays to CSV files without external dependencies.
 * Follows RFC 4180 for proper escaping.
 */

import { writeFileSync } from 'node:fs';
import type { CollectedResource } from '../types';

/** CSV column definitions: [header, accessor function] */
const CSV_COLUMNS: [string, (r: CollectedResource) => string][] = [
  ['name', (r): string => r.name],
  ['url', (r): string => r.url],
  ['image_url', (r): string => r.image_url],
  ['description', (r): string => r.description],
  ['video_url', (r): string => r.video_url],
  ['type', (r): string => r.type],
  ['cost', (r): string => r.cost],
  ['level', (r): string => r.level],
  ['tags', (r): string => r.tags],
  ['source_platform', (r): string => r.source_platform],
  ['source_id', (r): string => r.source_id],
  ['published_at', (r): string => r.published_at],
  ['quality_score', (r): string => String(r.quality_score)],
];

/**
 * Escape a value for CSV format (RFC 4180).
 */
function escapeCsvValue(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Write collected resources to a CSV file.
 * @param resources - Array of resources to write (should already be scored and deduped)
 * @param outputPath - File path for the CSV output
 */
export function writeCsv(
  resources: CollectedResource[],
  outputPath: string,
): void {
  const headerRow = CSV_COLUMNS.map(([header]) => header).join(',');
  const dataRows = resources.map((resource) =>
    CSV_COLUMNS.map(([, accessor]) => escapeCsvValue(accessor(resource))).join(','),
  );
  const csvContent = [headerRow, ...dataRows].join('\n');

  writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\nCSV written to: ${outputPath}`);
  console.log(`Total resources: ${resources.length}`);
}
