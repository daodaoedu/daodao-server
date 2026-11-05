import type { Prisma, organization_invitations } from '../../generated/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { createInvitationToken, hashInvitationToken, normalizeInvitationEmail } from './organization-invitation-token.service';
import type { AcceptOrganizationInvitationResponse, OrganizationInvitationResponse } from '../validators/organization-invitation.validators';

type Tx = Prisma.TransactionClient;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Distinguish consumed links from revoked or expired links. */
export const getOrganizationInvitationStatus = (row: Pick<organization_invitations, 'accepted_at' | 'revoked_at' | 'expires_at'>, now = new Date()): OrganizationInvitationResponse['status'] => {
  if (row.accepted_at) return 'accepted';
  if (row.revoked_at) return 'revoked';
  return row.expires_at <= now ? 'expired' : 'pending';
};

/** Serialize only admin-visible invitation fields; nonce/hash never leave the service. */
const present = async (tx: Tx, row: organization_invitations): Promise<OrganizationInvitationResponse> => {
  const requests = await tx.$queryRaw<Array<{ id: number; user_id: number; email: string | null; nickname: string | null; created_at: Date }>>`
    SELECT r.id, r.user_id, c.email, u.nickname, r.created_at
    FROM organization_invitation_requests r JOIN users u ON u.id = r.user_id
    LEFT JOIN contacts c ON c.id = u.contact_id
    WHERE r.invitation_id = ${row.id} AND r.approved_at IS NULL ORDER BY r.created_at, r.id`;
  const dispatch = await tx.organization_invitation_dispatches.findUnique({ where: { invitation_id: row.id } });
  return {
    id: row.id, organizationId: row.organization_id, email: row.email,
    status: getOrganizationInvitationStatus(row), expiresAt: row.expires_at.toISOString(), createdAt: row.created_at.toISOString(),
    deliveryStatus: dispatch?.status === 'sent' ? 'sent' : dispatch?.status === 'failed' ? 'failed' : 'pending',
    requests: requests.map(r => ({ id: r.id, userId: r.user_id, email: r.email, nickname: r.nickname, createdAt: r.created_at.toISOString() }))
  };
};

/** Lock the organization before member/invitation mutations, including replacement-owner safety. */
const lockOrganization = async (tx: Tx, organizationId: number) => {
  const rows = await tx.$queryRaw<Array<{ id: number; name: string; status: string }>>`SELECT id, name, status FROM organization WHERE id = ${organizationId} FOR UPDATE`;
  if (!rows[0]) throw new NotFoundError('找不到組織');
  if (rows[0].status !== 'active') throw new ConflictError('此組織目前已停權');
  return rows[0];
};

/** Write an actor-bound record without persisting invitation tokens. */
const audit = async (tx: Tx, actorId: number, action: string, invitation: organization_invitations, userId?: number) => {
  await tx.$executeRaw`INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value)
    VALUES (${actorId}, ${action}, 'organization_invitation', ${String(invitation.id)}, ${JSON.stringify({ organizationId: invitation.organization_id, userId })}::jsonb)`;
};

/** Match registered recipients case-insensitively and reject ambiguous account data. */
const resolveRegisteredUser = async (tx: Tx, email: string): Promise<number | null> => {
  const rows = await tx.$queryRaw<Array<{ id: number; is_active: boolean | null }>>`
    SELECT u.id, u.is_active FROM users u
    WHERE lower(btrim(u.verified_login_email)) = ${email} ORDER BY u.id LIMIT 2`;
  if (rows.length > 1) throw new ConflictError('此 Email 對應多個帳號，請先確認帳號資料');
  if (rows[0]?.is_active === false) throw new ConflictError('此 Email 對應的帳號已停用');
  return rows[0]?.id ?? null;
};

