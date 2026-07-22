import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortOutcomeService } from '@/services/cohort-outcome.service';
const metrics = { enrolled: 10, activated: 8, checkins: 40, active_members: 7, top_tags: [], exited: 1, hour_histogram: {}, daily_heatmap: {}, blocker_moods: {}, completed_members: 6, sustained_members: 7 };
describe('cohortOutcomeService', () => {
  it('uses only the final snapshot and returns positive completion/participation metrics', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_stat_snapshots.findFirst.mockResolvedValue({ metrics, computed_at: new Date('2026-07-22T00:00:00Z') } as never);
    const result = await cohortOutcomeService.get(2, 8, 42);
    expect(result).toEqual({ cohortId: 8, completedCount: 6, enrolledCount: 10, sustainedParticipationCount: 7, sustainedParticipationRate: 0.7, computedAt: new Date('2026-07-22T00:00:00Z') });
    expect(result).not.toHaveProperty('absent');
    expect(result).not.toHaveProperty('ranking');
    expect(prismaMock.cohort_stat_snapshots.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { cohort_id: 8, kind: 'final' } }));
  });
  it('returns null before final snapshot exists', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_stat_snapshots.findFirst.mockResolvedValue(null);
    const result = await cohortOutcomeService.get(2, 8, 42);
    expect(result).toBeNull();
  });
});

