/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 產生 email_templates 更新 SQL
 *
 * 呼叫 daodao-server 中的真實 template 函式（帶 {{variable}} 佔位符），
 * 輸出可直接執行的 SQL UPDATE 語句，存到 daodao-storage 的 migrate/sql/。
 *
 * 使用方式：
 *   ts-node --transpile-only -r tsconfig-paths/register src/scripts/generate-email-template-sql.ts \
 *     > ../../daodao-storage/migrate/sql/052_update_email_templates_real_html.sql
 */

// 必須在 import 之前設定，部分 template 函式直接讀取這些環境變數
process.env.FRONTEND_URL = 'https://daodao.so';
// email.config.ts 需要這些才不報錯（seed script 只生成 HTML，不實際發信）
process.env.EMAIL_ADDRESS = 'seed@daodao.so';
process.env.EMAIL_PASSWORD = 'seed-dummy';

import {
  generatePracticeCreatedEmailContent,
  generateFirstCheckInEmailContent,
  generateWeeklySummaryEmailContent,
  generateFinalSummaryEmailContent,
} from '../services/email/practice-email.service';
import { generateVerificationEmail } from '../services/email/verification-template';
import { generatePasswordResetEmail } from '../services/email/password-reset-template';
import { generateWelcomeEmail } from '../services/email/welcome-template';
import { generateMarathonEmail } from '../services/email/marathon-template';
import { generateReactionNotificationEmail } from '../services/email/reaction-notification-template';
import { generateWishLinkedEmail } from '../services/email/wish-linked-template';
import { generateWeeklyDigestHtml } from '../services/email/notification-weekly-template';
import { generateNotificationDigestHtml } from '../services/email/notification-digest-template';

// ── 輔助函式 ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function sqlArray(arr: string[]): string {
  return `ARRAY[${arr.map((v) => `'${v}'`).join(', ')}]`;
}

interface TemplateSeed {
  name: string;
  slug: string;
  subject: string;
  preheader: string;
  body: string;
  variables: string[];
  dataSource: string;
}

// ── 呼叫真實 template 函式 ────────────────────────────────────────────────────

const seeds: TemplateSeed[] = [];

// PE01 - 實踐建立確認
{
  const r = generatePracticeCreatedEmailContent({
    code: 'PE01',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    startDate: '{{startDate}}',
    endDate: '{{endDate}}',
    durationDays: '{{durationDays}}' as any,
    frequencyMinDays: '{{frequencyMinDays}}' as any,
    frequencyMaxDays: '{{frequencyMaxDays}}' as any,
    targetCheckIns: '{{targetCheckIns}}' as any,
    action: '{{action}}',
  } as any);
  seeds.push({
    name: 'PE01 實踐建立確認',
    slug: 'practice-created',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceId', 'practiceUrl', 'startDate', 'endDate', 'durationDays', 'frequencyMinDays', 'frequencyMaxDays', 'targetCheckIns', 'action'],
    dataSource: 'practice',
  });
}

// PE02 - 第一次打卡鼓勵
{
  const r = generateFirstCheckInEmailContent({
    code: 'PE02',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    checkInDate: '{{checkInDate}}',
    progressPercentage: '{{progressPercentage}}' as any,
    encouragement: '{{encouragement}}',
  } as any);
  seeds.push({
    name: 'PE02 第一次打卡鼓勵',
    slug: 'practice-first-checkin',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceUrl'],
    dataSource: 'practice',
  });
}

// PE03 - 每週回顧（有打卡有文字）
{
  const r = generateWeeklySummaryEmailContent('PE03', {
    code: 'PE03',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    weeklyCount: '{{weeklyCount}}' as any,
    totalCount: '{{totalCount}}' as any,
    weeklyNoteSnippet: '{{weeklyNoteSnippet}}',
    progressPercentage: '{{progressPercentage}}' as any,
  } as any);
  seeds.push({
    name: 'PE03 每週回顧（有筆記）',
    slug: 'practice-weekly-pe03',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceUrl', 'weeklyCount', 'totalCount', 'weeklyNoteSnippet'],
    dataSource: 'practice',
  });
}

// PE04 - 每週回顧（有打卡無文字）
{
  const r = generateWeeklySummaryEmailContent('PE04', {
    code: 'PE04',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    weeklyCount: '{{weeklyCount}}' as any,
    totalCount: '{{totalCount}}' as any,
    progressPercentage: '{{progressPercentage}}' as any,
  } as any);
  seeds.push({
    name: 'PE04 每週回顧（無筆記）',
    slug: 'practice-weekly-pe04',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceUrl', 'weeklyCount', 'totalCount'],
    dataSource: 'practice',
  });
}

