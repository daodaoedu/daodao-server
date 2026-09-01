import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortFocusService } from '@/services/cohort-focus.service';
import { ForbiddenError } from '@/middleware/error.middleware';

describe('cohortFocusService', () => {
  it('returns participant × practice rows with message counts, moment copy and first check-in date, never email', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ user_id: 77, nickname: '小島', avatar: null, practice_id: 31, practice_title: '每天寫下一件小事', last_at: new Date('2026-07-15T09:00:00Z'), last_date: new Date('2026-07-15T00:00:00Z'), preview: '最近有點卡住', interrupted_days: 7 }] as never)
      .mockResolvedValueOnce([
        { user_id: 78, nickname: '阿學', avatar: 'avatar.png', practice_id: 41, practice_title: '每天讀 20 分鐘', moment: 'first_checkin', occurred_at: new Date('2026-07-22T00:00:00Z'), first_at: new Date('2026-07-22T00:00:00Z') },
        { user_id: 79, nickname: '回歸者', avatar: null, practice_id: 42, practice_title: '每週和夥伴對話', moment: 'return_after_break', occurred_at: new Date('2026-07-22T01:00:00Z'), first_at: new Date('2026-07-01T00:00:00Z') },
        { user_id: 80, nickname: '滿月者', avatar: null, practice_id: 43, practice_title: '冥想', moment: 'month_milestone', occurred_at: new Date('2026-07-22T02:00:00Z'), first_at: new Date('2026-06-20T00:00:00Z') }
      ] as never);
    prismaMock.cohort_messages.groupBy.mockResolvedValue([{ recipient_user_id: 77, _count: { id: 2 } }] as never);
    const result = await cohortFocusService.get(2, 8, 42, new Date('2026-07-22T12:00:00Z'));
    expect(result.needsEncouragement[0]).toEqual(expect.objectContaining({ userId: 77, practiceId: 31, practiceTitle: '每天寫下一件小事', lastCheckinDate: new Date('2026-07-15T00:00:00Z'), interruptedDays: 7, messageCount: 2 }));
    expect(result.celebrations.map(item => item.moment)).toEqual(['first_checkin', 'return_after_break', 'month_milestone']);
    expect(result.celebrations.map(item => item.momentDescription)).toEqual(['首次打卡', '暫停幾天後又回來了', '持續參與滿一個月']);
    expect(result.celebrations[1]).toEqual(expect.objectContaining({ practiceId: 42, firstCheckinAt: new Date('2026-07-01T00:00:00Z'), messageCount: 0 }));
    expect(JSON.stringify(result)).not.toContain('email');
  });

  it('rejects coaches outside the organization', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(cohortFocusService.get(2, 8, 42)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
