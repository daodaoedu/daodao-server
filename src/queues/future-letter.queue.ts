import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

export const FUTURE_LETTER_QUEUE_NAME = 'future-letter';

export interface FutureLetterJobData {
  letterId: number;
}

let futureLetterQueueInstance: Queue<FutureLetterJobData> | null = null;

/** Create the future-letter delivery queue. */
export function createFutureLetterQueue(): Queue<FutureLetterJobData> {
  return new Queue<FutureLetterJobData>(FUTURE_LETTER_QUEUE_NAME, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 24 * 60 * 60, count: 500 },
      removeOnFail: { age: 7 * 24 * 60 * 60, count: 500 },
    },
  });
}

/** Set the queue initialized by server startup. */
export function setFutureLetterQueue(queue: Queue<FutureLetterJobData>): void {
  futureLetterQueueInstance = queue;
}

/** Return the initialized future-letter queue. */
export function getFutureLetterQueue(): Queue<FutureLetterJobData> | null {
  return futureLetterQueueInstance;
}

function requireQueue(): Queue<FutureLetterJobData> {
  if (!futureLetterQueueInstance) throw new Error('Future letter queue is not initialized');
  return futureLetterQueueInstance;
}

/** Enqueue one delayed delivery with a deterministic job id. */
export async function scheduleFutureLetterDelivery(letterId: number, delayMs: number): Promise<void> {
  const queue = requireQueue();
  const jobId = `future-letter-${letterId}`;
  const existing = await queue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'failed' || state === 'completed') {
      // Queue.remove does not throw if concurrent recovery made the job unavailable.
      // The deterministic add below is likewise safe when another instance re-added it first.
      await queue.remove(jobId);
    } else if (state !== 'unknown') {
      loggerService.debug('Future letter delivery already scheduled', { letterId, state });
      return;
    }
  }
  await queue.add(
    'deliver',
    { letterId },
    { jobId, delay: Math.max(0, delayMs) },
  );
  loggerService.debug('Future letter delivery scheduled', { letterId, delayMs: Math.max(0, delayMs) });
}

/** Remove a pending future-letter job. */
export async function removeFutureLetterJob(letterId: number): Promise<void> {
  await requireQueue().remove(`future-letter-${letterId}`);
  loggerService.debug('Future letter delivery removed', { letterId });
}
