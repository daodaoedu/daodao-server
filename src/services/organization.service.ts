import { Prisma } from '../../generated/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import type {
  AddOrganizationMemberInput,
  AdminOrganizationMemberResponse,
  AdminUpdateOrganizationInput,
  CreateOrganizationInput,
  OrganizationMemberResponse,
  OrganizationResponse,
  UpdateOrganizationInput
} from '../validators/organization.validators';
import { prisma } from './database/prisma.service';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { isAcceptanceFixtureOrganization } from '../constants/acceptance-fixtures';
import { enqueueEmail } from '../queues/email.queue';
import { generateOrganizationOwnerEmail } from './email/organization-owner-template';
import { organizationInvitationService } from './organization-invitation.service';
import { recoverOrganizationInvitationEmails } from './email/organization-invitation-dispatch.service';
import { BadRequestError } from '../middleware/error.middleware';
import { loggerService } from './logging/logger.service';

const organizationSelect = {
  id: true,
  name: true,
  bio: true,
  external_link: true,
  status: true,
  approved_by: true,
  approved_at: true,
  timezone: true,
  created_at: true,
  updated_at: true
} satisfies Prisma.organizationSelect;

const memberSelect = {
  id: true,
  user_id: true,
  role: true,
  created_at: true,
  user: { select: { nickname: true, contacts: { select: { email: true } } } }
} satisfies Prisma.organization_membersSelect;

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type AuditInput = {
  actorId: number;
  actionType: string;
  targetResource: string;
  targetId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
};

