import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const createEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: { createEvent: (...args: unknown[]): unknown => createEvent(...args) }
}));
import { cohortJoinService } from '@/services/cohort-join.service';
import { ConflictError } from '@/middleware/error.middleware';

const token = '123e4567-e89b-12d3-a456-426614174000';
const cohort = { id: 8, display_name: '夏季期', start_date: new Date('2026-07-01'), end_date: new Date('2026-08-31'), join_deadline: null, capacity: 2, invite_message: '一起行動', status: 'published', program: { organization: { name: '島島', bio: '社群', external_link: 'https://example.com' } } };

describe('cohortJoinService', () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.cohort_templates.findMany.mockResolvedValue([]);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([]);
  });

  it('uses end_date as the default join deadline and returns the visibility notice', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(0);
    const info = await cohortJoinService.getJoinInfo(token, new Date('2026-08-30T12:00:00Z'));
    expect(info.canJoin).toBe(true);
    expect(info.visibilityNotice).toContain('教練與同期學員可見');
    expect(info.organization.name).toBe('島島');
  });

  it('rejects joining after the deadline', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(0);
    await expect(cohortJoinService.join(token, 42, true, new Date('2026-09-01T00:00:00Z'))).rejects.toBeInstanceOf(ConflictError);
  });

  it('locks capacity and creates a joined enrollment idempotently by cohort/email', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(0);
    prismaMock.users.findUnique.mockResolvedValue({ contacts: { email: 'User@Example.com' } } as never);
    prismaMock.$queryRaw.mockResolvedValue([{ id: 8, capacity: 2 }] as never);
    prismaMock.cohort_enrollments.upsert.mockResolvedValue({ id: 99, cohort_id: 8, status: 'joined' } as never);
    const result = await cohortJoinService.join(token, 42, true, new Date('2026-08-01T00:00:00Z'));
    expect(result).toEqual({ enrollmentId: 99, cohortId: 8, status: 'joined' });
    expect(prismaMock.cohort_enrollments.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { cohort_id_email: { cohort_id: 8, email: 'user@example.com' } },
      create: expect.objectContaining({ status: 'joined', role: 'member', user_id: 42 })
    }));
  });

  it('resolves an email invitation token and binds the exact invited enrollment to the signed-in account', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(null);
    prismaMock.cohort_enrollments.findUnique
      .mockResolvedValueOnce({ id: 99, user_id: null, status: 'invited', cohort } as never)
      .mockResolvedValueOnce({ id: 99, cohort_id: 8, user_id: null, status: 'invited' } as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(0);
    prismaMock.$queryRaw.mockResolvedValue([{ id: 8, capacity: 2 }] as never);
    prismaMock.cohort_enrollments.update.mockResolvedValue({ id: 99, cohort_id: 8, status: 'joined' } as never);

    const result = await cohortJoinService.join(token, 42, true, new Date('2026-08-01T00:00:00Z'));

    expect(result).toEqual({ enrollmentId: 99, cohortId: 8, status: 'joined' });
    expect(prismaMock.users.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.cohort_enrollments.update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: { user_id: 42, status: 'joined', joined_at: new Date('2026-08-01T00:00:00Z'), exited_at: null },
      select: { id: true, cohort_id: true, status: true }
    });
    expect(prismaMock.cohort_enrollments.upsert).not.toHaveBeenCalled();
  });

  it('does not emit another join-confirmation event when the same account retries an accepted invitation', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(null);
    prismaMock.cohort_enrollments.findUnique
      .mockResolvedValueOnce({ id: 99, user_id: 42, status: 'joined', cohort } as never)
      .mockResolvedValueOnce({ id: 99, cohort_id: 8, user_id: 42, status: 'joined' } as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(1);
    prismaMock.$queryRaw.mockResolvedValue([{ id: 8, capacity: 2 }] as never);

    await expect(cohortJoinService.join(token, 42, true, new Date('2026-08-01T00:00:00Z')))
      .resolves.toEqual({ enrollmentId: 99, cohortId: 8, status: 'joined' });

    expect(prismaMock.cohort_enrollments.update).not.toHaveBeenCalled();
    expect(prismaMock.cohort_enrollments.findMany).not.toHaveBeenCalled();
    expect(createEvent).not.toHaveBeenCalled();
  });

  it('creates a deduplicated P1 join-confirmation event for each coach enrolled in this cohort', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(0);
    prismaMock.users.findUnique.mockResolvedValue({ contacts: { email: 'user@example.com' } } as never);
    prismaMock.$queryRaw.mockResolvedValue([{ id: 8, capacity: 2 }] as never);
    prismaMock.cohort_enrollments.upsert.mockResolvedValue({ id: 99, cohort_id: 8, status: 'joined' } as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ user_id: 77 }] as never);

    await cohortJoinService.join(token, 42, true, new Date('2026-08-01T00:00:00Z'));
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'CohortJoined', actorId: 42, recipientId: 77, entityType: 'cohort', entityId: 8, priority: 'P1'
    }));
    expect(prismaMock.cohort_enrollments.findMany).toHaveBeenCalledWith({
      where: { cohort_id: 8, status: 'joined', role: { in: ['owner', 'assistant'] }, user_id: { not: null } },
      select: { user_id: true }
    });
    expect(prismaMock.organization_members.findMany).not.toHaveBeenCalled();
  });

  it('rechecks capacity inside the transaction and rejects a full cohort', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.count.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    prismaMock.users.findUnique.mockResolvedValue({ contacts: { email: 'user@example.com' } } as never);
    prismaMock.$queryRaw.mockResolvedValue([{ id: 8, capacity: 2 }] as never);
    await expect(cohortJoinService.join(token, 42, true, new Date('2026-08-01T00:00:00Z'))).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.cohort_enrollments.upsert).not.toHaveBeenCalled();
  });

  it('returns the joined learner home with cohort-scoped drafts', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, export_opt_in: true, cohort: { id: 8, display_name: '夏季期', start_date: new Date('2026-07-01'), end_date: new Date('2026-08-31'), program: { organization: { name: '島島', bio: '社群', external_link: 'https://example.com' } } } } as never);
    prismaMock.practices.findMany.mockResolvedValue([{ id: 900, external_id: '123e4567-e89b-12d3-a456-426614174000', title: '每日反思', practice_action: '寫一段', status: 'draft', creation_source: 'cohort_template', start_date: new Date('2026-07-01'), end_date: new Date('2026-07-30'), progress_percentage: 40, theme_color: '#FCDD84' }] as never);
    prismaMock.practice_checkins.groupBy.mockResolvedValue([{ practice_id: 900, _count: { id: 3 }, _max: { checkin_date: new Date('2026-07-20') } }] as never);
    const result = await cohortJoinService.getMemberHome(8, 42);
    expect(result.practices).toEqual([expect.objectContaining({ title: '每日反思', status: 'draft', creationSource: 'cohort_template' })]);
    expect(prismaMock.practices.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { cohort_id: 8, user_id: 42, deleted_at: null } }));
  });

  it('carries the fields the practice card needs so the cohort page can reuse it', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, export_opt_in: true, cohort: { id: 8, display_name: '夏季期', start_date: new Date('2026-07-01'), end_date: new Date('2026-08-31'), program: { organization: { name: '島島', bio: '社群', external_link: null } } } } as never);
    prismaMock.practices.findMany.mockResolvedValue([{ id: 900, external_id: '123e4567-e89b-12d3-a456-426614174000', title: '每日反思', practice_action: '寫一段', status: 'active', creation_source: 'cohort_template', start_date: new Date('2026-07-01'), end_date: new Date('2026-07-30'), progress_percentage: 40, theme_color: '#FCDD84' }] as never);
    prismaMock.practice_checkins.groupBy.mockResolvedValue([{ practice_id: 900, _count: { id: 3 }, _max: { checkin_date: new Date('2026-07-20') } }] as never);
    const result = await cohortJoinService.getMemberHome(8, 42);
    expect(result.practices[0]).toEqual(expect.objectContaining({
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-30'),
      progressPercentage: 40,
      checkInCount: 3,
      lastCheckinAt: new Date('2026-07-20'),
      themeColor: '#FCDD84'
    }));
  });

  it('falls back to zero counts when a practice has no check-in yet', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, export_opt_in: false, cohort: { id: 8, display_name: '夏季期', start_date: new Date('2026-07-01'), end_date: new Date('2026-08-31'), program: { organization: { name: '島島', bio: null, external_link: null } } } } as never);
    prismaMock.practices.findMany.mockResolvedValue([{ id: 901, external_id: '223e4567-e89b-12d3-a456-426614174000', title: '晨間閱讀', practice_action: null, status: 'draft', creation_source: 'cohort_template', start_date: null, end_date: null, progress_percentage: null, theme_color: null }] as never);
    prismaMock.practice_checkins.groupBy.mockResolvedValue([] as never);
    const result = await cohortJoinService.getMemberHome(8, 42);
    expect(result.practices[0]).toEqual(expect.objectContaining({ checkInCount: 0, lastCheckinAt: null, themeColor: null }));
  });
});
