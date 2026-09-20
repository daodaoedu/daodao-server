/**
 * Practice Email Worker
 *
 * BullMQ Worker 處理主題實踐郵件任務
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { PRACTICE_EMAIL_QUEUE_NAME } from './practice-email.queue';
import type {
  PracticeEmailJobData,
  PracticeEmailCode,
  WeeklySummaryEmailCode,
  FinalSummaryEmailCode
} from '../types/email/practice.types';

/**
 * Worker 選項
 */
export interface PracticeEmailWorkerOptions {
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

/**
 * 預設 Worker 選項
 */
const defaultOptions: PracticeEmailWorkerOptions = {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000 // 每秒最多 10 封
  }
};

/**
 * 處理單一郵件任務
 */
async function processEmailJob(job: Job<PracticeEmailJobData>): Promise<void> {
  const { emailCode, practiceId, userId, metadata } = job.data;

  loggerService.info('Processing practice email job', {
    jobId: job.id,
    emailCode,
    practiceId,
    userId
  });

  try {
    // 根據郵件類型處理
    switch (emailCode) {
      case 'PE01': // 實踐建立確認郵件
        await handlePracticeCreatedEmail(practiceId, userId);
        break;

      case 'PE02': // 首次打卡鼓勵郵件
        await handleFirstCheckInEmail(practiceId, userId);
        break;

      case 'PE03': // 週報（進行中，有打卡）
      case 'PE04': // 週報（進行中，無打卡）
      case 'PE05': // 週報（即將結束，有打卡）
      case 'PE06': // 週報（即將結束，無打卡）
        // 如果是排程觸發，需要查詢所有需要發送週報的用戶
        if (metadata?.type === 'weekly-summary') {
          await handleWeeklySummaryBatch();
        } else {
          await handleWeeklySummaryEmail(emailCode, practiceId, userId);
        }
        break;

      case 'PE07': // 結束總結（成功完成）
      case 'PE08': // 結束總結（未達標）
        // 如果是排程觸發，需要查詢所有今天結束的實踐
        if (metadata?.type === 'final-summary') {
          await handleFinalSummaryBatch();
        } else {
          await handleFinalSummaryEmail(emailCode, practiceId, userId);
        }
        break;

      default:
        loggerService.warn('Unknown email code', { emailCode });
    }

    loggerService.info('Practice email job completed', {
      jobId: job.id,
      emailCode
    });

  } catch (error) {
    loggerService.error('Practice email job failed', {
      jobId: job.id,
      emailCode,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * 處理實踐建立確認郵件 (PE01)
 */
async function handlePracticeCreatedEmail(practiceId: number, userId: number): Promise<void> {
  const { sendPracticeCreatedEmail } = await import('../services/email/practice-email.service');
  await sendPracticeCreatedEmail(practiceId, userId);
}

/**
 * 處理首次打卡鼓勵郵件 (PE02)
 */
async function handleFirstCheckInEmail(practiceId: number, userId: number): Promise<void> {
  const { sendFirstCheckInEmail } = await import('../services/email/practice-email.service');
  await sendFirstCheckInEmail(practiceId, userId);
}

/**
 * 處理週報郵件
 */
async function handleWeeklySummaryEmail(
  emailCode: PracticeEmailCode,
  practiceId: number,
  userId: number
): Promise<void> {
  // 驗證是有效的週報郵件代碼
  if (!['PE03', 'PE04', 'PE05', 'PE06'].includes(emailCode)) {
    throw new Error(`Invalid weekly summary email code: ${emailCode}`);
  }
  const { sendWeeklySummaryEmail } = await import('../services/email/practice-email.service');
  await sendWeeklySummaryEmail(emailCode as WeeklySummaryEmailCode, practiceId, userId);
}

/**
 * 批次處理週報（排程任務觸發）
 */
async function handleWeeklySummaryBatch(): Promise<void> {
  const { sendPendingWeeklySummaries } = await import('../services/email/practice-email.service');
  await sendPendingWeeklySummaries();
}

/**
 * 處理結束總結郵件
 * 與 sendPendingFinalSummaries 共用相同的 email_log 去重機制，
 * 防止「到期觸發」與「每日 10:00 批次」兩條路徑重複發送
 */
async function handleFinalSummaryEmail(
  emailCode: PracticeEmailCode,
  practiceId: number,
  userId: number
): Promise<void> {
  // 驗證是有效的結束總結郵件代碼
  if (!['PE07', 'PE08'].includes(emailCode)) {
    throw new Error(`Invalid final summary email code: ${emailCode}`);
  }

  const { hasEmailBeenSent, createEmailLog, updateEmailLogStatus } = await import('../services/email/email-log.service');
  const { EMAIL_TYPES, EMAIL_STATUS } = await import('../types/email');
  const { sendFinalSummaryEmail } = await import('../services/email/practice-email.service');

  // 去重複檢查：若 sendPendingFinalSummaries 已發送，跳過
  const alreadySent = await hasEmailBeenSent({
    userId,
    emailType: EMAIL_TYPES.PRACTICE_FINAL_SUMMARY,
    entityType: 'practice',
    entityId: practiceId,
    emailCode
  });

  if (alreadySent) {
    loggerService.info('Skipping duplicate final summary email', { practiceId, emailCode, userId });
    return;
  }

  // 建立 PENDING log，取得 trackingToken（與 sendPendingFinalSummaries 流程一致）
  const logRecord = await createEmailLog({
    userId,
    emailType: EMAIL_TYPES.PRACTICE_FINAL_SUMMARY,
    entityType: 'practice',
    entityId: practiceId,
    emailCode,
    subject: '實踐總結',
    status: EMAIL_STATUS.PENDING
  });

  const outcome = await sendFinalSummaryEmail(
    emailCode as FinalSummaryEmailCode,
    practiceId,
    userId,
    logRecord.tracking_token ?? undefined
  );

  // 後台停用該模板時記 skipped，否則 sent（daodao#236 AC-02）
  await updateEmailLogStatus(
    logRecord.id,
    outcome.skipped ? EMAIL_STATUS.SKIPPED : EMAIL_STATUS.SENT
  );
}

/**
 * 批次處理結束總結（排程任務觸發）
 */
async function handleFinalSummaryBatch(): Promise<void> {
  const { sendPendingFinalSummaries } = await import('../services/email/practice-email.service');
  await sendPendingFinalSummaries();
}

/**
 * 建立並啟動 Worker
 */
export function createPracticeEmailWorker(
  options?: PracticeEmailWorkerOptions
): Worker<PracticeEmailJobData> {
  const connection = getQueueConnection();
  const finalOptions = { ...defaultOptions, ...options };

  const worker = new Worker<PracticeEmailJobData>(
    PRACTICE_EMAIL_QUEUE_NAME,
    processEmailJob,
    {
      connection,
      concurrency: finalOptions.concurrency,
      limiter: finalOptions.limiter
    }
  );

  // 事件處理
  worker.on('completed', (job) => {
    loggerService.debug('Worker completed job', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('Worker job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    loggerService.error('Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('Worker job stalled', { jobId });
  });

  loggerService.info('Practice email worker started', {
    concurrency: finalOptions.concurrency,
    limiter: finalOptions.limiter
  });

  return worker;
}

/**
 * 關閉 Worker
 */
export async function closePracticeEmailWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('Practice email worker closed');
}
