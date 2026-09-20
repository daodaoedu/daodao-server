/**
 * 各 slug 的後台模板接線設定（daodao#236）
 *
 * 一個 slug 一組：
 * - flatten：既有資料物件 → 扁平 {{key}} 變數表，key 名稱對齊 email_templates.variables
 * - fallback：查無模板／body 空／渲染失敗時使用的程式碼模板（行為與改動前相同）
 * - title：DB 模板渲染時的 <title>，沿用程式碼模板的值
 *
 * 目前接上後台的 16 筆：歡迎信 3 版、信箱驗證、密碼重設、馬拉松、許願採納、共鳴通知、
 * PE01–PE08。未接的 8 筆（notification-digest／notification-weekly 為陣列資料、
 * onboarding-a～e 的寄送路徑正由 daodao-server#490 移除、custom-24 無寄送路徑）
 * 維持程式碼模板，見 daodao#236 的 Known incomplete scope。
 */

import { getEmailConfig } from '../../config/email.config';
import { generateVerificationEmail } from './verification-template';
import { generatePasswordResetEmail } from './password-reset-template';
import { generateMarathonEmail } from './marathon-template';
import { generateWelcomeEmail } from './welcome-template';
import {
  generateReactionNotificationEmail,
  type ReactionNotificationData,
} from './reaction-notification-template';
import { generateWishLinkedEmail, type WishLinkedEmailData } from './wish-linked-template';
import {
  generatePracticeCreatedEmailContent,
  generateFirstCheckInEmailContent,
  generateWeeklySummaryEmailContent,
  generateFinalSummaryEmailContent,
} from './practice-email.service';
import type { TemplateDescriptor } from './template-resolver.service';
import { safeUrlVariable, type TemplateVariables } from './template-render';
import type {
  MarathonEmailData,
  PasswordResetEmailData,
  VerificationEmailData,
  WelcomeEmailData,
} from '../../types/email';
import type {
  FinalSummaryEmailVariables,
  FirstCheckInEmailVariables,
  PracticeCreatedEmailVariables,
  WeeklySummaryEmailVariables,
} from '../../types/email/practice.types';

/** email_templates.slug 常數（與 daodao-storage migration 090 補齊的 slug 一致） */
export const EMAIL_TEMPLATE_SLUGS = {
  WELCOME_LETTER: 'welcome-letter',
  WELCOME_LETTER_SOCIAL: 'welcome-letter-social',
  WELCOME_LETTER_COMMUNITY: 'welcome-letter-community',
  AUTH_EMAIL_VERIFY: 'auth-email-verify',
  AUTH_PASSWORD_RESET: 'auth-password-reset',
  MARATHON_REGISTRATION: 'marathon-registration',
  WISH_LINKED: 'wish-linked',
  REACTION_NOTIFICATION: 'reaction-notification',
  PRACTICE_CREATED: 'practice-created',
  PRACTICE_FIRST_CHECKIN: 'practice-first-checkin',
  PRACTICE_WEEKLY_PE03: 'practice-weekly-pe03',
  PRACTICE_WEEKLY_PE04: 'practice-weekly-pe04',
  PRACTICE_WEEKLY_PE05: 'practice-weekly-pe05',
  PRACTICE_WEEKLY_PE06: 'practice-weekly-pe06',
  PRACTICE_FINAL_PE07: 'practice-final-pe07',
  PRACTICE_FINAL_PE08: 'practice-final-pe08',
} as const;

export type EmailTemplateSlug =
  (typeof EMAIL_TEMPLATE_SLUGS)[keyof typeof EMAIL_TEMPLATE_SLUGS];

/** 未定義的值一律給空字串，避免模板出現 undefined */
const str = (value: string | number | undefined | null): string =>
  value === undefined || value === null ? '' : String(value);

/** 連結類變數：sanitizeUrl + 屬性跳脫，避免 query string 的 = 被跳脫成 &#x3D; */
const url = safeUrlVariable;

const defaultUnsubscribeUrl = (): string => `${getEmailConfig().urls.frontend}/unsubscribe`;

// ── 歡迎信（3 個來源版本共用同一組變數與 fallback） ──────────────────────────