// PE05 - 每週回顧（從未打卡）
{
  const r = generateWeeklySummaryEmailContent('PE05', {
    code: 'PE05',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    weeklyCount: 0,
    totalCount: 0,
    progressPercentage: 20,
  } as any);
  seeds.push({
    name: 'PE05 每週回顧（未打卡）',
    slug: 'practice-weekly-pe05',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceUrl'],
    dataSource: 'practice',
  });
}

// PE06 - 每週回顧（本週無打卡但有累積）
{
  const r = generateWeeklySummaryEmailContent('PE06', {
    code: 'PE06',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    weeklyCount: 0,
    totalCount: '{{totalCount}}' as any,
    progressPercentage: '{{progressPercentage}}' as any,
  } as any);
  seeds.push({
    name: 'PE06 實踐沉睡喚醒',
    slug: 'practice-weekly-pe06',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceUrl', 'totalCount'],
    dataSource: 'practice',
  });
}

// PE07 - 最終總結（有打卡）
{
  const r = generateFinalSummaryEmailContent('PE07', {
    code: 'PE07',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    durationDays: '{{durationDays}}' as any,
    totalCheckIns: '{{totalCheckIns}}' as any,
    targetCheckIns: '{{targetCheckIns}}' as any,
    progressPercentage: '{{progressPercentage}}' as any,
    bestNoteSnippet: '{{bestNoteSnippet}}',
    bestNoteDate: '{{bestNoteDate}}',
  } as any);
  seeds.push({
    name: 'PE07 最終總結（有打卡）',
    slug: 'practice-final-pe07',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceId', 'practiceUrl', 'durationDays', 'totalCheckIns', 'targetCheckIns', 'bestNoteSnippet', 'bestNoteDate'],
    dataSource: 'practice',
  });
}

// PE08 - 最終總結（無打卡）
{
  const r = generateFinalSummaryEmailContent('PE08', {
    code: 'PE08',
    userName: '{{userName}}',
    userEmail: '{{userEmail}}',
    practiceTitle: '{{practiceTitle}}',
    practiceId: '{{practiceId}}',
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    durationDays: '{{durationDays}}' as any,
    totalCheckIns: 0,
    targetCheckIns: '{{targetCheckIns}}' as any,
    progressPercentage: 0,
  } as any);
  seeds.push({
    name: 'PE08 最終總結（無打卡）',
    slug: 'practice-final-pe08',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['userName', 'practiceTitle', 'practiceId', 'practiceUrl', 'durationDays', 'targetCheckIns'],
    dataSource: 'practice',
  });
}

// 信箱驗證
{
  const r = generateVerificationEmail({
    name: '{{name}}',
    verifyLink: 'https://daodao.so/verify?token={{verifyToken}}',
  } as any);
  seeds.push({
    name: '信箱驗證',
    slug: 'auth-email-verify',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['name', 'verifyLink'],
    dataSource: 'user',
  });
}

// 密碼重設
{
  const r = generatePasswordResetEmail({
    name: '{{name}}',
    resetLink: 'https://daodao.so/reset-password?token={{resetToken}}',
  } as any);
  seeds.push({
    name: '密碼重設',
    slug: 'auth-password-reset',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['name', 'resetLink'],
    dataSource: 'user',
  });
}

// 歡迎信（default 版本）
{
  const r = generateWelcomeEmail({
    name: '{{name}}',
    referralGroup: 'default',
    practiceUrl: 'https://daodao.so/practices',
    unsubscribeUrl: 'https://daodao.so/unsubscribe',
  });
  seeds.push({
    name: '歡迎信',
    slug: 'welcome-letter',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['name', 'practiceUrl', 'unsubscribeUrl'],
    dataSource: 'user',
  });
}

// 馬拉松報名確認
{
  const r = generateMarathonEmail({
    name: '{{name}}',
    marathonTitle: '{{marathonTitle}}',
    marathonDate: '{{marathonDate}}',
    marathonDescription: '{{marathonDescription}}',
  } as any);
  seeds.push({
    name: '馬拉松報名確認',
    slug: 'marathon-registration',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['name', 'marathonTitle', 'marathonDate', 'marathonDescription'],
    dataSource: 'none',
  });
}

// 共鳴通知
{
  const r = generateReactionNotificationEmail({
    recipientName: '{{recipientName}}',
    practiceTitle: '{{practiceTitle}}',
    reactionCount: '{{reactionCount}}' as any,
    practiceUrl: 'https://daodao.so/practices/{{practiceId}}',
    unsubscribeUrl: 'https://daodao.so/unsubscribe',
  });
  seeds.push({
    name: '共鳴通知',
    slug: 'reaction-notification',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['recipientName', 'practiceTitle', 'reactionCount', 'practiceUrl'],
    dataSource: 'none',
  });
}

