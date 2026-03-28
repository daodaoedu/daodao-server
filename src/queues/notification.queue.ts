/**
 * Notification Batch Queues
 *
 * 定義 3 個通知批次 repeatable queue：
 * - notification-inapp：每小時整點處理 P1/P2 in-app 通知
 * - notification-email：每日 08:00 / 12:00 / 16:00 / 20:00 發送 email 摘要
 * - notification-weekly：每週日 20:00 UTC+8（= 12:00 UTC）發送週報
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

// ─── Queue 名稱 ────────────────────────────────────────────────────────────────

export const NOTIFICATION_INAPP_QUEUE_NAME = 'notification-inapp';
export const NOTIFICATION_EMAIL_QUEUE_NAME = 'notification-email';
export const NOTIFICATION_WEEKLY_QUEUE_NAME = 'notification-weekly';

// ─── Job Data 型別 ─────────────────────────────────────────────────────────────

/** In-App 批次 job data（repeatable，無額外 payload） */
export type NotificationInAppJobData = Record<string, never>;

/** Email 批次 job data（repeatable，無額外 payload） */
export type NotificationEmailJobData = Record<string, never>;

/** 週報 job data（repeatable，無額外 payload） */
export type NotificationWeeklyJobData = Record<string, never>;

// ─── Singleton 實例 ────────────────────────────────────────────────────────────

let notificationInAppQueueInstance: Queue<NotificationInAppJobData> | null = null;
let notificationEmailQueueInstance: Queue<NotificationEmailJobData> | null = null;
let notificationWeeklyQueueInstance: Queue<NotificationWeeklyJobData> | null = null;

// ─── In-App Queue ──────────────────────────────────────────────────────────────

export function setNotificationInAppQueue(queue: Queue<NotificationInAppJobData>): void {
  notificationInAppQueueInstance = queue;
}

export function getNotificationInAppQueue(): Queue<NotificationInAppJobData> | null {
  return notificationInAppQueueInstance;
}

export function createNotificationInAppQueue(): Queue<NotificationInAppJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<NotificationInAppJobData>(NOTIFICATION_INAPP_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 50, age: 7 * 24 * 60 * 60 }
    }
  });

  loggerService.info('Notification in-app queue created', { queueName: NOTIFICATION_INAPP_QUEUE_NAME });
  return queue;
}

// ─── Email Queue ───────────────────────────────────────────────────────────────

export function setNotificationEmailQueue(queue: Queue<NotificationEmailJobData>): void {
  notificationEmailQueueInstance = queue;
}

export function getNotificationEmailQueue(): Queue<NotificationEmailJobData> | null {
  return notificationEmailQueueInstance;
}

export function createNotificationEmailQueue(): Queue<NotificationEmailJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<NotificationEmailJobData>(NOTIFICATION_EMAIL_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 50, age: 7 * 24 * 60 * 60 }
    }
  });

  loggerService.info('Notification email queue created', { queueName: NOTIFICATION_EMAIL_QUEUE_NAME });
  return queue;
}

// ─── Weekly Queue ──────────────────────────────────────────────────────────────

export function setNotificationWeeklyQueue(queue: Queue<NotificationWeeklyJobData>): void {
  notificationWeeklyQueueInstance = queue;
}

export function getNotificationWeeklyQueue(): Queue<NotificationWeeklyJobData> | null {
  return notificationWeeklyQueueInstance;
}

export function createNotificationWeeklyQueue(): Queue<NotificationWeeklyJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<NotificationWeeklyJobData>(NOTIFICATION_WEEKLY_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 50, age: 7 * 24 * 60 * 60 }
    }
  });

  loggerService.info('Notification weekly queue created', { queueName: NOTIFICATION_WEEKLY_QUEUE_NAME });
  return queue;
}

// ─── 註冊 Repeatable Jobs ──────────────────────────────────────────────────────

/**
 * 為三個 queue 各自註冊 repeatable cron job。
 * 此函式由 server.ts 在啟動時呼叫一次。
 */
export async function registerNotificationScheduledJobs(
  inAppQueue: Queue<NotificationInAppJobData>,
  emailQueue: Queue<NotificationEmailJobData>,
  weeklyQueue: Queue<NotificationWeeklyJobData>
): Promise<void> {
  // 每分鐘（P1/P2 in-app 通知）
  await inAppQueue.add(
    'notification-inapp-batch',
    {},
    {
      repeat: { pattern: '0 * * * *' },
      jobId: 'notification-inapp-scheduler'
    }
  );

  // 每日 08:00, 12:00, 16:00, 20:00 UTC+8
  // BullMQ 使用 UTC，UTC+8 08/12/16/20 = UTC 00/04/08/12
  await emailQueue.add(
    'notification-email-batch',
    {},
    {
      repeat: { pattern: '0 0,4,8,12 * * *' },
      jobId: 'notification-email-scheduler'
    }
  );

  // 每週日 20:00 UTC+8 = 12:00 UTC
  await weeklyQueue.add(
    'notification-weekly-batch',
    {},
    {
      repeat: { pattern: '0 12 * * 0' },
      jobId: 'notification-weekly-scheduler'
    }
  );

  loggerService.info('Notification scheduled jobs registered', {
    inApp: '* * * * *',
    email: '0 8,12,16,20 * * *',
    weekly: '0 12 * * 0'
  });
}
