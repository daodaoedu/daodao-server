/**
 * Notification In-App Batch Worker
 *
 * 每小時整點執行，將 notification_events 中未處理的 P1/P2 事件
 * 轉換並寫入 notifications 表：
 * - P1：每條事件各自建立一筆 notification
 * - P2：依 (type, entity_type, entity_id) 聚合，合併為一筆 notification
 *
 * 冪等性保證：只處理 processed_at IS NULL 的事件，處理完即標記 processed_at。
 */

import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  NOTIFICATION_INAPP_QUEUE_NAME,
  type NotificationInAppJobData
} from './notification.queue';

// ─── 批次處理邏輯 ──────────────────────────────────────────────────────────────

async function processNotificationInAppJob(job: Job<NotificationInAppJobData>): Promise<void> {
  loggerService.info('[notification-inapp-worker] Batch started', { jobId: job.id });

  try {
    // 1. 查詢所有未處理的 P1 / P2 事件
    const BATCH_LIMIT = 5000;
    const events = await prisma.notification_events.findMany({
      where: {
        processed_at: null,
        priority: { in: ['P1', 'P2'] }
      },
      orderBy: { created_at: 'asc' },
      take: BATCH_LIMIT
    });

    if (events.length === BATCH_LIMIT) {
      loggerService.warn('notification-inapp-worker: batch limit reached, events may be backlogged', { limit: BATCH_LIMIT });
    }

    if (events.length === 0) {
      loggerService.info('[notification-inapp-worker] No pending events, skipping', { jobId: job.id });
      return;
    }

    loggerService.info('[notification-inapp-worker] Processing events', {
      jobId: job.id,
      count: events.length
    });

    const now = new Date();
    const processedIds: number[] = [];

    // Retire pending legacy digests without turning them into in-app notifications.
    // Email delivery is handled independently by the cohort digest scheduler.
    // 2. 按 recipient_id 分組
    const byRecipient = new Map<number, typeof events>();
    for (const event of events) {
      if (event.type === NOTIFICATION_TYPES.COHORT_WEEKLY_DIGEST) {
        processedIds.push(event.id);
        continue;
      }
      const list = byRecipient.get(event.recipient_id) ?? [];
      list.push(event);
      byRecipient.set(event.recipient_id, list);
    }

    // 3. 對每位 recipient 逐一處理
    for (const [recipientId, recipientEvents] of byRecipient) {
      const p1Events = recipientEvents.filter((e) => e.priority === 'P1');
      const p2Events = recipientEvents.filter((e) => e.priority === 'P2');

      // ── P1：每條事件各自寫一筆 notification ──────────────────────────────
      for (const event of p1Events) {
        try {
          await prisma.notifications.create({
            data: {
              recipient_id: recipientId,
              actor_id: event.actor_id,
              type: event.type,
              entity_type: event.entity_type,
              entity_id: event.entity_id,
              priority: event.priority,
              aggregation_key: null,
              aggregation_count: 1,
              payload: event.payload ?? undefined,
              batch_sent_at: now
            }
          });
          processedIds.push(event.id);
        } catch (err) {
          loggerService.error('[notification-inapp-worker] Failed to create P1 notification', {
            eventId: event.id,
            recipientId,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }

      // ── P2：依 (type, entity_type, entity_id) 聚合 ───────────────────────
      // 建立聚合群組 Map，key = "type:entity_type:entity_id"
      const p2Groups = new Map<string, typeof p2Events>();
      for (const event of p2Events) {
        const key = `${event.type}:${event.entity_type}:${event.entity_id}`;
        const group = p2Groups.get(key) ?? [];
        group.push(event);
        p2Groups.set(key, group);
      }

      for (const [aggregationKey, groupEvents] of p2Groups) {
        // 取最新事件的 actor_id
        const latestEvent = groupEvents.reduce((latest, e) => {
          const latestTime = latest.created_at?.getTime() ?? 0;
          const eTime = e.created_at?.getTime() ?? 0;
          return eTime > latestTime ? e : latest;
        });

        try {
          await prisma.notifications.create({
            data: {
              recipient_id: recipientId,
              actor_id: latestEvent.actor_id,
              type: latestEvent.type,
              entity_type: latestEvent.entity_type,
              entity_id: latestEvent.entity_id,
              priority: 'P2',
              aggregation_key: aggregationKey,
              aggregation_count: groupEvents.length,
              payload: latestEvent.payload ?? undefined,
              batch_sent_at: now
            }
          });
          for (const event of groupEvents) {
            processedIds.push(event.id);
          }
        } catch (err) {
          loggerService.error('[notification-inapp-worker] Failed to create P2 notification', {
            aggregationKey,
            recipientId,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
    }

    // 4. 標記所有已處理事件的 processed_at
    if (processedIds.length > 0) {
      await prisma.notification_events.updateMany({
        where: { id: { in: processedIds } },
        data: { processed_at: now }
      });
    }

    loggerService.info('[notification-inapp-worker] Batch completed', {
      jobId: job.id,
      processedEventCount: processedIds.length,
      recipientCount: byRecipient.size
    });

  } catch (error) {
    loggerService.error('[notification-inapp-worker] Batch failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

export function createNotificationInAppWorker(): Worker<NotificationInAppJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<NotificationInAppJobData>(
    NOTIFICATION_INAPP_QUEUE_NAME,
    processNotificationInAppJob,
    {
      connection,
      concurrency: 1 // 批次任務確保序列執行，避免重複寫入
    }
  );

  worker.on('completed', (job) => {
    loggerService.debug('[notification-inapp-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[notification-inapp-worker] Job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[notification-inapp-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[notification-inapp-worker] Job stalled', { jobId });
  });

  loggerService.info('[notification-inapp-worker] Worker started');
  return worker;
}

export async function closeNotificationInAppWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[notification-inapp-worker] Worker closed');
}
