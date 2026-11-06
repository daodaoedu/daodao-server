import { prismaMock } from '../../../tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
import { lighthousePreferenceService } from '../lighthouse-preference.service';
import { ForbiddenError } from '../../middleware/error.middleware';

describe('lighthousePreferenceService', () => {
  it('reads only the authenticated account and validates its saved organization', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ last_lighthouse_organization_id: 9 } as never);
    prismaMock.organization.findFirst.mockResolvedValue({ id: 9 } as never);
    await expect(lighthousePreferenceService.get(42)).resolves.toEqual({ organizationId: 9 });
    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({ where: { id: 42 }, select: { last_lighthouse_organization_id: true } });
    expect(prismaMock.organization.findFirst).toHaveBeenCalledWith({ where: { id: 9, status: 'active', organization_members: { some: { user_id: 42 } } }, select: { id: true } });
  });

  it('returns no preference when none has been saved', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ last_lighthouse_organization_id: null } as never);
    await expect(lighthousePreferenceService.get(42)).resolves.toEqual({ organizationId: null });
    expect(prismaMock.organization.findFirst).not.toHaveBeenCalled();
  });

  it('does not restore a suspended or inaccessible saved organization', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ last_lighthouse_organization_id: 9 } as never);
    prismaMock.organization.findFirst.mockResolvedValue(null);
    await expect(lighthousePreferenceService.get(42)).resolves.toEqual({ organizationId: null });
  });

  it('saves the preference only when the same account is an active organization member', async () => {
    prismaMock.users.updateMany.mockResolvedValue({ count: 1 });
    await expect(lighthousePreferenceService.update(42, 9)).resolves.toEqual({ organizationId: 9 });
    expect(prismaMock.users.updateMany).toHaveBeenCalledWith({
      where: { id: 42, organization_members: { some: { organization_id: 9, organization: { status: 'active' } } } },
      data: { last_lighthouse_organization_id: 9 }
    });
  });

  it('rejects a cross-organization or suspended selection without an unscoped write', async () => {
    prismaMock.users.updateMany.mockResolvedValue({ count: 0 });
    await expect(lighthousePreferenceService.update(42, 99)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });
});
