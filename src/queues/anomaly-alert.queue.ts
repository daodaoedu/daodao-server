/**
 * Anomaly Alert Queue
 *
 * 告警檢查器 — 每 5 分鐘執行一次，
 * 掃描 alert_rules 並在指標超過閾值時觸發告警。
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

// ─── Queue 名稱 ────────────────────────────────────────────────────────────────

export const ANOMALY_ALERT_QUEUE_NAME = 'anomaly-alert';

// ─── Job Data 型別 ─────────────────────────────────────────────────────────────

/** 告警檢查 job data（repeatable，無額外 payload） */
export type AnomalyAlertJobData = Record<string, never>;

// ─── Singleton 實例 ────────────────────────────────────────────────────────────

let anomalyAlertQueueInstance: Queue<AnomalyAlertJobData> | null = null;

export function setAnomalyAlertQueue(queue: Queue<AnomalyAlertJobData>): void {
  anomalyAlertQueueInstance = queue;
}

export function getAnomalyAlertQueue(): Queue<AnomalyAlertJobData> | null {
  return anomalyAlertQueueInstance;
}

// ─── Queue 建立 ────────────────────────────────────────────────────────────────

/**
 * 建立 Anomaly Alert Queue
 */
export function createAnomalyAlertQueue(): Queue<AnomalyAlertJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<AnomalyAlertJobData>(ANOMALY_ALERT_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 200, age: 24 * 60 * 60 },
      removeOnFail: { count: 100, age: 7 * 24 * 60 * 60 },
    },
  });

  loggerService.info('Anomaly alert queue created', { queueName: ANOMALY_ALERT_QUEUE_NAME });
  return queue;
}

// ─── 註冊 Repeatable Job ──────────────────────────────────────────────────────

/**
 * 註冊告警檢查排程 — 每 5 分鐘執行
 */
export async function registerAnomalyAlertScheduledJobs(
  queue: Queue<AnomalyAlertJobData>,
): Promise<void> {
  await queue.add(
    'anomaly-alert-check',
    {},
    {
      repeat: { pattern: '*/5 * * * *' }, // 每 5 分鐘
      jobId: 'anomaly-alert-scheduler',
    },
  );

  loggerService.info('Anomaly alert scheduled job registered', {
    cron: '*/5 * * * *',
  });
}
