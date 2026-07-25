import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const metrics = { enrolled: 10, activated: 7, checkins: 20, active_members: 6, top_tags: [{ tag: '反思', count: 8 }], exited: 1, hour_histogram: { '21': 5 }, daily_heatmap: { '2026-07-21': 4 }, blocker_moods: { frustrated: 2 }, completed_members: 5, sustained_members: 6 };
const upsertCohortSnapshot = jest.fn().mockResolvedValue({ metrics, computed_at: new Date('2026-07-22T00:00:00Z') });
jest.mock('@/services/cohort-stat.service', () => ({ startOfWeekUtc: () => new Date('2026-07-20T00:00:00Z'), upsertCohortSnapshot: (...args: unknown[]) => upsertCohortSnapshot(...args) }));
import { cohortDashboardService } from '@/services/cohort-dashboard.service';

const now = new Date('2026-07-22T12:00:00Z');
const weekStart = new Date('2026-07-20T00:00:00Z');

describe('cohortDashboardService', () => {
  beforeEach(() => upsertCohortSnapshot.mockClear());

  it('reuses a freshly computed snapshot of the current week', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_stat_snapshots.findFirst.mockResolvedValue({ metrics, period_start: weekStart, computed_at: new Date('2026-07-22T11:58:00Z') } as never);
    const result = await cohortDashboardService.get(2, 8, 42, now);
    expect(result).toEqual(expect.objectContaining({ snapshotKind: 'weekly', rhythmHeatmap: metrics.daily_heatmap, commonBlockers: metrics.blocker_moods, funnel: { enrolled: 10, activated: 7, activeMembers: 6 } }));
    expect(upsertCohortSnapshot).not.toHaveBeenCalled();
  });

  it('recomputes when the newest snapshot is older than the freshness window', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_stat_snapshots.findFirst.mockResolvedValue({ metrics, period_start: weekStart, computed_at: new Date('2026-07-22T10:00:00Z') } as never);
    const result = await cohortDashboardService.get(2, 8, 42, now);
    expect(result.snapshotKind).toBe('realtime');
    expect(upsertCohortSnapshot).toHaveBeenCalledWith(8, 'weekly', weekStart, now);
  });

  it('recomputes when the newest snapshot belongs to an earlier week', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_stat_snapshots.findFirst.mockResolvedValue({ metrics, period_start: new Date('2026-07-13T00:00:00Z'), computed_at: now } as never);
    const result = await cohortDashboardService.get(2, 8, 42, now);
    expect(result.snapshotKind).toBe('realtime');
    expect(upsertCohortSnapshot).toHaveBeenCalledWith(8, 'weekly', weekStart, now);
  });

  it('computes and writes a realtime snapshot on cold start', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_stat_snapshots.findFirst.mockResolvedValue(null);
    const result = await cohortDashboardService.get(2, 8, 42, now);
    expect(result.snapshotKind).toBe('realtime');
    expect(upsertCohortSnapshot).toHaveBeenCalledWith(8, 'weekly', weekStart, now);
  });
});
