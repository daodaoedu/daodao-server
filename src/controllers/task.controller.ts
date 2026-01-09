/**
 * Task Controller
 * 任務控制器 - 處理任務相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createTask, getTasks, getTask, updateTask, deleteTask } from '../services/task.service';
import type {
  TaskCreateRequestData,
  TaskUpdateRequest
} from '../types/task.types';
import type { UserJwtPayload } from '../types/auth.types';
import {
  singleTaskResponseSchema,
  taskListResponseSchema,
  deleteTaskResponseSchema
} from '../validators/task.validators';

/**
 * 創建任務
 * POST /api/v1/projects/:projectId/milestones/:milestoneId/tasks
 */
export const createTaskController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  const taskData: TaskCreateRequestData = req.body;

  const result = await createTask(
    projectId,
    parseInt(milestoneId),
    user.id,
    taskData
  );

  // 驗證響應格式
  const validatedResponse = singleTaskResponseSchema.parse(result);

  res.status(201).json(validatedResponse);
});

/**
 * 獲取里程碑的任務列表
 * GET /api/v1/projects/:projectId/milestones/:milestoneId/tasks
 */
export const getTasksController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId, milestoneId } = req.params;
  const result = await getTasks(projectId, parseInt(milestoneId));

  // 驗證響應格式
  const validatedResponse = taskListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取單個任務
 * GET /api/v1/projects/:projectId/milestones/:milestoneId/tasks/:taskId
 */
export const getTaskController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId, milestoneId, taskId } = req.params;
  const user = req.user as UserJwtPayload;

  const result = await getTask(
    projectId,
    parseInt(milestoneId),
    parseInt(taskId),
    user?.id
  );

  // 驗證響應格式
  const validatedResponse = singleTaskResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 更新任務
 * PUT /api/v1/projects/:projectId/milestones/:milestoneId/tasks/:taskId
 */
export const updateTaskController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  const { projectId, milestoneId, taskId } = req.params;
  const updateData: TaskUpdateRequest = req.body;

  const result = await updateTask(
    projectId,
    parseInt(milestoneId),
    parseInt(taskId),
    user.id,
    updateData
  );

  // 驗證響應格式
  const validatedResponse = singleTaskResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 刪除任務
 * DELETE /api/v1/projects/:projectId/milestones/:milestoneId/tasks/:taskId
 */
export const deleteTaskController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  const { projectId, milestoneId, taskId } = req.params;

  const result = await deleteTask(
    projectId,
    parseInt(milestoneId),
    parseInt(taskId),
    user.id
  );

  // 驗證響應格式
  const validatedResponse = deleteTaskResponseSchema.parse(result);

  res.json(validatedResponse);
});

// Legacy controller instance for backward compatibility
const TaskController = {
  createTask: createTaskController,
  getTasks: getTasksController,
  getTask: getTaskController,
  updateTask: updateTaskController,
  deleteTask: deleteTaskController
};

export const taskController = TaskController;