/**
 * Collection Queue
 *
 * BullMQ 隊列定義，處理學習資源收集的定時任務
 * - 定時抓取所有啟用的來源
 * - 定時 AI 分類待處理內容
 */

import { Queue, QueueEvents } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import type { CollectionPlatform } from '@/types/collection.types';
import type { ClassificationMode } from '@/types/classifier.types';

/**
 * Queue 名稱
 */
export const COLLECTION_QUEUE_NAME = 'collection';

/**
 * Collection Job 類型
 */
export type CollectionJobType = 'fetch-all-sources' | 'classify-pending' | 'fetch-single-source';

/**
 * Collection Job 資料
 */
export interface CollectionJobData {
  type: CollectionJobType;
  triggeredAt: string;
  /** 只用於 fetch-single-source */
  sourceId?: string;
  /** 只用於 classify-pending */
  limit?: number;
  /** 只用於 classify-pending */
  platform?: CollectionPlatform;
  /** 分類模式: keyword (關鍵字), ai (AI), auto (自動選擇) */
  classificationMode?: ClassificationMode;
}

/**
 * 定時任務配置
 */
export interface CollectionScheduleConfig {
  fetchAllSources: {
    cron: string;
    timezone: string;
    enabled: boolean;
  };
  classifyPending: {
    cron: string;
    timezone: string;
    enabled: boolean;
    limit: number;
    /** 分類模式: keyword (關鍵字), ai (AI), auto (自動選擇) */
    mode: ClassificationMode;
  };
}

/**
 * 預設定時任務配置
 */
export const DEFAULT_COLLECTION_SCHEDULES: CollectionScheduleConfig = {
  fetchAllSources: {
    cron: '0 * * * *', // 每小時 0 分
    timezone: 'Asia/Taipei',
    enabled: true,
  },
  classifyPending: {
    cron: '30 * * * *', // 每小時 30 分
    timezone: 'Asia/Taipei',
    enabled: true,
    limit: 20, // 每次最多分類 20 筆
    mode: 'auto', // 預設自動選擇（優先 AI，無 API key 時用關鍵字）
  },
};

/**
 * Singleton Queue 實例（由 server.ts 初始化）
 */
let collectionQueueInstance: Queue<CollectionJobData> | null = null;

/**
 * 設定 Queue 實例（由 server.ts 呼叫）
 */
export function setCollectionQueue(queue: Queue<CollectionJobData>): void {
  collectionQueueInstance = queue;
}

/**
 * 取得 Queue 實例
 */
export function getCollectionQueue(): Queue<CollectionJobData> | null {
  return collectionQueueInstance;
}

/**
 * 建立 Collection Queue
 */
export function createCollectionQueue(): Queue<CollectionJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<CollectionJobData>(COLLECTION_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10 秒起始延遲
      },
      removeOnComplete: {
        count: 200, // 保留最近 200 個完成的任務
        age: 24 * 60 * 60, // 保留 24 小時
      },
      removeOnFail: {
        count: 100, // 保留最近 100 個失敗的任務
        age: 7 * 24 * 60 * 60, // 保留 7 天
      },
    },
  });

  loggerService.info('Collection queue created', { queueName: COLLECTION_QUEUE_NAME });

  return queue;
}

/**
 * 建立 Queue Events 監聽器
 */
export function createCollectionQueueEvents(): QueueEvents {
  const connection = getQueueConnection();

  const events = new QueueEvents(COLLECTION_QUEUE_NAME, {
    connection,
  });

  events.on('completed', ({ jobId }) => {
    loggerService.info('Collection job completed', { jobId });
  });

  events.on('failed', ({ jobId, failedReason }) => {
    loggerService.error('Collection job failed', { jobId, reason: failedReason });
  });

  events.on('stalled', ({ jobId }) => {
    loggerService.warn('Collection job stalled', { jobId });
  });

  return events;
}

/**
 * 註冊排程任務
 *
 * 多容器安全：
 * - BullMQ repeatable jobs 使用 jobId 自動去重
 * - 多個容器註冊相同 jobId 的排程任務，Redis 中只會保留一份
 * - 可透過 DISABLE_COLLECTION_SCHEDULED_JOBS=true 環境變數禁用排程註冊
 */
export async function registerCollectionScheduledJobs(
  queue: Queue<CollectionJobData>,
  schedules: CollectionScheduleConfig = DEFAULT_COLLECTION_SCHEDULES
): Promise<void> {
  // 允許透過環境變數禁用排程
  if (process.env.DISABLE_COLLECTION_SCHEDULED_JOBS === 'true') {
    loggerService.info('Collection scheduled jobs registration skipped (DISABLE_COLLECTION_SCHEDULED_JOBS=true)');
    return;
  }

  // 註冊抓取所有來源的定時任務
  if (schedules.fetchAllSources.enabled) {
    await queue.add(
      'fetch-all-sources',
      {
        type: 'fetch-all-sources',
        triggeredAt: new Date().toISOString(),
      },
      {
        repeat: {
          pattern: schedules.fetchAllSources.cron,
          tz: schedules.fetchAllSources.timezone,
        },
        jobId: 'collection-fetch-all-scheduler',
      }
    );

    loggerService.info('Collection fetch-all-sources scheduled job registered', {
      pattern: schedules.fetchAllSources.cron,
      timezone: schedules.fetchAllSources.timezone,
    });
  }

  // 註冊分類待處理內容的定時任務
  if (schedules.classifyPending.enabled) {
    await queue.add(
      'classify-pending',
      {
        type: 'classify-pending',
        triggeredAt: new Date().toISOString(),
        limit: schedules.classifyPending.limit,
        classificationMode: schedules.classifyPending.mode,
      },
      {
        repeat: {
          pattern: schedules.classifyPending.cron,
          tz: schedules.classifyPending.timezone,
        },
        jobId: 'collection-classify-pending-scheduler',
      }
    );

    loggerService.info('Collection classify-pending scheduled job registered', {
      pattern: schedules.classifyPending.cron,
      timezone: schedules.classifyPending.timezone,
      limit: schedules.classifyPending.limit,
      mode: schedules.classifyPending.mode,
    });
  }

  loggerService.info('Collection scheduled jobs registered', {
    fetchAllSources: schedules.fetchAllSources.enabled,
    classifyPending: schedules.classifyPending.enabled,
  });
}

