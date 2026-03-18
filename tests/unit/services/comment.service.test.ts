/**
 * Comment Service Unit Tests
 *
 * 涵蓋範圍：
 * - createComment：二層留言限制（parent 已有 parent_id 時拒絕）
 * - createComment：parent 不存在、parent 屬於不同 target
 * - updateComment：非擁有者禁止、留言不存在
 * - deleteComment：非擁有者禁止、留言不存在
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

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

// idConverter.getTargetEntity 預設回傳 practice { id: 10, user_id: 2 }
const mockGetTargetEntity = jest.fn().mockResolvedValue({ id: 10, user_id: 2 });

jest.mock('@/services/id-converter.service', () => ({
  __esModule: true,
  default: {
    getTargetEntity: (...args: unknown[]) => mockGetTargetEntity(...args),
  },
}));

import { commentService } from '@/services/comment.service';

// ============================================================================
// Test data helpers
// ============================================================================

const makeDbComment = (overrides: Partial<{
  id: number;
  target_type: string;
  target_id: number;
  user_id: number;
  content: string;
  visibility: string | null;
  parent_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  users: object;
}> = {}) => ({
  id: 1,
  target_type: 'practice',
  target_id: 10,
  user_id: 1,
  content: '測試留言',
  visibility: 'public',
  parent_id: null,
  created_at: new Date('2025-01-01T00:00:00Z'),
  updated_at: new Date('2025-01-01T00:00:00Z'),
  users: {
    id: 1,
    nickname: '王小明',
    external_id: 'ext-1',
    custom_id: 'user1',
    user_positions: [],
    contacts: null,
  },
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('Comment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    // 預設：practice 查外部 ID fallback
    prismaMock.practices.findUnique.mockResolvedValue({ external_id: 'ext-10' } as any);
  });

  // --------------------------------------------------------------------------
  // createComment — 二層限制
  // --------------------------------------------------------------------------

  describe('createComment — 二層留言限制', () => {
    it('parent 已有 parent_id（三層）時拋出 BadRequestError', async () => {
      // parent comment 本身也是 reply（parent_id = 5）
      const grandparentComment = makeDbComment({ id: 2, parent_id: 5 });
      prismaMock.comments.findUnique.mockResolvedValue(grandparentComment as any);

      await expect(
        commentService.createComment({
          targetType: 'practice',
          targetId: 'ext-10',
          content: '第三層留言',
          userId: 1,
          parentId: 2,
        }),
      ).rejects.toThrow('Replies cannot have their own replies');
    });

    it('parent 不存在時拋出 NotFoundError', async () => {
      prismaMock.comments.findUnique.mockResolvedValue(null);

      await expect(
        commentService.createComment({
          targetType: 'practice',
          targetId: 'ext-10',
          content: '回覆',
          userId: 1,
          parentId: 999,
        }),
      ).rejects.toThrow('Parent comment not found');
    });

    it('parent 屬於不同 target 時拋出 BadRequestError', async () => {
      // parent comment 屬於 target_id: 99（不同 target）
      const wrongTargetParent = makeDbComment({ id: 2, parent_id: null, target_id: 99 });
      prismaMock.comments.findUnique.mockResolvedValue(wrongTargetParent as any);

      await expect(
        commentService.createComment({
          targetType: 'practice',
          targetId: 'ext-10',
          content: '回覆',
          userId: 1,
          parentId: 2,
        }),
      ).rejects.toThrow('Parent comment does not belong to the same target entity');
    });

    it('無 parent 時正常建立 top-level 留言', async () => {
      const created = makeDbComment();
      prismaMock.comments.create.mockResolvedValue(created as any);

      const result = await commentService.createComment({
        targetType: 'practice',
        targetId: 'ext-10',
        content: '測試留言',
        userId: 1,
      });

      expect(result.success).toBe(true);
      expect(prismaMock.comments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            target_type: 'practice',
            target_id: 10,
            user_id: 1,
          }),
        }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // updateComment — 擁有者檢查
  // --------------------------------------------------------------------------

  describe('updateComment — 擁有者檢查', () => {
    it('留言不存在時拋出 NotFoundError', async () => {
      prismaMock.comments.findUnique.mockResolvedValue(null);

      await expect(
        commentService.updateComment({ commentId: 999, userId: 1, content: '修改' }),
      ).rejects.toThrow('Comment not found');
    });

    it('非擁有者嘗試更新時拋出 ForbiddenError', async () => {
      // 留言擁有者是 user 2，但請求者是 user 1
      const comment = makeDbComment({ user_id: 2 });
      prismaMock.comments.findUnique.mockResolvedValue(comment as any);

      await expect(
        commentService.updateComment({ commentId: 1, userId: 1, content: '修改' }),
      ).rejects.toThrow('You do not have permission to update this comment');
    });

    it('擁有者可成功更新留言', async () => {
      const comment = makeDbComment({ user_id: 1 });
      const updated = makeDbComment({ content: '修改後內容' });
      prismaMock.comments.findUnique.mockResolvedValue(comment as any);
      prismaMock.comments.update.mockResolvedValue(updated as any);

      const result = await commentService.updateComment({
        commentId: 1,
        userId: 1,
        content: '修改後內容',
      });

      expect(result.success).toBe(true);
      expect(prismaMock.comments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ content: '修改後內容' }),
        }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // getComments — 可見性過濾
  // --------------------------------------------------------------------------

  describe('getComments — 可見性過濾', () => {
    const publicComment = makeDbComment({ id: 1, user_id: 1, visibility: 'public' });
    const privateComment = makeDbComment({ id: 2, user_id: 1, visibility: 'private' });

    beforeEach(() => {
      // getTargetEntity returns practice { id: 10, user_id: 2 }
      mockGetTargetEntity.mockResolvedValue({ id: 10, user_id: 2 });
    });

    it('公開留言對未登入使用者可見', async () => {
      prismaMock.comments.findMany.mockResolvedValue([publicComment] as any);

      const result = await commentService.getComments({
        targetType: 'practice',
        targetId: 'ext-10',
        currentUser: null,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });

    it('私人留言對非擁有者、非 entity 擁有者不可見', async () => {
      prismaMock.comments.findMany.mockResolvedValue([privateComment] as any);

      const result = await commentService.getComments({
        targetType: 'practice',
        targetId: 'ext-10',
        currentUser: { id: 99, role: '1' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('私人留言對留言擁有者可見', async () => {
      prismaMock.comments.findMany.mockResolvedValue([privateComment] as any);

      const result = await commentService.getComments({
        targetType: 'practice',
        targetId: 'ext-10',
        currentUser: { id: 1, role: '1' }, // user_id 1 = comment owner
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(2);
    });

    it('私人留言對 entity 擁有者可見', async () => {
      prismaMock.comments.findMany.mockResolvedValue([privateComment] as any);

      const result = await commentService.getComments({
        targetType: 'practice',
        targetId: 'ext-10',
        currentUser: { id: 2, role: '1' }, // user_id 2 = entity owner (practice owner)
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(2);
    });

    it('Mentor（role=4）可以看到其學員的私人留言', async () => {
      const menteePrivateComment = makeDbComment({ id: 3, user_id: 5, visibility: 'private' });
      prismaMock.comments.findMany.mockResolvedValue([menteePrivateComment] as any);
      prismaMock.mentor_participants.findMany.mockResolvedValue([
        { mentor_id: 10, participant_id: 5 },
      ] as any);

      const result = await commentService.getComments({
        targetType: 'practice',
        targetId: 'ext-10',
        currentUser: { id: 10, role: '4' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // getCommentDetail — 修復後行為
  // --------------------------------------------------------------------------

  describe('getCommentDetail', () => {
    it('對有效 ID 回傳留言', async () => {
      const comment = makeDbComment({ id: 1, user_id: 1, visibility: 'public', target_id: 10 });
      prismaMock.comments.findUnique.mockResolvedValue(comment as any);
      // getTargetEntityByInternalId calls prisma.practices.findUnique with internal id
      prismaMock.practices.findUnique.mockResolvedValue({ id: 10, user_id: 2, external_id: 'ext-10' } as any);

      const result = await commentService.getCommentDetail(1, null);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });

    it('canViewComment 回傳 false 時拋出 ForbiddenError', async () => {
      const comment = makeDbComment({ id: 1, user_id: 1, visibility: 'private', target_id: 10 });
      prismaMock.comments.findUnique.mockResolvedValue(comment as any);
      // entity owner is user 2; requester is user 99 (unrelated)
      prismaMock.practices.findUnique.mockResolvedValue({ id: 10, user_id: 2, external_id: 'ext-10' } as any);

      await expect(
        commentService.getCommentDetail(1, { id: 99, role: '1' }),
      ).rejects.toThrow('You do not have permission to view this comment');
    });
  });

  // --------------------------------------------------------------------------
  // deleteComment — 擁有者檢查
  // --------------------------------------------------------------------------

  describe('deleteComment — 擁有者檢查', () => {
    it('留言不存在時拋出 NotFoundError', async () => {
      prismaMock.comments.findUnique.mockResolvedValue(null);

      await expect(
        commentService.deleteComment({ commentId: 999, userId: 1 }),
      ).rejects.toThrow('Comment not found');
    });

    it('非擁有者嘗試刪除時拋出 ForbiddenError', async () => {
      const comment = makeDbComment({ user_id: 2 });
      prismaMock.comments.findUnique.mockResolvedValue(comment as any);

      await expect(
        commentService.deleteComment({ commentId: 1, userId: 1 }),
      ).rejects.toThrow('You do not have permission to delete this comment');
    });

    it('擁有者可成功刪除留言', async () => {
      const comment = makeDbComment({ user_id: 1 });
      prismaMock.comments.findUnique.mockResolvedValue(comment as any);
      prismaMock.comments.delete.mockResolvedValue(comment as any);

      const result = await commentService.deleteComment({ commentId: 1, userId: 1 });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Comment deleted successfully');
      expect(prismaMock.comments.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
