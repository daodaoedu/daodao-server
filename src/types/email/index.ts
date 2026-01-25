/**
 * 郵件型別統一導出
 * 從此處導入所有郵件相關型別
 */

// 基礎型別
export {
  EmailTemplateContent,
  EMAIL_TYPES,
  EmailTypeValue,
  EMAIL_STATUS,
  EmailStatusValue,
  EmailLogData,
} from './base.types';

// 模板資料型別
export {
  WelcomeEmailData,
  VerificationEmailData,
  ContactEmailData,
  MarathonEmailData,
  PasswordResetEmailData,
  CustomEmailData,
  EmailTemplateDataMap,
} from './template-data.types';

// 郵件選項型別
export {
  EmailTemplate,
  EmailOptions,
  WelcomeEmailOptions,
  VerificationEmailOptions,
  PasswordResetEmailOptions,
  ContactEmailOptions,
  MarathonEmailOptions,
} from './options.types';

// 服務介面型別
export {
  EmailResult,
  EmailConfig,
  EmailServiceInterface,
} from './service.types';

// 進階型別
export {
  EmailQueueItem,
  EmailStats,
  EmailValidationResult,
  BulkEmailOptions,
  SUBSCRIPTION_STATUS,
  SubscriptionStatusValue,
  EmailSubscriber,
  EmailCampaign,
  EmailAttachment,
  AdvancedEmailOptions,
} from './advanced.types';

// 向後相容：EmailTemplateData 重命名為 EmailTemplateDataMap
export type { EmailTemplateDataMap as EmailTemplateData } from './template-data.types';

// 向後相容：EmailService 介面重命名
export type { EmailServiceInterface as EmailService } from './service.types';
