/**
 * Notification Weekly Digest Worker
 *
 * 每週日 20:00 UTC+8（= 12:00 UTC）執行，
 * 統計本週（UTC+8 週一 00:00 ~ 週日 23:59）各 recipient 收到的事件，
 * 並依 notification_preferences (N01 channel) 決定是否發送週報 email。
 *
 * UTC+8 週一 00:00 = UTC 週日 16:00（前一天）
 * UTC+8 週日 23:59 = UTC 週日 15:59（同天）
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  NOTIFICATION_WEEKLY_QUEUE_NAME,
  type NotificationWeeklyJobData
} from './notification.queue';
import {
  generateWeeklyDigestHtml,
  generateWeeklyDigestSubject,
  type WeeklyDigestData,
} from '../services/email/notification-weekly-template';
import {
  generateUnsubscribeUrl,
  generateSettingsUrl,
} from '../services/notification-unsubscribe.service';
import { emailService } from '../services/email/email.service';
import {
  createEmailLog,
  updateEmailLogStatus,
  hasEmailBeenSent,
} from '../services/email/email-log.service';
import { EMAIL_TYPES, EMAIL_STATUS } from '../types/email';

// ─── 常數 ──────────────────────────────────────────────────────────────────────

/** notification_preferences 中代表 email 的 channel 值 */
const EMAIL_CHANNEL = 'N01';

/** UTC+8 與 UTC 的偏移（毫秒） */
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

// ─── 工具函式 ──────────────────────────────────────────────────────────────────

/**
 * 計算本次週報的時間範圍（UTC）
 *
 * 執行時間約為週日 12:00 UTC（= 週日 20:00 UTC+8）。
 * 本週範圍定義：
 *   - 週一 00:00 UTC+8 = 上週日 16:00 UTC（以 ISO week 計算）
 *   - 週日 23:59:59 UTC+8 = 週日 15:59:59 UTC（即本次執行前一刻）
 *
 * 為簡化計算，直接取「現在往前 7 天」作為週起點（UTC+8 週一 00:00 對齊）。
 */
function getWeeklyRange(now: Date): { weekStart: Date; weekEnd: Date } {
  // 轉換為 UTC+8 視角的「當前時刻」
  const nowUtc8 = new Date(now.getTime() + UTC8_OFFSET_MS);

  // 找到 UTC+8 本週一 00:00（ISO week：週一為第一天）
  const dayOfWeek = nowUtc8.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const mondayUtc8Midnight = new Date(nowUtc8);
  mondayUtc8Midnight.setUTCHours(0, 0, 0, 0);
  mondayUtc8Midnight.setUTCDate(mondayUtc8Midnight.getUTCDate() - daysFromMonday);

  // 週日 23:59:59.999 UTC+8
  const sundayUtc8End = new Date(mondayUtc8Midnight);
  sundayUtc8End.setUTCDate(sundayUtc8End.getUTCDate() + 6);
  sundayUtc8End.setUTCHours(23, 59, 59, 999);

  // 轉回 UTC
  const weekStart = new Date(mondayUtc8Midnight.getTime() - UTC8_OFFSET_MS);
  const weekEnd = new Date(sundayUtc8End.getTime() - UTC8_OFFSET_MS);

  return { weekStart, weekEnd };
}

// ─── 批次處理邏輯 ──────────────────────────────────────────────────────────────

