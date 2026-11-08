/**
 * daodao#451 AC-04／AC-05：團隊通知信帶回報者身分、後台連結，非正式環境主旨有環境標記
 */
jest.mock('../database/prisma.service', () => ({ prisma: {} }));
jest.mock('../email/email.service', () => ({ emailService: { sendEmail: jest.fn() } }));
jest.mock('../r2.service', () => ({ uploadToR2: jest.fn() }));

import { buildNotificationEmail, environmentLabel } from '../feedback.service';

const base = {
  area: 'ui' as const,
  description: '按下送出後畫面沒有反應',
  link: '',
  referrer: 'https://app-dev.daodao.so/settings',
  userAgent: 'Mozilla/5.0',
  screenshotUrls: [],
  feedbackId: 42,
  reporter: { userId: 501, nickname: '小島', email: 'reporter@example.com' },
};

describe('buildNotificationEmail（daodao#451）', () => {
  it('AC-04：信中有回報者暱稱、帳號 email 與後台該則回報的連結', () => {
    const { html } = buildNotificationEmail({
      ...base,
      env: { NODE_ENV: 'prod', ADMIN_FRONTEND_URL: 'https://admin.daodao.so/' },
    });
    expect(html).toContain('小島');
    expect(html).toContain('reporter@example.com');
    expect(html).toContain('href="https://admin.daodao.so/admin/feedback?id=42"');
  });

  it('AC-04：暱稱含 HTML 時跳脫，不產生標籤', () => {
    const { html } = buildNotificationEmail({
      ...base,
      reporter: { ...base.reporter, nickname: '<img src=x onerror=alert(1)>' },
      env: { NODE_ENV: 'prod' },
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  it('ADMIN_FRONTEND_URL 未設時不放後台連結', () => {
    const { html } = buildNotificationEmail({ ...base, env: { NODE_ENV: 'prod' } });
    expect(html).not.toContain('/admin/feedback');
  });

  it('AC-05：dev 環境主旨標 [DEV]，正式站沒有標記', () => {
    expect(buildNotificationEmail({ ...base, env: { NODE_ENV: 'dev' } }).subject).toMatch(/^\[DEV\] \[Bug Report\]/);
    expect(buildNotificationEmail({ ...base, env: { NODE_ENV: 'prod', APP_ENV: 'prod' } }).subject).toMatch(/^\[Bug Report\]/);
  });

  it('AC-05：環境標記以 APP_ENV 為準，其次 NODE_ENV', () => {
    expect(environmentLabel({ APP_ENV: 'prod', NODE_ENV: 'development' })).toBeNull();
    expect(environmentLabel({ NODE_ENV: 'production' })).toBeNull();
    expect(environmentLabel({ APP_ENV: 'dev', NODE_ENV: 'prod' })).toBe('DEV');
    expect(environmentLabel({ NODE_ENV: 'development' })).toBe('DEV');
    expect(environmentLabel({ NODE_ENV: 'staging' })).toBe('STAGING');
  });
});
