/**
 * Trust Level Worker
 *
 * 每日執行，評估所有用戶的活動指標與 trust_level_configs 晉升條件，
 * 自動晉升或降級用戶信任等級，並遵守 14 天保護期（grace period）。
 *
 * 評估指標：
 * - readCount：閱讀次數
 * - postCount：發文數
 * - daysVisited：造訪天數
 * - likesGiven：送出的讚
 * - likesReceived：收到的讚
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  TRUST_LEVEL_QUEUE_NAME,
  type TrustLevelJobData,
} from './trust-level.queue';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

interface TrustConfigRow {
  level: number;
  name: string;
  promotion_criteria: Record<string, number>;
}

interface UserTrustRow {
  user_id: number;
  level: number;
  updated_at: Date | null;
}

interface UserMetrics {
  user_id: number;
  read_count: number;
  post_count: number;
  days_visited: number;
  likes_given: number;
  likes_received: number;
}

// ─── 常數 ──────────────────────────────────────────────────────────────────────

/** 保護期天數 — 晉升/降級後 14 天內不再調整 */
const GRACE_PERIOD_DAYS = 14;

// ─── 工具函式 ──────────────────────────────────────────────────────────────────

/**
 * 判斷用戶是否在保護期內
 */
function isInGracePeriod(updatedAt: Date | null): boolean {
  if (!updatedAt) return false;
  const gracePeriodEnd = new Date(updatedAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  return new Date() < gracePeriodEnd;
}

/**
 * 判斷用戶指標是否滿足某等級的晉升條件
 */
function meetsPromotionCriteria(
  metrics: UserMetrics,
  criteria: Record<string, number>,
): boolean {
  const readCount = criteria.readCount ?? criteria.read_count ?? 0;
  const postCount = criteria.postCount ?? criteria.post_count ?? 0;
  const daysVisited = criteria.daysVisited ?? criteria.days_visited ?? 0;
  const likesGiven = criteria.likesGiven ?? criteria.likes_given ?? 0;
  const likesReceived = criteria.likesReceived ?? criteria.likes_received ?? 0;

  return (
    metrics.read_count >= readCount &&
    metrics.post_count >= postCount &&
    metrics.days_visited >= daysVisited &&
    metrics.likes_given >= likesGiven &&
    metrics.likes_received >= likesReceived
  );
}

// ─── 處理邏輯 ──────────────────────────────────────────────────────────────────

async function processTrustLevelJob(job: Job<TrustLevelJobData>): Promise<void> {
  loggerService.info('[trust-level-worker] Evaluation started', { jobId: job.id });

  try {
    // 1. 載入所有信任等級設定（按 level 排序）
    const configs = await prisma.$queryRaw<TrustConfigRow[]>`
      SELECT level, name, promotion_criteria
      FROM trust_level_configs
      ORDER BY level ASC
    `;

    if (configs.length === 0) {
      loggerService.info('[trust-level-worker] No trust configs found, skipping', { jobId: job.id });
      return;
    }

    // 2. 查詢所有用戶的目前信任等級
    const userTrustLevels = await prisma.$queryRaw<UserTrustRow[]>`
      SELECT user_id, level, updated_at
      FROM user_trust_levels
    `;

    const trustMap = new Map<number, UserTrustRow>();
    for (const row of userTrustLevels) {
      trustMap.set(row.user_id, row);
    }

    // 3. 查詢所有用戶的活動指標（近 90 天）
    const userMetrics = await prisma.$queryRaw<UserMetrics[]>`
      SELECT
        u.id AS user_id,
        COALESCE((
          SELECT COUNT(*) FROM resource_reads rr WHERE rr.user_id = u.id
        ), 0)::int AS read_count,
        COALESCE((
          SELECT COUNT(*) FROM resources r WHERE r.user_id = u.id
        ), 0)::int AS post_count,
        COALESCE((
          SELECT COUNT(DISTINCT DATE(last_login_at)) FROM users
          WHERE id = u.id AND last_login_at >= NOW() - INTERVAL '90 days'
        ), 0)::int AS days_visited,
        COALESCE((
          SELECT COUNT(*) FROM reactions re WHERE re.user_id = u.id
        ), 0)::int AS likes_given,
        COALESCE((
          SELECT COUNT(*) FROM reactions re
          JOIN resources r ON re.target_id = r.id AND re.target_type = 'resource'
          WHERE r.user_id = u.id
        ), 0)::int AS likes_received
      FROM users u
    `;

    let promotedCount = 0;
    let demotedCount = 0;

    // 4. 逐用戶評估
    for (const metrics of userMetrics) {
      try {
        const currentTrust = trustMap.get(metrics.user_id);
        const currentLevel = currentTrust?.level ?? 0;

        // 保護期檢查
        if (currentTrust && isInGracePeriod(currentTrust.updated_at)) {
          continue;
        }

        // 計算應達等級：從最高等級往下找到第一個滿足條件的
        let targetLevel = 0;
        for (const config of configs) {
          if (config.level === 0) continue; // Level 0 無晉升條件
          if (meetsPromotionCriteria(metrics, config.promotion_criteria)) {
            targetLevel = config.level;
          }
        }

        if (targetLevel === currentLevel) {
          continue; // 等級不變
        }

        // 更新信任等級
        await prisma.$executeRaw`
          INSERT INTO user_trust_levels (user_id, level, updated_at)
          VALUES (${metrics.user_id}, ${targetLevel}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET level = ${targetLevel}, updated_at = NOW()
        `;

        // 記錄變更歷史
        await prisma.$executeRaw`
          INSERT INTO trust_level_history (user_id, from_level, to_level, reason, created_at)
          VALUES (${metrics.user_id}, ${currentLevel}, ${targetLevel}, 'auto', NOW())
        `;

        if (targetLevel > currentLevel) {
          promotedCount++;
        } else {
          demotedCount++;
        }

        loggerService.info('[trust-level-worker] Trust level changed', {
          userId: metrics.user_id,
          fromLevel: currentLevel,
          toLevel: targetLevel,
        });
      } catch (userErr) {
        loggerService.error('[trust-level-worker] Failed to evaluate user', {
          userId: metrics.user_id,
          error: userErr instanceof Error ? userErr.message : String(userErr),
        });
        // 繼續處理下一位用戶
      }
    }

    loggerService.info('[trust-level-worker] Evaluation completed', {
      jobId: job.id,
      totalUsers: userMetrics.length,
      promotedCount,
      demotedCount,
    });
  } catch (error) {
    loggerService.error('[trust-level-worker] Evaluation failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

/**
 * 建立 Trust Level Worker
 */
export function createTrustLevelWorker(): Worker<TrustLevelJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<TrustLevelJobData>(
    TRUST_LEVEL_QUEUE_NAME,
    processTrustLevelJob,
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    loggerService.debug('[trust-level-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[trust-level-worker] Job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[trust-level-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[trust-level-worker] Job stalled', { jobId });
  });

  loggerService.info('[trust-level-worker] Worker started');
  return worker;
}

/**
 * 關閉 Trust Level Worker
 */
export async function closeTrustLevelWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[trust-level-worker] Worker closed');
}
