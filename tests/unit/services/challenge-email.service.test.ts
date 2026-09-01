import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/services/email/email.service', () => ({ emailService: { sendEmail: sendEmailMock } }));

const hasEmailBeenSentMock = jest.fn();
const createEmailLogMock = jest.fn().mockResolvedValue({ id: 1, tracking_token: 'tok' });
const updateEmailLogStatusMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/email/email-log.service', () => ({
  hasEmailBeenSent: (...args: unknown[]) => hasEmailBeenSentMock(...args),
  createEmailLog: (...args: unknown[]) => createEmailLogMock(...args),
  updateEmailLogStatus: (...args: unknown[]) => updateEmailLogStatusMock(...args)
}));

import { challengeEmailService } from '@/services/email/challenge-email.service';
import { formatWeekday } from '@/services/email/challenge-email-template';

// 測試用挑戰：2026-09-01（二）～ 2026-09-21，Asia/Taipei
const cohortRow = {
  id: 6,
  display_name: '21 天晨間書寫',
  start_date: new Date('2026-09-01T00:00:00.000Z'),
  end_date: new Date('2026-09-21T00:00:00.000Z'),
  program: { kind: 'challenge' }
};

const setupScanMocks = () => {
  prismaMock.cohorts.findMany.mockResolvedValue([cohortRow] as never);
  prismaMock.cohorts.findUnique.mockResolvedValue(cohortRow as never);
  prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ user_id: 325 }] as never);
  prismaMock.users.findUnique.mockResolvedValue({ nickname: '小島', contacts: { email: 'a@b.c' } } as never);
  prismaMock.practices.findFirst.mockResolvedValue({ external_id: 'uuid-1' } as never);
  prismaMock.practices.findMany.mockResolvedValue([]);
  hasEmailBeenSentMock.mockResolvedValue(false);
};

const sentSubjects = (): string[] => sendEmailMock.mock.calls.map(call => (call[0] as { subject: string }).subject);

beforeEach(() => {
  sendEmailMock.mockClear();
  hasEmailBeenSentMock.mockReset();
  createEmailLogMock.mockClear();
});

describe('formatWeekday', () => {
  it('2026-09-01 是星期二', () => {
    expect(formatWeekday('2026-09-01')).toBe('星期二');
  });
});

describe('sendChallengeNodeEmail', () => {
  it('已寄過（email_logs 查重）則跳過不重寄', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(cohortRow as never);
    prismaMock.users.findUnique.mockResolvedValue({ nickname: '小島', contacts: { email: 'a@b.c' } } as never);
    hasEmailBeenSentMock.mockResolvedValue(true);
    await expect(challengeEmailService.sendChallengeNodeEmail('welcome', 6, 325)).resolves.toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('未寄過則寄出 welcome 並記 log', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(cohortRow as never);
    prismaMock.users.findUnique.mockResolvedValue({ nickname: '小島', contacts: { email: 'a@b.c' } } as never);
    prismaMock.practices.findFirst.mockResolvedValue({ external_id: 'uuid-1' } as never);
    hasEmailBeenSentMock.mockResolvedValue(false);
    await expect(challengeEmailService.sendChallengeNodeEmail('welcome', 6, 325)).resolves.toBe(true);
    expect(sentSubjects()).toEqual(['歡迎你加入「21 天晨間書寫」']);
    expect(createEmailLogMock).toHaveBeenCalledTimes(1);
  });
});

describe('sendPendingChallengeEmails 觸發時窗（Asia/Taipei）', () => {
  it('開始前 72 小時：不寄任何排程節點', async () => {
    setupScanMocks();
    await challengeEmailService.sendPendingChallengeEmails(new Date('2026-08-28T16:00:00.000Z')); // 台北 8/29 00:00
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('開始前 47 小時：寄 t48h', async () => {
    setupScanMocks();
    // 台北 9/1 00:00 = UTC 8/31 16:00；47 小時前 = UTC 8/29 17:00
    await challengeEmailService.sendPendingChallengeEmails(new Date('2026-08-29T17:00:00.000Z'));
    expect(sentSubjects()).toEqual(['「21 天晨間書寫」48 小時後開始']);
  });

  it('開始日台北 05:00：尚不寄 day1；06:30 寄 day1', async () => {
    setupScanMocks();
    await challengeEmailService.sendPendingChallengeEmails(new Date('2026-08-31T21:00:00.000Z')); // 台北 9/1 05:00
    expect(sendEmailMock).not.toHaveBeenCalled();
    await challengeEmailService.sendPendingChallengeEmails(new Date('2026-08-31T22:30:00.000Z')); // 台北 9/1 06:30
    expect(sentSubjects()).toEqual(['今天，21 天晨間書寫 開始了']);
  });

  it('結束日隔日台北 06:30：寄 end', async () => {
    setupScanMocks();
    // 台北 9/22 06:30 = UTC 9/21 22:30
    await challengeEmailService.sendPendingChallengeEmails(new Date('2026-09-21T22:30:00.000Z'));
    expect(sentSubjects()).toEqual(['「21 天晨間書寫」走到終點了']);
  });

  it('首次打卡隔日台北 08:30：寄 first_checkin；隔日 07:00 尚不寄', async () => {
    setupScanMocks();
    // 首次打卡：台北 9/2 21:00 = UTC 9/2 13:00
    prismaMock.practices.findMany.mockResolvedValue([{ user_id: 325, first_checkin_at: new Date('2026-09-02T13:00:00.000Z') }] as never);
    // 台北 9/3 07:00 = UTC 9/2 23:00 → 不寄（day1 時窗也已過）
    await challengeEmailService.sendPendingChallengeEmails(new Date('2026-09-02T23:00:00.000Z'));
    expect(sendEmailMock).not.toHaveBeenCalled();
    // 台北 9/3 08:30 = UTC 9/3 00:30 → 寄
    await challengeEmailService.sendPendingChallengeEmails(new Date('2026-09-03T00:30:00.000Z'));
    expect(sentSubjects()).toEqual(['你昨天的第一次打卡']);
  });
});
