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

const mockCreateEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: {
    createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  },
}));

// Mock email queue
const mockEnqueuePracticeEmail = jest.fn().mockResolvedValue('job-id');
jest.mock('@/queues', () => ({
  enqueuePracticeEmail: mockEnqueuePracticeEmail
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
    mockEnqueuePracticeEmail.mockResolvedValue('job-id');
    mockCreateEvent.mockResolvedValue(undefined);
    prismaMock.follows.findMany.mockResolvedValue([] as any);
    prismaMock.connections.findMany.mockResolvedValue([] as any);
  });

  describe('findAll', () => {
    it('should retrieve practice list successfully', async () => {
      const mockPractices = [
        {
          id: 1,
          external_id: 'practice-uuid-1',
          title: 'Test Practice',
          practice_action: '閱讀技術書籍',
          start_date: new Date('2025-01-01'),
          end_date: new Date('2025-01-14'),
          duration_days: 14,
          frequency_min_days: 4,
          frequency_max_days: 7,
          session_duration_minutes: 30,
          practice_time_periods: ['morning', 'evening'],
          status: 'active',
          has_resources: false,
          progress_percentage: 50, // Use plain number
          first_checkin_at: new Date(),
          theme_color: '#FCDD84',
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
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      const result = await findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Test Practice');
      expect(result.data[0].progressPercentage).toBe(50);
      expect(result.data[0].checkInCount).toBe(0);
      expect(result.data[0].themeColor).toBe('#FCDD84');
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Practice list retrieved',
        expect.any(Object)
      );
    });

    it('should handle search filtering', async () => {
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

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

    it('should handle status filtering', async () => {
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      await findAll({ status: 'active' });

      expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active'
          })
        })
      );
    });

    it('should throw error when database fails', async () => {
      prismaMock.practices.findMany.mockRejectedValue(new Error('Database error'));

      await expect(findAll({})).rejects.toThrow('Database error');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should retrieve practice by ID successfully', async () => {
      const mockPractice = {
        id: 1,
        external_id: 'test-practice-uuid',
        title: 'Test Practice',
        practice_action: '閱讀技術書籍',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-14'),
        duration_days: 14,
        frequency_min_days: 4,
        frequency_max_days: 7,
        session_duration_minutes: 30,
        practice_time_periods: ['morning', 'evening'],
        status: 'active',
        has_resources: false,
        progress_percentage: 50, // Use plain number
        first_checkin_at: new Date(),
        theme_color: '#FCDD84',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
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
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      const result = await findById(1);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('test-practice-uuid');
      expect(result.data.title).toBe('Test Practice');
      expect(result.data.progressPercentage).toBe(50);
      expect(result.data.checkInCount).toBe(0);
      expect(result.data.themeColor).toBe('#FCDD84');
    });

    it('should record view when userId provided', async () => {
      const mockPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'Test Practice',
        status: 'active',
        progress_percentage: 20,
        practice_time_periods: [],
        theme_color: '#FCDD84',
        created_at: new Date(),
        deleted_at: null,
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

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
      practiceAction: '閱讀技術書籍',
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 14,
      frequencyMinDays: 4,
      frequencyMaxDays: 7,
      sessionDurationMinutes: 30,
      practiceTimePeriods: ['morning', 'evening'] as ('morning' | 'afternoon' | 'evening' | 'night')[],
      tags: ['test'],
      resources: []
    };

    it('should create practice successfully with status not_started and progress 20', async () => {
      const mockCreatedPractice = {
        id: 1,
        external_id: 'practice-uuid-1',
        title: 'New Practice',
        practice_action: '閱讀技術書籍',
        start_date: new Date(),
        end_date: new Date(Date.now() + 13 * 86400000),
        duration_days: 14,
        frequency_min_days: 4,
        frequency_max_days: 7,
        session_duration_minutes: 30,
        practice_time_periods: ['morning', 'evening'],
        status: 'not_started',
        has_resources: false,
        progress_percentage: 20, // Use plain number
        first_checkin_at: null,
        theme_color: '#FCDD84',
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

      prismaMock.practices.count.mockResolvedValue(0); // For theme color assignment
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);
      prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: 'test' } as any);
      prismaMock.entity_tags.upsert.mockResolvedValue({} as any);
      // Fire-and-forget: create calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      const result = await create(mockCreateRequest, 1);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Practice');
      expect(result.data.status).toBe('not_started');
      expect(result.data.progressPercentage).toBe(20);
      expect(result.data.checkInCount).toBe(0);
      expect(result.data.themeColor).toBe('#FCDD84');
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Practice created',
        expect.objectContaining({ practiceId: 1, userId: 1 })
      );
    });

    it('should handle tag linking', async () => {
      const mockCreatedPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'New Practice',
        status: 'not_started',
        progress_percentage: 20,
        practice_time_periods: [],
        theme_color: '#FCDD84',
        created_at: new Date(),
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.count.mockResolvedValue(0); // For theme color assignment
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);
      prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: 'test' } as any);
      prismaMock.entity_tags.upsert.mockResolvedValue({} as any);
      // Fire-and-forget: create calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      await create(mockCreateRequest, 1);

      expect(prismaMock.tags.upsert).toHaveBeenCalledWith({
        where: { name: 'test' },
        update: {},
        create: { name: 'test' }
      });
    });

    it('should throw error when creation fails', async () => {
      prismaMock.practices.count.mockResolvedValue(0); // For theme color assignment
      prismaMock.practices.create.mockRejectedValue(new Error('Database error'));

      await expect(create(mockCreateRequest, 1)).rejects.toThrow('Database error');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should send PE01 email when creating non-draft practice', async () => {
      const mockCreatedPractice = {
        id: 1,
        external_id: 'practice-uuid-1',
        title: 'New Practice',
        status: 'not_started',
        progress_percentage: 20,
        practice_time_periods: ['morning'],
        theme_color: '#FCDD84',
        created_at: new Date(),
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);
      prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: 'test' } as any);
      prismaMock.entity_tags.upsert.mockResolvedValue({} as any);
      // Fire-and-forget: create calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      await create({ ...mockCreateRequest, isDraft: false }, 1);

      expect(mockEnqueuePracticeEmail).toHaveBeenCalledWith('PE01', 1, 1);
    });

    it('should notify user followers and connected partners when creating non-draft practice', async () => {
      const mockCreatedPractice = {
        id: 1,
        external_id: 'practice-uuid-1',
        title: 'New Practice',
        status: 'not_started',
        privacy_status: 'public',
        progress_percentage: 20,
        practice_time_periods: ['morning'],
        theme_color: '#FCDD84',
        created_at: new Date(),
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);
      prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: 'test' } as any);
      prismaMock.entity_tags.upsert.mockResolvedValue({} as any);
      prismaMock.follows.findMany.mockResolvedValue([
        { follower_id: 2 },
        { follower_id: 3 },
      ] as any);
      prismaMock.connections.findMany.mockResolvedValue([
        { user_a_id: 1, user_b_id: 3 },
        { user_a_id: 1, user_b_id: 4 },
      ] as any);

      await create({ ...mockCreateRequest, isDraft: false }, 1);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const practiceCreatedCalls = mockCreateEvent.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'PracticeCreated'
      );
      expect(practiceCreatedCalls).toHaveLength(3);
      expect(practiceCreatedCalls.map((call: any[]) => call[0].recipientId)).toEqual(
        expect.arrayContaining([2, 3, 4])
      );
      practiceCreatedCalls.forEach((call: any[]) => {
        expect(call[0]).toMatchObject({
          actorId: 1,
          entityType: 'practice',
          entityId: 1,
          priority: 'P2',
          payload: { practice_title: 'New Practice' },
        });
      });
    });

    it.each(['private', 'delayed'])(
      'should not notify followers or connected partners for %s practice creation',
      async (privacyStatus) => {
        const mockCreatedPractice = {
          id: 1,
          external_id: 'practice-uuid-1',
          title: 'Non Public Practice',
          status: 'not_started',
          privacy_status: privacyStatus,
          progress_percentage: 20,
          practice_time_periods: ['morning'],
          theme_color: '#FCDD84',
          created_at: new Date(),
          users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
        } as any;

        prismaMock.practices.count.mockResolvedValue(0);
        prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);
        prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: 'test' } as any);
        prismaMock.entity_tags.upsert.mockResolvedValue({} as any);

        await create({ ...mockCreateRequest, isDraft: false }, 1);
        await Promise.resolve();
        await Promise.resolve();

        expect(mockCreateEvent).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: 'PracticeCreated' })
        );
      }
    );

    it('should NOT send PE01 email when creating draft practice', async () => {
      const mockCreatedPractice = {
        id: 1,
        external_id: 'practice-uuid-1',
        title: 'Draft Practice',
        status: 'draft',
        progress_percentage: 20,
        practice_time_periods: ['morning'],
        theme_color: '#FCDD84',
        created_at: new Date(),
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice);
      prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: 'test' } as any);
      prismaMock.entity_tags.upsert.mockResolvedValue({} as any);

      await create({ ...mockCreateRequest, isDraft: true }, 1);

      expect(mockEnqueuePracticeEmail).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockUpdateRequest = {
      title: 'Updated Practice'
    };

    it('should update practice successfully when status allows edit', async () => {
      const mockExistingPractice = {
        id: 1,
        user_id: 1,
        status: 'not_started',
        practice_time_periods: [],
        created_at: new Date(),
        deleted_at: null
      };
      const mockUpdatedPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'Updated Practice',
        status: 'not_started',
        progress_percentage: 20,
        practice_time_periods: [],
        theme_color: '#FCDD84',
        created_at: new Date(),
        deleted_at: null,
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.findUnique.mockResolvedValue(mockExistingPractice as any);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);

      const result = await update(1, mockUpdateRequest, 1);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Practice');
      expect(result.data.checkInCount).toBe(0);
      expect(result.data.themeColor).toBe('#FCDD84');
    });

    it('should throw error when practice not found', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(update(999, mockUpdateRequest, 1)).rejects.toThrow('實踐不存在');
    });

    it('should throw error when user lacks permission', async () => {
      const mockPractice = { id: 1, user_id: 2, status: 'not_started', deleted_at: null }; // Different user

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

      await expect(update(1, mockUpdateRequest, 1)).rejects.toThrow('沒有權限修改此實踐');
    });

    it('should throw error when status does not allow edit (archived)', async () => {
      const mockPractice = { id: 1, user_id: 1, status: 'archived', deleted_at: null };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

      await expect(update(1, mockUpdateRequest, 1)).rejects.toThrow('此實踐已封存，請先取消封存再進行編輯');
    });

    it('should strip locked fields and throw when no updatable fields remain after check-in', async () => {
      const mockPractice = {
        id: 1,
        user_id: 1,
        status: 'active',
        first_checkin_at: new Date(),
        deleted_at: null
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practice_checkins.count.mockResolvedValue(1); // Has check-ins

      // startDate is a locked field - after stripping, no fields remain
      await expect(update(1, { startDate: '2025-03-01' }, 1)).rejects.toThrow('沒有可更新的欄位');
    });

    it('should allow updating non-locked fields when locked fields are also present after check-in', async () => {
      const mockExistingPractice = {
        id: 1,
        user_id: 1,
        status: 'active',
        first_checkin_at: new Date(),
        practice_time_periods: ['morning'],
        created_at: new Date(),
        deleted_at: null
      };
      const mockUpdatedPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'Updated Title',
        status: 'active',
        progress_percentage: 50,
        practice_time_periods: ['morning'],
        theme_color: '#FCDD84',
        created_at: new Date(),
        deleted_at: null,
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.findUnique.mockResolvedValue(mockExistingPractice as any);
      prismaMock.practice_checkins.count.mockResolvedValue(1); // Has check-ins
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);

      // Send both locked (startDate) and non-locked (title) fields
      const result = await update(1, { title: 'Updated Title', startDate: '2025-03-01' }, 1);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
    });

    it('should send PE01 email when publishing draft (draft -> not_started)', async () => {
      const mockExistingPractice = {
        id: 1,
        user_id: 1,
        status: 'draft', // Was draft
        practice_time_periods: [],
        created_at: new Date(),
        deleted_at: null
      };
      const mockUpdatedPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'Published Practice',
        status: 'not_started', // Now published
        progress_percentage: 20,
        practice_time_periods: [],
        theme_color: '#FCDD84',
        created_at: new Date(),
        deleted_at: null,
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.findUnique.mockResolvedValue(mockExistingPractice as any);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      // Fire-and-forget: update calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      await update(1, { status: 'not_started' }, 1);

      expect(mockEnqueuePracticeEmail).toHaveBeenCalledWith('PE01', 1, 1);
    });

    it('should notify user followers and connected partners when publishing draft', async () => {
      const mockExistingPractice = {
        id: 1,
        user_id: 1,
        status: 'draft',
        practice_time_periods: [],
        created_at: new Date(),
        deleted_at: null
      };
      const mockUpdatedPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'Published Practice',
        status: 'not_started',
        privacy_status: 'public',
        progress_percentage: 20,
        practice_time_periods: [],
        theme_color: '#FCDD84',
        created_at: new Date(),
        deleted_at: null,
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.findUnique.mockResolvedValue(mockExistingPractice as any);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.follows.findMany.mockResolvedValue([{ follower_id: 2 }] as any);
      prismaMock.connections.findMany.mockResolvedValue([{ user_a_id: 1, user_b_id: 3 }] as any);

      await update(1, { status: 'not_started' }, 1);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const practiceCreatedCalls = mockCreateEvent.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'PracticeCreated'
      );
      expect(practiceCreatedCalls).toHaveLength(2);
      expect(practiceCreatedCalls.map((call: any[]) => call[0].recipientId)).toEqual(
        expect.arrayContaining([2, 3])
      );
    });

    it('should NOT send PE01 email for regular updates (not publishing draft)', async () => {
      const mockExistingPractice = {
        id: 1,
        user_id: 1,
        status: 'not_started', // Already published
        practice_time_periods: [],
        created_at: new Date(),
        deleted_at: null
      };
      const mockUpdatedPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'Updated Title',
        status: 'not_started',
        progress_percentage: 20,
        practice_time_periods: [],
        theme_color: '#FCDD84',
        created_at: new Date(),
        deleted_at: null,
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.findUnique.mockResolvedValue(mockExistingPractice as any);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);

      await update(1, { title: 'Updated Title' }, 1);

      expect(mockEnqueuePracticeEmail).not.toHaveBeenCalled();
    });
  });

  describe('deleteFunction', () => {
    it('should soft delete practice successfully', async () => {
      const mockPractice = { id: 1, user_id: 1, deleted_at: null };
      
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practices.update.mockResolvedValue({ ...mockPractice, status: 'archived' } as any);

      const result = await deleteFunction(1, 1);

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(prismaMock.practices.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          deleted_at: expect.any(Date),
          updated_at: expect.any(Date)
        }
      });
    });

    it('should throw error when practice not found', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(deleteFunction(999, 1)).rejects.toThrow('實踐不存在');
    });

    it('should throw error when user lacks permission', async () => {
      const mockPractice = { id: 1, user_id: 2, deleted_at: null }; // Different user

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

      await expect(deleteFunction(1, 1)).rejects.toThrow('沒有權限刪除此實踐');
    });
  });

  describe('findUserPractices', () => {
    it('should delegate to findAll with userId', async () => {
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

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
        { status: 'not_started', _count: { id: 1 } }
      ] as any;

      prismaMock.practices.aggregate.mockResolvedValue(mockPracticeStats);
      prismaMock.practice_checkins.aggregate.mockResolvedValue(mockCheckInStats);
      prismaMock.practices.groupBy.mockResolvedValue(mockStatusCounts);

      const result = await getUserStats(1);

      expect(result.success).toBe(true);
      expect(result.data.totalPractices).toBe(10);
      expect(result.data.activePractices).toBe(6);
      expect(result.data.completedPractices).toBe(3);
      expect(result.data.totalCheckIns).toBe(45);
      // averageStreak and maxStreak are not calculated from DB (fields don't exist)
      expect(result.data.averageStreak).toBe(0);
      expect(result.data.maxStreak).toBe(0);
    });

    it('should handle missing status counts gracefully', async () => {
      const mockPracticeStats = {
        _count: { id: 5 },
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
      expect(result.data.totalCheckIns).toBe(0);
      expect(result.data.averageStreak).toBe(0);
      expect(result.data.maxStreak).toBe(0);
    });

    it('should throw error when stats retrieval fails', async () => {
      prismaMock.practices.aggregate.mockRejectedValue(new Error('Database error'));

      await expect(getUserStats(1)).rejects.toThrow('Database error');
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
        external_id: 'practice-uuid',
        title: 'Test',
        practice_action: null,
        start_date: null,
        end_date: null,
        duration_days: null,
        frequency_min_days: null,
        frequency_max_days: null,
        session_duration_minutes: null,
        practice_time_periods: [],
        other_context: null,
        status: 'not_started',
        has_resources: false,
        progress_percentage: null,
        first_checkin_at: null,
        theme_color: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
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
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      const result = await findById(1);

      expect(result.data.practiceAction).toBeUndefined();
      expect(result.data.startDate).toBeUndefined();
      expect(result.data.endDate).toBeUndefined();
      expect(result.data.durationDays).toBeUndefined();
      expect(result.data.frequencyMinDays).toBeUndefined();
      expect(result.data.frequencyMaxDays).toBeUndefined();
      expect(result.data.sessionDurationMinutes).toBeUndefined();
      expect(result.data.otherContext).toBeUndefined();
      expect(result.data.progressPercentage).toBe(20); // INITIAL_PROGRESS default
      expect(result.data.checkInCount).toBe(0);
      expect(result.data.themeColor).toBeUndefined();
      expect(result.data.user.name).toBe('Unknown User');
    });

    it('should handle progress_percentage conversion correctly', async () => {
      const mockPractice = {
        id: 1,
        external_id: 'practice-uuid',
        title: 'Test',
        status: 'active',
        progress_percentage: 50.5,
        practice_time_periods: ['morning'],
        has_resources: false,
        theme_color: '#C3EEFF',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        users: { id: 1, external_id: 'user-1', nickname: 'Test', contacts: null, user_positions: [] }
      } as any;

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([{ practice_id: 1, _count: { id: 3 } }] as any);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      const result = await findById(1);

      expect(result.data.progressPercentage).toBe(50.5);
      expect(typeof result.data.progressPercentage).toBe('number');
    });
  });
});
