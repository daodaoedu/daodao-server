/**
 * Badge Award Queue
 *
 * 徽章自動頒發器 — 每小時執行一次，
 * 掃描 trigger_type = 'auto' 的徽章並對符合條件的用戶自動頒發。
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

// ─── Queue 名稱 ────────────────────────────────────────────────────────────────

export const BADGE_AWARD_QUEUE_NAME = 'badge-award';

// ─── Job Data 型別 ─────────────────────────────────────────────────────────────

/** 徽章自動頒發 job data（repeatable，無額外 payload） */
export type BadgeAwardJobData = Record<string, never>;

// ─── Singleton 實例 ────────────────────────────────────────────────────────────

let badgeAwardQueueInstance: Queue<BadgeAwardJobData> | null = null;

export function setBadgeAwardQueue(queue: Queue<BadgeAwardJobData>): void {
  badgeAwardQueueInstance = queue;
}

export function getBadgeAwardQueue(): Queue<BadgeAwardJobData> | null {
  return badgeAwardQueueInstance;
}

// ─── Queue 建立 ────────────────────────────────────────────────────────────────

/**
 * 建立 Badge Award Queue
 */
export function createBadgeAwardQueue(): Queue<BadgeAwardJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<BadgeAwardJobData>(BADGE_AWARD_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 50, age: 7 * 24 * 60 * 60 },
    },
  });

  loggerService.info('Badge award queue created', { queueName: BADGE_AWARD_QUEUE_NAME });
  return queue;
}

// ─── 註冊 Repeatable Job ──────────────────────────────────────────────────────

/**
 * 註冊徽章自動頒發排程 — 每小時整點執行
 */
export async function registerBadgeAwardScheduledJobs(
  queue: Queue<BadgeAwardJobData>,
): Promise<void> {
  await queue.add(
    'badge-award-scan',
    {},
    {
      repeat: { pattern: '0 * * * *' }, // 每小時整點
      jobId: 'badge-award-scheduler',
    },
  );

  loggerService.info('Badge award scheduled job registered', {
    cron: '0 * * * *',
  });
}
