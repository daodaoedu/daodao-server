/**
 * emailService 與後台模板解析層的接線（daodao#236 review 後補的 regression）
 *
 * 三個曾經漏掉的點：
 * 1. 批量寄送（/api/v1/email/bulk）原本直接叫程式碼模板，繞過後台的編輯與停用
 * 2. 歡迎信的 pending log 存的是寫死的主旨，後台改過主旨時紀錄與實際寄出的信不一致
 * 3. DB 查詢失敗沒有快取，批次寄送時每位收件人都會重打一次失敗查詢
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'mock', accepted: [], rejected: [] });
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: () => ({ sendMail: sendMailMock, verify: jest.fn(), close: jest.fn() }) },
  createTransport: () => ({ sendMail: sendMailMock, verify: jest.fn(), close: jest.fn() }),
}));

const createEmailLogMock = jest.fn().mockResolvedValue({ id: 11, tracking_token: 'tok' });
const recordSkippedEmailMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/email/email-log.service', () => ({
  createEmailLog: (...args: unknown[]) => createEmailLogMock(...args),
  hasEmailBeenSent: jest.fn().mockResolvedValue(false),
  recordEmailOpen: jest.fn(),
  recordSkippedEmail: (...args: unknown[]) => recordSkippedEmailMock(...args),
  resolveUserIdByEmail: jest.fn().mockResolvedValue(42),
  updateEmailLogStatus: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/queues/email.queue', () => ({
  enqueueEmail: jest.fn().mockResolvedValue(null), // queue 未初始化 → 走同步直送
}));

import { emailService } from '@/services/email/email.service';
import {
  invalidateTemplateCache,
  TEMPLATE_ERROR_CACHE_TTL_MS,
} from '@/services/email/template-resolver.service';
import { clearCompiledTemplateCache } from '@/services/email/template-render';

const welcomeRow = (isActive: boolean) => ({
  slug: 'welcome-letter',
  subject: '【後台】{{name}} 歡迎你',
  preheader: '歡迎',
  body: '<p>{{name}} 你好</p>',
  is_active: isActive,
});

describe('emailService × 後台模板', () => {
  beforeEach(() => {
    invalidateTemplateCache();
    clearCompiledTemplateCache();
    sendMailMock.mockClear();
    createEmailLogMock.mockClear();
    recordSkippedEmailMock.mockClear();
  });

  describe('批量寄送', () => {
    it('後台停用該類型時，批量寄送也不寄出並計為 skipped', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(welcomeRow(false) as never);

      const result = await emailService.sendBulkEmail(
        [
          { email: 'a@daodao.test', data: { name: 'A' } },
          { email: 'b@daodao.test', data: { name: 'B' } },
        ],
        'welcome'
      );

      expect(sendMailMock).not.toHaveBeenCalled();
      expect(result.success).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.results.every(r => r.skipped)).toBe(true);
    });

    it('後台模板 active 時，批量寄送用 DB 內容', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(welcomeRow(true) as never);

      const result = await emailService.sendBulkEmail(
        [{ email: 'a@daodao.test', data: { name: '小島' } }],
        'welcome'
      );

      expect(result.success).toBe(1);
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mail = sendMailMock.mock.calls[0][0];
      expect(mail.subject).toBe('【後台】小島 歡迎你');
      expect(mail.html).toContain('小島 你好');
    });
  });

  describe('歡迎信紀錄', () => {
    it('pending log 用解析後的主旨，與實際寄出的信一致', async () => {
      prismaMock.email_templates.findUnique.mockResolvedValue(welcomeRow(true) as never);

      await emailService.sendWelcomeEmailWithLog('c@daodao.test', { name: '小島', userId: 42 });

      expect(createEmailLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ subject: '【後台】小島 歡迎你', status: 'pending' })
      );
      expect(sendMailMock.mock.calls[0][0].subject).toBe('【後台】小島 歡迎你');
    });
  });

  describe('DB 查詢失敗', () => {
    it('失敗結果會短暫快取，批次寄送不會每封都重打一次失敗查詢', async () => {
      jest.useFakeTimers();
      try {
        prismaMock.email_templates.findUnique.mockRejectedValue(new Error('db down') as never);

        await emailService.sendWelcomeEmail('d@daodao.test', { name: 'D' });
        await emailService.sendWelcomeEmail('e@daodao.test', { name: 'E' });
        expect(prismaMock.email_templates.findUnique).toHaveBeenCalledTimes(1);

        // 失敗快取比正常 TTL 短很多，DB 恢復後很快會重新讀後台模板
        jest.advanceTimersByTime(TEMPLATE_ERROR_CACHE_TTL_MS + 1000);
        await emailService.sendWelcomeEmail('f@daodao.test', { name: 'F' });
        expect(prismaMock.email_templates.findUnique).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
