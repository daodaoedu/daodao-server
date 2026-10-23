/**
 * Regression: daodao#386
 * 使用者統計（個人頁「近 7 天 N 次實踐」、/me/practice-stats）不得把已軟刪除的實踐算進去。
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue('job-id')
}));

jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('@/services/social-notification-fanout.service', () => ({
  fanoutToPracticeFollowers: jest.fn().mockResolvedValue(undefined),
  fanoutToConnectedPartners: jest.fn().mockResolvedValue(undefined),
}));

import { getRecentPracticeCount, getUserStats } from '@/services/practice.service';
import meService from '@/services/me.service';

const mockEmptyStats = (): void => {
  prismaMock.practices.aggregate.mockResolvedValue({ _count: { id: 0 } } as never);
  prismaMock.practice_checkins.aggregate.mockResolvedValue({ _count: { id: 0 } } as never);
  prismaMock.practices.groupBy.mockResolvedValue([] as never);
  prismaMock.practices.count.mockResolvedValue(0);
  prismaMock.practice_checkins.count.mockResolvedValue(0);
};

describe('user stats exclude soft-deleted practices (daodao#386)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    mockEmptyStats();
  });

  it('getRecentPracticeCount only counts practices that are not deleted', async () => {
    await getRecentPracticeCount(900003, 7);

    const where = prismaMock.practices.count.mock.calls[0][0]?.where;
    expect(where).toMatchObject({ user_id: 900003, deleted_at: null });
  });

  it('getUserStats excludes deleted practices from practice totals and status counts', async () => {
    await getUserStats(900003);

    expect(prismaMock.practices.aggregate.mock.calls[0][0].where).toMatchObject({ deleted_at: null });
    expect(prismaMock.practices.groupBy.mock.calls[0][0].where).toMatchObject({ deleted_at: null });
  });

  it('getUserStats excludes check-ins that belong to deleted practices', async () => {
    await getUserStats(900003);

    const where = prismaMock.practice_checkins.aggregate.mock.calls[0][0].where;
    expect(where).toMatchObject({ practices: { deleted_at: null } });
  });

  it('/me/practice-stats category and progress breakdowns exclude deleted practices', async () => {
    await meService.getMyPracticeStats(900003, { timeRange: '7d', includeArchived: false });

    for (const call of prismaMock.practices.groupBy.mock.calls) {
      expect(call[0].where).toMatchObject({ deleted_at: null });
    }
    for (const call of prismaMock.practices.count.mock.calls) {
      expect(call[0]?.where).toMatchObject({ deleted_at: null });
    }
    for (const call of prismaMock.practice_checkins.count.mock.calls) {
      expect(call[0]?.where).toMatchObject({ practices: { deleted_at: null } });
    }
    expect(prismaMock.practices.count).toHaveBeenCalled();
    expect(prismaMock.practice_checkins.count).toHaveBeenCalled();
  });
});
