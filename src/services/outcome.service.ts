/**
 * Outcome Service
 * 成果服務層 - 處理成果相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import type {
  OutcomeCreateRequest,
  OutcomeUpdateRequest,
  OutcomeResponse
} from '../types/outcome.types';
import { ApiSuccessResponse } from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';

/**
 * 安全日期格式化處理
 */
const safeDateFormatter = (dateValue: Date | string | null | undefined): string => {
  try {
    if (!dateValue) return '無效日期';
    const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(dateObj.getTime())) {
      return '無效日期';
    }
    return dateObj.toISOString().split('T')[0];
  } catch (e) {
    return '日期格式錯誤';
  }
};

/**
 * 格式化成果回應資料
 */
const formatOutcomeResponse = (outcome: Record<string, unknown>, post: Record<string, unknown>): OutcomeResponse => {
  return {
    id: outcome.id as number,
    week: post.week as number,
    title: post.title as string,
    content: (outcome.content as string) || '',
    date: safeDateFormatter(post.date as Date | string | null | undefined),
    imgUrls: (outcome.image_urls as string[]) || [],
    videoUrls: (outcome.video_urls as string[]) || [],
    visibility: (post.visibility as string) || 'private'
  };
};

/**
 * 創建成果
 */
export const createOutcome = async (
  projectId: string,
  userId: number,
  outcomeData: OutcomeCreateRequest
): Promise<ApiSuccessResponse<OutcomeResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const { date, week, title, content, imgUrls, videoUrls, visibility } = outcomeData;

    // 日期驗證
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestError('無效的日期格式，請使用 YYYY-MM-DD 格式');
    }

    // 檢查專案是否存在
    const project = await tx.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    // 創建 Post
    const post = await tx.post.create({
      data: {
        project_id: project.id,
        user_id: userId,
        week,
        title,
        type: 'outcome',
        date: parsedDate,
        visibility: visibility || 'private'
      }
    });

    // 創建 Outcome
    const outcome = await tx.outcome.create({
      data: {
        post_id: post.id,
        content: content,
        image_urls: imgUrls || [],
        video_urls: videoUrls || []
      }
    });

    const responseData = formatOutcomeResponse(outcome as Record<string, unknown>, post as Record<string, unknown>);

    return createSuccessResponse(responseData, {
      message: '成果創建成功'
    });
  });
};

/**
 * 獲取專案的成果列表
 */
export const getOutcomes = async (
  projectId: string
): Promise<ApiSuccessResponse<OutcomeResponse[]>> => {
  const project = await prisma.project.findUnique({
    where: { external_id: projectId }
  });

  if (!project) {
    throw new NotFoundError('專案不存在');
  }

  const outcomes = await prisma.outcome.findMany({
    where: {
      post: {
        project_id: project.id,
        type: 'outcome'
      }
    },
    include: {
      post: true
    },
    orderBy: {
      id: 'asc'
    }
  });

  const formattedOutcomes = outcomes
    .filter(outcome => outcome.post)
    .map(outcome => formatOutcomeResponse(outcome as Record<string, unknown>, outcome.post as Record<string, unknown>));

  return createSuccessResponse(formattedOutcomes, {
    totalCount: formattedOutcomes.length
  });
};

/**
 * 獲取用戶的成果列表
 */
export const getMyOutcomes = async (
  userId: number
): Promise<ApiSuccessResponse<OutcomeResponse[]>> => {
  const outcomes = await prisma.outcome.findMany({
    where: {
      post: {
        type: 'outcome',
        project: {
          user_id: userId
        }
      }
    },
    include: {
      post: {
        include: {
          project: true
        }
      }
    }
  });

  const formattedOutcomes = outcomes
    .filter(outcome => outcome.post && outcome.post.project)
    .map(outcome => formatOutcomeResponse(outcome as Record<string, unknown>, outcome.post as Record<string, unknown>));

  return createSuccessResponse(formattedOutcomes, {
    totalCount: formattedOutcomes.length
  });
};

