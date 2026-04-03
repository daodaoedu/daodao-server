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

const mockCreateEvent = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: {
    createEvent: (...args: unknown[]) => mockCreateEvent(...args),
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

describe('createComment — mention notifications', () => {
  const baseParams = {
    targetType: 'practice' as const,
    targetId: 'ext-123',
    content: '嗨 @alice 你好',
    userId: 1,
  };

  // mockGetTargetEntity default: { id: 10, user_id: 2 }

  function setupCommentCreate(commentId = 99) {
    setupTransactionMock(); // uses the existing project helper
    prismaMock.comments.create.mockResolvedValue(makeDbComment({ id: commentId, user_id: 1 }));
    prismaMock.comments.findUnique.mockResolvedValue(null); // no parent
  }

  beforeEach(() => {
    mockCreateEvent.mockClear();
  });

  it('對 mentionedUserIds 裡的每個有效 userId 建立 mention 事件', async () => {
    setupCommentCreate();
    prismaMock.users.findMany.mockResolvedValue([
      { id: 3, nickname: 'charlie' },
      { id: 4, nickname: 'diana' },
    ] as Awaited<ReturnType<typeof prismaMock.users.findMany>>);

    await commentService.createComment({ ...baseParams, mentionedUserIds: [3, 4] });

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(2);
    expect(mentionCalls[0][0]).toMatchObject({
      type: 'mention',
      actorId: 1,
      recipientId: 3,
      entityType: 'comment',
      priority: 'P1',
    });
  });

  it('跳過 commenter 自己（自我 mention）', async () => {
    setupCommentCreate();
    prismaMock.users.findMany.mockResolvedValue([
      { id: 1, nickname: 'alice' },
    ] as Awaited<ReturnType<typeof prismaMock.users.findMany>>);

    await commentService.createComment({ ...baseParams, mentionedUserIds: [1] });

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(0);
  });

  it('跳過 target owner（已有 comment 通知，避免重複）', async () => {
    // target owner = 2 (mockGetTargetEntity default)
    setupCommentCreate();
    prismaMock.users.findMany.mockResolvedValue([
      { id: 2, nickname: 'bob' },
    ] as Awaited<ReturnType<typeof prismaMock.users.findMany>>);

    await commentService.createComment({ ...baseParams, mentionedUserIds: [2] });

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(0);
  });

  it('不存在的 userId 不發送通知', async () => {
    setupCommentCreate();
    prismaMock.users.findMany.mockResolvedValue(
      [] as Awaited<ReturnType<typeof prismaMock.users.findMany>>
    );

    await commentService.createComment({ ...baseParams, mentionedUserIds: [999] });

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(0);
  });

  it('未提供 mentionedUserIds 時不發送 mention 通知', async () => {
    setupCommentCreate();

    await commentService.createComment(baseParams); // no mentionedUserIds

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(0);
  });
});

// ============================================================================
// updateComment — mention notifications (Task 4.2 regression)
// ============================================================================

describe('updateComment — mention notifications', () => {
  const existingComment = makeDbComment({ id: 1, user_id: 1, content: '原始留言', target_type: 'practice', target_id: 10 });
  const updatedComment = makeDbComment({ id: 1, user_id: 1, content: '修改後 @alice 你好', target_type: 'practice', target_id: 10 });

  function setupUpdate() {
    jest.clearAllMocks();
    setupTransactionMock();
    prismaMock.comments.findUnique.mockResolvedValue(existingComment as any);
    prismaMock.comments.update.mockResolvedValue(updatedComment as any);
  }

  it('提供 mentionedUserIds 且使用者未被通知過 → 建立 mention P1 事件', async () => {
    setupUpdate();
    // 尚未有 mention 通知記錄
    prismaMock.notification_events.findMany.mockResolvedValue([] as any);
    prismaMock.users.findMany.mockResolvedValue([{ id: 3 }] as any);

    await commentService.updateComment({
      commentId: 1,
      userId: 1,
      content: '修改後 @alice 你好',
      mentionedUserIds: [3],
    });

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(1);
    expect(mentionCalls[0][0]).toMatchObject({
      type: 'mention',
      actorId: 1,
      recipientId: 3,
      entityType: 'comment',
      entityId: 1,
      priority: 'P1',
    });
  });

  it('使用者已被通知過（diff 比對）→ 不重複發送 mention 事件', async () => {
    setupUpdate();
    // 使用者 3 已有通知記錄
    prismaMock.notification_events.findMany.mockResolvedValue([
      { recipient_id: 3 },
    ] as any);
    prismaMock.users.findMany.mockResolvedValue([{ id: 3 }] as any);

    await commentService.updateComment({
      commentId: 1,
      userId: 1,
      content: '修改後 @alice 你好',
      mentionedUserIds: [3],
    });

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(0);
  });

  it('commenter 自己的 mention → 不發送', async () => {
    setupUpdate();
    prismaMock.notification_events.findMany.mockResolvedValue([] as any);
    prismaMock.users.findMany.mockResolvedValue([{ id: 1 }] as any);

    await commentService.updateComment({
      commentId: 1,
      userId: 1,
      content: '修改後 @self 你好',
      mentionedUserIds: [1],
    });

    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(0);
  });

  it('未提供 mentionedUserIds → 不查詢 notification_events，不發送事件', async () => {
    setupUpdate();

    await commentService.updateComment({
      commentId: 1,
      userId: 1,
      content: '修改後留言',
    });

    expect(prismaMock.notification_events.findMany).not.toHaveBeenCalled();
    const mentionCalls = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'mention'
    );
    expect(mentionCalls).toHaveLength(0);
  });

  it('mentionedUserIds 數量超過 @ 符號數 → 記 warn 且只取安全數量', async () => {
    const { loggerService } = jest.requireMock('@/services/logging/logger.service');
    setupUpdate();
    prismaMock.notification_events.findMany.mockResolvedValue([] as any);
    prismaMock.users.findMany.mockResolvedValue([{ id: 3 }] as any);

    // content 只有 1 個 @，但傳了 3 個 mentionedUserIds
    await commentService.updateComment({
      commentId: 1,
      userId: 1,
      content: '只有 @one 一個',
      mentionedUserIds: [3, 4, 5],
    });

    expect(loggerService.warn).toHaveBeenCalledWith(
      expect.stringContaining('mentionedUserIds count exceeds @mentions in content'),
      expect.anything()
    );
  });
});

