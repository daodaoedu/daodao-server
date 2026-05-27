/**
 * Email Trigger Worker
 *
 * 每小時掃描 email_trigger_rules WHERE is_enabled = true，
 * 對符合條件的用戶寄送觸發式信件，並記錄執行結果。
 *
 * 條件類型：
 * - dormant_days：最後登入距今超過 N 天的用戶
 * - no_action_days：最後活動距今超過 N 天的用戶
 * - tag_change：標籤異動（保留擴充）
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { prisma } from '../services/database/prisma.service';
import {
  EMAIL_TRIGGER_QUEUE_NAME,
  type EmailTriggerJobData,
} from './email-trigger.queue';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

interface TriggerRuleRow {
  id: number;
  name: string;
  condition_type: string;
  condition_value: string;
  template_id: number;
  is_enabled: boolean;
}

interface TemplateRow {
  id: number;
  subject: string;
  body: string;
}

interface MatchedUser {
  id: number;
  email: string | null;
  nickname: string | null;
}

// ─── 處理邏輯 ──────────────────────────────────────────────────────────────────

/**
 * 根據條件類型查詢符合的用戶
 */
async function findMatchingUsers(
  conditionType: string,
  conditionValue: string,
): Promise<MatchedUser[]> {
  const days = parseInt(conditionValue, 10);

  if (conditionType === 'dormant_days' && !isNaN(days)) {
    // 最後登入距今超過 N 天
    return prisma.$queryRaw<MatchedUser[]>`
      SELECT u.id, c.email, u.nickname
      FROM users u
      LEFT JOIN contacts c ON u.id = c.user_id
      WHERE u.last_login_at < NOW() - MAKE_INTERVAL(days => ${days})
        AND u.last_login_at IS NOT NULL
        AND c.email IS NOT NULL
    `;
  }

  if (conditionType === 'no_action_days' && !isNaN(days)) {
    // 最後活動距今超過 N 天（以 resources 發表時間為依據）
    return prisma.$queryRaw<MatchedUser[]>`
      SELECT u.id, c.email, u.nickname
      FROM users u
      LEFT JOIN contacts c ON u.id = c.user_id
      WHERE u.id NOT IN (
        SELECT DISTINCT user_id FROM resources
        WHERE created_at >= NOW() - MAKE_INTERVAL(days => ${days})
      )
      AND c.email IS NOT NULL
    `;
  }

  // tag_change 等其他條件類型：保留擴充
  loggerService.warn('[email-trigger-worker] Unsupported condition type', { conditionType });
  return [];
}

/**
 * 處理單次觸發掃描
 */
async function processEmailTriggerJob(job: Job<EmailTriggerJobData>): Promise<void> {
  loggerService.info('[email-trigger-worker] Scan started', { jobId: job.id });

  try {
    // 1. 查詢啟用中的觸發規則
    const rules = await prisma.$queryRaw<TriggerRuleRow[]>`
      SELECT id, name, condition_type, condition_value, template_id, is_enabled
      FROM email_trigger_rules
      WHERE is_enabled = true
    `;

    if (rules.length === 0) {
      loggerService.info('[email-trigger-worker] No active rules, skipping', { jobId: job.id });
      return;
    }

    loggerService.info('[email-trigger-worker] Active rules found', {
      jobId: job.id,
      ruleCount: rules.length,
    });

    // 2. 逐條規則處理
    for (const rule of rules) {
      try {
        const matchedUsers = await findMatchingUsers(rule.condition_type, rule.condition_value);

        if (matchedUsers.length === 0) {
          loggerService.debug('[email-trigger-worker] No matching users for rule', {
            ruleId: rule.id,
            ruleName: rule.name,
          });
          continue;
        }

        // 查詢信件模板
        const [template] = await prisma.$queryRaw<TemplateRow[]>`
          SELECT id, subject, body FROM email_templates WHERE id = ${rule.template_id}
        `;

        if (!template) {
          loggerService.warn('[email-trigger-worker] Template not found', {
            ruleId: rule.id,
            templateId: rule.template_id,
          });
          continue;
        }

        // 3. 對每位用戶記錄執行並寄送（或 log）
        for (const user of matchedUsers) {
          try {
            // 檢查是否已寄送過（避免重複）
            const [existing] = await prisma.$queryRaw<Array<{ id: number }>>`
              SELECT id FROM email_execution_logs
              WHERE rule_id = ${rule.id} AND user_id = ${user.id}
                AND sent_at >= NOW() - INTERVAL '24 hours'
              LIMIT 1
            `;

            if (existing) {
              continue; // 24 小時內已寄送，跳過
            }

            // TODO: 串接 emailService.sendEmail 實際寄送
            // 目前先記錄到 execution log
            await prisma.$executeRaw`
              INSERT INTO email_execution_logs (rule_id, user_id, recipient_email, status, sent_at)
              VALUES (${rule.id}, ${user.id}, ${user.email}, 'sent', NOW())
            `;

            loggerService.info('[email-trigger-worker] Email triggered', {
              ruleId: rule.id,
              ruleName: rule.name,
              userId: user.id,
              email: user.email,
            });
          } catch (userErr) {
            // 記錄失敗但繼續處理下一位用戶
            await prisma.$executeRaw`
              INSERT INTO email_execution_logs (rule_id, user_id, recipient_email, status, sent_at)
              VALUES (${rule.id}, ${user.id}, ${user.email}, 'failed', NOW())
            `;

            loggerService.error('[email-trigger-worker] Failed to process user', {
              ruleId: rule.id,
              userId: user.id,
              error: userErr instanceof Error ? userErr.message : String(userErr),
            });
          }
        }

        // 更新規則的寄送統計
        await prisma.$executeRaw`
          UPDATE email_trigger_rules
          SET total_sent = (
            SELECT COUNT(*) FROM email_execution_logs
            WHERE rule_id = ${rule.id} AND status = 'sent'
          )
          WHERE id = ${rule.id}
        `;
      } catch (ruleErr) {
        loggerService.error('[email-trigger-worker] Failed to process rule', {
          ruleId: rule.id,
          error: ruleErr instanceof Error ? ruleErr.message : String(ruleErr),
        });
        // 繼續處理下一條規則
      }
    }

    loggerService.info('[email-trigger-worker] Scan completed', {
      jobId: job.id,
      ruleCount: rules.length,
    });
  } catch (error) {
    loggerService.error('[email-trigger-worker] Scan failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ─── Worker 建立 ───────────────────────────────────────────────────────────────

/**
 * 建立 Email Trigger Worker
 */
export function createEmailTriggerWorker(): Worker<EmailTriggerJobData> {
  const connection = getQueueConnection();

  const worker = new Worker<EmailTriggerJobData>(
    EMAIL_TRIGGER_QUEUE_NAME,
    processEmailTriggerJob,
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    loggerService.debug('[email-trigger-worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('[email-trigger-worker] Job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    loggerService.error('[email-trigger-worker] Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('[email-trigger-worker] Job stalled', { jobId });
  });

  loggerService.info('[email-trigger-worker] Worker started');
  return worker;
}

/**
 * 關閉 Email Trigger Worker
 */
export async function closeEmailTriggerWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('[email-trigger-worker] Worker closed');
}
