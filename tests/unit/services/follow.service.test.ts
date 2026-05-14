/**
 * Follow Service Unit Tests
 *
 * 涵蓋範圍：
 * - 13.7 自我關注防護（follow self 回傳錯誤）
 */

import { prismaMock } from '@tests/utils/prisma-mock';

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
    it('回傳關注中的用戶列表', async () => {
      const now = new Date();

      prismaMock.follows.count.mockResolvedValue(1);
      prismaMock.follows.findMany.mockResolvedValue([
        {
          id: 1,
          follower_id: 1,
          target_type: 'user',
          target_id: 2,
          created_at: now,
        },
      ] as any);
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
      prismaMock.follows.count.mockResolvedValue(0);
      prismaMock.follows.findMany.mockResolvedValue([] as any);
      prismaMock.users.findMany.mockResolvedValue([] as any);

      const result = await followService.getFollowing('ext-1', 1, 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
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
