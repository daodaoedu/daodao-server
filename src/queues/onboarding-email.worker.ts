/**
 * Onboarding Email Worker
 *
 * 處理 Onboarding email 任務：
 * 1. 進入後二次檢查 email_states（防 BullMQ 重試重複送出）
 * 2. 發送 email
 * 3. 更新 email_states
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { ONBOARDING_EMAIL_QUEUE_NAME } from './onboarding-email.queue';
import { prisma } from '../services/database/prisma.service';
import type { OnboardingEmailJobData } from '../types/email/onboarding.types';

async function processJob(job: Job<OnboardingEmailJobData>): Promise<void> {
  const { userId, emailType, userSource } = job.data;

  loggerService.info('Processing onboarding email job', { jobId: job.id, emailType, userId });

  // 二次防護：讀取 email_states，已發送則跳過
  const rows = await prisma.$queryRaw<Array<{ email_states: Record<string, string> }>>`
    SELECT email_states FROM user_onboarding WHERE user_id = ${userId} LIMIT 1
  `;

  const emailStates = rows[0]?.email_states ?? {};
  if (emailStates[emailType] === 'sent') {
    loggerService.info('Onboarding email already sent, skipping', { userId, emailType });
    return;
  }

  // 發送 email
  const { sendOnboardingTaskEmail } = await import('../services/email/onboarding-email.service');
  await sendOnboardingTaskEmail(userId, emailType, userSource);

  // 更新 email_states
  const updatedStates = { ...emailStates, [emailType]: 'sent' };
  await prisma.$executeRaw`
    UPDATE user_onboarding
    SET email_states = ${JSON.stringify(updatedStates)}::jsonb, updated_at = NOW()
    WHERE user_id = ${userId}
  `;

  loggerService.info('Onboarding email sent and state updated', { userId, emailType });
}

export function createOnboardingEmailWorker(): Worker<OnboardingEmailJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<OnboardingEmailJobData>(
    ONBOARDING_EMAIL_QUEUE_NAME,
    processJob,
    { connection, concurrency: 5 }
  );

  worker.on('completed', (job) => loggerService.debug('Onboarding email job completed', { jobId: job.id }));
  worker.on('failed', (job, error) => loggerService.error('Onboarding email job failed', { jobId: job?.id, error: error.message }));
  worker.on('error', (error) => loggerService.error('Onboarding email worker error', { error: error.message }));

  loggerService.info('Onboarding email worker started');
  return worker;
}

export async function closeOnboardingEmailWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('Onboarding email worker closed');
}
