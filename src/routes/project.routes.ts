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
import {
  createNote,
  getNotes,
  getMyNotes,
  getNoteDetail,
  updateNote,
  getPublicNotes,
  deleteNote
} from '../controllers/note.controller';
import {
  createReview,
  getReviews,
  getReviewDetail,
  updateReview,
  deleteReview
} from '../controllers/review.controller';
import {
  createOutcome,
  getOutcomes,
  getMyOutcomes,
  getOutcomeDetail,
  updateOutcome,
  deleteOutcome
} from '../controllers/outcome.controller';
import {
  createTaskController,
  getTasksController,
  getTaskController,
  updateTaskController,
  deleteTaskController
} from '../controllers/task.controller';
import {
  createMilestoneController,
  getMilestonesController,
  updateMilestoneController,
  deleteMilestoneController
} from '../controllers/milestone.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, optionalAuth } from '../middleware/auth';
// import {
//   canCreateProject,
//   canUpdateProject,
//   canDeleteProject
// } from '../middleware/permission.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  projectQuerySchema,
  duplicateProjectSchema,
  projectStatsQuerySchema
} from '../validators/project.validators';
import {
  createNoteSchema,
  updateNoteSchema,
  noteParamsSchema,
  noteProjectParamsSchema,
  publicNotesQuerySchema
} from '../validators/note.validators';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewParamsSchema,
  reviewQuerySchema
} from '../validators/review.validators';
import {
  createOutcomeSchema,
  updateOutcomeSchema,
  outcomeParamsSchema
} from '../validators/outcome.validators';
import {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  taskMilestoneParamsSchema
} from '../validators/task.validators';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneParamsSchema
} from '../validators/milestone.validators';

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
  // canCreateProject(),
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
  // canUpdateProject(),
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
  // canDeleteProject(),
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
  // canCreateProject(),
  validate(projectParamsSchema, 'params'),
  validate(duplicateProjectSchema, 'body'),
  duplicateProjectController as RequestHandler);

// 取得用戶的便利貼和學習成果列表
router.get('/outcomes/me', authenticate, getMyOutcomes as RequestHandler);
router.get('/notes/me', authenticate, getMyNotes as RequestHandler);
router.get('/notes/public', validate(publicNotesQuerySchema, 'query'), getPublicNotes as RequestHandler);

// 里程碑相關路由
router.post('/:projectId/milestones', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createMilestoneSchema, 'body'), createMilestoneController as RequestHandler);
router.get('/:projectId/milestones', validate(noteProjectParamsSchema, 'params'), getMilestonesController as RequestHandler);
router.put('/:projectId/milestones/:milestoneId', authenticate, validate(milestoneParamsSchema, 'params'), validate(updateMilestoneSchema, 'body'), updateMilestoneController as RequestHandler);
router.delete('/:projectId/milestones/:milestoneId', authenticate, validate(milestoneParamsSchema, 'params'), deleteMilestoneController as RequestHandler);

// 任務相關路由
router.post('/:projectId/milestones/:milestoneId/tasks', authenticate, validate(taskMilestoneParamsSchema, 'params'), validate(createTaskSchema, 'body'), createTaskController as RequestHandler);
router.get('/:projectId/milestones/:milestoneId/tasks', validate(taskMilestoneParamsSchema, 'params'), getTasksController as RequestHandler);
router.get('/:projectId/milestones/:milestoneId/tasks/:taskId', validate(taskParamsSchema, 'params'), getTaskController as RequestHandler);
router.put('/:projectId/milestones/:milestoneId/tasks/:taskId', authenticate, validate(taskParamsSchema, 'params'), validate(updateTaskSchema, 'body'), updateTaskController as RequestHandler);
router.delete('/:projectId/milestones/:milestoneId/tasks/:taskId', authenticate, validate(taskParamsSchema, 'params'), deleteTaskController as RequestHandler);

// 便利貼相關路由
router.post('/:projectId/notes', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createNoteSchema, 'body'), createNote as RequestHandler);
router.get('/:projectId/notes/', validate(noteProjectParamsSchema, 'params'), getNotes as RequestHandler);
router.get('/:projectId/notes/:noteId', validate(noteParamsSchema, 'params'), getNoteDetail as RequestHandler);
router.put('/:projectId/notes/:noteId', authenticate, validate(noteParamsSchema, 'params'), validate(updateNoteSchema, 'body'), updateNote as RequestHandler);
router.delete('/:projectId/notes/:noteId', authenticate, validate(noteParamsSchema, 'params'), deleteNote as RequestHandler);

// 學習成果相關路由
router.post('/:projectId/outcomes', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createOutcomeSchema, 'body'), createOutcome as RequestHandler);
router.get('/:projectId/outcomes', validate(noteProjectParamsSchema, 'params'), getOutcomes as RequestHandler);
router.get('/:projectId/outcomes/:outcomeId', validate(outcomeParamsSchema, 'params'), getOutcomeDetail as RequestHandler);
router.put('/:projectId/outcomes/:outcomeId', authenticate, validate(outcomeParamsSchema, 'params'), validate(updateOutcomeSchema, 'body'), updateOutcome as RequestHandler);
router.delete('/:projectId/outcomes/:outcomeId', authenticate, validate(outcomeParamsSchema, 'params'), deleteOutcome as RequestHandler);

// 覆盤相關路由
router.post('/:projectId/reviews', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createReviewSchema, 'body'), createReview as RequestHandler);
router.get('/:projectId/reviews', validate(noteProjectParamsSchema, 'params'), validate(reviewQuerySchema, 'query'), getReviews as RequestHandler);
router.get('/:projectId/reviews/:reviewId', validate(reviewParamsSchema, 'params'), getReviewDetail as RequestHandler);
router.put('/:projectId/reviews/:reviewId', authenticate, validate(reviewParamsSchema, 'params'), validate(updateReviewSchema, 'body'), updateReview as RequestHandler);
router.delete('/:projectId/reviews/:reviewId', authenticate, validate(reviewParamsSchema, 'params'), deleteReview as RequestHandler);

export default router;