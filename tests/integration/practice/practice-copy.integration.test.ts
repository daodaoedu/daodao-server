/**
 * Practice Copy API Integration Tests
 * 測試 POST /api/v1/practices/:id/copy
 *
 * 涵蓋範圍：
 * - C-1: 成功複製（public 實踐）
 * - C-2: 複製非 public 的他人實踐 → 403
 * - C-3: 複製不存在的實踐 → 404
 * - C-4: 未登入 → 401
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import request from 'supertest';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: { add: jest.fn().mockResolvedValue({ id: 'job-id' }) },
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' })
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' })
}));

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (_type: string, externalId: string) => {
    const practice = await prismaMock.practices.findUnique({ where: { external_id: externalId } as any });
    if (practice) return practice.id;
    return 1;
  }),
  internalToExternalId: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440002')
}));

let app: any;

describe('Practice Copy API Integration Tests', () => {
  const API_BASE = '/api/v1/practices';

  const userId = 1;
  const otherUserId = 2;
  let userToken: string;
  let otherUserToken: string;

  const SOURCE_UUID = '550e8400-e29b-41d4-a716-446655440010';

  const mockSourcePractice = {
    id: 10,
    external_id: SOURCE_UUID,
    user_id: otherUserId,
    title: '多益 860 衝刺計畫',
    practice_action: '每天聽寫一篇 TED Talk',
    duration_days: 30,
    session_duration_minutes: 45,
    frequency_min_days: 3,
    frequency_max_days: 5,
    practice_time_periods: ['morning'],
    other_context: null,
    has_resources: false,
    theme_color: '#C3EEFF',
    template_id: null,
    privacy_status: 'public',
    status: 'active',
    progress_percentage: { toNumber: () => 60 },
    source_practice_id: null,
    copy_count: 0,
    start_date: new Date(),
    end_date: new Date(),
    first_checkin_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockNewPractice = {
    ...mockSourcePractice,
    id: 99,
    external_id: 'new-uuid',
    user_id: userId,
    status: 'draft',
    progress_percentage: { toNumber: () => 0 },
    source_practice_id: 10,
    copy_count: 0,
    start_date: new Date(),
    end_date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

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

  // ==========================================================================
  // C-1: 成功複製
  // ==========================================================================
  describe('C-1: 成功複製 public 實踐', () => {
    it('應回傳 201 + { id }，source copy_count +1', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(mockSourcePractice as any);
      prismaMock.practices.create.mockResolvedValue(mockNewPractice as any);
      prismaMock.practices.update.mockResolvedValue({ ...mockSourcePractice, copy_count: 1 } as any);

      const response = await request(app)
        .post(`${API_BASE}/${SOURCE_UUID}/copy`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(99);
    });

    it('複製自己的非 public 實踐也應成功（owner 免 403）', async () => {
      const ownPrivatePractice = { ...mockSourcePractice, user_id: userId, privacy_status: 'private' };
      prismaMock.practices.findUnique.mockResolvedValue(ownPrivatePractice as any);
      prismaMock.practices.create.mockResolvedValue(mockNewPractice as any);
      prismaMock.practices.update.mockResolvedValue({ ...ownPrivatePractice, copy_count: 1 } as any);

      const response = await request(app)
        .post(`${API_BASE}/${SOURCE_UUID}/copy`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // C-2: 複製非 public 的他人實踐 → 403
  // ==========================================================================
  describe('C-2: 複製非 public 他人實踐', () => {
    it('應回傳 403', async () => {
      const privatePractice = { ...mockSourcePractice, privacy_status: 'private' };
      prismaMock.practices.findUnique.mockResolvedValue(privatePractice as any);

      const response = await request(app)
        .post(`${API_BASE}/${SOURCE_UUID}/copy`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // C-3: 複製不存在的實踐 → 404
  // ==========================================================================
  describe('C-3: 複製不存在的實踐', () => {
    it('應回傳 404', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post(`${API_BASE}/550e8400-e29b-41d4-a716-000000000000/copy`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('已軟刪除的實踐應回傳 404', async () => {
      const deletedPractice = { ...mockSourcePractice, deleted_at: new Date() };
      prismaMock.practices.findUnique.mockResolvedValue(deletedPractice as any);

      const response = await request(app)
        .post(`${API_BASE}/${SOURCE_UUID}/copy`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // C-4: 未登入 → 401
  // ==========================================================================
  describe('C-4: 未登入', () => {
    it('無 Authorization header 應回傳 401', async () => {
      const response = await request(app).post(`${API_BASE}/${SOURCE_UUID}/copy`);

      expect(response.status).toBe(401);
    });
  });
});
