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

const cohort = { id: 8, display_name: '夏季期', invite_message: '一起行動', program: { organization: { name: '島島' } } };

describe('cohortInvitationService', () => {
  beforeEach(() => { setupTransactionMock(); process.env.FRONTEND_URL = 'https://app.example.com'; prismaMock.users.findMany.mockResolvedValue([]); });

  it('previews CSV and reports invalid rows without writing', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    const result = await cohortInvitationService.invite(2, 8, 42, { csv: 'email\nGOOD@example.com\nbad', preview: true });
    expect(result).toEqual(expect.objectContaining({ total: 2, validCount: 1, errorCount: 1, queuedCount: 0 }));
    expect(prismaMock.cohort_enrollments.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.cohort_enrollments.create).not.toHaveBeenCalled();
    expect(bulkEnqueueEmails).not.toHaveBeenCalled();
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

  it('resends an existing invitation through the same BullMQ email job', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, email: 'good@example.com', invite_token: '123e4567-e89b-12d3-a456-426614174000', cohort: { display_name: '夏季期', invite_message: null, program: { organization: { name: '島島' } } } } as never);
    const result = await cohortInvitationService.resend(2, 8, 99, 42);
    expect(result).toEqual({ enrollmentId: 99, queued: true });
    expect(enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'good@example.com', emailType: 'cohort_invitation', priority: 'P1', html: expect.stringContaining('/cohorts/join/123e4567-e89b-12d3-a456-426614174000') }));
  });
});
