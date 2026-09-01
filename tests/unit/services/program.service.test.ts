import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { programService } from '@/services/program.service';
import { ConflictError, ForbiddenError } from '@/middleware/error.middleware';

describe('programService', () => {
  it('creates a program only under an active organization membership', async () => {
    prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
    prismaMock.programs.create.mockResolvedValue({ id: 2, organization_id: 3, name: '系列', description: null, deleted_at: null, created_at: new Date('2026-07-21'), updated_at: null } as never);
    const result = await programService.create({ organizationId: 3, name: '系列', description: null }, 42);
    expect(result.organizationId).toBe(3);
    expect(prismaMock.programs.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organization_id: 3 }) }));
  });

  it('rejects cross-organization update attempts', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(null);
    await expect(programService.update(9, { name: '越權' }, 42)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.programs.update).not.toHaveBeenCalled();
  });

  it('blocks archival while the program still has cohorts', async () => {
    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, organization: { status: 'active' } } as never);
    prismaMock.cohorts.count.mockResolvedValue(1);
    await expect(programService.archive(2, 42)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.programs.update).not.toHaveBeenCalled();
  });
});

