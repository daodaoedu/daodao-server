/**
 * Milestone Controller
 * 里程碑控制器 - 處理里程碑相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createMilestone, getMilestones, updateMilestone, deleteMilestone } from '../services/milestone.service';
import type {
  MilestoneCreateRequestData,
  MilestoneUpdateRequest
} from '../types/milestone.types';
import type { UserJwtPayload } from '../types/auth.types';
import {
  singleMilestoneResponseSchema,
  milestoneListResponseSchema,
  deleteMilestoneResponseSchema
} from '../validators/milestone.validators';

/**
 * 創建里程碑
 * POST /api/v1/projects/:projectId/milestones
 */
export const createMilestoneController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
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

  const { projectId } = req.params;
  const milestoneData: MilestoneCreateRequestData = req.body;
  
  const result = await createMilestone(
    projectId,
    user.id,
    milestoneData
  );

  // 驗證響應格式
  const validatedResponse = singleMilestoneResponseSchema.parse(result);

  res.status(201).json(validatedResponse);
});

/**
 * 獲取專案的里程碑列表
 * GET /api/v1/projects/:projectId/milestones
 */
export const getMilestonesController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const result = await getMilestones(projectId);

  // 驗證響應格式
  const validatedResponse = milestoneListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 更新里程碑
 * PUT /api/v1/projects/:projectId/milestones/:milestoneId
 */
export const updateMilestoneController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
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

  const { projectId, milestoneId } = req.params;
  const updateData: MilestoneUpdateRequest = req.body;

  const result = await updateMilestone(
    projectId,
    parseInt(milestoneId),
    user.id,
    updateData
  );

  // 驗證響應格式
  const validatedResponse = singleMilestoneResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 刪除里程碑
 * DELETE /api/v1/projects/:projectId/milestones/:milestoneId
 */
export const deleteMilestoneController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
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

  const { projectId, milestoneId } = req.params;

  const result = await deleteMilestone(
    projectId,
    parseInt(milestoneId),
    user.id
  );

  // 驗證響應格式
  const validatedResponse = deleteMilestoneResponseSchema.parse(result);

  res.json(validatedResponse);
});

// Legacy controller instance for backward compatibility
const MilestoneController = {
  createMilestone: createMilestoneController,
  getMilestones: getMilestonesController,
  updateMilestone: updateMilestoneController,
  deleteMilestone: deleteMilestoneController
};

export const milestoneController = MilestoneController;