/**
 * Onboarding Email Service
 *
 * 實作 L0 歡迎信與 A–E 任務觸發信。
 * L0 重用 generateWelcomeEmail 結構，依 userSource 切換 CTA。
 * A–E 使用 placeholder copy，待文案確認後替換。
 */

import { getEmailConfig } from '../../config/email.config';
import { generateWelcomeEmail } from './welcome-template';
import { emailService } from './email.service';
import { loggerService } from '../logging/logger.service';
import { prisma } from '../database/prisma.service';
import { UserSource } from '../../types/onboarding.types';
import type { OnboardingEmailType } from '../../types/email/onboarding.types';

// ── L0 歡迎信 ────────────────────────────────────────────────────────────────

/**
 * 依 userSource 決定 L0 歡迎信的 CTA 連結與文案。
 * S1 → 帳號設定；S2 / S3 → 建立實踐
 */
function resolveL0Cta(userSource: UserSource): { url: string; label: string } {
  const config = getEmailConfig();
  if (userSource === UserSource.S1) {
    return { url: `${config.urls.frontend}/settings/profile`, label: '完成帳號設定' };
  }
  return { url: `${config.urls.frontend}/practices/new`, label: '建立第一個實踐' };
}

export async function sendOnboardingL0Email(userId: number, userSource: UserSource): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { contacts: true },
  });

  if (!user?.contacts?.email) {
    loggerService.warn('No email for onboarding L0', { userId });
    return;
  }

  const config = getEmailConfig();
  const cta = resolveL0Cta(userSource);

  const template = generateWelcomeEmail({
    name: user.nickname ?? 'User',
    referralGroup: 'default',
    practiceUrl: cta.url,
  });

  const result = await emailService.sendEmail({
    to: user.contacts.email,
    subject: template.subject,
    html: template.html,
  });
  if (!result.success) throw new Error(`Failed to send onboarding L0 email: ${result.error}`);

  loggerService.info('Onboarding L0 email sent', { userId, userSource });
}

// ── A–E 任務觸發信（placeholder）────────────────────────────────────────────

async function sendPlaceholderOnboardingEmail(
  userId: number,
  emailType: Exclude<OnboardingEmailType, 'L0'>,
  subject: string,
  body: string
): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { contacts: true },
  });

  if (!user?.contacts?.email) {
    loggerService.warn(`No email for onboarding ${emailType}`, { userId });
    return;
  }

  const config = getEmailConfig();
  const html = `<p>Hi ${user.nickname ?? 'User'},</p><p>${body}</p><p><a href="${config.urls.frontend}">前往島島阿學</a></p>`;

  const result = await emailService.sendEmail({
    to: user.contacts.email,
    subject,
    html,
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
      return sendPlaceholderOnboardingEmail(userId, 'A', '【島島阿學】你的測驗結果來了！', '感謝你完成了學習風格測驗，快來看看你的結果吧！');
    case 'B':
      return sendPlaceholderOnboardingEmail(userId, 'B', '【島島阿學】帳號設定完成，下一步？', '你的帳號設定已完成，接下來試試建立第一個實踐吧！');
    case 'C':
      return sendPlaceholderOnboardingEmail(userId, 'C', '【島島阿學】你的實踐已建立！', '太棒了！你已建立第一個實踐，記得每天打卡讓自己更進步！');
    case 'D':
      return sendPlaceholderOnboardingEmail(userId, 'D', '【島島阿學】第一次打卡成功！', '恭喜你完成第一次打卡！繼續保持，習慣就是這樣養成的！');
    case 'E':
      return sendPlaceholderOnboardingEmail(userId, 'E', '【島島阿學】你留下了第一則留言！', '謝謝你在島島阿學留下你的想法，社群因你而更豐富！');
    default:
      loggerService.warn('Unknown onboarding email type', { emailType });
  }
}
