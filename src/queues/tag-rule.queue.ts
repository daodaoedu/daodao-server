/**
 * Tag Rule Evaluation Queue
 *
 * BullMQ 隊列定義，定期評估自動標籤規則並為符合條件的用戶打標籤
 * 每小時執行一次
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

export const TAG_RULE_QUEUE_NAME = 'tag-rule-evaluation';

export interface TagRuleJobData {
  type: 'evaluate-rules';
  triggeredAt: string;
}

let tagRuleQueueInstance: Queue<TagRuleJobData> | null = null;

export function setTagRuleQueue(queue: Queue<TagRuleJobData>): void {
  tagRuleQueueInstance = queue;
}

export function getTagRuleQueue(): Queue<TagRuleJobData> | null {
  return tagRuleQueueInstance;
}

export function createTagRuleQueue(): Queue<TagRuleJobData> {
  const connection = getQueueConnection();

  const queue = new Queue<TagRuleJobData>(TAG_RULE_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 100,
        age: 24 * 60 * 60,
      },
      removeOnFail: {
        count: 100,
        age: 7 * 24 * 60 * 60,
      },
    },
  });

  loggerService.info('Tag rule queue created', { queueName: TAG_RULE_QUEUE_NAME });

  return queue;
}

export async function registerTagRuleScheduledJobs(
  queue: Queue<TagRuleJobData>
): Promise<void> {
  if (process.env.DISABLE_SCHEDULED_JOBS === 'true') {
    loggerService.info('Tag rule scheduled jobs registration skipped (DISABLE_SCHEDULED_JOBS=true)');
    return;
  }

  await queue.add(
    'evaluate-rules',
    {
      type: 'evaluate-rules',
      triggeredAt: new Date().toISOString(),
    },
    {
      repeat: {
        pattern: '30 * * * *',
        tz: 'Asia/Taipei',
      },
      jobId: 'tag-rule-evaluator',
    },
  );

  loggerService.info('Tag rule scheduled jobs registered', {
    pattern: '30 * * * *',
    timezone: 'Asia/Taipei',
  });
}
