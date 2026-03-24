/**
 * Social Notification Queue
 *
 * BullMQ 隊列定義，處理社交通知任務（follow、connect、mention 等事件）
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import type { SocialNotificationJob } from '../types/social.types';

export const SOCIAL_NOTIFICATION_QUEUE_NAME = 'social-notification';

/**
 * Singleton Queue 實例（由 server.ts 初始化）
 */
let socialNotificationQueueInstance: Queue<SocialNotificationJob> | null = null;

/**
 * 設定 Queue 實例（由 server.ts 呼叫）
 */
export function setSocialNotificationQueue(queue: Queue<SocialNotificationJob>): void {
  socialNotificationQueueInstance = queue;
}

/**
 * 取得 Queue 實例
 */
export function getSocialNotificationQueue(): Queue<SocialNotificationJob> | null {
  return socialNotificationQueueInstance;
}

/**
 * 建立 Social Notification Queue
 */
export function createSocialNotificationQueue(): Queue<SocialNotificationJob> {
  const connection = getQueueConnection();

  const queue = new Queue<SocialNotificationJob>(SOCIAL_NOTIFICATION_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: {
        count: 1000,
        age: 24 * 60 * 60
      },
      removeOnFail: {
        count: 500,
        age: 7 * 24 * 60 * 60
      }
    }
  });

  return queue;
}

/**
 * 新增社交通知任務（使用 singleton queue）
 * 用於 service 層直接呼叫，不需要傳入 queue 參數
 * Queue 未初始化時（例如測試環境）靜默略過
 */
export async function enqueueSocialNotification(job: SocialNotificationJob): Promise<void> {
  const queue = socialNotificationQueueInstance;
  if (!queue) return;
  await queue.add(job.event, job);
}

/**
 * 批次新增多個社交通知任務（使用 addBulk 減少 Redis round-trips）
 * Queue 未初始化時（例如測試環境）靜默略過
 */
export async function bulkEnqueueSocialNotifications(jobs: SocialNotificationJob[]): Promise<void> {
  const queue = socialNotificationQueueInstance;
  if (!queue || jobs.length === 0) return;
  await queue.addBulk(jobs.map(job => ({
    name: job.event,
    data: job,
  })));
}
