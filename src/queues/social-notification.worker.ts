/**
 * Social Notification Worker
 *
 * BullMQ Worker 處理社交通知任務（follow、connect、mention 等事件）
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { SOCIAL_NOTIFICATION_QUEUE_NAME } from './social-notification.queue';
import { loggerService } from '../services/logging/logger.service';
import { notificationEventService } from '../services/notification-event.service';
import type { SocialNotificationJob } from '../types/social.types';
import { SocialNotificationEvent } from '../types/social.types';

/**
 * Worker 選項
 */
export interface SocialNotificationWorkerOptions {
  concurrency?: number;
}

/**
 * 預設 Worker 選項
 */
const defaultOptions: SocialNotificationWorkerOptions = {
  concurrency: 5
};

/**
 * 處理單一社交通知任務
 */
async function processSocialNotificationJob(job: Job<SocialNotificationJob>): Promise<void> {
  const { event, actorId, recipientId, payload } = job.data;

  loggerService.info('Processing social notification job', {
    jobId: job.id,
    event,
    actorId,
    recipientId
  });

  try {
    switch (event) {
      case SocialNotificationEvent.FOLLOW_USER:
        await handleFollowUser(actorId, recipientId, payload);
        break;

      case SocialNotificationEvent.FOLLOW_PRACTICE_CHECKIN:
        await handleFollowPracticeCheckin(actorId, recipientId, payload);
        break;

      case SocialNotificationEvent.FOLLOW_PRACTICE_UPDATE:
        await handleFollowPracticeUpdate(actorId, recipientId, payload);
        break;

      case SocialNotificationEvent.CONNECT_REQUEST:
        await handleConnectRequest(actorId, recipientId, payload);
        break;

      case SocialNotificationEvent.CONNECT_ACCEPTED:
        await handleConnectAccepted(actorId, recipientId, payload);
        break;

      case SocialNotificationEvent.CONNECT_PARTNER_CHECKIN:
        await handleConnectPartnerCheckin(actorId, recipientId, payload);
        break;

      case SocialNotificationEvent.CONNECT_PARTNER_UPDATE:
        await handleConnectPartnerUpdate(actorId, recipientId, payload);
        break;

      case SocialNotificationEvent.MENTION:
        await handleMention(actorId, recipientId, payload);
        break;

      default:
        loggerService.warn('Unknown social notification event', { event });
    }

    loggerService.info('Social notification job completed', {
      jobId: job.id,
      event
    });

  } catch (error) {
    loggerService.error('Social notification job failed', {
      jobId: job.id,
      event,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * 處理用戶追蹤通知 (follow.user)
 */
async function handleFollowUser(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await notificationEventService.createEvent({
    type: 'UserFollowActivity',
    actorId,
    recipientId,
    entityType: 'user',
    entityId: payload?.targetId as number,
    payload,
    priority: 'P2',
  });
}

/**
 * 處理追蹤實踐打卡通知 (follow.practice_checkin)
 */
async function handleFollowPracticeCheckin(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await notificationEventService.createEvent({
    type: 'PracticeCheckinActivity',
    actorId,
    recipientId,
    entityType: 'practice',
    entityId: payload?.practiceId as number,
    payload,
    priority: 'P2',
  });
}

/**
 * 處理追蹤實踐更新通知 (follow.practice_update)
 */
async function handleFollowPracticeUpdate(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await notificationEventService.createEvent({
    type: 'PracticeUpdateActivity',
    actorId,
    recipientId,
    entityType: 'practice',
    entityId: payload?.practiceId as number,
    payload,
    priority: 'P2',
  });
}

/**
 * 處理連結請求通知 (connect.request)
 */
async function handleConnectRequest(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await notificationEventService.createEvent({
    type: 'ConnectRequestActivity',
    actorId,
    recipientId,
    entityType: 'connection',
    entityId: payload?.receiverId as number,
    payload,
    priority: 'P2',
  });
}

/**
 * 處理連結接受通知 (connect.accepted)
 */
async function handleConnectAccepted(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  // No-op: will be removed from enqueue side. Direct P1 ConnectAccepted notification is sufficient.
  loggerService.debug('connect.accepted handler called (no-op)', { actorId, recipientId, payload });
}

/**
 * 處理夥伴打卡通知 (connect.partner_checkin)
 */
async function handleConnectPartnerCheckin(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await notificationEventService.createEvent({
    type: 'PartnerCheckinActivity',
    actorId,
    recipientId,
    entityType: 'practice',
    entityId: payload?.practiceId as number,
    payload,
    priority: 'P1',
  });
}

/**
 * 處理夥伴更新通知 (connect.partner_update)
 */
async function handleConnectPartnerUpdate(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await notificationEventService.createEvent({
    type: 'PartnerUpdateActivity',
    actorId,
    recipientId,
    entityType: 'practice',
    entityId: payload?.practiceId as number,
    payload,
    priority: 'P2',
  });
}

/**
 * 處理 @mention 通知
 * 注意：目前 mention 由 comment.service.ts 透過 Route A 直接通知，
 * 不經 social-notification queue。此 handler 保留供未來切換至 queue-based 使用。
 */
async function handleMention(
  actorId: number,
  recipientId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await notificationEventService.createEvent({
    type: 'Mention',
    actorId,
    recipientId,
    entityType: 'comment',
    entityId: payload?.commentId as number,
    payload,
    priority: 'P1',
  });
}

/**
 * 建立並啟動 Worker
 */
export function createSocialNotificationWorker(
  options?: SocialNotificationWorkerOptions
): Worker<SocialNotificationJob> {
  const connection = getQueueConnection();
  const finalOptions = { ...defaultOptions, ...options };

  const worker = new Worker<SocialNotificationJob>(
    SOCIAL_NOTIFICATION_QUEUE_NAME,
    processSocialNotificationJob,
    {
      connection,
      concurrency: finalOptions.concurrency
    }
  );

  // 事件處理
  worker.on('completed', (job) => {
    loggerService.debug('Social notification worker completed job', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('Social notification worker job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    loggerService.error('Social notification worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('Social notification worker job stalled', { jobId });
  });

  loggerService.info('Social notification worker started', {
    concurrency: finalOptions.concurrency
  });

  return worker;
}

/**
 * 關閉 Worker
 */
export async function closeSocialNotificationWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('Social notification worker closed');
}
