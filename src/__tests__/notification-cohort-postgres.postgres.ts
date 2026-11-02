import '../config/openapi-registry';
import express, { type Request } from 'express';
import request from 'supertest';
import { prisma } from '../services/database/prisma.service';
import { getNotifications } from '../controllers/notification.controller';
import { globalErrorHandler } from '../middleware/error.middleware';


// Run only with a disposable, schema-initialized local database:
// RUN_NOTIFICATION_POSTGRES=1 DATABASE_URL=postgresql://test:test@127.0.0.1:55442/daodao_test pnpm test --runInBand --testMatch '**/notification-cohort-postgres.postgres.ts'

describe('#342 real PostgreSQL notification HTTP journey', () => {
  const app = express();
  let recipientId: number;
  let outsiderId: number;
  let actorId: number;
  let roleId: number;
  const visibleIds: number[] = [];
  const hiddenIds: number[] = [];

  app.get('/api/v1/notifications', (req, _res, next) => {
    req.user = { id: req.header('x-test-user') === 'outsider' ? outsiderId : recipientId } as Request['user'];
    next();
  }, getNotifications);
  app.use(globalErrorHandler);

  beforeAll(async () => {
    if (process.env.RUN_NOTIFICATION_POSTGRES !== '1') throw new Error('Set RUN_NOTIFICATION_POSTGRES=1 to run the explicit PostgreSQL suite');
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/daodao_test') {
      throw new Error('Notification PostgreSQL tests require local disposable daodao_test');
    }
    const suffix = `notification-342-${Date.now()}`;
    const maxRole = await prisma.roles.aggregate({ _max: { id: true } });
    const role = await prisma.roles.create({ data: { id: (maxRole._max.id ?? 0) + 1, name: suffix } });
    roleId = role.id;
    const maxUser = await prisma.users.aggregate({ _max: { id: true } });
    const users = await Promise.all(['recipient', 'outsider', 'actor'].map((name, index) => prisma.users.create({
      data: { id: (maxUser._max.id ?? 0) + index + 1, mongo_id: `${suffix}-${name}`, nickname: name, role_id: roleId, tag_list: [] }
    })));
    [recipientId, outsiderId, actorId] = users.map(user => user.id);
    const now = new Date('2026-11-01T00:00:00Z');
    const fixtures = [
      { type: 'CohortWeeklyDigest', priority: 'P1', recipient_id: recipientId, created_at: now, is_read: false },
      { type: 'CohortWeeklyDigest', priority: 'P2', recipient_id: recipientId, created_at: now, is_read: false },
      { type: 'CohortInvitation', priority: 'P1', recipient_id: recipientId, created_at: new Date(now.getTime() - 1000), is_read: false },
      { type: 'CohortMemberRemoved', priority: 'P1', recipient_id: recipientId, created_at: new Date(now.getTime() - 2000), is_read: false },
      { type: 'Follow', priority: 'P2', recipient_id: recipientId, created_at: now, is_read: true },
      { type: 'CohortInvitation', priority: 'P1', recipient_id: outsiderId, created_at: now, is_read: false }
    ];
    const maxNotification = await prisma.notifications.aggregate({ _max: { id: true } });
    let fixtureId = (maxNotification._max.id ?? 0) + 1;
    for (const fixture of fixtures) {
      const notification = await prisma.notifications.create({ data: {
        ...fixture, id: fixtureId++, actor_id: actorId, entity_type: 'cohort', entity_id: 8,
        payload: fixture.type === 'CohortInvitation'
          ? { cohortName: '夏季期', message: '你收到「夏季期」的加入邀請。', url: 'https://app-dev.daodao.so/cohorts/join/own-token' }
          : undefined
      } });
      if (fixture.recipient_id === recipientId && fixture.type !== 'CohortWeeklyDigest') visibleIds.push(notification.id);
      else hiddenIds.push(notification.id);
    }
  });

  afterAll(async () => {
    if (roleId) {
      await prisma.users.deleteMany({ where: { role_id: roleId } });
      await prisma.roles.delete({ where: { id: roleId } });
    }
    await prisma.$disconnect();
  });

  it('filters digests before applying page limits and follows the real cursor across priorities', async () => {
    const ids: number[] = [];
    let cursor: string | null = null;
    do {
      const response: request.Response = await request(app).get('/api/v1/notifications').query({ limit: 1, ...(cursor ? { cursor } : {}) }).expect(200);
      const data: { unreadCount: number; notifications: Array<{ id: number }>; nextCursor: string | null } = response.body.data;
      expect(data.unreadCount).toBe(2);
      expect(data.notifications).toHaveLength(1);
      ids.push(data.notifications[0].id);
      cursor = data.nextCursor;
      if (ids.length > 6) throw new Error('Notification pagination did not terminate');
    } while (cursor);
    expect(ids).toEqual(visibleIds);
    expect(ids.some(id => hiddenIds.includes(id))).toBe(false);
  });

  it('returns cohort payload and isolates each recipient in the real database', async () => {
    const response = await request(app).get('/api/v1/notifications').expect(200);
    expect(response.body.data.notifications[0]).toMatchObject({ type: 'CohortInvitation', cohortName: '夏季期', message: '你收到「夏季期」的加入邀請。', url: 'https://app-dev.daodao.so/cohorts/join/own-token' });
    expect(response.body.data.notifications.map((item: { id: number }) => item.id)).toEqual(visibleIds);
    const outsider = await request(app).get('/api/v1/notifications').set('x-test-user', 'outsider').expect(200);
    expect(outsider.body.data.notifications).toHaveLength(1);
    expect(outsider.body.data.unreadCount).toBe(1);
    expect(visibleIds).not.toContain(outsider.body.data.notifications[0].id);
  });
});
