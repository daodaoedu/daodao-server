jest.mock('../services/logging/logger.service', () => ({ loggerService: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('../services/database/prisma.service', () => ({ prisma: prismaMock }));
const bulkEnqueueEmails = jest.fn().mockResolvedValue(undefined);
jest.mock('../queues/email.queue', () => ({ bulkEnqueueEmails: (...args: unknown[]): Promise<void> => bulkEnqueueEmails(...args) }));
import { cohortInvitationService } from '../services/cohort-invitation.service';
import { cohortMembershipService } from '../services/cohort-membership.service';
import { sendWeeklyCohortDigests } from '../services/cohort-weekly-digest.service';
import { notificationEventService } from '../services/notification-event.service';

const cohort = { id: 8, display_name: '夏季期', invite_message: null, status: 'published', end_date: new Date('2099-12-31'), join_deadline: null, capacity: null, program: { organization: { name: '島島' } } };

beforeEach(() => {
  setupTransactionMock();
  process.env.FRONTEND_URL = 'https://app-dev.daodao.so';
  prismaMock.notification_events.findFirst.mockResolvedValue(null);
});

it('persists each recipient invitation with its own join destination and cohort name', async () => {
  prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
  prismaMock.cohort_enrollments.findUnique.mockResolvedValue(null);
  prismaMock.cohort_enrollments.create.mockResolvedValueOnce({ id: 1, invite_token: 'token-a' } as never).mockResolvedValueOnce({ id: 2, invite_token: 'token-b' } as never);
  prismaMock.users.findMany.mockResolvedValue([{ id: 77, contacts: { email: 'a@example.com' } }, { id: 88, contacts: { email: 'b@example.com' } }] as never);
  await cohortInvitationService.invite(2, 8, 42, { emails: ['a@example.com', 'b@example.com'], preview: false });
  expect(prismaMock.notification_events.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ recipient_id: 77, payload: { cohortName: '夏季期', message: '你收到「夏季期」的加入邀請。', url: 'https://app-dev.daodao.so/cohorts/join/token-a' } }) }));
  expect(prismaMock.notification_events.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ recipient_id: 88, payload: expect.objectContaining({ url: 'https://app-dev.daodao.so/cohorts/join/token-b' }) }) }));
});

it('persists removal content with cohort name and no inaccessible destination', async () => {
  prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 9, user_id: 77, status: 'joined', cohort: { display_name: '夏季期' } } as never);
  prismaMock.practices.updateMany.mockResolvedValue({ count: 1 });
  await cohortMembershipService.remove(2, 8, 9, 42);
  expect(prismaMock.notification_events.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'CohortMemberRemoved', payload: { cohortName: '夏季期', message: '你已不再參與「夏季期」，原有實踐已轉回個人實踐。' } }) }));
});

it('keeps weekly email delivery without creating any in-app digest event', async () => {
  prismaMock.cohorts.findMany.mockResolvedValue([{ ...cohort, program: { id: 2, organization: { name: '島島', organization_members: [{ user: { id: 42, contacts: { email: 'coach@example.com' } } }] } } }] as never);
  prismaMock.practice_checkins.count.mockResolvedValue(12);
  prismaMock.$queryRaw.mockResolvedValueOnce([{ count: 4n }] as never).mockResolvedValueOnce([{ user_id: 77, nickname: '小島' }] as never);
  await expect(sendWeeklyCohortDigests(new Date('2026-11-01'))).resolves.toBe(1);
  expect(bulkEnqueueEmails).toHaveBeenCalledWith([expect.objectContaining({ to: 'coach@example.com', emailType: 'cohort_weekly_digest', subject: '夏季期 教練週報', html: expect.stringContaining('本週打卡數：12') })]);
  expect(prismaMock.notification_events.create).not.toHaveBeenCalled();
});

it.each(['Comment', 'Reaction', 'Follow'])('does not persist self %s interactions but still notifies another recipient', async type => {
  const event = { type, actorId: 42, recipientId: 42, entityType: 'practice', entityId: 8, priority: 'P2' as const };
  await notificationEventService.createEvent(event);
  expect(prismaMock.notification_events.create).not.toHaveBeenCalled();
  await notificationEventService.createEvent({ ...event, recipientId: 77 });
  expect(prismaMock.notification_events.create).toHaveBeenCalledTimes(1);
  expect(prismaMock.notification_events.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type, actor_id: 42, recipient_id: 77 }) }));
});
