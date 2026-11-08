/**
 * daodao#451：後台回覆錯誤回報後寄信、站內通知給回報者
 * AC-01 回報者收到含原回報與回覆的信；AC-02 寄信失敗時回覆仍保留且回傳 failed；
 * AC-06 收件人只取自該筆回報的 user；AC-07 建立 FeedbackReplied 站內通知
 */
import { prismaMock, setupTransactionMock } from '../../../tests/utils/prisma-mock';

jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
const mockSendEmail = jest.fn();
jest.mock('../email/email.service', () => ({ emailService: { sendEmail: (...args: unknown[]) => mockSendEmail(...args) } }));
const mockCreateEmailLog = jest.fn();
const mockUpdateEmailLogStatus = jest.fn();
jest.mock('../email/email-log.service', () => ({
  createEmailLog: (...args: unknown[]) => mockCreateEmailLog(...args),
  updateEmailLogStatus: (...args: unknown[]) => mockUpdateEmailLogStatus(...args),
}));
jest.mock('../../config/email.config', () => ({ getEmailConfig: () => ({ urls: { frontend: 'https://app-dev.daodao.so' } }) }));
jest.mock('../logging/logger.service', () => ({ loggerService: { error: jest.fn(), info: jest.fn(), debug: jest.fn(), warn: jest.fn() } }));

import adminFeedbackService, { FEEDBACK_REPLY_EMAIL_ENTITY } from '../admin-feedback.service';

const REPORTER_ID = 501;
const ADMIN_ID = 9;
const FEEDBACK_ID = 8;
const REPLY_ID = 77;

/** 讓 transaction 內的 UPDATE … RETURNING 與 INSERT … RETURNING 依序回傳 */
const givenFeedback = (feedback: { user_id: number | null; content: string; source?: string | null } | null): void => {
  prismaMock.$queryRaw
    .mockResolvedValueOnce(feedback ? [{ source: 'bug_report_form', ...feedback }] as never : [] as never)
    .mockResolvedValueOnce([{ id: REPLY_ID }] as never);
};

const givenReporter = (email: string | null): void => {
  prismaMock.users.findUnique.mockResolvedValue({ nickname: '小島', contacts: email ? { email } : null } as never);
};

beforeEach(() => {
  setupTransactionMock();
  mockSendEmail.mockReset();
  mockCreateEmailLog.mockReset().mockResolvedValue({ id: 3001, tracking_token: 'token-1' });
  mockUpdateEmailLogStatus.mockReset().mockResolvedValue({});
  prismaMock.notifications.create.mockResolvedValue({} as never);
});

describe('replyToFeedback（daodao#451）', () => {
  it('AC-01：寄信給回報者的帳號信箱，內容有原回報摘要與回覆內容', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '按下送出後畫面沒有反應' });
    givenReporter('reporter@example.com');
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await adminFeedbackService.replyToFeedback(FEEDBACK_ID, '已修正，謝謝回報！', ADMIN_ID);

    expect(result).toEqual({ replyId: REPLY_ID, emailStatus: 'sent' });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const mail = mockSendEmail.mock.calls[0][0];
    expect(mail.to).toBe('reporter@example.com');
    expect(mail.html).toContain('按下送出後畫面沒有反應');
    expect(mail.html).toContain('已修正，謝謝回報！');
    expect(mail.html).toContain('https://app-dev.daodao.so/settings/bug-report/mine');
    // 寄送結果記在 email_logs，後台列表據此顯示
    expect(mockCreateEmailLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: REPORTER_ID, entityType: FEEDBACK_REPLY_EMAIL_ENTITY, entityId: REPLY_ID,
    }));
    expect(mockUpdateEmailLogStatus).toHaveBeenCalledWith(3001, 'sent');
  });

  it('AC-02：寄信失敗時回覆仍寫入、回傳 failed，email_logs 記為 failed', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '描述' });
    givenReporter('reporter@example.com');
    mockSendEmail.mockResolvedValue({ success: false, error: 'SMTP down' });

    const result = await adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID);

    expect(result.emailStatus).toBe('failed');
    expect(result.replyId).toBe(REPLY_ID);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2); // UPDATE feedback + INSERT feedback_replies 都已執行
    expect(mockUpdateEmailLogStatus).toHaveBeenCalledWith(3001, 'failed');
  });

  it('AC-02：寄信過程丟例外也不讓回覆失敗，回傳 failed', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '描述' });
    givenReporter('reporter@example.com');
    mockSendEmail.mockRejectedValue(new Error('connection reset'));

    await expect(adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID))
      .resolves.toEqual({ replyId: REPLY_ID, emailStatus: 'failed' });
    expect(mockUpdateEmailLogStatus).toHaveBeenCalledWith(3001, 'failed');
  });

  it('AC-02：回報者沒有聯絡信箱時不寄信，回傳 no_recipient 並記 failed', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '描述' });
    givenReporter(null);

    const result = await adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID);

    expect(result.emailStatus).toBe('no_recipient');
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockCreateEmailLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed', entityId: REPLY_ID }));
  });

  it('AC-02：回報者帳號已刪除時不寄信、不建通知，回覆照樣保留', async () => {
    givenFeedback({ user_id: null, content: '描述' });

    const result = await adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID);

    expect(result).toEqual({ replyId: REPLY_ID, emailStatus: 'no_recipient' });
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(prismaMock.notifications.create).not.toHaveBeenCalled();
  });

  it('AC-06：收件人取自該筆回報的 user，查的是回報的 user_id 而不是管理者', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '描述' });
    givenReporter('reporter@example.com');
    mockSendEmail.mockResolvedValue({ success: true });

    await adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID);

    expect(prismaMock.users.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: REPORTER_ID } }));
    expect(mockSendEmail.mock.calls[0][0].to).toBe('reporter@example.com');
  });

  it('AC-07：建立 FeedbackReplied 站內通知給回報者，指向該則回報', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '按下送出後畫面沒有反應' });
    givenReporter('reporter@example.com');
    mockSendEmail.mockResolvedValue({ success: true });

    await adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID);

    expect(prismaMock.notifications.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipient_id: REPORTER_ID,
        actor_id: ADMIN_ID,
        type: 'FeedbackReplied',
        entity_type: 'feedback',
        entity_id: FEEDBACK_ID,
        payload: { entityTitle: '按下送出後畫面沒有反應' },
      }),
    });
  });

  it('站內通知建立失敗不影響寄信與回覆結果', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '描述' });
    givenReporter('reporter@example.com');
    mockSendEmail.mockResolvedValue({ success: true });
    prismaMock.notifications.create.mockRejectedValue(new Error('db down'));

    await expect(adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID))
      .resolves.toEqual({ replyId: REPLY_ID, emailStatus: 'sent' });
  });

  it('不是錯誤回報表單來的回饋：回覆照存，不寄「錯誤回報」信也不建通知，回傳 not_applicable', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '希望有深色模式', source: null });

    const result = await adminFeedbackService.replyToFeedback(FEEDBACK_ID, '收到建議', ADMIN_ID);

    expect(result).toEqual({ replyId: REPLY_ID, emailStatus: 'not_applicable' });
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(prismaMock.notifications.create).not.toHaveBeenCalled();
  });

  it('email_logs 寫不進去時信仍寄出並回 sent', async () => {
    givenFeedback({ user_id: REPORTER_ID, content: '描述' });
    givenReporter('reporter@example.com');
    mockCreateEmailLog.mockRejectedValue(new Error('db down'));
    mockSendEmail.mockResolvedValue({ success: true });

    await expect(adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID))
      .resolves.toEqual({ replyId: REPLY_ID, emailStatus: 'sent' });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('回報不存在時回 404，不寄信也不建通知', async () => {
    givenFeedback(null);

    await expect(adminFeedbackService.replyToFeedback(FEEDBACK_ID, '回覆', ADMIN_ID)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(prismaMock.notifications.create).not.toHaveBeenCalled();
  });
});

