/**
 * 後台模板解析層（daodao#236）
 *
 * Regression：在此之前所有寄信路徑都直接呼叫程式碼模板，後台編輯與「停用寄送」
 * 對寄出的信完全沒有作用。
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const warnMock = jest.fn();
const errorMock = jest.fn();
const infoMock = jest.fn();
jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    warn: (...args: unknown[]) => warnMock(...args),
    error: (...args: unknown[]) => errorMock(...args),
    info: (...args: unknown[]) => infoMock(...args),
    debug: jest.fn(),
  },
}));

import {
  resolveTemplate,
  invalidateTemplateCache,
  isSkipped,
  TEMPLATE_CACHE_TTL_MS,
  type ResolvedTemplate,
  type TemplateDescriptor,
} from '@/services/email/template-resolver.service';
import { verificationDescriptor, welcomeLetterDescriptor } from '@/services/email/template-descriptors';
import { generateVerificationEmail } from '@/services/email/verification-template';
import { clearCompiledTemplateCache, collectTemplateKeys } from '@/services/email/template-render';

const templateRow = (overrides: Partial<{
  slug: string;
  subject: string;
  preheader: string | null;
  body: string;
  is_active: boolean;
}> = {}) => ({
  slug: 'auth-email-verify',
  subject: '【後台】{{name}} 請驗證信箱',
  preheader: '{{name}} 的驗證信',
  body: '<p>{{name}} 您好，請點 <a href="{{verifyLink}}">這裡</a></p>',
  is_active: true,
  ...overrides,
});

const verifyData = { name: '小島', verifyLink: 'https://dev.daodao.so/verify?token=abc' };

/** 只在型別上把 skipped 收窄掉，讓測試能直接讀 html／subject */
const expectResolved = (result: Awaited<ReturnType<typeof resolveTemplate>>): ResolvedTemplate => {
  if (isSkipped(result)) throw new Error('預期不是 skipped');
  return result;
};

