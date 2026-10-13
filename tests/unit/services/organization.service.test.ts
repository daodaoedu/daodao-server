import { prismaMock, setupTransactionMock, mockPrismaError } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { organizationService } from '@/services/organization.service';
import { ConflictError, ForbiddenError } from '@/middleware/error.middleware';

const now = new Date('2026-07-21T00:00:00.000Z');
const organizationRow = {
  id: 3,
  name: '島島學習社群',
  bio: '持續行動',
  external_link: 'https://example.com',
  status: 'active',
  approved_by: 1,
  approved_at: now,
  created_at: now
};

const allowMembership = (): void => {
  prismaMock.organization_members.findUnique.mockResolvedValue({
    organization: { status: 'active' }
  } as never);
};

describe('organizationService', () => {
  beforeEach(() => {
    setupTransactionMock();
  });

  it('creates the organization, first owner, approval metadata, and audit in one transaction', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ id: 42 } as never);
    prismaMock.organization.create.mockResolvedValue(organizationRow as never);

    const result = await organizationService.create({
      name: '島島學習社群',
      bio: '持續行動',
      externalLink: 'https://example.com',
      ownerUserId: 42
    }, 1);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.organization.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'active',
        approved_by: 1,
        organization_members: { create: { user_id: 42, role: 'owner' } }
      })
    }));
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      1,
      'lighthouse.organization_created',
      'organization',
      '3',
      JSON.stringify({ status: 'active', ownerUserId: 42, affectedCount: 1 })
    ]));
    expect(result).toEqual(expect.objectContaining({ id: 3, externalLink: 'https://example.com' }));
  });

  it('lets an admin list every organization without organization membership', async () => {
    prismaMock.organization.findMany.mockResolvedValue([organizationRow] as never);
    await expect(organizationService.listAll()).resolves.toEqual([expect.objectContaining({ id: 3, status: 'active' })]);
    expect(prismaMock.organization_members.findUnique).not.toHaveBeenCalled();
  });

  it('lets an admin suspend an organization and records the status audit', async () => {
    prismaMock.organization.findUnique.mockResolvedValue(organizationRow as never);
    prismaMock.organization.update.mockResolvedValue({ ...organizationRow, status: 'suspended' } as never);
    const result = await organizationService.adminUpdate(3, 1, { status: 'suspended' });
    expect(result.status).toBe('suspended');
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      1,
      'lighthouse.organization_status_changed',
      'organization',
      '3'
    ]));
    expect(prismaMock.organization_members.findUnique).not.toHaveBeenCalled();
  });

  it('refuses to suspend the acceptance fixture organization without writing (daodao#323)', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ ...organizationRow, id: 900001 } as never);

    const attempt = organizationService.adminUpdate(900001, 1, { status: 'suspended' });

    await expect(attempt).rejects.toBeInstanceOf(ForbiddenError);
    await expect(attempt).rejects.toThrow('驗收 fixture');
    expect(prismaMock.organization.update).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it('still lets an admin edit the fixture organization profile or keep it active', async () => {
    const fixtureRow = { ...organizationRow, id: 900001 };
    prismaMock.organization.findUnique.mockResolvedValue(fixtureRow as never);
    prismaMock.organization.update.mockResolvedValue(fixtureRow as never);

    await expect(organizationService.adminUpdate(900001, 1, { bio: '驗收說明', status: 'active' }))
      .resolves.toMatchObject({ id: 900001, status: 'active' });
  });

  it('rejects cross-organization profile updates before writing', async () => {
    prismaMock.organization_members.findUnique.mockResolvedValue(null);

    await expect(organizationService.update(99, 42, { name: '越權更新' }))
      .rejects.toBeInstanceOf(ForbiddenError);

    expect(prismaMock.organization.update).not.toHaveBeenCalled();
  });

  it('maps a duplicate organization member constraint to 409 Conflict', async () => {
    allowMembership();
    prismaMock.users.findUnique.mockResolvedValue({ id: 77 } as never);
    prismaMock.organization_members.create.mockRejectedValue(mockPrismaError('P2002'));

    await expect(organizationService.addMember(3, 42, { userId: 77, role: 'owner' }))
      .rejects.toBeInstanceOf(ConflictError);
  });

  it('audits a successful member addition with actor, target, and affected count', async () => {
    allowMembership();
    prismaMock.users.findUnique.mockResolvedValue({ id: 77 } as never);
    prismaMock.organization_members.create.mockResolvedValue({
      id: 8, user_id: 77, role: 'owner', created_at: now, user: { nickname: '小島' }
    } as never);

    await organizationService.addMember(3, 42, { userId: 77, role: 'owner' });
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      42,
      'lighthouse.organization_member_added',
      'organization_member',
      '8',
      JSON.stringify({ organizationId: 3, userId: 77, role: 'owner', affectedCount: 1 })
    ]));
  });

  it('audits a successful member removal with actor, target, and affected count', async () => {
    allowMembership();
    prismaMock.organization_members.findUnique
      .mockResolvedValueOnce({ organization: { status: 'active' } } as never)
      .mockResolvedValueOnce({ id: 8, role: 'owner' } as never);
    prismaMock.organization_members.count.mockResolvedValue(2);
    prismaMock.organization_members.delete.mockResolvedValue({ id: 8 } as never);

    await organizationService.removeMember(3, 42, 77);
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      42,
      'lighthouse.organization_member_removed',
      'organization_member',
      '8',
      JSON.stringify({ organizationId: 3, userId: 77, role: 'owner' }),
      JSON.stringify({ affectedCount: 1 })
    ]));
  });

  it('returns only the member response whitelist and never email', async () => {
    allowMembership();
    prismaMock.organization_members.findMany.mockResolvedValue([{
      id: 8,
      organization_id: 3,
      user_id: 77,
      role: 'owner',
      created_at: now,
      user: { nickname: '小島', contacts: { email: 'private@example.com' } }
    }] as never);

    const result = await organizationService.listMembers(3, 42);

    expect(result).toEqual([{
      id: 8,
      userId: 77,
      nickname: '小島',
      role: 'owner',
      createdAt: now
    }]);
    expect(JSON.stringify(result)).not.toContain('private@example.com');
  });

  it('exposes email only through the admin member listing', async () => {
    prismaMock.organization_members.findMany.mockResolvedValue([{
      id: 8,
      organization_id: 3,
      user_id: 77,
      role: 'owner',
      created_at: now,
      user: { nickname: '小島', contacts: { email: 'owner@example.com' } }
    }] as never);

    await expect(organizationService.adminListMembers(3)).resolves.toEqual([{
      id: 8,
      userId: 77,
      nickname: '小島',
      email: 'owner@example.com',
      role: 'owner',
      createdAt: now
    }]);
  });

  it('prevents removing the last owner', async () => {
    allowMembership();
    prismaMock.organization_members.findUnique
      .mockResolvedValueOnce({ organization: { status: 'active' } } as never)
      .mockResolvedValueOnce({ id: 8, role: 'owner' } as never);
    prismaMock.organization_members.count.mockResolvedValue(1);

    await expect(organizationService.removeMember(3, 42, 77))
      .rejects.toBeInstanceOf(ConflictError);

    expect(prismaMock.organization_members.delete).not.toHaveBeenCalled();
  });
});
