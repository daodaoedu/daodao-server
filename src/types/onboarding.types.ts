/**
 * Onboarding Task Guide Types
 *
 * 定義 Onboarding 任務、用戶來源與任務路由表。
 */

export const OnboardingTask = {
  A: 'A', // 測驗
  B: 'B', // 帳號設定
  C: 'C', // 建立實踐
  D: 'D', // 打卡
  E: 'E', // 留言
} as const;

export type OnboardingTask = (typeof OnboardingTask)[keyof typeof OnboardingTask];

export const UserSource = {
  S1: 'S1', // 直接註冊
  S2: 'S2', // 測驗導向
  S3: 'S3', // 工具導向
} as const;

export type UserSource = (typeof UserSource)[keyof typeof UserSource];

export type TaskState = 'pending' | 'done';

export type TaskStates = Partial<Record<OnboardingTask, TaskState>>;

export type EmailState = 'sent';

export type EmailStates = Partial<Record<OnboardingEmailType, EmailState>>;

export type OnboardingEmailType = 'L0' | 'A' | 'B' | 'C' | 'D' | 'E';

export type CreationMethod = 'self_created' | 'copied' | 'action_generator';

/** 各 user_source 的任務顯示順序 */
export const TASK_ORDER_BY_SOURCE: Record<UserSource, OnboardingTask[]> = {
  S1: [OnboardingTask.B, OnboardingTask.A, OnboardingTask.C, OnboardingTask.E, OnboardingTask.D],
  S2: [OnboardingTask.B, OnboardingTask.C, OnboardingTask.E, OnboardingTask.D],
  S3: [OnboardingTask.C, OnboardingTask.B, OnboardingTask.D, OnboardingTask.A, OnboardingTask.E],
};

/** 任務完成後觸發的 email（依 user_source 決定是否適用） */
export const TASK_EMAIL_MAP: Partial<Record<OnboardingTask, OnboardingEmailType>> = {
  [OnboardingTask.A]: 'A',
  [OnboardingTask.B]: 'B',
  [OnboardingTask.C]: 'C',
  [OnboardingTask.D]: 'D',
  [OnboardingTask.E]: 'E',
};

export interface OnboardingStatusResponse {
  taskList: Array<{
    taskKey: OnboardingTask;
    done: boolean;
    ctaHref?: string;
  }>;
  completedTasks: number;
  badgeGranted: boolean;
}

export interface OnboardingUpdate {
  taskKey: OnboardingTask;
  allCompleted: boolean;
}
