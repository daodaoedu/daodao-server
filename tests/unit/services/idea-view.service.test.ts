/**
 * Idea View Tracking Unit Tests
 *
 * 涵蓋範圍：
 * - recordIdeaView 想法不存在 → NotFoundError
 * - recordIdeaView 首次瀏覽 → 寫入 entity_stats + interaction_events
 * - recordIdeaView 24h 內重複瀏覽 → 不重複計數
 */

import { prismaMock } from '@tests/utils/prisma-mock';

// Mock redis — view tracking 用它做 24h 去重（factory 不可引用外部變數，hoisting）
jest.mock('@/services/database/redis.service', () => {
  const redisMock = { set: jest.fn() };
  return { __esModule: true, default: redisMock, redis: redisMock };
});

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

import { recordIdeaView } from '@/services/idea.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const redisMock = jest.requireMock('@/services/database/redis.service').default as { set: jest.Mock };

const userId = 42;
const externalId = '550e8400-e29b-41d4-a716-446655440000';

describe('recordIdeaView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('想法不存在時拋出 NotFoundError', async () => {
    prismaMock.ideas.findFirst.mockResolvedValue(null);

    await expect(recordIdeaView(externalId, userId)).rejects.toThrow('想法不存在');
  });

  it('首次瀏覽會寫入 entity_stats 與 interaction_events', async () => {
    prismaMock.ideas.findFirst.mockResolvedValue({ id: 5 } as never);
    redisMock.set.mockResolvedValueOnce('OK');
    prismaMock.entity_stats.upsert.mockResolvedValue({ view_count: 3 } as never);
    prismaMock.interaction_events.create.mockResolvedValue({ id: 1 } as never);

    const result = await recordIdeaView(externalId, userId);

    expect(result.data.viewCount).toBe(3);
    expect(prismaMock.interaction_events.create).toHaveBeenCalledWith({
      data: { entity_type: 'idea', entity_id: 5, user_id: userId, event_type: 'view' },
    });
  });

  it('24h 內重複瀏覽不重複計數', async () => {
    prismaMock.ideas.findFirst.mockResolvedValue({ id: 5 } as never);
    redisMock.set.mockResolvedValueOnce(null); // SETNX 失敗＝已存在
    prismaMock.entity_stats.findUnique.mockResolvedValue({ view_count: 3 } as never);

    const result = await recordIdeaView(externalId, userId);

    expect(result.data.viewCount).toBe(3);
    expect(prismaMock.entity_stats.upsert).not.toHaveBeenCalled();
    expect(prismaMock.interaction_events.create).not.toHaveBeenCalled();
  });
});
