import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortFocusService } from '@/services/cohort-focus.service';

describe('cohortFocusService', () => {
  it('returns interrupted flow with last preview and positive moments without email', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ user_id: 77, nickname: '小島', avatar: null, last_at: new Date('2026-07-15T00:00:00Z'), preview: '最近有點卡住', interrupted_days: 7 }] as never)
      .mockResolvedValueOnce([
        { user_id: 78, nickname: '阿學', avatar: 'avatar.png', moment: 'first_checkin', occurred_at: new Date('2026-07-22T00:00:00Z') },
        { user_id: 79, nickname: '回歸者', avatar: null, moment: 'return_after_break', occurred_at: new Date('2026-07-22T01:00:00Z') },
        { user_id: 80, nickname: '滿月者', avatar: null, moment: 'month_milestone', occurred_at: new Date('2026-07-22T02:00:00Z') }
      ] as never);
    const result = await cohortFocusService.get(2, 8, 42, new Date('2026-07-22T12:00:00Z'));
    expect(result.needsEncouragement[0]).toEqual(expect.objectContaining({ userId: 77, lastCheckinPreview: '最近有點卡住', interruptedDays: 7 }));
    expect(result.celebrations.map(item => item.moment)).toEqual(['first_checkin', 'return_after_break', 'month_milestone']);
    expect(JSON.stringify(result)).not.toContain('email');
  });
});

