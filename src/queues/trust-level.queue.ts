/**
 * Trust Level Queue
 *
 * 信任等級評估器 — 每日執行一次，
 * 根據 trust_level_configs 的晉升條件評估所有用戶的信任等級。
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

// ─── Queue 名稱 ────────────────────────────────────────────────────────────────

export const TRUST_LEVEL_QUEUE_NAME = 'trust-level';

// ─── Job Data 型別 ─────────────────────────────────────────────────────────────

/** 信任等級評估 job data（repeatable，無額外 payload） */
export type TrustLevelJobData = Record<string, never>;

// ─── Singleton 實例 ────────────────────────────────────────────────────────────

let trustLevelQueueInstance: Queue<TrustLevelJobData> | null = null;

export function setTrustLevelQueue(queue: Queue<TrustLevelJobData>): void {
  trustLevelQueueInstance = queue;
}

export function getTrustLevelQueue(): Queue<TrustLevelJobData> | null {
  return trustLevelQueueInstance;
}

// ─── Queue 建立 ────────────────────────────────────────────────────────────────

/**
 * 建立 Trust Level Queue
 */
export function createTrustLevelQueue(): Queue<TrustLevelJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<TrustLevelJobData>(TRUST_LEVEL_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 50, age: 7 * 24 * 60 * 60 },
    },
  });

  loggerService.info('Trust level queue created', { queueName: TRUST_LEVEL_QUEUE_NAME });
  return queue;
}

// ─── 註冊 Repeatable Job ──────────────────────────────────────────────────────

/**
 * 註冊信任等級評估排程 — 每日 03:00 UTC（= 11:00 UTC+8）
 */
export async function registerTrustLevelScheduledJobs(
  queue: Queue<TrustLevelJobData>,
): Promise<void> {
  await queue.add(
    'trust-level-evaluate',
    {},
    {
      repeat: { pattern: '0 3 * * *' }, // 每日 03:00 UTC = 11:00 UTC+8
      jobId: 'trust-level-scheduler',
    },
  );

  loggerService.info('Trust level scheduled job registered', {
    cron: '0 3 * * * (UTC) = 11:00 UTC+8',
  });
}
