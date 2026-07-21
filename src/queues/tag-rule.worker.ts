/**
 * Tag Rule Evaluation Worker
 *
 * BullMQ Worker 評估啟用中的自動標籤規則，
 * 為符合條件且尚未擁有該標籤的用戶自動打標籤
 */

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';
import { Prisma } from '../../generated/prisma';
import { prisma } from '../services/database/prisma.service';
import { TAG_RULE_QUEUE_NAME } from './tag-rule.queue';
import type { TagRuleJobData } from './tag-rule.queue';

export interface TagRuleWorkerOptions {
  concurrency?: number;
}

const defaultOptions: TagRuleWorkerOptions = {
  concurrency: 1,
};

interface RuleRow {
  id: number;
  tag_id: number;
  condition_type: string;
  condition_operator: string;
  condition_value: string;
  is_enabled: boolean;
}

function toSqlOperator(op: string): string {
  switch (op) {
    case 'gt': return '>';
    case 'gte': return '>=';
    case 'lt': return '<';
    case 'lte': return '<=';
    case 'eq': return '=';
    default: throw new Error(`Unsupported SQL operator: ${op}`);
  }
}

async function findMatchingUserIds(
  conditionType: string,
  sqlOp: string,
  value: number,
  tagId: number,
): Promise<number[]> {
  const op = Prisma.raw(sqlOp);
  type Row = { user_id: number };
  let rows: Row[];

  switch (conditionType) {
    case 'practice_count':
      rows = await prisma.$queryRaw<Row[]>`
        SELECT u.id AS user_id FROM users u
        WHERE (
          SELECT COUNT(*) FROM practices p
          WHERE p.user_id = u.id AND p.deleted_at IS NULL
        ) ${op} ${value}
        AND u.id NOT IN (
          SELECT user_id FROM user_tag_assignments WHERE tag_id = ${tagId}
        )
      `;
      break;

    case 'days_since_login':
      rows = await prisma.$queryRaw<Row[]>`
        SELECT u.id AS user_id FROM users u
        LEFT JOIN user_activity_stats uas ON uas.id = u.activity_stats_id
        WHERE EXTRACT(EPOCH FROM (NOW() - COALESCE(uas.last_login_at, u.created_at))) / 86400
        ${op} ${value}
        AND u.id NOT IN (
          SELECT user_id FROM user_tag_assignments WHERE tag_id = ${tagId}
        )
      `;
      break;

    case 'connection_count':
      rows = await prisma.$queryRaw<Row[]>`
        SELECT u.id AS user_id FROM users u
        WHERE (
          SELECT COUNT(*) FROM connections c
          WHERE c.user_a_id = u.id OR c.user_b_id = u.id
        ) ${op} ${value}
        AND u.id NOT IN (
          SELECT user_id FROM user_tag_assignments WHERE tag_id = ${tagId}
        )
      `;
      break;

    case 'role_level':
      rows = await prisma.$queryRaw<Row[]>`
        SELECT u.id AS user_id FROM users u
        WHERE u.role_id ${op} ${value}
        AND u.id NOT IN (
          SELECT user_id FROM user_tag_assignments WHERE tag_id = ${tagId}
        )
      `;
      break;

    default:
      return [];
  }

  return rows.map((r) => r.user_id);
}

async function evaluateTagRules(): Promise<{ rulesEvaluated: number; usersTagged: number }> {
  const rules = await prisma.$queryRaw<RuleRow[]>`
    SELECT id, tag_id, condition_type, condition_operator, condition_value, is_enabled
    FROM tag_rules WHERE is_enabled = true
  `;

  let totalTagged = 0;

  for (const rule of rules) {
    try {
      if (!rule.condition_value || rule.condition_value.trim() === '') {
        loggerService.warn('Tag rule has empty condition_value, skipping', {
          ruleId: rule.id,
        });
        continue;
      }

      const value = Number(rule.condition_value);
      if (Number.isNaN(value)) {
        loggerService.warn('Tag rule has non-numeric condition_value, skipping', {
          ruleId: rule.id,
          conditionValue: rule.condition_value,
        });
        continue;
      }

      const sqlOp = toSqlOperator(rule.condition_operator);
      const userIds = await findMatchingUserIds(rule.condition_type, sqlOp, value, rule.tag_id);

      if (userIds.length > 0) {
        const chunkSize = 1000;
        for (let i = 0; i < userIds.length; i += chunkSize) {
          const chunk = userIds.slice(i, i + chunkSize);
          await prisma.$executeRawUnsafe(
            `INSERT INTO user_tag_assignments (user_id, tag_id, assigned_by, assigned_at)
             SELECT unnest($1::int[]), $2, 'auto', NOW()
             ON CONFLICT (user_id, tag_id) DO NOTHING`,
            chunk,
            rule.tag_id,
          );
        }
        totalTagged += userIds.length;

        loggerService.info('Tag rule matched users', {
          ruleId: rule.id,
          tagId: rule.tag_id,
          conditionType: rule.condition_type,
          matchedUsers: userIds.length,
        });
      }
    } catch (error) {
      loggerService.error('Failed to evaluate tag rule, skipping to next', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { rulesEvaluated: rules.length, usersTagged: totalTagged };
}

async function processTagRuleJob(job: Job<TagRuleJobData>): Promise<{
  rulesEvaluated: number;
  usersTagged: number;
}> {
  const { type, triggeredAt } = job.data;

  loggerService.info('Processing tag rule evaluation job', {
    jobId: job.id,
    type,
    triggeredAt,
  });

  try {
    if (type === 'evaluate-rules') {
      const result = await evaluateTagRules();

      loggerService.info('Tag rule evaluation completed', {
        jobId: job.id,
        rulesEvaluated: result.rulesEvaluated,
        usersTagged: result.usersTagged,
      });

      return result;
    }

    loggerService.warn('Unknown tag rule job type', { type });
    return { rulesEvaluated: 0, usersTagged: 0 };
  } catch (error) {
    loggerService.error('Tag rule evaluation job failed', {
      jobId: job.id,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function createTagRuleWorker(
  options?: TagRuleWorkerOptions
): Worker<TagRuleJobData> {
  const connection = getQueueConnection();
  const finalOptions = { ...defaultOptions, ...options };

  const worker = new Worker<TagRuleJobData>(
    TAG_RULE_QUEUE_NAME,
    processTagRuleJob,
    {
      connection,
      concurrency: finalOptions.concurrency,
    },
  );

  worker.on('completed', (job, result) => {
    loggerService.debug('Tag rule worker completed job', {
      jobId: job.id,
      rulesEvaluated: result?.rulesEvaluated ?? 0,
      usersTagged: result?.usersTagged ?? 0,
    });
  });

  worker.on('failed', (job, error) => {
    loggerService.error('Tag rule worker job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    loggerService.error('Tag rule worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    loggerService.warn('Tag rule worker job stalled', { jobId });
  });

  loggerService.info('Tag rule worker started', {
    concurrency: finalOptions.concurrency,
  });

  return worker;
}

export async function closeTagRuleWorker(worker: Worker): Promise<void> {
  await worker.close();
  loggerService.info('Tag rule worker closed');
}
