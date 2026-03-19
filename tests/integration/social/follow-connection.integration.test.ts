/**
 * Follow & Connection API Integration Tests
 *
 * 涵蓋範圍：
 * - 13.3 撤回連結請求後，雙方列表同步移除
 * - 13.4 解除連結後，connections_only 實踐回傳 403
 * - 13.5 非連結用戶存取 connections_only 實踐回傳 403
 * - 13.8 並發連結請求（A→B 與 B→A 同時）自動合併為連結
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken, expectSuccess, expectError } from '@tests/utils/api-helpers';
import request from 'supertest';

// Mocks — 必須在 import 之前定義

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('@/queues/social-notification.queue', () => ({
  enqueueSocialNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: { add: jest.fn().mockResolvedValue({ id: 'job-id' }) },
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' }),
}));

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (_type: string, externalId: string) => {
    const num = parseInt(externalId.replace('ext-', ''), 10);
    return isNaN(num) ? 99 : num;
  }),
  internalToExternalId: jest.fn().mockImplementation(async (_type: string, id: number) => `ext-${id}`),
  getTargetEntity: jest.fn().mockResolvedValue({ id: 1, user_id: 2 }),
  default: {
    getTargetEntity: jest.fn().mockResolvedValue({ id: 1, user_id: 2 }),
  },
}));

jest.mock('@/services/interaction-count.service', () => ({
  interactionCountService: {
    hasFamiliarityBypass: jest.fn().mockResolvedValue(true),
    getCount: jest.fn().mockResolvedValue(0),
    increment: jest.fn().mockResolvedValue(undefined),
  },
}));

let app: any;

// ============================================================================
// Constants
// ============================================================================

const PRACTICE_UUID = '550e8400-e29b-41d4-a716-446655440001';

// ============================================================================
// Helpers
// ============================================================================

const makeRequest = (overrides = {}) => ({
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

const makeConnection = (overrides = {}) => ({
  id: 1,
  user_a_id: 1,
  user_b_id: 2,
  connected_at: new Date(),
  ...overrides,
});

const makePractice = (overrides = {}) => ({
  id: 1,
  external_id: PRACTICE_UUID,
  user_id: 2,
  title: '他人的實踐',
  description: '描述',
  privacy_status: 'connections_only',
  visibility: 'connections_only',
  deleted_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  users: { id: 2, external_id: 'ext-2', nickname: 'owner', contacts: null, user_positions: [] },
  ...overrides,
});

// ============================================================================
// Suite
// ============================================================================

describe('Follow & Connection API Integration Tests', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 1;
  const otherUserId = 2;

  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    userToken = createAuthToken({ id: userId, email: 'user@test.com' });
    otherUserToken = createAuthToken({ id: otherUserId, email: 'other@test.com' });
  });

  // --------------------------------------------------------------------------
  // 13.3 撤回連結請求後，雙方列表同步移除
  // --------------------------------------------------------------------------

  describe('13.3 — 撤回連結請求後，雙方列表同步移除', () => {
    it('撤回後 DELETE 回傳 200，且後續 outgoing 列表為空', async () => {
      const pending = makeRequest({ requester_id: userId, id: 10 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(pending as any);
      prismaMock.connection_requests.delete.mockResolvedValue(pending as any);

      // 1. 撤回請求
      const withdrawRes = await request(app)
        .delete('/api/v1/connections/request/10')
        .set('Authorization', `Bearer ${userToken}`);

      expectSuccess(withdrawRes, 200);

      // 2. outgoing 列表已清空（data 是陣列）
      prismaMock.connection_requests.findMany.mockResolvedValue([]);
      prismaMock.connection_requests.count.mockResolvedValue(0);

      const outgoingRes = await request(app)
        .get('/api/v1/connections/requests/outgoing')
        .set('Authorization', `Bearer ${userToken}`);

      expectSuccess(outgoingRes, 200);
      expect(outgoingRes.body.data).toHaveLength(0);
    });

    it('撤回後 incoming 列表（對方視角）也為空', async () => {
      prismaMock.connection_requests.findMany.mockResolvedValue([]);
      prismaMock.connection_requests.count.mockResolvedValue(0);

      const incomingRes = await request(app)
        .get('/api/v1/connections/requests/incoming')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expectSuccess(incomingRes, 200);
      expect(incomingRes.body.data).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 13.5 非連結用戶存取 connections_only 實踐回傳 403
  // --------------------------------------------------------------------------

  describe('13.5 — 非連結用戶存取 connections_only 實踐回傳 403', () => {
    it('未登入時存取 connections_only 實踐回傳 403', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(makePractice() as any);
      prismaMock.connections.findUnique.mockResolvedValue(null);

      const res = await request(app).get(`/api/v1/practices/${PRACTICE_UUID}`);

      expectError(res, 403);
    });

    it('已登入但非夥伴時存取 connections_only 實踐回傳 403', async () => {
      const thirdPartyToken = createAuthToken({ id: 3, email: 'third@test.com' });
      prismaMock.practices.findUnique.mockResolvedValue(makePractice() as any);
      prismaMock.connections.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/practices/${PRACTICE_UUID}`)
        .set('Authorization', `Bearer ${thirdPartyToken}`);

      expectError(res, 403);
    });
  });

  // --------------------------------------------------------------------------
  // 13.4 解除連結後，connections_only 實踐回傳 403
  // --------------------------------------------------------------------------

  describe('13.4 — 解除連結後，connections_only 實踐無法存取', () => {
    it('解除連結後（DB 查無記錄），再存取 connections_only 實踐回傳 403', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(makePractice() as any);
      prismaMock.connections.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/practices/${PRACTICE_UUID}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectError(res, 403);
    });

    it('已連結的夥伴可正常存取 connections_only 實踐', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(makePractice() as any);
      prismaMock.connections.findUnique.mockResolvedValue(makeConnection() as any);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.comments.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([] as any);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([] as any);
      prismaMock.resources.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/v1/practices/${PRACTICE_UUID}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // 13.8 並發連結請求自動合併
  // --------------------------------------------------------------------------

  describe('13.8 — 並發連結請求（A→B 與 B→A 同時）自動合併為連結', () => {
    it('A 發出請求時若 B→A pending 存在，直接合併為連結並回傳成功', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);

      const reverseRequest = makeRequest({ requester_id: otherUserId, receiver_id: userId, id: 99 });
      prismaMock.connection_requests.findUnique.mockResolvedValue(reverseRequest as any);
      prismaMock.connection_requests.update.mockResolvedValue({ ...reverseRequest, status: 'accepted' } as any);
      prismaMock.connections.create.mockResolvedValue(makeConnection() as any);

      const res = await request(app)
        .post('/api/v1/connections/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ receiverExternalId: 'ext-2' });

      expectSuccess(res, 201);
      expect(res.body.data.message).toContain('已自動建立夥伴關係');

      // 確認直接建立連結，沒有新增 pending 請求
      expect(prismaMock.connection_requests.upsert).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('A 發出請求時若無 B→A pending，正常建立 pending 請求', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);
      prismaMock.connection_requests.findUnique
        .mockResolvedValueOnce(null)                   // reverse check → 無並發
        .mockResolvedValueOnce(makeRequest() as any);  // notification entityId lookup
      prismaMock.connection_requests.upsert.mockResolvedValue(makeRequest() as any);
      prismaMock.follows.findMany.mockResolvedValue([]);
      // Fire-and-forget: sendRequest calls prisma.users.findUnique().then(...)
      prismaMock.users.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .post('/api/v1/connections/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ receiverExternalId: 'ext-2' });

      expectSuccess(res, 201);
      expect(res.body.data.message).toBe('連結請求已送出');
    });
  });
});
