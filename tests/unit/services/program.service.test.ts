import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { programService } from '@/services/program.service';
import { ForbiddenError } from '@/middleware/error.middleware';

describe('programService', () => {
  it('creates a program only under an active organization membership', async () => {
    prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
    prismaMock.programs.create.mockResolvedValue({ id: 2, organization_id: 3, name: '系列', description: null, deleted_at: null, created_at: new Date('2026-07-21'), updated_at: null } as never);
    const result = await programService.create({ organizationId: 3, name: '系列', description: null }, 42);
    expect(result.organizationId).toBe(3);
    expect(prismaMock.programs.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organization_id: 3 }) }));
  });

  it('lists only lighthouse programs（challenge 主題由 admin 後台管理，不混入燈塔介面）', async () => {
    prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
    prismaMock.programs.findMany.mockResolvedValue([] as never);
    await programService.list(3, 42);
    expect(prismaMock.programs.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organization_id: 3, kind: 'lighthouse' }) }));
  });

  it('rejects cross-organization update attempts', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(null);
    await expect(programService.update(9, { name: '越權' }, 42)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.programs.update).not.toHaveBeenCalled();
  });

  it('rejects archival outside the owned program before changing cohorts', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(null);
    await expect(programService.archive(2, 42)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.cohorts.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.programs.update).not.toHaveBeenCalled();
  });

  it('archives the program and its unarchived cohorts in one transaction', async () => {
    setupTransactionMock();
    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, organization: { status: 'active' } } as never);
    prismaMock.cohorts.updateMany.mockResolvedValue({ count: 1 });
    await expect(programService.archive(2, 42)).resolves.toEqual({ programId: 2, archivedCohortCount: 1 });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.cohorts.updateMany).toHaveBeenCalledWith({
      where: { program_id: 2, status: { not: 'archived' } },
      data: { status: 'archived', updated_at: expect.any(Date) }
    });
    expect(prismaMock.programs.update).toHaveBeenCalledWith({
      where: { id: 2 }, data: { deleted_at: expect.any(Date), updated_at: expect.any(Date) }
    });
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      42, '2', JSON.stringify({ archivedCohortCount: 1 })
    ]));
  });
});
