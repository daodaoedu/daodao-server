/**
 * Buddy Request Service Unit Tests
 *
 * 涵蓋範圍：
 * - createBuddyRequest：practice/receiver 查無此筆、自我請求、重複請求、正常建立、通知事件、follower fan-out
 * - updateBuddyRequest：查無此筆、receiverId 不符、接受/忽略、BuddyAccepted 通知僅在接受時觸發
 * - getPendingIncoming：正確格式、分頁、依 receiverId 過濾
 */

import { prismaMock } from '@tests/utils/prisma-mock';
import { setupTransactionMock } from '@tests/utils/prisma-mock';

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

const mockCreateEvent = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: {
    createEvent: mockCreateEvent,
  },
}));

jest.mock('@/utils/response-helper', () => ({
  createSuccessResponse: jest.fn().mockImplementation((data: unknown) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  })),
  createPaginatedResponse: jest.fn().mockImplementation((data: unknown, pagination: unknown) => ({
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  })),
}));

jest.mock('@/utils/pagination-helper', () => ({
  calculatePagination: jest.fn().mockImplementation((page, limit, total) => ({
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit,
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  })),
}));

jest.mock('@/middleware/error.middleware', () => ({
  BadRequestError: class BadRequestError extends Error {
    constructor(message: string) { super(message); this.name = 'BadRequestError'; }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) { super(message); this.name = 'NotFoundError'; }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message: string) { super(message); this.name = 'ForbiddenError'; }
  },
}));

import { buddyRequestService } from '@/services/buddy-request.service';

// ============================================================================
// Helpers
// ============================================================================

const makePractice = (overrides = {}) => ({
  id: 10,
  title: '冥想 30 天',
  ...overrides,
});

const makeReceiver = (overrides = {}) => ({
  id: 2,
  ...overrides,
});

