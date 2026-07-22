import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
export const COHORT_STAT_QUEUE_NAME = 'cohort-stat-snapshot';
export type CohortStatJobData = { kind: 'weekly' | 'final' | 'digest' | 'feedback' };
export const createCohortStatQueue = (): Queue<CohortStatJobData> => new Queue(COHORT_STAT_QUEUE_NAME, { connection: getQueueConnection(), defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 100 } });
export const registerCohortStatJobs = async (queue: Queue<CohortStatJobData>): Promise<void> => {
  if (process.env.DISABLE_SCHEDULED_JOBS === 'true') return;
  await queue.add('weekly-snapshot', { kind: 'weekly' }, { repeat: { pattern: '10 0 * * 1', tz: 'Asia/Taipei' }, jobId: 'cohort-weekly-snapshot' });
  await queue.add('final-snapshot', { kind: 'final' }, { repeat: { pattern: '20 0 * * *', tz: 'Asia/Taipei' }, jobId: 'cohort-final-snapshot' });
  await queue.add('weekly-digest', { kind: 'digest' }, { repeat: { pattern: '0 8 * * 1', tz: 'Asia/Taipei' }, jobId: 'cohort-weekly-digest' });
  await queue.add('cohort-feedback-survey', { kind: 'feedback' }, { repeat: { pattern: '30 0 * * *', tz: 'Asia/Taipei' }, jobId: 'cohort-feedback-survey' });
};
