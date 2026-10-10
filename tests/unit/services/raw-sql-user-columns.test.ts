import * as fs from 'fs';
import * as path from 'path';

/**
 * Raw SQL 欄位守門（daodao#140 AC-4b 的 regression）：
 * 後台意見回饋列表寫了 `u.name`，但 users 表沒有 name（顯示名稱是 nickname），
 * 整支 API 500、typecheck 與既有測試都抓不到。這裡掃 src 下所有 template literal，
 * 只要 `FROM/JOIN users <alias>`、`FROM/JOIN contacts <alias>`，就檢查 `<alias>.<col>`
 * 是否為 prisma/schema.prisma 該 model 的真實欄位。
 */

const ROOT = path.resolve(__dirname, '../../..');
const SCALAR_TYPE = /^(String|Int|Float|Boolean|DateTime|BigInt|Decimal|Json|Bytes|Unsupported|[a-z][a-z0-9_]*_t)(\?|\[\])?(\(|$)/;

/** 尚未修正、已另行追蹤的既有問題；修掉後要從這裡移除 */
const KNOWN_UNRESOLVED = new Set<string>([
  // users 沒有 last_login_at：不活躍使用者觸發信查詢，範圍外（見 daodao#140 任務 Deferred items）
  'src/queues/email-trigger.worker.ts users.last_login_at',
]);

const modelColumns = (schema: string, model: string): Set<string> => {
  const body = schema.match(new RegExp(`^model ${model} \\{([\\s\\S]*?)^\\}`, 'm'))?.[1];
  if (!body) throw new Error(`prisma model ${model} not found`);
  const cols = body
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter(([name, type]) => name && type && !name.startsWith('//') && !name.startsWith('@@') && SCALAR_TYPE.test(type))
    .map(([name]) => name);
  return new Set(cols);
};

/** 抽出檔案中所有 template literal 的文字（`${...}` 以空白取代，巢狀 template 另外收集） */
const templateLiterals = (src: string): string[] => {
  const out: string[] = [];
  const readTemplate = (start: number): number => {
    let text = '';
    let i = start;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { text += src.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { out.push(text); return i + 1; }
      if (c === '$' && src[i + 1] === '{') {
        let depth = 1;
        i += 2;
        while (i < src.length && depth > 0) {
          if (src[i] === '`') { i = readTemplate(i + 1); continue; }
          if (src[i] === '{') depth++;
          if (src[i] === '}') depth--;
          i++;
        }
        text += ' ';
        continue;
      }
      text += c;
      i++;
    }
    out.push(text);
    return i;
  };

  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { const nl = src.indexOf('\n', i); if (nl < 0) break; i = nl; continue; }
    if (c === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); if (end < 0) break; i = end + 2; continue; }
    if (c === '\'' || c === '"') {
      i++;
      while (i < src.length && src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++;
      continue;
    }
    if (c === '`') { i = readTemplate(i + 1); continue; }
    i++;
  }
  return out;
};

const listTsFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listTsFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });

const SQL_KEYWORDS = new Set(['on', 'where', 'left', 'right', 'inner', 'join', 'group', 'order', 'limit', 'using', 'set']);

const findUnknownColumns = (tables: Record<string, Set<string>>): string[] => {
  const problems = new Set<string>();
  for (const file of listTsFiles(path.join(ROOT, 'src'))) {
    const rel = path.relative(ROOT, file);
    for (const sql of templateLiterals(fs.readFileSync(file, 'utf8'))) {
      for (const [table, columns] of Object.entries(tables)) {
        const aliasRe = new RegExp(`\\b(?:FROM|JOIN)\\s+"?(?:public\\.)?${table}"?\\s+(?:AS\\s+)?([a-z_][a-z0-9_]*)`, 'gi');
        for (const [, alias] of sql.matchAll(aliasRe)) {
          if (SQL_KEYWORDS.has(alias.toLowerCase())) continue;
          for (const [, col] of sql.matchAll(new RegExp(`\\b${alias}\\."?([A-Za-z_][A-Za-z0-9_]*)`, 'g'))) {
            if (!columns.has(col)) problems.add(`${rel} ${table}.${col}`);
          }
        }
      }
    }
  }
  return [...problems].sort();
};

describe('raw SQL 只引用真實存在的 users／contacts 欄位', () => {
  const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf8');
  const tables = { users: modelColumns(schema, 'users'), contacts: modelColumns(schema, 'contacts') };

  it('prisma model 解析得到預期欄位（守門器本身的健全性）', () => {
    expect(tables.users).toContain('nickname');
    expect(tables.users).toContain('contact_id');
    expect(tables.users).not.toContain('name');
    expect(tables.contacts).toContain('photo_url');
  });

  it('守門器抓得到 `JOIN users u ... u.name`', () => {
    const [sql] = templateLiterals('const q = Prisma.sql`SELECT u.name FROM feedback f LEFT JOIN users u ON f.user_id = u.id WHERE ${where}`');
    expect(sql).toContain('u.name');
    expect(sql).toContain('LEFT JOIN users u');
  });

  it('src 內沒有引用不存在的欄位', () => {
    const unknown = findUnknownColumns(tables).filter((p) => !KNOWN_UNRESOLVED.has(p));
    expect(unknown).toEqual([]);
  });

  it('KNOWN_UNRESOLVED 只留仍存在的問題（修掉就要移除）', () => {
    const found = new Set(findUnknownColumns(tables));
    expect([...KNOWN_UNRESOLVED].filter((p) => !found.has(p))).toEqual([]);
  });
});
