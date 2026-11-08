/**
 * daodao#166 code review（Codex P1）：錯誤回報通知信把使用者輸入直接插進 HTML，
 * 路由掛載後成為對 contact@daodao.so 的 HTML injection 路徑。所有使用者可控欄位都必須跳脫，
 * 連結只以純文字呈現（不產生可點的 <a>）。
 */
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const mockSendEmail = jest.fn();
jest.mock('@/services/email/email.service', () => ({
  emailService: { sendEmail: (...args: unknown[]) => mockSendEmail(...args) },
}));

const mockUploadToR2 = jest.fn();
jest.mock('@/services/r2.service', () => ({
  uploadToR2: (...args: unknown[]) => mockUploadToR2(...args),
}));

import { submitBugReport } from '@/services/feedback.service';

const flush = () => new Promise((resolve) => setImmediate(resolve));

/** 唯一允許的 <a> 是 server 用 ADMIN_FRONTEND_URL + 數字 id 組的後台連結（daodao#451 AC-04），其他都不得出現 */
const withoutAdminLink = (html: string): string =>
  html.replace(/<a href="[^"]*\/admin\/feedback\?id=\d+">[^<]*<\/a>/, '');

describe('feedback.service submitBugReport — notification email', () => {
  beforeEach(() => {
    mockSendEmail.mockReset().mockResolvedValue({ success: true });
    mockUploadToR2.mockReset().mockResolvedValue('ok');
    (prismaMock.$queryRaw as jest.Mock).mockResolvedValue([{ id: 42 }]);
  });

  it('escapes every user-controlled field and renders the link as text only', async () => {
    const result = await submitBugReport({
      userId: 7,
      area: 'ui',
      description: '<a href="https://evil">x</a><script>alert(1)</script>\n第二行',
      link: 'https://evil.example/"><img src=x onerror=alert(1)>',
      referrer: '"><script>ref()</script>',
      userAgent: '<b>ua</b>',
    });
    await flush();

    expect(result).toEqual({ id: 42 });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const { html: rawHtml, subject } = mockSendEmail.mock.calls[0][0] as { html: string; subject: string };
    const html = withoutAdminLink(rawHtml);

    // 不允許任何使用者帶進來的標籤或屬性存活
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<a\s/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<b>ua/);
    expect(html).not.toContain('href="https://evil"');

    // 以跳脫後的純文字呈現
    expect(html).toContain(
      '&lt;a href=&quot;https://evil&quot;&gt;x&lt;/a&gt;&lt;script&gt;alert(1)&lt;/script&gt;<br>第二行'
    );
    expect(html).toContain('https://evil.example/&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&quot;&gt;&lt;script&gt;ref()&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;ua&lt;/b&gt;');

    // 主旨是純文字 header：不得夾帶換行
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it('screenshot URLs are rendered as escaped text', async () => {
    process.env.R2_PUBLIC_URL = 'https://image.example';
    await submitBugReport({
      userId: 7,
      area: 'other',
      description: 'x',
      screenshots: [{ originalname: 'a.png"><script>.png' } as Express.Multer.File],
    });
    await flush();

    const html = withoutAdminLink((mockSendEmail.mock.calls[0][0] as { html: string }).html);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<a\s/i);
    expect(html).toContain('https://image.example/bug-reports/');
  });
});
