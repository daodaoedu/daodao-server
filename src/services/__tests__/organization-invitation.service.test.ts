import '../../config/openapi-registry';
import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
import { organizationInvitationService, getOrganizationInvitationStatus, createOrganizationInvitationInTransaction } from '../organization-invitation.service';
import { hashInvitationToken } from '../organization-invitation-token.service';
import { createOrganizationSchema } from '../../validators/organization.validators';

const now = new Date('2026-11-04T00:00:00Z');
const row = { id: 4, organization_id: 3, email: 'owner@example.com', token_nonce: 'nonce', token_hash: hashInvitationToken('token'), created_by: 1, created_at: now, expires_at: new Date('2099-01-01T00:00:00Z'), accepted_at: null, accepted_user_id: null, revoked_at: null };
const organization = { id: 3, name: '島島組織', status: 'active' };

describe('organization invitation authorization and state', () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.$queryRaw.mockResolvedValue([organization]);
    prismaMock.organization_invitations.findUnique.mockResolvedValue(row);
    prismaMock.organization_invitations.findUniqueOrThrow.mockResolvedValue(row);
    prismaMock.users.findUnique.mockResolvedValue({ id: 42, verified_login_email: 'owner@example.com', is_active: true } as never);
    prismaMock.organization_invitations.update.mockResolvedValue({ ...row, accepted_at: now, accepted_user_id: 42 });
  });
  it('does not assign a disabled registered account as owner', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([organization]).mockResolvedValueOnce([{ id: 42, is_active: false }]);
    await expect(createOrganizationInvitationInTransaction(prismaMock, 3, 'owner@example.com', 1)).rejects.toThrow('已停用');
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitations.create).not.toHaveBeenCalled();
  });
  it('does not arbitrarily assign one of multiple registered accounts with the same Email', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([organization]).mockResolvedValueOnce([{ id: 42, is_active: true }, { id: 43, is_active: true }]);
    await expect(createOrganizationInvitationInTransaction(prismaMock, 3, 'owner@example.com', 1)).rejects.toThrow('多個帳號');
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
  });
  it('joins an authenticated recipient with the provider-verified matching Email', async () => {
    await expect(organizationInvitationService.accept('token', 42)).resolves.toEqual({ status: 'accepted', organizationId: 3, organizationName: '島島組織' });
    expect(prismaMock.organization_members.create).toHaveBeenCalledWith({ data: { organization_id: 3, user_id: 42, role: 'owner' } });
    expect(prismaMock.organization_invitations.update).toHaveBeenCalledWith({ where: { id: 4 }, data: { accepted_at: expect.any(Date), accepted_user_id: 42 } });
  });
  it.each([null, 'other@example.com'])('requires admin approval when trusted Email is %s', async verified => {
    prismaMock.users.findUnique.mockResolvedValue({ id: 42, verified_login_email: verified, contacts: { email: 'owner@example.com' } } as never);
    await expect(organizationInvitationService.accept('token', 42)).resolves.toEqual({ status: 'needs_confirmation' });
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitations.update).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitation_requests.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { invitation_id: 4, user_id: 42 } }));
  });
  it.each([
    [{ accepted_at: now }, 'used'], [{ revoked_at: now }, 'revoked'], [{ expires_at: now }, 'expired']
  ])('does not grant access for a terminal invitation %j', async (patch, status) => {
    prismaMock.organization_invitations.findUniqueOrThrow.mockResolvedValue({ ...row, ...patch });
    await expect(organizationInvitationService.accept('token', 42)).resolves.toEqual({ status });
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    expect(prismaMock.organization_invitation_requests.upsert).not.toHaveBeenCalled();
  });
  it('does not reveal organization metadata for an unknown token', async () => {
    prismaMock.organization_invitations.findUnique.mockResolvedValue(null);
    await expect(organizationInvitationService.accept('unknown', 42)).resolves.toEqual({ status: 'invalid' });
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });
  it('rejects a missing/disabled formal account before recording an applicant', async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);
    await expect(organizationInvitationService.accept('token', 42)).rejects.toThrow('正式帳號');
    expect(prismaMock.organization_invitation_requests.upsert).not.toHaveBeenCalled();
  });
  it('refuses admin approval after revocation or expiry', async () => {
    prismaMock.organization_invitations.findFirst.mockResolvedValue({ ...row, revoked_at: now });
    await expect(organizationInvitationService.approve(3, 4, 6, 1)).rejects.toThrow('邀請已失效');
    expect(prismaMock.organization_members.create).not.toHaveBeenCalled();
    prismaMock.organization_invitations.findFirst.mockResolvedValue({ ...row, expires_at: now });
    await expect(organizationInvitationService.approve(3, 4, 6, 1)).rejects.toThrow('邀請已失效');
  });
  it('does not treat pending or expired links as joined owners', () => {
    expect(getOrganizationInvitationStatus(row, now)).toBe('pending');
    expect(getOrganizationInvitationStatus({ ...row, expires_at: now }, now)).toBe('expired');
  });
  it('requires exactly one owner selector and normalizes owner Email input', () => {
    expect(createOrganizationSchema.parse({ name: '島島', ownerEmail: ' Owner@Example.com ' }).ownerEmail).toBe('owner@example.com');
    expect(createOrganizationSchema.safeParse({ name: '島島' }).success).toBe(false);
    expect(createOrganizationSchema.safeParse({ name: '島島', ownerEmail: 'owner@example.com', ownerUserId: 42 }).success).toBe(false);
    expect(createOrganizationSchema.safeParse({ name: '島島', ownerUserId: 42 }).success).toBe(true);
  });
});
