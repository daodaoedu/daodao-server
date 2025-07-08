/**
 * 專案服務層單元測試
 * 測試專案業務邏輯、資料庫操作、權限控制等功能
 */

import { ProjectService, projectService } from '../../../services/project.service';
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectQueryParams,
  ProjectResponse
} from '../../../types/project.types';

// Mock Prisma service
jest.mock('../../../services/database/prisma.service', () => ({
  prisma: {
    $transaction: jest.fn(),
    projects: {
      findUnique: jest.fn(),
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
    (Project.create as jest.Mock).mockResolvedValue(mockProject);
    (Project.findOne as jest.Mock).mockResolvedValue(mockProject);
    (Project.findAndCountAll as jest.Mock).mockResolvedValue({
      count: 1,
      rows: [mockProject]
    });
    (Project.count as jest.Mock).mockResolvedValue(1);
  });

  describe('createProject', () => {
    const createData: ProjectCreateRequest = {
      title: '新專案',
      description: '新專案描述',
      motivation: '學習動機',
      goal: '專案目標',
      content: '專案內容',
      strategy: '執行策略',
      resource: '所需資源',
      outcome: '預期成果',
      is_public: true,
      status: 'Not Started',
      interval: 'Daily'
    };

    it('should successfully create a project', async () => {
      const service = new ProjectService();
      
      // Mock getProjectById for the created project
      const getProjectByIdSpy = jest.spyOn(service, 'getProjectById').mockResolvedValue({
        success: true,
        data: mockProject.toJSON() as ProjectResponse
      });

      const result = await service.createProject(1, createData);

      expect(Project.create).toHaveBeenCalledWith({
        ...createData,
        user_id: 1,
        created_by: 1,
        updated_by: 1,
        start_date: undefined,
        end_date: undefined
      });
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

      await service.createProject(1, createDataWithDates);

      expect(Project.create).toHaveBeenCalledWith({
        ...createData,
        user_id: 1,
        created_by: 1,
        updated_by: 1,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      });
    });

    it('should handle database errors', async () => {
      (Project.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await projectService.createProject(1, createData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle non-Error exceptions', async () => {
      (Project.create as jest.Mock).mockRejectedValue('String error');

      const result = await projectService.createProject(1, createData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('創建專案失敗');
    });
  });

  describe('getProjectById', () => {
    it('should successfully get project by ID for owner', async () => {
      const result = await projectService.getProjectById('project-123', 1);

      expect(Project.findOne).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          [Op.or]: [
            { user_id: 1 },
            { is_public: true }
          ]
        },
        include: expect.any(Array)
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should successfully get public project for anonymous user', async () => {
      const result = await projectService.getProjectById('project-123');

      expect(Project.findOne).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          is_public: true
        },
        include: expect.any(Array)
      });
      expect(result.success).toBe(true);
    });

    it('should handle project not found', async () => {
      (Project.findOne as jest.Mock).mockResolvedValue(null);

      const result = await projectService.getProjectById('nonexistent', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('專案不存在或無權限存取');
    });

    it('should handle database errors', async () => {
      (Project.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should format project response correctly', async () => {
      const projectWithRelations = {
        ...mockProject,
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
          interval: 'Weekly',
          created_at: new Date(),
          created_by: 1,
          updated_at: new Date(),
          updated_by: 1,
          version: 1,
          milestones: [{
            id: 1,
            project_id: 1,
            position: 1,
            name: '里程碑1',
            description: '描述',
            start_date: new Date(),
            end_date: new Date(),
            is_completed: false,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
            tasks: [{
              id: 1,
              milestone_id: 1,
              position: 1,
              name: '任務1',
              description: '任務描述',
              days_of_week: ['Monday'],
              is_completed: false,
              is_deleted: false,
              created_at: new Date(),
              updated_at: new Date()
            }]
          }],
          posts: [{
            id: 1,
            project_id: 1,
            user_id: 1,
            type: 'note',
            week: 1,
            title: '貼文標題',
            date: new Date(),
            visibility: 'public',
            status: 'published',
            created_at: new Date(),
            updated_at: new Date(),
            note: {},
            outcome: {},
            review: {}
          }]
        })
      };

      (Project.findOne as jest.Mock).mockResolvedValue(projectWithRelations);

      const result = await projectService.getProjectById('project-123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.milestones).toHaveLength(1);
      expect(result.data?.posts).toHaveLength(1);
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

      expect(Project.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0
      });
      expect(result.success).toBe(true);
      expect(result.data?.projects).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    it('should apply status filter', async () => {
      const paramsWithStatus = { ...queryParams, status: 'Ongoing' as const };

      await projectService.getProjects(paramsWithStatus, 1);

      expect(Project.findAndCountAll).toHaveBeenCalledWith({
        where: { status: 'Ongoing' },
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0
      });
    });

    it('should apply public filter', async () => {
      const paramsWithPublic = { ...queryParams, is_public: true };

      await projectService.getProjects(paramsWithPublic, 1);

      expect(Project.findAndCountAll).toHaveBeenCalledWith({
        where: { is_public: true },
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0
      });
    });

    it('should apply user filter', async () => {
      const paramsWithUser = { ...queryParams, user_id: 2 };

      await projectService.getProjects(paramsWithUser, 1);

      expect(Project.findAndCountAll).toHaveBeenCalledWith({
        where: { user_id: 2 },
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0
      });
    });

    it('should apply search filter', async () => {
      const paramsWithSearch = { ...queryParams, search: '測試' };

      await projectService.getProjects(paramsWithSearch, 1);

      expect(Project.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: '%測試%' } },
            { description: { [Op.iLike]: '%測試%' } },
            { goal: { [Op.iLike]: '%測試%' } }
          ]
        },
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0
      });
    });

    it('should show only public projects for anonymous users', async () => {
      await projectService.getProjects(queryParams);

      expect(Project.findAndCountAll).toHaveBeenCalledWith({
        where: { is_public: true },
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0
      });
    });

    it('should calculate correct offset for pagination', async () => {
      const paramsWithPagination = { ...queryParams, page: 3, limit: 10 };

      await projectService.getProjects(paramsWithPagination, 1);

      expect(Project.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 20 // (3-1) * 10
      });
    });

    it('should handle database errors', async () => {
      (Project.findAndCountAll as jest.Mock).mockRejectedValue(new Error('Database error'));

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

      expect(Project.findOne).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          user_id: 1
        }
      });
      expect(mockProject.update).toHaveBeenCalledWith({
        ...updateData,
        updated_by: 1,
        start_date: undefined,
        end_date: undefined
      });
      expect(getProjectByIdSpy).toHaveBeenCalledWith('project-123', 1);
      expect(result.success).toBe(true);
      expect(result.message).toBe('專案更新成功');

      getProjectByIdSpy.mockRestore();
    });

    it('should handle project not found', async () => {
      (Project.findOne as jest.Mock).mockResolvedValue(null);

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

      expect(mockProject.update).toHaveBeenCalledWith({
        title: '更新的標題',
        description: '更新的描述',
        status: 'Completed',
        updated_by: 1,
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-11-30')
      });
    });

    it('should handle database errors', async () => {
      mockProject.update.mockRejectedValue(new Error('Update failed'));

      const result = await projectService.updateProject('project-123', 1, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('deleteProject', () => {
    it('should successfully delete project', async () => {
      const result = await projectService.deleteProject('project-123', 1);

      expect(Project.findOne).toHaveBeenCalledWith({
        where: {
          external_id: 'project-123',
          user_id: 1
        }
      });
      expect(mockProject.destroy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('專案刪除成功');
    });

    it('should handle project not found', async () => {
      (Project.findOne as jest.Mock).mockResolvedValue(null);

      const result = await projectService.deleteProject('nonexistent', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('專案不存在或無權限刪除');
    });

    it('should handle database errors', async () => {
      mockProject.destroy.mockRejectedValue(new Error('Delete failed'));

      const result = await projectService.deleteProject('project-123', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('getProjectStats', () => {
    it('should get stats for specific user', async () => {
      (Project.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // ongoing
        .mockResolvedValueOnce(5)  // completed
        .mockResolvedValueOnce(1)  // not started
        .mockResolvedValueOnce(1); // canceled

      const result = await projectService.getProjectStats(1);

      expect(Project.count).toHaveBeenCalledTimes(5);
      expect(Project.count).toHaveBeenCalledWith({ where: { user_id: 1 } });
      expect(Project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Ongoing' } });
      expect(Project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Completed' } });
      expect(Project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Not Started' } });
      expect(Project.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'Canceled' } });
      
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
      (Project.count as jest.Mock)
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(8)  // ongoing
        .mockResolvedValueOnce(10) // completed
        .mockResolvedValueOnce(1)  // not started
        .mockResolvedValueOnce(1); // canceled

      const result = await projectService.getProjectStats();

      expect(Project.count).toHaveBeenCalledWith({ where: { is_public: true } });
      expect(Project.count).toHaveBeenCalledWith({ where: { is_public: true, status: 'Ongoing' } });
      expect(result.success).toBe(true);
      expect(result.data?.total_projects).toBe(20);
    });

    it('should handle database errors', async () => {
      (Project.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await projectService.getProjectStats(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('formatProjectResponse', () => {
    it('should format project response correctly', () => {
      const service = new ProjectService();
      
      // Access private method for testing
      const formatMethod = (service as any).formatProjectResponse;
      const result = formatMethod.call(service, mockProject);

      expect(result.id).toBe(1);
      expect(result.external_id).toBe('project-123');
      expect(result.title).toBe('測試專案');
      expect(result.description).toBe('測試專案描述');
      expect(result.milestones).toEqual([]);
      expect(result.posts).toEqual([]);
    });

    it('should handle missing description', () => {
      const service = new ProjectService();
      const projectWithoutDescription = {
        ...mockProject,
        toJSON: jest.fn().mockReturnValue({
          ...mockProject.toJSON(),
          description: null
        })
      };

      const formatMethod = (service as any).formatProjectResponse;
      const result = formatMethod.call(service, projectWithoutDescription);

      expect(result.description).toBe('');
    });

    it('should format milestones and tasks correctly', () => {
      const service = new ProjectService();
      const projectWithMilestones = {
        ...mockProject,
        toJSON: jest.fn().mockReturnValue({
          ...mockProject.toJSON(),
          milestones: [{
            id: 1,
            project_id: 1,
            position: 1,
            name: '里程碑1',
            description: null, // Test null description
            start_date: new Date(),
            end_date: new Date(),
            is_completed: false,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
            tasks: [{
              id: 1,
              milestone_id: 1,
              position: 1,
              name: '任務1',
              description: null, // Test null description
              days_of_week: ['Monday'],
              is_completed: false,
              is_deleted: false,
              created_at: new Date(),
              updated_at: new Date()
            }]
          }]
        })
      };

      const formatMethod = (service as any).formatProjectResponse;
      const result = formatMethod.call(service, projectWithMilestones);

      expect(result.milestones).toHaveLength(1);
      expect(result.milestones[0].description).toBe('');
      expect(result.milestones[0].tasks).toHaveLength(1);
      expect(result.milestones[0].tasks[0].description).toBe('');
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
    it('should handle undefined milestones and posts', () => {
      const service = new ProjectService();
      const projectWithUndefinedRelations = {
        ...mockProject,
        toJSON: jest.fn().mockReturnValue({
          ...mockProject.toJSON(),
          milestones: undefined,
          posts: undefined
        })
      };

      const formatMethod = (service as any).formatProjectResponse;
      const result = formatMethod.call(service, projectWithUndefinedRelations);

      expect(result.milestones).toEqual([]);
      expect(result.posts).toEqual([]);
    });

    it('should handle empty task arrays', () => {
      const service = new ProjectService();
      const projectWithEmptyTasks = {
        ...mockProject,
        toJSON: jest.fn().mockReturnValue({
          ...mockProject.toJSON(),
          milestones: [{
            id: 1,
            project_id: 1,
            position: 1,
            name: '里程碑1',
            description: '描述',
            start_date: new Date(),
            end_date: new Date(),
            is_completed: false,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
            tasks: undefined
          }]
        })
      };

      const formatMethod = (service as any).formatProjectResponse;
      const result = formatMethod.call(service, projectWithEmptyTasks);

      expect(result.milestones[0].tasks).toEqual([]);
    });
  });
});