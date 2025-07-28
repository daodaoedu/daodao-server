/**
 * Project Controller
 * 專案控制器 - 處理專案相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { HTTP_STATUS } from '../constants/index';
import type { 
  ProjectCreateRequest, 
  ProjectUpdateRequest, 
  ProjectQueryParams 
} from '../types/project.types';

export class ProjectController {
  /**
   * 創建專案
   * POST /api/projects
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || typeof req.user.id !== 'number') {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: '未授權存取'
        });
        return;
      }

      const projectData: ProjectCreateRequest = req.body;
      const result = await projectService.createProject(req.user.id, projectData);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '創建專案失敗'
      });
    }
  }

  /**
   * 獲取專案詳情
   * GET /api/projects/:id
   */
  async getProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await projectService.getProjectById(id, userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '獲取專案失敗'
      });
    }
  }

  /**
   * 獲取專案列表
   * GET /api/projects
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const queryParams: ProjectQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as 'Ongoing' | 'Completed' | 'Not Started' | 'Canceled' | undefined,
        is_public: req.query.is_public ? req.query.is_public === 'true' : undefined,
        user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
        search: req.query.search as string,
        sort_by: (['created_at', 'updated_at', 'title', 'start_date', 'end_date'].includes(req.query.sort_by as string)) 
          ? (req.query.sort_by as 'created_at' | 'updated_at' | 'title' | 'start_date' | 'end_date') 
          : 'created_at',
        sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'DESC'
      };

      const userId = req.user?.id;
      const result = await projectService.getProjects(queryParams, userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '獲取專案列表失敗'
      });
    }
  }

  /**
   * 更新專案
   * PUT /api/projects/:id
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: '未授權存取'
        });
        return;
      }

      const { id } = req.params;
      const updateData: ProjectUpdateRequest = req.body;

      const result = await projectService.updateProject(id, req.user.id, updateData);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '更新專案失敗'
      });
    }
  }

  /**
   * 刪除專案
   * DELETE /api/projects/:id
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: '未授權存取'
        });
        return;
      }

      const { id } = req.params;
      const result = await projectService.deleteProject(id, req.user.id);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '刪除專案失敗'
      });
    }
  }

  /**
   * 獲取專案統計資訊
   * GET /api/projects/stats
   */
  async getProjectStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : req.user?.id;
      const result = await projectService.getProjectStats(userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '獲取統計資訊失敗'
      });
    }
  }

  /**
   * 獲取使用者的專案列表
   * GET /api/projects/my
   */
  async getMyProjects(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: '未授權存取'
        });
        return;
      }

      const queryParams: ProjectQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as 'Ongoing' | 'Completed' | 'Not Started' | 'Canceled' | undefined,
        search: req.query.search as string,
        sort_by: (['created_at', 'updated_at', 'title', 'start_date', 'end_date'].includes(req.query.sort_by as string)) 
          ? (req.query.sort_by as 'created_at' | 'updated_at' | 'title' | 'start_date' | 'end_date') 
          : 'updated_at',
        sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'DESC',
        user_id: req.user.id
      };

      const result = await projectService.getProjects(queryParams, req.user.id);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '獲取我的專案失敗'
      });
    }
  }

  /**
   * 複製專案
   * POST /api/projects/:id/duplicate
   */
  async duplicateProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: '未授權存取'
        });
        return;
      }

      const { id } = req.params;
      
      // 獲取原專案
      const originalResult = await projectService.getProjectById(id, req.user.id);
      
      if (!originalResult.success || !originalResult.data) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: '原專案不存在或無權限存取'
        });
        return;
      }

      // 創建複製的專案資料
      const duplicateData: ProjectCreateRequest = {
        title: `${originalResult.data.title} (副本)`,
        description: originalResult.data.description,
        motivation: originalResult.data.motivation,
        motivationDescription: originalResult.data.motivationDescription || undefined,
        goal: originalResult.data.goal || undefined,
        content: originalResult.data.content || undefined,
        strategy: originalResult.data.strategy,
        strategyDescription: originalResult.data.strategyDescription || undefined,
        resources: originalResult.data.resources || undefined,
        outcome: originalResult.data.outcome,
        outcomeDescription: originalResult.data.outcomeDescription || undefined,
        isPublic: false, // 副本預設為私人
        status: 'Not Started',
        interval: originalResult.data.interval || undefined
      };

      const result = await projectService.createProject(req.user.id, duplicateData);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          success: true,
          data: result.data,
          message: '專案複製成功'
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : '複製專案失敗'
      });
    }
  }
}

// 匯出控制器實例
export const projectController = new ProjectController();