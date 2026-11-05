import { prismaMock } from '../../../tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../logging/logger.service', () => ({ loggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../../queues', () => ({ enqueuePracticeEmail: jest.fn() }));
jest.mock('../notification-event.service', () => ({ notificationEventService: { createEvent: jest.fn() } }));
jest.mock('../cohort-acl.service', () => ({ assertCohortPracticeUpdatable: jest.fn(), isLighthouseCohort: jest.fn().mockResolvedValue(true), canReadPrivateLighthousePractice: jest.fn().mockResolvedValue(true) }));
jest.mock('../challenge-acl.service', () => ({ isChallengeCohort: jest.fn().mockResolvedValue(false) }));
import { findById } from '../practice.service';

const comments = [1, 2, 3].map(id => ({ id, target_type: 'practice', target_id: 140, user_id: 301, visibility: 'private', parent_id: null }));
beforeEach(() => {
  prismaMock.practices.findUnique.mockResolvedValue({ id: 140, user_id: 306, external_id: 'practice-140', title: 'Design thinking', deleted_at: null, privacy_status: 'public', users: { external_id: 'owner306', nickname: 'Owner', user_positions: [] } } as any);
  prismaMock.comments.groupBy.mockResolvedValue([{ target_id: 140, _count: { id: 3 } }] as any);
  prismaMock.comments.findMany.mockResolvedValue(comments as any);
  prismaMock.entity_tags.findMany.mockResolvedValue([]);
  prismaMock.entity_resources.findMany.mockResolvedValue([]);
  prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
  prismaMock.reactions.groupBy.mockResolvedValue([]);
});
it('does not expose private comment existence through the peer detail badge', async () => {
  const result = await findById(140, 310);
  expect(result.data.stats.commentCount).toBe(0);
});
it.each([306, 301])('keeps comments visible to the owner or author %i', async actor => {
  const result = await findById(140, actor);
  expect(result.data.stats.commentCount).toBe(3);
});
