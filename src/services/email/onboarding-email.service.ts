/**
 * Onboarding Email Service
 *
 * 實作 L0 歡迎信與 A–E 任務觸發信。
 * A–E 使用 onboarding-template.ts 的正式文案。
 */

import { getReferralGroup } from './welcome-template';
import {
  generateOnboardingAEmail,
  generateOnboardingBEmail,
  generateOnboardingCEmail,
  generateOnboardingDEmail,
  generateOnboardingEEmail,
} from './onboarding-template';
import { emailService } from './email.service';
import { loggerService } from '../logging/logger.service';
import { prisma } from '../database/prisma.service';
import { UserSource } from '../../types/onboarding.types';
import type { OnboardingEmailType } from '../../types/email/onboarding.types';

// ── L0 歡迎信 ────────────────────────────────────────────────────────────────

export async function sendOnboardingL0Email(userId: number, userSource: UserSource): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { contacts: true },
  });

  if (!user?.contacts?.email) {
    loggerService.warn('No email for onboarding L0', { userId });
    return;
  }

  const result = await emailService.sendWelcomeEmailWithLog(user.contacts.email, {
    name: user.nickname ?? 'User',
    referralGroup: getReferralGroup(user.referral_source),
    userId,
  });
  if (!result.success) throw new Error(`Failed to send onboarding L0 email: ${result.error}`);

  loggerService.info('Onboarding L0 email sent', { userId, userSource });
}

// ── A–E 任務觸發信 ───────────────────────────────────────────────────────────

async function sendOnboardingEmail(
  userId: number,
  emailType: Exclude<OnboardingEmailType, 'L0'>,
  generator: (data: { name: string }) => { subject: string; html: string }
): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { contacts: true },
  });

  if (!user?.contacts?.email) {
    loggerService.warn(`No email for onboarding ${emailType}`, { userId });
    return;
  }

  const name = user.nickname ?? 'User';
  const template = generator({ name });

  const result = await emailService.sendEmail({
    to: user.contacts.email,
    subject: template.subject,
    html: template.html,
  });
  if (!result.success) throw new Error(`Failed to send onboarding ${emailType} email: ${result.error}`);

  loggerService.info(`Onboarding ${emailType} email sent`, { userId });
}

export async function sendOnboardingTaskEmail(
  userId: number,
  emailType: OnboardingEmailType,
  userSource: UserSource
): Promise<void> {
  switch (emailType) {
    case 'L0':
      return sendOnboardingL0Email(userId, userSource);
    case 'A':
      return sendOnboardingEmail(userId, 'A', generateOnboardingAEmail);
    case 'B':
      return sendOnboardingEmail(userId, 'B', generateOnboardingBEmail);
    case 'C':
      return sendOnboardingEmail(userId, 'C', generateOnboardingCEmail);
    case 'D':
      return sendOnboardingEmail(userId, 'D', generateOnboardingDEmail);
    case 'E':
      return sendOnboardingEmail(userId, 'E', generateOnboardingEEmail);
    default:
      loggerService.warn('Unknown onboarding email type', { emailType });
  }
}