describe('listFeedback（daodao#451 AC-02／AC-03）', () => {
  const givenRows = (rows: unknown[]): void => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ total: BigInt(rows.length) }] as never)
      .mockResolvedValueOnce([{ total: BigInt(rows.length), pending: BigInt(0), this_month: BigInt(0) }] as never)
      .mockResolvedValueOnce(rows as never);
  };
  const row = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    id: FEEDBACK_ID, user_id: REPORTER_ID, user_name: '小島', user_email: 'reporter@example.com',
    content: '描述', category: 'bug', status: 'replied', source: 'bug_report_form',
    created_at: new Date('2026-11-08T02:00:00Z'), replied_at: null,
    meta: { area: 'ui', link: 'https://app-dev.daodao.so/settings', referrer: 'https://app-dev.daodao.so/home', userAgent: 'Mozilla/5.0 Chrome', screenshots: [] },
    replies: null,
    ...overrides,
  });

  it('AC-03：錯誤回報帶出問題區域、相關連結、來源頁面、瀏覽器與回報者 email', async () => {
    givenRows([row()]);
    const { items } = await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });
    expect(items[0].userEmail).toBe('reporter@example.com');
    expect(items[0].bugReport).toEqual({
      area: 'ui',
      link: 'https://app-dev.daodao.so/settings',
      referrer: 'https://app-dev.daodao.so/home',
      userAgent: 'Mozilla/5.0 Chrome',
    });
  });

  it('非錯誤回報表單的回饋 bugReport 為 null', async () => {
    givenRows([row({ source: null, meta: {} })]);
    const { items } = await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });
    expect(items[0].bugReport).toBeNull();
  });

  it('AC-02：每則回覆帶寄送結果，沒有寄送紀錄的舊回覆為 null', async () => {
    givenRows([row({ replies: [
      { id: 1, content: '舊回覆', createdAt: '2026-11-01T00:00:00+00:00', emailStatus: null },
      { id: 2, content: '寄失敗', createdAt: '2026-11-08T03:00:00+00:00', emailStatus: 'failed' },
      { id: 3, content: '寄成功', createdAt: '2026-11-08T04:00:00+00:00', emailStatus: 'sent' },
    ] })]);
    const { items } = await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });
    expect(items[0].replies.map(r => r.emailStatus)).toEqual([null, 'failed', 'sent']);
  });
});

describe('listFeedback 單筆篩選（daodao#451 AC-04 後台連結）', () => {
  it('帶 id 時以參數綁定只查那一則，連結的回報不在最新 20 筆也找得到', async () => {
    prismaMock.$queryRaw.mockResolvedValue([] as never);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ total: BigInt(1) }] as never)
      .mockResolvedValueOnce([{ total: BigInt(30), pending: BigInt(0), this_month: BigInt(0) }] as never)
      .mockResolvedValueOnce([] as never);
    await adminFeedbackService.listFeedback({ id: 3, limit: 20, offset: 0 });
    const listSql = prismaMock.$queryRaw.mock.calls[2][0] as unknown as { text: string; values: unknown[] };
    expect(listSql.text).toMatch(/f\.id = \$\d+/);
    expect(listSql.values).toContain(3);
  });
});
