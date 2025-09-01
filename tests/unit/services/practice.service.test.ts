/**
 * Practice Service Unit Tests
 * Tests practice service business logic in isolation
 * 
 * Focus: Business logic validation, data transformation, practice operations
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

import {
  findAll,
  findById,
  create,
  update,
  deleteFunction,
  findUserPractices,
  getUserStats
} from '@/services/practice.service';

describe('Practice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    
    // Setup common mock returns
    mockLoggerService.info.mockReturnValue(undefined);
    mockLoggerService.error.mockReturnValue(undefined);
    mockLoggerService.warn.mockReturnValue(undefined);
  });

  describe('findAll', () => {
    it('should retrieve practice list successfully', async () => {
      const mockPractices = [
        {
          id: 1,
          title: 'Test Practice',
          content_type: 'book',
          total_amount: 100,
          current_progress: { toNumber: () => 10 },
          status: 'active',
          has_resources: false,
          streak: 5,
          max_streak: 10,
          created_at: new Date(),
          updated_at: new Date(),
          users: {
            id: 1,
            external_id: 'user-1',
            nickname: 'Test User',
            contacts: { photo_url: null },
            user_positions: []
          }
        }
      ] as any;
      
      prismaMock.practices.findMany.mockResolvedValue(mockPractices);
      prismaMock.practices.count.mockResolvedValue(1);
      prismaMock.comments.groupBy.mockResolvedValue([]);

      const result = await findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Test Practice');
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Practice list retrieved',
        expect.any(Object)
      );
    });

    it('should handle search filtering', async () => {
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([]);

      await findAll({ search: 'test search' });

      expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test search', mode: 'insensitive' } },
              { practice_action: { contains: 'test search', mode: 'insensitive' } }
            ]
          })
        })
      );
    });

    it('should handle content type filtering', async () => {
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([]);

      await findAll({ contentType: 'video' });

      expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            content_type: 'video'
          })
        })
      );
    });

    it('should throw error when database fails', async () => {
      prismaMock.practices.findMany.mockRejectedValue(new Error('Database error'));

      await expect(findAll({})).rejects.toThrow('取得實踐列表失敗');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should retrieve practice by ID successfully', async () => {
      const mockPractice = {
        id: 1,
        title: 'Test Practice',
        content_type: 'book',
        total_amount: 100,
        current_progress: { toNumber: () => 25 },
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        users: {
          id: 1,
          external_id: 'user-1',
          nickname: 'Test User',
          contacts: { photo_url: null },
          user_positions: []
        }
      } as any;
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);

      const result = await findById(1);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.title).toBe('Test Practice');
    });

    it('should record view when userId provided', async () => {
      const mockPractice = {
        id: 1,
        title: 'Test Practice',
        users: { id: 1, nickname: 'Test', contacts: null, user_positions: [] }
      } as any;
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);

      await findById(1, 5);

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Practice view recorded',
        { practiceId: 1, userId: 5 }
      );
    });

    it('should throw error when practice not found', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(findById(999)).rejects.toThrow('實踐不存在');
    });
  });

  describe('create', () => {
    const mockCreateRequest = {
      title: 'New Practice',
      contentType: 'book' as const,
      totalAmount: 100,
      dailyGoal: {
        type: 'time' as const,
        timeMinutes: 30
      },
      tags: ['test'],
      resources: []
    };

    it('should create practice successfully', async () => {
      const mockCreatedPractice = {
        id: 1,
        title: 'New Practice',
        content_type: 'book',
        total_amount: 100,
        status: 'active',
        users: {
          id: 1,
          external_id: 'user-1',
          nickname: 'Test User',
          contacts: { photo_url: null },
          user_positions: []
        }
      } as any;
      
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);

      const result = await create(mockCreateRequest, 1);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Practice');
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Practice created',
        { practiceId: 1, userId: 1 }
      );
    });

    it('should handle tag linking', async () => {
      const mockCreatedPractice = { id: 1, users: { id: 1 } } as any;
      
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);
      prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: 'test' } as any);
      prismaMock.entity_tags.upsert.mockResolvedValue({} as any);

      await create(mockCreateRequest, 1);

      expect(prismaMock.tags.upsert).toHaveBeenCalledWith({
        where: { name: 'test' },
        update: {},
        create: { name: 'test' }
      });
    });

    it('should throw error when creation fails', async () => {
      prismaMock.practices.create.mockRejectedValue(new Error('Database error'));

      await expect(create(mockCreateRequest, 1)).rejects.toThrow('建立實踐失敗');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockUpdateRequest = {
      title: 'Updated Practice',
      status: 'completed' as const
    };

    it('should update practice successfully', async () => {
      const mockExistingPractice = { id: 1, user_id: 1 };
      const mockUpdatedPractice = {
        id: 1,
        title: 'Updated Practice',
        status: 'completed',
        users: { id: 1, nickname: 'Test', contacts: null, user_positions: [] }
      } as any;
      
      prismaMock.practices.findUnique.mockResolvedValue(mockExistingPractice as any);
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);

      const result = await update(1, mockUpdateRequest, 1);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Practice');
    });

    it('should throw error when practice not found', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(update(999, mockUpdateRequest, 1)).rejects.toThrow('實踐不存在');
    });

    it('should throw error when user lacks permission', async () => {
      const mockPractice = { id: 1, user_id: 2 }; // Different user
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

      await expect(update(1, mockUpdateRequest, 1)).rejects.toThrow('沒有權限修改此實踐');
    });
  });

  describe('deleteFunction', () => {
    it('should soft delete practice successfully', async () => {
      const mockPractice = { id: 1, user_id: 1 };
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practices.update.mockResolvedValue({ ...mockPractice, status: 'archived' } as any);

      const result = await deleteFunction(1, 1);

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(prismaMock.practices.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'archived',
          updated_at: expect.any(Date)
        }
      });
    });

    it('should throw error when practice not found', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(deleteFunction(999, 1)).rejects.toThrow('實踐不存在');
    });

    it('should throw error when user lacks permission', async () => {
      const mockPractice = { id: 1, user_id: 2 }; // Different user
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

      await expect(deleteFunction(1, 1)).rejects.toThrow('沒有權限刪除此實踐');
    });
  });

  describe('findUserPractices', () => {
    it('should delegate to findAll with userId', async () => {
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([]);

      const result = await findUserPractices(5, { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 5
          })
        })
      );
    });
  });

  describe('getUserStats', () => {
    it('should calculate user practice statistics correctly', async () => {
      const mockPracticeStats = {
        _count: { id: 10 },
        _avg: { streak: 5.5 },
        _max: { max_streak: 15 },
        _min: null,
        _sum: null
      } as any;

      const mockCheckInStats = {
        _count: { id: 45 },
        _avg: null,
        _max: null,
        _min: null,
        _sum: null
      } as any;

      const mockStatusCounts = [
        { status: 'active', _count: { id: 6 } },
        { status: 'completed', _count: { id: 3 } },
        { status: 'paused', _count: { id: 1 } }
      ] as any;

      prismaMock.practices.aggregate.mockResolvedValue(mockPracticeStats);
      prismaMock.practice_checkins.aggregate.mockResolvedValue(mockCheckInStats);
      prismaMock.practices.groupBy.mockResolvedValue(mockStatusCounts);

      const result = await getUserStats(1);

      expect(result.success).toBe(true);
      expect(result.data.totalPractices).toBe(10);
      expect(result.data.activePractices).toBe(6);
      expect(result.data.completedPractices).toBe(3);
      expect(result.data.pausedPractices).toBe(1);
      expect(result.data.totalCheckIns).toBe(45);
      expect(result.data.averageStreak).toBe(6); // Rounded from 5.5
      expect(result.data.maxStreak).toBe(15);
    });

    it('should handle missing status counts gracefully', async () => {
      const mockPracticeStats = {
        _count: { id: 5 },
        _avg: { streak: null },
        _max: { max_streak: null },
        _min: null,
        _sum: null
      } as any;

      const mockCheckInStats = {
        _count: { id: 0 },
        _avg: null,
        _max: null,
        _min: null,
        _sum: null
      } as any;

      prismaMock.practices.aggregate.mockResolvedValue(mockPracticeStats);
      prismaMock.practice_checkins.aggregate.mockResolvedValue(mockCheckInStats);
      prismaMock.practices.groupBy.mockResolvedValue([]);

      const result = await getUserStats(1);

      expect(result.data.totalPractices).toBe(5);
      expect(result.data.activePractices).toBe(0);
      expect(result.data.completedPractices).toBe(0);
      expect(result.data.pausedPractices).toBe(0);
      expect(result.data.totalCheckIns).toBe(0);
      expect(result.data.averageStreak).toBe(0);
      expect(result.data.maxStreak).toBe(0);
    });

    it('should throw error when stats retrieval fails', async () => {
      prismaMock.practices.aggregate.mockRejectedValue(new Error('Database error'));

      await expect(getUserStats(1)).rejects.toThrow('取得使用者統計失敗');
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to retrieve user practice stats',
        { userId: 1, error: expect.any(Error) }
      );
    });
  });

  describe('Business logic validation', () => {
    it('should handle null values with sensible defaults', async () => {
      const mockPractice = {
        id: 1,
        title: 'Test',
        content_type: 'book',
        custom_content_type: null,
        practice_action: null,
        start_date: null,
        last_checkin_date: null,
        daily_goal_time_minutes: null,
        daily_goal_amount: null,
        daily_goal_unit: null,
        current_progress: { toNumber: () => 0 },
        users: {
          id: 1,
          external_id: null,
          nickname: null,
          contacts: null,
          user_positions: []
        }
      } as any;
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      
      const result = await findById(1);
      
      expect(result.data.customContentType).toBeUndefined();
      expect(result.data.practiceAction).toBeUndefined();
      expect(result.data.startDate).toBeUndefined();
      expect(result.data.lastCheckInDate).toBeUndefined();
      expect(result.data.dailyGoal.timeMinutes).toBeUndefined();
      expect(result.data.dailyGoal.amount).toBeUndefined();
      expect(result.data.dailyGoal.unit).toBeUndefined();
      expect(result.data.user.name).toBe('Unknown User');
    });

    it('should handle numeric string conversion correctly', async () => {
      const mockPractice = {
        id: 1,
        title: 'Test',
        content_type: 'book',
        total_amount: 100,
        current_progress: 25.5, // Direct number for this test
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        users: { id: 1, nickname: 'Test', contacts: null, user_positions: [] }
      } as any;
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      
      const result = await findById(1);
      
      expect(result.data.currentProgress).toBe(25.5);
      expect(typeof result.data.currentProgress).toBe('number');
    });
  });
});