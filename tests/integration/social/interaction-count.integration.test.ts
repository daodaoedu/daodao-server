/**
 * Interaction Count Integration Tests
 *
 * 涵蓋範圍：
 * - 13.6 對話環（A留言→B回覆→A回覆）累計計數正確為 3（透過 HTTP comment API）
 * - 13.9 B 在 A 的實踐留言 1 次 + A 在 B 的實踐留言 2 次，互動計數為 3（雙向累計）
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken, expectSuccess } from '@tests/utils/api-helpers';
import request from 'supertest';

// Mocks — 必須在 import 之前定義

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: { add: jest.fn().mockResolvedValue({ id: 'job-id' }) },
  enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined),
}));

// id-converter mock：回傳不同 practice 的不同 user_id
const mockGetTargetEntity = jest.fn();

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (_type: string, externalId: string) => {
    const num = parseInt(externalId.replace('ext-', ''), 10);
    return isNaN(num) ? 99 : num;
  }),
  internalToExternalId: jest.fn().mockImplementation(async (_type: string, id: number) => `ext-${id}`),
  getTargetEntity: (...args: unknown[]) => mockGetTargetEntity(...args),
  default: {
    getTargetEntity: (...args: unknown[]) => mockGetTargetEntity(...args),
  },
}));

// interaction-count.service：追蹤 increment 呼叫次數
const mockIncrement = jest.fn().mockResolvedValue(undefined);
const mockGetCount = jest.fn();

jest.mock('@/services/interaction-count.service', () => ({
  interactionCountService: {
    increment: (...args: unknown[]) => mockIncrement(...args),
    getCount: (...args: unknown[]) => mockGetCount(...args),
    hasFamiliarityBypass: jest.fn().mockResolvedValue(true),
  },
}));

let app: any;

// ============================================================================
// Helpers
// ============================================================================

const makeCreatedComment = (id: number, userId: number, targetId: number) => ({
  id,
  user_id: userId,
  target_type: 'practice',
  target_id: targetId,
  content: 'test comment',
  visibility: 'public',
  parent_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  users: {
    id: userId,
    external_id: `ext-${userId}`,
    nickname: `user${userId}`,
    contacts: { photo_url: null },
    basic_info: null,
    user_positions: [],
  },
});

// ============================================================================
// Suite
// ============================================================================

describe('Interaction Count Integration Tests', () => {
  const userAId = 1;
  const userBId = 2;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    tokenA = createAuthToken({ id: userAId, email: 'a@test.com' });
    tokenB = createAuthToken({ id: userBId, email: 'b@test.com' });
  });

  // --------------------------------------------------------------------------
  // 13.6 對話環累計計數
  // --------------------------------------------------------------------------

  describe('13.6 — 對話環（A留言→B回覆→A回覆）累計計數為 3', () => {
    it('三次留言均觸發 increment，對話環計數應為 3', async () => {
      // A 在 B 的實踐留言：targetEntity.user_id = userB
      mockGetTargetEntity.mockResolvedValue({ id: 10, user_id: userBId });
      prismaMock.comments.create.mockResolvedValue(makeCreatedComment(1, userAId, 10) as any);

      const res1 = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ targetType: 'practice', targetId: 'ext-10', content: 'A留言' });
      expectSuccess(res1, 201);

      // B 回覆 A（B 在 B 自己的實踐留言，對象是 A），這裡模擬 B 的實踐 user_id = userB
      // increment(userB, userA) 因為 B 留言在 A 的實踐：targetEntity.user_id = userA
      mockGetTargetEntity.mockResolvedValue({ id: 20, user_id: userAId });
      prismaMock.comments.create.mockResolvedValue(makeCreatedComment(2, userBId, 20) as any);

      const res2 = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ targetType: 'practice', targetId: 'ext-20', content: 'B回覆' });
      expectSuccess(res2, 201);

      // A 再留言在 B 的實踐
      mockGetTargetEntity.mockResolvedValue({ id: 10, user_id: userBId });
      prismaMock.comments.create.mockResolvedValue(makeCreatedComment(3, userAId, 10) as any);

      const res3 = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ targetType: 'practice', targetId: 'ext-10', content: 'A再留言' });
      expectSuccess(res3, 201);

      // increment 應被呼叫 3 次（每次留言均觸發）
      expect(mockIncrement).toHaveBeenCalledTimes(3);

      // 呼叫方向驗證（pair 均為 userA ↔ userB）
      expect(mockIncrement).toHaveBeenCalledWith(userAId, userBId);
      expect(mockIncrement).toHaveBeenCalledWith(userBId, userAId);
    });
  });

  // --------------------------------------------------------------------------
  // 13.9 跨實踐雙向累計
  // --------------------------------------------------------------------------

  describe('13.9 — B 在 A 的實踐留言 1 次 + A 在 B 的實踐留言 2 次，計數為 3', () => {
    it('三次留言（跨實踐雙向）均觸發 increment，累計應為 3', async () => {
      // B 在 A 的實踐留言 1 次：targetEntity.user_id = userA
      mockGetTargetEntity.mockResolvedValue({ id: 20, user_id: userAId });
      prismaMock.comments.create.mockResolvedValue(makeCreatedComment(1, userBId, 20) as any);

      const res1 = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ targetType: 'practice', targetId: 'ext-20', content: 'B在A的實踐留言' });
      expectSuccess(res1, 201);

      // A 在 B 的實踐留言 2 次：targetEntity.user_id = userB
      mockGetTargetEntity.mockResolvedValue({ id: 10, user_id: userBId });
      prismaMock.comments.create
        .mockResolvedValueOnce(makeCreatedComment(2, userAId, 10) as any)
        .mockResolvedValueOnce(makeCreatedComment(3, userAId, 10) as any);

      const res2 = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ targetType: 'practice', targetId: 'ext-10', content: 'A在B的實踐留言1' });
      expectSuccess(res2, 201);

      const res3 = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ targetType: 'practice', targetId: 'ext-10', content: 'A在B的實踐留言2' });
      expectSuccess(res3, 201);

      // 共 3 次 increment
      expect(mockIncrement).toHaveBeenCalledTimes(3);

      // 所有 increment 呼叫均為 userA ↔ userB pair
      for (const call of mockIncrement.mock.calls) {
        const [x, y] = call as [number, number];
        const pair = [Math.min(x, y), Math.max(x, y)];
        expect(pair).toEqual([userAId, userBId]);
      }
    });
  });
});
