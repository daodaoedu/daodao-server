import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const bulkEnqueueEmails = jest.fn().mockResolvedValue(undefined);
const enqueueEmail = jest.fn().mockResolvedValue('job-1');
jest.mock('@/queues/email.queue', () => ({ bulkEnqueueEmails: (...args: unknown[]): unknown => bulkEnqueueEmails(...args), enqueueEmail: (...args: unknown[]): unknown => enqueueEmail(...args) }));
const createEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: { createEvent: (...args: unknown[]): unknown => createEvent(...args) }
}));
import { cohortInvitationService } from '@/services/cohort-invitation.service';

const cohort = {
  id: 8, display_name: '夏季期', invite_message: '一起行動', status: 'published', end_date: new Date('2099-12-31'), join_deadline: null, capacity: null,
  program: { organization: { name: '島島' } }
};
const expiredCohort = { ...cohort, join_deadline: new Date('2020-01-01') };

describe('cohortInvitationService', () => {
  beforeEach(() => { setupTransactionMock(); process.env.FRONTEND_URL = 'https://app.example.com'; prismaMock.users.findMany.mockResolvedValue([]); });

  it('previews CSV and reports invalid rows without writing', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([] as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { csv: 'email\nGOOD@example.com\nbad', preview: true });
    expect(result).toEqual(expect.objectContaining({ total: 2, validCount: 1, errorCount: 1, queuedCount: 0 }));
    expect(result.items).toEqual([
      expect.objectContaining({ email: 'good@example.com', state: 'new', reason: null }),
      expect.objectContaining({ email: 'bad', state: 'invalid', valid: false })
    ]);
    expect(prismaMock.cohort_enrollments.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.cohort_enrollments.create).not.toHaveBeenCalled();
    expect(bulkEnqueueEmails).not.toHaveBeenCalled();
  });

  it('marks already-joined, invited and exited emails in the preview', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      { email: 'joined@example.com', status: 'joined' }, { email: 'invited@example.com', status: 'invited' }, { email: 'left@example.com', status: 'exited' }
    ] as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { emails: ['joined@example.com', 'invited@example.com', 'left@example.com', 'new@example.com'], preview: true });
    expect(result.items.map(item => item.state)).toEqual(['joined', 'invited', 'rejoin', 'new']);
    expect(result.items[0].reason).toBe('已加入');
    expect(prismaMock.cohort_enrollments.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ cohort_id: 8 }) }));
  });

  it('creates invited enrollments, writes audit counts, and enqueues templated email jobs', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findUnique.mockResolvedValue(null as never);
    prismaMock.cohort_enrollments.create.mockResolvedValue({ id: 99, invite_token: '123e4567-e89b-12d3-a456-426614174000' } as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { emails: ['GOOD@example.com'], preview: false });
    expect(result).toEqual(expect.objectContaining({ validCount: 1, errorCount: 0, queuedCount: 1 }));
    expect(prismaMock.cohort_enrollments.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ cohort_id: 8, email: 'good@example.com', status: 'invited' })
    }));
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.$executeRaw.mock.calls.flat()).toContain('lighthouse.cohort_activation_invited');
    expect(prismaMock.$executeRaw.mock.calls.flat()).toContain(JSON.stringify({ version: 1, enrollmentIds: [99] }));
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      42,
      'lighthouse.cohort_invitation_uploaded',
      '8',
      JSON.stringify({ totalCount: 1, validCount: 1, errorCount: 0 })
    ]));
    expect(String(prismaMock.$executeRaw.mock.calls[0][0])).toContain("'cohort'");
    expect(bulkEnqueueEmails).toHaveBeenCalledWith([expect.objectContaining({
      to: 'good@example.com', emailType: 'cohort_invitation', priority: 'P1', html: expect.stringContaining('https://app.example.com/cohorts/join/123e4567-e89b-12d3-a456-426614174000')
    })]);
  });

  it('creates a P1 invitation event when the invited email already belongs to a user', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findUnique.mockResolvedValue(null as never);
    prismaMock.cohort_enrollments.create.mockResolvedValue({ id: 99, invite_token: '123e4567-e89b-12d3-a456-426614174000' } as never);
    prismaMock.users.findMany.mockResolvedValue([{ id: 77 }] as never);

    await cohortInvitationService.invite(2, 8, 42, { emails: ['member@example.com'], preview: false });
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'CohortInvitation', actorId: 42, recipientId: 77, entityType: 'cohort', entityId: 8, priority: 'P1'
    }));
  });

  it('re-invites an existing non-joined enrollment by resetting it to invited', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findUnique.mockResolvedValue({ id: 55, invite_token: '123e4567-e89b-12d3-a456-426614174000', status: 'exited' } as never);
    prismaMock.cohort_enrollments.update.mockResolvedValue({ id: 55, invite_token: '123e4567-e89b-12d3-a456-426614174000' } as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { emails: ['good@example.com'], preview: false });
    expect(result).toEqual(expect.objectContaining({ validCount: 1, queuedCount: 1 }));
    expect(prismaMock.cohort_enrollments.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { cohort_id_email: { cohort_id: 8, email: 'good@example.com' } },
      data: { status: 'invited', exited_at: null }
    }));
    expect(prismaMock.cohort_enrollments.create).not.toHaveBeenCalled();
  });

  it('does not downgrade a joined member to invited when re-invited', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findUnique.mockResolvedValue({ id: 55, invite_token: '123e4567-e89b-12d3-a456-426614174000', status: 'joined' } as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { emails: ['good@example.com'], preview: false });
    expect(result).toEqual(expect.objectContaining({ validCount: 1 }));
    expect(prismaMock.cohort_enrollments.update).not.toHaveBeenCalled();
    expect(prismaMock.cohort_enrollments.create).not.toHaveBeenCalled();
  });

  it('reports sendable, skipped (already joined) and invalid counts in the preview', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      { email: 'joined@example.com', status: 'joined' }, { email: 'invited@example.com', status: 'invited' }, { email: 'left@example.com', status: 'exited' }
    ] as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { emails: ['joined@example.com', 'invited@example.com', 'left@example.com', 'new@example.com', 'bad'], preview: true });
    expect(result).toEqual(expect.objectContaining({ sendableCount: 3, skippedCount: 1, errorCount: 1, blockedReason: null }));
  });

  it('blocks the preview from sending once the join deadline has passed (#281)', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(expiredCohort as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([] as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { emails: ['new@example.com'], preview: true });
    expect(result.blockedReason).toBe('expired');
  });

  it('refuses to send invitations once the join deadline has passed (#281)', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(expiredCohort as never);
    await expect(cohortInvitationService.invite(2, 8, 42, { emails: ['new@example.com'], preview: false })).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.cohort_enrollments.create).not.toHaveBeenCalled();
    expect(bulkEnqueueEmails).not.toHaveBeenCalled();
  });

  it('skips already-joined members instead of re-sending their invitation (#282)', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findUnique
      .mockResolvedValueOnce({ id: 55, invite_token: '11111111-1111-1111-1111-111111111111', status: 'joined' } as never)
      .mockResolvedValueOnce(null as never);
    prismaMock.cohort_enrollments.create.mockResolvedValue({ id: 99, invite_token: '22222222-2222-2222-2222-222222222222' } as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { emails: ['joined@example.com', 'new@example.com'], preview: false });
    expect(result).toEqual(expect.objectContaining({ queuedCount: 1, skippedCount: 1, sendableCount: 1 }));
    expect(bulkEnqueueEmails).toHaveBeenCalledWith([expect.objectContaining({ to: 'new@example.com' })]);
    expect(result.items.find(item => item.email === 'joined@example.com')).toEqual(expect.objectContaining({ state: 'joined' }));
  });

  it('refuses to resend an invitation once the join deadline has passed (#281)', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, email: 'good@example.com', invite_token: '123e4567-e89b-12d3-a456-426614174000', status: 'invited', cohort: { ...expiredCohort } } as never);
    await expect(cohortInvitationService.resend(2, 8, 99, 42)).rejects.toMatchObject({ statusCode: 409 });
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('refuses to resend an invitation to an already-joined member (#282)', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, email: 'good@example.com', invite_token: '123e4567-e89b-12d3-a456-426614174000', status: 'joined', cohort: { ...cohort } } as never);
    await expect(cohortInvitationService.resend(2, 8, 99, 42)).rejects.toMatchObject({ statusCode: 409 });
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('resends an existing invitation through the same BullMQ email job', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, email: 'good@example.com', invite_token: '123e4567-e89b-12d3-a456-426614174000', status: 'invited', cohort: { ...cohort, invite_message: null } } as never);
    const result = await cohortInvitationService.resend(2, 8, 99, 42);
    expect(result).toEqual({ enrollmentId: 99, queued: true });
    expect(enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'good@example.com', emailType: 'cohort_invitation', priority: 'P1', html: expect.stringContaining('/cohorts/join/123e4567-e89b-12d3-a456-426614174000') }));
  });
});
