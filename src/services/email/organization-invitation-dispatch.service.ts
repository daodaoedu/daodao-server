import { prisma } from '../database/prisma.service';
import { emailService } from './email.service';
import { invitationToken, hashInvitationToken } from '../organization-invitation-token.service';
import { generateStandardEmail, generateCtaButton } from './base-template';
import { escapeHtml } from '../../utils/sanitize';
import { loggerService } from '../logging/logger.service';

/** Recover durable pending sends; a lease prevents concurrent SMTP workers claiming a send. */
export const recoverOrganizationInvitationEmails = async (): Promise<number> => {
  let sent = 0;
  for (let i = 0; i < 20; i++) {
    const claims = await prisma.$queryRaw<Array<{ invitation_id: number }>>`
      UPDATE organization_invitation_dispatches SET lease_until = NOW() + INTERVAL '5 minutes', attempts = attempts + 1
      WHERE invitation_id = (
        SELECT invitation_id FROM organization_invitation_dispatches
        WHERE status <> 'sent' AND next_attempt_at <= NOW() AND (lease_until IS NULL OR lease_until < NOW())
        ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT 1
      ) RETURNING invitation_id`;
    const id = claims[0]?.invitation_id;
    if (id === undefined) break;
    try {
      const invitation = await prisma.organization_invitations.findUniqueOrThrow({ where: { id } });
      const organization = await prisma.organization.findUniqueOrThrow({ where: { id: invitation.organization_id } });
      if (invitation.revoked_at || (!invitation.accepted_at && invitation.expires_at <= new Date())) {
        await prisma.organization_invitation_dispatches.update({ where: { invitation_id: id }, data: { status: 'failed', lease_until: null, next_attempt_at: new Date('9999-01-01T00:00:00Z'), last_error: 'Invitation is no longer active' } });
        continue;
      }
      const base = process.env.FRONTEND_URL;
      if (!base) throw new Error('FRONTEND_URL is required');
      const token = invitationToken(invitation.token_nonce);
      if (hashInvitationToken(token) !== invitation.token_hash) throw new Error('Invitation signing key changed; resend required');
      const joined = invitation.accepted_at !== null;
      const name = escapeHtml(organization.name);
      const url = joined ? `${base.replace(/\/$/, '')}/lighthouse` : `${base.replace(/\/$/, '')}/organization-invitation?token=${token}`;
      const mail = generateStandardEmail({
        title: joined ? `歡迎加入 ${name}` : `邀請加入 ${name}`,
        subject: joined ? `你已成為「${organization.name}」的管理者` : `邀請你成為「${organization.name}」的管理者`,
        preheader: joined ? '前往燈塔管理組織' : '邀請有效 7 天，請使用受邀 Email 登入接受',
        content: joined ? `<p>你已加入「${name}」，成為組織管理者。</p>${generateCtaButton({ text: '前往燈塔', url, color: 'cyan' })}` : `<p>島島邀請你成為「${name}」的管理者。請使用收到邀請的 Email 註冊或登入後接受邀請。</p><p>邀請有效 7 天；Email 不相符時需由島島確認。</p>${generateCtaButton({ text: '接受組織邀請', url, color: 'cyan' })}`
      });
      const result = await emailService.sendEmail({ to: invitation.email, ...mail });
      const accepted = result.accepted?.some(email => email.toLowerCase() === invitation.email);
      if (!result.success || !accepted) throw new Error('SMTP did not accept invitation recipient');
      await prisma.organization_invitation_dispatches.update({ where: { invitation_id: id }, data: { status: 'sent', sent_at: new Date(), message_id: result.messageId ?? null, lease_until: null, last_error: null } });
      sent++;
    } catch {
      // Do not persist SMTP error text: provider errors may echo message content or tokens.
      await prisma.organization_invitation_dispatches.update({ where: { invitation_id: id }, data: { status: 'failed', last_error: 'Delivery failed; retry scheduled', lease_until: null, next_attempt_at: new Date(Date.now() + 60_000) } });
      loggerService.warn('Organization invitation delivery retry scheduled', { invitationId: id });
    }
  }
  return sent;
};

/** Run recovery on boot and periodically; failed DB scans are retried without unhandled rejections. */
export const startOrganizationInvitationDispatch = () => {
  const recover = () => { void recoverOrganizationInvitationEmails().catch(() => loggerService.warn('Organization invitation recovery unavailable')); };
  recover();
  const timer = setInterval(recover, 60_000);
  timer.unref();
  return () => clearInterval(timer);
};
