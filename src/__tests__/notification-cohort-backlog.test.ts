jest.mock('../services/logging/logger.service', () => ({ loggerService: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('../services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../queues/connection', () => ({ getQueueConnection: (): Record<string, never> => ({}) }));
jest.mock('../queues/notification.queue', () => ({ NOTIFICATION_INAPP_QUEUE_NAME: 'notification-inapp' }));
let processor: (job: { id: string }) => Promise<void>;
jest.mock('bullmq', () => ({ Worker: jest.fn().mockImplementation((_queue: string, handler: typeof processor) => {
  processor = handler;
  return { on: jest.fn(), close: jest.fn() };
}) }));
import { createNotificationInAppWorker } from '../queues/notification-inapp.worker';

it('consumes a legacy digest backlog without creating notifications and preserves ordinary events', async () => {
  createNotificationInAppWorker();
  const event = { id: 1, type: 'CohortWeeklyDigest', actor_id: 42, recipient_id: 42, entity_type: 'cohort', entity_id: 8, priority: 'P2', payload: null, created_at: new Date('2026-10-01'), processed_at: null };
  prismaMock.notification_events.findMany.mockResolvedValue([event, { ...event, id: 2, type: 'Follow', actor_id: 77 }] as never);
  await processor({ id: 'backlog' });
  expect(prismaMock.notifications.create).toHaveBeenCalledTimes(1);
  expect(prismaMock.notifications.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'Follow', actor_id: 77, recipient_id: 42 }) }));
  expect(prismaMock.notification_events.updateMany).toHaveBeenCalledWith({ where: { id: { in: [1, 2] } }, data: { processed_at: expect.any(Date) } });
});
