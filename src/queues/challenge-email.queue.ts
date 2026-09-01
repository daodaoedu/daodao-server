/**
 * Challenge Email Queue
 *
 * 共同挑戰信件排程（openspec: challenge-emails）：
 * - 每小時掃描補寄排程節點（t48h / day1 / end / first_checkin）
 * - welcome 節點由加入流程 enqueue 即時寄送
 */

import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { loggerService } from '../services/logging/logger.service';

export const CHALLENGE_EMAIL_QUEUE_NAME = 'challenge-email';

export type ChallengeEmailJobData =
  | { type: 'scan'; triggeredAt: string }
  | { type: 'welcome'; cohortId: number; userId: number };

let challengeEmailQueueInstance: Queue<ChallengeEmailJobData> | null = null;

/** 設定 Queue 實例（由 server.ts 呼叫） */
export function setChallengeEmailQueue(queue: Queue<ChallengeEmailJobData> | null): void {
  challengeEmailQueueInstance = queue;
}

/** 取得 Queue 實例 */
export function getChallengeEmailQueue(): Queue<ChallengeEmailJobData> | null {
  return challengeEmailQueueInstance;
}

/** 建立 Challenge Email Queue */
export function createChallengeEmailQueue(): Queue<ChallengeEmailJobData> {
  const queue = new Queue<ChallengeEmailJobData>(CHALLENGE_EMAIL_QUEUE_NAME, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 24 * 60 * 60 },
      removeOnFail: { count: 100, age: 7 * 24 * 60 * 60 }
    }
  });
  loggerService.info('Challenge email queue created', { queueName: CHALLENGE_EMAIL_QUEUE_NAME });
  return queue;
}

/**
 * 註冊每小時掃描排程。
 * 固定 jobId 讓多容器環境下 BullMQ 自動去重；可用 DISABLE_SCHEDULED_JOBS=true 禁用。
 */
export async function registerChallengeEmailScheduledJobs(queue: Queue<ChallengeEmailJobData>): Promise<void> {
  if (process.env.DISABLE_SCHEDULED_JOBS === 'true') {
    loggerService.info('Challenge email scheduled jobs registration skipped (DISABLE_SCHEDULED_JOBS=true)');
    return;
  }
  await queue.add(
    'scan',
    { type: 'scan', triggeredAt: new Date().toISOString() },
    {
      repeat: { pattern: '5 * * * *', tz: 'Asia/Taipei' }, // 每小時 5 分，錯開整點尖峰
      jobId: 'challenge-email-scanner'
    }
  );
  loggerService.info('Challenge email scheduled jobs registered', { pattern: '5 * * * *', timezone: 'Asia/Taipei' });
}

/**
 * 加入挑戰後 enqueue welcome 信；queue 未初始化時記 log 不擲錯
 * （welcome 會由使用者旅程即時性受損但不影響加入流程；掃描不補 welcome，故 queue 必須健康）。
 */
export async function enqueueChallengeWelcomeEmail(cohortId: number, userId: number): Promise<void> {
  const queue = getChallengeEmailQueue();
  if (!queue) {
    loggerService.error('Challenge email queue not initialized, welcome email skipped', { cohortId, userId });
    return;
  }
  await queue.add('welcome', { type: 'welcome', cohortId, userId }, { jobId: `challenge-welcome-${cohortId}-${userId}` });
}
