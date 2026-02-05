/**
 * Collection Worker
 *
 * BullMQ Worker 處理學習資源收集任務
 * - 抓取所有啟用的來源
 * - AI 分類待處理內容
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { COLLECTION_QUEUE_NAME } from './collection.queue';
import type { CollectionJobData } from './collection.queue';

/**
 * Worker 選項
 */
export interface CollectionWorkerOptions {
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

/**
 * 預設 Worker 選項
 */
const defaultOptions: CollectionWorkerOptions = {
  concurrency: 2, // 同時最多處理 2 個任務
  limiter: {
    max: 5,
    duration: 60000, // 每分鐘最多 5 個任務（避免 API rate limit）
  },
};

/**
 * 抓取結果
 */
interface FetchAllResult {
  totalFetched: number;
  sourceResults: Array<{ sourceId: string; fetched: number; errors: string[] }>;
}

/**
 * 分類結果
 */
interface ClassifyResult {
  success: number;
  failed: number;
  results: Array<{ id: string; success: boolean; error?: string }>;
}

/**
 * Job 處理結果
 */
type JobResult = FetchAllResult | ClassifyResult | { fetched: number; errors: string[] };

/**
 * 處理收集任務
 */
async function processCollectionJob(job: Job<CollectionJobData>): Promise<JobResult> {
  const { type, triggeredAt, sourceId, limit, platform, classificationMode } = job.data;

  loggerService.info('Processing collection job', {
    jobId: job.id,
    type,
    triggeredAt,
    sourceId,
    limit,
    platform,
    classificationMode,
  });

  try {
    switch (type) {
      case 'fetch-all-sources':
        return await handleFetchAllSources();

      case 'fetch-single-source':
        if (!sourceId) {
          throw new Error('sourceId is required for fetch-single-source');
        }
        return await handleFetchSingleSource(sourceId);

      case 'classify-pending':
        return await handleClassifyPending(limit, platform, classificationMode);

      default:
        loggerService.warn('Unknown collection job type', { type });
        return { totalFetched: 0, sourceResults: [] };
    }
  } catch (error) {
    loggerService.error('Collection job failed', {
      jobId: job.id,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * 處理抓取所有來源
 */
async function handleFetchAllSources(): Promise<FetchAllResult> {
  loggerService.info('Starting fetch all active sources');

  // 動態 import 避免循環依賴
  const { collectionService } = await import('../services/collection');
  const result = await collectionService.fetchAllActiveSources();

  loggerService.info('Fetch all sources completed', {
    totalFetched: result.totalFetched,
    sourcesProcessed: result.sourceResults.length,
    errorsCount: result.sourceResults.filter((r) => r.errors.length > 0).length,
  });

  return result;
}

/**
 * 處理抓取單一來源
 */
async function handleFetchSingleSource(
  sourceId: string
): Promise<{ fetched: number; errors: string[] }> {
  loggerService.info('Starting fetch single source', { sourceId });

  // 動態 import 避免循環依賴
  const { collectionService } = await import('../services/collection');
  const result = await collectionService.fetchFromSource(sourceId);

  loggerService.info('Fetch single source completed', {
    sourceId,
    fetched: result.fetched,
    errorsCount: result.errors.length,
  });

  return result;
}

/**
 * 處理分類待處理內容
 * @param limit - 最大處理數量
 * @param platform - 只處理特定平台
 * @param mode - 分類模式: keyword (關鍵字), ai (AI), auto (自動選擇)
 */
async function handleClassifyPending(
  limit?: number,
  platform?: string,
  mode?: string
): Promise<ClassifyResult> {
  const classificationMode = (mode || 'auto') as import('@/types/classifier.types').ClassificationMode;

  loggerService.info('Starting classify pending contents', {
    limit,
    platform,
    mode: classificationMode,
  });

  // 動態 import 避免循環依賴
  const { collectionService } = await import('../services/collection');
  const result = await collectionService.classifyPendingContents({
    limit: limit || 20,
    platform: platform as import('@/types/collection.types').CollectionPlatform | undefined,
    mode: classificationMode,
  });

  loggerService.info('Classify pending completed', {
    success: result.success,
    failed: result.failed,
    total: result.results.length,
    mode: classificationMode,
  });

  return result;
}

/**
 * 建立並啟動 Worker
 */
export function createCollectionWorker(
  options?: CollectionWorkerOptions
): Worker<CollectionJobData> {
  const connection = getQueueConnection();
  const finalOptions = { ...defaultOptions, ...options };

  const worker = new Worker<CollectionJobData>(
    COLLECTION_QUEUE_NAME,
    processCollectionJob,
    {
      connection,
      concurrency: finalOptions.concurrency,
      limiter: finalOptions.limiter,
    }
  );

  // 事件處理
  worker.on('completed', (job, result) => {
    const summary = summarizeResult(job.data.type, result);
    loggerService.debug('Collection worker completed job', {
      jobId: job.id,
      type: job.data.type,
      ...summary,
    });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('Collection worker job failed', {
      jobId: job?.id,
      type: job?.data?.type,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    loggerService.error('Collection worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('Collection worker job stalled', { jobId });
  });

  loggerService.info('Collection worker started', {
    concurrency: finalOptions.concurrency,
    limiter: finalOptions.limiter,
  });

  return worker;
}

/**
 * 根據任務類型摘要結果
 */
function summarizeResult(
  type: string,
  result: unknown
): Record<string, unknown> {
  if (!result || typeof result !== 'object') {
    return {};
  }

  switch (type) {
    case 'fetch-all-sources': {
      const r = result as FetchAllResult;
      return {
        totalFetched: r.totalFetched,
        sourcesProcessed: r.sourceResults?.length ?? 0,
      };
    }
    case 'fetch-single-source': {
      const r = result as { fetched: number; errors: string[] };
      return {
        fetched: r.fetched,
        errorsCount: r.errors?.length ?? 0,
      };
    }
    case 'classify-pending': {
      const r = result as ClassifyResult;
      return {
        success: r.success,
        failed: r.failed,
      };
    }
    default:
      return {};
  }
}

/**
 * 關閉 Worker
 */
export async function closeCollectionWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('Collection worker closed');
}
