/**
 * Email Worker
 *
 * BullMQ Worker 處理郵件發送任務
 * - 呼叫 emailService.sendEmail() 執行實際發送
 * - 根據 emailLogId 更新 email_logs 狀態
 * - 最終失敗時記錄 dead letter 警告
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection, getRawConnection } from './connection';
import { EMAIL_QUEUE_NAME } from './email.queue';
import type { EmailJobData } from './email.queue';
import { loggerService } from '../services/logging/logger.service';
import { emailService } from '../services/email/email.service';
import { updateEmailLogStatus } from '../services/email/email-log.service';
import { retryFailedEmails } from './email.queue';
import { cohortFeedbackReceiptKey, recoverPendingCohortFeedbackEmails, refreshCohortFeedbackDelivery } from '../services/cohort-feedback-delivery.service';
import { prisma } from '../services/database/prisma.service';
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
async function processEmailJob(job: Job<EmailJobData>): Promise<void | { cohortFeedbackDelivered: true }> {
  const { to, subject, emailLogId, emailType } = job.data;

  // 排程掃描任務：補派未入列的未來信通知，並重試 failed set 中的郵件
  if (job.name === 'retry-scan') {
    const recoveredFutureLetterEmails = await recoverPendingFutureLetterEmails();
    const recoveredCohortFeedbackEmails = await recoverPendingCohortFeedbackEmails();
    const result = await retryFailedEmails();
    loggerService.info('Scheduled email retry scan done', { ...result, recoveredFutureLetterEmails, recoveredCohortFeedbackEmails });
    return;
  }

  if (job.data.cohortFeedbackCohortId && emailLogId) {
    const log = await prisma.email_logs.findUnique({ where: { id: emailLogId }, select: { status: true } });
    const connection = getRawConnection();
    const receiptKey = cohortFeedbackReceiptKey(emailLogId);
    if (log?.status === 'sent' || await connection.get(receiptKey)) {
      if (log?.status !== 'sent') await updateEmailLogStatus(emailLogId, 'sent');
      await refreshCohortFeedbackDelivery(job.data.cohortFeedbackCohortId);
      await connection.del(receiptKey);
      return { cohortFeedbackDelivered: true };
    }
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

  // A separate receipt survives shared completed-set pruning until DB reconciliation.
  // SMTP acceptance and Redis cannot be atomic; if Redis is unavailable, still
  // attempt the DB write rather than forcing an avoidable immediate SMTP retry.
  if (job.data.cohortFeedbackCohortId && emailLogId) {
    try {
      await getRawConnection().set(cohortFeedbackReceiptKey(emailLogId), 'accepted');
    } catch (error) {
      loggerService.warn('儲存回饋郵件寄送憑證失敗', { emailLogId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  // 成功：更新 log 狀態
  if (emailLogId) {
    try {
      await updateEmailLogStatus(emailLogId, 'sent');
      if (job.data.cohortFeedbackCohortId) {
        await refreshCohortFeedbackDelivery(job.data.cohortFeedbackCohortId);
        await getRawConnection().del(cohortFeedbackReceiptKey(emailLogId));
      }
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
  // Keep the completed-job receipt as a compatibility fallback as well.
  if (job.data.cohortFeedbackCohortId) return { cohortFeedbackDelivered: true };
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
        updateEmailLogStatus(job.data.emailLogId, 'failed')
          .then(async () => {
            if (job.data.cohortFeedbackCohortId) await refreshCohortFeedbackDelivery(job.data.cohortFeedbackCohortId);
          }).catch(() => {});
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
