/**
 * Practice Status Worker
 *
 * BullMQ Worker 處理主題實踐狀態自動轉換任務
 * 每小時檢查到期的實踐並自動標記為完成
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { PRACTICE_STATUS_QUEUE_NAME } from './practice-status.queue';
import type { PracticeStatusJobData } from './practice-status.queue';

/**
 * Worker 選項
 */
export interface PracticeStatusWorkerOptions {
  concurrency?: number;
}

/**
 * 預設 Worker 選項
 */
const defaultOptions: PracticeStatusWorkerOptions = {
  concurrency: 1 // 狀態檢查任務不需要高併發
};

/**
 * 處理狀態檢查任務
 */
async function processStatusJob(job: Job<PracticeStatusJobData>): Promise<{
  completedCount: number;
  practiceIds: number[];
}> {
  const { type, triggeredAt } = job.data;

  loggerService.info('Processing practice status job', {
    jobId: job.id,
    type,
    triggeredAt
  });

  try {
    if (type === 'completion-check') {
      // 動態 import 避免循環依賴
      const { completeExpiredPractices } = await import('../services/practice.service');
      const result = await completeExpiredPractices();

      loggerService.info('Practice status job completed', {
        jobId: job.id,
        completedCount: result.completedCount,
        practiceIds: result.practiceIds
      });

      return result;
    }

    loggerService.warn('Unknown practice status job type', { type });
    return { completedCount: 0, practiceIds: [] };

  } catch (error) {
    loggerService.error('Practice status job failed', {
      jobId: job.id,
      type,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * 建立並啟動 Worker
 */
export function createPracticeStatusWorker(
  options?: PracticeStatusWorkerOptions
): Worker<PracticeStatusJobData> {
  const connection = getQueueConnection();
  const finalOptions = { ...defaultOptions, ...options };

  const worker = new Worker<PracticeStatusJobData>(
    PRACTICE_STATUS_QUEUE_NAME,
    processStatusJob,
    {
      connection,
      concurrency: finalOptions.concurrency
    }
  );

  // 事件處理
  worker.on('completed', (job, result) => {
    loggerService.debug('Worker completed job', {
      jobId: job.id,
      completedCount: result?.completedCount ?? 0
    });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('Worker job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    loggerService.error('Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('Worker job stalled', { jobId });
  });

  loggerService.info('Practice status worker started', {
    concurrency: finalOptions.concurrency
  });

  return worker;
}

/**
 * 關閉 Worker
 */
export async function closePracticeStatusWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('Practice status worker closed');
}
