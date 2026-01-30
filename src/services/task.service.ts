/**
 * Task Service
 * 任務服務層 - 處理任務相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import { NotFoundError, UnauthorizedError } from '../middleware/error.middleware';
import type { task, day_enum } from '../../generated/prisma';
import type {
  TaskData,
  TaskCreateRequestData,
  TaskUpdateRequest,
  TaskResponse,
  TaskListResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  DeleteTaskResponse,
  DayEnum
} from '../types/task.types';

/**
 * 格式化任務資料
 */
function formatTaskData(task: task): TaskData {
  return {
    id: task.id,
    name: task.name || '',
    description: task.description || '',
    position: task.position || 0,
    isCompleted: task.is_completed || false,
    daysOfWeek: task.days_of_week as DayEnum[],
    milestoneId: task.milestone_id,
    createdAt: task.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: task.updated_at?.toISOString() || new Date().toISOString()
  };
}

/**
 * 創建任務
 */
export async function createTask(
  projectId: string,
  milestoneId: number,
  userId: number,
  taskData: TaskCreateRequestData
): Promise<CreateTaskResponse> {
  try {
    // 檢查專案是否存在且用戶有權限
    const project = await prisma.project.findFirst({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    if (project.user_id !== userId) {
      throw new UnauthorizedError('無權操作此專案');
    }

    // 檢查里程碑是否存在且屬於該專案
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        project_id: project.id
      }
    });

    if (!milestone) {
      throw new NotFoundError('里程碑不存在');
    }

    // 創建任務
    const task = await prisma.task.create({
      data: {
        name: taskData.name,
        description: taskData.description,
        position: taskData.position || 0,
        is_completed: taskData.isCompleted || false,
        days_of_week: taskData.daysOfWeek,
        milestone_id: milestoneId
      }
    });

    return {
      success: true,
      data: formatTaskData(task),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw error;
  }
}

/**
 * 獲取里程碑的任務列表
 */
export async function getTasks(
  projectId: string,
  milestoneId: number
): Promise<TaskListResponse> {
  try {
    // 檢查專案是否存在
    const project = await prisma.project.findFirst({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    // 獲取任務列表
    const tasks = await prisma.task.findMany({
      where: {
        milestone_id: milestoneId
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      success: true,
      data: tasks.map(formatTaskData),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw error;
  }
}

/**
 * 獲取單個任務
 */
export async function getTask(
  projectId: string,
  milestoneId: number,
  taskId: number,
  userId?: number
): Promise<TaskResponse> {
  try {
    // 檢查專案是否存在
    const project = await prisma.project.findFirst({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    // 如果提供了 userId，檢查權限
    if (userId && project.user_id !== userId) {
      throw new UnauthorizedError('無權存取此任務');
    }

    // 獲取任務
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        milestone_id: milestoneId
      }
    });

    if (!task) {
      throw new NotFoundError('任務不存在');
    }

    return {
      success: true,
      data: formatTaskData(task),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw error;
  }
}

/**
 * 更新任務
 */
export async function updateTask(
  projectId: string,
  milestoneId: number,
  taskId: number,
  userId: number,
  updateData: TaskUpdateRequest
): Promise<UpdateTaskResponse> {
  try {
    // 檢查專案是否存在且用戶有權限
    const project = await prisma.project.findFirst({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    if (project.user_id !== userId) {
      throw new UnauthorizedError('無權操作此專案');
    }

    // 檢查任務是否存在
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        milestone_id: milestoneId
      }
    });

    if (!existingTask) {
      throw new NotFoundError('任務不存在');
    }

    // 準備更新資料
    const updateFields: Partial<{
      name: string;
      description: string | null;
      position: number;
      is_completed: boolean;
      days_of_week: day_enum[];
    }> = {};
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.position !== undefined) updateFields.position = updateData.position;
    if (updateData.isCompleted !== undefined) updateFields.is_completed = updateData.isCompleted;
    if (updateData.daysOfWeek !== undefined) updateFields.days_of_week = updateData.daysOfWeek as day_enum[];

    // 更新任務
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateFields
    });

    return {
      success: true,
      data: formatTaskData(task),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw error;
  }
}

/**
 * 刪除任務
 */
export async function deleteTask(
  projectId: string,
  milestoneId: number,
  taskId: number,
  userId: number
): Promise<DeleteTaskResponse> {
  try {
    // 檢查專案是否存在且用戶有權限
    const project = await prisma.project.findFirst({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    if (project.user_id !== userId) {
      throw new UnauthorizedError('無權操作此專案');
    }

    // 檢查任務是否存在
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        milestone_id: milestoneId
      }
    });

    if (!existingTask) {
      throw new NotFoundError('任務不存在');
    }

    // 刪除任務
    await prisma.task.delete({
      where: { id: taskId }
    });

    return {
      success: true,
      data: { message: '任務已刪除' },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw error;
  }
}