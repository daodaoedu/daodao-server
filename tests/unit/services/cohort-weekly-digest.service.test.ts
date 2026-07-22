import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const bulkEnqueueEmails = jest.fn().mockResolvedValue(undefined);
jest.mock('@/queues/email.queue', () => ({
  bulkEnqueueEmails: (...args: unknown[]): unknown => bulkEnqueueEmails(...args)
}));
const createEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: { createEvent: (...args: unknown[]): unknown => createEvent(...args) }
}));

import { sendWeeklyCohortDigests } from '@/services/cohort-weekly-digest.service';

describe('sendWeeklyCohortDigests', () => {
  it('queues the existing email template with counts, attention list, and direct focus link', async () => {
    process.env.FRONTEND_URL = 'https://app.example.com';
    prismaMock.cohorts.findMany.mockResolvedValue([{
      id: 8,
      display_name: '夏季同行期',
      program: {
        id: 2,
        organization: {
          name: '島島組織',
          organization_members: [
            { user: { id: 42, contacts: { email: 'coach@example.com' } } },
            { user: { id: 43, contacts: null } }
          ]
        }
      }
    }] as never);
    prismaMock.practice_checkins.count.mockResolvedValue(12);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ count: 4n }] as never)
      .mockResolvedValueOnce([{ user_id: 77, nickname: '需要關心的小島' }] as never);
    const now = new Date('2026-07-20T00:00:00.000Z');

    await expect(sendWeeklyCohortDigests(now)).resolves.toBe(1);
    expect(prismaMock.practice_checkins.count).toHaveBeenCalledWith({
      where: {
        practices: { cohort_id: 8, deleted_at: null },
        created_at: { gte: new Date('2026-07-13T00:00:00.000Z'), lte: now }
      }
    });
    expect(bulkEnqueueEmails).toHaveBeenCalledWith([expect.objectContaining({
      to: 'coach@example.com',
      emailType: 'cohort_weekly_digest',
      priority: 'P2',
      userId: 42,
      subject: '夏季同行期 教練週報',
      html: expect.stringMatching(/本週打卡數：12[\s\S]*待回應打卡：4[\s\S]*需要關心的小島[\s\S]*https:\/\/app\.example\.com\/lighthouse\/programs\/2\/cohorts\/8\/focus/)
    })]);
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'CohortWeeklyDigest', actorId: 42, recipientId: 42, entityId: 8,
      priority: 'P2', allowSelf: true, dedupeWindowMs: 518400000
    }));
  });
});
