/**
 * 產生 055 migration SQL：更新每週通知摘要模板
 *   - 實踐進度改為三種狀態（not_started / in_progress / completed）
 *   - 新增「學習夥伴動態」區塊（partnerActivities）
 *   - 新增「本週熱門主題實踐」區塊（popularPractices）
 *
 * 使用方式：
 *   ts-node --transpile-only -r tsconfig-paths/register src/scripts/generate-055-sql.ts \
 *     > ../../daodao-storage/migrate/sql/055_update_weekly_email_template.sql
 */

process.env.FRONTEND_URL = 'https://daodao.so';
process.env.EMAIL_ADDRESS = 'seed@daodao.so';
process.env.EMAIL_PASSWORD = 'seed-dummy';

import { generateWeeklyDigestHtml } from '../services/email/notification-weekly-template';
import type { WeeklyDigestData } from '../services/email/notification-weekly-template';

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function sqlArray(arr: string[]): string {
  return `ARRAY[${arr.map((v) => `'${v}'`).join(', ')}]`;
}

const sampleData: WeeklyDigestData = {
  recipientName: '王小明',
  weekStart: '5/26',
  weekEnd: '6/1',
  stats: { reactions: 5, comments: 3, newFollowers: 2, connectRequests: 1 },
  practiceProgress: [
    { title: '設計個人化的追蹤頁面', checkInCount: 3, status: 'in_progress' },
    { title: '學習 TypeScript 基礎', checkInCount: 7, status: 'completed' },
    { title: '每日冥想練習', checkInCount: 0, status: 'not_started' },
  ],
  partnerActivities: [
    { name: '學習夥伴小華', practiceTitle: '每日閱讀 30 分鐘', url: 'https://daodao.so/practices/3' },
    { name: '阿明', practiceTitle: '7 天 AI 工具探索', url: 'https://daodao.so/practices/4' },
  ],
  popularPractices: [
    { title: '7 天 AI 工具探索', url: 'https://daodao.so/practices/1' },
    { title: '每日閱讀 30 分鐘', url: 'https://daodao.so/practices/2' },
  ],
  unsubscribeUrl: 'https://daodao.so/unsubscribe',
  settingsUrl: 'https://daodao.so/settings/notifications',
};

const html = generateWeeklyDigestHtml(sampleData);
const variables = ['recipientName', 'weekStart', 'weekEnd', 'stats', 'practiceProgress', 'partnerActivities', 'popularPractices', 'unsubscribeUrl', 'settingsUrl'];

console.log(`-- =====================================================`);
console.log(`-- Migration 055: 更新每週通知摘要模板`);
console.log(`--   - 實踐進度三種狀態（not_started / in_progress / completed）`);
console.log(`--   - 新增「本週熱門主題實踐」區塊`);
console.log(`-- =====================================================`);
console.log('');
console.log(`-- 每週通知摘要`);
console.log(`UPDATE "email_templates" SET`);
console.log(`  "subject"     = '${esc('【島島阿學】{{recipientName}} 的本週學習週報（{{weekStart}}～{{weekEnd}}）')}',`);
console.log(`  "preheader"   = '',`);
console.log(`  "body"        = '${esc(html)}',`);
console.log(`  "variables"   = ${sqlArray(variables)},`);
console.log(`  "data_source" = 'user'`);
console.log(`WHERE "name" = '每週通知摘要';`);
console.log('');
console.log('-- 完成');
