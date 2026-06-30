/**
 * Schema drift detector: compares daodao-storage SQL schema against Prisma schema.
 *
 * Local usage:
 *   ts-node --transpile-only -r tsconfig-paths/register src/scripts/check-schema-drift.ts
 *
 * CI usage (set env vars):
 *   STORAGE_SCHEMA_PATH=/path/to/daodao-storage/schema \
 *   ts-node --transpile-only -r tsconfig-paths/register src/scripts/check-schema-drift.ts
 *
 * To suppress known/intentional drift, add entries to .schema-drift-ignore.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Prisma built-in scalar types that map to real DB columns
const PRISMA_SCALARS = new Set([
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'BigInt',
  'Decimal',
  'Json',
  'Bytes',
  'Unsupported',
]);

// ── SQL parsing ───────────────────────────────────────────────────────────────

function stripLineComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '');
}

/**
 * Extracts CREATE TABLE block bodies, handling nested parens correctly.
 * Supports: quoted/unquoted names, IF NOT EXISTS, schema-prefixed (public.)
 */
function extractCreateTableBlocks(sql: string): Array<{ name: string; body: string }> {
  const blocks: Array<{ name: string; body: string }> = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?["']?(\w+)["']?\s*\(/gi;

  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const name = m[1].toLowerCase();
    const openIdx = m.index + m[0].length - 1; // index of the opening (
    let depth = 0;
    let i = openIdx;
    while (i < sql.length) {
      if (sql[i] === '(') depth++;
      else if (sql[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    blocks.push({ name, body: sql.slice(openIdx + 1, i) });
  }
  return blocks;
}

/** Splits a string by top-level commas (depth-0), ignoring nested parens. */
function splitTopLevelCommas(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) {
      parts.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  const tail = s.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function extractColumnsFromBody(body: string): string[] {
  const cols: string[] = [];
  for (const part of splitTopLevelCommas(body)) {
    const t = part.trim();
    if (!t) continue;
    // Skip table-level constraints
    if (/^(CONSTRAINT|FOREIGN\s+KEY|PRIMARY\s+KEY|UNIQUE\s*\(|CHECK\s*\(|INDEX\b)/i.test(t)) continue;
    // Column name is the first identifier (quoted or not) followed by a type keyword
    const colMatch = t.match(/^["']?(\w+)["']?\s+\w/);
    if (colMatch) cols.push(colMatch[1].toLowerCase());
  }
  return cols;
}

function parseSqlFiles(schemaDir: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(schemaDir, file), 'utf-8');
    const sql = stripLineComments(raw);

    for (const { name, body } of extractCreateTableBlocks(sql)) {
      if (!tables.has(name)) tables.set(name, new Set());
      for (const col of extractColumnsFromBody(body)) {
        tables.get(name)!.add(col);
      }
    }

    // ALTER TABLE ... ADD COLUMN [IF NOT EXISTS] "col" TYPE
    const alterRe =
      /ALTER\s+TABLE\s+(?:\w+\.)?["']?(\w+)["']?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s/gi;
    let am: RegExpExecArray | null;
    while ((am = alterRe.exec(sql)) !== null) {
      const tbl = am[1].toLowerCase();
      const col = am[2].toLowerCase();
      if (!tables.has(tbl)) tables.set(tbl, new Set());
      tables.get(tbl)!.add(col);
    }
  }

  return tables;
}

// ── Prisma parsing ────────────────────────────────────────────────────────────

function parsePrismaSchema(prismaFile: string): Map<string, Set<string>> {
  const content = fs.readFileSync(prismaFile, 'utf-8');
  const tables = new Map<string, Set<string>>();

  // Collect enum names so we can include enum-typed fields as real columns
  const enumNames = new Set<string>();
  const enumRe = /^enum\s+(\w+)\s*\{/gm;
  let m: RegExpExecArray | null;
  while ((m = enumRe.exec(content)) !== null) enumNames.add(m[1]);

  const modelRe = /^model\s+(\w+)\s*\{([^}]+)\}/gm;
  while ((m = modelRe.exec(content)) !== null) {
    const modelName = m[1];
    const body = m[2];

    // Respect @@map for non-conventional table names
    const mapMatch = body.match(/@@map\("([^"]+)"\)/);
    const tableName = (mapMatch ? mapMatch[1] : modelName).toLowerCase();

    const cols = new Set<string>();
    for (const line of body.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('//') || t.startsWith('@@')) continue;

      // Field line: fieldName FieldType ...decorators...
      const fieldMatch = t.match(/^(\w+)\s+([\w[\]?]+)/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      const rawType = fieldMatch[2].replace(/[?[\]]/g, ''); // strip ?, [], etc.

      // Skip relation fields (type is another model, not a scalar or enum)
      if (!PRISMA_SCALARS.has(rawType) && !enumNames.has(rawType)) continue;

      // Respect @map for non-conventional column names
      const colMapMatch = t.match(/@map\("([^"]+)"\)/);
      const colName = (colMapMatch ? colMapMatch[1] : fieldName).toLowerCase();
      cols.add(colName);
    }

    tables.set(tableName, cols);
  }

  return tables;
}

// ── Ignore config ─────────────────────────────────────────────────────────────

interface IgnoreConfig {
  /** Tables that only exist in SQL (no Prisma model needed) */
  sqlOnly: string[];
  /** Tables that only exist in Prisma (no SQL file needed, e.g. views) */
  prismaOnly: string[];
  /** Columns to ignore: "table.column" */
  columns: string[];
}

function loadIgnoreConfig(projectRoot: string): IgnoreConfig {
  const configPath = path.join(projectRoot, '.schema-drift-ignore.json');
  if (!fs.existsSync(configPath)) return { sqlOnly: [], prismaOnly: [], columns: [] };
  return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as IgnoreConfig;
}

// ── Comparison ────────────────────────────────────────────────────────────────

interface DriftReport {
  missingInPrisma: string[]; // tables
  missingInSql: string[]; // tables
  columnsMissingInPrisma: string[]; // "table.col"
  columnsMissingInSql: string[]; // "table.col"
}

function detectDrift(
  sqlTables: Map<string, Set<string>>,
  prismaTables: Map<string, Set<string>>,
  ignore: IgnoreConfig,
): DriftReport {
  const sqlOnly = new Set(ignore.sqlOnly.map((t) => t.toLowerCase()));
  const prismaOnly = new Set(ignore.prismaOnly.map((t) => t.toLowerCase()));
  const ignoredCols = new Set(ignore.columns.map((c) => c.toLowerCase()));

  const report: DriftReport = {
    missingInPrisma: [],
    missingInSql: [],
    columnsMissingInPrisma: [],
    columnsMissingInSql: [],
  };

  for (const table of sqlTables.keys()) {
    if (sqlOnly.has(table)) continue;
    if (!prismaTables.has(table)) report.missingInPrisma.push(table);
  }

  for (const table of prismaTables.keys()) {
    if (prismaOnly.has(table)) continue;
    if (!sqlTables.has(table)) report.missingInSql.push(table);
  }

  for (const [table, sqlCols] of sqlTables) {
    if (sqlOnly.has(table)) continue;
    const prismaCols = prismaTables.get(table);
    if (!prismaCols) continue;

    for (const col of sqlCols) {
      const key = `${table}.${col}`;
      if (!prismaCols.has(col) && !ignoredCols.has(key)) {
        report.columnsMissingInPrisma.push(key);
      }
    }
    for (const col of prismaCols) {
      const key = `${table}.${col}`;
      if (!sqlCols.has(col) && !ignoredCols.has(key)) {
        report.columnsMissingInSql.push(key);
      }
    }
  }

  return report;
}

function printReport(report: DriftReport): void {
  const total =
    report.missingInPrisma.length +
    report.missingInSql.length +
    report.columnsMissingInPrisma.length +
    report.columnsMissingInSql.length;

  if (total === 0) {
    console.log('✅ No schema drift detected.');
    return;
  }

  console.error(`\n❌ Schema drift detected — ${total} issue(s)\n`);

  if (report.missingInPrisma.length) {
    console.error(`Tables in SQL but missing in Prisma (${report.missingInPrisma.length}):`);
    for (const t of report.missingInPrisma.sort()) console.error(`  • ${t}`);
    console.error('');
  }
  if (report.missingInSql.length) {
    console.error(`Models in Prisma but missing in SQL (${report.missingInSql.length}):`);
    for (const t of report.missingInSql.sort()) console.error(`  • ${t}`);
    console.error('');
  }
  if (report.columnsMissingInPrisma.length) {
    console.error(`Columns in SQL but missing in Prisma (${report.columnsMissingInPrisma.length}):`);
    for (const c of report.columnsMissingInPrisma.sort()) console.error(`  • ${c}`);
    console.error('');
  }
  if (report.columnsMissingInSql.length) {
    console.error(`Columns in Prisma but missing in SQL (${report.columnsMissingInSql.length}):`);
    for (const c of report.columnsMissingInSql.sort()) console.error(`  • ${c}`);
    console.error('');
  }

  console.error('Fix: update prisma/schema.prisma to match SQL, or add entries to .schema-drift-ignore.json');
}

// ── Entry point ───────────────────────────────────────────────────────────────

function main(): void {
  const projectRoot = path.resolve(__dirname, '../..');
  const storageSchemaDir =
    process.env.STORAGE_SCHEMA_PATH ??
    path.resolve(projectRoot, '..', 'daodao-storage', 'schema');
  const prismaSchemaFile =
    process.env.PRISMA_SCHEMA_PATH ?? path.join(projectRoot, 'prisma', 'schema.prisma');

  console.log('Schema drift check');
  console.log(`  SQL schema:    ${storageSchemaDir}`);
  console.log(`  Prisma schema: ${prismaSchemaFile}`);
  console.log('');

  if (!fs.existsSync(storageSchemaDir)) {
    console.error(`Error: SQL schema dir not found: ${storageSchemaDir}`);
    console.error('Set STORAGE_SCHEMA_PATH env var or place daodao-storage as a sibling directory.');
    process.exit(1);
  }

  const sqlTables = parseSqlFiles(storageSchemaDir);
  const prismaTables = parsePrismaSchema(prismaSchemaFile);
  const ignore = loadIgnoreConfig(projectRoot);

  console.log(`SQL tables: ${sqlTables.size}  |  Prisma models: ${prismaTables.size}`);
  console.log('');

  const report = detectDrift(sqlTables, prismaTables, ignore);
  printReport(report);

  const hasIssues =
    report.missingInPrisma.length +
      report.missingInSql.length +
      report.columnsMissingInPrisma.length +
      report.columnsMissingInSql.length >
    0;

  if (hasIssues) process.exit(1);
}

main();