async function processNotificationWeeklyJob(job: Job<NotificationWeeklyJobData>): Promise<void> {
  loggerService.info('[weekly-worker] Batch started', { jobId: job.id });

  try {
    const now = new Date();
    const { weekStart, weekEnd } = getWeeklyRange(now);

    loggerService.info('[weekly-worker] Week range', {
      jobId: job.id,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString()
    });

    // 1. 查詢本週範圍內的所有事件
    const events = await prisma.notification_events.findMany({
      where: {
        created_at: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      select: {
        recipient_id: true,
        type: true,
        priority: true
      }
    });

    if (events.length === 0) {
      loggerService.info('[weekly-worker] No events this week, skipping', { jobId: job.id });
      return;
    }

    // 2. 按 recipient_id 分組，統計各類型 count
    const byRecipient = new Map<number, Map<string, number>>();
    for (const event of events) {
      const typeStats = byRecipient.get(event.recipient_id) ?? new Map<string, number>();
      typeStats.set(event.type, (typeStats.get(event.type) ?? 0) + 1);
      byRecipient.set(event.recipient_id, typeStats);
    }

    loggerService.info('[weekly-worker] Recipients to process', {
      jobId: job.id,
      recipientCount: byRecipient.size
    });

    // 3. 對每位 recipient 確認偏好並發送
    for (const [recipientId, typeStats] of byRecipient) {
      try {
        // 3a. 查詢 N01 週報偏好設定
        const eventTypes = [...typeStats.keys()];
        const preferences = await prisma.notification_preferences.findMany({
          where: {
            user_id: recipientId,
            channel: EMAIL_CHANNEL,
            notification_type: { in: eventTypes }
          }
        });

        const prefMap = new Map<string, boolean>();
        for (const pref of preferences) {
          prefMap.set(pref.notification_type, pref.is_enabled ?? true);
        }

        // 3b. 過濾出允許接收 email 的類型統計
        const allowedStats: Record<string, number> = {};
        for (const [type, count] of typeStats) {
          const enabled = prefMap.get(type);
          if (enabled !== false) {
            allowedStats[type] = count;
          }
        }

        if (Object.keys(allowedStats).length === 0) {
          loggerService.debug('[weekly-worker] All event types disabled for user', { recipientId });
          continue;
        }

        // 3c. 查詢 recipient 暱稱與 email（email 位於關聯的 contacts 表）
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
          loggerService.warn('[weekly-worker] Recipient has no email, skipping', { recipientId });
          continue;
        }

        // 週起訖日（UTC+8 顯示，格式 M/D）
        const toUtc8Label = (d: Date): string => {
          const utc8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
          return `${utc8.getUTCMonth() + 1}/${utc8.getUTCDate()}`;
        };

        // 將 allowedStats 映射成 WeeklyDigestStats 欄位
        const statsTyped = {
          reactions:       allowedStats['reaction'] ?? 0,
          comments:        (allowedStats['comment'] ?? 0) + (allowedStats['comment_reply'] ?? 0),
          newFollowers:    (allowedStats['UserFollowed'] ?? 0) + (allowedStats['PracticeFollowed'] ?? 0),
          connectRequests: allowedStats['Connect'] ?? 0,
        };

        // 3d. 查詢該用戶進行中的實踐及本週打卡次數
        // 過濾條件直接放在 DB 查詢中，避免 take: 5 在記憶體過濾前就截斷結果
        const practices = await prisma.practices.findMany({
          where: {
            user_id: recipientId,
            OR: [
              { status: 'completed', updated_at: { gte: weekStart, lte: weekEnd } },
              {
                status: 'active',
                practice_checkins: {
                  some: {
                    checkin_date: { gte: weekStart, lte: weekEnd },
                  },
                },
              },
            ],
          },
          select: {
            title: true,
            status: true,
            practice_checkins: {
              where: {
                checkin_date: { gte: weekStart, lte: weekEnd },
              },
              select: { id: true },
            },
          },
          orderBy: { updated_at: 'desc' },
          take: 5,
        });

        const practiceProgress = practices.map((p) => ({
          title: p.title,
          checkInCount: p.practice_checkins.length,
          status: p.status === 'completed'
            ? 'completed' as const
            : p.practice_checkins.length > 0
            ? 'in_progress' as const
            : 'not_started' as const,
        }));

        const weeklyData: WeeklyDigestData = {
          recipientName,
          weekStart:       toUtc8Label(weekStart),
          weekEnd:         toUtc8Label(weekEnd),
          stats:           statsTyped,
          practiceProgress,
          unsubscribeUrl:  generateUnsubscribeUrl(recipientId, 'weekly'),
          settingsUrl:     generateSettingsUrl(),
        };

        const subject = generateWeeklyDigestSubject(weeklyData);
        const html = generateWeeklyDigestHtml(weeklyData);

        // 防重複：BullMQ retry 保護
        const alreadySent = await hasEmailBeenSent({
          userId: recipientId,
          emailType: EMAIL_TYPES.NOTIFICATION_WEEKLY,
          since: weekStart,
        });
        if (alreadySent) {
          loggerService.info('[weekly-worker] Weekly already sent this week, skipping', { recipientId });
          continue;
        }

        // 建立 pending log
        let logRecord: { id: number; tracking_token: string | null } | null = null;
        try {
          logRecord = await createEmailLog({
            userId: recipientId,
            emailType: EMAIL_TYPES.NOTIFICATION_WEEKLY,
            subject,
            status: EMAIL_STATUS.PENDING,
          });
        } catch (logErr) {
          loggerService.error('[weekly-worker] Failed to create email log', {
            recipientId,
            error: logErr instanceof Error ? logErr.message : String(logErr),
          });
        }

        const result = await emailService.sendEmail({
          to: recipientEmail,
          subject,
          html,
          trackingToken: logRecord?.tracking_token ?? undefined,
        });

        try {
          if (logRecord) {
            await updateEmailLogStatus(logRecord.id, result.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED);
          }
        } catch (logErr) {
          loggerService.error('[weekly-worker] Failed to update email log status', {
            recipientId,
            error: logErr instanceof Error ? logErr.message : String(logErr),
          });
        }

        if (result.success) {
          loggerService.info('[weekly-worker] Weekly digest email sent', {
            recipientId,
            subject,
            stats: statsTyped,
          });
        } else {
          loggerService.error('[weekly-worker] Failed to send weekly digest email', {
            recipientId,
            error: result.error,
          });
        }

      } catch (err) {
        loggerService.error('[weekly-worker] Failed to process recipient', {
          recipientId,
          error: err instanceof Error ? err.message : String(err)
        });
        // 繼續處理下一位，不讓整批失敗
      }
    }

    loggerService.info('[weekly-worker] Batch completed', {
      jobId: job.id,
      recipientCount: byRecipient.size
    });

  } catch (error) {
    loggerService.error('[weekly-worker] Batch failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

export function createNotificationWeeklyWorker(): Worker<NotificationWeeklyJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<NotificationWeeklyJobData>(
    NOTIFICATION_WEEKLY_QUEUE_NAME,
    processNotificationWeeklyJob,
    {
      connection,
      concurrency: 1
    }
  );

  worker.on('completed', (job) => {
    loggerService.debug('[weekly-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[weekly-worker] Job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[weekly-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[weekly-worker] Job stalled', { jobId });
  });

  loggerService.info('[weekly-worker] Worker started');
  return worker;
}

export async function closeNotificationWeeklyWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[weekly-worker] Worker closed');
}
