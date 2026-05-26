/**
 * Roadmap Service Unit Tests
 *
 * - addSupport：投票（首次 +1、重複冪等）
 * - removeSupport：取消投票（-1、未投票冪等）
 * - getStats：partners 跨許願/投票去重、feedback = 許願總數
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
    it('首次投票：建立 support、support_count +1、voted=true', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.findUnique.mockResolvedValue(null as never);
      prismaMock.roadmap_item_supports.create.mockResolvedValue({ id: 1 } as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ support_count: 1 } as never);

      const res = await addSupport('ext-uuid', 42);

      expect(prismaMock.roadmap_item_supports.create).toHaveBeenCalledWith({
        data: { roadmap_item_id: 5, user_id: 42, origin: 'vote' },
      });
      expect(prismaMock.roadmap_items.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { support_count: { increment: 1 } },
        select: { support_count: true },
      });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ support_count: 1, voted: true });
    });

    it('重複投票冪等：不重複建立、回傳當前票數', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.findUnique.mockResolvedValue({ id: 9 } as never);
      prismaMock.roadmap_items.findUniqueOrThrow.mockResolvedValue({ support_count: 3 } as never);

      const res = await addSupport('ext-uuid', 42);

      expect(prismaMock.roadmap_item_supports.create).not.toHaveBeenCalled();
      expect(prismaMock.roadmap_items.update).not.toHaveBeenCalled();
      expect(res.data).toEqual({ support_count: 3, voted: true });
    });
  });

  describe('removeSupport', () => {
    it('已投票取消：刪除 support、support_count -1、voted=false', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.findUnique.mockResolvedValue({ id: 9 } as never);
      prismaMock.roadmap_item_supports.delete.mockResolvedValue({ id: 9 } as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ support_count: 2 } as never);

      const res = await removeSupport('ext-uuid', 42);

      expect(prismaMock.roadmap_item_supports.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(prismaMock.roadmap_items.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { support_count: { decrement: 1 } },
        select: { support_count: true },
      });
      expect(res.data).toEqual({ support_count: 2, voted: false });
    });

    it('未投票取消冪等：不刪除、回傳當前票數', async () => {
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5 } as never);
      prismaMock.roadmap_item_supports.findUnique.mockResolvedValue(null as never);
      prismaMock.roadmap_items.findUniqueOrThrow.mockResolvedValue({ support_count: 7 } as never);

      const res = await removeSupport('ext-uuid', 42);

      expect(prismaMock.roadmap_item_supports.delete).not.toHaveBeenCalled();
      expect(res.data).toEqual({ support_count: 7, voted: false });
    });
  });

  describe('getStats', () => {
    it('partners 跨許願/投票去重，feedback = 許願總數', async () => {
      mockRedis.get.mockResolvedValue(null);
      prismaMock.wishes.findMany.mockResolvedValue([
        { submitter_user_id: 1 },
        { submitter_user_id: 2 },
      ] as never);
      prismaMock.roadmap_item_supports.findMany.mockResolvedValue([
        { user_id: 2 },
        { user_id: 3 },
      ] as never);
      prismaMock.wishes.count.mockResolvedValue(5 as never);

      const res = await getStats();

      // 去重 {1,2,3} = 3
      expect(res.data).toEqual({ partners: 3, feedback: 5 });
      expect(mockRedis.set).toHaveBeenCalledWith('roadmap:stats', JSON.stringify({ partners: 3, feedback: 5 }), 'EX', 3600);
    });

    it('命中 Redis 快取時直接回傳，不查 DB', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ partners: 10, feedback: 20 }));

      const res = await getStats();

      expect(res.data).toEqual({ partners: 10, feedback: 20 });
      expect(prismaMock.wishes.count).not.toHaveBeenCalled();
    });
  });
});
