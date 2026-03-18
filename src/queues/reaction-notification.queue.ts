/**
 * Reaction Notification Queue
 *
 * BullMQ 隊列定義，處理 reaction 通知任務。
 * 使用 jobId 去重：同一 practice 在1小時內只會保留一個最新的 job，
 * 避免對同一實踐重複發送通知。
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';

export const REACTION_NOTIFICATION_QUEUE_NAME = 'reaction-notification';

/** 延遲發送時間（毫秒）：1小時，讓反應在此期間累積 */
const REACTION_NOTIFICATION_DELAY_MS = 3600000;

// ─── Job 型別 ──────────────────────────────────────────────────────────────────

export interface ReactionNotificationJob {
  practiceId: number;
  actorUserId: number;
  practiceOwnerId: number;
  practiceTitle: string;
  reactionType: string;
  totalReactionCount: number;
}

// ─── Singleton Queue 實例 ──────────────────────────────────────────────────────

/**
 * Singleton Queue 實例（由 server.ts 初始化）
 */
let reactionNotificationQueueInstance: Queue<ReactionNotificationJob> | null = null;

/**
 * 設定 Queue 實例（由 server.ts 呼叫）
 */
export function setReactionNotificationQueue(queue: Queue<ReactionNotificationJob>): void {
  reactionNotificationQueueInstance = queue;
}

/**
 * 取得 Queue 實例
 */
export function getReactionNotificationQueue(): Queue<ReactionNotificationJob> | null {
  return reactionNotificationQueueInstance;
}

// ─── Queue 建立 ────────────────────────────────────────────────────────────────

/**
 * 建立 Reaction Notification Queue
 */
export function createReactionNotificationQueue(): Queue<ReactionNotificationJob> {
  const connection = getQueueConnection();

  const queue = new Queue<ReactionNotificationJob>(REACTION_NOTIFICATION_QUEUE_NAME, {
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

// ─── Enqueue 輔助函式 ──────────────────────────────────────────────────────────

/**
 * 新增 reaction 通知任務（使用 singleton queue）
 *
 * 使用固定 jobId `reaction-notification-{practiceId}` 確保去重：
 * BullMQ 若已存在相同 jobId 的 delayed job，不會重複新增，
 * 讓最後一次 reaction 的資料（totalReactionCount 等）覆蓋舊 job。
 *
 * Queue 未初始化時（例如測試環境）靜默略過。
 */
export async function enqueueReactionNotification(job: ReactionNotificationJob): Promise<void> {
  const queue = reactionNotificationQueueInstance;
  if (!queue) {
    // Queue not initialized (e.g., in test env), skip silently
    return;
  }

  const jobId = `reaction-notification-${job.practiceId}`;

  await queue.add('reaction.notified', job, {
    jobId,
    delay: REACTION_NOTIFICATION_DELAY_MS,
    removeOnComplete: true,
  });
}
