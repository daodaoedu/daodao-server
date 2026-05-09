/**
 * Reaction Notification Worker
 *
 * 處理 reaction-notification 隊列中的任務，
 * 在累積1小時後將 reaction 通知 email 發送給實踐擁有者。
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { REACTION_NOTIFICATION_QUEUE_NAME, type ReactionNotificationJob } from './reaction-notification.queue';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import { emailService } from '../services/email/email.service';
import { generateReactionNotificationEmail } from '../services/email/reaction-notification-template';
import { generateUnsubscribeUrl } from '../services/notification-unsubscribe.service';
import {
  createEmailLog,
  updateEmailLogStatus,
  hasEmailBeenSent,
} from '../services/email/email-log.service';
import { EMAIL_TYPES, EMAIL_STATUS } from '../types/email';

// ─── Worker 選項 ───────────────────────────────────────────────────────────────

export interface ReactionNotificationWorkerOptions {
  concurrency?: number;
}

const defaultOptions: ReactionNotificationWorkerOptions = {
  concurrency: 5
};

// ─── Job 處理邏輯 ──────────────────────────────────────────────────────────────

/**
 * 處理單一 reaction 通知任務
 */
async function processReactionNotificationJob(job: Job<ReactionNotificationJob>): Promise<void> {
  const { practiceId, actorUserId, practiceOwnerId, practiceTitle, totalReactionCount, entityType = 'practice', entityId } = job.data;
  const actualEntityId = entityId ?? practiceId;

  loggerService.info('[reaction-notification-worker] Processing job', {
    jobId: job.id,
    practiceId,
    actorUserId,
    practiceOwnerId,
  });

  try {
    // 1. 確認 actor 不是 practice owner（不通知自己）
    if (actorUserId === practiceOwnerId) {
      loggerService.info('[reaction-notification-worker] Actor is owner, skipping', {
        jobId: job.id,
        practiceId,
        userId: actorUserId,
      });
      return;
    }

    // 2. 確認目標實體仍存在
    if (entityType === 'checkin') {
      const checkin = await prisma.practice_checkins.findUnique({
        where: { id: actualEntityId },
        select: { id: true, user_id: true },
      });

      if (!checkin) {
        loggerService.warn('[reaction-notification-worker] Checkin not found, skipping', {
          jobId: job.id,
          checkinId: actualEntityId,
        });
        return;
      }

      if (checkin.user_id !== practiceOwnerId) {
        loggerService.warn('[reaction-notification-worker] Checkin owner mismatch, skipping', {
          jobId: job.id,
          checkinId: actualEntityId,
          expectedOwnerId: practiceOwnerId,
          actualOwnerId: checkin.user_id,
        });
        return;
      }
    } else {
      const practice = await prisma.practices.findUnique({
        where: { id: practiceId },
        select: { id: true, user_id: true, external_id: true },
      });

      if (!practice) {
        loggerService.warn('[reaction-notification-worker] Practice not found, skipping', {
          jobId: job.id,
          practiceId,
        });
        return;
      }

      if (practice.user_id !== practiceOwnerId) {
        loggerService.warn('[reaction-notification-worker] Practice owner mismatch, skipping', {
          jobId: job.id,
          practiceId,
          expectedOwnerId: practiceOwnerId,
          actualOwnerId: practice.user_id,
        });
        return;
      }
    }

    // 3. 取得 owner 的 email 與暱稱
    const owner = await prisma.users.findUnique({
      where: { id: practiceOwnerId },
      select: {
        nickname: true,
        contacts: { select: { email: true } },
      },
    });

    const ownerEmail = owner?.contacts?.email ?? null;

    if (!ownerEmail) {
      loggerService.warn('[reaction-notification-worker] Owner has no email, skipping', {
        jobId: job.id,
        practiceOwnerId,
      });
      return;
    }

    const ownerName = owner?.nickname ?? `用戶 ${practiceOwnerId}`;

    // 3a. 防重複：BullMQ retry 保護
    const alreadySent = await hasEmailBeenSent({
      userId: practiceOwnerId,
      emailType: EMAIL_TYPES.REACTION_NOTIFICATION,
      entityType,
      entityId: actualEntityId,
    });
    if (alreadySent) {
      loggerService.info('[reaction-notification-worker] Already sent, skipping', {
        jobId: job.id,
        practiceOwnerId,
        entityType,
        entityId: actualEntityId,
      });
      return;
    }

    const parentPractice = await prisma.practices.findUnique({
      where: { id: practiceId },
      select: { external_id: true },
    });
    const practiceUrl = `${process.env.FRONTEND_URL ?? 'https://app.daodao.so'}/practices/${parentPractice?.external_id ?? practiceId}`;
    const unsubscribeUrl = generateUnsubscribeUrl(practiceOwnerId, 'reaction');

    // 4. 產生並發送 email
    const { subject, html } = generateReactionNotificationEmail({
      recipientName: ownerName,
      practiceTitle,
      reactionCount: totalReactionCount,
      practiceUrl,
      unsubscribeUrl,
    });

    // 建立 pending log
    let logRecord: { id: number; tracking_token: string | null } | null = null;
    try {
      logRecord = await createEmailLog({
        userId: practiceOwnerId,
        emailType: EMAIL_TYPES.REACTION_NOTIFICATION,
        entityType,
        entityId: actualEntityId,
        subject,
        status: EMAIL_STATUS.PENDING,
      });
    } catch (logErr) {
      loggerService.error('[reaction-notification-worker] Failed to create email log', {
        jobId: job.id,
        error: logErr instanceof Error ? logErr.message : String(logErr),
      });
    }

    const result = await emailService.sendEmail({
      to: ownerEmail,
      subject,
      html,
      trackingToken: logRecord?.tracking_token ?? undefined,
    });

    try {
      if (logRecord) {
        await updateEmailLogStatus(logRecord.id, result.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED);
      }
    } catch (logErr) {
      loggerService.error('[reaction-notification-worker] Failed to update email log status', {
        jobId: job.id,
        error: logErr instanceof Error ? logErr.message : String(logErr),
      });
    }

    if (result.success) {
      loggerService.info('[reaction-notification-worker] Email sent successfully', {
        jobId: job.id,
        practiceId,
        to: ownerEmail,
        subject,
        totalReactionCount,
      });
    } else {
      loggerService.error('[reaction-notification-worker] Failed to send email', {
        jobId: job.id,
        practiceId,
        to: ownerEmail,
        error: result.error,
      });
    }

  } catch (error) {
    loggerService.error('[reaction-notification-worker] Job failed', {
      jobId: job.id,
      practiceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

/**
 * 建立並啟動 Reaction Notification Worker
 */
export function createReactionNotificationWorker(
  options?: ReactionNotificationWorkerOptions
): Worker<ReactionNotificationJob> {
  const connection = getQueueConnection();
  const finalOptions = { ...defaultOptions, ...options };

  const worker = new Worker<ReactionNotificationJob>(
    REACTION_NOTIFICATION_QUEUE_NAME,
    processReactionNotificationJob,
    {
      connection,
      concurrency: finalOptions.concurrency
    }
  );

  worker.on('completed', (job) => {
    loggerService.debug('[reaction-notification-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[reaction-notification-worker] Job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[reaction-notification-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[reaction-notification-worker] Job stalled', { jobId });
  });

  loggerService.info('[reaction-notification-worker] Worker started', {
    concurrency: finalOptions.concurrency
  });

  return worker;
}

/**
 * 關閉 Worker
 */
export async function closeReactionNotificationWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[reaction-notification-worker] Worker closed');
}
