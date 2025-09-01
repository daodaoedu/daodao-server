/**
 * 專案路由
 * 處理專案相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import {
  createProjectController,
  getProjectController,
  getProjectsController,
  updateProjectController,
  deleteProjectController,
  getProjectStatsController,
  getMyProjectsController,
  duplicateProjectController
} from '../controllers/project.controller';
import { validate } from '../validators/validation.middleware';
import { authenticate, optionalAuth } from '../middleware/auth';
import { 
  canCreateProject,
  canUpdateProject,
  canDeleteProject
  // requireOwnership
} from '../middleware/permission.middleware';
import { 
  createProjectSchema, 
  updateProjectSchema,
  projectParamsSchema,
  projectQuerySchema,
  duplicateProjectSchema,
  projectStatsQuerySchema
} from '../validators/project.validators';
import milestoneRoutes from './milestone.routes';

const router = Router();

/**
 * GET /projects
 * 獲取專案列表
 * 查詢參數：page, limit, status, is_public, user_id, search, sort_by, sort_order
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/', 
  optionalAuth,
  validate(projectQuerySchema, 'query'),
  getProjectsController as RequestHandler);

/**
 * GET /projects/my
 * 獲取我的專案列表
 * 查詢參數：page, limit, status, search, sort_by, sort_order
 * 需要身份驗證
 */
router.get('/my', 
  authenticate,
  validate(projectQuerySchema, 'query'),
  getMyProjectsController as RequestHandler);

/**
 * GET /projects/stats
 * 獲取專案統計資訊
 * 查詢參數：user_id（可選）
 * 支援可選身份驗證
 */
router.get('/stats', 
  optionalAuth,
  validate(projectStatsQuerySchema, 'query'),
  getProjectStatsController as RequestHandler);

/**
 * GET /projects/:id
 * 獲取專案詳情
 * 路徑參數：id - 專案 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id', 
  optionalAuth,
  validate(projectParamsSchema, 'params'),
  getProjectController as RequestHandler);

/**
 * POST /projects
 * 創建新專案
 * 請求體：CreateProjectRequest
 * 需要身份驗證和創建專案權限
 */
router.post('/', 
  authenticate,
  canCreateProject(),
  validate(createProjectSchema, 'body'),
  createProjectController as RequestHandler);

/**
 * PUT /projects/:id
 * 更新專案
 * 路徑參數：id - 專案 ID
 * 請求體：UpdateProjectRequest
 * 需要身份驗證和更新專案權限或擁有權
 */
router.put('/:id', 
  authenticate,
  canUpdateProject(),
  validate(projectParamsSchema, 'params'),
  validate(updateProjectSchema, 'body'),
  updateProjectController as RequestHandler);

/**
 * DELETE /projects/:id
 * 刪除專案
 * 路徑參數：id - 專案 ID
 * 需要身份驗證和刪除專案權限或擁有權
 */
router.delete('/:id', 
  authenticate,
  canDeleteProject(),
  validate(projectParamsSchema, 'params'),
  deleteProjectController as RequestHandler);

/**
 * POST /projects/:id/duplicate
 * 複製專案
 * 路徑參數：id - 要複製的專案 ID
 * 請求體：DuplicateProjectRequest（可選）
 * 需要身份驗證和創建專案權限
 */
router.post('/:id/duplicate', 
  authenticate,
  canCreateProject(),
  validate(projectParamsSchema, 'params'),
  validate(duplicateProjectSchema, 'body'),
  duplicateProjectController as RequestHandler);

/**
 * 巢狀里程碑路由
 * /projects/:projectId/milestones/*
 */
router.use('/:projectId/milestones', milestoneRoutes);

export default router;