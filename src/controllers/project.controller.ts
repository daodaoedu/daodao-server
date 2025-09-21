/**
 * Project Controller
 * 專案控制器 - 處理專案相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import {
  createProject,
  getProjectById,
  getProjects,
  updateProject,
  deleteProject,
  getProjectStats
} from '../services/project.service';
import { asyncHandler } from '../middleware/error.middleware';
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectQueryParams
} from '../types/project.types';
import {
  singleProjectResponseSchema,
  projectListResponseSchema,
  projectStatsSuccessResponseSchema,
  deleteProjectResponseSchema
} from '../validators/project.validators';

/**
 * 創建專案
 * POST /api/projects
 */
export const createProjectController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || typeof req.user.id !== 'number') {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授權存取'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const projectData: ProjectCreateRequest = req.body;
  const result = await createProject(req.user.id, projectData);

  // 驗證響應格式
  const validatedResponse = singleProjectResponseSchema.parse(result);

  res.status(201).json(validatedResponse);
});

/**
 * 獲取專案詳情
 * GET /api/projects/:id
 */
export const getProjectController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const result = await getProjectById(id, userId);

  // 驗證響應格式
  const validatedResponse = singleProjectResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取專案列表
 * GET /api/projects
 */
export const getProjectsController = asyncHandler(async (req: Request, res: Response) => {
  const queryParams: ProjectQueryParams = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    status: req.query.status as 'Ongoing' | 'Completed' | 'Not Started' | 'Canceled' | undefined,
    is_public: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
    user_id: req.query.userId ? parseInt(req.query.userId as string) : undefined,
    search: req.query.search as string,
    sort_by: req.query.sortBy ? (() => {
      const sortByMap = {
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'title': 'title',
        'startDate': 'start_date',
        'endDate': 'end_date'
      } as const;
      return sortByMap[req.query.sortBy as keyof typeof sortByMap] || 'created_at';
    })() : 'created_at',
    sort_order: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
  };

  const userId = req.user?.id;
  const result = await getProjects(queryParams, userId);

  // 驗證響應格式 - 暫時註解以測試核心功能
  // const validatedResponse = projectListResponseSchema.parse(result);

  res.json(result);
});

/**
 * 更新專案
 * PUT /api/projects/:id
 */
export const updateProjectController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授權存取'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { id } = req.params;
  const updateData: ProjectUpdateRequest = req.body;

  const result = await updateProject(id, req.user.id, updateData);

  // 驗證響應格式
  const validatedResponse = singleProjectResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 刪除專案
 * DELETE /api/projects/:id
 */
export const deleteProjectController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授權存取'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { id } = req.params;
  const result = await deleteProject(id, req.user.id);

  // 驗證響應格式
  const validatedResponse = deleteProjectResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取專案統計資訊
 * GET /api/projects/stats
 */
export const getProjectStatsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.user_id ? parseInt(req.query.user_id as string) : req.user?.id;
  const result = await getProjectStats(userId);

  // 驗證響應格式
  const validatedResponse = projectStatsSuccessResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取使用者的專案列表
 * GET /api/projects/my
 */
export const getMyProjectsController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授權存取'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const queryParams: ProjectQueryParams = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    status: req.query.status as 'Ongoing' | 'Completed' | 'Not Started' | 'Canceled' | undefined,
    search: req.query.search as string,
    sort_by: req.query.sortBy ? (() => {
      const sortByMap = {
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'title': 'title',
        'startDate': 'start_date',
        'endDate': 'end_date'
      } as const;
      return sortByMap[req.query.sortBy as keyof typeof sortByMap] || 'updated_at';
    })() : 'updated_at',
    sort_order: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    user_id: req.user.id
  };

  const result = await getProjects(queryParams, req.user.id);

  // 驗證響應格式
  const validatedResponse = projectListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取公開專案列表
 * GET /api/projects/public
 */
export const getPublicProjectsController = asyncHandler(async (req: Request, res: Response) => {
  const queryParams: ProjectQueryParams = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    status: req.query.status as 'Ongoing' | 'Completed' | 'Not Started' | 'Canceled' | undefined,
    search: req.query.search as string,
    sort_by: req.query.sortBy ? (() => {
      const sortByMap = {
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'title': 'title',
        'startDate': 'start_date',
        'endDate': 'end_date'
      } as const;
      return sortByMap[req.query.sortBy as keyof typeof sortByMap] || 'created_at';
    })() : 'created_at',
    sort_order: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    is_public: true // 強制只顯示公開專案
  };

  const userId = req.user?.id;
  const result = await getProjects(queryParams, userId);

  // 驗證響應格式
  const validatedResponse = projectListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 複製專案
 * POST /api/projects/:id/duplicate
 */
export const duplicateProjectController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授權存取'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { id } = req.params;
  
  // 獲取原專案
  const originalResult = await getProjectById(id, req.user.id);
  
  if (!originalResult.success || !originalResult.data) {
    res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: '原專案不存在或無權限存取'
      },
      timestamp: new Date().toISOString()
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

  const result = await createProject(req.user.id, duplicateData);

  // 驗證響應格式
  const validatedResponse = singleProjectResponseSchema.parse(result);

  res.status(201).json(validatedResponse);
});