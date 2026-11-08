/**
 * daodao#451：FeedbackReplied 通知的 entityId 必須是 feedback id。
 * 同頁有 entity_id 相同的 practice 通知時，practice external_id 的補查結果不可套到 feedback 通知
 * （原本補查表沒有檢查 entity_type，feedback #12 會被換成 practice #12 的 UUID，前台就連不到該則回報）。
 */
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

const row = (id: number, type: string, entityType: string, entityId: number, payload: unknown = null): Record<string, unknown> => ({
  id, type, entity_type: entityType, entity_id: entityId, priority: 'P1', is_read: false,
  aggregation_key: null, aggregation_count: 1, payload, recipient_id: 42,
  created_at: new Date('2026-11-08T00:00:00Z'),
  actor: { external_id: 'actor', nickname: '島島', custom_id: null, contacts: null },
});

describe('FeedbackReplied notification entityId（daodao#451）', () => {
  it('同頁有相同 entity_id 的 practice／comment 通知時，feedback 通知仍回 feedback id', async () => {
    prismaMock.notifications.findMany.mockResolvedValue([
      row(1, 'FeedbackReplied', 'feedback', 12, { entityTitle: '按鈕沒反應' }),
      row(2, 'PracticeCreated', 'practice', 12),
      row(3, 'Comment', 'comment', 12),
    ] as never);
    prismaMock.notifications.count.mockResolvedValue(3);
    prismaMock.practices.findMany.mockResolvedValue([{ id: 12, external_id: 'practice-uuid-12' }] as never);
    prismaMock.comments.findMany.mockResolvedValue([{ id: 12, target_type: 'practice', target_id: 12 }] as never);

    const res = await request(app).get('/api/v1/notifications').expect(200);
    const [feedback, practice] = res.body.data.notifications;

    expect(feedback).toMatchObject({ type: 'FeedbackReplied', entityType: 'feedback', entityId: '12' });
    expect(feedback).not.toHaveProperty('checkinId');
    // practice 本身的補查不受影響
    expect(practice).toMatchObject({ entityType: 'practice', entityId: 'practice-uuid-12' });
  });
});
