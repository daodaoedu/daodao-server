/**
 * 專案管理系統控制器單元測試
 * 測試專案 CRUD 操作、權限控制、查詢篩選等功能
 */

import { Request, Response } from 'express';
import { ProjectController, projectController } from '@controllers/project.controller';
import { projectService } from '@services/project.service';
import { HTTP_STATUS } from '../../../constants/index';
import type { 
  ProjectCreateRequest, 
  ProjectUpdateRequest, 
  ProjectQueryParams,
  ProjectResponse 
} from '../../../types/project.types';  
import { education_stage_t, gender_t } from '../../../../generated/prisma';

// Mock dependencies
jest.mock('../../../services/project.service');

describe('Project Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockProjectService: jest.Mocked<typeof projectService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    external_id: 'test-user-123',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockProject: ProjectResponse = {
    id: 'project-123',
    userId: 1,
    imgUrl: 'https://example.com/project.jpg',
    title: '測試專案',
    description: '這是一個測試專案',
    motivation: '學習',
    motivationDescription: '想要學習新技能',
    goal: '完成專案開發',
    content: '專案內容描述',
    strategy: '計畫性執行',
    strategyDescription: '按照計畫逐步執行',
    resources: '線上資源',
    outcome: '成功完成',
    outcomeDescription: '達成預期目標',
    isPublic: true,
    status: 'Ongoing',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    interval: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    milestones: []
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request and response
    req = {
      user: {
        id: 1,
        external_id: 'test-external-123',
        mongo_id: 'test-user-123',
        gender: 'male' as gender_t,
        language: 'en',
        education_stage: 'primary' as education_stage_t,
        tag_list: [],
        contact_id: null,
        is_open_location: null,
        location_id: null,
        nickname: null,
        role_id: 1,
        is_open_profile: null,
        birth_date: null,
        basic_info_id: null,
        createdDate: null,
        updatedDate: null,
        created_by: null,
        created_at: new Date(),
        updated_by: null,
        updated_at: new Date(),
        email_verified: null,
        email_verified_at: null,
        is_active: true,
      },
      body: {},
      params: {},
      query: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    // Mock project service
    mockProjectService = projectService as jest.Mocked<typeof projectService>;
  });

  describe('createProject', () => {
    const createProjectData: ProjectCreateRequest = {
      title: '新專案',
      description: '新專案描述',
      motivation: '學習',
      goal: '達成目標',
      content: '專案內容',
      strategy: '執行策略',
      resources: '所需資源',
      outcome: '預期成果',
      isPublic: true,
      status: 'Not Started',
      interval: 1
    };

    beforeEach(() => {
      req.body = createProjectData;
    });

    it('should successfully create a project', async () => {
      mockProjectService.createProject.mockResolvedValue({
        success: true,
        data: mockProject,
        message: '專案創建成功'
      });

      await projectController.createProject(req as Request, res as Response);

      expect(mockProjectService.createProject).toHaveBeenCalledWith(1, createProjectData);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject,
        message: '專案創建成功'
      });
    });

    it('should handle unauthorized access', async () => {
      req.user = undefined;

      await projectController.createProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '未授權存取'
      });
    });

    it('should handle invalid user ID', async () => {
      req.user = { 
        id: 'invalid' as any, // 設置為無效的 id（非數字類型）
        external_id: 'invalid-user',
        mongo_id: 'test-mongo-123',
        gender: null,
        language: null,
        education_stage: null,
        tag_list: [],
        contact_id: null,
        is_open_location: null,
        location_id: null,
        nickname: null,
        role_id: 1,
        is_open_profile: null,
        birth_date: null,
        basic_info_id: null,
        createdDate: null,
        updatedDate: null,
        created_by: null,
        created_at: new Date(),
        updated_by: null,
        updated_at: new Date(),
        email_verified: null,
        email_verified_at: null,
        is_active: true
      };

      await projectController.createProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '未授權存取'
      });
    });

    it('should handle service error', async () => {
      mockProjectService.createProject.mockResolvedValue({
        success: false,
        error: '資料驗證失敗'
      });

      await projectController.createProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '資料驗證失敗'
      });
    });

    it('should handle unexpected errors', async () => {
      mockProjectService.createProject.mockRejectedValue(new Error('Database error'));

      await projectController.createProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockProjectService.createProject.mockRejectedValue('String error');

      await projectController.createProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '創建專案失敗'
      });
    });
  });

  describe('getProject', () => {
    beforeEach(() => {
      req.params = { id: 'project-123' };
    });

    it('should successfully get a project', async () => {
      mockProjectService.getProjectById.mockResolvedValue({
        success: true,
        data: mockProject
      });

      await projectController.getProject(req as Request, res as Response);

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith('project-123', 1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject
      });
    });

    it('should handle project not found', async () => {
      mockProjectService.getProjectById.mockResolvedValue({
        success: false,
        error: '專案不存在或無權限存取'
      });

      await projectController.getProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '專案不存在或無權限存取'
      });
    });

    it('should handle anonymous user', async () => {
      req.user = undefined;

      mockProjectService.getProjectById.mockResolvedValue({
        success: true,
        data: mockProject
      });

      await projectController.getProject(req as Request, res as Response);

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith('project-123', undefined);
    });

    it('should handle service errors', async () => {
      mockProjectService.getProjectById.mockRejectedValue(new Error('Database error'));

      await projectController.getProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('getProjects', () => {
    const mockProjectList = {
      projects: [mockProject],
      total: 1,
      page: 1,
      limit: 20
    };

    it('should successfully get projects list with default params', async () => {
      mockProjectService.getProjects.mockResolvedValue({
        success: true,
        data: mockProjectList
      });

      await projectController.getProjects(req as Request, res as Response);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: undefined,
        is_public: undefined,
        user_id: undefined,
        search: undefined,
        sort_by: 'created_at',
        sort_order: 'DESC'
      }, 1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProjectList
      });
    });

    it('should handle query parameters', async () => {
      req.query = {
        page: '2',
        limit: '10',
        status: 'Ongoing',
        is_public: 'true',
        user_id: '1',
        search: '測試',
        sort_by: 'title',
        sort_order: 'ASC'
      };

      mockProjectService.getProjects.mockResolvedValue({
        success: true,
        data: mockProjectList
      });

      await projectController.getProjects(req as Request, res as Response);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: 'Ongoing',
        is_public: true,
        user_id: 1,
        search: '測試',
        sort_by: 'title',
        sort_order: 'ASC'
      }, 1);
    });

    it('should handle invalid page and limit params', async () => {
      req.query = {
        page: 'invalid',
        limit: 'invalid'
      };

      mockProjectService.getProjects.mockResolvedValue({
        success: true,
        data: mockProjectList
      });

      await projectController.getProjects(req as Request, res as Response);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith({
        page: NaN, // parseInt('invalid') 返回 NaN
        limit: NaN, // parseInt('invalid') 返回 NaN
        status: undefined,
        is_public: undefined,
        user_id: undefined,
        search: undefined,
        sort_by: 'created_at',
        sort_order: 'DESC'
      }, 1);
    });

    it('should handle is_public boolean conversion', async () => {
      req.query = { is_public: 'false' };

      mockProjectService.getProjects.mockResolvedValue({
        success: true,
        data: mockProjectList
      });

      await projectController.getProjects(req as Request, res as Response);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        expect.objectContaining({ is_public: false }),
        1
      );
    });

    it('should handle service error', async () => {
      mockProjectService.getProjects.mockResolvedValue({
        success: false,
        error: '查詢參數錯誤'
      });

      await projectController.getProjects(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '查詢參數錯誤'
      });
    });
  });

  describe('updateProject', () => {
    const updateData: ProjectUpdateRequest = {
      title: '更新後的專案',
      description: '更新後的描述',
      status: 'Completed'
    };

    beforeEach(() => {
      req.params = { id: 'project-123' };
      req.body = updateData;
    });

    it('should successfully update a project', async () => {
      const updatedProject = { 
        ...mockProject, 
        ...updateData,
        milestones: mockProject.milestones.map(m => ({
          ...m,
          id: 1,
          tasks: m.tasks.map(t => ({ ...t, id: 1 }))
        }))
      };
      mockProjectService.updateProject.mockResolvedValue({
        success: true,
        data: updatedProject,
        message: '專案更新成功'
      });

      await projectController.updateProject(req as Request, res as Response);

      expect(mockProjectService.updateProject).toHaveBeenCalledWith('project-123', 1, updateData);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedProject,
        message: '專案更新成功'
      });
    });

    it('should handle unauthorized access', async () => {
      req.user = undefined;

      await projectController.updateProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '未授權存取'
      });
    });

    it('should handle project not found or no permission', async () => {
      mockProjectService.updateProject.mockResolvedValue({
        success: false,
        error: '專案不存在或無權限修改'
      });

      await projectController.updateProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '專案不存在或無權限修改'
      });
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      req.params = { id: 'project-123' };
    });

    it('should successfully delete a project', async () => {
      mockProjectService.deleteProject.mockResolvedValue({
        success: true,
        message: '專案刪除成功'
      });

      await projectController.deleteProject(req as Request, res as Response);

      expect(mockProjectService.deleteProject).toHaveBeenCalledWith('project-123', 1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '專案刪除成功'
      });
    });

    it('should handle unauthorized access', async () => {
      req.user = undefined;

      await projectController.deleteProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '未授權存取'
      });
    });

    it('should handle project not found or no permission', async () => {
      mockProjectService.deleteProject.mockResolvedValue({
        success: false,
        error: '專案不存在或無權限刪除'
      });

      await projectController.deleteProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '專案不存在或無權限刪除'
      });
    });
  });

  describe('getProjectStats', () => {
    const mockStats = {
      total_projects: 10,
      ongoing_projects: 3,
      completed_projects: 5,
      not_started_projects: 1,
      canceled_projects: 1
    };

    it('should get stats for current user', async () => {
      mockProjectService.getProjectStats.mockResolvedValue({
        success: true,
        data: mockStats
      });

      await projectController.getProjectStats(req as Request, res as Response);

      expect(mockProjectService.getProjectStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should get stats for specified user', async () => {
      req.query = { user_id: '2' };

      mockProjectService.getProjectStats.mockResolvedValue({
        success: true,
        data: mockStats
      });

      await projectController.getProjectStats(req as Request, res as Response);

      expect(mockProjectService.getProjectStats).toHaveBeenCalledWith(2);
    });

    it('should handle anonymous user', async () => {
      req.user = undefined;

      mockProjectService.getProjectStats.mockResolvedValue({
        success: true,
        data: mockStats
      });

      await projectController.getProjectStats(req as Request, res as Response);

      expect(mockProjectService.getProjectStats).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getMyProjects', () => {
    const mockMyProjects = {
      projects: [mockProject],
      total: 1,
      page: 1,
      limit: 20
    };

    it('should successfully get user\'s projects', async () => {
      mockProjectService.getProjects.mockResolvedValue({
        success: true,
        data: mockMyProjects
      });

      await projectController.getMyProjects(req as Request, res as Response);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: undefined,
        search: undefined,
        sort_by: 'updated_at',
        sort_order: 'DESC',
        user_id: 1
      }, 1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMyProjects
      });
    });

    it('should handle unauthorized access', async () => {
      req.user = undefined;

      await projectController.getMyProjects(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '未授權存取'
      });
    });

    it('should handle query parameters', async () => {
      req.query = {
        page: '2',
        limit: '10',
        status: 'Completed',
        search: '我的專案',
        sort_by: 'title',
        sort_order: 'ASC'
      };

      mockProjectService.getProjects.mockResolvedValue({
        success: true,
        data: mockMyProjects
      });

      await projectController.getMyProjects(req as Request, res as Response);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: 'Completed',
        search: '我的專案',
        sort_by: 'title',
        sort_order: 'ASC',
        user_id: 1
      }, 1);
    });
  });

  describe('duplicateProject', () => {
    beforeEach(() => {
      req.params = { id: 'project-123' };
    });

    it('should successfully duplicate a project', async () => {
      const duplicatedProject = {
        ...mockProject,
        id: '2',
        external_id: 'project-456',
        title: '測試專案 (副本)',
        isPublic: false,
        status: 'Not Started' as const
      };

      // Mock getting original project
      mockProjectService.getProjectById.mockResolvedValueOnce({
        success: true,
        data: mockProject
      });

      // Mock creating duplicate
      mockProjectService.createProject.mockResolvedValue({
        success: true,
        data: duplicatedProject,
        message: '專案複製成功'
      });

      await projectController.duplicateProject(req as Request, res as Response);

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith('project-123', 1);
      expect(mockProjectService.createProject).toHaveBeenCalledWith(1, {
        title: '測試專案 (副本)',
        description: mockProject.description,
        motivation: mockProject.motivation,
        motivationDescription: mockProject.motivationDescription,
        goal: mockProject.goal,
        content: mockProject.content,
        strategy: mockProject.strategy,
        strategyDescription: mockProject.strategyDescription,
        resources: mockProject.resources,
        outcome: mockProject.outcome,
        outcomeDescription: mockProject.outcomeDescription,
        isPublic: false,
        status: 'Not Started',
        interval: mockProject.interval
      });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: duplicatedProject,
        message: '專案複製成功'
      });
    });

    it('should handle unauthorized access', async () => {
      req.user = undefined;

      await projectController.duplicateProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '未授權存取'
      });
    });

    it('should handle original project not found', async () => {
      mockProjectService.getProjectById.mockResolvedValue({
        success: false,
        error: '專案不存在或無權限存取'
      });

      await projectController.duplicateProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '原專案不存在或無權限存取'
      });
    });

    it('should handle duplicate creation failure', async () => {
      mockProjectService.getProjectById.mockResolvedValue({
        success: true,
        data: mockProject
      });

      mockProjectService.createProject.mockResolvedValue({
        success: false,
        error: '創建副本失敗'
      });

      await projectController.duplicateProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '創建副本失敗'
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      req.params = { id: 'project-123' };
    });

    it('should handle service throwing unexpected errors', async () => {
      mockProjectService.getProjectById.mockRejectedValue(new Error('Unexpected error'));

      await projectController.getProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected error'
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockProjectService.getProjectById.mockRejectedValue('String error');

      await projectController.getProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '獲取專案失敗'
      });
    });

    it('should handle malformed request data', async () => {
      req.body = null;

      mockProjectService.createProject.mockResolvedValue({
        success: false,
        error: '請求資料格式錯誤'
      });

      await projectController.createProject(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('Class Instance Tests', () => {
    it('should create ProjectController instance', () => {
      const controller = new ProjectController();
      expect(controller).toBeInstanceOf(ProjectController);
      expect(typeof controller.createProject).toBe('function');
      expect(typeof controller.getProject).toBe('function');
      expect(typeof controller.getProjects).toBe('function');
      expect(typeof controller.updateProject).toBe('function');
      expect(typeof controller.deleteProject).toBe('function');
      expect(typeof controller.getProjectStats).toBe('function');
      expect(typeof controller.getMyProjects).toBe('function');
      expect(typeof controller.duplicateProject).toBe('function');
    });

    it('should export projectController instance', () => {
      expect(projectController).toBeInstanceOf(ProjectController);
    });
  });
});