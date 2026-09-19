import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { lighthouseArchiveService } from '@/services/lighthouse-archive.service';
import { ConflictError, NotFoundError } from '@/middleware/error.middleware';

const allow = () => prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
const archivedAt = new Date('2026-09-01T00:00:00.000Z');

describe('lighthouseArchiveService', () => {
  beforeEach(() => setupTransactionMock());

  it('lists archived cohorts with their program and flags cohorts whose program is still archived', async () => {
    allow();
    prismaMock.cohorts.findMany.mockResolvedValue([
      { id: 8, display_name: '夏季', archived_at: archivedAt, archived_from_status: 'published', archived_reason: 'program_cascade', updated_at: null, created_at: archivedAt, archiver: { id: 42, nickname: 'Peggy' }, program: { name: '自主學習', archived_at: archivedAt } },
      { id: 9, display_name: '秋季', archived_at: null, archived_from_status: null, archived_reason: 'manual', updated_at: new Date('2026-08-01'), created_at: archivedAt, archiver: null, program: { name: '自主學習', archived_at: null } }
    ] as never);
    const items = await lighthouseArchiveService.list(1, 42, 'cohorts');
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'archived', deleted_at: null }) }));
    expect(items[0]).toEqual(expect.objectContaining({ type: 'cohort', id: 8, name: '夏季', archivedBy: { id: 42, name: 'Peggy' }, parentName: '自主學習', parentArchived: true, archivedFromStatus: 'published' }));
    expect(items[1]).toEqual(expect.objectContaining({ id: 9, archivedAt: new Date('2026-08-01'), archivedBy: null, parentArchived: false }));
  });

  it('lists archived templates and programs from their archived_at columns', async () => {
    allow();
    prismaMock.practice_templates.findMany.mockResolvedValue([{ id: 5, title: '每日反思', archived_at: archivedAt, archiver: null }] as never);
    prismaMock.programs.findMany.mockResolvedValue([{ id: 2, name: '自主學習', archived_at: archivedAt, archiver: { id: 42, nickname: 'Peggy' } }] as never);
    expect(await lighthouseArchiveService.list(1, 42, 'templates')).toEqual([expect.objectContaining({ type: 'template', id: 5, name: '每日反思', archivedAt })]);
    expect(await lighthouseArchiveService.list(1, 42, 'programs')).toEqual([expect.objectContaining({ type: 'program', id: 2, name: '自主學習', archivedBy: { id: 42, name: 'Peggy' } })]);
    expect(prismaMock.practice_templates.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ archived_at: { not: null }, deleted_at: null }) }));
  });

  it('restores a cohort to the status it had before archiving', async () => {
    allow();
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, display_name: '夏季', status: 'archived', archived_at: archivedAt, archived_from_status: 'published', archived_reason: 'manual', program: { id: 2, archived_at: null } } as never);
    prismaMock.cohorts.updateMany.mockResolvedValue({ count: 1 });
    const result = await lighthouseArchiveService.restore(1, 42, 'cohorts', 8);
    expect(result).toEqual({ type: 'cohort', id: 8, name: '夏季', restoredCohortCount: 0 });
    expect(prismaMock.cohorts.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 8, status: 'archived', deleted_at: null }, data: expect.objectContaining({ status: 'published', archived_at: null, archived_from_status: null }) }));
  });

  it('blocks restoring a cohort while its program is still archived', async () => {
    allow();
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, display_name: '夏季', status: 'archived', archived_at: archivedAt, archived_from_status: null, archived_reason: 'program_cascade', program: { id: 2, archived_at: archivedAt } } as never);
    await expect(lighthouseArchiveService.restore(1, 42, 'cohorts', 8)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.cohorts.updateMany).not.toHaveBeenCalled();
  });

  it('restores a program together with the cohorts that were archived by the cascade', async () => {
    allow();
    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, name: '自主學習', archived_at: archivedAt } as never);
    prismaMock.programs.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$executeRaw.mockResolvedValueOnce(2 as never).mockResolvedValueOnce(1 as never);
    const result = await lighthouseArchiveService.restore(1, 42, 'programs', 2);
    expect(result).toEqual({ type: 'program', id: 2, name: '自主學習', restoredCohortCount: 2 });
    expect(prismaMock.programs.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 2, archived_at: { not: null }, deleted_at: null }, data: expect.objectContaining({ archived_at: null, archived_by: null }) }));
  });

  it('returns 409 and writes no audit when a concurrent restore already won the race', async () => {
    allow();
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, display_name: '夏季', status: 'archived', archived_at: archivedAt, archived_from_status: 'published', archived_reason: 'manual', program: { id: 2, archived_at: null } } as never);
    prismaMock.cohorts.updateMany.mockResolvedValue({ count: 0 });
    await expect(lighthouseArchiveService.restore(1, 42, 'cohorts', 8)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();

    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, name: '自主學習', archived_at: archivedAt } as never);
    prismaMock.programs.updateMany.mockResolvedValue({ count: 0 });
    await expect(lighthouseArchiveService.restore(1, 42, 'programs', 2)).rejects.toBeInstanceOf(ConflictError);
    // 條件式更新失敗就不該跑級聯復活與 audit
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it('returns 409 and writes no audit when a concurrent delete already won the race', async () => {
    allow();
    prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5, archived_at: archivedAt } as never);
    prismaMock.practice_templates.updateMany.mockResolvedValue({ count: 0 });
    await expect(lighthouseArchiveService.remove(1, 42, 'templates', 5)).rejects.toBeInstanceOf(ConflictError);

    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, display_name: '夏季', status: 'archived', archived_at: archivedAt, archived_from_status: 'published', archived_reason: 'manual', program: { id: 2, archived_at: null } } as never);
    prismaMock.cohorts.updateMany.mockResolvedValue({ count: 0 });
    await expect(lighthouseArchiveService.remove(1, 42, 'cohorts', 8)).rejects.toBeInstanceOf(ConflictError);

    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, name: '自主學習', archived_at: archivedAt } as never);
    prismaMock.programs.updateMany.mockResolvedValue({ count: 0 });
    await expect(lighthouseArchiveService.remove(1, 42, 'programs', 2)).rejects.toBeInstanceOf(ConflictError);

    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it('refuses to delete items that are not in the archive and 404s on unknown ids', async () => {
    allow();
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, display_name: '夏季', status: 'published', archived_at: null, program: { id: 2, archived_at: null } } as never);
    await expect(lighthouseArchiveService.remove(1, 42, 'cohorts', 8)).rejects.toBeInstanceOf(ConflictError);
    prismaMock.programs.findFirst.mockResolvedValue(null);
    await expect(lighthouseArchiveService.remove(1, 42, 'programs', 99)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('soft-deletes an archived program together with all of its cohorts', async () => {
    allow();
    prismaMock.programs.findFirst.mockResolvedValue({ id: 2, name: '自主學習', archived_at: archivedAt } as never);
    prismaMock.cohorts.updateMany.mockResolvedValue({ count: 3 });
    prismaMock.programs.updateMany.mockResolvedValue({ count: 1 });
    await lighthouseArchiveService.remove(1, 42, 'programs', 2);
    expect(prismaMock.cohorts.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { program_id: 2, deleted_at: null }, data: expect.objectContaining({ deleted_at: expect.any(Date) }) }));
    expect(prismaMock.programs.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 2, archived_at: { not: null }, deleted_at: null }, data: expect.objectContaining({ deleted_at: expect.any(Date) }) }));
    expect(prismaMock.programs.delete).not.toHaveBeenCalled();
  });
});
