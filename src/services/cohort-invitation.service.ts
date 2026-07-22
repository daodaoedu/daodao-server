import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { ForbiddenError } from '../middleware/error.middleware';
import { bulkEnqueueEmails, enqueueEmail } from '../queues/email.queue';
import type { InviteMembersInput } from '../validators/cohort-invitation.validators';
import { prisma } from './database/prisma.service';
import { generateCohortInvitationEmail } from './email/cohort-invitation-template';
import { notificationEventService } from './notification-event.service';

const emailSchema = z.string().trim().toLowerCase().email();
const collect = (input: InviteMembersInput): string[] => {
  const csvEmails = input.csv?.split(/\r?\n/).map(line => line.split(',')[0]?.trim()).filter(Boolean) ?? [];
  if (csvEmails[0]?.toLowerCase() === 'email') csvEmails.shift();
  return [...new Set([...(input.emails ?? []), ...csvEmails].map(value => value.trim().toLowerCase()).filter(Boolean))];
};
const invite = async (programId: number, cohortId: number, actorId: number, input: InviteMembersInput) => {
  const cohort = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, program: { organization: { status: 'active', organization_members: { some: { user_id: actorId } } } } },
    select: { id: true, display_name: true, invite_message: true, program: { select: { organization: { select: { name: true } } } } }
  });
  if (!cohort) throw new ForbiddenError('無權限管理此期邀請');
  const emails = collect(input);
  const validated = emails.map(email => ({ email, valid: emailSchema.safeParse(email).success, reason: emailSchema.safeParse(email).success ? null : 'email 格式錯誤' }));
  const errors = validated.filter(item => !item.valid).length;
  if (input.preview) return { total: emails.length, validCount: emails.length - errors, errorCount: errors, queuedCount: 0, items: validated.map(item => ({ ...item, enrollmentId: null })) };

  const created = await prisma.$transaction(async tx => {
    const items: Array<{ email: string; valid: boolean; reason: string | null; enrollmentId: number | null; inviteToken?: string }> = validated.map(item => ({ ...item, enrollmentId: null }));
    for (const item of items) {
      if (!item.valid) continue;
      const where = { cohort_id_email: { cohort_id: cohort.id, email: item.email } };
      const existing = await tx.cohort_enrollments.findUnique({ where, select: { id: true, invite_token: true, status: true } });
      const enrollment = !existing
        ? await tx.cohort_enrollments.create({ data: { cohort_id: cohort.id, email: item.email, status: 'invited', role: 'member' }, select: { id: true, invite_token: true } })
        : existing.status === 'joined'
          ? existing
          : await tx.cohort_enrollments.update({ where, data: { status: 'invited', exited_at: null }, select: { id: true, invite_token: true } });
      item.enrollmentId = enrollment.id;
      item.inviteToken = enrollment.invite_token ?? undefined;
    }
    await tx.$executeRaw`
      INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value)
      VALUES (${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_INVITATION_UPLOADED}, 'cohort', ${String(cohort.id)},
              ${JSON.stringify({ totalCount: emails.length, validCount: emails.length - errors, errorCount: errors })}::jsonb)
    `;
    return items;
  });
  const base = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
  const jobs = created.filter(item => item.valid && item.inviteToken).map(item => {
    const template = generateCohortInvitationEmail({ organizationName: cohort.program.organization.name, cohortName: cohort.display_name, inviteMessage: cohort.invite_message, inviteUrl: `${base}/cohorts/join/${item.inviteToken}` });
    return { to: item.email, subject: template.subject, html: template.html, emailType: 'cohort_invitation', priority: 'P1' as const };
  });
  await bulkEnqueueEmails(jobs);
  const recipients = await prisma.users.findMany({
    where: { contacts: { email: { in: jobs.map(job => job.to) } } },
    select: { id: true }
  });
  await Promise.all(recipients.map(recipient => notificationEventService.createEvent({
    type: NOTIFICATION_TYPES.COHORT_INVITATION,
    actorId,
    recipientId: recipient.id,
    entityType: 'cohort',
    entityId: cohort.id,
    payload: { message: `你收到「${cohort.display_name}」的加入邀請。` },
    priority: 'P1'
  })));
  return { total: emails.length, validCount: emails.length - errors, errorCount: errors, queuedCount: jobs.length, items: created.map(({ inviteToken: _inviteToken, ...item }) => item) };
};
const resend = async (programId: number, cohortId: number, enrollmentId: number, actorId: number) => {
  const enrollment = await prisma.cohort_enrollments.findFirst({
    where: { id: enrollmentId, cohort_id: cohortId, cohort: { program_id: programId, program: { organization: { status: 'active', organization_members: { some: { user_id: actorId } } } } } },
    select: { id: true, email: true, invite_token: true, cohort: { select: { display_name: true, invite_message: true, program: { select: { organization: { select: { name: true } } } } } } }
  });
  if (!enrollment) throw new ForbiddenError('無權限重寄此邀請');
  if (!enrollment.email) throw new ForbiddenError('此匿名名冊紀錄不可重寄邀請');
  const token = enrollment.invite_token;
  if (!token) throw new ForbiddenError('此邀請沒有可用 token');
  const base = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
  const template = generateCohortInvitationEmail({ organizationName: enrollment.cohort.program.organization.name, cohortName: enrollment.cohort.display_name, inviteMessage: enrollment.cohort.invite_message, inviteUrl: `${base}/cohorts/join/${token}` });
  const jobId = await enqueueEmail({ to: enrollment.email, subject: template.subject, html: template.html, emailType: 'cohort_invitation', priority: 'P1' });
  return { enrollmentId: enrollment.id, queued: jobId !== null };
};
export const cohortInvitationService = { invite, resend };
