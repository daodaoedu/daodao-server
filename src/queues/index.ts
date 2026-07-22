/**
 * BullMQ Queues 統一導出
 */

// 連線
export { COHORT_STAT_QUEUE_NAME, createCohortStatQueue, registerCohortStatJobs, type CohortStatJobData } from './cohort-stat.queue';
export { createCohortStatWorker, processCohortStatJob } from './cohort-stat.worker';
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

// Social Notification Queue
export {
  SOCIAL_NOTIFICATION_QUEUE_NAME,
  createSocialNotificationQueue,
  setSocialNotificationQueue,
  getSocialNotificationQueue,
  enqueueSocialNotification,
  bulkEnqueueSocialNotifications,
} from './social-notification.queue';

// Social Notification Worker
export {
  createSocialNotificationWorker,
  closeSocialNotificationWorker,
  type SocialNotificationWorkerOptions,
} from './social-notification.worker';

// Onboarding Email Queue
export {
  ONBOARDING_EMAIL_QUEUE_NAME,
  createOnboardingEmailQueue,
  setOnboardingEmailQueue,
  getOnboardingEmailQueue,
  enqueueOnboardingEmail,
  enqueueOnboardingL0Email,
  enqueueNextSequenceEmail,
} from './onboarding-email.queue';

// Onboarding Email Worker
export {
  createOnboardingEmailWorker,
  closeOnboardingEmailWorker,
} from './onboarding-email.worker';

// Email Trigger Queue（觸發式信件掃描）
export {
  EMAIL_TRIGGER_QUEUE_NAME,
  createEmailTriggerQueue,
  setEmailTriggerQueue,
  getEmailTriggerQueue,
  registerEmailTriggerScheduledJobs,
  type EmailTriggerJobData,
} from './email-trigger.queue';

// Email Trigger Worker
export {
  createEmailTriggerWorker,
  closeEmailTriggerWorker,
} from './email-trigger.worker';

// Scheduled Report Queue（排程報表產生器）
export {
  SCHEDULED_REPORT_QUEUE_NAME,
  createScheduledReportQueue,
  setScheduledReportQueue,
  getScheduledReportQueue,
  registerScheduledReportScheduledJobs,
  type ScheduledReportJobData,
} from './scheduled-report.queue';

// Scheduled Report Worker
export {
  createScheduledReportWorker,
  closeScheduledReportWorker,
} from './scheduled-report.worker';

// Anomaly Alert Queue（告警檢查器）
export {
  ANOMALY_ALERT_QUEUE_NAME,
  createAnomalyAlertQueue,
  setAnomalyAlertQueue,
  getAnomalyAlertQueue,
  registerAnomalyAlertScheduledJobs,
  type AnomalyAlertJobData,
} from './anomaly-alert.queue';

// Anomaly Alert Worker
export {
  createAnomalyAlertWorker,
  closeAnomalyAlertWorker,
} from './anomaly-alert.worker';

// Trust Level Queue（信任等級評估器）
export {
  TRUST_LEVEL_QUEUE_NAME,
  createTrustLevelQueue,
  setTrustLevelQueue,
  getTrustLevelQueue,
  registerTrustLevelScheduledJobs,
  type TrustLevelJobData,
} from './trust-level.queue';

// Trust Level Worker
export {
  createTrustLevelWorker,
  closeTrustLevelWorker,
} from './trust-level.worker';

// Badge Award Queue（徽章自動頒發器）
export {
  BADGE_AWARD_QUEUE_NAME,
  createBadgeAwardQueue,
  setBadgeAwardQueue,
  getBadgeAwardQueue,
  registerBadgeAwardScheduledJobs,
  type BadgeAwardJobData,
} from './badge-award.queue';

// Badge Award Worker
export {
  createBadgeAwardWorker,
  closeBadgeAwardWorker,
} from './badge-award.worker';

// Tag Rule Evaluation Queue（自動標籤規則評估器）
export {
  TAG_RULE_QUEUE_NAME,
  createTagRuleQueue,
  setTagRuleQueue,
  getTagRuleQueue,
  registerTagRuleScheduledJobs,
  type TagRuleJobData,
} from './tag-rule.queue';

// Tag Rule Evaluation Worker
export {
  createTagRuleWorker,
  closeTagRuleWorker,
  type TagRuleWorkerOptions,
} from './tag-rule.worker';

// Email Queue（通用郵件發送佇列）
export {
  EMAIL_QUEUE_NAME,
  createEmailQueue,
  setEmailQueue,
  getEmailQueue,
  enqueueEmail,
  bulkEnqueueEmails,
  registerEmailRetryScheduledJob,
  retryFailedEmails,
  retrySingleFailedEmail,
  type EmailJobData,
} from './email.queue';

// Email Worker
export {
  createEmailWorker,
  closeEmailWorker,
  type EmailWorkerOptions,
} from './email.worker';
