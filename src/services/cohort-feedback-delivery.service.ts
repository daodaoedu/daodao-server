import { createHash } from 'crypto';
import { prisma } from './database/prisma.service';
import { getEmailQueue } from '../queues/email.queue';
import { generateCohortFeedbackSurveyEmail } from './email/cohort-feedback-survey-template';
import { loggerService } from './logging/logger.service';
import { isCohortFeedbackEnabled } from './cohort-feedback.service';

const ENTITY = 'cohort_feedback';
const CODE = 'CF01';

/** Stable outbox identity, unrelated to anonymous answer or completion identifiers. */
function deliveryToken(cohortId: number, userId: number): string {
  const hex = createHash('sha256').update(`cohort-feedback-v1:${cohortId}:${userId}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Reflect actual successful sends, never merely queue admission, in the survey's state. */
export async function refreshCohortFeedbackDelivery(cohortId: number): Promise<void> {
  if (!isCohortFeedbackEnabled()) return;
  const logs = await prisma.email_logs.findMany({
    where: { entity_type: ENTITY, entity_id: cohortId, email_code: CODE },
    select: { status: true },
  });
  if (logs.length === 0) return;
  const sent = logs.every((log) => log.status === 'sent');
  await prisma.cohort_feedback_surveys.updateMany({
    // A stale pending snapshot must not overwrite a later successful worker.
    where: { cohort_id: cohortId, ...(!sent ? { delivery_state: { not: 'sent' } } : {}) },
    data: {
      delivery_state: sent ? 'sent' : logs.some((log) => log.status === 'failed') ? 'failed' : 'queued',
      delivered_at: sent ? new Date() : null,
    },
  });
}

/** Persist recipient outbox rows before Redis admission; safe to resume after partial admission. */
export async function enqueueCohortFeedbackSurvey(cohortId: number): Promise<void> {
  if (!isCohortFeedbackEnabled()) return;
  const mapping = await prisma.cohort_feedback_surveys.findUnique({
    where: { cohort_id: cohortId },
    include: { survey: { select: { external_id: true } } },
  });
  if (!mapping) return;
  const cohort = await prisma.cohorts.findUnique({
    where: { id: cohortId },
    select: {
      display_name: true,
      program: { select: { organization: { select: { name: true } } } },
      cohort_enrollments: {
        where: { status: 'joined', user_id: { not: null } },
        select: { user_id: true, email: true, user: { select: { contacts: { select: { email: true } } } } },
      },
    },
  });
  if (!cohort) return;
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) throw new Error('FRONTEND_URL is required for cohort feedback');
  const surveyUrl = new URL(`/survey/r/${mapping.survey.external_id}`, frontendUrl);
  if (!['http:', 'https:'].includes(surveyUrl.protocol)) throw new Error('Invalid FRONTEND_URL');
  const template = generateCohortFeedbackSurveyEmail({
    organizationName: cohort.program.organization.name,
    cohortName: cohort.display_name,
    surveyUrl: surveyUrl.toString(),
  });
  const recipients = new Map<number, string>();
  for (const enrollment of cohort.cohort_enrollments) {
    const address = enrollment.user?.contacts?.email ?? enrollment.email;
    if (enrollment.user_id !== null && address) recipients.set(enrollment.user_id, address);
  }
  // Create the full outbox before the first worker can mark the survey sent.
  const logs = await prisma.$transaction([...recipients].map(([userId]) => prisma.email_logs.upsert({
    where: { tracking_token: deliveryToken(cohortId, userId) },
    update: {},
    create: {
      user_id: userId, email_type: 'notification', entity_type: ENTITY, entity_id: cohortId,
      email_code: CODE, subject: template.subject, status: 'pending', sent_at: null,
      tracking_token: deliveryToken(cohortId, userId),
    },
    select: { id: true, user_id: true, status: true },
  })));
  const queue = getEmailQueue();
  if (!queue) throw new Error('Email queue is not initialized; feedback outbox remains pending');
  for (const log of logs) {
    if (log.status === 'sent') continue;
    const to = recipients.get(log.user_id);
    if (!to) continue;
    const jobId = `cohort-feedback-email-${log.id}`;
    const previous = await queue.getJob(jobId);
    const previousState = previous ? await previous.getState() : null;
    if (previousState === 'completed' && previous?.returnvalue?.cohortFeedbackDelivered === true) {
      await prisma.email_logs.update({ where: { id: log.id }, data: { status: 'sent', sent_at: new Date() } });
    } else if (previousState === 'failed' && previous) {
      await previous.retry();
    } else {
      await queue.add('send', {
        to, subject: template.subject, html: template.html,
        emailType: 'cohort_feedback_survey', userId: log.user_id, emailLogId: log.id,
        cohortFeedbackCohortId: cohortId,
        // Deliberately no tracking pixel or session identifier on the feedback link.
      }, { jobId });
    }
  }
  await refreshCohortFeedbackDelivery(cohortId);
}

/** Resume committed feedback outboxes without creating historical surveys. */
export async function recoverPendingCohortFeedbackEmails(): Promise<number> {
  if (!isCohortFeedbackEnabled()) return 0;
  const mappings = await prisma.cohort_feedback_surveys.findMany({
    where: { delivery_state: { not: 'sent' } }, select: { cohort_id: true },
  });
  let recovered = 0;
  for (const mapping of mappings) {
    try {
      await enqueueCohortFeedbackSurvey(mapping.cohort_id);
      recovered++;
    } catch (error) {
      loggerService.warn('Cohort feedback outbox remains pending', {
        cohortId: mapping.cohort_id, error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return recovered;
}
