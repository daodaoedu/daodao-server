import { Job, Worker } from 'bullmq';
import { prisma } from '../services/database/prisma.service';
import { startOfWeekUtc, upsertCohortSnapshot } from '../services/cohort-stat.service';
import { sendWeeklyCohortDigests } from '../services/cohort-weekly-digest.service';
import { sendCohortFeedbackSurveys } from '../services/cohort-feedback-survey.service';
import { getQueueConnection } from './connection';
import { COHORT_STAT_QUEUE_NAME, type CohortStatJobData } from './cohort-stat.queue';

export const processCohortStatJob = async (job: Job<CohortStatJobData>): Promise<number> => {
  if (job.data.kind === 'digest') return sendWeeklyCohortDigests();
  if (job.data.kind === 'feedback') return sendCohortFeedbackSurveys();
  if (job.data.kind === 'final') {
    const taipei = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const today = new Date(Date.UTC(taipei.getUTCFullYear(), taipei.getUTCMonth(), taipei.getUTCDate()));
    const cohorts = await prisma.cohorts.findMany({ where: { end_date: today }, select: { id: true, start_date: true, end_date: true } });
    for (const cohort of cohorts) {
      const periodEnd = new Date(cohort.end_date);
      periodEnd.setUTCDate(periodEnd.getUTCDate() + 1);
      await upsertCohortSnapshot(cohort.id, 'final', cohort.start_date, periodEnd);
    }
    return cohorts.length;
  }
  const periodEnd = startOfWeekUtc(new Date());
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodStart.getUTCDate() - 7);
  const cohorts = await prisma.cohorts.findMany({ where: { status: 'published' }, select: { id: true } });
  for (const cohort of cohorts) await upsertCohortSnapshot(cohort.id, 'weekly', periodStart, periodEnd);
  return cohorts.length;
};
export const createCohortStatWorker = (): Worker<CohortStatJobData> => new Worker(COHORT_STAT_QUEUE_NAME, processCohortStatJob, { connection: getQueueConnection(), concurrency: 1 });
