/**
 * Practice Status Queue
 *
 * BullMQ 隊列定義，處理主題實踐狀態自動轉換
 * 每小時檢查到期的實踐並自動標記為完成
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

import { Queue, QueueEvents } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

/**
 * Queue 名稱
 */
export const PRACTICE_STATUS_QUEUE_NAME = 'practice-status';

/**
 * Practice Status Job 資料
 */
export interface PracticeStatusJobData {
  type: 'completion-check';
  triggeredAt: string;
}

/**
 * Singleton Queue 實例（由 server.ts 初始化）
 */
let practiceStatusQueueInstance: Queue<PracticeStatusJobData> | null = null;

/**
 * 設定 Queue 實例（由 server.ts 呼叫）
 */
export function setPracticeStatusQueue(queue: Queue<PracticeStatusJobData>): void {
  practiceStatusQueueInstance = queue;
}

/**
 * 取得 Queue 實例
 */
export function getPracticeStatusQueue(): Queue<PracticeStatusJobData> | null {
  return practiceStatusQueueInstance;
}

/**
 * 建立 Practice Status Queue
 */
export function createPracticeStatusQueue(): Queue<PracticeStatusJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<PracticeStatusJobData>(PRACTICE_STATUS_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000 // 5 秒起始延遲
      },
      removeOnComplete: {
        count: 100, // 保留最近 100 個完成的任務
        age: 24 * 60 * 60 // 保留 24 小時
      },
      removeOnFail: {
        count: 100, // 保留最近 100 個失敗的任務
        age: 7 * 24 * 60 * 60 // 保留 7 天
      }
    }
  });

  loggerService.info('Practice status queue created', { queueName: PRACTICE_STATUS_QUEUE_NAME });

  return queue;
}

/**
 * 建立 Queue Events 監聽器
 */
export function createPracticeStatusQueueEvents(): QueueEvents {
  const connection = getQueueConnection();

  const events = new QueueEvents(PRACTICE_STATUS_QUEUE_NAME, {
    connection
  });

  events.on('completed', ({ jobId }) => {
    loggerService.info('Practice status job completed', { jobId });
  });

  events.on('failed', ({ jobId, failedReason }) => {
    loggerService.error('Practice status job failed', { jobId, reason: failedReason });
  });

  events.on('stalled', ({ jobId }) => {
    loggerService.warn('Practice status job stalled', { jobId });
  });

  return events;
}

/**
 * 註冊排程任務（每小時執行一次）
 * 符合 FRD「以小時計算」的要求
 *
 * 多容器安全：
 * - BullMQ repeatable jobs 使用 jobId 自動去重
 * - 多個容器註冊相同 jobId 的排程任務，Redis 中只會保留一份
 * - 可透過 DISABLE_SCHEDULED_JOBS=true 環境變數禁用排程註冊
 */
export async function registerPracticeStatusScheduledJobs(
  queue: Queue<PracticeStatusJobData>
): Promise<void> {
  // 允許透過環境變數禁用排程（例如只讓特定容器註冊）
  if (process.env.DISABLE_SCHEDULED_JOBS === 'true') {
    loggerService.info('Practice status scheduled jobs registration skipped (DISABLE_SCHEDULED_JOBS=true)');
    return;
  }

  // 每小時 0 分執行完成檢查
  // 使用固定的 jobId 確保多容器環境下只有一個排程任務
  await queue.add(
    'completion-check',
    {
      type: 'completion-check',
      triggeredAt: new Date().toISOString()
    },
    {
      repeat: {
        pattern: '0 * * * *', // 每小時 0 分
        tz: 'Asia/Taipei'
      },
      jobId: 'practice-completion-checker' // 固定 ID，BullMQ 自動去重
    }
  );

  loggerService.info('Practice status scheduled jobs registered', {
    pattern: '0 * * * *',
    timezone: 'Asia/Taipei',
    note: 'BullMQ automatically deduplicates repeatable jobs with same jobId'
  });
}

/**
 * 手動觸發完成檢查（用於測試或維護）
 */
export async function triggerCompletionCheck(
  queue: Queue<PracticeStatusJobData>
): Promise<string> {
  const job = await queue.add(
    'manual-completion-check',
    {
      type: 'completion-check',
      triggeredAt: new Date().toISOString()
    },
    {
      jobId: `manual-completion-check-${Date.now()}`
    }
  );

  loggerService.info('Manual completion check triggered', { jobId: job.id });

  return job.id ?? '';
}

/**
 * 取得隊列統計
 */
export async function getPracticeStatusQueueStats(queue: Queue<PracticeStatusJobData>): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);

  return { waiting, active, completed, failed, delayed };
}
