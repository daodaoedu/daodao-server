/**
 * Anomaly Alert Worker
 *
 * 每 5 分鐘掃描 alert_rules WHERE is_enabled = true，
 * 查詢各規則對應的即時指標數值，
 * 與閾值比對後觸發告警（寫入 alert_history 並發送通知）。
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  ANOMALY_ALERT_QUEUE_NAME,
  type AnomalyAlertJobData,
} from './anomaly-alert.queue';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

interface AlertRuleRow {
  id: number;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  notify_channel: string;
  is_enabled: boolean;
}

// ─── 指標查詢 ──────────────────────────────────────────────────────────────────

/**
 * 根據 metric 名稱查詢即時指標數值
 */
async function queryMetricValue(metric: string): Promise<number> {
  switch (metric) {
    case 'user_count': {
      const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM users
      `;
      return Number(row?.count ?? 0);
    }
    case 'active_users': {
      const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT id)::bigint AS count FROM users
        WHERE last_login_at >= NOW() - INTERVAL '1 hour'
      `;
      return Number(row?.count ?? 0);
    }
    case 'new_registrations_hourly': {
      const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM users
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `;
      return Number(row?.count ?? 0);
    }
    case 'error_rate': {
      // 查詢最近 5 分鐘的錯誤率（audit_logs 中 action 含 error 的比例）
      const [row] = await prisma.$queryRaw<Array<{ rate: number }>>`
        SELECT COALESCE(
          AVG(CASE WHEN action_type LIKE '%error%' THEN 1.0 ELSE 0.0 END)::float,
          0
        ) AS rate
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '5 minutes'
      `;
      return row?.rate ?? 0;
    }
    case 'resource_count': {
      const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM resources
      `;
      return Number(row?.count ?? 0);
    }
    default: {
      loggerService.warn('[anomaly-alert-worker] Unknown metric', { metric });
      return 0;
    }
  }
}

/**
 * 判斷指標是否觸發告警
 */
function isTriggered(condition: string, metricValue: number, threshold: number): boolean {
  switch (condition) {
    case 'above':
      return metricValue > threshold;
    case 'below':
      return metricValue < threshold;
    case 'change_percent':
      // change_percent 需要前一次數值比對，暫以 threshold 作為絕對值比較
      return Math.abs(metricValue) > threshold;
    default:
      return false;
  }
}

// ─── 處理邏輯 ──────────────────────────────────────────────────────────────────

async function processAnomalyAlertJob(job: Job<AnomalyAlertJobData>): Promise<void> {
  loggerService.info('[anomaly-alert-worker] Check started', { jobId: job.id });

  try {
    // 1. 查詢啟用中的告警規則
    const rules = await prisma.$queryRaw<AlertRuleRow[]>`
      SELECT id, name, metric, condition, threshold, notify_channel, is_enabled
      FROM alert_rules
      WHERE is_enabled = true
    `;

    if (rules.length === 0) {
      loggerService.info('[anomaly-alert-worker] No active rules, skipping', { jobId: job.id });
      return;
    }

    let triggeredCount = 0;

    // 2. 逐條規則檢查
    for (const rule of rules) {
      try {
        const metricValue = await queryMetricValue(rule.metric);
        const triggered = isTriggered(rule.condition, metricValue, rule.threshold);

        if (!triggered) {
          continue;
        }

        triggeredCount++;

        // 防重複：檢查最近 5 分鐘是否已有同一 rule 的 pending 告警
        const [existing] = await prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM alert_history
          WHERE rule_id = ${rule.id}
            AND status = 'pending'
            AND triggered_at >= NOW() - INTERVAL '5 minutes'
          LIMIT 1
        `;

        if (existing) {
          loggerService.debug('[anomaly-alert-worker] Alert already pending, skipping', {
            ruleId: rule.id,
          });
          continue;
        }

        // 寫入 alert_history
        await prisma.$executeRaw`
          INSERT INTO alert_history (rule_id, metric_value, threshold, status, triggered_at)
          VALUES (${rule.id}, ${metricValue}, ${rule.threshold}, 'pending', NOW())
        `;

        // TODO: 依 notify_channel 發送通知（email / in_app / both）
        loggerService.warn('[anomaly-alert-worker] Alert triggered', {
          ruleId: rule.id,
          ruleName: rule.name,
          metric: rule.metric,
          metricValue,
          threshold: rule.threshold,
          condition: rule.condition,
          notifyChannel: rule.notify_channel,
        });
      } catch (ruleErr) {
        loggerService.error('[anomaly-alert-worker] Failed to check rule', {
          ruleId: rule.id,
          error: ruleErr instanceof Error ? ruleErr.message : String(ruleErr),
        });
        // 繼續處理下一條規則
      }
    }

    loggerService.info('[anomaly-alert-worker] Check completed', {
      jobId: job.id,
      ruleCount: rules.length,
      triggeredCount,
    });
  } catch (error) {
    loggerService.error('[anomaly-alert-worker] Check failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

/**
 * 建立 Anomaly Alert Worker
 */
export function createAnomalyAlertWorker(): Worker<AnomalyAlertJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<AnomalyAlertJobData>(
    ANOMALY_ALERT_QUEUE_NAME,
    processAnomalyAlertJob,
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    loggerService.debug('[anomaly-alert-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[anomaly-alert-worker] Job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[anomaly-alert-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[anomaly-alert-worker] Job stalled', { jobId });
  });

  loggerService.info('[anomaly-alert-worker] Worker started');
  return worker;
}

/**
 * 關閉 Anomaly Alert Worker
 */
export async function closeAnomalyAlertWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[anomaly-alert-worker] Worker closed');
}
