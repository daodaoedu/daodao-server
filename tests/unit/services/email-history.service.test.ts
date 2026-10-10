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
