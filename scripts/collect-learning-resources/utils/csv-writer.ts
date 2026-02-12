/**
 * CSV writer utility.
 * Writes CollectedResource arrays to CSV files without external dependencies.
 * Follows RFC 4180 for proper escaping.
 */

import { writeFileSync } from 'node:fs';
import type { CollectedResource } from '../types';

/** CSV column definitions: [header, accessor function] */
const CSV_COLUMNS: [string, (r: CollectedResource) => string][] = [
  ['name', (r) => r.name],
  ['url', (r) => r.url],
  ['image_url', (r) => r.image_url],
  ['description', (r) => r.description],
  ['video_url', (r) => r.video_url],
  ['type', (r) => r.type],
  ['cost', (r) => r.cost],
  ['level', (r) => r.level],
  ['tags', (r) => r.tags],
  ['source_platform', (r) => r.source_platform],
  ['source_id', (r) => r.source_id],
  ['published_at', (r) => r.published_at],
  ['quality_score', (r) => String(r.quality_score)],
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