const welcomeDescriptor = (slug: EmailTemplateSlug): TemplateDescriptor<WelcomeEmailData> => ({
  slug,
  title: '歡迎來到島島阿學',
  flatten: (data): TemplateVariables => ({
    name: str(data.name),
    practiceUrl: url(data.practiceUrl || getEmailConfig().urls.frontend),
    unsubscribeUrl: url(data.unsubscribeUrl || defaultUnsubscribeUrl()),
  }),
  unsubscribeUrl: data => data.unsubscribeUrl || defaultUnsubscribeUrl(),
  fallback: data => generateWelcomeEmail(data),
});

/** 依 referralGroup 決定歡迎信要讀哪一筆後台模板 */
export const welcomeLetterDescriptor = (
  data: WelcomeEmailData
): TemplateDescriptor<WelcomeEmailData> => {
  switch (data.referralGroup) {
    case 'social-media':
      return welcomeDescriptor(EMAIL_TEMPLATE_SLUGS.WELCOME_LETTER_SOCIAL);
    case 'community':
      return welcomeDescriptor(EMAIL_TEMPLATE_SLUGS.WELCOME_LETTER_COMMUNITY);
    default:
      return welcomeDescriptor(EMAIL_TEMPLATE_SLUGS.WELCOME_LETTER);
  }
};

// ── 認證 ────────────────────────────────────────────────────────────────────

export const verificationDescriptor: TemplateDescriptor<VerificationEmailData> = {
  slug: EMAIL_TEMPLATE_SLUGS.AUTH_EMAIL_VERIFY,
  title: '驗證您的電子郵件',
  flatten: data => ({
    name: str(data.name),
    verifyLink: url(data.verifyLink),
  }),
  fallback: data => generateVerificationEmail(data),
};

export const passwordResetDescriptor: TemplateDescriptor<PasswordResetEmailData> = {
  slug: EMAIL_TEMPLATE_SLUGS.AUTH_PASSWORD_RESET,
  title: '密碼重設',
  flatten: data => ({
    name: str(data.name),
    resetLink: url(data.resetLink),
  }),
  fallback: data => generatePasswordResetEmail(data),
};

// ── 活動／通知 ──────────────────────────────────────────────────────────────

export const marathonDescriptor: TemplateDescriptor<MarathonEmailData> = {
  slug: EMAIL_TEMPLATE_SLUGS.MARATHON_REGISTRATION,
  title: '報名確認！',
  flatten: data => ({
    name: str(data.name),
    marathonTitle: str(data.marathonTitle),
    marathonDate: str(data.marathonDate),
    marathonDescription: str(data.marathonDescription),
  }),
  fallback: data => generateMarathonEmail(data),
};

export const wishLinkedDescriptor: TemplateDescriptor<WishLinkedEmailData> = {
  slug: EMAIL_TEMPLATE_SLUGS.WISH_LINKED,
  title: '許願已被採納',
  flatten: data => ({
    recipientName: str(data.recipientName),
    itemTitle: str(data.itemTitle),
    url: url(data.url),
    unsubscribeUrl: url(data.unsubscribeUrl || defaultUnsubscribeUrl()),
  }),
  unsubscribeUrl: data => data.unsubscribeUrl || defaultUnsubscribeUrl(),
  fallback: data => generateWishLinkedEmail(data),
};

export const reactionNotificationDescriptor: TemplateDescriptor<ReactionNotificationData> = {
  slug: EMAIL_TEMPLATE_SLUGS.REACTION_NOTIFICATION,
  title: '你的實踐獲得鼓勵',
  flatten: data => ({
    recipientName: str(data.recipientName),
    practiceTitle: str(data.practiceTitle),
    reactionCount: str(data.reactionCount),
    practiceUrl: url(data.practiceUrl),
    unsubscribeUrl: url(data.unsubscribeUrl || defaultUnsubscribeUrl()),
  }),
  unsubscribeUrl: data => data.unsubscribeUrl || defaultUnsubscribeUrl(),
  fallback: data => generateReactionNotificationEmail(data),
};

// ── 主題實踐 PE01–PE08 ──────────────────────────────────────────────────────

