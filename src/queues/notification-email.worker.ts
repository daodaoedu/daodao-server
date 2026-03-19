/**
 * Notification Email Batch Worker
 *
 * 每日 08:00 / 12:00 / 16:00 / 20:00 執行（每4小時一次），
 * 彙整上一個4小時週期內的 P1/P2 通知事件，
 * 並依 notification_preferences (N01 channel) 決定是否發送 email。
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  NOTIFICATION_EMAIL_QUEUE_NAME,
  type NotificationEmailJobData
} from './notification.queue';
import {
  generateNotificationDigestHtml,
  generateNotificationDigestSubject,
  type NotificationDigestData,
} from '../services/email/notification-digest-template';
import {
  generateUnsubscribeUrl,
  generateSettingsUrl,
} from '../services/notification-unsubscribe.service';
import { emailService } from '../services/email/email.service';

// ─── 常數 ──────────────────────────────────────────────────────────────────────

/** 每批次涵蓋的時間範圍（4小時，以毫秒計） */
const BATCH_WINDOW_MS = 4 * 60 * 60 * 1000;

/** notification_preferences 中代表 email 的 channel 值 */
const EMAIL_CHANNEL = 'N01';

// ─── 批次處理邏輯 ──────────────────────────────────────────────────────────────

async function processNotificationEmailJob(job: Job<NotificationEmailJobData>): Promise<void> {
  loggerService.info('[email-worker] Batch started', { jobId: job.id });

  try {
    // 1. 計算本次批次的時間範圍（上一個4小時週期）
    const now = new Date();
    const batchEnd = now;
    const batchStart = new Date(now.getTime() - BATCH_WINDOW_MS);

    loggerService.info('[email-worker] Time window', {
      jobId: job.id,
      batchStart: batchStart.toISOString(),
      batchEnd: batchEnd.toISOString()
    });

    // 2. 查詢該時間範圍內的 P1+P2 事件
    const events = await prisma.notification_events.findMany({
      where: {
        priority: { in: ['P1', 'P2'] },
        created_at: {
          gte: batchStart,
          lt: batchEnd
        }
      },
      orderBy: { created_at: 'asc' }
    });

    if (events.length === 0) {
      loggerService.info('[email-worker] No events in window, skipping', { jobId: job.id });
      return;
    }

    // 3. 按 recipient_id 分組
    const byRecipient = new Map<number, typeof events>();
    for (const event of events) {
      const list = byRecipient.get(event.recipient_id) ?? [];
      list.push(event);
      byRecipient.set(event.recipient_id, list);
    }

    loggerService.info('[email-worker] Processing recipients', {
      jobId: job.id,
      eventCount: events.length,
      recipientCount: byRecipient.size
    });

    // 4. 預先批次查詢所有 payload 中缺少 actorName 的 actor 暱稱（避免在 per-recipient 迴圈內重複查詢）
    const globalMissingActorIds = new Set<number>();
    for (const e of events) {
      const payload = e.payload as Record<string, unknown> | null;
      if (!payload?.actorName) {
        globalMissingActorIds.add(e.actor_id);
      }
    }

    const actorNameMap = new Map<number, string>();
    if (globalMissingActorIds.size > 0) {
      const actors = await prisma.users.findMany({
        where: { id: { in: [...globalMissingActorIds] } },
        select: { id: true, nickname: true },
      });
      for (const actor of actors) {
        if (actor.nickname) {
          actorNameMap.set(actor.id, actor.nickname);
        }
      }
    }

    /**
     * 解析 actor 名稱：優先使用 payload 中的 actorName，
     * 其次從資料庫查詢結果取得，最後才用 "用戶 {id}" 作為 fallback。
     */
    const resolveActorName = (payload: Record<string, unknown> | null, actorId: number): string => {
      if (payload?.actorName) return String(payload.actorName);
      return actorNameMap.get(actorId) ?? `用戶 ${actorId}`;
    };

    // 5. 對每位 recipient 處理
    for (const [recipientId, recipientEvents] of byRecipient) {
      try {
        // 5a. 查詢該 recipient 所有相關事件類型的 email 偏好設定（N01 channel）
        const eventTypes = [...new Set(recipientEvents.map((e) => e.type))];

        const preferences = await prisma.notification_preferences.findMany({
          where: {
            user_id: recipientId,
            channel: EMAIL_CHANNEL,
            notification_type: { in: eventTypes }
          }
        });

        // 建立 type -> is_enabled 的快速查詢 Map
        const prefMap = new Map<string, boolean>();
        for (const pref of preferences) {
          prefMap.set(pref.notification_type, pref.is_enabled ?? true);
        }

        // 5b. 過濾出使用者允許接收 email 的事件
        // 若 notification_preferences 中沒有記錄，預設 is_enabled = true
        const allowedEvents = recipientEvents.filter((e) => {
          const enabled = prefMap.get(e.type);
          return enabled !== false; // undefined（未設定）視為 true
        });

        if (allowedEvents.length === 0) {
          loggerService.debug('[email-worker] All event types disabled for user', { recipientId });
          continue;
        }

        // 5c. 區分 P1（重要連結與討論）和 P2（共鳴回饋）
        const p1Events = allowedEvents.filter((e) => e.priority === 'P1');
        const p2Events = allowedEvents.filter((e) => e.priority === 'P2');

        // 5d. 查詢 recipient 的暱稱與 email（email 位於關聯的 contacts 表）
        const recipient = await prisma.users.findUnique({
          where: { id: recipientId },
          select: {
            nickname: true,
            contacts: { select: { email: true } },
          },
        });
        const recipientName = recipient?.nickname ?? `用戶 ${recipientId}`;
        const recipientEmail = recipient?.contacts?.email ?? null;

        if (!recipientEmail) {
          loggerService.warn('[email-worker] Recipient has no email, skipping', { recipientId });
          continue;
        }

        // 5e. 組裝 NotificationDigestData 並產生 HTML
        const digestData: NotificationDigestData = {
          recipientName,
          p1Events: p1Events.map((e) => {
            const payload = e.payload as Record<string, unknown> | null;
            return {
              type:           e.type,
              actorName:      resolveActorName(payload, e.actor_id),
              entityTitle:    payload?.entityTitle ? String(payload.entityTitle) : undefined,
              content:        payload?.content    ? String(payload.content)    : undefined,
              connectMessage: payload?.intent     ? String(payload.intent)     : payload?.message ? String(payload.message) : undefined,
              url:            String(payload?.url ?? `https://daodao.cc`),
            };
          }),
          p2Events: p2Events.map((e) => {
            const payload = e.payload as Record<string, unknown> | null;
            return {
              type:        e.type,
              actorName:   resolveActorName(payload, e.actor_id),
              count:       typeof payload?.count === 'number' ? payload.count : 1,
              entityTitle: payload?.entityTitle ? String(payload.entityTitle) : undefined,
            };
          }),
          unsubscribeUrl: generateUnsubscribeUrl(recipientId, 'digest'),
          settingsUrl:    generateSettingsUrl(),
        };

        const subject = generateNotificationDigestSubject(digestData);
        const html = generateNotificationDigestHtml(digestData);

        const result = await emailService.sendEmail({ to: recipientEmail, subject, html });

        if (result.success) {
          loggerService.info('[email-worker] Digest email sent', {
            recipientId,
            subject,
            p1Count: p1Events.length,
            p2Count: p2Events.length,
          });
        } else {
          loggerService.error('[email-worker] Failed to send digest email', {
            recipientId,
            error: result.error,
          });
        }

      } catch (err) {
        loggerService.error('[email-worker] Failed to process recipient', {
          recipientId,
          error: err instanceof Error ? err.message : String(err)
        });
        // 繼續處理下一位，不讓整批失敗
      }
    }

    loggerService.info('[email-worker] Batch completed', {
      jobId: job.id,
      recipientCount: byRecipient.size
    });

  } catch (error) {
    loggerService.error('[email-worker] Batch failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

export function createNotificationEmailWorker(): Worker<NotificationEmailJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<NotificationEmailJobData>(
    NOTIFICATION_EMAIL_QUEUE_NAME,
    processNotificationEmailJob,
    {
      connection,
      concurrency: 1
    }
  );

  worker.on('completed', (job) => {
    loggerService.debug('[email-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[email-worker] Job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[email-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[email-worker] Job stalled', { jobId });
  });

  loggerService.info('[email-worker] Worker started');
  return worker;
}

export async function closeNotificationEmailWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[email-worker] Worker closed');
}
