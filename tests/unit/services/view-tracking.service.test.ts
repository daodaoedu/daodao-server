/**
 * View Tracking Service Unit Tests
 */

import { prismaMock } from '@tests/utils/prisma-mock';

// Mock redis — factory must not reference outer variables (hoisting)
jest.mock('@/services/database/redis.service', () => {
  const mockSet = jest.fn();
  const redisMock = { set: mockSet };
  return {
    __esModule: true,
    default: redisMock,
    redis: redisMock,
  };
});

// Mock logger — factory must not reference outer variables (hoisting)
jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

import { recordView, getViewCount } from '@/services/view-tracking.service';
import { loggerService } from '@/services/logging/logger.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const redisMock = jest.requireMock('@/services/database/redis.service').default as { set: jest.Mock };
const mockRedisSet = redisMock.set;
const mockLoggerService = loggerService as jest.Mocked<typeof loggerService>;

describe('View Tracking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // recordView
  // -------------------------------------------------------------------------
  describe('recordView', () => {
    const entityStats = (viewCount: number) => ({
      entity_type: 'practice',
      entity_id: 1,
      view_count: viewCount,
      unique_view_count: viewCount,
      reaction_count: 0,
      comment_count: 0,
      share_count: 0,
      favorite_count: 0,
      practice_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    it('新瀏覽：Redis NX 返回 OK 時，upsert entity_stats 並 insert interaction_events', async () => {
      mockRedisSet.mockResolvedValue('OK');
      prismaMock.entity_stats.upsert.mockResolvedValue(entityStats(1) as any);
      prismaMock.interaction_events.create.mockResolvedValue({} as any);

      const result = await recordView('practice', 1, 42);

      expect(mockRedisSet).toHaveBeenCalledWith('dedup:view:practice:1:42', '1', 'EX', 86400, 'NX');
      expect(prismaMock.entity_stats.upsert).toHaveBeenCalled();
      expect(prismaMock.interaction_events.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ entity_type: 'practice', entity_id: 1, user_id: 42, event_type: 'view' }) })
      );
      expect(result).toBe(1);
    });

    it('重複瀏覽（24h 內）：Redis NX 返回 null 時，不寫 DB，返回現有計數', async () => {
      mockRedisSet.mockResolvedValue(null);
      prismaMock.entity_stats.findUnique.mockResolvedValue(entityStats(5) as any);

      const result = await recordView('practice', 1, 42);

      expect(prismaMock.entity_stats.upsert).not.toHaveBeenCalled();
      expect(prismaMock.interaction_events.create).not.toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('Redis 不可用時：當作新瀏覽（fallback），寫 DB', async () => {
      mockRedisSet.mockRejectedValue(new Error('Redis connection refused'));
      prismaMock.entity_stats.upsert.mockResolvedValue(entityStats(3) as any);
      prismaMock.interaction_events.create.mockResolvedValue({} as any);

      const result = await recordView('practice', 1, 42);

      expect(mockLoggerService.warn).toHaveBeenCalled();
      expect(prismaMock.entity_stats.upsert).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it('DB 寫入失敗：記錄 error 日誌，返回 0，不拋出', async () => {
      mockRedisSet.mockResolvedValue('OK');
      prismaMock.entity_stats.upsert.mockRejectedValue(new Error('DB error'));

      await expect(recordView('practice', 1, 42)).resolves.toBe(0);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getViewCount
  // -------------------------------------------------------------------------
  describe('getViewCount', () => {
    it('有記錄時返回 view_count', async () => {
      prismaMock.entity_stats.findUnique.mockResolvedValue({ view_count: 7 } as any);

      const result = await getViewCount('practice', 1);

      expect(result).toBe(7);
    });

    it('無記錄時返回 0', async () => {
      prismaMock.entity_stats.findUnique.mockResolvedValue(null);

      const result = await getViewCount('practice', 99);

      expect(result).toBe(0);
    });

    it('DB 拋出時返回 0，記錄 error 日誌', async () => {
      prismaMock.entity_stats.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(getViewCount('practice', 1)).resolves.toBe(0);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
