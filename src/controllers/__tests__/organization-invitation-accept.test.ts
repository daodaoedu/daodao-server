import '../../config/openapi-registry';
import express from 'express';
import cookieParser from 'cookie-parser';
import request, { type Test } from 'supertest';
import jwt from 'jsonwebtoken';
import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('../../services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../../services/email/organization-invitation-dispatch.service', () => ({ recoverOrganizationInvitationEmails: jest.fn() }));

import { authenticateJWT } from '../../middleware/auth';
import { globalErrorHandler } from '../../middleware/error.middleware';
import { organizationInvitationController } from '../organization-invitation.controller';
import { hashInvitationToken } from '../../services/organization-invitation-token.service';

const externalId = 'd4c39727-51c5-44fd-b929-832121615fd7';
const recipient = { id: 294, external_id: externalId, is_active: true, verified_login_email: 'recipient@example.com' };
const otherUser = { id: 3, external_id: 'b459dc29-bc7e-4abc-875a-1fd21dbf83be', is_active: true, verified_login_email: 'another@example.com' };
const token = 'a'.repeat(64);
const invitation = { id: 38, organization_id: 41, email: 'recipient@example.com', token_hash: hashInvitationToken(token), token_nonce: 'synthetic', expires_at: new Date('2099-01-01'), created_at: new Date('2026-11-08'), created_by: 1, revoked_at: null, accepted_at: null, accepted_user_id: null };
const app = express();
app.use(express.json(), cookieParser());
app.post('/accept', authenticateJWT, organizationInvitationController.accept);
app.use(globalErrorHandler);

/** Sign the same stable UUID and potentially stale integer carried by a real session. */
const session = (payload: Record<string, unknown>): string => jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '5m' });
const submit = (payload: Record<string, unknown>): Test => request(app).post('/accept').set('Cookie', `auth_token=${session(payload)}`).send({ token });

beforeEach(() => {
  setupTransactionMock();
  prismaMock.$queryRaw.mockResolvedValue([{ id: 41, name: 'Invited organization', status: 'active' }]);
  prismaMock.organization_invitations.findUnique.mockResolvedValue(invitation);
  prismaMock.organization_invitations.findUniqueOrThrow.mockResolvedValue(invitation);
  (prismaMock.users.findUnique as jest.Mock).mockImplementation(async (args: { where: { external_id?: string; id?: number } }) => {
    const where = args.where;
    if (where.external_id === externalId || where.id === recipient.id) return recipient as never;
    if (where.id === otherUser.id) return otherUser as never;
    return null;
  });
  prismaMock.organization_invitations.update.mockResolvedValue({ ...invitation, accepted_at: new Date(), accepted_user_id: recipient.id });
});

describe('invitation recipient session identity', () => {
  it.each([3, 999])('requires a fresh login before accepting a session with stale integer %i', async id => {
    const response = await submit({ id, _id: externalId, isTemp: false });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, data: null });
    expect(prismaMock.organization_invitations.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitations.update).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitation_requests.upsert).not.toHaveBeenCalled();
  });

  it('preserves the invitation for acceptance after stale identity is replaced by a fresh canonical session', async () => {
    const staleResponse = await submit({ id: 3, _id: externalId, isTemp: false });
    expect(staleResponse.status).toBe(401);
    expect(prismaMock.organization_invitations.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitations.update).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitation_requests.upsert).not.toHaveBeenCalled();

    const freshResponse = await submit({ id: 294, _id: externalId, isTemp: false });
    expect(freshResponse.status).toBe(200);
    expect(freshResponse.body.data).toEqual({ status: 'accepted', organizationId: 41, organizationName: 'Invited organization' });
    expect(prismaMock.organization_members.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.organization_members.create).toHaveBeenCalledWith({ data: { organization_id: 41, user_id: 294, role: 'owner' } });
    expect(prismaMock.organization_invitations.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.organization_invitations.update).toHaveBeenCalledWith({ where: { id: 38 }, data: { accepted_at: expect.any(Date), accepted_user_id: 294 } });
  });

  it('allows the canonical session issued after first registration to complete acceptance', async () => {
    const response = await submit({ id: 294, _id: externalId, isTemp: false });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('accepted');
    expect(prismaMock.organization_members.create).toHaveBeenCalledWith({ data: { organization_id: 41, user_id: 294, role: 'owner' } });
  });

  it.each([undefined, 'malformed', '517e523b-4ad0-4a86-b4c3-aa343f10b89d'])('requires login when canonical identity is %s, even if integer points to a real user', async uuid => {
    const response = await submit({ id: 294, _id: uuid, isTemp: false, email: recipient.verified_login_email });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, data: null });
    expect(prismaMock.organization_invitations.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitation_requests.upsert).not.toHaveBeenCalled();
  });

  it('requires login for an inactive canonical account', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ ...recipient, is_active: false } as never);
    const response = await submit({ id: 294, _id: externalId, isTemp: false });
    expect(response.status).toBe(401);
    expect(prismaMock.organization_invitations.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
  });

  it('does not interpret temporary identity as a registered user', async () => {
    const response = await submit({ id: 294, _id: externalId, isTemp: true });
    expect(response.status).toBe(401);
    expect(prismaMock.users.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
  });

  it.each([null, 'different@example.com'])('records only a confirmation request when provider email is %s', async email => {
    prismaMock.users.findUnique.mockResolvedValue({ ...recipient, verified_login_email: email } as never);
    const response = await submit({ id: 294, _id: externalId, isTemp: false });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: 'needs_confirmation' });
    expect(prismaMock.organization_invitation_requests.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { invitation_id: 38, user_id: 294 } }));
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitations.update).not.toHaveBeenCalled();
  });
});
