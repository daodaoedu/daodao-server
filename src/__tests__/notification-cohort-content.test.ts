import '../config/openapi-registry';
import express, { type Request } from 'express';
import request from 'supertest';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('../services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../services/notification-preference.service', () => ({ notificationPreferenceService: {} }));
jest.mock('../services/notification-unsubscribe.service', () => ({ verifyUnsubscribeToken: jest.fn() }));
import { getNotifications } from '../controllers/notification.controller';
import { globalErrorHandler } from '../middleware/error.middleware';

const app = express();
app.get('/api/v1/notifications', (req, _res, next) => {
  req.user = { id: 42 } as Request['user'];
  next();
}, getNotifications);
app.use(globalErrorHandler);

const row = (id: number, type: string, payload: unknown = null, recipientId = 42): Record<string, unknown> & { type: string; recipient_id: number } => ({
  id, type, entity_type: 'cohort', entity_id: 8, priority: 'P1', is_read: false,
  aggregation_key: null, aggregation_count: 1, payload, recipient_id: recipientId,
  created_at: new Date('2026-11-01T00:00:00Z'),
  actor: { external_id: 'actor', nickname: '教練', custom_id: null, contacts: null }
});

describe('#342 real notification HTTP handler', () => {
  it('exposes meaningful invitation/removal content without exposing raw payload', async () => {
    prismaMock.notifications.findMany.mockResolvedValue([
      row(1, 'CohortInvitation', { cohortName: '夏季期', message: '你收到「夏季期」的加入邀請。', url: '/cohorts/join/own-token', privateField: 'secret' }),
      row(2, 'CohortMemberRemoved', { cohortName: '夏季期', message: '你已不再參與「夏季期」。' }),
      row(3, 'CohortInvitation'),
      row(4, 'CohortInvitation', { cohortName: 123, message: { invalid: true }, url: 123, entityTitle: 123 }),
      row(5, 'WishLinked', { entityTitle: '學習地圖', url: '/roadmap' })
    ] as never);
    prismaMock.notifications.count.mockResolvedValue(4);
    const res = await request(app).get('/api/v1/notifications').expect(200);
    expect(res.body.data.notifications[0]).toMatchObject({ cohortName: '夏季期', message: '你收到「夏季期」的加入邀請。', url: '/cohorts/join/own-token' });
    expect(res.body.data.notifications[1]).toMatchObject({ cohortName: '夏季期', message: '你已不再參與「夏季期」。' });
    expect(res.body.data.notifications[1]).not.toHaveProperty('url');
    expect(res.body.data.notifications[2]).not.toHaveProperty('cohortName');
    for (const field of ['cohortName', 'message', 'url']) expect(res.body.data.notifications[3]).not.toHaveProperty(field);
    expect(res.body.data.notifications[4]).toMatchObject({ type: 'WishLinked', entityTitle: '學習地圖', url: '/roadmap' });
    expect(res.body.data.notifications[3]).not.toHaveProperty('entityTitle');
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(prismaMock.cohort_enrollments.findMany).not.toHaveBeenCalled();
  });

  it('excludes historical digests before pagination and unread counting while keeping other users isolated', async () => {
    const rows = [row(4, 'CohortWeeklyDigest'), row(3, 'CohortInvitation'), row(2, 'CohortMemberRemoved'), row(1, 'Follow', null, 99)];
    // This bounded repository fake applies the production query to fixed records.
    prismaMock.notifications.findMany.mockImplementation((args) => Promise.resolve(rows.filter(item =>
      item.recipient_id === args?.where?.recipient_id &&
      !(typeof args?.where?.type === 'object' && args.where.type.not === item.type)
    ).slice(0, args?.take ?? rows.length)) as never);
    prismaMock.notifications.count.mockImplementation((args) => Promise.resolve(rows.filter(item =>
      item.recipient_id === args?.where?.recipient_id &&
      !(typeof args?.where?.type === 'object' && args.where.type.not === item.type)
    ).length) as never);
    const res = await request(app).get('/api/v1/notifications?limit=1').expect(200);
    expect(res.body.data.notifications.map((item: { id: number }) => item.id)).toEqual([3]);
    expect(res.body.data.unreadCount).toBe(2);
    expect(JSON.parse(Buffer.from(res.body.data.nextCursor, 'base64').toString()).id).toBe(3);
  });
});