const makeBuddyRequest = (overrides = {}) => ({
  id: 1,
  requester_id: 1,
  receiver_id: 2,
  practice_id: 10,
  status: 'pending',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('BuddyRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  // --------------------------------------------------------------------------
  // createBuddyRequest
  // --------------------------------------------------------------------------

  describe('createBuddyRequest', () => {
    it('practice 不存在時拋出 NotFoundError', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(null);

      await expect(
        buddyRequestService.createBuddyRequest(1, 'ext-99', 'ext-2'),
      ).rejects.toThrow('找不到指定的實踐');
    });

    it('receiver 不存在時拋出 NotFoundError', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue(null);

      await expect(
        buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-99'),
      ).rejects.toThrow('找不到指定的用戶');
    });

    it('requesterId === receiverId 時拋出 BadRequestError', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue({ id: 1 } as any); // same as requesterId

      await expect(
        buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-1'),
      ).rejects.toThrow('無法向自己發送 Buddy 請求');
    });

    it('已有 pending 請求時拋出 BadRequestError', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue(makeReceiver() as any);
      prismaMock.practice_buddy_requests.findFirst.mockResolvedValue(makeBuddyRequest() as any);

      await expect(
        buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-2'),
      ).rejects.toThrow('已有待處理的 Buddy 請求');
    });

    it('正常建立：寫入 DB，status = pending', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue(makeReceiver() as any);
      prismaMock.practice_buddy_requests.findFirst.mockResolvedValue(null);
      prismaMock.practice_buddy_requests.create.mockResolvedValue(makeBuddyRequest() as any);
      prismaMock.follows.findMany.mockResolvedValue([]);

      await buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-2');

      expect(prismaMock.practice_buddy_requests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          requester_id: 1,
          receiver_id: 2,
          practice_id: 10,
          status: 'pending',
        }),
      });
    });

    it('建立後傳送 BuddyRequest 通知給被請求方', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue(makeReceiver() as any);
      prismaMock.practice_buddy_requests.findFirst.mockResolvedValue(null);
      prismaMock.practice_buddy_requests.create.mockResolvedValue(makeBuddyRequest() as any);
      prismaMock.follows.findMany.mockResolvedValue([]);

      await buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-2');

      // Allow async void notification to be called
      await new Promise(resolve => setImmediate(resolve));

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BuddyRequest',
          actorId: 1,
          recipientId: 2,
          entityType: 'buddy_request',
          priority: 'P1',
          payload: expect.objectContaining({ practice_title: '冥想 30 天' }),
        }),
      );
    });

    it('fan-out：請求者的每位追蹤者都收到 BuddyRequestFollower 事件', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue(makeReceiver() as any);
      prismaMock.practice_buddy_requests.findFirst.mockResolvedValue(null);
      prismaMock.practice_buddy_requests.create.mockResolvedValue(makeBuddyRequest() as any);
      prismaMock.follows.findMany.mockResolvedValue([
        { follower_id: 10 } as any,
        { follower_id: 11 } as any,
        { follower_id: 12 } as any,
      ]);

      await buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-2');
      await new Promise(resolve => setImmediate(resolve));

      const fanOutCalls = mockCreateEvent.mock.calls.filter(
        (c: any[]) => c[0].type === 'BuddyRequestFollower',
      );
      expect(fanOutCalls).toHaveLength(3);
      expect(fanOutCalls.map((c: any[]) => c[0].recipientId)).toEqual(
        expect.arrayContaining([10, 11, 12]),
      );
    });

    it('追蹤者為零時不觸發任何 fan-out', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue(makeReceiver() as any);
      prismaMock.practice_buddy_requests.findFirst.mockResolvedValue(null);
      prismaMock.practice_buddy_requests.create.mockResolvedValue(makeBuddyRequest() as any);
      prismaMock.follows.findMany.mockResolvedValue([]);

      await buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-2');
      await new Promise(resolve => setImmediate(resolve));

      const fanOutCalls = mockCreateEvent.mock.calls.filter(
        (c: any[]) => c[0].type === 'BuddyRequestFollower',
      );
      expect(fanOutCalls).toHaveLength(0);
    });

    it('回傳 { message: "Buddy 請求已送出" }', async () => {
      prismaMock.practices.findFirst.mockResolvedValue(makePractice() as any);
      prismaMock.users.findFirst.mockResolvedValue(makeReceiver() as any);
      prismaMock.practice_buddy_requests.findFirst.mockResolvedValue(null);
      prismaMock.practice_buddy_requests.create.mockResolvedValue(makeBuddyRequest() as any);
      prismaMock.follows.findMany.mockResolvedValue([]);

      const result = await buddyRequestService.createBuddyRequest(1, 'ext-10', 'ext-2');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Buddy 請求已送出');
    });
  });

  // --------------------------------------------------------------------------
  // updateBuddyRequest
  // --------------------------------------------------------------------------

  describe('updateBuddyRequest', () => {
    it('request 不存在時拋出 NotFoundError', async () => {
      prismaMock.practice_buddy_requests.findUnique.mockResolvedValue(null);

      await expect(
        buddyRequestService.updateBuddyRequest(99, 2, 'accepted'),
      ).rejects.toThrow('找不到指定的 Buddy 請求');
    });

    it('receiver_id 不符時拋出 ForbiddenError', async () => {
      prismaMock.practice_buddy_requests.findUnique.mockResolvedValue(
        makeBuddyRequest({ receiver_id: 2 }) as any,
      );

      await expect(
        buddyRequestService.updateBuddyRequest(1, 99, 'accepted'), // receiverId = 99 but request.receiver_id = 2
      ).rejects.toThrow('無權操作此請求');
    });

    it('接受後更新 status = accepted', async () => {
      prismaMock.practice_buddy_requests.findUnique.mockResolvedValue(
        makeBuddyRequest() as any,
      );
      prismaMock.practice_buddy_requests.update.mockResolvedValue({} as any);

      await buddyRequestService.updateBuddyRequest(1, 2, 'accepted');

      expect(prismaMock.practice_buddy_requests.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'accepted' },
      });
    });

    it('接受後發送 BuddyAccepted 通知給請求者', async () => {
      prismaMock.practice_buddy_requests.findUnique.mockResolvedValue(
        makeBuddyRequest({ requester_id: 1, receiver_id: 2 }) as any,
      );
      prismaMock.practice_buddy_requests.update.mockResolvedValue({} as any);

      await buddyRequestService.updateBuddyRequest(1, 2, 'accepted');
      await new Promise(resolve => setImmediate(resolve));

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BuddyAccepted',
          actorId: 2,        // receiver 是 actor
          recipientId: 1,    // requester 收到通知
          priority: 'P1',
        }),
      );
    });

    it('忽略時不發送 BuddyAccepted 通知', async () => {
      prismaMock.practice_buddy_requests.findUnique.mockResolvedValue(
        makeBuddyRequest() as any,
      );
      prismaMock.practice_buddy_requests.update.mockResolvedValue({} as any);

      await buddyRequestService.updateBuddyRequest(1, 2, 'ignored');
      await new Promise(resolve => setImmediate(resolve));

      expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    it('忽略後回傳正確訊息', async () => {
      prismaMock.practice_buddy_requests.findUnique.mockResolvedValue(
        makeBuddyRequest() as any,
      );
      prismaMock.practice_buddy_requests.update.mockResolvedValue({} as any);

      const result = await buddyRequestService.updateBuddyRequest(1, 2, 'ignored');

      expect(result.data.message).toBe('Buddy 請求已忽略');
    });

    it('接受後回傳正確訊息', async () => {
      prismaMock.practice_buddy_requests.findUnique.mockResolvedValue(
        makeBuddyRequest() as any,
      );
      prismaMock.practice_buddy_requests.update.mockResolvedValue({} as any);

      const result = await buddyRequestService.updateBuddyRequest(1, 2, 'accepted');

      expect(result.data.message).toBe('Buddy 請求已接受');
    });
  });

  // --------------------------------------------------------------------------
  // getPendingIncoming
  // --------------------------------------------------------------------------

  describe('getPendingIncoming', () => {
    it('回傳正確的 BuddyRequestItem 格式', async () => {
      prismaMock.practice_buddy_requests.findMany.mockResolvedValue([
        {
          id: 1,
          requester: { external_id: 'ext-5', nickname: 'Alice' },
          practices: { id: 10, title: '冥想 30 天' },
          created_at: new Date('2024-06-01T10:00:00Z'),
        } as any,
      ]);
      prismaMock.practice_buddy_requests.count.mockResolvedValue(1);

      const result = await buddyRequestService.getPendingIncoming(2, 1, 10);

      expect(result.data[0]).toMatchObject({
        requestId: 1,
        requesterExternalId: 'ext-5',
        requesterNickname: 'Alice',
        practiceId: 10,
        practiceTitle: '冥想 30 天',
        createdAt: '2024-06-01T10:00:00.000Z',
      });
    });

    it('以 receiver_id 和 status=pending 查詢 DB', async () => {
      prismaMock.practice_buddy_requests.findMany.mockResolvedValue([]);
      prismaMock.practice_buddy_requests.count.mockResolvedValue(0);

      await buddyRequestService.getPendingIncoming(7, 1, 10);

      expect(prismaMock.practice_buddy_requests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { receiver_id: 7, status: 'pending' },
        }),
      );
    });

    it('依 created_at desc 排序', async () => {
      prismaMock.practice_buddy_requests.findMany.mockResolvedValue([]);
      prismaMock.practice_buddy_requests.count.mockResolvedValue(0);

      await buddyRequestService.getPendingIncoming(2, 1, 10);

      expect(prismaMock.practice_buddy_requests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { created_at: 'desc' } }),
      );
    });

    it('分頁：skip = (page-1) * limit', async () => {
      prismaMock.practice_buddy_requests.findMany.mockResolvedValue([]);
      prismaMock.practice_buddy_requests.count.mockResolvedValue(0);

      await buddyRequestService.getPendingIncoming(2, 3, 10); // page=3

      expect(prismaMock.practice_buddy_requests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('requester nickname 為 null 時保留 null', async () => {
      prismaMock.practice_buddy_requests.findMany.mockResolvedValue([
        {
          id: 1,
          requester: { external_id: 'ext-5', nickname: null },
          practices: { id: 10, title: '練習' },
          created_at: new Date(),
        } as any,
      ]);
      prismaMock.practice_buddy_requests.count.mockResolvedValue(1);

      const result = await buddyRequestService.getPendingIncoming(2, 1, 10);

      expect(result.data[0].requesterNickname).toBeNull();
    });
  });
});