/** Create membership and durable dispatch in the caller's transaction. */
export const createOrganizationInvitationInTransaction = async (tx: Tx, organizationId: number, rawEmail: string, actorId: number, forceInvitation = false) => {
  await lockOrganization(tx, organizationId);
  const email = normalizeInvitationEmail(rawEmail);
  const userId = forceInvitation ? null : await resolveRegisteredUser(tx, email);
  if (userId !== null) {
    const existing = await tx.organization_members.findUnique({ where: { organization_id_user_id: { organization_id: organizationId, user_id: userId } } });
    if (existing) throw new ConflictError('此使用者已是組織成員');
  }
  // Expired/pending predecessors are explicitly revoked before a fresh invite is created.
  await tx.organization_invitations.updateMany({ where: { organization_id: organizationId, email, accepted_at: null, revoked_at: null }, data: { revoked_at: new Date() } });
  const keys = createInvitationToken();
  const row = await tx.organization_invitations.create({ data: {
    organization_id: organizationId, email, token_nonce: keys.nonce, token_hash: keys.hash,
    created_by: actorId, expires_at: new Date(Date.now() + WEEK_MS),
    accepted_at: userId !== null ? new Date() : null, accepted_user_id: userId
  } });
  if (userId !== null) await tx.organization_members.create({ data: { organization_id: organizationId, user_id: userId, role: 'owner' } });
  await tx.organization_invitation_dispatches.create({ data: { invitation_id: row.id } });
  await audit(tx, actorId, 'organization_invitation_created', row, userId ?? undefined);
  return row;
};

/** Create an active organization before assigning a registered or pending Email owner. */
const createOrganization = async (input: { name: string; bio?: string | null; externalLink?: string | null; ownerEmail: string }, actorId: number) => prisma.$transaction(async tx => {
  const organization = await tx.organization.create({ data: { name: input.name, bio: input.bio ?? null, external_link: input.externalLink ?? null, status: 'active', approved_by: actorId, approved_at: new Date() } });
  await createOrganizationInvitationInTransaction(tx, organization.id, input.ownerEmail, actorId);
  await tx.$executeRaw`INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value) VALUES (${actorId}, 'organization_created', 'organization', ${String(organization.id)}, ${JSON.stringify({ status: 'active', ownerEmail: normalizeInvitationEmail(input.ownerEmail) })}::jsonb)`;
  return organization;
});

/** Read invitations only behind the admin gate. */
const list = async (organizationId: number) => prisma.$transaction(async tx => {
  if (!await tx.organization.findUnique({ where: { id: organizationId }, select: { id: true } })) throw new NotFoundError('找不到組織');
  const rows = await tx.organization_invitations.findMany({ where: { organization_id: organizationId }, orderBy: { id: 'desc' } });
  return Promise.all(rows.map(row => present(tx, row)));
});

/** Add by Email; known accounts join immediately, others receive a pending invite. */
const create = async (organizationId: number, email: string, actorId: number) => prisma.$transaction(async tx => present(tx, await createOrganizationInvitationInTransaction(tx, organizationId, email, actorId)));

/** Fetch a matching invitation under the shared organization lock. */
const lockedInvitation = async (tx: Tx, organizationId: number, invitationId: number) => {
  await lockOrganization(tx, organizationId);
  const row = await tx.organization_invitations.findFirst({ where: { id: invitationId, organization_id: organizationId } });
  if (!row) throw new NotFoundError('找不到邀請');
  return row;
};

/** Revoke active or expired links while preserving consumed-link history. */
const revoke = async (organizationId: number, invitationId: number, actorId: number) => prisma.$transaction(async tx => {
  const row = await lockedInvitation(tx, organizationId, invitationId);
  if (row.accepted_at) throw new ConflictError('邀請已被使用');
  const updated = await tx.organization_invitations.update({ where: { id: row.id }, data: { revoked_at: row.revoked_at ?? new Date() } });
  await audit(tx, actorId, 'organization_invitation_revoked', row);
  return present(tx, updated);
});

