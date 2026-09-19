import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
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

  it('rejects archival outside the owned program before opening a transaction', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(null);

    await expect(programService.archive(2, 42)).rejects.toBeInstanceOf(ForbiddenError);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    expect(prismaMock.programs.updateMany).not.toHaveBeenCalled();
  });

  it('archives with archived_at and cascades the cohorts, remembering their previous status', async () => {
    setupTransactionMock();
    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, archived_at: null, organization: { status: 'active' } } as never);
    prismaMock.$executeRaw.mockResolvedValueOnce(3 as never).mockResolvedValueOnce(1 as never);
    prismaMock.programs.updateMany.mockResolvedValue({ count: 1 });
    const result = await programService.archive(2, 42);
    expect(result).toEqual({ programId: 2, archivedCohortCount: 3 });
    expect(prismaMock.programs.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 2, archived_at: null, deleted_at: null }, data: expect.objectContaining({ archived_at: expect.any(Date), archived_by: 42 }) }));
  });

  it('returns 409 and writes no audit when a concurrent archive already won the race', async () => {
    setupTransactionMock();
    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, archived_at: null, organization: { status: 'active' } } as never);
    prismaMock.$executeRaw.mockResolvedValue(3 as never);
    prismaMock.programs.updateMany.mockResolvedValue({ count: 0 });
    await expect(programService.archive(2, 42)).rejects.toBeInstanceOf(ConflictError);
    // 只跑了級聯 UPDATE（交易回滾），沒有 audit INSERT
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    expect(String(prismaMock.$executeRaw.mock.calls[0][0])).not.toContain('audit_logs');
  });

  it('rejects archiving a program that is already in the archive', async () => {
    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, archived_at: new Date(), organization: { status: 'active' } } as never);
    await expect(programService.archive(2, 42)).rejects.toBeInstanceOf(ConflictError);
    await expect(programService.update(2, { name: '改名' }, 42)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.programs.update).not.toHaveBeenCalled();
    expect(prismaMock.programs.updateMany).not.toHaveBeenCalled();
  });

  it('hides archived programs from the main list', async () => {
    prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
    prismaMock.programs.findMany.mockResolvedValue([] as never);
    await programService.list(3, 42);
    expect(prismaMock.programs.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ archived_at: null, deleted_at: null }) }));
  });
});
