/**
 * 歡迎信發送 — 註冊驗證完成後直接寄出，不再經過新手任務 email 序列
 */

import { emailService } from './email.service';
import { getReferralGroup } from './welcome-template';
import { loggerService } from '../logging/logger.service';
import { prisma } from '../database/prisma.service';

/**
 * 依 userId 查 email 後寄歡迎信（含 email_logs 去重，已寄過會被 sendWelcomeEmailWithLog 擋下）
 */
export async function sendWelcomeEmailToUser(userId: number): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { contacts: true },
  });

  if (!user?.contacts?.email) {
    loggerService.warn('No email for welcome letter', { userId });
    return;
  }

  const result = await emailService.sendWelcomeEmailWithLog(user.contacts.email, {
    name: user.nickname ?? 'User',
    referralGroup: getReferralGroup(user.referral_source),
    userId,
  });
  if (!result.success) throw new Error(`Failed to send welcome email: ${result.error}`);

  loggerService.info('Welcome email sent', { userId });
}

/**
 * 非阻塞版本：失敗只記 log，不影響呼叫端流程
 */
export function sendWelcomeEmailInBackground(userId: number, context: string): void {
  sendWelcomeEmailToUser(userId).catch((error: unknown) => {
    loggerService.error(`Failed to send welcome email (${context})`, {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
  });
}
