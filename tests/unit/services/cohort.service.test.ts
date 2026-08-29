import { mockPrismaError, prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortService } from '@/services/cohort.service';
import { ConflictError, ForbiddenError } from '@/middleware/error.middleware';

const now = new Date('2026-07-22T00:00:00.000Z');
const row = { id: 8, program_id: 2, slug: 'summer', display_name: '夏季期', start_date: now, end_date: new Date('2026-08-22T00:00:00.000Z'), join_token: '123e4567-e89b-12d3-a456-426614174000', join_paused: false, join_deadline: null, capacity: null, invite_message: null, status: 'draft', created_at: now, updated_at: null };

describe('cohortService', () => {
  beforeEach(() => setupTransactionMock());
  it('creates a draft cohort under an owned active program', async () => {
    prismaMock.programs.findFirst.mockResolvedValue({ organization: { status: 'active' } } as never);
    prismaMock.cohorts.create.mockResolvedValue(row as never);
    const result = await cohortService.create(2, { slug: 'summer', displayName: '夏季期', startDate: '2026-07-22', endDate: '2026-08-22', status: 'draft' }, 42);
    expect(result.status).toBe('draft');
    expect(prismaMock.cohorts.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ program_id: 2, status: 'draft' }) }));
  });

  it('maps duplicate slugs to 409', async () => {
    prismaMock.programs.findFirst.mockResolvedValue({ organization: { status: 'active' } } as never);
    prismaMock.cohorts.create.mockRejectedValue(mockPrismaError('P2002'));
    await expect(cohortService.create(2, { slug: 'summer', displayName: '夏季期', startDate: '2026-07-22', endDate: '2026-08-22', status: 'draft' }, 42)).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a cohort id that is not under the scoped program/member chain', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(cohortService.get(2, 999, 42)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('archives by setting the only allowed archived status', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...row, program: { organization: { status: 'active' } } } as never);
    prismaMock.cohorts.update.mockResolvedValue({ ...row, status: 'archived' } as never);
    await cohortService.archive(2, 8, 42);
    expect(prismaMock.cohorts.update).toHaveBeenCalledWith({ where: { id: 8 }, data: { status: 'archived', updated_at: expect.any(Date) } });
  });

  it('rotates, pauses and resumes join links with audit records', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...row, program: { organization: { status: 'active' } } } as never);
    prismaMock.cohorts.update.mockResolvedValue(row as never);
    const rotated = await cohortService.setJoinToken(2, 8, 42, 'rotate');
    expect(rotated.joinToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(rotated.joinToken).not.toBe(row.join_token);
    expect(prismaMock.cohorts.update).toHaveBeenLastCalledWith({ where: { id: 8 }, data: { join_token: rotated.joinToken, join_paused: false, updated_at: expect.any(Date) } });
    const paused = await cohortService.setJoinToken(2, 8, 42, 'pause');
    expect(paused).toEqual({ cohortId: 8, joinToken: row.join_token, joinPaused: true });
    expect(prismaMock.cohorts.update).toHaveBeenLastCalledWith({ where: { id: 8 }, data: { join_token: row.join_token, join_paused: true, updated_at: expect.any(Date) } });
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...row, join_paused: true, program: { organization: { status: 'active' } } } as never);
    const resumed = await cohortService.setJoinToken(2, 8, 42, 'resume');
    expect(resumed).toEqual({ cohortId: 8, joinToken: row.join_token, joinPaused: false });
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(3);
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      42,
      'lighthouse.cohort_join_token_rotated',
      'lighthouse.cohort_join_paused',
      'lighthouse.cohort_join_resumed',
      '8',
      JSON.stringify({ joinToken: rotated.joinToken, joinPaused: false, affectedCount: 1 })
    ]));
    expect(String(prismaMock.$executeRaw.mock.calls[0][0])).toContain("'cohort'");
  });

  it('re-issues a token when resuming a legacy cohort whose token was nulled by the old pause', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...row, join_token: null, join_paused: true, program: { organization: { status: 'active' } } } as never);
    prismaMock.cohorts.update.mockResolvedValue(row as never);
    const resumed = await cohortService.setJoinToken(2, 8, 42, 'resume');
    expect(resumed.joinToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(resumed.joinPaused).toBe(false);
  });

  it('duplicates a cohort as a draft with a -copy slug and carries active template bindings', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...row, status: 'published', program: { organization: { status: 'active' } } } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([{ template_id: 5, start_date: null }] as never);
    prismaMock.cohorts.create.mockResolvedValue({ ...row, id: 9, slug: 'summer-copy', display_name: '夏季期（副本）', status: 'draft' } as never);
    prismaMock.cohort_templates.createMany.mockResolvedValue({ count: 1 } as never);
    const copy = await cohortService.duplicate(2, 8, 42);
    expect(copy).toEqual(expect.objectContaining({ id: 9, slug: 'summer-copy', status: 'draft' }));
    expect(prismaMock.cohorts.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ program_id: 2, slug: 'summer-copy', display_name: '夏季期（副本）', status: 'draft', capacity: null }) }));
    expect(prismaMock.cohort_templates.createMany).toHaveBeenCalledWith({ data: [{ cohort_id: 9, template_id: 5, start_date: null }] });
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining(['lighthouse.cohort_duplicated', '9', JSON.stringify({ sourceCohortId: 8 })]));
  });

  it('retries the copy slug on a unique conflict', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...row, program: { organization: { status: 'active' } } } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([] as never);
    prismaMock.cohorts.create.mockRejectedValueOnce(mockPrismaError('P2002')).mockResolvedValue({ ...row, id: 10, slug: 'summer-copy-2', status: 'draft' } as never);
    const copy = await cohortService.duplicate(2, 8, 42);
    expect(copy.slug).toBe('summer-copy-2');
    expect(prismaMock.cohorts.create).toHaveBeenCalledTimes(2);
  });

  it('lists every cohort under an organization with program names and joined counts', async () => {
    prismaMock.organization.findFirst.mockResolvedValue({ status: 'active' } as never);
    prismaMock.cohorts.findMany.mockResolvedValue([{ ...row, program: { name: '自主學習' } }, { ...row, id: 9, slug: 'autumn', status: 'archived', program: { name: '自主學習' } }] as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([{ cohort_id: 8, _count: { id: 3 } }] as never);
    const cohorts = await cohortService.listByOrganization(1, 42);
    expect(cohorts).toEqual([
      expect.objectContaining({ id: 8, programName: '自主學習', joinedCount: 3 }),
      expect.objectContaining({ id: 9, status: 'archived', joinedCount: 0 })
    ]);
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { program: { organization_id: 1, deleted_at: null } } }));
  });

  it('rejects listing cohorts of an organization the actor does not belong to', async () => {
    prismaMock.organization.findFirst.mockResolvedValue(null);
    await expect(cohortService.listByOrganization(1, 42)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
