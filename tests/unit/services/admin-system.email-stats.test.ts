import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import adminSystemService from '@/services/admin-system.service';

/** 取出 $queryRaw 收到的 SQL 文字（tagged template 的 strings） */
const sqlText = (arg: unknown): string => {
  if (Array.isArray(arg)) return arg.join('?');
  return (arg as { sql: string }).sql;
};

const row = (overrides: Record<string, bigint> = {}) => ({
  total: 0n, success: 0n, failed: 0n, skipped: 0n,
  curr_total: 0n, curr_success: 0n, curr_failed: 0n, curr_skipped: 0n,
  prev_total: 0n, prev_success: 0n, prev_failed: 0n, prev_skipped: 0n,
  ...overrides,
});

describe('adminSystemService.getEmailStats（daodao#294）', () => {
  it('SQL 另外統計 skipped', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([row()] as never);

    await adminSystemService.getEmailStats();

    expect(sqlText(prismaMock.$queryRaw.mock.calls[0][0])).toMatch(/status = 'skipped'/);
  });

  it('AC-01：總發送不含 skipped，另外回傳 skippedCount', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      row({ total: 557n, success: 546n, skipped: 11n }),
    ] as never);

    const stats = await adminSystemService.getEmailStats();

    expect(stats.totalSent).toBe(546);
    expect(stats.skippedCount).toBe(11);
  });

  it('AC-02：成功率與退信率的分母只算 sent＋failed', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      row({ total: 20n, success: 8n, failed: 2n, skipped: 9n }),
    ] as never);

    const stats = await adminSystemService.getEmailStats();

    expect(stats.successRate).toBe(80);
    expect(stats.bounceRate).toBe(20);
  });

  it('本月／上月的成功率變化也排除 skipped', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      row({
        curr_total: 10n, curr_success: 5n, curr_skipped: 5n,
        prev_total: 4n, prev_success: 4n,
      }),
    ] as never);

    const stats = await adminSystemService.getEmailStats();

    // 本月 5/5=100%、上月 4/4=100% → 變化 0；本月實寄 5、上月 4 → +25%
    expect(stats.successRateChange).toBe(0);
    expect(stats.sentChange).toBe(25);
  });
});