/** Replace a link instead of overwriting its token, so old links remain explicitly revoked. */
const resend = async (organizationId: number, invitationId: number, actorId: number) => prisma.$transaction(async tx => {
  const row = await lockedInvitation(tx, organizationId, invitationId);
  if (row.accepted_at) throw new ConflictError('邀請已被使用');
  await tx.organization_invitations.update({ where: { id: row.id }, data: { revoked_at: row.revoked_at ?? new Date() } });
  const created = await createOrganizationInvitationInTransaction(tx, organizationId, row.email, actorId, true);
  await audit(tx, actorId, 'organization_invitation_resent', created);
  return present(tx, created);
});

/** Atomically consume an invitation after a trusted match or explicit admin approval. */
const join = async (tx: Tx, row: organization_invitations, userId: number, actorId: number) => {
  const membership = await tx.organization_members.findUnique({ where: { organization_id_user_id: { organization_id: row.organization_id, user_id: userId } } });
  if (!membership) await tx.organization_members.create({ data: { organization_id: row.organization_id, user_id: userId, role: 'owner' } });
  const updated = await tx.organization_invitations.update({ where: { id: row.id }, data: { accepted_at: new Date(), accepted_user_id: userId } });
  await audit(tx, actorId, 'organization_invitation_accepted', row, userId);
  return updated;
};

/** A signed-in account must have a provider-verified Email; contact edits never satisfy this check. */
const accept = async (token: string, userId: number): Promise<AcceptOrganizationInvitationResponse> => prisma.$transaction(async tx => {
  const candidate = await tx.organization_invitations.findUnique({ where: { token_hash: hashInvitationToken(token) } });
  if (!candidate) return { status: 'invalid' };
  const organization = await lockOrganization(tx, candidate.organization_id);
  const row = await tx.organization_invitations.findUniqueOrThrow({ where: { id: candidate.id } });
  const status = getOrganizationInvitationStatus(row);
  if (status === 'accepted') return { status: 'used' };
  if (status !== 'pending') return { status };
  const user = await tx.users.findUnique({ where: { id: userId }, select: { id: true, verified_login_email: true, is_active: true } });
  if (!user || user.is_active === false) throw new BadRequestError('請使用正式帳號接受邀請');
  if (!user.verified_login_email || normalizeInvitationEmail(user.verified_login_email) !== row.email) {
    await tx.organization_invitation_requests.upsert({ where: { invitation_id_user_id: { invitation_id: row.id, user_id: user.id } }, create: { invitation_id: row.id, user_id: user.id }, update: {} });
    return { status: 'needs_confirmation' };
  }
  await join(tx, row, user.id, user.id);
  return { status: 'accepted', organizationId: organization.id, organizationName: organization.name };
});

/** Approve the exact applicant, only while the invitation remains valid. */
const approve = async (organizationId: number, invitationId: number, requestId: number, actorId: number) => prisma.$transaction(async tx => {
  const row = await lockedInvitation(tx, organizationId, invitationId);
  if (getOrganizationInvitationStatus(row) !== 'pending') throw new ConflictError('邀請已失效或已使用，請重寄新邀請');
  const request = await tx.organization_invitation_requests.findFirst({ where: { id: requestId, invitation_id: row.id, approved_at: null } });
  if (!request) throw new NotFoundError('找不到待確認申請');
  const user = await tx.users.findUnique({ where: { id: request.user_id }, select: { is_active: true } });
  if (!user || user.is_active === false) throw new ConflictError('申請帳號已停用');
  const updated = await join(tx, row, request.user_id, actorId);
  await tx.organization_invitation_requests.update({ where: { id: request.id }, data: { approved_at: new Date(), approved_by: actorId } });
  await audit(tx, actorId, 'organization_invitation_approved', row, request.user_id);
  return present(tx, updated);
});

export const organizationInvitationService = { createOrganization, list, create, revoke, resend, accept, approve };