/**
 * 獲取成果詳情
 */
export const getOutcomeDetail = async (
  projectId: string,
  outcomeId: number
): Promise<ApiSuccessResponse<OutcomeResponse>> => {
  const project = await prisma.project.findUnique({
    where: { external_id: projectId }
  });

  if (!project) {
    throw new NotFoundError('專案不存在');
  }

  const outcome = await prisma.outcome.findFirst({
    where: { 
      id: outcomeId,
      post: {
        project_id: project.id,
        type: 'outcome'
      }
    },
    include: {
      post: true
    }
  });

  if (!outcome || !outcome.post) {
    throw new NotFoundError('成果不存在');
  }

  const responseData = formatOutcomeResponse(outcome as Record<string, unknown>, outcome.post as Record<string, unknown>);

  return createSuccessResponse(responseData);
};

/**
 * 更新成果
 */
export const updateOutcome = async (
  projectId: string,
  outcomeId: number,
  updateData: OutcomeUpdateRequest
): Promise<ApiSuccessResponse<OutcomeResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    const outcome = await tx.outcome.findFirst({
      where: { 
        id: outcomeId,
        post: {
          project_id: project.id,
          type: 'outcome'
        }
      },
      include: {
        post: true
      }
    });

    if (!outcome || !outcome.post) {
      throw new NotFoundError('成果不存在');
    }

    const { week, title, content, date, imgUrls, videoUrls, visibility } = updateData;

    // 更新 Post 資料
    const postUpdates: Record<string, unknown> = {};
    if (week !== undefined) postUpdates.week = week;
    if (title !== undefined) postUpdates.title = title;
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestError('無效的日期格式，請使用 YYYY-MM-DD 格式');
      }
      postUpdates.date = parsedDate;
    }
    if (visibility !== undefined) postUpdates.visibility = visibility;

    if (Object.keys(postUpdates).length > 0) {
      await tx.post.update({
        where: { id: outcome.post.id },
        data: postUpdates
      });
    }

    // 更新 Outcome 資料
    const outcomeUpdates: Record<string, unknown> = {};
    if (content !== undefined) outcomeUpdates.content = content;
    if (imgUrls !== undefined) outcomeUpdates.image_urls = imgUrls;
    if (videoUrls !== undefined) outcomeUpdates.video_urls = videoUrls;

    if (Object.keys(outcomeUpdates).length > 0) {
      await tx.outcome.update({
        where: { id: outcomeId },
        data: outcomeUpdates
      });
    }

    // 獲取更新後的資料
    const updatedOutcome = await tx.outcome.findFirst({
      where: { id: outcomeId },
      include: {
        post: true
      }
    });

    if (!updatedOutcome || !updatedOutcome.post) {
      throw new BadRequestError('更新後無法獲取成果資料');
    }

    const responseData = formatOutcomeResponse(updatedOutcome as Record<string, unknown>, updatedOutcome.post as Record<string, unknown>);

    return createSuccessResponse(responseData, {
      message: '成果更新成功'
    });
  });
};

/**
 * 刪除成果
 */
export const deleteOutcome = async (
  projectId: string,
  outcomeId: number
): Promise<ApiSuccessResponse<void>> => {
  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    const outcome = await tx.outcome.findFirst({
      where: { 
        id: outcomeId,
        post: {
          project_id: project.id,
          type: 'outcome'
        }
      },
      include: {
        post: true
      }
    });

    if (!outcome || !outcome.post) {
      throw new NotFoundError('成果不存在');
    }

    // 刪除成果（會級聯刪除相關的 post）
    await tx.outcome.delete({
      where: { id: outcomeId }
    });

    return createSuccessResponse(undefined, {
      message: '成果已刪除'
    });
  });
};

// 匯出服務對象
export const outcomeService = {
  createOutcome,
  getOutcomes,
  getMyOutcomes,
  getOutcomeDetail,
  updateOutcome,
  deleteOutcome
} as const;