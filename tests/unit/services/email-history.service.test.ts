import { prismaMock } from '@tests/utils/prisma-mock';
import emailHistoryService from '@/services/email-history.service';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

const skippedLog = {
  id: 7,
  user_id: 42,
  email_type: 'welcome_letter',
  subject: '歡迎來到島島',
  status: 'skipped',
  sent_at: new Date('2026-10-10T01:00:00.000Z'),
  created_at: new Date('2026-10-10T01:00:00.000Z'),
  entity_type: null,
  entity_id: null,
  tracking_token: null,
  opened_at: null,
  open_count: 0,
  users: { nickname: '小島', contacts: { email: 'someone@example.com' } },
};

describe('emailHistoryService.getEmailHistory（daodao#292 AC-02）', () => {
  beforeEach(() => {
    prismaMock.email_logs.count.mockResolvedValue(1);
    prismaMock.email_logs.findMany.mockResolvedValue([skippedLog] as never);
    prismaMock.email_logs.groupBy.mockResolvedValue([
      { status: 'skipped', _count: { id: 1 } },
    ] as never);
  });

  it('以 status=skipped 篩選並原樣回傳 skipped 狀態', async () => {
    const result = await emailHistoryService.getEmailHistory({ status: 'skipped' });

    expect(prismaMock.email_logs.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'skipped' }) }),
    );
    expect(result.records).toHaveLength(1);
    expect(result.records[0].status).toBe('skipped');
  });
});

describe('emailHistoryService.getEmailHistoryStats（daodao#294）', () => {
  beforeEach(() => {
    prismaMock.email_logs.count.mockResolvedValue(0);
  });

  it('AC-01：skipped 不計入已發送，另外回傳 skippedCount', async () => {
    prismaMock.email_logs.groupBy.mockResolvedValue([
      { status: 'sent', _count: { id: 8 } },
      { status: 'skipped', _count: { id: 5 } },
      { status: 'failed', _count: { id: 2 } },
      { status: 'pending', _count: { id: 1 } },
    ] as never);

    const stats = await emailHistoryService.getEmailHistoryStats();

    expect(stats.sentCount).toBe(8);
    expect(stats.skippedCount).toBe(5);
    expect(stats.failedCount).toBe(2);
    expect(stats.pendingCount).toBe(1);
    expect(stats.totalRecords).toBe(16);
  });

  it('AC-01：分組順序不影響 sentCount（skipped 排在 sent 前面也一樣）', async () => {
    prismaMock.email_logs.groupBy.mockResolvedValue([
      { status: 'skipped', _count: { id: 5 } },
      { status: 'sent', _count: { id: 8 } },
    ] as never);

    const stats = await emailHistoryService.getEmailHistoryStats();

    expect(stats.sentCount).toBe(8);
    expect(stats.skippedCount).toBe(5);
  });

  it('AC-02：成功率分母只算 sent＋failed，排除 skipped 與 pending', async () => {
    prismaMock.email_logs.groupBy.mockResolvedValue([
      { status: 'sent', _count: { id: 8 } },
      { status: 'skipped', _count: { id: 5 } },
      { status: 'failed', _count: { id: 2 } },
      { status: 'pending', _count: { id: 1 } },
    ] as never);

    const stats = await emailHistoryService.getEmailHistoryStats();

    expect(stats.successRate).toBe(80);
  });

  it('全部都是 skipped 時成功率為 0、不除以零', async () => {
    prismaMock.email_logs.groupBy.mockResolvedValue([
      { status: 'skipped', _count: { id: 3 } },
    ] as never);

    const stats = await emailHistoryService.getEmailHistoryStats();

    expect(stats.sentCount).toBe(0);
    expect(stats.skippedCount).toBe(3);
    expect(stats.successRate).toBe(0);
  });
});