// 許願採納通知
{
  const r = generateWishLinkedEmail({
    recipientName: '{{recipientName}}',
    itemTitle: '{{itemTitle}}',
    url: 'https://daodao.so/roadmap/{{itemId}}',
    unsubscribeUrl: 'https://daodao.so/unsubscribe',
  } as any);
  seeds.push({
    name: '許願採納通知',
    slug: 'wish-linked',
    subject: r.subject,
    preheader: r.preheader ?? '',
    body: r.content ?? '',
    variables: ['recipientName', 'itemTitle', 'url'],
    dataSource: 'none',
  });
}

// 每週通知摘要（複雜 array 資料，用 sample data 存完整 HTML）
{
  const sampleData = {
    recipientName: '王小明',
    weekStart: '5/26',
    weekEnd: '6/1',
    stats: { reactions: 5, comments: 3, newFollowers: 2, connectRequests: 1 },
    practiceProgress: [
      { title: '設計個人化的追蹤頁面', checkInCount: 3, status: 'in_progress' as const },
      { title: '學習 TypeScript 基礎', checkInCount: 7, status: 'completed' as const },
      { title: '每日冥想練習', checkInCount: 0, status: 'not_started' as const },
    ],
    popularPractices: [
      { title: '7 天 AI 工具探索', url: 'https://daodao.so/practices/1' },
      { title: '每日閱讀 30 分鐘', url: 'https://daodao.so/practices/2' },
    ],
    unsubscribeUrl: 'https://daodao.so/unsubscribe',
    settingsUrl: 'https://daodao.so/settings/notifications',
  };
  seeds.push({
    name: '每週通知摘要',
    slug: 'notification-weekly',
    subject: '【島島阿學】{{recipientName}} 的本週學習週報（{{weekStart}}～{{weekEnd}}）',
    preheader: '',
    body: generateWeeklyDigestHtml(sampleData),
    variables: ['recipientName', 'weekStart', 'weekEnd'],
    dataSource: 'user',
  });
}

// 4小時通知摘要（複雜 array 資料，用 sample data 存完整 HTML）
{
  const sampleData = {
    recipientName: '王小明',
    partnerEvents: [
      {
        type: 'PartnerCheckinActivity',
        actorName: '林小玲',
        entityTitle: '每天閱讀 30 分鐘',
        content: undefined,
        connectMessage: undefined,
        url: 'https://daodao.so/practices/abc',
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
        actorName: '張大同',
        entityTitle: '寫一段 200 字的場景描寫',
        content: undefined,
        connectMessage: undefined,
        url: 'https://daodao.so/practices/xyz',
      },
    ],
    p2Events: [
      { type: 'reaction', actorName: '李大明', count: 3, entityTitle: '設計個人化的追蹤頁面' },
    ],
    unsubscribeUrl: 'https://daodao.so/unsubscribe',
    settingsUrl: 'https://daodao.so/settings/notifications',
    homeUrl: 'https://daodao.so',
  };
  seeds.push({
    name: '4小時通知摘要',
    slug: 'notification-digest',
    subject: '【島島阿學】{{recipientName}}，你有新的通知',
    preheader: '',
    body: generateNotificationDigestHtml(sampleData),
    variables: ['recipientName'],
    dataSource: 'user',
  });
}

// ── 輸出 SQL ─────────────────────────────────────────────────────────────────

console.log(`-- =====================================================`);
console.log(`-- Migration 052: 更新信件模板為 server 真實 HTML`);
console.log(`-- =====================================================`);
console.log(`-- 由 daodao-server/src/scripts/generate-email-template-sql.ts 產生`);
console.log(`-- 使用 {{variable}} 佔位符，與 admin UI email editor 相容`);
console.log(`-- =====================================================`);
console.log('');

for (const tpl of seeds) {
  console.log(`-- ${tpl.name}`);
  console.log(`UPDATE "email_templates" SET`);
  console.log(`  "slug"        = '${esc(tpl.slug)}',`);
  console.log(`  "subject"     = '${esc(tpl.subject)}',`);
  console.log(`  "preheader"   = '${esc(tpl.preheader)}',`);
  console.log(`  "body"        = '${esc(tpl.body)}',`);
  console.log(`  "variables"   = ${sqlArray(tpl.variables)},`);
  console.log(`  "data_source" = '${tpl.dataSource}'`);
  console.log(`WHERE "name" = '${esc(tpl.name)}';`);
  console.log('');
}

console.log('-- 完成');
