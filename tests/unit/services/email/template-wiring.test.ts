/**
 * 寄信路徑接上後台模板（daodao#236）
 *
 * Regression：在此之前 PE01 與驗證信都直接呼叫程式碼模板，後台「停用寄送」對它們沒有作用，
 * 後台改過的 body 也不會出現在寄出的信裡。
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/services/email/email.service', () => ({
  emailService: { sendEmail: sendEmailMock },
}));

const hasEmailBeenSentMock = jest.fn().mockResolvedValue(false);
const createEmailLogMock = jest.fn().mockResolvedValue({ id: 1, tracking_token: 'tok' });
const updateEmailLogStatusMock = jest.fn().mockResolvedValue(undefined);
const recordSkippedEmailMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/email/email-log.service', () => ({
  hasEmailBeenSent: (...args: unknown[]) => hasEmailBeenSentMock(...args),
  createEmailLog: (...args: unknown[]) => createEmailLogMock(...args),
  updateEmailLogStatus: (...args: unknown[]) => updateEmailLogStatusMock(...args),
  recordSkippedEmail: (...args: unknown[]) => recordSkippedEmailMock(...args),
  getEntityEmailLogs: jest.fn().mockResolvedValue([]),
  resolveUserIdByEmail: jest.fn().mockResolvedValue(null),
}));

import { sendPracticeCreatedEmail } from '@/services/email/practice-email.service';
import { invalidateTemplateCache } from '@/services/email/template-resolver.service';
import { clearCompiledTemplateCache } from '@/services/email/template-render';
import { EMAIL_STATUS } from '@/types/email';

const practiceRow = {
  id: 10,
  external_id: 'practice-uuid',
  title: '每天寫三行',
  start_date: new Date('2026-09-01T00:00:00.000Z'),
  duration_days: 30,
  frequency_min_days: 1,
  frequency_max_days: 7,
  practice_action: '書寫',
};

const userRow = { id: 7, nickname: '小島', contacts: { email: 'learner@daodao.test' } };

const dbTemplate = (overrides = {}) => ({
  slug: 'practice-created',
  subject: '【後台】{{practiceTitle}} 建立完成',
  preheader: '{{userName}} 的新實踐',
  body: '<p>{{userName}}，你建立了 {{practiceTitle}}，<a href="{{practiceUrl}}">看看</a></p>',
  is_active: true,
  ...overrides,
});

describe('PE01 寄送路徑接上後台模板', () => {
  beforeEach(() => {
    invalidateTemplateCache();
    clearCompiledTemplateCache();
    sendEmailMock.mockClear();
    createEmailLogMock.mockClear();
    updateEmailLogStatusMock.mockClear();
    recordSkippedEmailMock.mockClear();
    hasEmailBeenSentMock.mockResolvedValue(false);
    prismaMock.practices.findUnique.mockResolvedValue(practiceRow as never);
    prismaMock.users.findUnique.mockResolvedValue(userRow as never);
  });

  it('後台模板 active 時，寄出的信用 DB 的主旨與內容（AC-01）', async () => {
    prismaMock.email_templates.findUnique.mockResolvedValue(dbTemplate() as never);

    await sendPracticeCreatedEmail(10, 7);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const sent = sendEmailMock.mock.calls[0][0];
    expect(sent.to).toBe('learner@daodao.test');
    expect(sent.subject).toBe('【後台】每天寫三行 建立完成');
    expect(sent.html).toContain('小島，你建立了 每天寫三行');
    expect(sent.html).not.toContain('{{');
    expect(updateEmailLogStatusMock).toHaveBeenCalledWith(1, EMAIL_STATUS.SENT);
  });

  it('後台停用時不寄出，並記一筆 skipped（AC-02）', async () => {
    prismaMock.email_templates.findUnique.mockResolvedValue(
      dbTemplate({ is_active: false }) as never
    );

    await sendPracticeCreatedEmail(10, 7);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(createEmailLogMock).not.toHaveBeenCalled();
    expect(recordSkippedEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        emailType: 'practice_created',
        entityType: 'practice',
        entityId: 10,
        emailCode: 'PE01',
        // 記後台當下的主旨，而不是程式碼裡寫死的預設值
        subject: '【後台】每天寫三行 建立完成',
      })
    );
  });

  it('查無後台模板時照舊用程式碼模板寄出（AC-03）', async () => {
    prismaMock.email_templates.findUnique.mockResolvedValue(null as never);

    await sendPracticeCreatedEmail(10, 7);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const sent = sendEmailMock.mock.calls[0][0];
    expect(sent.subject).toBe('開啟你的小而美學習生活提案');
    expect(sent.html).toContain('每天寫三行');
    expect(recordSkippedEmailMock).not.toHaveBeenCalled();
  });

  it('後台模板含未知變數時信照寄，原字串保留（AC-05）', async () => {
    prismaMock.email_templates.findUnique.mockResolvedValue(
      dbTemplate({ body: '<p>{{userName}} {{unknownVar}}</p>' }) as never
    );

    await sendPracticeCreatedEmail(10, 7);

    const sent = sendEmailMock.mock.calls[0][0];
    expect(sent.html).toContain('{{unknownVar}}');
    expect(sent.html).toContain('小島');
  });
});
