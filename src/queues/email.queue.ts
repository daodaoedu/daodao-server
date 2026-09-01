/**
 * Email Queue
 *
 * BullMQ 隊列定義，處理所有郵件發送任務
 * 提供持久化重試、dead letter 記錄、失敗告警
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { markEmailLogRetrying } from '../services/email/email-log.service';

export const EMAIL_QUEUE_NAME = 'email-send';

/**
 * Email Job 資料
 */
export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  trackingToken?: string;
  emailLogId?: number;
  emailType?: string;
  userId?: number;
  priority?: 'P1' | 'P2' | 'P3';
}

/**
 * Singleton Queue 實例
 */
let emailQueueInstance: Queue<EmailJobData> | null = null;

/**
 * 設定 Queue 實例（由 server.ts 呼叫）
 */
export function setEmailQueue(queue: Queue<EmailJobData>): void {
  emailQueueInstance = queue;
}

/**
 * 取得 Queue 實例
 */
export function getEmailQueue(): Queue<EmailJobData> | null {
  return emailQueueInstance;
}

/**
 * 建立 Email Queue
 */
export function createEmailQueue(): Queue<EmailJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000
      },
      removeOnComplete: {
        count: 500,
        age: 3 * 24 * 60 * 60 // 3 天
      },
      removeOnFail: {
        count: 1000,
        age: 14 * 24 * 60 * 60 // 14 天
      }
    }
  });

  loggerService.info('Email queue created', { queueName: EMAIL_QUEUE_NAME });

  return queue;
}

/**
 * 將郵件加入發送佇列
 * Queue 未初始化時回傳 null（不丟 job）
 */
export async function enqueueEmail(data: EmailJobData): Promise<string | null> {
  const queue = emailQueueInstance;
  if (!queue) {
    loggerService.warn('Email queue not initialized, skipping enqueue', {
      to: data.to,
      subject: data.subject,
    });
    return null;
  }

  const job = await queue.add('send', data);
  loggerService.debug('Email job enqueued', {
    jobId: job.id,
    to: data.to,
    emailType: data.emailType,
  });
  return job.id ?? null;
}

/**
 * 批次將郵件加入發送佇列
 */
export async function bulkEnqueueEmails(jobs: EmailJobData[]): Promise<void> {
  const queue = emailQueueInstance;
  if (!queue || jobs.length === 0) return;

  await queue.addBulk(
    jobs.map((data) => ({
      name: 'send',
      data,
    }))
  );

  loggerService.debug('Bulk email jobs enqueued', { count: jobs.length });
}

/**
 * 註冊排程任務：每小時掃描 BullMQ failed set 並重試
 */
export async function registerEmailRetryScheduledJob(
  queue: Queue<EmailJobData>
): Promise<void> {
  if (process.env.DISABLE_SCHEDULED_JOBS === 'true') {
    loggerService.info('Email retry scheduled job registration skipped (DISABLE_SCHEDULED_JOBS=true)');
    return;
  }

  await queue.add(
    'retry-scan',
    {} as EmailJobData,
    {
      repeat: {
        pattern: '30 * * * *',
        tz: 'Asia/Taipei',
      },
      jobId: 'email-retry-scanner',
    }
  );

  loggerService.info('Email retry scheduled job registered', {
    pattern: '30 * * * *',
    timezone: 'Asia/Taipei',
  });
}

/**
 * 從 BullMQ failed set 重試失敗的郵件
 * BullMQ 保留完整 job data，所以可以直接 retry
 */
export async function retryFailedEmails(params?: {
  limit?: number;
}): Promise<{ retried: number; failed: number }> {
  const queue = emailQueueInstance;
  if (!queue) return { retried: 0, failed: 0 };

  const limit = params?.limit ?? 50;
  const failedJobs = await queue.getFailed(0, limit - 1);

  let retried = 0;
  let failed = 0;

  for (const job of failedJobs) {
    try {
      // 更新 DB log 狀態為 pending
      if (job.data.emailLogId) {
        await markEmailLogRetrying(job.data.emailLogId);
      }

      await job.retry();
      retried++;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      loggerService.error('重試失敗郵件時發生錯誤', {
        jobId: job.id,
        to: job.data.to,
        error: detail,
      });
      failed++;
    }
  }

  loggerService.info('Failed email retry completed', {
    retried,
    failed,
    total: failedJobs.length,
  });

  return { retried, failed };
}

/**
 * 重試單封失敗郵件（依 emailLogId 查找 BullMQ failed job）
 */
export async function retrySingleFailedEmail(emailLogId: number): Promise<boolean> {
  const queue = emailQueueInstance;
  if (!queue) return false;

  const failedJobs = await queue.getFailed(0, 500);
  const targetJob = failedJobs.find((j) => j.data.emailLogId === emailLogId);

  if (!targetJob) {
    loggerService.warn('找不到對應的失敗 job', { emailLogId });
    return false;
  }

  await markEmailLogRetrying(emailLogId);
  await targetJob.retry();

  loggerService.info('Single failed email retried', {
    jobId: targetJob.id,
    emailLogId,
  });

  return true;
}
