/**
 * Onboarding Email Queue
 *
 * BullMQ 隊列：處理 Onboarding 序列 Email 發送。
 * jobId = `${emailType}-${userId}` 達成 BullMQ 層級冪等。
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import type { OnboardingEmailJobData } from '../types/email/onboarding.types';
import type { OnboardingTask, UserSource } from '../types/onboarding.types';
import { TASK_EMAIL_MAP } from '../types/onboarding.types';

export const ONBOARDING_EMAIL_QUEUE_NAME = 'onboarding-email';

let onboardingEmailQueueInstance: Queue<OnboardingEmailJobData> | null = null;

export function setOnboardingEmailQueue(queue: Queue<OnboardingEmailJobData>): void {
  onboardingEmailQueueInstance = queue;
}

export function getOnboardingEmailQueue(): Queue<OnboardingEmailJobData> | null {
  return onboardingEmailQueueInstance;
}

export function createOnboardingEmailQueue(): Queue<OnboardingEmailJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<OnboardingEmailJobData>(ONBOARDING_EMAIL_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
      removeOnFail: { count: 500, age: 7 * 24 * 60 * 60 },
    },
  });

  loggerService.info('Onboarding email queue created', { queueName: ONBOARDING_EMAIL_QUEUE_NAME });
  return queue;
}

/**
 * 推送 Onboarding email job（使用 jobId 冪等）。
 * 供 onboardingService.checkAndAdvance 呼叫。
 *
 * @param opts.delayMs - 延遲毫秒數（BullMQ delayed job）
 */
export async function enqueueOnboardingEmail(
  taskKey: OnboardingTask,
  userId: number,
  userSource: UserSource,
  opts?: { delayMs?: number }
): Promise<string | null> {
  const queue = onboardingEmailQueueInstance;
  if (!queue) {
    loggerService.warn('Onboarding email queue not initialized', { taskKey, userId });
    return null;
  }

  const emailType = TASK_EMAIL_MAP[taskKey];
  if (!emailType) return null;

  const jobData: OnboardingEmailJobData = { userId, emailType, userSource };
  const jobId = `${emailType}-${userId}`;

  const job = await queue.add(`${emailType}-${userId}`, jobData, {
    jobId,
    ...(opts?.delayMs ? { delay: opts.delayMs } : {}),
  });
  loggerService.info('Onboarding email job enqueued', { jobId: job.id, emailType, userId, delayMs: opts?.delayMs });
  return job.id ?? null;
}

/**
 * 推送 L0 歡迎信（新用戶建立時呼叫）。
 */
export async function enqueueOnboardingL0Email(
  userId: number,
  userSource: UserSource
): Promise<string | null> {
  const queue = onboardingEmailQueueInstance;
  if (!queue) {
    loggerService.warn('Onboarding email queue not initialized for L0', { userId });
    return null;
  }

  const jobData: OnboardingEmailJobData = { userId, emailType: 'L0', userSource };
  const jobId = `L0-${userId}`;

  const job = await queue.add(`L0-${userId}`, jobData, { jobId });
  loggerService.info('Onboarding L0 email job enqueued', { jobId: job.id, userId });
  return job.id ?? null;
}
