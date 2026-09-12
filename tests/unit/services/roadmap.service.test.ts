/**
 * Roadmap Service Unit Tests
 *
 * - addSupport：投票（首次 +1、重複冪等）
 * - removeSupport：取消投票（-1、未投票冪等）
 * - getStats：partners = 使用者總數、feedback = 許願總數
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/database/redis.service', () => ({ redis: mockRedis }));
jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { addSupport, removeSupport, getStats } from '@/services/roadmap.service';

describe('Roadmap Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  describe('addSupport', () => {
    it('首次投票：upsert support、以實際筆數寫回 support_count、voted=true', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.upsert.mockResolvedValue({ id: 1 } as never);
      prismaMock.roadmap_item_supports.count.mockResolvedValue(1 as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ support_count: 1 } as never);

      const res = await addSupport('ext-uuid', 42);

      expect(prismaMock.roadmap_item_supports.upsert).toHaveBeenCalledWith({
        where: { roadmap_item_id_user_id: { roadmap_item_id: 5, user_id: 42 } },
        create: { roadmap_item_id: 5, user_id: 42, origin: 'vote' },
        update: {},
      });
      expect(prismaMock.roadmap_items.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { support_count: 1 },
      });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ support_count: 1, voted: true });
    });

    it('重複投票冪等：upsert 無動作、回傳權威票數', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.upsert.mockResolvedValue({ id: 9 } as never);
      prismaMock.roadmap_item_supports.count.mockResolvedValue(3 as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ support_count: 3 } as never);

      const res = await addSupport('ext-uuid', 42);

      expect(prismaMock.roadmap_item_supports.upsert).toHaveBeenCalled();
      expect(res.data).toEqual({ support_count: 3, voted: true });
    });
  });

  describe('removeSupport', () => {
    it('取消投票：刪除 support、以實際筆數寫回、voted=false', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.deleteMany.mockResolvedValue({ count: 1 } as never);
      prismaMock.roadmap_item_supports.count.mockResolvedValue(2 as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ support_count: 2 } as never);

      const res = await removeSupport('ext-uuid', 42);

      expect(prismaMock.roadmap_item_supports.deleteMany).toHaveBeenCalledWith({
        where: { roadmap_item_id: 5, user_id: 42 },
      });
      expect(prismaMock.roadmap_items.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { support_count: 2 },
      });
      expect(res.data).toEqual({ support_count: 2, voted: false });
    });

    it('未投票取消冪等：deleteMany 刪 0 筆、回傳權威票數', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.roadmap_item_supports.count.mockResolvedValue(7 as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ support_count: 7 } as never);

      const res = await removeSupport('ext-uuid', 42);

      expect(res.data).toEqual({ support_count: 7, voted: false });
    });
  });

  describe('getStats', () => {
    it('partners = 使用者總數，feedback = 許願總數', async () => {
      mockRedis.get.mockResolvedValue(null);
      prismaMock.users.count.mockResolvedValue(3);
      prismaMock.wishes.count.mockResolvedValue(5 as never);

      const res = await getStats();

      expect(res.data).toEqual({ partners: 3, feedback: 5 });
      expect(prismaMock.users.count).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledWith('roadmap:stats', JSON.stringify({ partners: 3, feedback: 5 }), 'EX', 3600);
    });

    it('命中 Redis 快取時直接回傳，不查 DB', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ partners: 10, feedback: 20 }));

      const res = await getStats();

      expect(res.data).toEqual({ partners: 10, feedback: 20 });
      expect(prismaMock.wishes.count).not.toHaveBeenCalled();
      expect(prismaMock.users.count).not.toHaveBeenCalled();
    });
  });
});
