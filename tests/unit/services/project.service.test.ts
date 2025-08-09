/**
 * 專案服務層單元測試
 * 測試專案業務邏輯、資料庫操作、權限控制等功能
 */

import { ProjectService, projectService } from '@/services/project.service';
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectQueryParams,
  ProjectResponse
} from '@/types/project.types';
import { prisma } from '@/services/database/prisma.service';

// Mock legacy Project model (kept for backward compatibility in some tests)
const Project = {
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
};

// Mock Prisma service
jest.mock('@/services/database/prisma.service', () => ({
  prisma: {
    $transaction: jest.fn(),
    project: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    milestones: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    tasks: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    posts: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    notes: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    outcomes: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    reviews: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    contacts: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

describe('Project Service', () => {
  let mockProject: any;
  let mockUser: any;
  let mockContact: any;

  // Get prisma mock at module level
  const { prisma } = require('@/services/database/prisma.service');
  const mockPrisma = prisma as any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock database models
    mockProject = {
      id: 1,
      external_id: 'project-123',
      user_id: 1,
      title: '測試專案',
      description: '測試專案描述',
      motivation: '學習',
      goal: '完成目標',
      content: '專案內容',
      strategy: '執行策略',
      resource: '所需資源',
      outcome: '預期成果',
      is_public: true,
      status: 'Ongoing',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      interval: 'Weekly',
      created_at: new Date(),
      created_by: 1,
      updated_at: new Date(),
      updated_by: 1,
      version: 1,
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        external_id: 'project-123',
        user_id: 1,
        title: '測試專案',
        description: '測試專案描述',
        motivation: '學習',
        goal: '完成目標',
        content: '專案內容',
        strategy: '執行策略',
        resource: '所需資源',
        outcome: '預期成果',
        is_public: true,
        status: 'Ongoing',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        interval: 'Weekly',
        created_at: new Date(),
        created_by: 1,
        updated_at: new Date(),
        updated_by: 1,
        version: 1,
        milestones: [],
        posts: []
      }),
      update: jest.fn(),
      destroy: jest.fn()
    };

    mockUser = {
      id: 1,
      username: 'testuser',
      name: 'Test User'
    };

    mockContact = {
      id: 1,
      user_id: 1,
      email: 'test@example.com'
    };

    // Setup default mock implementations
    mockPrisma.project.create.mockResolvedValue(mockProject);
    mockPrisma.project.findFirst.mockResolvedValue(mockProject);
    mockPrisma.project.findMany.mockResolvedValue([mockProject]);
    mockPrisma.project.count.mockResolvedValue(1);
    
    // Setup transaction mock to return the same mocks
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        users: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            role_id: 1,
            roles: []
          })
        },
        project: {
          create: jest.fn().mockResolvedValue(mockProject),
          findFirst: jest.fn().mockResolvedValue(mockProject),
          findMany: jest.fn().mockResolvedValue([mockProject]),
          count: jest.fn().mockResolvedValue(1),
          update: jest.fn().mockResolvedValue(mockProject),
          delete: jest.fn().mockResolvedValue(mockProject)
        }
      };
      return await callback(txMock);
    });
  });

  describe('createProject', () => {
    const createData: ProjectCreateRequest = {
      title: '新專案',
      description: '新專案描述',
      motivation: '學習動機',
      goal: '專案目標',
      content: '專案內容',
      strategy: '執行策略',
      resources: '所需資源',
      outcome: '預期成果',
      isPublic: true,
      status: 'Not Started',
      interval: 1
    };

    it('should successfully create a project', async () => {
      const service = new ProjectService();
      
      // Mock getProjectById for the created project
      const getProjectByIdSpy = jest.spyOn(service, 'getProjectById').mockResolvedValue({
        success: true,
        data: mockProject.toJSON() as ProjectResponse
      });

      const result = await service.createProject(1, createData);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(getProjectByIdSpy).toHaveBeenCalledWith('project-123', 1);
      expect(result.success).toBe(true);
      expect(result.message).toBe('專案創建成功');
      expect(result.data).toBeDefined();

      getProjectByIdSpy.mockRestore();
    });

    it('should handle dates in create data', async () => {
      const createDataWithDates = {
        ...createData,
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };

      const service = new ProjectService();
      jest.spyOn(service, 'getProjectById').mockResolvedValue({
        success: true,
        data: mockProject.toJSON() as ProjectResponse
      });

      const result = await service.createProject(1, createDataWithDates);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPrisma.$transaction.mockReset();
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(projectService.createProject(1, createData))
        .rejects.toThrow('Database error');
    });

    it('should handle non-Error exceptions', async () => {
      mockPrisma.$transaction.mockReset();
      mockPrisma.$transaction.mockRejectedValue('String error');

      await expect(projectService.createProject(1, createData))
        .rejects.toBe('String error');
    });
  });

  describe('getProjectById', () => {
    it('should successfully get project by ID for owner', async () => {
      const result = await projectService.getProjectById('project-123', 1);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          OR: [
            { user_id: 1 },
            { is_public: true }
          ]
        },
        include: expect.any(Object)
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should successfully get public project for anonymous user', async () => {
      const result = await projectService.getProjectById('project-123');

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          is_public: true
        },
        include: expect.any(Object)
      });
      expect(result.success).toBe(true);
    });

    it('should handle project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const result = await projectService.getProjectById('nonexistent', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('專案不存在或無權限存取');
    });

    it('should handle database errors', async () => {
      mockPrisma.project.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should format project response correctly', async () => {
      const projectWithRelations = {
        id: 1,
        external_id: 'project-123',
        user_id: 1,
        img_url: null,
        title: '測試專案',
        description: '測試專案描述',
        motivation: '學習',
        motivation_description: null,
        goal: '完成目標',
        content: '專案內容',
        strategy: '執行策略',
        strategy_description: null,
        resource: '所需資源',
        outcome: '預期成果',
        outcome_description: null,
        is_public: true,
        status: 'Ongoing',
        start_date: null,
        end_date: null,
        interval: 1,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        users: {
          id: 1,
          nickname: '測試用戶',
          external_id: 'user-123',
          contacts: {
            photo_url: null
          },
          user_positions: [{
            position: {
              name: '學習者'
            }
          }]
        },
        milestone: [{
          id: 1,
          position: 1,
          name: '里程碑1',
          description: '描述',
          start_date: new Date(),
          end_date: new Date(),
          is_completed: false,
          task: [{
            id: 1,
            name: '任務1',
            position: 1,
            description: '任務描述',
            days_of_week: ['Monday'],
            is_completed: false
          }]
        }]
      };

      (prisma.project.findFirst as jest.Mock).mockResolvedValue(projectWithRelations);

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.milestones).toHaveLength(1);
      expect(result.data?.milestones?.[0].tasks).toHaveLength(1);
    });
  });

  describe('getProjects', () => {
    const queryParams: ProjectQueryParams = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'DESC'
    };

    it('should successfully get projects list', async () => {
      const result = await projectService.getProjects(queryParams, 1);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0
      });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: {} });
      expect(result.success).toBe(true);
      expect(result.data?.projects).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    it('should apply status filter', async () => {
      const paramsWithStatus = { ...queryParams, status: 'Ongoing' as const };

      await projectService.getProjects(paramsWithStatus, 1);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'Ongoing' },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0
      });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { status: 'Ongoing' } });
    });

    it('should apply public filter', async () => {
      const paramsWithPublic = { ...queryParams, is_public: true };

      await projectService.getProjects(paramsWithPublic, 1);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { is_public: true },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0
      });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { is_public: true } });
    });

    it('should apply user filter', async () => {
      const paramsWithUser = { ...queryParams, user_id: 2 };

      await projectService.getProjects(paramsWithUser, 1);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { user_id: 2 },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0
      });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { user_id: 2 } });
    });

    it('should apply search filter', async () => {
      const paramsWithSearch = { ...queryParams, search: '測試' };

      await projectService.getProjects(paramsWithSearch, 1);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: '測試', mode: 'insensitive' } },
            { description: { contains: '測試', mode: 'insensitive' } },
            { goal: { contains: '測試', mode: 'insensitive' } }
          ]
        },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0
      });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: '測試', mode: 'insensitive' } },
            { description: { contains: '測試', mode: 'insensitive' } },
            { goal: { contains: '測試', mode: 'insensitive' } }
          ]
        }
      });
    });

    it('should show only public projects for anonymous users', async () => {
      await projectService.getProjects(queryParams);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { is_public: true },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0
      });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { is_public: true } });
    });

    it('should calculate correct offset for pagination', async () => {
      const paramsWithPagination = { ...queryParams, page: 3, limit: 10 };

      await projectService.getProjects(paramsWithPagination, 1);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 10,
        skip: 20 // (3-1) * 10
      });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should handle database errors', async () => {
      mockPrisma.project.findMany.mockRejectedValue(new Error('Database error'));

      const result = await projectService.getProjects(queryParams, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('updateProject', () => {
    const updateData: ProjectUpdateRequest = {
      title: '更新的標題',
      description: '更新的描述',
      status: 'Completed'
    };

    it('should successfully update project', async () => {
      const service = new ProjectService();
      const getProjectByIdSpy = jest.spyOn(service, 'getProjectById').mockResolvedValue({
        success: true,
        data: mockProject.toJSON() as ProjectResponse
      });

      const result = await service.updateProject('project-123', 1, updateData);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          user_id: 1
        }
      });
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: expect.objectContaining({
          ...updateData,
          updated_by: 1,
          start_date: undefined,
          end_date: undefined
        })
      });
      expect(getProjectByIdSpy).toHaveBeenCalledWith('project-123', 1);
      expect(result.success).toBe(true);
      expect(result.message).toBe('專案更新成功');

      getProjectByIdSpy.mockRestore();
    });

    it('should handle project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const result = await projectService.updateProject('nonexistent', 1, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('專案不存在或無權限修改');
    });

    it('should handle dates in update data', async () => {
      const updateDataWithDates = {
        ...updateData,
        start_date: '2024-02-01',
        end_date: '2024-11-30'
      };

      const service = new ProjectService();
      jest.spyOn(service, 'getProjectById').mockResolvedValue({
        success: true,
        data: mockProject.toJSON() as ProjectResponse
      });

      await service.updateProject('project-123', 1, updateDataWithDates);

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: expect.objectContaining({
          title: '更新的標題',
          description: '更新的描述',
          status: 'Completed',
          updated_by: 1,
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-11-30')
        })
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.project.update.mockRejectedValue(new Error('Update failed'));

      const result = await projectService.updateProject('project-123', 1, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('deleteProject', () => {
    it('should successfully delete project', async () => {
      const result = await projectService.deleteProject('project-123', 1);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          user_id: 1
        }
      });
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id }
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('專案刪除成功');
    });

    it('should handle project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const result = await projectService.deleteProject('nonexistent', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('專案不存在或無權限刪除');
    });

    it('should handle database errors', async () => {
      mockPrisma.project.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await projectService.deleteProject('project-123', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('getProjectStats', () => {
    it('should get stats for specific user', async () => {
      mockPrisma.project.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // ongoing
        .mockResolvedValueOnce(5)  // completed
        .mockResolvedValueOnce(1)  // not started
        .mockResolvedValueOnce(1); // canceled

      const result = await projectService.getProjectStats(1);

      expect(mockPrisma.project.count).toHaveBeenCalledTimes(5);
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { user_id: 1 } });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Ongoing' } });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Completed' } });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Not Started' } });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Canceled' } });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total_projects: 10,
        ongoing_projects: 3,
        completed_projects: 5,
        not_started_projects: 1,
        canceled_projects: 1
      });
    });

    it('should get public stats for anonymous user', async () => {
      mockPrisma.project.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(8)  // ongoing
        .mockResolvedValueOnce(10) // completed
        .mockResolvedValueOnce(1)  // not started
        .mockResolvedValueOnce(1); // canceled

      const result = await projectService.getProjectStats();

      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { is_public: true } });
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { is_public: true, status: 'Ongoing' } });
      expect(result.success).toBe(true);
      expect(result.data?.total_projects).toBe(20);
    });

    it('should handle database errors', async () => {
      mockPrisma.project.count.mockRejectedValue(new Error('Database error'));

      const result = await projectService.getProjectStats(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('formatProjectResponse', () => {
    it('should format project response correctly', async () => {
      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('project-123');
      expect(result.data?.title).toBe('測試專案');
      expect(result.data?.description).toBe('測試專案描述');
      expect(result.data?.milestones).toEqual([]);
    });

    it('should handle missing description', async () => {
      const service = new ProjectService();
      const projectWithoutDescription = {
        ...mockProject,
        toJSON: jest.fn().mockReturnValue({
          ...mockProject.toJSON(),
          description: null
        })
      };

      const projectData = {
        ...mockProject,
        description: null
      };
      mockPrisma.project.findFirst.mockResolvedValue(projectData);

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe('');
    });

    it('should format milestones and tasks correctly', async () => {
      const projectWithMilestones = {
        ...mockProject,
        milestone: [{
          id: 1,
          position: 1,
          name: '里程碑1',
          description: null,
          start_date: new Date(),
          end_date: new Date(),
          is_completed: false,
          task: [{
            id: 1,
            name: '任務1',
            position: 1,
            description: null,
            days_of_week: ['Monday'],
            is_completed: false
          }]
        }]
      };
      mockPrisma.project.findFirst.mockResolvedValue(projectWithMilestones);

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.milestones).toHaveLength(1);
      expect(result.data?.milestones?.[0].description).toBe('');
      expect(result.data?.milestones?.[0].tasks).toHaveLength(1);
      expect(result.data?.milestones?.[0].tasks?.[0].description).toBe('');
    });
  });

  describe('Service Instance Tests', () => {
    it('should create ProjectService instance', () => {
      const service = new ProjectService();
      expect(service).toBeInstanceOf(ProjectService);
      expect(typeof service.createProject).toBe('function');
      expect(typeof service.getProjectById).toBe('function');
      expect(typeof service.getProjects).toBe('function');
      expect(typeof service.updateProject).toBe('function');
      expect(typeof service.deleteProject).toBe('function');
      expect(typeof service.getProjectStats).toBe('function');
    });

    it('should export projectService instance', () => {
      expect(projectService).toBeInstanceOf(ProjectService);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined milestones and posts', async () => {
      const projectWithUndefinedRelations = {
        ...mockProject,
        milestone: undefined
      };
      mockPrisma.project.findFirst.mockResolvedValue(projectWithUndefinedRelations);

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.milestones).toEqual([]);
    });

    it('should handle empty task arrays', async () => {
      const projectWithEmptyTasks = {
        ...mockProject,
        milestone: [{
          id: 1,
          position: 1,
          name: '里程碑1',
          description: '描述',
          start_date: new Date(),
          end_date: new Date(),
          is_completed: false,
          task: undefined
        }]
      };
      mockPrisma.project.findFirst.mockResolvedValue(projectWithEmptyTasks);

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.milestones?.[0].tasks).toEqual([]);
    });
  });
});