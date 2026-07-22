import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { cohortMetricsSchema } from '../validators/cohort-dashboard.validators';
import { prisma } from './database/prisma.service';
const get = async (programId: number, cohortId: number, actorId: number) => {
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, program: { organization: { organization_members: { some: { user_id: actorId } } } } }, select: { id: true } });
  if (!cohort) throw new ForbiddenError('無權限查看此期成果');
  const snapshot = await prisma.cohort_stat_snapshots.findFirst({ where: { cohort_id: cohortId, kind: 'final' }, orderBy: { computed_at: 'desc' } });
  if (!snapshot) throw new NotFoundError('本期尚未產生期末成果快照');
  const metrics = cohortMetricsSchema.parse(snapshot.metrics);
  return { cohortId, completedCount: metrics.completed_members, enrolledCount: metrics.enrolled, sustainedParticipationCount: metrics.sustained_members, sustainedParticipationRate: metrics.enrolled === 0 ? 0 : metrics.sustained_members / metrics.enrolled, computedAt: snapshot.computed_at };
};
export const cohortOutcomeService = { get };

