/**
 * Onboarding Service
 *
 * 管理用戶 Onboarding 進度、Badge 發放與 Email 序列觸發。
 * 使用 $queryRaw / $executeRaw，待 prisma:introspect 完成後可遷移至 prisma.user_onboarding。
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { onboardingCompletionCache } from './onboarding-completion-cache.service';
import { deriveUserSource } from '../utils/onboarding-source';
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

async function findCheckInPracticeHref(userId: number): Promise<string> {
  const practice = await prisma.practices.findFirst({
    where: {
      user_id: userId,
      deleted_at: null,
      status: { in: ['active', 'not_started'] },
    },
    orderBy: [{ first_checkin_at: 'asc' }, { created_at: 'asc' }],
    select: { external_id: true },
  });

  return practice?.external_id ? `/practices/${practice.external_id}` : '/practices/create/manual';
}

async function isProfileTaskComplete(userId: number): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      nickname: true,
      custom_id: true,
      personal_slogan: true,
      education_stage: true,
      user_preferences: {
        where: { is_selected: true },
        take: 1,
      },
      user_positions: {
        take: 1,
      },
    },
  });

  if (!user) return false;

  return (
    user.user_preferences.length > 0 &&
    user.user_positions.length > 0 &&
    user.education_stage !== null &&
    !!(user.nickname && user.custom_id && user.personal_slogan)
  );
}

async function getEffectiveTaskStates(
  userId: number,
  states: TaskStates
): Promise<TaskStates> {
  if (states[OnboardingTask.B] !== 'done') return states;

  const profileComplete = await isProfileTaskComplete(userId);
  if (profileComplete) return states;

  const { [OnboardingTask.B]: _staleProfileTask, ...effectiveStates } = states;
  return effectiveStates;
}

/**
 * 建立 onboarding 記錄（新用戶註冊後呼叫）。
 * S2 用戶：task_states.A 預設為 'done'。
 */
async function createOnboarding(userId: number, userSource: UserSource, registrationFlow?: string): Promise<void> {
  const initialTaskStates: TaskStates =
    userSource === UserSource.S2 ? { [OnboardingTask.A]: 'done' } : {};

  await prisma.$executeRaw`
    INSERT INTO user_onboarding (user_id, user_source, task_states, task_completed_at, email_states, registration_flow, created_at, updated_at)
    VALUES (
      ${userId},
      ${userSource},
      ${JSON.stringify(initialTaskStates)}::jsonb,
      '{}'::jsonb,
      '{}'::jsonb,
      ${registrationFlow ?? null},
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
  let row = await findByUserId(userId);

  if (!row) {
    // Lazy-create for users who registered before the onboarding system
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { referral_source: true },
    });
    if (!user) return null;
    const userSource = deriveUserSource(user.referral_source ?? null, false);
    await createOnboarding(userId, userSource);
    row = await findByUserId(userId);
    if (!row) return null;
  }

  if (row.badge_granted) {
    onboardingCompletionCache.markCompleted(userId);
  }

  const source = row.user_source as UserSource;
  const order = TASK_ORDER_BY_SOURCE[source] ?? TASK_ORDER_BY_SOURCE[UserSource.S1];
  const states = await getEffectiveTaskStates(userId, row.task_states ?? {});
  const checkInHref = order.includes(OnboardingTask.D)
    ? await findCheckInPracticeHref(userId)
    : undefined;

  return {
    taskList: order.map((taskKey) => ({
      taskKey,
      done: states[taskKey] === 'done',
      ...(taskKey === OnboardingTask.D && checkInHref ? { ctaHref: checkInHref } : {}),
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

  if (row.badge_granted) {
    onboardingCompletionCache.markCompleted(userId);
    return { taskKey, allCompleted: true };
  }

  const states: TaskStates = row.task_states ?? {};

  // 冪等：已完成不重複更新
  if (states[taskKey] === 'done') {
    return { taskKey, allCompleted: row.badge_granted };
  }

  // 任務 C 記錄 creation_method
  const creationMethodClause =
    taskKey === OnboardingTask.C && extra?.creationMethod
      ? extra.creationMethod
      : row.creation_method;

  // 原子更新：JSONB || 合併避免讀取-寫回競態條件，RETURNING 取最新快照
  const taskPatch = JSON.stringify({ [taskKey]: 'done' });
  const taskCompletedAtPatch = JSON.stringify({ [taskKey]: new Date().toISOString() });
  const updated = await prisma.$queryRaw<UserOnboardingRow[]>`
    UPDATE user_onboarding
    SET
      task_states       = task_states || ${taskPatch}::jsonb,
      task_completed_at = task_completed_at || ${taskCompletedAtPatch}::jsonb,
      creation_method   = ${creationMethodClause},
      updated_at        = NOW()
    WHERE user_id = ${userId}
    RETURNING task_states, badge_granted, user_source, created_at
  `;

  const updatedRow = updated[0];
  if (!updatedRow) return null;

  loggerService.info('Onboarding task advanced', { userId, taskKey });

  // 基於更新後的資料判斷是否全部完成，避免並發下快照過時
  const source = updatedRow.user_source as UserSource;
  const order = TASK_ORDER_BY_SOURCE[source] ?? TASK_ORDER_BY_SOURCE[UserSource.S1];
  const updatedStates = await getEffectiveTaskStates(userId, updatedRow.task_states ?? {});
  const allCompleted = order.every((k) => updatedStates[k] === 'done');

  if (allCompleted && !updatedRow.badge_granted) {
    await grantBadge(userId, updatedRow.created_at);
    onboardingCompletionCache.markCompleted(userId);
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
  const daysToComplete = Math.max(0, Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  ));

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

  onboardingCompletionCache.markCompleted(userId);

  loggerService.info('Onboarding badge granted', { userId, daysToComplete });
}

export const onboardingService = {
  createOnboarding,
  getStatus,
  checkAndAdvance,
  grantBadge,
};
