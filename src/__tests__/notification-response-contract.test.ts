/** HTTP response contracts for notification routes: schema compliance, scoping, auth. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';

const internalUserId = 42;

const mockNotification = {
  id: 501,
  type: 'comment',
  entityType: 'practice',
  entityId: 'practice-uuid-001',
  priority: 'P2' as const,
  isRead: false,
  aggregationCount: 1,
  createdAt: new Date('2024-06-15T10:00:00Z'),
  actor: {
    id: 'actor-uuid-001',
    name: '通知者',
    photoURL: 'https://example.com/actor.jpg',
    customId: null
  },
  practiceTitle: '每日閱讀'
};

const mockPreference = {
  type: 'comment',
  channel: 'N01',
  isEnabled: true
};

const controllerMocks = {
  getNotifications: jest.fn(async (_req: Request, res: Response) => {
    res.json(createSuccessResponse({
      notifications: [mockNotification],
      nextCursor: null,
      unreadCount: 1
    }));
  }),
  markAsRead: jest.fn(async (_req: Request, res: Response) => {
    res.json(createSuccessResponse({ id: 501, isRead: true }));
  }),
  markAllAsRead: jest.fn(async (_req: Request, res: Response) => {
    res.json(createSuccessResponse({ updated: 5 }));
  }),
  getPreferences: jest.fn(async (_req: Request, res: Response) => {
    res.json(createSuccessResponse([mockPreference]));
  }),
  updatePreferences: jest.fn(async (_req: Request, res: Response) => {
    res.json(createSuccessResponse([mockPreference]));
  }),
  unsubscribeEmail: jest.fn(async (_req: Request, res: Response) => {
    res.status(200).send('<html>OK</html>');
  })
};

jest.mock('../controllers/notification.controller', () => controllerMocks);
jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: internalUserId, _id: 'user-uuid-001' } as Request['user']; next();
  }
}));
jest.mock('../middleware/rate-limit.middleware', () => ({
  strictLimiter: (_req: Request, _res: Response, next: NextFunction): void => next()
}));

import router from '../routes/notification.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', router);
app.use(globalErrorHandler);

beforeEach(() => jest.clearAllMocks());

describe('notification list (GET /notifications)', () => {
  it('returns a valid notification list response envelope', async () => {
    const res = await request(app).get('/api/v1/notifications').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('notifications');
    expect(res.body.data).toHaveProperty('unreadCount');
    expect(res.body.data).toHaveProperty('nextCursor');
  });

  it('notification items use camelCase and include actor info', async () => {
    const res = await request(app).get('/api/v1/notifications').expect(200);
    const notif = res.body.data.notifications[0];
    expect(notif.id).toBe(501);
    expect(notif.type).toBe('comment');
    expect(notif.entityType).toBe('practice');
    expect(notif.isRead).toBe(false);
    expect(notif.actor).toBeDefined();
    expect(notif.actor.name).toBe('通知者');
  });

  it('does not expose recipient_id, actor_id, or raw payload in notification items', async () => {
    const res = await request(app).get('/api/v1/notifications').expect(200);
    const notif = res.body.data.notifications[0];
    expect(notif).not.toHaveProperty('recipient_id');
    expect(notif).not.toHaveProperty('payload');
    expect(notif).not.toHaveProperty('actor_id');
  });
});

describe('mark as read (PATCH /notifications/:id/read)', () => {
  it('returns a valid action response with id and isRead', async () => {
    const res = await request(app).patch('/api/v1/notifications/501/read').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(501);
    expect(res.body.data.isRead).toBe(true);
  });
});

describe('mark all as read (PATCH /notifications/read-all)', () => {
  it('returns updated count', async () => {
    const res = await request(app).patch('/api/v1/notifications/read-all').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updated).toBe(5);
  });
});

describe('preferences (GET /notifications/preferences)', () => {
  it('returns preference list with type, channel, and isEnabled', async () => {
    const res = await request(app).get('/api/v1/notifications/preferences').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toEqual(expect.objectContaining({
      type: 'comment', channel: 'N01', isEnabled: true
    }));
  });
});
