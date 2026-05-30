/**
 * 產生 054 migration SQL：
 *   1. 更新入門任務 A–E 為正式 Onboarding Letter 文案
 *   2. 新增歡迎信社群媒體版與社群推薦版（DB 原本只有 default 版）
 *
 * 使用方式：
 *   ts-node --transpile-only -r tsconfig-paths/register src/scripts/generate-054-sql.ts \
 *     > ../../daodao-storage/migrate/sql/054_update_onboarding_email_templates.sql
 */

process.env.FRONTEND_URL = 'https://daodao.so';
process.env.EMAIL_ADDRESS = 'seed@daodao.so';
process.env.EMAIL_PASSWORD = 'seed-dummy';

import {
  generateOnboardingAEmail,
  generateOnboardingBEmail,
  generateOnboardingCEmail,
  generateOnboardingDEmail,
  generateOnboardingEEmail,
} from '../services/email/onboarding-template';
import { generateWelcomeEmail } from '../services/email/welcome-template';

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function sqlArray(arr: string[]): string {
  return `ARRAY[${arr.map((v) => `'${v}'`).join(', ')}]`;
}

const SAMPLE = '小明';
const PRACTICE_URL = 'https://daodao.so/practices';
const UNSUBSCRIBE_URL = 'https://daodao.so/unsubscribe';

// ── A–E 更新 ──────────────────────────────────────────────────────────────────

const updates = [
  { name: '入門任務 A', slug: 'onboarding-a', r: generateOnboardingAEmail({ name: SAMPLE }) },
  { name: '入門任務 B', slug: 'onboarding-b', r: generateOnboardingBEmail({ name: SAMPLE }) },
  { name: '入門任務 C', slug: 'onboarding-c', r: generateOnboardingCEmail({ name: SAMPLE }) },
  { name: '入門任務 D', slug: 'onboarding-d', r: generateOnboardingDEmail({ name: SAMPLE }) },
  { name: '入門任務 E', slug: 'onboarding-e', r: generateOnboardingEEmail({ name: SAMPLE }) },
];

// ── 歡迎信三版本（INSERT，已有同名則更新）────────────────────────────────────

const welcomeVariants = [
  {
    name: '歡迎信（社群媒體來源）',
    slug: 'welcome-letter-social',
    referralGroup: 'social-media' as const,
  },
  {
    name: '歡迎信（社群推薦來源）',
    slug: 'welcome-letter-community',
    referralGroup: 'community' as const,
  },
];

const welcomeInserts = welcomeVariants.map(({ name, slug, referralGroup }) => {
  const r = generateWelcomeEmail({ name: SAMPLE, referralGroup, practiceUrl: PRACTICE_URL, unsubscribeUrl: UNSUBSCRIBE_URL });
  return { name, slug, r };
});

// ── 輸出 ──────────────────────────────────────────────────────────────────────

console.log(`-- =====================================================`);
console.log(`-- Migration 054`);
console.log(`--   1. 入門任務 A–E 正式文案（Onboarding Letter.md）`);
console.log(`--   2. 新增歡迎信社群媒體版 / 社群推薦版`);
console.log(`-- =====================================================`);
console.log('');

console.log('-- ── 入門任務 A–E ────────────────────────────────────');
console.log('');
for (const { name, slug, r } of updates) {
  const body = r.content ?? '';
  const preheader = r.preheader ?? '';
  console.log(`-- ${name}`);
  console.log(`UPDATE "email_templates" SET`);
  console.log(`  "slug"        = '${esc(slug)}',`);
  console.log(`  "subject"     = '${esc(r.subject)}',`);
  console.log(`  "preheader"   = '${esc(preheader)}',`);
  console.log(`  "body"        = '${esc(body)}',`);
  console.log(`  "variables"   = ${sqlArray(['name'])},`);
  console.log(`  "data_source" = 'user'`);
  console.log(`WHERE "name" = '${esc(name)}';`);
  console.log('');
}

console.log('-- ── 歡迎信三版本（新增社群媒體 / 社群推薦）──────────');
console.log('');
for (const { name, slug, r } of welcomeInserts) {
  const body = r.content ?? '';
  const preheader = r.preheader ?? '';
  console.log(`-- ${name}`);
  console.log(`INSERT INTO "email_templates" ("name", "slug", "subject", "preheader", "body", "variables", "data_source", "is_active")`);
  console.log(`VALUES (`);
  console.log(`  '${esc(name)}',`);
  console.log(`  '${esc(slug)}',`);
  console.log(`  '${esc(r.subject)}',`);
  console.log(`  '${esc(preheader)}',`);
  console.log(`  '${esc(body)}',`);
  console.log(`  ${sqlArray(['name', 'practiceUrl', 'unsubscribeUrl'])},`);
  console.log(`  'user',`);
  console.log(`  true`);
  console.log(`)`);
  console.log(`ON CONFLICT ("slug") DO UPDATE SET`);
  console.log(`  "subject"     = EXCLUDED."subject",`);
  console.log(`  "preheader"   = EXCLUDED."preheader",`);
  console.log(`  "body"        = EXCLUDED."body",`);
  console.log(`  "variables"   = EXCLUDED."variables";`);
  console.log('');
}

console.log('-- 完成');
