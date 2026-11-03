/**
 * Email Worker
 *
 * BullMQ Worker 處理郵件發送任務
 * - 呼叫 emailService.sendEmail() 執行實際發送
 * - 根據 emailLogId 更新 email_logs 狀態
 * - 最終失敗時記錄 dead letter 警告
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { EMAIL_QUEUE_NAME } from './email.queue';
import type { EmailJobData } from './email.queue';
import { loggerService } from '../services/logging/logger.service';
import { emailService } from '../services/email/email.service';
import { updateEmailLogStatus } from '../services/email/email-log.service';
import { retryFailedEmails } from './email.queue';
import { recoverPendingFutureLetterEmails } from '../services/email/future-letter-email.service';

export interface EmailWorkerOptions {
  concurrency?: number;
}

const defaultOptions: EmailWorkerOptions = {
  concurrency: 5,
};

/**
 * 處理單一郵件發送任務
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { to, subject, emailLogId, emailType } = job.data;

  // 排程掃描任務：補派未入列的未來信通知，並重試 failed set 中的郵件
  if (job.name === 'retry-scan') {
    const recoveredFutureLetterEmails = await recoverPendingFutureLetterEmails();
    const result = await retryFailedEmails();
    loggerService.info('Scheduled email retry scan done', { ...result, recoveredFutureLetterEmails });
    return;
  }

  loggerService.info('Processing email job', {
    jobId: job.id,
    to,
    subject,
    emailType,
    attempt: job.attemptsMade + 1,
  });

  const result = await emailService.sendEmail({
    to: job.data.to,
    subject: job.data.subject,
    html: job.data.html,
    from: job.data.from,
    replyTo: job.data.replyTo,
    cc: job.data.cc,
    bcc: job.data.bcc,
    trackingToken: job.data.trackingToken,
  });

  if (!result.success) {
    // 不在此更新 DB 為 failed — BullMQ 會自動重試，
    // 最終失敗由 worker.on('failed') 在 isLastAttempt 時處理
    throw new Error(result.error || '郵件發送失敗');
  }

  // 成功：更新 log 狀態
  if (emailLogId) {
    try {
      await updateEmailLogStatus(emailLogId, 'sent');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      loggerService.error('更新郵件紀錄狀態失敗', { emailLogId, error: detail });
    }
  }

  loggerService.info('Email job completed', {
    jobId: job.id,
    to,
    messageId: result.messageId,
  });
}

/**
 * 建立並啟動 Worker
 */
export function createEmailWorker(
  options?: EmailWorkerOptions
): Worker<EmailJobData> {
  const connection = getQueueConnection();
  const finalOptions = { ...defaultOptions, ...options };

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    processEmailJob,
    {
      connection,
      concurrency: finalOptions.concurrency,
    }
  );

  worker.on('completed', (job) => {
    loggerService.debug('Email worker completed job', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    const isLastAttempt = job && job.attemptsMade >= (job.opts.attempts ?? 5);
    const errorMessage = error?.message ?? String(error);

    if (isLastAttempt) {
      loggerService.error('[DEAD LETTER] 郵件在所有重試後仍然失敗', {
        jobId: job?.id,
        to: job?.data.to,
        subject: job?.data.subject,
        emailType: job?.data.emailType,
        userId: job?.data.userId,
        attempts: job?.attemptsMade,
        error: errorMessage,
      });
      if (job?.data.emailLogId) {
        updateEmailLogStatus(job.data.emailLogId, 'failed').catch(() => {});
      }
    } else {
      loggerService.warn('Email worker job failed, will retry', {
        jobId: job?.id,
        attempt: job?.attemptsMade,
        error: errorMessage,
      });
    }
  });

  worker.on('error', (error) => {
    loggerService.error('Email worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('Email worker job stalled', { jobId });
  });

  loggerService.info('Email worker started', {
    concurrency: finalOptions.concurrency,
  });

  return worker;
}

/**
 * 關閉 Worker
 */
export async function closeEmailWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('Email worker closed');
}
