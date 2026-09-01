import { Job, Worker } from 'bullmq';
import { getQueueConnection } from './connection';
import { FUTURE_LETTER_QUEUE_NAME, FutureLetterJobData } from './future-letter.queue';
import { loggerService } from '../services/logging/logger.service';

/** Deliver one scheduled future letter. Exported for focused tests. */
export async function processFutureLetterJob(job: Job<FutureLetterJobData>): Promise<void> {
  const { futureLetterService } = await import('../services/future-letter.service');
  await futureLetterService.deliver(job.data.letterId);
}

/** Start the future-letter BullMQ worker. */
export function createFutureLetterWorker(): Worker<FutureLetterJobData> {
  const worker = new Worker<FutureLetterJobData>(FUTURE_LETTER_QUEUE_NAME, processFutureLetterJob, {
    connection: getQueueConnection(),
    concurrency: 5,
  });

  worker.on('completed', job => loggerService.debug('Future letter job completed', { jobId: job.id }));
  worker.on('failed', (job, error) => loggerService.error('Future letter job failed', { jobId: job?.id, error: error.message }));
  worker.on('error', error => loggerService.error('Future letter worker error', { error: error.message }));
  return worker;
}

/** Gracefully close the future-letter worker. */
export async function closeFutureLetterWorker(worker: Worker<FutureLetterJobData>): Promise<void> {
  await worker.close();
}
