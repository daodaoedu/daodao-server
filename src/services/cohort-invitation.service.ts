import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { getInvitationBlockReason, isInvitationSendable, type InvitationBlockReason, type InviteItemState } from '../domain/cohort.rules';
import { ConflictError, ForbiddenError } from '../middleware/error.middleware';
import { bulkEnqueueEmails, enqueueEmail } from '../queues/email.queue';
import type { InviteMembersInput } from '../validators/cohort-invitation.validators';
import { prisma } from './database/prisma.service';
import { generateCohortInvitationEmail } from './email/cohort-invitation-template';
import { notificationEventService } from './notification-event.service';

const emailSchema = z.string().trim().toLowerCase().email();
const blockMessages: Record<InvitationBlockReason, string> = {
  expired: '已超過加入截止日，請先到「編輯場次設定」延後加入截止日再寄送邀請',
  not_published: '此場次尚未發布，請先發布再寄送邀請',
  full: '此場次人數已滿，請先到「編輯場次設定」調整人數上限再寄送邀請'
};
const joinWindowSelect = { id: true, status: true, end_date: true, join_deadline: true, capacity: true } as const;
/** 受邀者收到信時是否還能加入；不能加入就不寄（daodao#281） */
const resolveBlockReason = async (cohort: { id: number; status: string; end_date: Date; join_deadline: Date | null; capacity: number | null }): Promise<InvitationBlockReason | null> => {
  const participantCount = cohort.capacity === null ? 0 : await prisma.cohort_enrollments.count({ where: { cohort_id: cohort.id, status: 'joined' } });
  return getInvitationBlockReason({ status: cohort.status, endDate: cohort.end_date, joinDeadline: cohort.join_deadline, capacity: cohort.capacity, participantCount });
};
const countStates = (items: Array<{ state: InviteItemState }>): { sendableCount: number; skippedCount: number } => ({
  sendableCount: items.filter(item => isInvitationSendable(item.state)).length,
  skippedCount: items.filter(item => item.state === 'joined').length
});
const collect = (input: InviteMembersInput): string[] => {
  const csvEmails = input.csv?.split(/\r?\n/).map(line => line.split(',')[0]?.trim()).filter(Boolean) ?? [];
  if (csvEmails[0]?.toLowerCase() === 'email') csvEmails.shift();
  return [...new Set([...(input.emails ?? []), ...csvEmails].map(value => value.trim().toLowerCase()).filter(Boolean))];
};
const invite = async (programId: number, cohortId: number, actorId: number, input: InviteMembersInput) => {
  const cohort = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, program: { organization: { status: 'active', organization_members: { some: { user_id: actorId } } } } },
    select: { ...joinWindowSelect, display_name: true, invite_message: true, program: { select: { organization: { select: { name: true } } } } }
  });
  if (!cohort) throw new ForbiddenError('無權限管理此期邀請');
  const blockedReason = await resolveBlockReason(cohort);
  const emails = collect(input);
  const validated = emails.map(email => ({ email, valid: emailSchema.safeParse(email).success, reason: emailSchema.safeParse(email).success ? null : 'email 格式錯誤' }));
  const errors = validated.filter(item => !item.valid).length;
  if (input.preview) {
    // 預覽要區分「新邀請／已邀請／已加入／曾退出」（FR-RS-03），只讀不寫
    const existing = await prisma.cohort_enrollments.findMany({
      where: { cohort_id: cohort.id, email: { in: validated.filter(item => item.valid).map(item => item.email) } },
      select: { email: true, status: true }
    });
    const statusByEmail = new Map(existing.map(row => [row.email, row.status]));
    const items = validated.map(item => {
      const status = item.valid ? statusByEmail.get(item.email) : undefined;
      const state: InviteItemState = !item.valid ? 'invalid' : status === 'joined' ? 'joined' : status === 'invited' ? 'invited' : status ? 'rejoin' : 'new';
      const reasons = { invalid: item.reason, joined: '已加入', invited: '已邀請，將重寄邀請信', rejoin: '曾退出，將重新邀請', new: null } as const;
      return { ...item, reason: reasons[state], state, enrollmentId: null };
    });
    return { total: emails.length, validCount: emails.length - errors, errorCount: errors, queuedCount: 0, ...countStates(items), blockedReason, items };
  }
  if (blockedReason) throw new ConflictError(blockMessages[blockedReason]);

  const created = await prisma.$transaction(async tx => {
    const items: Array<{ email: string; valid: boolean; reason: string | null; enrollmentId: number | null; state: InviteItemState; inviteToken?: string }> = validated.map(item => ({ ...item, enrollmentId: null, state: item.valid ? 'new' : 'invalid' }));
    for (const item of items) {
      if (!item.valid) continue;
      const where = { cohort_id_email: { cohort_id: cohort.id, email: item.email } };
      const existing = await tx.cohort_enrollments.findUnique({ where, select: { id: true, invite_token: true, status: true } });
      item.state = !existing ? 'new' : existing.status === 'joined' ? 'joined' : existing.status === 'invited' ? 'invited' : 'rejoin';
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
              ${JSON.stringify({ totalCount: emails.length, validCount: emails.length - errors, errorCount: errors })}::jsonb),
             (${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_INVITED}, 'cohort', ${String(cohort.id)},
              ${JSON.stringify({ version: 1, enrollmentIds: items.flatMap(item => isInvitationSendable(item.state) && item.enrollmentId !== null ? [item.enrollmentId] : []) })}::jsonb)
    `;
    return items;
  });
  const base = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
  // 已加入者保留原 enrollment，不重寄邀請信（daodao#282）
  const jobs = created.filter(item => isInvitationSendable(item.state) && item.inviteToken).map(item => {
    const template = generateCohortInvitationEmail({ organizationName: cohort.program.organization.name, cohortName: cohort.display_name, inviteMessage: cohort.invite_message, inviteUrl: `${base}/cohorts/join/${item.inviteToken}` });
    return { to: item.email, subject: template.subject, html: template.html, emailType: 'cohort_invitation', priority: 'P1' as const };
  });
  await bulkEnqueueEmails(jobs);
  const recipients = await prisma.users.findMany({
    where: { contacts: { email: { in: jobs.map(job => job.to) } } },
    select: { id: true, contacts: { select: { email: true } } }
  });
  const invitationByEmail = new Map(created.filter(item => isInvitationSendable(item.state) && item.inviteToken).map(item => [item.email, item.inviteToken]));
  await Promise.all(recipients.map(recipient => notificationEventService.createEvent({
    type: NOTIFICATION_TYPES.COHORT_INVITATION,
    actorId,
    recipientId: recipient.id,
    entityType: 'cohort',
    entityId: cohort.id,
    payload: {
      cohortName: cohort.display_name,
      message: `你收到「${cohort.display_name}」的加入邀請。`,
      ...(recipient.contacts?.email && invitationByEmail.get(recipient.contacts.email) && {
        url: `${base}/cohorts/join/${invitationByEmail.get(recipient.contacts.email)}`
      })
    },
    priority: 'P1'
  })));
  return { total: emails.length, validCount: emails.length - errors, errorCount: errors, queuedCount: jobs.length, ...countStates(created), blockedReason: null, items: created.map(({ inviteToken: _inviteToken, ...item }) => item) };
};
const resend = async (programId: number, cohortId: number, enrollmentId: number, actorId: number) => {
  const enrollment = await prisma.cohort_enrollments.findFirst({
    where: { id: enrollmentId, cohort_id: cohortId, cohort: { program_id: programId, program: { organization: { status: 'active', organization_members: { some: { user_id: actorId } } } } } },
    select: { id: true, email: true, invite_token: true, status: true, cohort: { select: { ...joinWindowSelect, display_name: true, invite_message: true, program: { select: { organization: { select: { name: true } } } } } } }
  });
  if (!enrollment) throw new ForbiddenError('無權限重寄此邀請');
  if (!enrollment.email) throw new ForbiddenError('此匿名名冊紀錄不可重寄邀請');
  if (enrollment.status === 'joined') throw new ConflictError('此成員已加入，不需重寄邀請');
  const blockedReason = await resolveBlockReason(enrollment.cohort);
  if (blockedReason) throw new ConflictError(blockMessages[blockedReason]);
  const token = enrollment.invite_token;
  if (!token) throw new ForbiddenError('此邀請沒有可用 token');
  const base = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
  const template = generateCohortInvitationEmail({ organizationName: enrollment.cohort.program.organization.name, cohortName: enrollment.cohort.display_name, inviteMessage: enrollment.cohort.invite_message, inviteUrl: `${base}/cohorts/join/${token}` });
  const jobId = await enqueueEmail({ to: enrollment.email, subject: template.subject, html: template.html, emailType: 'cohort_invitation', priority: 'P1' });
  return { enrollmentId: enrollment.id, queued: jobId !== null };
};
export const cohortInvitationService = { invite, resend };
