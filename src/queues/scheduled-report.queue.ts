/**
 * Scheduled Report Queue
 *
 * 排程報表產生器 — 每日 06:00 UTC+8（= 22:00 UTC 前一天）執行，
 * 根據頻率設定（daily / weekly / monthly）產生報表並寄送。
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

// ─── Queue 名稱 ────────────────────────────────────────────────────────────────

export const SCHEDULED_REPORT_QUEUE_NAME = 'scheduled-report';

// ─── Job Data 型別 ─────────────────────────────────────────────────────────────

/** 排程報表 job data（repeatable，無額外 payload） */
export type ScheduledReportJobData = Record<string, never>;

// ─── Singleton 實例 ────────────────────────────────────────────────────────────

let scheduledReportQueueInstance: Queue<ScheduledReportJobData> | null = null;

export function setScheduledReportQueue(queue: Queue<ScheduledReportJobData>): void {
  scheduledReportQueueInstance = queue;
}

export function getScheduledReportQueue(): Queue<ScheduledReportJobData> | null {
  return scheduledReportQueueInstance;
}

// ─── Queue 建立 ────────────────────────────────────────────────────────────────

/**
 * 建立 Scheduled Report Queue
 */
export function createScheduledReportQueue(): Queue<ScheduledReportJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<ScheduledReportJobData>(SCHEDULED_REPORT_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 50, age: 7 * 24 * 60 * 60 },
    },
  });

  loggerService.info('Scheduled report queue created', { queueName: SCHEDULED_REPORT_QUEUE_NAME });
  return queue;
}

// ─── 註冊 Repeatable Job ──────────────────────────────────────────────────────

/**
 * 註冊排程報表排程 — 每日 06:00 UTC+8 = 22:00 UTC（前一天）
 */
export async function registerScheduledReportScheduledJobs(
  queue: Queue<ScheduledReportJobData>,
): Promise<void> {
  await queue.add(
    'scheduled-report-generate',
    {},
    {
      repeat: { pattern: '0 22 * * *' }, // 22:00 UTC = 06:00 UTC+8
      jobId: 'scheduled-report-scheduler',
    },
  );

  loggerService.info('Scheduled report scheduled job registered', {
    cron: '0 22 * * * (UTC) = 06:00 UTC+8',
  });
}
