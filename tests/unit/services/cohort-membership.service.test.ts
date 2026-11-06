import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const createEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({ notificationEventService: { createEvent: (...args: unknown[]): unknown => createEvent(...args) } }));
import { cohortMembershipService } from '@/services/cohort-membership.service';
import { ConflictError } from '@/middleware/error.middleware';

describe('cohortMembershipService.exit', () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.practices.findMany.mockResolvedValue([]);
    prismaMock.entity_resources.findMany.mockResolvedValue([]);
  });
  it('atomically exits enrollment and detaches all cohort practices', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 9, status: 'joined' } as never);
    prismaMock.practices.updateMany.mockResolvedValue({ count: 3 });
    prismaMock.cohort_enrollments.update.mockResolvedValue({ id: 9 } as never);
    const now = new Date('2026-07-22T10:00:00Z');
    const result = await cohortMembershipService.exit(8, 42, now);
    expect(result).toEqual({ enrollmentId: 9, status: 'exited', detachedPracticeCount: 3 });
    expect(prismaMock.practices.updateMany).toHaveBeenCalledWith({ where: { cohort_id: 8, user_id: 42 }, data: { cohort_id: null } });
    expect(prismaMock.cohort_enrollments.update).toHaveBeenCalledWith({ where: { id: 9 }, data: { status: 'exited', exited_at: now } });
  });
  it('rejects an enrollment that is not joined', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 9, status: 'removed' } as never);
    await expect(cohortMembershipService.exit(8, 42)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.practices.updateMany).not.toHaveBeenCalled();
  });

  it('coach removal detaches practices, audits actor, and sends a neutral P1 notification', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 9, user_id: 77, status: 'joined' } as never);
    prismaMock.practices.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.cohort_enrollments.update.mockResolvedValue({ id: 9 } as never);
    const result = await cohortMembershipService.remove(2, 8, 9, 42, new Date('2026-07-22T10:00:00Z'));
    expect(result).toEqual({ userId: 77, detachedPracticeCount: 2 });
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      42,
      'lighthouse.cohort_member_removed',
      '9',
      JSON.stringify({ status: 'removed', affectedCount: 1, detachedPracticeCount: 2 })
    ]));
    expect(String(prismaMock.$executeRaw.mock.calls[0][0])).toContain("'cohort_enrollment'");
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'CohortMemberRemoved', actorId: 42, recipientId: 77, priority: 'P1', payload: expect.objectContaining({ message: expect.not.stringContaining('違規') }) }));
  });

  it('returns only id, nickname, avatar, joinedAt and never selects email', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ user_id: 77, joined_at: new Date('2026-07-22'), user: { nickname: '小島', contacts: { photo_url: 'https://img.example/avatar.png', email: 'private@example.com' } } }] as never);
    const result = await cohortMembershipService.listLearners(2, 8, 42);
    expect(result).toEqual([{ id: 77, nickname: '小島', avatar: 'https://img.example/avatar.png', joinedAt: new Date('2026-07-22') }]);
    expect(JSON.stringify(result)).not.toContain('private@example.com');
    expect(prismaMock.cohort_enrollments.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: { user_id: true, joined_at: true, user: { select: { nickname: true, contacts: { select: { photo_url: true } } } } }
    }));
  });

  it('returns a coach roster with every enrollment lifecycle status', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      { id: 1, email: 'invited@example.com', user_id: null, role: 'member', status: 'invited', invited_at: new Date('2026-07-20'), joined_at: null, exited_at: null, export_opt_in: false, user: null },
      { id: 2, email: 'joined@example.com', user_id: 77, role: 'member', status: 'joined', invited_at: new Date('2026-07-20'), joined_at: new Date('2026-07-21'), exited_at: null, export_opt_in: true, user: { nickname: '小島' } },
      { id: 3, email: 'removed@example.com', user_id: 88, role: 'member', status: 'removed', invited_at: new Date('2026-07-18'), joined_at: new Date('2026-07-19'), exited_at: new Date('2026-07-22'), export_opt_in: false, user: { nickname: '海風' } }
    ] as never);

    const result = await cohortMembershipService.listEnrollments(2, 8, 42);

    expect(result.map(item => item.status)).toEqual(['invited', 'joined', 'removed']);
    expect(result[1]).toEqual(expect.objectContaining({ id: 2, email: 'joined@example.com', userId: 77, nickname: '小島', role: 'member', exportOptIn: true }));
    expect(prismaMock.cohort_enrollments.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { cohort_id: 8 },
      orderBy: [{ status: 'asc' }, { invited_at: 'asc' }]
    }));
  });
});
