import { Prisma } from '../../generated/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import type {
  AddOrganizationMemberInput,
  AdminUpdateOrganizationInput,
  CreateOrganizationInput,
  OrganizationMemberResponse,
  OrganizationResponse,
  UpdateOrganizationInput
} from '../validators/organization.validators';
import { prisma } from './database/prisma.service';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';

const organizationSelect = {
  id: true,
  name: true,
  bio: true,
  external_link: true,
  status: true,
  approved_by: true,
  approved_at: true,
  created_at: true
} satisfies Prisma.organizationSelect;

const memberSelect = {
  id: true,
  user_id: true,
  role: true,
  created_at: true,
  user: { select: { nickname: true } }
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
  created_at: Date;
}): OrganizationResponse => ({
  id: organization.id,
  name: organization.name,
  bio: organization.bio,
  externalLink: organization.external_link,
  status: asOrganizationStatus(organization.status),
  approvedBy: organization.approved_by,
  approvedAt: organization.approved_at,
  createdAt: organization.created_at
});

const toMember = (member: {
  id: number;
  user_id: number;
  role: string;
  created_at: Date;
  user: { nickname: string | null };
}): OrganizationMemberResponse => ({
  id: member.id,
  userId: member.user_id,
  nickname: member.user.nickname,
  role: asOrganizationRole(member.role),
  createdAt: member.created_at
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

const create = async (input: CreateOrganizationInput, adminId: number): Promise<OrganizationResponse> => {
  return prisma.$transaction(async tx => {
    const owner = await tx.users.findUnique({
      where: { id: input.ownerUserId },
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
          create: { user_id: input.ownerUserId, role: 'owner' }
        }
      },
      select: organizationSelect
    });

    await writeAudit(tx, {
      actorId: adminId,
      actionType: LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_CREATED,
      targetResource: 'organization',
      targetId: String(row.id),
      newValue: { status: 'active', ownerUserId: input.ownerUserId, affectedCount: 1 }
    });
    return toOrganization(row);
  });
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
        ...(input.externalLink !== undefined && { external_link: input.externalLink })
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

const adminUpdate = async (
  organizationId: number,
  adminId: number,
  input: AdminUpdateOrganizationInput
): Promise<OrganizationResponse> => prisma.$transaction(async tx => {
  const before = await tx.organization.findUnique({ where: { id: organizationId }, select: organizationSelect });
  if (!before) throw new NotFoundError('找不到組織');
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

const listMembers = async (organizationId: number, actorId: number, skipMembership = false): Promise<OrganizationMemberResponse[]> => {
  if (!skipMembership) await assertOrganizationMember(organizationId, actorId);
  const rows = await prisma.organization_members.findMany({
    where: { organization_id: organizationId },
    select: memberSelect,
    orderBy: { created_at: 'asc' }
  });
  return rows.map(toMember);
};

const addMember = async (
  organizationId: number,
  actorId: number,
  input: AddOrganizationMemberInput,
  skipMembership = false
): Promise<OrganizationMemberResponse> => {
  if (!skipMembership) await assertOrganizationMember(organizationId, actorId, { requireActive: true });
  try {
    return await prisma.$transaction(async tx => {
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
      return toMember(row);
    });
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      throw new ConflictError('此使用者已是組織成員');
    }
    throw error;
  }
};

const removeMember = async (organizationId: number, actorId: number, userId: number, skipMembership = false): Promise<void> => {
  if (!skipMembership) await assertOrganizationMember(organizationId, actorId, { requireActive: true });
  await prisma.$transaction(async tx => {
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
  listMembers,
  addMember,
  removeMember
};