describe('EmailTemplateResolver', () => {
  beforeEach(() => {
    invalidateTemplateCache();
    clearCompiledTemplateCache();
    warnMock.mockClear();
    errorMock.mockClear();
    infoMock.mockClear();
  });

  describe('DB 模板生效（AC-01）', () => {
    it('後台模板 active 且 body 非空時，用 DB 的 subject／body 並替換變數', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(templateRow() as never);

      const result = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      expect(result.source).toBe('database');
      expect(result.subject).toBe('【後台】小島 請驗證信箱');
      expect(result.html).toContain('小島 您好，請點');
      expect(result.html).toContain('https://dev.daodao.so/verify?token=abc');
      // DB body 是 inner fragment，仍要套上 base-template 的外殼
      expect(result.html).toContain('<!DOCTYPE html');
      expect(result.html).toContain('</body>');
    });

    it('依 referralGroup 讀對應的歡迎信 slug', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(null as never);

      await resolveTemplate(welcomeLetterDescriptor({ name: 'A', referralGroup: 'community' }), {
        name: 'A',
        referralGroup: 'community',
      });

      expect(prismaMock.email_templates.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'welcome-letter-community' } })
      );
    });

    it('變數值中的 HTML 會被跳脫，營運貼進特殊字元不會破版', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(templateRow() as never);

      const result = expectResolved(
        await resolveTemplate(verificationDescriptor, {
          ...verifyData,
          name: '<script>alert(1)</script>',
        })
      );

      expect(result.html).not.toContain('<script>alert(1)</script>');
      expect(result.html).toContain('&lt;script&gt;');
    });
  });

  describe('停用（AC-02）', () => {
    it('is_active = false 時回傳 skipped，不產生內容', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ is_active: false }) as never
      );

      const result = await resolveTemplate(verificationDescriptor, verifyData);

      expect(isSkipped(result)).toBe(true);
      expect(result).toEqual({ skipped: true, slug: 'auth-email-verify' });
    });
  });

  describe('fallback（AC-03）', () => {
    it('查無 slug 時逐字使用程式碼模板', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(null as never);

      const result = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));
      const code = generateVerificationEmail(verifyData);

      expect(result.source).toBe('code-fallback');
      expect(result.subject).toBe(code.subject);
      expect(result.html).toBe(code.html);
    });

    it('body 為空白時逐字使用程式碼模板', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ body: '   \n  ' }) as never
      );

      const result = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      expect(result.source).toBe('code-fallback');
      expect(result.html).toBe(generateVerificationEmail(verifyData).html);
    });

    it('DB 查詢失敗時不斷信，改走程式碼模板並記 error', async () => {
      prismaMock.email_templates.findUnique.mockRejectedValue(new Error('connection refused') as never);

      const result = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      expect(result.source).toBe('code-fallback');
      expect(result.html).toBe(generateVerificationEmail(verifyData).html);
      expect(errorMock).toHaveBeenCalled();
    });

    it('模板語法壞掉時不斷信，改走程式碼模板並記 error', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ body: '<p>{{#each}} 壞掉的語法' }) as never
      );

      const result = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      expect(result.source).toBe('code-fallback');
      expect(errorMock).toHaveBeenCalled();
    });
  });

  describe('變數替換（AC-04／AC-05）', () => {
    it('variables 列出的每個 key 都被替換，body 不留 {{', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({
          body: '<p>{{name}} / {{verifyLink}}</p>',
          subject: '{{name}}',
          preheader: '{{name}}',
        }) as never
      );

      const result = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      expect(result.html).not.toContain('{{');
    });

    it('未知變數保留原字串並記 warn，信照寄', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ body: '<p>{{name}} {{unknownVar}}</p>' }) as never
      );

      const result = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      expect(result.html).toContain('{{unknownVar}}');
      expect(result.html).toContain('小島');
      expect(warnMock).toHaveBeenCalledWith(
        '[email-template] 模板含未定義變數，已保留原字串',
        expect.objectContaining({ slug: 'auth-email-verify', unknownKeys: ['unknownVar'] })
      );
    });

    it('未提供值的可選變數渲染成空字串，不留 {{', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ body: '<p>{{name}}</p>' }) as never
      );

      const result = expectResolved(
        await resolveTemplate(verificationDescriptor, { verifyLink: 'https://x.test/v' })
      );

      expect(result.html).not.toContain('{{');
      expect(warnMock).not.toHaveBeenCalled();
    });
  });

  describe('快取（AC-06）', () => {
    it('TTL 內重複解析只查一次 DB', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(templateRow() as never);

      await resolveTemplate(verificationDescriptor, verifyData);
      await resolveTemplate(verificationDescriptor, verifyData);

      expect(prismaMock.email_templates.findUnique).toHaveBeenCalledTimes(1);
    });

    it('查無模板也會快取，不會每封信都打 DB', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(null as never);

      await resolveTemplate(verificationDescriptor, verifyData);
      await resolveTemplate(verificationDescriptor, verifyData);

      expect(prismaMock.email_templates.findUnique).toHaveBeenCalledTimes(1);
    });

    it('超過 5 分鐘 TTL 後重新查 DB，拿到後台的新內容', async () => {
      jest.useFakeTimers();
      try {
        prismaMock.email_templates.findUnique.mockResolvedValue(templateRow() as never);
        const first = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));
        expect(first.subject).toBe('【後台】小島 請驗證信箱');

        prismaMock.email_templates.findUnique.mockResolvedValue(
          templateRow({ subject: '【改過】{{name}}' }) as never
        );
        jest.advanceTimersByTime(TEMPLATE_CACHE_TTL_MS - 1000);
        const cached = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));
        expect(cached.subject).toBe('【後台】小島 請驗證信箱');

        jest.advanceTimersByTime(2000);
        const refreshed = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));
        expect(refreshed.subject).toBe('【改過】小島');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('主旨不做 HTML 跳脫', () => {
    it('暱稱含 & 與單引號時，主旨維持原字元（body 仍跳脫）', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ subject: '{{name}} 的驗證信', body: '<p>{{name}}</p>' }) as never
      );

      const result = expectResolved(
        await resolveTemplate(verificationDescriptor, { ...verifyData, name: "O'Neil & 小島" })
      );

      // 主旨是純文字信件標頭，跳脫後會變成 O&#x27;Neil &amp; 小島
      expect(result.subject).toBe("O'Neil & 小島 的驗證信");
      // body 進的是 HTML，仍要跳脫
      expect(result.html).toContain('O&#x27;Neil &amp; 小島');
    });

    it('主旨與 fallback 程式碼模板一致，不因有無 DB 模板而不同', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ subject: '【島島阿學】驗證您的電子郵件', body: '<p>x</p>' }) as never
      );
      const fromDb = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      invalidateTemplateCache();
      prismaMock.email_templates.findUnique.mockResolvedValue(null as never);
      const fromCode = expectResolved(await resolveTemplate(verificationDescriptor, verifyData));

      expect(fromDb.subject).toBe(fromCode.subject);
    });
  });

  describe('collectTemplateKeys', () => {
    it('只收簡單變數引用，不收 block 與帶參數的 helper', () => {
      const keys = collectTemplateKeys(
        '{{a}} {{b.c}} {{#each items}}{{this}}{{/each}} {{formatDate d "YYYY"}}'
      );

      expect(keys).toContain('a');
      expect(keys).toContain('b.c');
      expect(keys).not.toContain('items');
      expect(keys).not.toContain('d');
    });

    it('不把 block 內部的 scope 變數當成未定義變數', () => {
      const keys = collectTemplateKeys('{{#each items}}{{this}} {{item.name}}{{/each}}');

      expect(keys).not.toContain('this');
      expect(keys).not.toContain('item.name');
    });

    it('模板用 {{#each}} 時不會噴假的未定義變數 warn', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(
        templateRow({ body: '<p>{{name}}{{#each rows}}<span>{{this}}</span>{{/each}}</p>' }) as never
      );

      await resolveTemplate(verificationDescriptor, verifyData);

      expect(warnMock).not.toHaveBeenCalled();
    });
  });

  describe('descriptor 型別', () => {
    it('flatten 的 key 與 DB variables 欄位一致（auth-email-verify）', () => {
      const descriptor: TemplateDescriptor<typeof verifyData> = verificationDescriptor;
      expect(Object.keys(descriptor.flatten(verifyData)).sort()).toEqual(['name', 'verifyLink']);
    });
  });
});
