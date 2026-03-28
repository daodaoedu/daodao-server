/**
 * 通知系統：後端事件流程測試（12.1, 12.2, 12.6-12.9）
 *
 * 涵蓋範圍：
 * - 12.1 留言事件：用戶 A 留言 → notification_events 寫入 → 下一批次 notifications 寫入 → In-App 顯示
 * - 12.2 P2 聚合：4 人對同一文章按讚 → aggregation_count=4（通知顯示「A 與其他 3 人按了讚」）
 * - 12.6 冪等性：批次 worker 重啟後不重複寫入已 processed_at 的事件
 * - 12.7 自我互動過濾：用戶對自己的內容按讚不產生通知（regression test）
 * - 12.8 主題實踐被關注通知：follow.service → PracticeFollowed P2 通知給實踐擁有者
 * - 12.9 Buddy 請求追蹤者 fan-out：被請求方收到 P1 + 請求者所有追蹤者各自收到 P1
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

jest.mock('@/queues/connection', () => ({
  getQueueConnection: jest.fn().mockReturnValue({}),
}));

jest.mock('@/queues/notification.queue', () => ({
  NOTIFICATION_INAPP_QUEUE_NAME: 'notification-inapp',
}));

// ─── Worker mock ─────────────────────────────────────────────────────────────

let capturedInAppProcessor: ((job: { id: string }) => Promise<void>) | null = null;

const mockWorkerInstance = {
  on: jest.fn().mockReturnThis(),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(
    (_name: string, processor: (job: { id: string }) => Promise<void>) => {
      capturedInAppProcessor = processor;
      return mockWorkerInstance;
    },
  ),
}));

// ─── Comment / Follow / BuddyRequest service mocks ──────────────────────────

const mockCreateEvent = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: {
    createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  },
}));

jest.mock('@/services/interaction-count.service', () => ({
  interactionCountService: {
    increment: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/response-helper', () => ({
  createSuccessResponse: jest.fn().mockImplementation((data: unknown) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  })),
}));

// follow.service imports id-converter
const mockExternalToInternalId = jest.fn();
jest.mock('@/services/id-converter.service', () => {
  const mockIdConverter = {
    getTargetEntity: jest.fn().mockResolvedValue({ id: 10, user_id: 2 }),
  };
  return {
    __esModule: true,
    default: mockIdConverter,
    externalToInternalId: (...args: unknown[]) => mockExternalToInternalId(...args),
  };
});

// social queue for fan-out (used by follow.service)
jest.mock('@/queues/social-notification.queue', () => ({
  enqueueSocialNotification: jest.fn().mockResolvedValue(undefined),
  bulkEnqueueSocialNotifications: jest.fn().mockResolvedValue(undefined),
}));

// ─── Import services after mocking ───────────────────────────────────────────

import { createNotificationInAppWorker } from '@/queues/notification-inapp.worker';

// ============================================================================
// Helpers
// ============================================================================

const makeJob = (id = 'job-1') => ({ id });

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: Math.floor(Math.random() * 100_000),
  type: 'Reaction',
  actor_id: 1,
  recipient_id: 2,
  entity_type: 'practice',
  entity_id: 10,
  priority: 'P2',
  payload: null,
  created_at: new Date('2025-01-01T10:00:00Z'),
  processed_at: null,
  ...overrides,
});

// ============================================================================
// 12.6 冪等性：已 processed_at 的事件不重複寫入
// ============================================================================

describe('12.6 冪等性：批次 worker 重啟後不重複寫入已處理事件', () => {
  beforeAll(() => {
    createNotificationInAppWorker();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('查詢 notification_events 時 WHERE 條件包含 processed_at: null', async () => {
    prismaMock.notification_events.findMany.mockResolvedValue([]);

    await capturedInAppProcessor!(makeJob());

    const call = prismaMock.notification_events.findMany.mock.calls[0][0] as any;
    expect(call.where.processed_at).toBeNull();
  });

  it('已有 processed_at 的事件不會出現在待處理批次中（worker 僅查詢 processed_at=null）', async () => {
    // 模擬所有事件都已被處理（processed_at 不為 null），findMany 回傳空陣列
    prismaMock.notification_events.findMany.mockResolvedValue([]);

    await capturedInAppProcessor!(makeJob());

    // 不應建立任何 notification
    expect(prismaMock.notifications.create).not.toHaveBeenCalled();
    // 不應再次標記 processed_at
    expect(prismaMock.notification_events.updateMany).not.toHaveBeenCalled();
  });

  it('worker 處理後標記 processed_at，再次執行時同一事件不被重複處理', async () => {
    // 第一次執行：有一筆未處理事件
    const event = makeEvent({ id: 101, priority: 'P1', type: 'comment' });
    prismaMock.notification_events.findMany
      .mockResolvedValueOnce([event] as any)  // 第一次：有事件
      .mockResolvedValueOnce([]);              // 第二次：已處理（filtered by processed_at=null）

    prismaMock.notifications.create.mockResolvedValue({} as any);
    prismaMock.notification_events.updateMany.mockResolvedValue({ count: 1 } as any);

    // 第一次執行
    await capturedInAppProcessor!(makeJob('job-1'));
    expect(prismaMock.notifications.create).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // 第二次執行（模擬 worker 重啟）
    await capturedInAppProcessor!(makeJob('job-2'));
    expect(prismaMock.notifications.create).not.toHaveBeenCalled();
  });

  it('批次結束後 processedIds 全部寫入 processed_at', async () => {
    const events = [
      makeEvent({ id: 201, priority: 'P1', type: 'comment' }),
      makeEvent({ id: 202, priority: 'P1', type: 'BuddyRequest' }),
    ];
    prismaMock.notification_events.findMany.mockResolvedValue(events as any);
    prismaMock.notifications.create.mockResolvedValue({} as any);
    prismaMock.notification_events.updateMany.mockResolvedValue({ count: 2 } as any);

    await capturedInAppProcessor!(makeJob());

    expect(prismaMock.notification_events.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: expect.arrayContaining([201, 202]) } },
        data:  { processed_at: expect.any(Date) },
      }),
    );
  });
});

// ============================================================================
// 12.7 自我互動過濾（regression）
// ============================================================================

describe('12.7 自我互動過濾：actor === recipient 不產生通知', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('comment.service：留言者對自己的內容留言時，createEvent 仍被呼叫（過濾由 notificationEventService 負責）', async () => {
    // 自我互動過濾的責任在 notification-event.service（已有獨立測試）
    // 此 regression test 確保 comment.service 正確傳遞 actorId 與 recipientId，
    // 讓 notificationEventService 可以做出正確的過濾判斷。

    setupTransactionMock();
    prismaMock.comments.findUnique.mockResolvedValue(null);
    prismaMock.practices.findUnique.mockResolvedValue({ title: '自己的實踐', id: 10 } as any);
    prismaMock.comments.create.mockResolvedValue({
      id: 1,
      target_type: 'practice',
      target_id: 10,
      user_id: 5,
      content: '我的留言',
      visibility: null,
      parent_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      users: {
        id: 5,
        nickname: '用戶5',
        external_id: 'ext-5',
        contacts: { photo_url: null, email: 'u5@test.com' },
        basic_info: null,
        user_positions: [],
      },
    } as any);

    const idConverter = jest.requireMock('@/services/id-converter.service') as any;
    // targetEntity.user_id = 5（與 userId=5 相同，即自我留言）
    idConverter.default.getTargetEntity.mockResolvedValue({ id: 10, user_id: 5 });

    const { commentService } = await import('@/services/comment.service');
    await commentService.createComment({
      content:    '我的留言',
      targetType: 'practice',
      targetId:   'ext-10',
      userId:     5,
    });

    // createEvent 被呼叫，actorId === recipientId === 5
    // 實際過濾邏輯在 notification-event.service 內（actor === recipient → 跳過）
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 5, recipientId: 5 }),
    );
  });
});

// ============================================================================
// 12.1 留言事件流程
// ============================================================================

describe('12.1 留言事件：用戶 A 留言 → notification_events 寫入 → In-App 顯示', () => {
  beforeAll(() => {
    setupTransactionMock();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  it('createComment 後觸發 createEvent（type=comment，recipientId=內容擁有者）', async () => {
    // 設定 mock 回傳值
    prismaMock.comments.findUnique.mockResolvedValue(null); // no parent
    prismaMock.practices.findUnique.mockResolvedValue({ title: '測試實踐', id: 10 } as any);
    (prismaMock.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      if (typeof fn === 'function') {
        return fn(prismaMock);
      }
      return Promise.all(fn);
    });
    prismaMock.comments.create.mockResolvedValue({
      id: 999,
      target_type: 'practice',
      target_id: 10,
      user_id: 1,
      content: '這是一則留言',
      visibility: null,
      parent_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      users: {
        id: 1,
        nickname: '用戶A',
        external_id: 'ext-1',
        contacts: { photo_url: null, email: 'a@test.com' },
        basic_info: null,
        user_positions: [],
      },
    } as any);

    const idConverter = jest.requireMock('@/services/id-converter.service') as any;
    idConverter.default.getTargetEntity.mockResolvedValue({ id: 10, user_id: 2 });

    const { commentService } = await import('@/services/comment.service');
    await commentService.createComment({
      content:    '這是一則留言',
      targetType: 'practice',
      targetId:   'ext-10',
      userId:     1,
    });

    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type:        'comment',
        actorId:     1,
        recipientId: 2,
        entityType:  'comment',
        entityId:    999,
        priority:    'P2',
      }),
    );
  });

  it('inapp worker 批次處理後在 notifications 表建立留言通知記錄', async () => {
    const commentEvent = makeEvent({
      id: 301,
      type: 'comment',
      actor_id: 1,
      recipient_id: 2,
      entity_type: 'comment',
      entity_id: 999,
      priority: 'P2',
    });

    prismaMock.notification_events.findMany.mockResolvedValue([commentEvent] as any);
    prismaMock.notifications.create.mockResolvedValue({} as any);
    prismaMock.notification_events.updateMany.mockResolvedValue({ count: 1 } as any);

    await capturedInAppProcessor!(makeJob());

    expect(prismaMock.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type:        'comment',
          recipient_id: 2,
          actor_id:     1,
          entity_type:  'comment',
          entity_id:    999,
          priority:     'P2',
        }),
      }),
    );
  });
});

// ============================================================================
// 12.2 P2 聚合：4 人在 1 小時內對同一文章按讚
// ============================================================================

describe('12.2 P2 聚合：4 人對同一文章按讚 → 通知顯示「A 與其他 3 人按了讚」', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('4 筆 Reaction 事件（同一 entity）合併為 1 筆 notification，aggregation_count=4', async () => {
    const now = new Date('2025-01-01T10:00:00Z');
    const events = [
      makeEvent({ id: 401, type: 'Reaction', entity_type: 'practice', entity_id: 50, actor_id: 10, created_at: new Date(now.getTime() + 0), priority: 'P2' }),
      makeEvent({ id: 402, type: 'Reaction', entity_type: 'practice', entity_id: 50, actor_id: 11, created_at: new Date(now.getTime() + 10 * 60_000), priority: 'P2' }),
      makeEvent({ id: 403, type: 'Reaction', entity_type: 'practice', entity_id: 50, actor_id: 12, created_at: new Date(now.getTime() + 30 * 60_000), priority: 'P2' }),
      makeEvent({ id: 404, type: 'Reaction', entity_type: 'practice', entity_id: 50, actor_id: 13, created_at: new Date(now.getTime() + 59 * 60_000), priority: 'P2' }),
    ];

    prismaMock.notification_events.findMany.mockResolvedValue(events as any);
    prismaMock.notifications.create.mockResolvedValue({} as any);
    prismaMock.notification_events.updateMany.mockResolvedValue({ count: 4 } as any);

    await capturedInAppProcessor!(makeJob());

    // 4 筆事件合併為 1 筆
    expect(prismaMock.notifications.create).toHaveBeenCalledTimes(1);

    // aggregation_count = 4（前端用來顯示「A 與其他 3 人按了讚」）
    expect(prismaMock.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aggregation_count: 4,
          type: 'Reaction',
          entity_id: 50,
          priority: 'P2',
        }),
      }),
    );
  });

  it('最新按讚者（actor_id=13）為通知的代表 actor', async () => {
    const now = new Date('2025-01-01T10:00:00Z');
    const events = [
      makeEvent({ id: 411, type: 'Reaction', entity_id: 50, actor_id: 10, created_at: new Date(now.getTime() + 0), priority: 'P2' }),
      makeEvent({ id: 412, type: 'Reaction', entity_id: 50, actor_id: 11, created_at: new Date(now.getTime() + 10 * 60_000), priority: 'P2' }),
      makeEvent({ id: 413, type: 'Reaction', entity_id: 50, actor_id: 12, created_at: new Date(now.getTime() + 30 * 60_000), priority: 'P2' }),
      makeEvent({ id: 414, type: 'Reaction', entity_id: 50, actor_id: 13, created_at: new Date(now.getTime() + 59 * 60_000), priority: 'P2' }), // 最新
    ];

    prismaMock.notification_events.findMany.mockResolvedValue(events as any);
    prismaMock.notifications.create.mockResolvedValue({} as any);
    prismaMock.notification_events.updateMany.mockResolvedValue({ count: 4 } as any);

    await capturedInAppProcessor!(makeJob());

    expect(prismaMock.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actor_id: 13 }),
      }),
    );
  });

  it('4 筆事件的 id 全部標記 processed_at', async () => {
    const events = [
      makeEvent({ id: 421, type: 'Reaction', entity_id: 50, priority: 'P2' }),
      makeEvent({ id: 422, type: 'Reaction', entity_id: 50, priority: 'P2' }),
      makeEvent({ id: 423, type: 'Reaction', entity_id: 50, priority: 'P2' }),
      makeEvent({ id: 424, type: 'Reaction', entity_id: 50, priority: 'P2' }),
    ];

    prismaMock.notification_events.findMany.mockResolvedValue(events as any);
    prismaMock.notifications.create.mockResolvedValue({} as any);
    prismaMock.notification_events.updateMany.mockResolvedValue({ count: 4 } as any);

    await capturedInAppProcessor!(makeJob());

    const updateCall = prismaMock.notification_events.updateMany.mock.calls[0][0] as any;
    expect(updateCall.where.id.in).toEqual(expect.arrayContaining([421, 422, 423, 424]));
  });
});

// ============================================================================
// 12.8 主題實踐被關注通知
// ============================================================================

describe('12.8 主題實踐被關注通知：用戶 A 關注主題實踐 P → 實踐擁有者 B 收到 P2 PracticeFollowed 通知', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExternalToInternalId.mockResolvedValue(10);
    prismaMock.follows.upsert.mockResolvedValue({} as any);
    prismaMock.users.findUnique.mockResolvedValue({ nickname: '用戶A', id: 1 } as any);
  });

  it('followPractice 成功後觸發 PracticeFollowed createEvent', async () => {
    prismaMock.practices.findUnique.mockResolvedValue({
      user_id: 2, // 實踐擁有者為用戶 B
      title: '我的實踐計畫',
    } as any);

    const { followService } = await import('@/services/follow.service');
    await followService.followPractice(1, 'ext-practice-10');

    // fire-and-forget，需等待 microtask
    await Promise.resolve();

    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type:        'PracticeFollowed',
        actorId:     1,
        recipientId: 2,
        entityType:  'practice',
        entityId:    10,
        priority:    'P2',
      }),
    );
  });

  it('followPractice 呼叫 createEvent 時 payload 含 practice_title', async () => {
    prismaMock.practices.findUnique.mockResolvedValue({
      user_id: 2,
      title: '我的實踐計畫',
    } as any);

    const { followService } = await import('@/services/follow.service');
    await followService.followPractice(1, 'ext-practice-10');

    await Promise.resolve();

    const call = mockCreateEvent.mock.calls.find(
      (c: any[]) => c[0]?.type === 'PracticeFollowed',
    );
    expect(call).toBeDefined();
    expect(call![0].payload).toMatchObject({ practice_title: '我的實踐計畫' });
  });

  it('自我關注（owner=followerId）不觸發 PracticeFollowed 事件', async () => {
    prismaMock.practices.findUnique.mockResolvedValue({
      user_id: 1, // owner === follower
      title: '自己的實踐',
    } as any);

    const { followService } = await import('@/services/follow.service');

    await expect(followService.followPractice(1, 'ext-practice-10')).rejects.toThrow(
      '無法關注自己的主題實踐',
    );

    expect(mockCreateEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PracticeFollowed' }),
    );
  });
});

// ============================================================================
// 12.9 Buddy 請求追蹤者 fan-out
// ============================================================================

describe('12.9 Buddy 請求追蹤者 fan-out', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // buddy-request.service 用 findFirst 查 practice 與 receiver
    prismaMock.practices.findFirst.mockResolvedValue({
      id: 10,
      title: '雙人實踐計畫',
    } as any);
    prismaMock.users.findFirst.mockResolvedValue({ id: 2 } as any);
    prismaMock.practice_buddy_requests.findFirst.mockResolvedValue(null);
    prismaMock.practice_buddy_requests.create.mockResolvedValue({ id: 99 } as any);
  });

  it('被請求方收到 P1 BuddyRequest 事件', async () => {
    prismaMock.follows.findMany.mockResolvedValue([]); // 無追蹤者

    const { buddyRequestService } = await import('@/services/buddy-request.service');
    await buddyRequestService.createBuddyRequest(1, 'ext-practice-10', 'ext-user-2');

    await Promise.resolve();

    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type:        'BuddyRequest',
        actorId:     1,
        recipientId: 2,
        entityType:  'buddy_request',
        entityId:    99,
        priority:    'P1',
      }),
    );
  });

  it('請求者的每位追蹤者各自收到 P1 BuddyRequestFollower 事件', async () => {
    prismaMock.follows.findMany.mockResolvedValue([
      { follower_id: 10 } as any,
      { follower_id: 11 } as any,
      { follower_id: 12 } as any,
    ]);

    const { buddyRequestService } = await import('@/services/buddy-request.service');
    await buddyRequestService.createBuddyRequest(1, 'ext-practice-10', 'ext-user-2');

    await Promise.resolve();

    const fanoutCalls = mockCreateEvent.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'BuddyRequestFollower',
    );
    expect(fanoutCalls).toHaveLength(3);

    const recipients = fanoutCalls.map((c: any[]) => c[0].recipientId);
    expect(recipients).toEqual(expect.arrayContaining([10, 11, 12]));

    fanoutCalls.forEach((c: any[]) => {
      expect(c[0]).toMatchObject({
        actorId:    1,
        entityType: 'buddy_request',
        entityId:   99,
        priority:   'P1',
      });
    });
  });

  it('追蹤者 fan-out 與 BuddyRequest 通知各自獨立傳送（總 createEvent 呼叫次數 = 1 + N 追蹤者）', async () => {
    prismaMock.follows.findMany.mockResolvedValue([
      { follower_id: 20 } as any,
      { follower_id: 21 } as any,
    ]);

    const { buddyRequestService } = await import('@/services/buddy-request.service');
    await buddyRequestService.createBuddyRequest(1, 'ext-practice-10', 'ext-user-2');

    await Promise.resolve();

    // 1 BuddyRequest + 2 BuddyRequestFollower = 3 次
    expect(mockCreateEvent).toHaveBeenCalledTimes(3);
  });

  it('無追蹤者時只有 BuddyRequest 通知，無 fan-out', async () => {
    prismaMock.follows.findMany.mockResolvedValue([]);

    const { buddyRequestService } = await import('@/services/buddy-request.service');
    await buddyRequestService.createBuddyRequest(1, 'ext-practice-10', 'ext-user-2');

    await Promise.resolve();

    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'BuddyRequest' }),
    );
  });
});
