import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('../../database/prisma.service', () => ({ prisma: prismaMock }));
const sendEmail = jest.fn();
jest.mock('../email.service', () => ({ emailService: { sendEmail } }));
import { recoverOrganizationInvitationEmails } from '../organization-invitation-dispatch.service';
import { createInvitationToken, invitationToken } from '../../organization-invitation-token.service';

const keys = () => createInvitationToken();
describe('durable organization invitation delivery', () => {
  let token: string;
  beforeEach(() => {
    const key = keys();
    token = invitationToken(key.nonce);
    process.env.FRONTEND_URL = 'http://localhost:3463';
    prismaMock.$queryRaw.mockResolvedValueOnce([{ invitation_id: 7 }]).mockResolvedValue([]);
    prismaMock.organization_invitations.findUniqueOrThrow.mockResolvedValue({
      id: 7, organization_id: 3, email: 'owner@example.com', token_nonce: key.nonce, token_hash: key.hash,
      expires_at: new Date('2099-01-01T00:00:00Z'), accepted_at: null, revoked_at: null
    } as never);
    prismaMock.organization.findUniqueOrThrow.mockResolvedValue({ id: 3, name: '<組織>' } as never);
    sendEmail.mockReset();
  });
  it('sends a recoverable invitation and records success only after SMTP accepts the recipient', async () => {
    sendEmail.mockResolvedValue({ success: true, accepted: ['owner@example.com'], messageId: 'smtp-7' });
    await expect(recoverOrganizationInvitationEmails()).resolves.toBe(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'owner@example.com', html: expect.stringContaining(`/organization-invitation?token=${token}`) }));
    expect(sendEmail.mock.calls[0][0].html).toContain('&lt;組織&gt;');
    expect(prismaMock.organization_invitation_dispatches.update).toHaveBeenCalledWith({ where: { invitation_id: 7 }, data: expect.objectContaining({ status: 'sent', message_id: 'smtp-7', sent_at: expect.any(Date), lease_until: null }) });
  });
  it.each([
    { success: false, error: 'secret-token-echo' },
    { success: true, accepted: [], rejected: ['owner@example.com'] }
  ])('keeps failed or rejected sends retryable without recording transport secrets', async result => {
    sendEmail.mockResolvedValue(result);
    await expect(recoverOrganizationInvitationEmails()).resolves.toBe(0);
    expect(prismaMock.organization_invitation_dispatches.update).toHaveBeenCalledWith({ where: { invitation_id: 7 }, data: expect.objectContaining({ status: 'failed', next_attempt_at: expect.any(Date), last_error: 'Delivery failed; retry scheduled', lease_until: null }) });
    expect(JSON.stringify(prismaMock.organization_invitation_dispatches.update.mock.calls)).not.toContain('secret-token-echo');
  });
  it('does not send revoked links recovered after restart', async () => {
    const invitation = await prismaMock.organization_invitations.findUniqueOrThrow({ where: { id: 7 } });
    prismaMock.organization_invitations.findUniqueOrThrow.mockResolvedValue({ ...invitation, revoked_at: new Date() });
    await expect(recoverOrganizationInvitationEmails()).resolves.toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitation_dispatches.update).toHaveBeenCalledWith({ where: { invitation_id: 7 }, data: expect.objectContaining({ status: 'failed', last_error: 'Invitation is no longer active' }) });
  });
});
