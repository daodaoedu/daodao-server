/**
 * Milestone Service
 * 里程碑服務層 - 處理里程碑相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import { createSuccessResponse } from '../utils/response-helper';
import { BadRequestError, NotFoundError } from '../middleware/error.middleware';
import type {
  MilestoneCreateRequestData,
  MilestoneUpdateRequest,
  MilestoneResponse,
  TaskResponse
} from '../types/milestone.types';
import type { ApiSuccessResponse } from '../types/api-response.types';

/**
 * 格式化里程碑回應資料
 */
const formatMilestoneResponse = (milestone: Record<string, unknown>): MilestoneResponse => {
  const startDate = milestone.start_date as Date | null;
  const endDate = milestone.end_date as Date | null;
  const tasks = milestone.task as Array<Record<string, unknown>> | undefined;
  
  return {
    id: milestone.id as number,
    position: (milestone.position as number) || 0,
    name: (milestone.name as string) || '',
    description: (milestone.description as string) || '',
    startDate: startDate ? startDate.toISOString().split('T')[0] : '',
    endDate: endDate ? endDate.toISOString().split('T')[0] : '',
    isCompleted: (milestone.is_completed as boolean) || false,
    tasks: (tasks || []).map((t): TaskResponse => ({
      id: t.id as number,
      name: (t.name as string) || '',
      position: t.position as number,
      description: (t.description as string) || '',
      daysOfWeek: t.days_of_week as number[],
      isCompleted: (t.is_completed as boolean) || false
    }))
  };
};

/**
 * 創建里程碑
 */
export const createMilestone = async (
  projectId: string,
  userId: number,
  milestoneData: MilestoneCreateRequestData
): Promise<ApiSuccessResponse<MilestoneResponse>> => {
  return await prisma.$transaction(async (tx) => {
    // 檢查專案是否存在且用戶有權限
    const project = await tx.project.findFirst({
      where: { 
        external_id: projectId,
        user_id: userId
      }
    });

    if (!project) {
      throw new NotFoundError('專案不存在或無權操作此專案');
    }

    // 驗證必填字段
    if (!milestoneData.name || !milestoneData.startDate || !milestoneData.endDate) {
      throw new BadRequestError('必須提供名稱、開始和結束日期');
    }

    // 日期驗證
    const startDate = new Date(milestoneData.startDate);
    const endDate = new Date(milestoneData.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestError('結束日期必須晚於開始日期');
    }

    // 位置驗證
    if (milestoneData.position && milestoneData.position <= 0) {
      throw new BadRequestError('position 必須為正整數');
    }

    // 創建里程碑
    const milestone = await tx.milestone.create({
      data: {
        project_id: project.id,
        position: milestoneData.position,
        name: milestoneData.name,
        description: milestoneData.description,
        start_date: startDate,
        end_date: endDate,
        is_completed: milestoneData.isCompleted || false
      },
      include: {
        task: {
          where: { is_deleted: false },
          orderBy: { position: 'asc' }
        }
      }
    });

    return createSuccessResponse(
      formatMilestoneResponse(milestone),
      { message: '里程碑創建成功' }
    );
  });
};

/**
 * 獲取專案的里程碑列表
 */
export const getMilestones = async (
  projectId: string
): Promise<ApiSuccessResponse<MilestoneResponse[]>> => {
  const project = await prisma.project.findUnique({
    where: { external_id: projectId }
  });

  if (!project) {
    throw new NotFoundError('專案不存在');
  }

  const milestones = await prisma.milestone.findMany({
    where: { 
      project_id: project.id,
      is_deleted: false
    },
    include: {
      task: {
        where: { is_deleted: false },
        orderBy: { position: 'asc' }
      }
    },
    orderBy: { position: 'asc' }
  });

  const formattedMilestones = milestones.map(m => formatMilestoneResponse(m));

  return createSuccessResponse(formattedMilestones);
};

/**
 * 更新里程碑
 */
export const updateMilestone = async (
  projectId: string,
  milestoneId: number,
  userId: number,
  updateData: MilestoneUpdateRequest
): Promise<ApiSuccessResponse<MilestoneResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { 
        external_id: projectId,
        user_id: userId
      }
    });

    if (!project) {
      throw new NotFoundError('專案不存在或無權操作此專案');
    }

    const milestone = await tx.milestone.findFirst({
      where: {
        id: milestoneId,
        project_id: project.id,
        is_deleted: false
      }
    });

    if (!milestone) {
      throw new NotFoundError('里程碑不存在');
    }

    // 日期驗證
    if (updateData.startDate || updateData.endDate) {
      const startDate = new Date(updateData.startDate || milestone.start_date);
      const endDate = new Date(updateData.endDate || milestone.end_date);
      
      if (startDate >= endDate) {
        throw new BadRequestError('結束日期必須晚於開始日期');
      }
    }

    // 位置驗證
    if (updateData.position !== undefined && updateData.position <= 0) {
      throw new BadRequestError('position必須為正整數');
    }

    // 更新里程碑
    const updatedMilestone = await tx.milestone.update({
      where: { id: milestoneId },
      data: {
        position: updateData.position,
        name: updateData.name,
        description: updateData.description,
        start_date: updateData.startDate ? new Date(updateData.startDate) : undefined,
        end_date: updateData.endDate ? new Date(updateData.endDate) : undefined,
        is_completed: updateData.isCompleted
      },
      include: {
        task: {
          where: { is_deleted: false },
          orderBy: { position: 'asc' }
        }
      }
    });

    return createSuccessResponse(
      formatMilestoneResponse(updatedMilestone),
      { message: '里程碑更新成功' }
    );
  });
};

/**
 * 刪除里程碑
 */
export const deleteMilestone = async (
  projectId: string,
  milestoneId: number,
  userId: number
): Promise<ApiSuccessResponse<{ message: string }>> => {
  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { 
        external_id: projectId,
        user_id: userId
      }
    });

    if (!project) {
      throw new NotFoundError('專案不存在或無權操作此專案');
    }

    const milestone = await tx.milestone.findFirst({
      where: {
        id: milestoneId,
        project_id: project.id,
        is_deleted: false
      }
    });

    if (!milestone) {
      throw new NotFoundError('里程碑不存在');
    }

    // 軟刪除里程碑
    await tx.milestone.update({
      where: { id: milestoneId },
      data: { is_deleted: true }
    });

    // 軟刪除相關任務
    await tx.task.updateMany({
      where: { milestone_id: milestoneId },
      data: { is_deleted: true }
    });

    return createSuccessResponse(
      { message: '里程碑已刪除' }
    );
  });
};

// Legacy service instance for backward compatibility
const MilestoneService = {
  createMilestone,
  getMilestones,
  updateMilestone,
  deleteMilestone
};

export const milestoneService = MilestoneService;