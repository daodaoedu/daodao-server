/**
 * Badge Award Worker
 *
 * 每小時掃描 badges WHERE trigger_type = 'auto'，
 * 解析 trigger_condition JSON 並查詢符合條件的用戶，
 * 自動頒發徽章（INSERT ON CONFLICT DO NOTHING 避免重複）。
 *
 * trigger_condition 格式範例：
 * - { "type": "post_count", "value": 10 }     — 發文數 >= 10
 * - { "type": "checkin_streak", "value": 30 }  — 打卡天數 >= 30
 * - { "type": "likes_received", "value": 100 } — 收到的讚 >= 100
 * - { "type": "days_visited", "value": 60 }    — 造訪天數 >= 60
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  BADGE_AWARD_QUEUE_NAME,
  type BadgeAwardJobData,
} from './badge-award.queue';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

interface AutoBadgeRow {
  id: number;
  name: string;
  trigger_condition: string;
}

interface TriggerCondition {
  type: string;
  value: number;
}

// ─── 工具函式 ──────────────────────────────────────────────────────────────────

/**
 * 解析 trigger_condition 欄位（JSON 字串或物件）
 */
function parseTriggerCondition(raw: string): TriggerCondition | null {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed.type === 'string' && typeof parsed.value === 'number') {
      return parsed as TriggerCondition;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 根據 trigger condition 查詢符合條件的用戶 ID 列表
 */
async function findQualifiedUserIds(condition: TriggerCondition): Promise<number[]> {
  switch (condition.type) {
    case 'post_count': {
      const rows = await prisma.$queryRaw<Array<{ user_id: number }>>`
        SELECT user_id FROM (
          SELECT user_id, COUNT(*)::int AS cnt FROM resources GROUP BY user_id
        ) sub WHERE cnt >= ${condition.value}
      `;
      return rows.map(r => r.user_id);
    }
    case 'checkin_streak': {
      const rows = await prisma.$queryRaw<Array<{ user_id: number }>>`
        SELECT user_id FROM (
          SELECT user_id, COUNT(DISTINCT checkin_date)::int AS cnt
          FROM practice_checkins GROUP BY user_id
        ) sub WHERE cnt >= ${condition.value}
      `;
      return rows.map(r => r.user_id);
    }
    case 'likes_received': {
      const rows = await prisma.$queryRaw<Array<{ user_id: number }>>`
        SELECT r.user_id FROM reactions re
        JOIN resources r ON re.target_id = r.id AND re.target_type = 'resource'
        GROUP BY r.user_id
        HAVING COUNT(*)::int >= ${condition.value}
      `;
      return rows.map(r => r.user_id);
    }
    case 'days_visited': {
      const rows = await prisma.$queryRaw<Array<{ user_id: number }>>`
        SELECT id AS user_id FROM (
          SELECT id, COUNT(DISTINCT DATE(last_login_at))::int AS cnt
          FROM users
          WHERE last_login_at IS NOT NULL
          GROUP BY id
        ) sub WHERE cnt >= ${condition.value}
      `;
      return rows.map(r => r.user_id);
    }
    default: {
      loggerService.warn('[badge-award-worker] Unknown trigger condition type', {
        type: condition.type,
      });
      return [];
    }
  }
}

// ─── 處理邏輯 ──────────────────────────────────────────────────────────────────

async function processBadgeAwardJob(job: Job<BadgeAwardJobData>): Promise<void> {
  loggerService.info('[badge-award-worker] Scan started', { jobId: job.id });

  try {
    // 1. 查詢所有 auto 類型的徽章
    const badges = await prisma.$queryRaw<AutoBadgeRow[]>`
      SELECT id, name, trigger_condition
      FROM badges
      WHERE trigger_type = 'auto'
    `;

    if (badges.length === 0) {
      loggerService.info('[badge-award-worker] No auto badges found, skipping', { jobId: job.id });
      return;
    }

    let totalAwarded = 0;

    // 2. 逐徽章處理
    for (const badge of badges) {
      try {
        const condition = parseTriggerCondition(badge.trigger_condition);

        if (!condition) {
          loggerService.warn('[badge-award-worker] Invalid trigger condition', {
            badgeId: badge.id,
            badgeName: badge.name,
            triggerCondition: badge.trigger_condition,
          });
          continue;
        }

        const qualifiedUserIds = await findQualifiedUserIds(condition);

        if (qualifiedUserIds.length === 0) {
          loggerService.debug('[badge-award-worker] No qualified users for badge', {
            badgeId: badge.id,
            badgeName: badge.name,
          });
          continue;
        }

        // 3. 逐用戶頒發（ON CONFLICT DO NOTHING 避免重複）
        let awardedForBadge = 0;
        for (const userId of qualifiedUserIds) {
          const result = await prisma.$executeRaw`
            INSERT INTO user_badges (badge_id, user_id, awarded_at)
            VALUES (${badge.id}, ${userId}, NOW())
            ON CONFLICT DO NOTHING
          `;

          if (result > 0) {
            awardedForBadge++;
          }
        }

        totalAwarded += awardedForBadge;

        if (awardedForBadge > 0) {
          loggerService.info('[badge-award-worker] Badges awarded', {
            badgeId: badge.id,
            badgeName: badge.name,
            newlyAwarded: awardedForBadge,
            qualifiedTotal: qualifiedUserIds.length,
          });
        }
      } catch (badgeErr) {
        loggerService.error('[badge-award-worker] Failed to process badge', {
          badgeId: badge.id,
          error: badgeErr instanceof Error ? badgeErr.message : String(badgeErr),
        });
        // 繼續處理下一個徽章
      }
    }

    loggerService.info('[badge-award-worker] Scan completed', {
      jobId: job.id,
      badgeCount: badges.length,
      totalAwarded,
    });
  } catch (error) {
    loggerService.error('[badge-award-worker] Scan failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

/**
 * 建立 Badge Award Worker
 */
export function createBadgeAwardWorker(): Worker<BadgeAwardJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<BadgeAwardJobData>(
    BADGE_AWARD_QUEUE_NAME,
    processBadgeAwardJob,
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    loggerService.debug('[badge-award-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[badge-award-worker] Job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[badge-award-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[badge-award-worker] Job stalled', { jobId });
  });

  loggerService.info('[badge-award-worker] Worker started');
  return worker;
}

/**
 * 關閉 Badge Award Worker
 */
export async function closeBadgeAwardWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[badge-award-worker] Worker closed');
}
