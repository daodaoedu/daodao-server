/**
 * Challenge Email Worker
 *
 * 處理共同挑戰信件任務：每小時掃描補寄排程節點、加入時的 welcome 信。
 * 冪等由 email_logs 查重保證，重試安全。
 */

import { Worker } from 'bullmq';
import { getQueueConnection } from './connection';
import { CHALLENGE_EMAIL_QUEUE_NAME, type ChallengeEmailJobData } from './challenge-email.queue';
import { loggerService } from '../services/logging/logger.service';

export interface ChallengeEmailWorkerOptions {
  concurrency?: number;
}

let challengeEmailWorkerInstance: Worker<ChallengeEmailJobData> | null = null;

/** 建立 Challenge Email Worker */
export function createChallengeEmailWorker(options: ChallengeEmailWorkerOptions = {}): Worker<ChallengeEmailJobData> {
  const worker = new Worker<ChallengeEmailJobData>(
    CHALLENGE_EMAIL_QUEUE_NAME,
    async job => {
      const { challengeEmailService } = await import('../services/email/challenge-email.service');
      if (job.data.type === 'scan') {
        await challengeEmailService.sendPendingChallengeEmails();
        return;
      }
      await challengeEmailService.sendChallengeNodeEmail('welcome', job.data.cohortId, job.data.userId);
    },
    { connection: getQueueConnection(), concurrency: options.concurrency ?? 1 }
  );

  worker.on('failed', (job, error) => {
    loggerService.error('Challenge email job failed', { jobId: job?.id, data: job?.data, error: error.message });
  });

  challengeEmailWorkerInstance = worker;
  loggerService.info('Challenge email worker created', { queueName: CHALLENGE_EMAIL_QUEUE_NAME });
  return worker;
}

/** 關閉 Worker（graceful shutdown 用） */
export async function closeChallengeEmailWorker(): Promise<void> {
  if (challengeEmailWorkerInstance) {
    await challengeEmailWorkerInstance.close();
    challengeEmailWorkerInstance = null;
  }
}