/** PE 系列共用的基礎變數 */
const practiceBaseVariables = (
  data: PracticeCreatedEmailVariables | FirstCheckInEmailVariables
    | WeeklySummaryEmailVariables | FinalSummaryEmailVariables
): TemplateVariables => ({
  userName: str(data.userName),
  practiceTitle: str(data.practiceTitle),
  practiceId: str(data.practiceId),
  practiceUrl: url(data.practiceUrl),
  unsubscribeUrl: url(data.unsubscribeUrl || defaultUnsubscribeUrl()),
});

export const practiceCreatedDescriptor: TemplateDescriptor<PracticeCreatedEmailVariables> = {
  slug: EMAIL_TEMPLATE_SLUGS.PRACTICE_CREATED,
  title: '島島阿學 - 主題實踐',
  flatten: data => ({
    ...practiceBaseVariables(data),
    startDate: str(data.startDate),
    endDate: str(data.endDate),
    durationDays: str(data.durationDays),
    frequencyMinDays: str(data.frequencyMinDays),
    frequencyMaxDays: str(data.frequencyMaxDays),
    targetCheckIns: str(data.targetCheckIns),
    action: str(data.action || '學習'),
  }),
  unsubscribeUrl: data => data.unsubscribeUrl,
  fallback: data => generatePracticeCreatedEmailContent(data),
};

export const practiceFirstCheckInDescriptor: TemplateDescriptor<FirstCheckInEmailVariables> = {
  slug: EMAIL_TEMPLATE_SLUGS.PRACTICE_FIRST_CHECKIN,
  title: '島島阿學 - 主題實踐',
  flatten: data => practiceBaseVariables(data),
  unsubscribeUrl: data => data.unsubscribeUrl,
  fallback: data => generateFirstCheckInEmailContent(data),
};

const WEEKLY_SLUG_BY_CODE: Record<WeeklySummaryEmailVariables['code'], EmailTemplateSlug> = {
  PE03: EMAIL_TEMPLATE_SLUGS.PRACTICE_WEEKLY_PE03,
  PE04: EMAIL_TEMPLATE_SLUGS.PRACTICE_WEEKLY_PE04,
  PE05: EMAIL_TEMPLATE_SLUGS.PRACTICE_WEEKLY_PE05,
  PE06: EMAIL_TEMPLATE_SLUGS.PRACTICE_WEEKLY_PE06,
};

/** PE03–PE06 共用同一組變數，只有 slug 與 fallback 傳入的 code 不同 */
export const weeklySummaryDescriptor = (
  code: WeeklySummaryEmailVariables['code']
): TemplateDescriptor<WeeklySummaryEmailVariables> => ({
  slug: WEEKLY_SLUG_BY_CODE[code],
  title: '島島阿學 - 每週回顧',
  flatten: data => ({
    ...practiceBaseVariables(data),
    weeklyCount: str(data.weeklyCount),
    totalCount: str(data.totalCount),
    weeklyNoteSnippet: str(data.weeklyNoteSnippet),
  }),
  unsubscribeUrl: data => data.unsubscribeUrl,
  fallback: data => generateWeeklySummaryEmailContent(code, data),
});

const FINAL_SLUG_BY_CODE: Record<FinalSummaryEmailVariables['code'], EmailTemplateSlug> = {
  PE07: EMAIL_TEMPLATE_SLUGS.PRACTICE_FINAL_PE07,
  PE08: EMAIL_TEMPLATE_SLUGS.PRACTICE_FINAL_PE08,
};

/** PE07–PE08 */
export const finalSummaryDescriptor = (
  code: FinalSummaryEmailVariables['code']
): TemplateDescriptor<FinalSummaryEmailVariables> => ({
  slug: FINAL_SLUG_BY_CODE[code],
  title: '島島阿學 - 實踐總結',
  flatten: data => ({
    ...practiceBaseVariables(data),
    durationDays: str(data.durationDays),
    totalCheckIns: str(data.totalCheckIns),
    targetCheckIns: str(data.targetCheckIns),
    bestNoteSnippet: str(data.bestNoteSnippet),
    bestNoteDate: str(data.bestNoteDate),
  }),
  unsubscribeUrl: data => data.unsubscribeUrl,
  fallback: data => generateFinalSummaryEmailContent(code, data),
});
