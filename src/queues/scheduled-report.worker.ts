/**
 * Scheduled Report Worker
 *
 * 每日 06:00 UTC+8 執行，掃描 scheduled_reports WHERE status = 'active'，
 * 依 frequency（daily / weekly 週一 / monthly 每月 1 號）判斷是否應執行，
 * 產生 KPI 聚合報表並寄送（或 log），記錄至 report_executions。
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  SCHEDULED_REPORT_QUEUE_NAME,
  type ScheduledReportJobData,
} from './scheduled-report.queue';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

interface ScheduledReportRow {
  id: number;
  name: string;
  frequency: string;
  recipients: string[];
  sections: string[];
  last_sent_at: Date | null;
}

// ─── 工具函式 ──────────────────────────────────────────────────────────────────

/** UTC+8 與 UTC 的偏移（毫秒） */
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 判斷今天是否應該執行該報表
 * - daily：每天
 * - weekly：僅週一
 * - monthly：僅每月 1 號
 */
function shouldRunToday(frequency: string, now: Date): boolean {
  // 以 UTC+8 為基準判斷星期幾和日期
  const utc8 = new Date(now.getTime() + UTC8_OFFSET_MS);
  const dayOfWeek = utc8.getUTCDay(); // 0=Sun, 1=Mon
  const dayOfMonth = utc8.getUTCDate();

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return dayOfWeek === 1; // 週一
    case 'monthly':
      return dayOfMonth === 1; // 每月 1 號
    default:
      return false;
  }
}

/**
 * 產生報表內容（KPI 聚合）
 * 根據 sections 欄位動態查詢對應指標
 */
async function generateReportContent(
  sections: string[],
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const section of sections) {
    try {
      switch (section) {
        case 'user_count': {
          const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint AS count FROM users
          `;
          result.user_count = Number(row?.count ?? 0);
          break;
        }
        case 'active_users': {
          const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(DISTINCT id)::bigint AS count FROM users
            WHERE last_login_at >= NOW() - INTERVAL '7 days'
          `;
          result.active_users = Number(row?.count ?? 0);
          break;
        }
        case 'new_registrations': {
          const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint AS count FROM users
            WHERE created_at >= NOW() - INTERVAL '1 day'
          `;
          result.new_registrations = Number(row?.count ?? 0);
          break;
        }
        case 'resource_count': {
          const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint AS count FROM resources
          `;
          result.resource_count = Number(row?.count ?? 0);
          break;
        }
        default:
          result[section] = null; // 未知 section，保留 null
      }
    } catch (err) {
      loggerService.warn('[scheduled-report-worker] Failed to query section', {
        section,
        error: err instanceof Error ? err.message : String(err),
      });
      result[section] = null;
    }
  }

  return result;
}

// ─── 處理邏輯 ──────────────────────────────────────────────────────────────────

async function processScheduledReportJob(job: Job<ScheduledReportJobData>): Promise<void> {
  loggerService.info('[scheduled-report-worker] Job started', { jobId: job.id });

  try {
    const now = new Date();

    // 1. 查詢啟用中的排程報表
    const reports = await prisma.$queryRaw<ScheduledReportRow[]>`
      SELECT id, name, frequency, recipients, sections, last_sent_at
      FROM scheduled_reports
      WHERE status = 'active'
    `;

    if (reports.length === 0) {
      loggerService.info('[scheduled-report-worker] No active reports, skipping', { jobId: job.id });
      return;
    }

    // 2. 逐筆報表處理
    for (const report of reports) {
      try {
        // 判斷今天是否應該執行
        if (!shouldRunToday(report.frequency, now)) {
          loggerService.debug('[scheduled-report-worker] Skipping report (not scheduled today)', {
            reportId: report.id,
            frequency: report.frequency,
          });
          continue;
        }

        // 產生報表內容
        const content = await generateReportContent(report.sections);

        // TODO: 串接 emailService.sendEmail 實際寄送
        loggerService.info('[scheduled-report-worker] Report generated', {
          reportId: report.id,
          reportName: report.name,
          recipients: report.recipients,
          content,
        });

        // 記錄執行結果
        await prisma.$executeRaw`
          INSERT INTO report_executions (report_id, status, content, executed_at)
          VALUES (${report.id}, 'success', ${JSON.stringify(content)}::jsonb, NOW())
        `;

        // 更新 last_sent_at
        await prisma.$executeRaw`
          UPDATE scheduled_reports SET last_sent_at = NOW() WHERE id = ${report.id}
        `;
      } catch (reportErr) {
        // 記錄失敗
        await prisma.$executeRaw`
          INSERT INTO report_executions (report_id, status, error_message, executed_at)
          VALUES (${report.id}, 'failed', ${reportErr instanceof Error ? reportErr.message : String(reportErr)}, NOW())
        `;

        loggerService.error('[scheduled-report-worker] Failed to process report', {
          reportId: report.id,
          error: reportErr instanceof Error ? reportErr.message : String(reportErr),
        });
        // 繼續處理下一筆
      }
    }

    loggerService.info('[scheduled-report-worker] Job completed', {
      jobId: job.id,
      reportCount: reports.length,
    });
  } catch (error) {
    loggerService.error('[scheduled-report-worker] Job failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

/**
 * 建立 Scheduled Report Worker
 */
export function createScheduledReportWorker(): Worker<ScheduledReportJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<ScheduledReportJobData>(
    SCHEDULED_REPORT_QUEUE_NAME,
    processScheduledReportJob,
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    loggerService.debug('[scheduled-report-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[scheduled-report-worker] Job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[scheduled-report-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[scheduled-report-worker] Job stalled', { jobId });
  });

  loggerService.info('[scheduled-report-worker] Worker started');
  return worker;
}

/**
 * 關閉 Scheduled Report Worker
 */
export async function closeScheduledReportWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[scheduled-report-worker] Worker closed');
}