const writeAudit = async (tx: TransactionClient, input: AuditInput): Promise<void> => {
  await tx.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
    VALUES (${input.actorId}, ${input.actionType}, ${input.targetResource}, ${input.targetId},
            ${input.oldValue ? JSON.stringify(input.oldValue) : null}::jsonb,
            ${input.newValue ? JSON.stringify(input.newValue) : null}::jsonb)
  `;
};

const asOrganizationStatus = (status: string): OrganizationResponse['status'] => {
  if (status === 'active' || status === 'suspended') return status;
  throw new Error(`Invalid organization status: ${status}`);
};

const asOrganizationRole = (role: string): OrganizationMemberResponse['role'] => {
  if (role === 'owner') return role;
  throw new Error(`Invalid organization member role: ${role}`);
};

const toOrganization = (organization: {
  id: number;
  name: string;
  bio: string | null;
  external_link: string | null;
  status: string;
  approved_by: number | null;
  approved_at: Date | null;
  timezone?: string;
  created_at: Date;
  updated_at?: Date | null;
}): OrganizationResponse => ({
  id: organization.id,
  name: organization.name,
  bio: organization.bio,
  externalLink: organization.external_link,
  status: asOrganizationStatus(organization.status),
  approvedBy: organization.approved_by,
  approvedAt: organization.approved_at,
  timezone: organization.timezone ?? 'Asia/Taipei',
  createdAt: organization.created_at,
  updatedAt: organization.updated_at ?? null
});

type MemberRow = {
  id: number;
  user_id: number;
  role: string;
  created_at: Date;
  user: { nickname: string | null; contacts: { email: string | null } | null };
};

const toMember = (member: MemberRow): OrganizationMemberResponse => ({
  id: member.id,
  userId: member.user_id,
  nickname: member.user.nickname,
  role: asOrganizationRole(member.role),
  createdAt: member.created_at
});

/** email 只給 requireAdmin 的後台端點，組織自己的成員清單不得外流 */
const toAdminMember = (member: MemberRow): AdminOrganizationMemberResponse => ({
  ...toMember(member),
  email: member.user.contacts?.email ?? null
});

const assertOrganizationMember = async (
  organizationId: number,
  userId: number,
  options: { requireActive?: boolean } = {}
): Promise<void> => {
  const membership = await prisma.organization_members.findUnique({
    where: {
      organization_id_user_id: {
        organization_id: organizationId,
        user_id: userId
      }
    },
    select: { organization: { select: { status: true } } }
  });

  if (!membership) {
    throw new ForbiddenError('無權限存取此組織');
  }

  if (options.requireActive && membership.organization.status !== 'active') {
    throw new ForbiddenError('此組織目前已停權');
  }
};

const isPrismaCode = (error: unknown, code: string): boolean => (
  typeof error === 'object' && error !== null && 'code' in error && error.code === code
);

const listForUser = async (userId: number): Promise<OrganizationResponse[]> => {
  const rows = await prisma.organization.findMany({
    where: { organization_members: { some: { user_id: userId } } },
    select: organizationSelect,
    orderBy: { created_at: 'asc' }
  });
  return rows.map(toOrganization);
};

const listAll = async (): Promise<OrganizationResponse[]> => {
  const rows = await prisma.organization.findMany({
    select: organizationSelect,
    orderBy: { created_at: 'desc' }
  });
  return rows.map(toOrganization);
};

const getForUser = async (organizationId: number, userId: number): Promise<OrganizationResponse> => {
  await assertOrganizationMember(organizationId, userId);
  const row = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationSelect
  });
  if (!row) throw new NotFoundError('找不到組織');
  return toOrganization(row);
};

const sendOwnerEmail = async (organizationName: string, userId: number) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { contacts: { select: { email: true } } } });
    const email = user?.contacts?.email;
    if (!email) return;
    const base = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
    const { subject, html } = generateOrganizationOwnerEmail({ organizationName, dashboardUrl: `${base}/lighthouse` });
    await enqueueEmail({ to: email, subject, html, emailType: 'organization_owner_invitation', userId, priority: 'P2' });
  } catch (err) {
    loggerService.warn('Failed to send owner invitation email', { userId, error: err });
  }
};

const create = async (input: CreateOrganizationInput, adminId: number): Promise<OrganizationResponse> => {
  if (input.ownerEmail !== undefined) {
    const organization = await organizationInvitationService.createOrganization({ ...input, ownerEmail: input.ownerEmail }, adminId);
    void recoverOrganizationInvitationEmails().catch(() => undefined);
    return toOrganization(organization);
  }
  const ownerUserId = input.ownerUserId;
  if (ownerUserId === undefined) throw new BadRequestError('必須指定首位 owner');
  const result = await prisma.$transaction(async tx => {
    const owner = await tx.users.findUnique({
      where: { id: ownerUserId },
      select: { id: true }
    });
    if (!owner) throw new NotFoundError('找不到首位組織成員');

    const row = await tx.organization.create({
      data: {
        name: input.name,
        bio: input.bio ?? null,
        external_link: input.externalLink ?? null,
        status: 'active',
        approved_by: adminId,
        approved_at: new Date(),
        organization_members: {
          create: { user_id: ownerUserId, role: 'owner' }
        }
      },
      select: organizationSelect
    });

    await writeAudit(tx, {
      actorId: adminId,
      actionType: LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_CREATED,
      targetResource: 'organization',
      targetId: String(row.id),
      newValue: { status: 'active', ownerUserId: ownerUserId, affectedCount: 1 }
    });
    return { org: toOrganization(row), orgName: row.name, ownerId: ownerUserId };
  });
  await sendOwnerEmail(result.orgName, result.ownerId);
  return result.org;
};

const update = async (
  organizationId: number,
  actorId: number,
  input: UpdateOrganizationInput
): Promise<OrganizationResponse> => {
  await assertOrganizationMember(organizationId, actorId, { requireActive: true });

  return prisma.$transaction(async tx => {
    const before = await tx.organization.findUnique({
      where: { id: organizationId },
      select: organizationSelect
    });
    if (!before) throw new NotFoundError('找不到組織');

    const row = await tx.organization.update({
      where: { id: organizationId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.externalLink !== undefined && { external_link: input.externalLink }),
        updated_at: new Date()
      },
      select: organizationSelect
    });
    await writeAudit(tx, {
      actorId,
      actionType: 'lighthouse.organization_updated',
      targetResource: 'organization',
      targetId: String(organizationId),
      oldValue: { name: before.name, bio: before.bio, externalLink: before.external_link },
      newValue: { name: row.name, bio: row.bio, externalLink: row.external_link }
    });
    return toOrganization(row);
  });
};

/** Reject deletion explicitly: fixture data is protected and general deletion is unsupported. */
const rejectDeletion = (organizationId: number): never => {
  if (isAcceptanceFixtureOrganization(organizationId)) {
    throw new ForbiddenError('此組織是驗收 fixture，不可刪除；需要調整請改用 daodao-storage 的 fixture reset 腳本');
  }
  throw new NotFoundError('不支援刪除組織');
};

const adminUpdate = async (
  organizationId: number,
  adminId: number,
  input: AdminUpdateOrganizationInput
): Promise<OrganizationResponse> => prisma.$transaction(async tx => {
  const before = await tx.organization.findUnique({ where: { id: organizationId }, select: organizationSelect });
  if (!before) throw new NotFoundError('找不到組織');
  if (input.status === 'suspended' && isAcceptanceFixtureOrganization(organizationId)) {
    throw new ForbiddenError('此組織是驗收 fixture，不可停權；需要調整請改用 daodao-storage 的 fixture reset 腳本');
  }
  const row = await tx.organization.update({
    where: { id: organizationId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.externalLink !== undefined && { external_link: input.externalLink }),
      ...(input.status !== undefined && { status: input.status })
    },
    select: organizationSelect
  });
  await writeAudit(tx, {
    actorId: adminId,
    actionType: input.status && input.status !== before.status
      ? LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_STATUS_CHANGED
      : 'lighthouse.organization_updated',
    targetResource: 'organization',
    targetId: String(organizationId),
    oldValue: { name: before.name, bio: before.bio, externalLink: before.external_link, status: before.status },
    newValue: { name: row.name, bio: row.bio, externalLink: row.external_link, status: row.status }
  });
  return toOrganization(row);
});

const findMemberRows = async (organizationId: number): Promise<MemberRow[]> => prisma.organization_members.findMany({
  where: { organization_id: organizationId },
  select: memberSelect,
  orderBy: { created_at: 'asc' }
});

const listMembers = async (organizationId: number, actorId: number): Promise<OrganizationMemberResponse[]> => {
  await assertOrganizationMember(organizationId, actorId);
  return (await findMemberRows(organizationId)).map(toMember);
};

const adminListMembers = async (organizationId: number): Promise<AdminOrganizationMemberResponse[]> =>
  (await findMemberRows(organizationId)).map(toAdminMember);

const addMember = async (
  organizationId: number,
  actorId: number,
  input: AddOrganizationMemberInput,
  skipMembership = false
): Promise<OrganizationMemberResponse> => {
  if (!skipMembership) await assertOrganizationMember(organizationId, actorId, { requireActive: true });
  let result: { member: OrganizationMemberResponse; orgName: string; userId: number };
  try {
    result = await prisma.$transaction(async tx => {
      const user = await tx.users.findUnique({ where: { id: input.userId }, select: { id: true } });
      if (!user) throw new NotFoundError('找不到欲新增的使用者');

      const row = await tx.organization_members.create({
        data: { organization_id: organizationId, user_id: input.userId, role: input.role },
        select: memberSelect
      });
      await writeAudit(tx, {
        actorId,
        actionType: LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_MEMBER_ADDED,
        targetResource: 'organization_member',
        targetId: String(row.id),
        newValue: { organizationId, userId: input.userId, role: input.role, affectedCount: 1 }
      });
      const org = await tx.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
      return { member: toMember(row), orgName: org?.name ?? '', userId: input.userId };
    });
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      throw new ConflictError('此使用者已是組織成員');
    }
    throw error;
  }
  await sendOwnerEmail(result.orgName, result.userId);
  return result.member;
};

const removeMember = async (organizationId: number, actorId: number, userId: number, skipMembership = false): Promise<void> => {
  if (!skipMembership) await assertOrganizationMember(organizationId, actorId, { requireActive: true });
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM organization WHERE id = ${organizationId} FOR UPDATE`;
    const member = await tx.organization_members.findUnique({
      where: { organization_id_user_id: { organization_id: organizationId, user_id: userId } },
      select: { id: true, role: true }
    });
    if (!member) throw new NotFoundError('找不到組織成員');

    if (member.role === 'owner') {
      const ownerCount = await tx.organization_members.count({
        where: { organization_id: organizationId, role: 'owner' }
      });
      if (ownerCount <= 1) throw new ConflictError('不可移除組織最後一位 owner');
    }

    await tx.organization_members.delete({ where: { id: member.id } });
    await writeAudit(tx, {
      actorId,
      actionType: LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_MEMBER_REMOVED,
      targetResource: 'organization_member',
      targetId: String(member.id),
      oldValue: { organizationId, userId, role: member.role },
      newValue: { affectedCount: 1 }
    });
  });
};

export const organizationService = {
  listForUser,
  listAll,
  getForUser,
  create,
  update,
  adminUpdate,
  rejectDeletion,
  listMembers,
  adminListMembers,
  addMember,
  removeMember
};
