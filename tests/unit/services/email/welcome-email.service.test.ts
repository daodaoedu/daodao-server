/**
 * 歡迎信直接寄送（取代原新手任務 L0 queue）
 * Regression for #218：驗證後寄歡迎信不再依賴 onboarding-email queue
 */
import { prismaMock } from '@tests/utils/prisma-mock';

const mockSendWelcomeEmailWithLog = jest.fn();
const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/email/email.service', () => ({
  emailService: { sendWelcomeEmailWithLog: (...args: unknown[]) => mockSendWelcomeEmailWithLog(...args) },
}));
jest.mock('@/services/logging/logger.service', () => ({ loggerService: mockLogger }));

import { sendWelcomeEmailToUser, sendWelcomeEmailInBackground } from '@/services/email/welcome-email.service';

describe('welcome-email.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('查 user email 後呼叫 sendWelcomeEmailWithLog，帶 referralGroup 與 userId', async () => {
    prismaMock.users.findUnique.mockResolvedValue({
      id: 7,
      nickname: '小島',
      referral_source: 'instagram',
      contacts: { email: 'island@example.com' },
    } as never);
    mockSendWelcomeEmailWithLog.mockResolvedValue({ success: true });

    await sendWelcomeEmailToUser(7);

    expect(prismaMock.users.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, include: { contacts: true } })
    );
    expect(mockSendWelcomeEmailWithLog).toHaveBeenCalledWith(
      'island@example.com',
      expect.objectContaining({ name: '小島', userId: 7, referralGroup: expect.any(String) })
    );
  });

  it('沒有 email 時只記 warn、不寄信', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ id: 8, nickname: null, contacts: null } as never);

    await sendWelcomeEmailToUser(8);

    expect(mockSendWelcomeEmailWithLog).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith('No email for welcome letter', { userId: 8 });
  });

  it('寄送失敗時拋錯（由呼叫端決定是否吞掉）', async () => {
    prismaMock.users.findUnique.mockResolvedValue({
      id: 9, nickname: 'x', referral_source: null, contacts: { email: 'x@example.com' },
    } as never);
    mockSendWelcomeEmailWithLog.mockResolvedValue({ success: false, error: 'smtp down' });

    await expect(sendWelcomeEmailToUser(9)).rejects.toThrow('smtp down');
  });

  it('sendWelcomeEmailInBackground 不拋錯、失敗記 error log', async () => {
    prismaMock.users.findUnique.mockRejectedValue(new Error('db down'));

    expect(() => sendWelcomeEmailInBackground(10, 'verify-email')).not.toThrow();
    await new Promise(resolve => setImmediate(resolve));

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to send welcome email (verify-email)',
      expect.objectContaining({ userId: 10, error: 'db down' })
    );
  });
});
