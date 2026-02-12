/**
 * CSV writer utility.
 * Writes CollectedResource arrays to CSV files without external dependencies.
 */

import { writeFileSync } from 'node:fs';
import type { CollectedResource } from '../types';

/** CSV column headers matching CollectedResource fields */
const CSV_HEADERS: (keyof CollectedResource)[] = [
  'name',
  'url',
  'image_url',
  'description',
  'video_url',
  'type',
  'cost',
  'level',
  'tags',
  'source_platform',
  'source_id',
  'published_at',
];

/**
 * Escape a value for CSV format (RFC 4180).
 * Wraps in double quotes if the value contains commas, quotes, or newlines.
 * @param value - String value to escape
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
 * Convert a CollectedResource to a CSV row string.
 * @param resource - Resource to convert
 */
function resourceToCsvRow(resource: CollectedResource): string {
  return CSV_HEADERS.map((header) => escapeCsvValue(resource[header])).join(',');
}

/**
 * Write collected resources to a CSV file.
 * @param resources - Array of resources to write
 * @param outputPath - File path for the CSV output
 */
export function writeCsv(
  resources: CollectedResource[],
  outputPath: string,
): void {
  const headerRow = CSV_HEADERS.join(',');
  const dataRows = resources.map(resourceToCsvRow);
  const csvContent = [headerRow, ...dataRows].join('\n');

  writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\nCSV written to: ${outputPath}`);
  console.log(`Total resources: ${resources.length}`);
}