// ============================================================================
// createComment — comment_reply notifications
// ============================================================================

describe('createComment — comment_reply notifications', () => {
  function setupReplyCreate(parentUserId: number, actorUserId: number) {
    jest.clearAllMocks();
    setupTransactionMock();
    mockGetTargetEntity.mockResolvedValue({ id: 10, user_id: 99 }); // entity owner is user 99
    prismaMock.practices.findUnique.mockResolvedValue({ external_id: 'ext-10' } as any);
    prismaMock.comments.create.mockResolvedValue(
      makeDbComment({ id: 5, user_id: actorUserId }) as any
    );
    // parentComment is owned by parentUserId
    prismaMock.comments.findUnique.mockResolvedValue(
      makeDbComment({ id: 2, parent_id: null, target_id: 10, user_id: parentUserId }) as any
    );
  }

  it('回覆他人留言 → 觸發 comment_reply 通知', async () => {
    setupReplyCreate(/* parentUserId */ 3, /* actorUserId */ 1);

    await commentService.createComment({
      targetType: 'practice',
      targetId: 'ext-10',
      content: '回覆測試',
      userId: 1,
      parentId: 2,
    });

    const replyNotifications = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'comment_reply'
    );
    expect(replyNotifications).toHaveLength(1);
    expect(replyNotifications[0][0]).toMatchObject({
      type: 'comment_reply',
      actorId: 1,
      recipientId: 3,
      entityType: 'comment',
      entityId: 5,
      priority: 'P2',
      payload: expect.objectContaining({
        parent_comment_id: 2,
        entity_external_id: 'ext-10',
      }),
    });
  });

  it('回覆自己留言 → createEvent 以 actorId===recipientId 呼叫（由 notificationEventService 內部過濾）', async () => {
    // actorUserId === parentUserId === 1
    setupReplyCreate(/* parentUserId */ 1, /* actorUserId */ 1);

    await commentService.createComment({
      targetType: 'practice',
      targetId: 'ext-10',
      content: '自己回覆自己',
      userId: 1,
      parentId: 2,
    });

    // 呼叫端不做 self-filter，由 notificationEventService 內部處理
    // 所以 createEvent 會被呼叫，且 actorId === recipientId === 1
    const replyNotifications = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'comment_reply'
    );
    expect(replyNotifications).toHaveLength(1);
    expect(replyNotifications[0][0]).toMatchObject({
      actorId: 1,
      recipientId: 1,
    });
  });

  it('被回覆者同時是內容擁有者 → 收到兩筆通知（comment + comment_reply）', async () => {
    // entity owner = user 2, parentComment owner = user 2
    jest.clearAllMocks();
    setupTransactionMock();
    mockGetTargetEntity.mockResolvedValue({ id: 10, user_id: 2 }); // entity owner is user 2
    prismaMock.practices.findUnique.mockResolvedValue({ title: '我的練習', external_id: 'ext-10' } as any);
    prismaMock.comments.create.mockResolvedValue(
      makeDbComment({ id: 5, user_id: 1 }) as any
    );
    // parentComment is owned by user 2 (same as entity owner)
    prismaMock.comments.findUnique.mockResolvedValue(
      makeDbComment({ id: 2, parent_id: null, target_id: 10, user_id: 2 }) as any
    );

    await commentService.createComment({
      targetType: 'practice',
      targetId: 'ext-10',
      content: '回覆同時也是內容擁有者',
      userId: 1,
      parentId: 2,
    });

    const commentNotifications = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'comment'
    );
    const replyNotifications = mockCreateEvent.mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'comment_reply'
    );
    expect(commentNotifications).toHaveLength(1);
    expect(commentNotifications[0][0]).toMatchObject({ recipientId: 2 });
    expect(replyNotifications).toHaveLength(1);
    expect(replyNotifications[0][0]).toMatchObject({ recipientId: 2 });
  });
});

// ============================================================================
// checkin comments
// ============================================================================

describe('checkin comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  it('should create comment on checkin target', async () => {
    // idConverter returns checkin entity
    mockGetTargetEntity.mockResolvedValue({ id: 50, user_id: 2 });

    const created = makeDbComment({
      target_type: 'checkin',
      target_id: 50,
      user_id: 1,
    });
    prismaMock.comments.create.mockResolvedValue(created as any);

    const result = await commentService.createComment({
      targetType: 'checkin',
      targetId: '50',
      content: '打卡留言',
      userId: 1,
    });

    expect(result.success).toBe(true);
    expect(prismaMock.comments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          target_type: 'checkin',
          target_id: 50,
          user_id: 1,
        }),
      }),
    );
  });
});
