/**
 * 里程碑路由
 * 處理里程碑相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { milestoneController } from '../controllers/milestone.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneParamsSchema
} from '../validators/milestone.validators';

const router = Router({ mergeParams: true });

/**
 * GET /projects/:projectId/milestones
 * 獲取專案的里程碑列表
 * 路徑參數：projectId - 專案 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  milestoneController.getMilestones as RequestHandler);

/**
 * POST /projects/:projectId/milestones
 * 創建新里程碑
 * 路徑參數：projectId - 專案 ID
 * 請求體：MilestoneCreateRequestData
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  validate(createMilestoneSchema, 'body'),
  milestoneController.createMilestone as RequestHandler);

/**
 * PUT /projects/:projectId/milestones/:milestoneId
 * 更新里程碑
 * 路徑參數：projectId - 專案 ID, milestoneId - 里程碑 ID
 * 請求體：MilestoneUpdateRequest
 * 需要身份驗證
 */
router.put('/:milestoneId',
  authenticate,
  validate(milestoneParamsSchema, 'params'),
  validate(updateMilestoneSchema, 'body'),
  milestoneController.updateMilestone as RequestHandler);

/**
 * DELETE /projects/:projectId/milestones/:milestoneId
 * 刪除里程碑
 * 路徑參數：projectId - 專案 ID, milestoneId - 里程碑 ID
 * 需要身份驗證
 */
router.delete('/:milestoneId',
  authenticate,
  validate(milestoneParamsSchema, 'params'),
  milestoneController.deleteMilestone as RequestHandler);

export default router;