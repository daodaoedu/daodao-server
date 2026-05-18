/**
 * Onboarding Service
 *
 * 管理用戶 Onboarding 進度、Badge 發放與 Email 序列觸發。
 * 使用 $queryRaw / $executeRaw，待 prisma:introspect 完成後可遷移至 prisma.user_onboarding。
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import {
  OnboardingTask,
  UserSource,
  TaskStates,
  EmailStates,
  CreationMethod,
  TASK_ORDER_BY_SOURCE,
  OnboardingStatusResponse,
  OnboardingUpdate,
} from '../types/onboarding.types';

interface UserOnboardingRow {
  id: number;
  user_id: number;
  user_source: string;
  task_states: TaskStates;
  email_states: EmailStates;
  creation_method: string | null;
  badge_granted: boolean;
  badge_granted_at: Date | null;
  completed_at: Date | null;
  days_to_complete: number | null;
  created_at: Date;
  updated_at: Date;
}

async function findByUserId(userId: number): Promise<UserOnboardingRow | null> {
  const rows = await prisma.$queryRaw<UserOnboardingRow[]>`
    SELECT * FROM user_onboarding WHERE user_id = ${userId} LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * 建立 onboarding 記錄（新用戶註冊後呼叫）。
 * S2 用戶：task_states.A 預設為 'done'。
 */
async function createOnboarding(userId: number, userSource: UserSource): Promise<void> {
  const initialTaskStates: TaskStates =
    userSource === UserSource.S2 ? { [OnboardingTask.A]: 'done' } : {};

  await prisma.$executeRaw`
    INSERT INTO user_onboarding (user_id, user_source, task_states, email_states, created_at, updated_at)
    VALUES (
      ${userId},
      ${userSource},
      ${JSON.stringify(initialTaskStates)}::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING
  `;

  loggerService.info('Onboarding record created', { userId, userSource });

  // 觸發 L0 歡迎信
  try {
    const { enqueueOnboardingL0Email } = await import('../queues/onboarding-email.queue');
    await enqueueOnboardingL0Email(userId, userSource);
  } catch (err) {
    loggerService.warn('Failed to enqueue onboarding L0 email', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * 查詢 onboarding 狀態，供 GET /api/v1/onboarding/status 使用。
 */
async function getStatus(userId: number): Promise<OnboardingStatusResponse | null> {
  const row = await findByUserId(userId);
  if (!row) return null;

  const source = row.user_source as UserSource;
  const order = TASK_ORDER_BY_SOURCE[source] ?? TASK_ORDER_BY_SOURCE[UserSource.S1];
  const states = row.task_states ?? {};

  return {
    taskList: order.map((taskKey) => ({
      taskKey,
      done: states[taskKey] === 'done',
    })),
    completedTasks: order.filter((k) => states[k] === 'done').length,
    badgeGranted: row.badge_granted,
  };
}

/**
 * 標記任務完成並推進 Email 序列。
 * 冪等：已完成的任務不會重複更新。
 * 全部任務完成時自動呼叫 grantBadge。
 *
 * @returns OnboardingUpdate（供 meta.onboardingUpdate）
 */
async function checkAndAdvance(
  userId: number,
  taskKey: OnboardingTask,
  extra?: { creationMethod?: CreationMethod }
): Promise<OnboardingUpdate | null> {
  const row = await findByUserId(userId);
  if (!row) return null;

  const states: TaskStates = row.task_states ?? {};

  // 冪等：已完成不重複更新
  if (states[taskKey] === 'done') {
    return { taskKey, allCompleted: row.badge_granted };
  }

  const newStates: TaskStates = { ...states, [taskKey]: 'done' };

  // 任務 C 記錄 creation_method
  const creationMethodClause =
    taskKey === OnboardingTask.C && extra?.creationMethod
      ? extra.creationMethod
      : row.creation_method;

  await prisma.$executeRaw`
    UPDATE user_onboarding
    SET
      task_states      = ${JSON.stringify(newStates)}::jsonb,
      creation_method  = ${creationMethodClause},
      updated_at       = NOW()
    WHERE user_id = ${userId}
  `;

  loggerService.info('Onboarding task advanced', { userId, taskKey });

  // 檢查是否全部完成
  const source = row.user_source as UserSource;
  const order = TASK_ORDER_BY_SOURCE[source] ?? TASK_ORDER_BY_SOURCE[UserSource.S1];
  const allCompleted = order.every((k) => newStates[k] === 'done');

  if (allCompleted && !row.badge_granted) {
    await grantBadge(userId, row.created_at);
  }

  // 觸發 email（lazy import 避免循環依賴）
  try {
    const { enqueueOnboardingEmail } = await import('../queues/onboarding-email.queue');
    await enqueueOnboardingEmail(taskKey, userId, source);
  } catch (err) {
    loggerService.warn('Failed to enqueue onboarding email', {
      userId,
      taskKey,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { taskKey, allCompleted };
}

/**
 * 發放 Badge。
 */
async function grantBadge(userId: number, createdAt: Date): Promise<void> {
  const now = new Date();
  const daysToComplete = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  await prisma.$executeRaw`
    UPDATE user_onboarding
    SET
      badge_granted    = TRUE,
      badge_granted_at = NOW(),
      completed_at     = NOW(),
      days_to_complete = ${daysToComplete},
      updated_at       = NOW()
    WHERE user_id = ${userId}
  `;

  loggerService.info('Onboarding badge granted', { userId, daysToComplete });
}

export const onboardingService = {
  createOnboarding,
  getStatus,
  checkAndAdvance,
  grantBadge,
};