/**
 * 手動觸發抓取所有來源（用於測試或維護）
 */
export async function triggerFetchAllSources(
  queue: Queue<CollectionJobData>
): Promise<string> {
  const job = await queue.add(
    'manual-fetch-all-sources',
    {
      type: 'fetch-all-sources',
      triggeredAt: new Date().toISOString(),
    },
    {
      jobId: `manual-fetch-all-${Date.now()}`,
    }
  );

  loggerService.info('Manual fetch-all-sources triggered', { jobId: job.id });

  return job.id ?? '';
}

/**
 * 手動觸發抓取單一來源
 */
export async function triggerFetchSingleSource(
  queue: Queue<CollectionJobData>,
  sourceId: string
): Promise<string> {
  const job = await queue.add(
    'manual-fetch-single-source',
    {
      type: 'fetch-single-source',
      triggeredAt: new Date().toISOString(),
      sourceId,
    },
    {
      jobId: `manual-fetch-${sourceId}-${Date.now()}`,
    }
  );

  loggerService.info('Manual fetch-single-source triggered', { jobId: job.id, sourceId });

  return job.id ?? '';
}

/**
 * 手動觸發分類（用於測試或維護）
 * @param queue - BullMQ Queue 實例
 * @param options - 分類選項
 * @param options.limit - 最大處理數量 (預設: 20)
 * @param options.platform - 只處理特定平台
 * @param options.mode - 分類模式: keyword (關鍵字), ai (AI), auto (自動選擇)
 */
export async function triggerClassifyPending(
  queue: Queue<CollectionJobData>,
  options?: { limit?: number; platform?: CollectionPlatform; mode?: ClassificationMode }
): Promise<string> {
  const job = await queue.add(
    'manual-classify-pending',
    {
      type: 'classify-pending',
      triggeredAt: new Date().toISOString(),
      limit: options?.limit || 20,
      platform: options?.platform,
      classificationMode: options?.mode || 'auto',
    },
    {
      jobId: `manual-classify-${Date.now()}`,
    }
  );

  loggerService.info('Manual classify-pending triggered', {
    jobId: job.id,
    limit: options?.limit,
    platform: options?.platform,
    mode: options?.mode || 'auto',
  });

  return job.id ?? '';
}

/**
 * 簡化版：加入抓取任務（使用 singleton queue）
 */
export async function enqueueCollectionFetch(sourceId?: string): Promise<string | null> {
  const queue = collectionQueueInstance;

  if (!queue) {
    loggerService.warn('Collection queue not initialized, skipping job', { sourceId });
    return null;
  }

  if (sourceId) {
    return triggerFetchSingleSource(queue, sourceId);
  } else {
    return triggerFetchAllSources(queue);
  }
}

/**
 * 簡化版：加入分類任務（使用 singleton queue）
 * @param options - 分類選項
 * @param options.limit - 最大處理數量 (預設: 20)
 * @param options.platform - 只處理特定平台
 * @param options.mode - 分類模式: keyword (關鍵字), ai (AI), auto (自動選擇)
 */
export async function enqueueCollectionClassify(
  options?: { limit?: number; platform?: CollectionPlatform; mode?: ClassificationMode }
): Promise<string | null> {
  const queue = collectionQueueInstance;

  if (!queue) {
    loggerService.warn('Collection queue not initialized, skipping job');
    return null;
  }

  return triggerClassifyPending(queue, options);
}

/**
 * 取得隊列統計
 */
export async function getCollectionQueueStats(queue: Queue<CollectionJobData>): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  repeatable: number;
}> {
  const [waiting, active, completed, failed, delayed, repeatable] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getRepeatableCount(),
  ]);

  return { waiting, active, completed, failed, delayed, repeatable };
}

/**
 * 移除排程任務
 */
export async function removeCollectionScheduledJobs(
  queue: Queue<CollectionJobData>
): Promise<void> {
  const repeatableJobs = await queue.getRepeatableJobs();

  for (const job of repeatableJobs) {
    if (job.key.startsWith('collection-')) {
      await queue.removeRepeatableByKey(job.key);
      loggerService.info('Removed collection repeatable job', { key: job.key });
    }
  }
}

/**
 * 清空隊列（用於測試或維護）
 */
export async function cleanCollectionQueue(queue: Queue<CollectionJobData>): Promise<void> {
  await queue.obliterate({ force: true });
  loggerService.warn('Collection queue cleaned');
}
