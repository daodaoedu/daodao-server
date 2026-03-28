/**
 * BullMQ Queues 統一導出
 */

// 連線
export {
  createQueueConnection,
  getQueueConnection,
  getRawConnection,
  closeQueueConnection,
  isQueueConnectionReady,
  type QueueConnectionConfig
} from './connection';

// Practice Email Queue
export {
  PRACTICE_EMAIL_QUEUE_NAME,
  createPracticeEmailQueue,
  createQueueEvents,
  addPracticeEmailJob,
  addDelayedPracticeEmailJob,
  registerScheduledJobs,
  getQueueStats,
  cleanQueue,
  // Singleton queue 管理
  setPracticeEmailQueue,
  getPracticeEmailQueue,
  enqueuePracticeEmail
} from './practice-email.queue';

// Practice Email Worker
export {
  createPracticeEmailWorker,
  closePracticeEmailWorker,
  type PracticeEmailWorkerOptions
} from './practice-email.worker';

// Practice Status Queue（自動完成到期實踐）
export {
  PRACTICE_STATUS_QUEUE_NAME,
  createPracticeStatusQueue,
  createPracticeStatusQueueEvents,
  registerPracticeStatusScheduledJobs,
  triggerCompletionCheck,
  getPracticeStatusQueueStats,
  // Singleton queue 管理
  setPracticeStatusQueue,
  getPracticeStatusQueue,
  type PracticeStatusJobData
} from './practice-status.queue';

// Practice Status Worker
export {
  createPracticeStatusWorker,
  closePracticeStatusWorker,
  type PracticeStatusWorkerOptions
} from './practice-status.worker';

// Notification Queues
export {
  NOTIFICATION_INAPP_QUEUE_NAME,
  NOTIFICATION_EMAIL_QUEUE_NAME,
  NOTIFICATION_WEEKLY_QUEUE_NAME,
  createNotificationInAppQueue,
  createNotificationEmailQueue,
  createNotificationWeeklyQueue,
  setNotificationInAppQueue,
  setNotificationEmailQueue,
  setNotificationWeeklyQueue,
  getNotificationInAppQueue,
  getNotificationEmailQueue,
  getNotificationWeeklyQueue,
  registerNotificationScheduledJobs,
  type NotificationInAppJobData,
  type NotificationEmailJobData,
  type NotificationWeeklyJobData,
} from './notification.queue';

// Notification Workers
export {
  createNotificationInAppWorker,
  closeNotificationInAppWorker,
} from './notification-inapp.worker';

export {
  createNotificationEmailWorker,
  closeNotificationEmailWorker,
} from './notification-email.worker';

export {
  createNotificationWeeklyWorker,
  closeNotificationWeeklyWorker,
} from './notification-weekly.worker';

// Reaction Notification Queue
export {
  REACTION_NOTIFICATION_QUEUE_NAME,
  createReactionNotificationQueue,
  setReactionNotificationQueue,
  getReactionNotificationQueue,
  enqueueReactionNotification,
  type ReactionNotificationJob,
} from './reaction-notification.queue';

// Reaction Notification Worker
export {
  createReactionNotificationWorker,
  closeReactionNotificationWorker,
  type ReactionNotificationWorkerOptions,
} from './reaction-notification.worker';
