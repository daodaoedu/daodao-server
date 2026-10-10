/**
 * Follow Service Unit Tests
 *
 * 涵蓋範圍：
 * - 13.7 自我關注防護（follow self 回傳錯誤）
 */

import { prismaMock } from '@tests/utils/prisma-mock';
import { Prisma } from '@generated/prisma';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: {
    createEvent: jest.fn().mockReturnValue(Promise.resolve()),
  },
}));

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (_type: string, externalId: string) => {
    const num = parseInt(externalId.replace('ext-', ''), 10);
    return isNaN(num) ? 99 : num;
  }),
  internalToExternalId: jest.fn().mockImplementation(async (_type: string, id: number) => `ext-${id}`),
}));

import { followService } from '@/services/follow.service';

// ============================================================================
// Tests
// ============================================================================

describe('Follow Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // followUser — 13.7 自我關注防護
  // --------------------------------------------------------------------------

  describe('followUser — 自我關注防護（13.7）', () => {
    it('followerId === targetId 時拋出 BadRequestError', async () => {
      // externalToInternalId('user', 'ext-1') → 1，followerId 也是 1
      await expect(
        followService.followUser(1, 'ext-1'),
      ).rejects.toThrow('無法關注自己');
    });

    it('followerId !== targetId 時正常關注', async () => {
      prismaMock.follows.upsert.mockResolvedValue({
        id: 1,
        follower_id: 1,
        followee_id: 2,
        target_type: 'user',
        target_id: 2,
        created_at: new Date(),
      } as any);
      // Fire-and-forget: followUser calls prisma.users.findUnique().then(...)
      prismaMock.users.findUnique.mockResolvedValue(null as any);
      // Fire-and-forget: fan-out follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([]);

      const result = await followService.followUser(1, 'ext-2');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('關注成功');
    });
  });

  // --------------------------------------------------------------------------
  // followPractice — 13.7 關注自己的實踐防護
  // --------------------------------------------------------------------------

  describe('followPractice — 自我關注防護（13.7）', () => {
    it('關注自己的實踐時拋出 BadRequestError', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        id: 10,
        user_id: 1, // 實踐的擁有者是 user 1
        title: '我的實踐',
      } as any);

      await expect(
        followService.followPractice(1, 'ext-10'),
      ).rejects.toThrow('無法關注自己的主題實踐');
    });

    it('關注他人實踐時正常關注', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        id: 10,
        user_id: 2, // 實踐擁有者是 user 2
        title: '他人的實踐',
      } as any);

      prismaMock.follows.upsert.mockResolvedValue({
        id: 1,
        follower_id: 1,
        followee_id: null,
        target_type: 'practice',
        target_id: 10,
        created_at: new Date(),
      } as any);
      // Fire-and-forget: followPractice calls prisma.users.findUnique().then(...)
      prismaMock.users.findUnique.mockResolvedValue(null as any);

      const result = await followService.followPractice(1, 'ext-10');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('關注主題實踐成功');
    });

    it('實踐不存在時拋出 NotFoundError', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(
        followService.followPractice(1, 'ext-999'),
      ).rejects.toThrow('主題實踐不存在');
    });
  });

  // --------------------------------------------------------------------------
  // unfollowUser
  // --------------------------------------------------------------------------

  describe('unfollowUser', () => {
    it('成功取消關注用戶：deleteMany 以正確參數呼叫', async () => {
      prismaMock.follows.deleteMany.mockResolvedValue({ count: 1 } as any);

      const result = await followService.unfollowUser(1, 'ext-2');

      expect(prismaMock.follows.deleteMany).toHaveBeenCalledWith({
        where: {
          follower_id: 1,
          target_type: 'user',
          target_id: 2,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('已取消關注');
    });
  });

  // --------------------------------------------------------------------------
  // unfollowPractice
  // --------------------------------------------------------------------------

  describe('unfollowPractice', () => {
    it('成功取消關注實踐：deleteMany 以正確參數呼叫', async () => {
      prismaMock.follows.deleteMany.mockResolvedValue({ count: 1 } as any);

      const result = await followService.unfollowPractice(1, 'ext-10');

      expect(prismaMock.follows.deleteMany).toHaveBeenCalledWith({
        where: {
          follower_id: 1,
          target_type: 'practice',
          target_id: 10,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('已取消關注主題實踐');
    });
  });

  // --------------------------------------------------------------------------
  // getFollowing
  // --------------------------------------------------------------------------

  describe('getFollowing', () => {
    // getFollowing 用 $queryRaw 在 DB 層同時做 count 與分頁（daodao#293）；
    // mock 依 SQL 文字分流：COUNT 查詢回總數，其餘回該頁 follows 列
    const mockFollowingQueries = (total: number, rows: Array<{ target_type: string; target_id: number; created_at: Date }>) => {
      prismaMock.$queryRaw.mockImplementation((async (query: Prisma.Sql) =>
        /COUNT\(/i.test(query.sql) ? [{ count: BigInt(total) }] : rows) as any);
    };
    const rawSqlCalls = (): Prisma.Sql[] =>
      prismaMock.$queryRaw.mock.calls.map(call => call[0] as unknown as Prisma.Sql);

    it('回傳關注中的用戶列表', async () => {
      const now = new Date();
      mockFollowingQueries(1, [{ target_type: 'user', target_id: 2, created_at: now }]);
      prismaMock.users.findMany.mockResolvedValue([
        {
          id: 2,
          external_id: 'ext-2',
          nickname: '用戶B',
          custom_id: null,
          personal_slogan: null,
          contacts: null,
        },
      ] as any);

      const result = await followService.getFollowing('ext-1', 1, 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        targetType: 'user',
        user: {
          id: 'ext-2',
          name: '用戶B',
        },
      });
    });

    it('沒有關注任何人時回傳空列表', async () => {
      mockFollowingQueries(0, []);

      const result = await followService.getFollowing('ext-1', 1, 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });

    // daodao#293 regression：已刪除的使用者（硬刪除留下孤兒 follows 列）與已軟刪除的實踐，
    // 不能被算進 totalItems，也不能以「只有 targetType」的空殼出現在 data
    it('已刪除的關注目標不計入 totalItems，且 count 與分頁查詢用同一組排除條件（daodao#293）', async () => {
      const now = new Date();
      // DB 層已排除已刪除目標：只剩 1 筆可顯示的使用者
      mockFollowingQueries(1, [{ target_type: 'user', target_id: 2, created_at: now }]);
      prismaMock.users.findMany.mockResolvedValue([
        { id: 2, external_id: 'ext-2', nickname: '用戶B', custom_id: null, personal_slogan: null, contacts: null },
      ] as any);

      const result = await followService.getFollowing('ext-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(result.data.length);
      expect(result.pagination.totalPages).toBe(1);
      // 舊實作：follows.count 只看 follower_id，會把已刪除目標算進去
      expect(prismaMock.follows.count).not.toHaveBeenCalled();

      const calls = rawSqlCalls();
      expect(calls).toHaveLength(2);
      for (const q of calls) {
        // 使用者目標必須仍存在；實踐目標必須存在且未軟刪除
        expect(q.sql).toMatch(/EXISTS\s*\(\s*SELECT 1 FROM users/i);
        expect(q.sql).toMatch(/EXISTS\s*\(\s*SELECT 1 FROM practices[\s\S]*deleted_at IS NULL/i);
      }
    });

    it('分頁以過濾後的總數計算 totalPages，並把 limit／offset 帶進 SQL', async () => {
      const now = new Date();
      mockFollowingQueries(25, [{ target_type: 'practice', target_id: 7, created_at: now }]);
      prismaMock.practices.findMany.mockResolvedValue([
        { id: 7, external_id: 'p-7', title: '每天寫一點', users: { nickname: '主人', contacts: null } },
      ] as any);

      const result = await followService.getFollowing('ext-1', 3, 10);

      expect(result.pagination).toMatchObject({ currentPage: 3, totalPages: 3, totalItems: 25, hasNext: false, hasPrev: true });
      const pageQuery = rawSqlCalls().find(q => !/COUNT\(/i.test(q.sql));
      expect(pageQuery?.values).toEqual(expect.arrayContaining([10, 20]));
      expect(result.data[0]).toMatchObject({ targetType: 'practice', practice: { id: 'p-7', title: '每天寫一點' } });
    });

    it('查詢與補資料之間目標剛被刪除時，不回傳沒有內容的空殼項目', async () => {
      const now = new Date();
      mockFollowingQueries(2, [
        { target_type: 'user', target_id: 2, created_at: now },
        { target_type: 'practice', target_id: 9, created_at: now },
      ]);
      prismaMock.users.findMany.mockResolvedValue([
        { id: 2, external_id: 'ext-2', nickname: '用戶B', custom_id: null, personal_slogan: null, contacts: null },
      ] as any);
      prismaMock.practices.findMany.mockResolvedValue([] as any);

      const result = await followService.getFollowing('ext-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data.every(item => (item.targetType === 'user' ? item.user : item.practice))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // getFollowers
  // --------------------------------------------------------------------------

  describe('getFollowers', () => {
    it('回傳關注者列表', async () => {
      const now = new Date();

      prismaMock.follows.count.mockResolvedValue(1);
      prismaMock.follows.findMany.mockResolvedValue([
        {
          id: 1,
          follower_id: 3,
          target_type: 'user',
          target_id: 1,
          created_at: now,
          follower: { id: 3, external_id: 'ext-3', nickname: '用戶C' },
        },
      ] as any);

      const result = await followService.getFollowers('ext-1', 1, 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        userId: 3,
        externalId: 'ext-3',
        nickname: '用戶C',
      });
    });

    it('沒有任何關注者時回傳空列表', async () => {
      prismaMock.follows.count.mockResolvedValue(0);
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      const result = await followService.getFollowers('ext-1', 1, 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});
