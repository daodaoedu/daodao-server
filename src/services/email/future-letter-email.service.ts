import { prisma } from '../database/prisma.service';
import { getEmailQueue } from '../../queues/email.queue';
import { EMAIL_TYPES } from '../../types/email';
import { loggerService } from '../logging/logger.service';
import { generateFutureLetterEmail } from './future-letter-template';

export const FUTURE_LETTER_EMAIL_ENTITY = 'future_letter';
export const FUTURE_LETTER_EMAIL_CODE = 'FL01';

/** Dispatch committed outbox rows; BullMQ's deterministic id deduplicates concurrent retries. */
async function dispatchPendingFutureLetterEmails(letterId: number | undefined, recovering: boolean): Promise<number> {
  const logs = await prisma.email_logs.findMany({
    where: {
      email_type: EMAIL_TYPES.NOTIFICATION,
      entity_type: FUTURE_LETTER_EMAIL_ENTITY,
      email_code: FUTURE_LETTER_EMAIL_CODE,
      status: 'pending',
      ...(letterId === undefined ? {} : { entity_id: letterId }),
    },
    select: {
      id: true, user_id: true, entity_id: true, tracking_token: true,
      users: { select: { nickname: true, contacts: { select: { email: true } } } },
    },
  });
  let enqueued = 0;
  for (const log of logs) {
    try {
      if (log.entity_id === null || !log.users.contacts?.email) continue;
      // Never read/decrypt the sealed content, and never send another user's or deleted letter.
      const letter = await prisma.future_letters.findFirst({
        where: { id: log.entity_id, user_id: log.user_id, status: 'delivered' },
        select: { external_id: true },
      });
      if (!letter) continue;
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) throw new Error('FRONTEND_URL is required for future letter Email');
      const url = new URL('/me/footprints', frontendUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Invalid FRONTEND_URL for future letter Email');
      url.searchParams.set('futureLetterId', letter.external_id);
      const template = generateFutureLetterEmail({ recipientName: log.users.nickname || '學習者', letterUrl: url.toString() });
      const queue = getEmailQueue();
      if (!queue) throw new Error('Email queue is not initialized');
      await queue.add('send', {
        to: log.users.contacts.email,
        subject: template.subject,
        html: template.html,
        emailType: EMAIL_TYPES.NOTIFICATION,
        userId: log.user_id,
        emailLogId: log.id,
        trackingToken: log.tracking_token ?? undefined,
      }, { jobId: `future-letter-email-${log.id}` });
      enqueued++;
    } catch (error) {
      if (!recovering) throw error;
      loggerService.warn('Future letter Email remains pending after recovery', {
        emailLogId: log.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return enqueued;
}

/** Queue a letter's committed notification, throwing so the delivery worker can retry failures. */
export async function enqueuePendingFutureLetterEmails(letterId?: number): Promise<number> {
  return dispatchPendingFutureLetterEmails(letterId, false);
}

/** Recover delivery-to-Redis failures without emailing historical delivered letters. */
export async function recoverPendingFutureLetterEmails(): Promise<number> {
  try {
    return await dispatchPendingFutureLetterEmails(undefined, true);
  } catch (error) {
    loggerService.warn('Future letter Email outbox recovery failed; pending records retained', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
