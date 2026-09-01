/**
 * Practice Summary Service Unit Tests
 *
 * 涵蓋實踐總結頁相關功能：反思、精選打卡、打卡筆記平均字數，
 * 以及 findById 對私人欄位（reflection/nextIntent/selectedCheckInIds/insightFeedback）的擁有者過濾。
 *
 * Mocks: All external dependencies (database, logger service, external services)
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

// Mock external dependencies
const mockLoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: mockLoggerService
}));

const mockCreateEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: {
    createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  },
}));

const mockEnqueuePracticeEmail = jest.fn().mockResolvedValue('job-id');
jest.mock('@/queues', () => ({
  enqueuePracticeEmail: mockEnqueuePracticeEmail
}));

const mockFanoutToPracticeFollowers = jest.fn().mockResolvedValue(undefined);
const mockFanoutToConnectedPartners = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/social-notification-fanout.service', () => ({
  fanoutToPracticeFollowers: (...args: unknown[]) => mockFanoutToPracticeFollowers(...args),
  fanoutToConnectedPartners: (...args: unknown[]) => mockFanoutToConnectedPartners(...args),
}));

import {
  findById,
  updateReflection,
  updateSelectedCheckins
} from '@/services/practice.service';

describe('Practice Summary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();

    mockLoggerService.info.mockReturnValue(undefined);
    mockLoggerService.error.mockReturnValue(undefined);
    mockLoggerService.warn.mockReturnValue(undefined);
    mockEnqueuePracticeEmail.mockResolvedValue('job-id');
    mockCreateEvent.mockResolvedValue(undefined);
    mockFanoutToPracticeFollowers.mockResolvedValue(undefined);
    mockFanoutToConnectedPartners.mockResolvedValue(undefined);
    prismaMock.follows.findMany.mockResolvedValue([] as any);
    prismaMock.connections.findMany.mockResolvedValue([] as any);
  });

  describe('updateReflection', () => {
    it('should throw ForbiddenError when caller is not the practice owner', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        user_id: 1,
        deleted_at: null
      } as any);

      await expect(updateReflection(10, 999, '非擁有者嘗試編輯反思')).rejects.toThrow(
        '只有實踐擁有者可以編輯反思'
      );

      expect(prismaMock.practices.update).not.toHaveBeenCalled();
    });

    it('should update reflection when caller is the practice owner', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        user_id: 1,
        deleted_at: null
      } as any);
      prismaMock.practices.update.mockResolvedValue({
        reflection: '這次實踐讓我學到了很多'
      } as any);

      const result = await updateReflection(10, 1, '這次實踐讓我學到了很多');

      expect(result.success).toBe(true);
      expect(result.data.reflection).toBe('這次實踐讓我學到了很多');
    });
  });

  describe('updateSelectedCheckins', () => {
    it('should reject checkin IDs that do not belong to this practice', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        user_id: 1,
        deleted_at: null
      } as any);
      // 只有 1 筆屬於此實踐的打卡被找到，但請求了 2 筆 checkinIds
      prismaMock.practice_checkins.count.mockResolvedValue(1);

      await expect(
        updateSelectedCheckins(10, 1, ['456', '789'])
      ).rejects.toThrow('部分打卡紀錄不屬於此實踐');

      expect(prismaMock.practices.update).not.toHaveBeenCalled();
    });

    it('should update selected checkins when all IDs belong to this practice', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        user_id: 1,
        deleted_at: null
      } as any);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.practices.update.mockResolvedValue({
        selected_checkin_ids: ['456']
      } as any);

      const result = await updateSelectedCheckins(10, 1, ['456']);

      expect(result.success).toBe(true);
      expect(result.data.selectedCheckinIds).toEqual(['456']);
    });
  });

  describe('findById - avgWords', () => {
    const basePractice = {
      id: 1,
      external_id: 'practice-uuid',
      title: 'Test Practice',
      status: 'active',
      progress_percentage: 20,
      practice_time_periods: [],
      theme_color: '#FCDD84',
      created_at: new Date(),
      deleted_at: null,
      visibility: 'public',
      user_id: 1,
      users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
    } as any;

    beforeEach(() => {
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);
    });

    it('should return 0 for avgWords when practice has no checkins', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(basePractice);
      prismaMock.$queryRaw.mockResolvedValue([{ avg_words: null }] as any);

      const result = await findById(1, 1);

      expect(result.data.avgWords).toBe(0);
    });
  });

  describe('findById - private field ownership gating (C1)', () => {
    const ownerPractice = {
      id: 1,
      external_id: 'practice-uuid',
      title: 'Test Practice',
      status: 'active',
      progress_percentage: 20,
      practice_time_periods: [],
      theme_color: '#FCDD84',
      created_at: new Date(),
      deleted_at: null,
      visibility: 'public',
      user_id: 1,
      reflection: '這是我的私人反思',
      next_intent: '我接下來想做的事',
      selected_checkin_ids: ['111', '222'],
      insight_feedback: { type: 'positive', reasons: [] },
      users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
    } as any;

    beforeEach(() => {
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([{ avg_words: null }] as any);
    });

    it('should expose private fields to the practice owner', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(ownerPractice);

      const result = await findById(1, 1);

      expect(result.data.reflection).toBe('這是我的私人反思');
      expect(result.data.nextIntent).toBe('我接下來想做的事');
      expect(result.data.selectedCheckInIds).toEqual(['111', '222']);
      expect(result.data.insightFeedback).toEqual({ type: 'positive', reasons: [] });
    });

    it('should hide private fields from an authenticated non-owner viewer', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(ownerPractice);

      const result = await findById(1, 2);

      expect(result.data.reflection).toBeUndefined();
      expect(result.data.nextIntent).toBeUndefined();
      expect(result.data.selectedCheckInIds).toEqual([]);
      expect(result.data.insightFeedback).toBeNull();
    });

    it('should hide private fields from an unauthenticated visitor', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(ownerPractice);

      const result = await findById(1, undefined);

      expect(result.data.reflection).toBeUndefined();
      expect(result.data.nextIntent).toBeUndefined();
      expect(result.data.selectedCheckInIds).toEqual([]);
      expect(result.data.insightFeedback).toBeNull();
    });
  });
});
