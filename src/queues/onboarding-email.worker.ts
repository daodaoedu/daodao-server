/**
 * Onboarding Email Worker
 *
 * 處理 Onboarding email 任務：
 * 1. 進入後二次檢查 email_states（防 BullMQ 重試重複送出）
 * 2. 發送 email
 * 3. 更新 email_states
 *
 * sequenceMode：時間驅動序列模式
 * - 發送前檢查 task 是否已完成（已完成就跳過）
 * - 找到真正需要提醒的 task 寄出
 * - 寄出後排程下一封（24 小時延遲）
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { ONBOARDING_EMAIL_QUEUE_NAME } from './onboarding-email.queue';
import { prisma } from '../services/database/prisma.service';
import { TASK_ORDER_BY_SOURCE, TASK_EMAIL_MAP, UserSource } from '../types/onboarding.types';
import type { OnboardingEmailJobData } from '../types/email/onboarding.types';
import type { OnboardingEmailType } from '../types/email/onboarding.types';

const SEQUENCE_NEXT_DELAY_MS = 24 * 60 * 60 * 1000;

interface OnboardingRow {
  task_states: Record<string, string>;
  email_states: Record<string, string>;
  user_source: string;
  badge_granted: boolean;
}

async function processJob(job: Job<OnboardingEmailJobData>): Promise<void> {
  const { userId, emailType, userSource, sequenceMode } = job.data;

  loggerService.info('Processing onboarding email job', {
    jobId: job.id,
    emailType,
    userId,
    sequenceMode: !!sequenceMode,
  });

  if (sequenceMode) {
    await processSequenceJob(userId, userSource as UserSource);
    return;
  }

  await sendSingleEmail(userId, emailType, userSource as UserSource);
}

/** 直接發送指定類型的 email（原有行為） */
async function sendSingleEmail(
  userId: number,
  emailType: OnboardingEmailType,
  userSource: UserSource
): Promise<void> {
  const emailPatch = JSON.stringify({ [emailType]: 'sent' });
  const claimed = await prisma.$executeRaw`
    UPDATE user_onboarding
    SET email_states = email_states || ${emailPatch}::jsonb,
        updated_at   = NOW()
    WHERE user_id = ${userId}
      AND (email_states->>${emailType}) IS DISTINCT FROM 'sent'
  `;

  if (claimed === 0) {
    loggerService.info('Onboarding email already sent, skipping', { userId, emailType });
    return;
  }

  const { sendOnboardingTaskEmail } = await import('../services/email/onboarding-email.service');
  await sendOnboardingTaskEmail(userId, emailType, userSource);

  loggerService.info('Onboarding email sent', { userId, emailType });
}

/**
 * 序列模式：依 task order 找下一個未完成且未寄信的 task，寄出提醒，再排程下一封。
 */
async function processSequenceJob(userId: number, userSource: UserSource): Promise<void> {
  const rows = await prisma.$queryRaw<OnboardingRow[]>`
    SELECT task_states, email_states, user_source, badge_granted
    FROM user_onboarding
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    loggerService.warn('Onboarding sequence: no record found', { userId });
    return;
  }

  if (row.badge_granted) {
    loggerService.info('Onboarding sequence: all tasks completed, stopping', { userId });
    return;
  }

  const source = (row.user_source as UserSource) || userSource;
  const order = TASK_ORDER_BY_SOURCE[source] ?? TASK_ORDER_BY_SOURCE[UserSource.S1];
  const taskStates = row.task_states ?? {};
  const emailStates = row.email_states ?? {};

  const nextTask = order.find(
    (taskKey) => taskStates[taskKey] !== 'done' && emailStates[TASK_EMAIL_MAP[taskKey] ?? ''] !== 'sent'
  );

  if (!nextTask) {
    loggerService.info('Onboarding sequence: no pending task to remind, stopping', { userId });
    return;
  }

  const emailType = TASK_EMAIL_MAP[nextTask];
  if (!emailType) return;

  try {
    await sendSingleEmail(userId, emailType, source);
  } finally {
    // 不論發送成功或失敗都排程下一封，確保序列鏈不中斷
    const { enqueueNextSequenceEmail } = await import('./onboarding-email.queue');
    await enqueueNextSequenceEmail(userId, source, SEQUENCE_NEXT_DELAY_MS);

    loggerService.info('Onboarding sequence: next email scheduled', {
      userId,
      sentEmailType: emailType,
      nextDelayMs: SEQUENCE_NEXT_DELAY_MS,
    });
  }
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
