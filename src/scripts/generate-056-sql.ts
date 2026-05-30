/**
 * 產生 056 migration SQL：更新 4 小時通知摘要模板
 *   - p1Events 拆分為 partnerEvents / interactionEvents / activityEvents
 *   - 依社交學習價值排序呈現
 *
 * 使用方式：
 *   ts-node --transpile-only -r tsconfig-paths/register src/scripts/generate-056-sql.ts \
 *     > ../../daodao-storage/migrate/sql/056_update_digest_email_template.sql
 */

process.env.FRONTEND_URL = 'https://daodao.so';
process.env.EMAIL_ADDRESS = 'seed@daodao.so';
process.env.EMAIL_PASSWORD = 'seed-dummy';

import { generateNotificationDigestHtml } from '../services/email/notification-digest-template';
import type { NotificationDigestData } from '../services/email/notification-digest-template';

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function sqlArray(arr: string[]): string {
  return `ARRAY[${arr.map((v) => `'${v}'`).join(', ')}]`;
}

const sampleData: NotificationDigestData = {
  recipientName: '王小明',
  partnerEvents: [
    {
      type: 'PartnerCheckinActivity',
      actorName: '學習夥伴小華',
      entityTitle: '每日閱讀 30 分鐘',
      content: '今天讀完了第三章！',
      url: 'https://daodao.so/practices/1',
    },
  ],
  interactionEvents: [
    {
      type: 'Connect',
      actorName: '陳小華',
      entityTitle: undefined,
      content: undefined,
      connectMessage: '你好，希望可以互相交流！',
      url: 'https://daodao.so/users/chen',
    },
  ],
  activityEvents: [
    {
      type: 'PracticeCheckinActivity',
      actorName: '李大明',
      entityTitle: '設計個人化的追蹤頁面',
      content: '完成第一個 prototype！',
      url: 'https://daodao.so/practices/2',
    },
  ],
  p2Events: [
    { type: 'reaction', actorName: '李大明', count: 3, entityTitle: '設計個人化的追蹤頁面' },
  ],
  unsubscribeUrl: 'https://daodao.so/unsubscribe',
  settingsUrl: 'https://daodao.so/settings/notifications',
  homeUrl: 'https://daodao.so',
};

const html = generateNotificationDigestHtml(sampleData);
const variables = ['recipientName', 'partnerEvents', 'interactionEvents', 'activityEvents', 'p2Events', 'unsubscribeUrl', 'settingsUrl'];

console.log(`-- =====================================================`);
console.log(`-- Migration 056: 更新 4 小時通知摘要模板`);
console.log(`--   p1Events 拆分為 partnerEvents / interactionEvents / activityEvents`);
console.log(`-- =====================================================`);
console.log('');
console.log(`-- 4小時通知摘要`);
console.log(`UPDATE "email_templates" SET`);
console.log(`  "subject"     = '${esc('【島島阿學】{{recipientName}}，你有新的通知')}',`);
console.log(`  "preheader"   = '',`);
console.log(`  "body"        = '${esc(html)}',`);
console.log(`  "variables"   = ${sqlArray(variables)},`);
console.log(`  "data_source" = 'user'`);
console.log(`WHERE "name" = '4小時通知摘要';`);
console.log('');
console.log('-- 完成');
