import { ForbiddenError } from '../middleware/error.middleware';
import { cohortMetricsSchema } from '../validators/cohort-dashboard.validators';
import { prisma } from './database/prisma.service';
import { startOfWeekUtc, upsertCohortSnapshot } from './cohort-stat.service';

const get = async (programId: number, cohortId: number, actorId: number, now = new Date()) => {
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, program: { organization: { organization_members: { some: { user_id: actorId } } } } }, select: { id: true } });
  if (!cohort) throw new ForbiddenError('無權限查看此期儀表板');
  let snapshot = await prisma.cohort_stat_snapshots.findFirst({ where: { cohort_id: cohortId, kind: 'weekly' }, orderBy: { period_start: 'desc' } });
  let snapshotKind: 'weekly' | 'realtime' = 'weekly';
  if (!snapshot) {
    const periodStart = startOfWeekUtc(now);
    snapshot = await upsertCohortSnapshot(cohortId, 'weekly', periodStart, now);
    snapshotKind = 'realtime';
  }
  const metrics = cohortMetricsSchema.parse(snapshot.metrics);
  return {
    snapshotKind, computedAt: snapshot.computed_at,
    rhythmHeatmap: metrics.daily_heatmap, tagDistribution: metrics.top_tags,
    commonBlockers: metrics.blocker_moods,
    funnel: { enrolled: metrics.enrolled, activated: metrics.activated, activeMembers: metrics.active_members },
    timeRhythm: metrics.hour_histogram, checkins: metrics.checkins, exited: metrics.exited
  };
};
export const cohortDashboardService = { get };

