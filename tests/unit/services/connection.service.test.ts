/**
 * Connection Service Unit Tests
 *
 * 涵蓋範圍：
 * - 13.2 信任豁免門檻判斷（< 3 需填原因，>= 3 跳過）
 * - 13.7 自我連結防護
 * - 13.8 並發連結請求自動合併（A→B 與 B→A 同時）
 * - 13.3 撤回連結請求後，記錄從 DB 移除
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

const mockNotificationEventService = {
  createEvent: jest.fn().mockReturnValue(Promise.resolve()),
};

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
  notificationEventService: mockNotificationEventService,
}));

jest.mock('@/queues/social-notification.queue', () => ({
  enqueueSocialNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (_type: string, externalId: string) => {
    // ext-2 → 2, ext-3 → 3, etc.
    const num = parseInt(externalId.replace('ext-', ''), 10);
    return isNaN(num) ? 99 : num;
  }),
  internalToExternalId: jest.fn().mockImplementation(async (_type: string, id: number) => `ext-${id}`),
}));

jest.mock('@/services/interaction-count.service', () => ({
  interactionCountService: {
    hasFamiliarityBypass: jest.fn(),
    getCount: jest.fn().mockResolvedValue(0),
    increment: jest.fn().mockResolvedValue(undefined),
  },
}));

import { connectionService } from '@/services/connection.service';
import { interactionCountService } from '@/services/interaction-count.service';

// ============================================================================
// Helpers
// ============================================================================

const makePendingRequest = (overrides = {}) => ({
  id: 10,
  requester_id: 1,
  receiver_id: 2,
  intent: 'hello',
  status: 'pending',
  context_practice_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('Connection Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  // --------------------------------------------------------------------------
  // sendRequest — 13.7 自我連結防護
  // --------------------------------------------------------------------------

  describe('sendRequest — 自我連結防護（13.7）', () => {
    it('requesterId === receiverId 時拋出 BadRequestError', async () => {
      // externalToInternalId('user', 'ext-1') → 1
      await expect(
        connectionService.sendRequest(1, 'ext-1'),
      ).rejects.toThrow('無法連結自己');
    });
  });

  // --------------------------------------------------------------------------
  // sendRequest — 13.2 信任豁免門檻
  // --------------------------------------------------------------------------

  describe('sendRequest — 信任豁免門檻（13.2）', () => {
    beforeEach(() => {
      // 尚未連結
      prismaMock.connections.findUnique.mockResolvedValue(null);
      // 無並發 reverse 請求
      prismaMock.connection_requests.findUnique.mockResolvedValue(null);
      prismaMock.connection_requests.upsert.mockResolvedValue(makePendingRequest() as any);
      prismaMock.follows.findMany.mockResolvedValue([]);
    });

    it('互動 < 3 且未填 intent，拋出 BadRequestError', async () => {
      (interactionCountService.hasFamiliarityBypass as jest.Mock).mockResolvedValue(false);

      await expect(
        connectionService.sendRequest(1, 'ext-2'),
      ).rejects.toThrow('互動次數未達門檻，請填寫連結原因');
    });

    it('互動 < 3 且 intent 為空白字串，拋出 BadRequestError', async () => {
      (interactionCountService.hasFamiliarityBypass as jest.Mock).mockResolvedValue(false);

      await expect(
        connectionService.sendRequest(1, 'ext-2', '   '),
      ).rejects.toThrow('互動次數未達門檻，請填寫連結原因');
    });

    it('互動 < 3 但填了 intent，成功送出請求', async () => {
      (interactionCountService.hasFamiliarityBypass as jest.Mock).mockResolvedValue(false);
      // findUnique for notification entityId
      prismaMock.connection_requests.findUnique.mockResolvedValueOnce(null)  // reverse check
        .mockResolvedValueOnce(makePendingRequest() as any);                  // entityId lookup
      // Fire-and-forget: sendRequest calls prisma.users.findUnique().then(...)
      prismaMock.users.findUnique.mockResolvedValue(null as any);

      const result = await connectionService.sendRequest(1, 'ext-2', '你好');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('連結請求已送出');
    });

    it('互動 >= 3（信任豁免），不填 intent 也成功送出', async () => {
      (interactionCountService.hasFamiliarityBypass as jest.Mock).mockResolvedValue(true);
      prismaMock.connection_requests.findUnique.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makePendingRequest() as any);
      // Fire-and-forget: sendRequest calls prisma.users.findUnique().then(...)
      prismaMock.users.findUnique.mockResolvedValue(null as any);

      const result = await connectionService.sendRequest(1, 'ext-2');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('連結請求已送出');
    });
  });

  // --------------------------------------------------------------------------
  // sendRequest — 13.8 並發請求自動合併
  // --------------------------------------------------------------------------

  describe('sendRequest — 並發請求自動合併（13.8）', () => {
    it('B→A 已有 pending 時，直接建立連結，不新增請求', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null); // 未連結
      (interactionCountService.hasFamiliarityBypass as jest.Mock).mockResolvedValue(true);

      // B→A pending 存在
      const reverseRequest = makePendingRequest({ requester_id: 2, receiver_id: 1, id: 99 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(reverseRequest as any);

      prismaMock.connection_requests.update.mockResolvedValue({
        ...reverseRequest, status: 'accepted',
      } as any);
      prismaMock.connections.create.mockResolvedValue({
        id: 1, user_a_id: 1, user_b_id: 2, connected_at: new Date(),
      } as any);

      const result = await connectionService.sendRequest(1, 'ext-2');

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('已自動建立夥伴關係');

      // 不應呼叫 upsert（不新建請求）
      expect(prismaMock.connection_requests.upsert).not.toHaveBeenCalled();
      // 應呼叫 $transaction 建立連結
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // withdrawRequest — 13.3 撤回後記錄移除
  // --------------------------------------------------------------------------

  describe('withdrawRequest — 撤回後記錄移除（13.3）', () => {
    it('成功撤回，DB delete 被呼叫', async () => {
      const request = makePendingRequest({ requester_id: 1, id: 10 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);
      prismaMock.connection_requests.delete.mockResolvedValue(request as any);

      const result = await connectionService.withdrawRequest(1, 10);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('已撤回連結請求');
      expect(prismaMock.connection_requests.delete).toHaveBeenCalledWith({
        where: { id: 10 },
      });
    });

    it('非發起方無法撤回（ForbiddenError）', async () => {
      const request = makePendingRequest({ requester_id: 2, id: 10 }); // 發起人是 2
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);

      await expect(
        connectionService.withdrawRequest(1, 10), // 用戶 1 嘗試撤回
      ).rejects.toThrow('無權撤回此請求');
    });

    it('非 pending 狀態無法撤回', async () => {
      const request = makePendingRequest({ requester_id: 1, status: 'accepted', id: 10 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);

      await expect(
        connectionService.withdrawRequest(1, 10),
      ).rejects.toThrow('此請求已被處理，無法撤回');
    });
  });

  // --------------------------------------------------------------------------
  // sendRequest — 已連結防護
  // --------------------------------------------------------------------------

  describe('sendRequest — 已連結防護', () => {
    it('已是夥伴關係時拋出 BadRequestError', async () => {
      prismaMock.connections.findUnique.mockResolvedValue({
        id: 5, user_a_id: 1, user_b_id: 2, connected_at: new Date(),
      } as any);

      await expect(
        connectionService.sendRequest(1, 'ext-2'),
      ).rejects.toThrow('已經是夥伴關係');
    });
  });

  // --------------------------------------------------------------------------
  // withdrawRequest — 請求不存在
  // --------------------------------------------------------------------------

  describe('withdrawRequest — 請求不存在', () => {
    it('findUnique 回傳 null 時拋出 NotFoundError', async () => {
      prismaMock.connection_requests.findUnique.mockResolvedValue(null);

      await expect(
        connectionService.withdrawRequest(1, 99),
      ).rejects.toThrow('連結請求不存在');
    });
  });

  // --------------------------------------------------------------------------
  // acceptRequest
  // --------------------------------------------------------------------------

  describe('acceptRequest', () => {
    it('非接收方無法接受（ForbiddenError）', async () => {
      // request.receiver_id = 2，但 currentUserId = 1
      const request = makePendingRequest({ requester_id: 3, receiver_id: 2, id: 20 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);

      await expect(
        connectionService.acceptRequest(1, 20),
      ).rejects.toThrow('無權操作此請求');
    });

    it('非 pending 狀態無法接受（BadRequestError）', async () => {
      const request = makePendingRequest({ requester_id: 3, receiver_id: 1, status: 'rejected', id: 20 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);

      await expect(
        connectionService.acceptRequest(1, 20),
      ).rejects.toThrow('此請求已被處理');
    });

    it('成功接受：connections.upsert 被呼叫，回傳成功訊息', async () => {
      const request = makePendingRequest({ requester_id: 3, receiver_id: 1, id: 20 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);

      prismaMock.connection_requests.update.mockResolvedValue({
        ...request, status: 'accepted',
      } as any);
      prismaMock.connections.upsert.mockResolvedValue({
        id: 7, user_a_id: 1, user_b_id: 3, connected_at: new Date(),
      } as any);
      // Fire-and-forget: acceptRequest calls prisma.users.findUnique().then(...)
      prismaMock.users.findUnique.mockResolvedValue(null as any);
      // Fire-and-forget: acceptRequest calls prisma.notifications.updateMany(...).catch(...)
      prismaMock.notifications.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await connectionService.acceptRequest(1, 20);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('已接受連結請求');
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // rejectRequest
  // --------------------------------------------------------------------------

  describe('rejectRequest', () => {
    it('非接收方無法拒絕（ForbiddenError）', async () => {
      // request.receiver_id = 2，但 currentUserId = 1
      const request = makePendingRequest({ requester_id: 3, receiver_id: 2, id: 30 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);

      await expect(
        connectionService.rejectRequest(1, 30),
      ).rejects.toThrow('無權操作此請求');
    });

    it('成功拒絕：status 更新為 rejected，不觸發通知', async () => {
      const request = makePendingRequest({ requester_id: 3, receiver_id: 1, id: 30 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(request as any);
      prismaMock.connection_requests.update.mockResolvedValue({
        ...request, status: 'rejected',
      } as any);
      // Fire-and-forget: rejectRequest calls prisma.notifications.updateMany(...).catch(...)
      prismaMock.notifications.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await connectionService.rejectRequest(1, 30);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('已忽略連結請求');
      expect(prismaMock.connection_requests.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 30 },
          data: expect.objectContaining({ status: 'rejected' }),
        }),
      );
      // 拒絕不通知對方
      expect(mockNotificationEventService.createEvent).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // disconnect
  // --------------------------------------------------------------------------

  describe('disconnect', () => {
    it('尚未建立夥伴關係時拋出 NotFoundError', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);

      await expect(
        connectionService.disconnect(1, 'ext-2'),
      ).rejects.toThrow('尚未建立夥伴關係');
    });

    it('成功解除：connections.delete 被呼叫，回傳成功訊息', async () => {
      const connection = { id: 5, user_a_id: 1, user_b_id: 2, connected_at: new Date() };
      prismaMock.connections.findUnique.mockResolvedValue(connection as any);
      prismaMock.connections.delete.mockResolvedValue(connection as any);

      const result = await connectionService.disconnect(1, 'ext-2');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('已解除連結');
      expect(prismaMock.connections.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_a_id_user_b_id: { user_a_id: 1, user_b_id: 2 },
          }),
        }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // getConnectionStatus
  // --------------------------------------------------------------------------

  describe('getConnectionStatus', () => {
    beforeEach(() => {
      (interactionCountService.getCount as jest.Mock).mockResolvedValue(2);
      (interactionCountService.hasFamiliarityBypass as jest.Mock).mockResolvedValue(false);
    });

    it('已建立連結時回傳 connected', async () => {
      prismaMock.connections.findUnique.mockResolvedValue({
        id: 5, user_a_id: 1, user_b_id: 2, connected_at: new Date(),
      } as any);
      prismaMock.connection_requests.findUnique.mockResolvedValue(null);

      const result = await connectionService.getConnectionStatus(1, 'ext-2');

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        status: 'connected',
        isConnected: true,
        requestId: null,
        interactionCount: 2,
        hasBypass: false,
      });
    });

    it('目標用戶已送出 pending 請求時回傳 incoming 與 requestId', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);
      prismaMock.connection_requests.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makePendingRequest({ id: 88, requester_id: 2, receiver_id: 1 }) as any);

      const result = await connectionService.getConnectionStatus(1, 'ext-2');

      expect(result.data).toMatchObject({
        status: 'incoming',
        isConnected: false,
        requestId: 88,
      });
    });

    it('目前使用者已送出 pending 請求時回傳 outgoing 與 requestId', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);
      prismaMock.connection_requests.findUnique
        .mockResolvedValueOnce(makePendingRequest({ id: 77, requester_id: 1, receiver_id: 2 }) as any)
        .mockResolvedValueOnce(null);

      const result = await connectionService.getConnectionStatus(1, 'ext-2');

      expect(result.data).toMatchObject({
        status: 'outgoing',
        isConnected: false,
        requestId: 77,
      });
    });

    it('沒有連結或 pending 請求時回傳 none', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);
      prismaMock.connection_requests.findUnique.mockResolvedValue(null);

      const result = await connectionService.getConnectionStatus(1, 'ext-2');

      expect(result.data).toMatchObject({
        status: 'none',
        isConnected: false,
        requestId: null,
      });
    });
  });
});
