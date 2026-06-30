/**
 * Email Trigger Queue
 *
 * 觸發式信件掃描 — 每小時執行一次，
 * 掃描 email_trigger_rules 並對符合條件的用戶寄送信件。
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

// ─── Queue 名稱 ────────────────────────────────────────────────────────────────

export const EMAIL_TRIGGER_QUEUE_NAME = 'email-trigger';

// ─── Job Data 型別 ─────────────────────────────────────────────────────────────

/** 觸發式信件 job data（repeatable，無額外 payload） */
export type EmailTriggerJobData = Record<string, never>;

// ─── Singleton 實例 ────────────────────────────────────────────────────────────

let emailTriggerQueueInstance: Queue<EmailTriggerJobData> | null = null;

export function setEmailTriggerQueue(queue: Queue<EmailTriggerJobData>): void {
  emailTriggerQueueInstance = queue;
}

export function getEmailTriggerQueue(): Queue<EmailTriggerJobData> | null {
  return emailTriggerQueueInstance;
}

// ─── Queue 建立 ────────────────────────────────────────────────────────────────

/**
 * 建立 Email Trigger Queue
 */
export function createEmailTriggerQueue(): Queue<EmailTriggerJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<EmailTriggerJobData>(EMAIL_TRIGGER_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 50, age: 7 * 24 * 60 * 60 },
    },
  });

  loggerService.info('Email trigger queue created', { queueName: EMAIL_TRIGGER_QUEUE_NAME });
  return queue;
}

// ─── 註冊 Repeatable Job ──────────────────────────────────────────────────────

/**
 * 註冊觸發式信件排程 — 每小時整點執行
 */
export async function registerEmailTriggerScheduledJobs(
  queue: Queue<EmailTriggerJobData>,
): Promise<void> {
  await queue.add(
    'email-trigger-scan',
    {},
    {
      repeat: { pattern: '0 * * * *' }, // 每小時整點
      jobId: 'email-trigger-scheduler',
    },
  );

  loggerService.info('Email trigger scheduled job registered', {
    cron: '0 * * * *',
  });
}
