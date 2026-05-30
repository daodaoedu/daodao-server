/**
 * 產生 057 migration SQL：修正歡迎信（預設版）body
 *   - welcome-template.ts 修正後才正確回傳 content 欄位
 *   - 052 跑時 r.content 為 undefined，導致 DB body 為空
 *
 * 使用方式：
 *   ts-node --transpile-only -r tsconfig-paths/register src/scripts/generate-057-sql.ts \
 *     > ../../daodao-storage/migrate/sql/057_fix_welcome_email_body.sql
 */

process.env.FRONTEND_URL = 'https://daodao.so';
process.env.EMAIL_ADDRESS = 'seed@daodao.so';
process.env.EMAIL_PASSWORD = 'seed-dummy';

import { generateWelcomeEmail } from '../services/email/welcome-template';

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function sqlArray(arr: string[]): string {
  return `ARRAY[${arr.map((v) => `'${v}'`).join(', ')}]`;
}

const r = generateWelcomeEmail({
  name: '{{name}}',
  referralGroup: 'default',
  practiceUrl: 'https://daodao.so/practices',
  unsubscribeUrl: 'https://daodao.so/unsubscribe',
});

const body = r.content ?? '';
const preheader = r.preheader ?? '';

console.log(`-- =====================================================`);
console.log(`-- Migration 057: 修正歡迎信（預設版）body`);
console.log(`--   welcome-template.ts 修正後正確回傳 content 欄位`);
console.log(`--   052 存的 body 為空，此 migration 補正`);
console.log(`-- =====================================================`);
console.log('');
console.log(`-- 歡迎信`);
console.log(`UPDATE "email_templates" SET`);
console.log(`  "slug"        = 'welcome-letter',`);
console.log(`  "subject"     = '${esc(r.subject)}',`);
console.log(`  "preheader"   = '${esc(preheader)}',`);
console.log(`  "body"        = '${esc(body)}',`);
console.log(`  "variables"   = ${sqlArray(['name', 'practiceUrl', 'unsubscribeUrl'])},`);
console.log(`  "data_source" = 'user'`);
console.log(`WHERE "name" = '歡迎信';`);
console.log('');
console.log('-- 完成');
