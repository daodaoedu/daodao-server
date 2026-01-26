/**
 * Practice Email Queue
 *
 * BullMQ 隊列定義，處理主題實踐相關的郵件發送
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

import { Queue, QueueEvents } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import type {
  PracticeEmailCode,
  PracticeEmailJobData
} from '../types/email/practice.types';
import { DEFAULT_EMAIL_SCHEDULES } from '../types/email/practice.types';

/**
 * Queue 名稱
 */
export const PRACTICE_EMAIL_QUEUE_NAME = 'practice-email';

/**
 * Singleton Queue 實例（由 server.ts 初始化）
 */
let practiceEmailQueueInstance: Queue<PracticeEmailJobData> | null = null;

/**
 * 設定 Queue 實例（由 server.ts 呼叫）
 */
export function setPracticeEmailQueue(queue: Queue<PracticeEmailJobData>): void {
  practiceEmailQueueInstance = queue;
}

/**
 * 取得 Queue 實例
 */
export function getPracticeEmailQueue(): Queue<PracticeEmailJobData> | null {
  return practiceEmailQueueInstance;
}

/**
 * 簡化版：新增郵件任務（使用 singleton queue）
 * 用於 service 層直接呼叫，不需要傳入 queue 參數
 */
export async function enqueuePracticeEmail(
  emailCode: PracticeEmailCode,
  practiceId: number,
  userId: number,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const queue = practiceEmailQueueInstance;

  if (!queue) {
    loggerService.warn('Practice email queue not initialized, skipping email job', {
      emailCode,
      practiceId,
      userId
    });
    return null;
  }

  return addPracticeEmailJob(queue, emailCode, practiceId, userId, metadata);
}

/**
 * 建立 Practice Email Queue
 */
export function createPracticeEmailQueue(): Queue<PracticeEmailJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<PracticeEmailJobData>(PRACTICE_EMAIL_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000 // 5 秒起始延遲
      },
      removeOnComplete: {
        count: 1000, // 保留最近 1000 個完成的任務
        age: 24 * 60 * 60 // 保留 24 小時
      },
      removeOnFail: {
        count: 500, // 保留最近 500 個失敗的任務
        age: 7 * 24 * 60 * 60 // 保留 7 天
      }
    }
  });

  loggerService.info('Practice email queue created', { queueName: PRACTICE_EMAIL_QUEUE_NAME });

  return queue;
}

/**
 * 建立 Queue Events 監聽器
 */
export function createQueueEvents(): QueueEvents {
  const connection = getQueueConnection();

  const events = new QueueEvents(PRACTICE_EMAIL_QUEUE_NAME, {
    connection
  });

  events.on('completed', ({ jobId }) => {
    loggerService.info('Practice email job completed', { jobId });
  });

  events.on('failed', ({ jobId, failedReason }) => {
    loggerService.error('Practice email job failed', { jobId, reason: failedReason });
  });

  events.on('stalled', ({ jobId }) => {
    loggerService.warn('Practice email job stalled', { jobId });
  });

  return events;
}

/**
 * 計算當前週次（用於週報去重）
 */
function getCurrentWeekNumber(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * 生成去重用的 jobId
 * - PE01/PE02（即時郵件）：每個實踐只發一次
 * - PE03-PE06（週報）：每週每個實踐只發一次
 * - PE07/PE08（結束總結）：每個實踐只發一次
 */
function generateJobId(emailCode: PracticeEmailCode, practiceId: number): string {
  // 週報郵件加上週次，確保每週只發一次
  if (['PE03', 'PE04', 'PE05', 'PE06'].includes(emailCode)) {
    return `${emailCode}-${practiceId}-${getCurrentWeekNumber()}`;
  }
  // 其他郵件類型，每個實踐只發一次
  return `${emailCode}-${practiceId}`;
}

/**
 * 新增郵件任務到隊列
 * 使用 jobId 實現去重，相同 ID 的任務不會重複加入
 */
export async function addPracticeEmailJob(
  queue: Queue<PracticeEmailJobData>,
  emailCode: PracticeEmailCode,
  practiceId: number,
  userId: number,
  metadata?: Record<string, unknown>
): Promise<string> {
  const jobData: PracticeEmailJobData = {
    emailCode,
    practiceId,
    userId,
    metadata
  };

  const jobId = generateJobId(emailCode, practiceId);

  const job = await queue.add(
    `${emailCode}-${practiceId}`,
    jobData,
    {
      jobId // 相同 ID 不會重複加入隊列
    }
  );

  loggerService.info('Practice email job added', {
    jobId: job.id,
    emailCode,
    practiceId,
    userId
  });

  return job.id ?? '';
}

/**
 * 新增延遲郵件任務
 * 使用 jobId 實現去重，相同 ID 的任務不會重複加入
 */
export async function addDelayedPracticeEmailJob(
  queue: Queue<PracticeEmailJobData>,
  emailCode: PracticeEmailCode,
  practiceId: number,
  userId: number,
  delayMs: number,
  metadata?: Record<string, unknown>
): Promise<string> {
  const jobData: PracticeEmailJobData = {
    emailCode,
    practiceId,
    userId,
    metadata
  };

  const jobId = generateJobId(emailCode, practiceId);

  const job = await queue.add(
    `${emailCode}-${practiceId}-delayed`,
    jobData,
    {
      jobId, // 相同 ID 不會重複加入隊列
      delay: delayMs
    }
  );

  loggerService.info('Delayed practice email job added', {
    jobId: job.id,
    emailCode,
    practiceId,
    userId,
    delayMs
  });

  return job.id ?? '';
}

/**
 * 註冊週期性任務（使用 BullMQ Repeatable Jobs）
 */
export async function registerScheduledJobs(
  queue: Queue<PracticeEmailJobData>,
  schedules: typeof DEFAULT_EMAIL_SCHEDULES
): Promise<void> {
  // 週報任務
  await queue.add(
    'weekly-summary-trigger',
    {
      emailCode: 'PE03', // 會在 worker 中決定實際發送哪種週報
      practiceId: 0,
      userId: 0,
      metadata: { type: 'weekly-summary' }
    },
    {
      repeat: {
        pattern: schedules['weekly-summary'].cron,
        tz: schedules['weekly-summary'].timezone
      },
      jobId: 'weekly-summary-scheduler'
    }
  );

  // 結束總結任務
  await queue.add(
    'final-summary-trigger',
    {
      emailCode: 'PE07', // 會在 worker 中決定實際發送哪種結束郵件
      practiceId: 0,
      userId: 0,
      metadata: { type: 'final-summary' }
    },
    {
      repeat: {
        pattern: schedules['final-summary'].cron,
        tz: schedules['final-summary'].timezone
      },
      jobId: 'final-summary-scheduler'
    }
  );

  loggerService.info('Scheduled jobs registered', {
    weeklySummary: schedules['weekly-summary'].cron,
    finalSummary: schedules['final-summary'].cron
  });
}

/**
 * 取得隊列統計
 */
export async function getQueueStats(queue: Queue<PracticeEmailJobData>): Promise<{
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

/**
 * 清空隊列（用於測試或維護）
 */
export async function cleanQueue(queue: Queue<PracticeEmailJobData>): Promise<void> {
  await queue.obliterate({ force: true });
  loggerService.warn('Practice email queue cleaned');
}
