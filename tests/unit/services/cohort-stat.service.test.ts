import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { computeCohortMetrics, upsertCohortSnapshot } from '@/services/cohort-stat.service';

describe('cohort stat snapshots', () => {
  const start = new Date('2026-07-13T00:00:00Z');
  const end = new Date('2026-07-20T00:00:00Z');
  const mockMetrics = () => prismaMock.$queryRaw
    .mockResolvedValueOnce([{ enrolled: 12n, exited: 2n }] as never)
    .mockResolvedValueOnce([{ activated: 8n }] as never)
    .mockResolvedValueOnce([{ checkins: 25n, active_members: 7n }] as never)
    .mockResolvedValueOnce([{ tag: '反思', count: 9n }] as never)
    .mockResolvedValueOnce([{ hour: 21, count: 6n }] as never)
    .mockResolvedValueOnce([{ day: new Date('2026-07-18T00:00:00Z'), count: 4n }] as never)
    .mockResolvedValueOnce([{ mood: 'frustrated', count: 3n }] as never)
    .mockResolvedValueOnce([{ completed_members: 5n, sustained_members: 6n }] as never);

  it('aggregates from cohort practices into the required weekly metric keys', async () => {
    mockMetrics();
    await expect(computeCohortMetrics(8, start, end)).resolves.toEqual({
      enrolled: 12, activated: 8, checkins: 25, active_members: 7,
      top_tags: [{ tag: '反思', count: 9 }], exited: 2, hour_histogram: { '21': 6 },
      daily_heatmap: { '2026-07-18': 4 }, blocker_moods: { frustrated: 3 }, completed_members: 5, sustained_members: 6
    });
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(8);
  });

  it('upserts the same cohort/kind/period for idempotent reruns', async () => {
    mockMetrics(); prismaMock.cohort_stat_snapshots.upsert.mockResolvedValue({ id: 1 } as never);
    await upsertCohortSnapshot(8, 'weekly', start, end);
    expect(prismaMock.cohort_stat_snapshots.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { cohort_id_kind_period_start: { cohort_id: 8, kind: 'weekly', period_start: start } }
    }));
  });
});
