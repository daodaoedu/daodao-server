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
