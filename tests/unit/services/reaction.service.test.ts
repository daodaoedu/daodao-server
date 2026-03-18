/**
 * Reaction Service Unit Tests
 *
 * 測試 Quick Reactions 業務邏輯：
 * - upsertReaction：新增或更換反應
 * - removeReaction：刪除反應
 * - getReactionsByTarget：取得目標反應計數聚合
 */

import { prismaMock } from '@tests/utils/prisma-mock';

const mockLoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: mockLoggerService,
}));

jest.mock('@/queues/reaction-notification.queue', () => ({
  enqueueReactionNotification: jest.fn().mockResolvedValue(undefined),
}));

import {
  upsertReaction,
  removeReaction,
  getReactionsByTarget,
  getReactionsListByTarget,
} from '@/services/reaction.service';

// ============================================================================
// Test data helpers
// ============================================================================

const makeReaction = (overrides: Partial<{
  id: number;
  target_type: string;
  target_id: number;
  user_id: number;
  reaction_type: string;
  created_at: Date;
  users: { nickname: string | null };
}> = {}) => ({
  id: 1,
  target_type: 'practice',
  target_id: 10,
  user_id: 1,
  reaction_type: 'fire',
  created_at: new Date('2025-01-01T00:00:00Z'),
  users: { nickname: '王小明' },
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('Reaction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // upsertReaction
  // --------------------------------------------------------------------------

  describe('upsertReaction', () => {
    beforeEach(() => {
      prismaMock.practices.findUnique.mockResolvedValue(null);
    });

    it('新增反應並回傳更新後計數', async () => {
      const reaction = makeReaction();

      prismaMock.reactions.upsert.mockResolvedValue(reaction as any);
      prismaMock.reactions.findMany.mockResolvedValue([reaction] as any);
      prismaMock.reactions.findUnique.mockResolvedValue({
        reaction_type: 'fire',
      } as any);

      const result = await upsertReaction({
        targetType: 'practice',
        targetId: 10,
        userId: 1,
        reactionType: 'fire',
      });

      expect(prismaMock.reactions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            target_type: 'practice',
            target_id: 10,
            user_id: 1,
            reaction_type: 'fire',
          }),
          update: { reaction_type: 'fire' },
        }),
      );

      expect(result.success).toBe(true);
      expect(result.data.currentUserReaction).toBe('fire');
      const fireCount = result.data.reactions.find((r) => r.type === 'fire');
      expect(fireCount?.count).toBe(1);
      expect(fireCount?.latestActorName).toBe('王小明');
    });

    it('DB 錯誤時拋出 InternalServerError', async () => {
      prismaMock.reactions.upsert.mockRejectedValue(new Error('DB error'));

      await expect(
        upsertReaction({
          targetType: 'practice',
          targetId: 10,
          userId: 1,
          reactionType: 'fire',
        }),
      ).rejects.toThrow('新增反應失敗');
    });
  });

  // --------------------------------------------------------------------------
  // removeReaction
  // --------------------------------------------------------------------------

  describe('removeReaction', () => {
    it('刪除反應並回傳更新後計數（計數歸零）', async () => {
      prismaMock.reactions.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.reactions.findMany.mockResolvedValue([]);
      prismaMock.reactions.findUnique.mockResolvedValue(null);

      const result = await removeReaction({
        targetType: 'practice',
        targetId: 10,
        userId: 1,
      });

      expect(prismaMock.reactions.deleteMany).toHaveBeenCalledWith({
        where: { target_type: 'practice', target_id: 10, user_id: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.data.currentUserReaction).toBeNull();
      result.data.reactions.forEach((r) => {
        expect(r.count).toBe(0);
      });
    });

    it('DB 錯誤時拋出 InternalServerError', async () => {
      prismaMock.reactions.deleteMany.mockRejectedValue(new Error('DB error'));

      await expect(
        removeReaction({ targetType: 'practice', targetId: 10, userId: 1 }),
      ).rejects.toThrow('刪除反應失敗');
    });
  });

  // --------------------------------------------------------------------------
  // getReactionsByTarget
  // --------------------------------------------------------------------------

  describe('getReactionsByTarget', () => {
    it('回傳 4 種類型的計數（含未使用的類型計數為 0）', async () => {
      const reactions = [
        makeReaction({ reaction_type: 'fire', user_id: 1, users: { nickname: '王小明' } }),
        makeReaction({ id: 2, reaction_type: 'fire', user_id: 2, users: { nickname: '李大華' } }),
        makeReaction({ id: 3, reaction_type: 'curious', user_id: 3, users: { nickname: '陳美美' } }),
      ];

      prismaMock.reactions.findMany.mockResolvedValue(reactions as any);
      prismaMock.reactions.findUnique.mockResolvedValue({
        reaction_type: 'fire',
      } as any);

      const result = await getReactionsByTarget({
        targetType: 'practice',
        targetId: 10,
        currentUserId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.reactions).toHaveLength(6); // 固定 6 種類型

      const fire = result.data.reactions.find((r) => r.type === 'fire');
      expect(fire?.count).toBe(2);
      expect(fire?.latestActorName).toBe('王小明'); // 最新（第一筆）

      const curious = result.data.reactions.find((r) => r.type === 'curious');
      expect(curious?.count).toBe(1);

      const useful = result.data.reactions.find((r) => r.type === 'useful');
      expect(useful?.count).toBe(0);
      expect(useful?.latestActorName).toBeNull();

      expect(result.data.currentUserReaction).toBe('fire');
    });

    it('未登入時 currentUserReaction 為 null', async () => {
      prismaMock.reactions.findMany.mockResolvedValue([]);

      const result = await getReactionsByTarget({
        targetType: 'practice',
        targetId: 10,
        currentUserId: null,
      });

      expect(result.data.currentUserReaction).toBeNull();
      // findUnique 不應被呼叫（未登入無需查詢）
      expect(prismaMock.reactions.findUnique).not.toHaveBeenCalled();
    });

    it('DB 錯誤時拋出 InternalServerError', async () => {
      prismaMock.reactions.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        getReactionsByTarget({ targetType: 'practice', targetId: 10 }),
      ).rejects.toThrow('取得反應資料失敗');
    });
  });

  // --------------------------------------------------------------------------
  // getReactionsListByTarget
  // --------------------------------------------------------------------------

  describe('getReactionsListByTarget', () => {
    it('回傳反應列表，含用戶資訊', async () => {
      const reactions = [
        {
          id: 1,
          target_type: 'practice',
          target_id: 10,
          user_id: 1,
          reaction_type: 'fire',
          created_at: new Date('2025-01-01T00:00:00Z'),
          users: {
            external_id: 'ext-001',
            nickname: '王小明',
            contacts: { photo_url: 'https://example.com/photo1.jpg' },
          },
        },
        {
          id: 2,
          target_type: 'practice',
          target_id: 10,
          user_id: 2,
          reaction_type: 'curious',
          created_at: new Date('2025-01-02T00:00:00Z'),
          users: {
            external_id: 'ext-002',
            nickname: '李大華',
            contacts: null,
          },
        },
      ];

      prismaMock.reactions.findMany.mockResolvedValue(reactions as any);

      const result = await getReactionsListByTarget({
        targetType: 'practice',
        targetId: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(2);

      const firstItem = result.data.items[0];
      expect(firstItem.userId).toBe('ext-001');
      expect(firstItem.name).toBe('王小明');
      expect(firstItem.photoURL).toBe('https://example.com/photo1.jpg');
      expect(firstItem.reactionType).toBe('fire');
      expect(firstItem.reactedAt).toBe('2025-01-01T00:00:00.000Z');

      const secondItem = result.data.items[1];
      expect(secondItem.userId).toBe('ext-002');
      expect(secondItem.name).toBe('李大華');
      expect(secondItem.photoURL).toBeNull();
      expect(secondItem.reactionType).toBe('curious');
    });

    it('空列表時回傳空陣列', async () => {
      prismaMock.reactions.findMany.mockResolvedValue([]);

      const result = await getReactionsListByTarget({
        targetType: 'practice',
        targetId: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toEqual([]);
    });

    it('DB 錯誤時拋出 InternalServerError', async () => {
      prismaMock.reactions.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        getReactionsListByTarget({ targetType: 'practice', targetId: 10 }),
      ).rejects.toThrow('取得反應列表失敗');
    });
  });
});
