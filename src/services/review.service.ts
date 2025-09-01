/**
 * Review Service
 * 覆盤服務層 - 處理覆盤相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import type {
  ReviewCreateRequest,
  ReviewUpdateRequest,
  ReviewResponse
} from '../types/review.types';
import { 
  ApiSuccessResponse
} from '../types/api-response.types';
import { 
  createSuccessResponse 
} from '../utils/response-helper';
import { 
  NotFoundError,
  BadRequestError
} from '../middleware/error.middleware';

/**
 * 安全日期格式化處理
 */
const safeDateFormatter = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  try {
    return date.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
};

/**
 * 格式化覆盤回應資料
 */
const formatReviewResponse = (review: Record<string, unknown>, post: Record<string, unknown>): ReviewResponse => {
  const createdAt = review.created_at as Date | null | undefined;
  const updatedAt = review.updated_at as Date | null | undefined;
  const learningReview = review.learning_review;
  
  const response: ReviewResponse = {
    id: review.id as number,
    week: post.week as number,
    title: post.title as string,
    mood: review.mood as string,
    stressLevel: review.stress_level as number,
    createdAt: safeDateFormatter(createdAt) || ''
  };

  if (review.mood_description) {
    response.moodDescription = review.mood_description as string;
  }
  if (learningReview) {
    response.learningReview = learningReview.toString();
  }
  if (review.learning_feedback) {
    response.learningFeedback = review.learning_feedback as string;
  }
  if (review.adjustment_plan) {
    response.adjustmentPlan = review.adjustment_plan as string;
  }
  if (updatedAt) {
    const updatedAtStr = safeDateFormatter(updatedAt);
    if (updatedAtStr) {
      response.updatedAt = updatedAtStr;
    }
  }

  return response;
};

/**
 * 創建覆盤
 */
const createReview = async (
  projectId: string,
  userId: number,
  reviewData: ReviewCreateRequest
): Promise<ApiSuccessResponse<ReviewResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const { 
      week, 
      title, 
      mood, 
      moodDescription, 
      stressLevel, 
      learningReview, 
      learningFeedback, 
      adjustmentPlan, 
      visibility 
    } = reviewData;

    // 驗證必要字段
    if (!mood || stressLevel === undefined || learningReview === undefined) {
      throw new BadRequestError('mood/stressLevel/learningReview 為必填字段');
    }

    // 檢查專案是否存在
    const project = await tx.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

      // 使用當前日期
      const parsedDate = new Date();

      // 創建 Post
      const post = await tx.post.create({
        data: {
          project_id: project.id,
          user_id: userId,
          week,
          title: title || `第 ${week} 週覆盤`,
          type: 'review',
          date: parsedDate,
          visibility: visibility || 'private'
        }
      });

      // 創建 Review
      const review = await tx.review.create({
        data: {
          post_id: post.id,
          mood,
          stress_level: Math.min(Math.max(1, stressLevel), 10),
          learning_review: Math.min(Math.max(1, learningReview), 10),
          mood_description: moodDescription,
          learning_feedback: learningFeedback,
          adjustment_plan: adjustmentPlan
        }
      });

    const responseData = formatReviewResponse(review as Record<string, unknown>, post as Record<string, unknown>);

    return createSuccessResponse(responseData);
  });
};

/**
 * 獲取專案的覆盤列表
 */
const getReviews = async (
  projectId: string
): Promise<ApiSuccessResponse<ReviewResponse[]>> => {
  const project = await prisma.project.findUnique({
    where: { external_id: projectId }
  });

  if (!project) {
    throw new NotFoundError('專案不存在');
  }

  const reviews = await prisma.review.findMany({
    where: {
      post: {
        project_id: project.id,
        type: 'review'
      }
    },
    include: {
      post: true
    },
    orderBy: {
      id: 'desc'
    }
  });

  const formattedReviews = reviews
    .filter(review => review.post)
    .map(review => formatReviewResponse(review as Record<string, unknown>, review.post as Record<string, unknown>));

  return createSuccessResponse(formattedReviews);
};

/**
 * 獲取覆盤詳情
 */
const getReviewDetail = async (
  projectId: string,
  reviewId: number
): Promise<ApiSuccessResponse<ReviewResponse>> => {
  const project = await prisma.project.findUnique({
    where: { external_id: projectId }
  });

  if (!project) {
    throw new NotFoundError('專案不存在');
  }

  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      post: {
        project_id: project.id,
        type: 'review'
      }
    },
    include: {
      post: true
    }
  });

  if (!review || !review.post) {
    throw new NotFoundError('覆盤記錄不存在');
  }

  const responseData = formatReviewResponse(review as Record<string, unknown>, review.post as Record<string, unknown>);

  return createSuccessResponse(responseData);
};

/**
 * 更新覆盤
 */
const updateReview = async (
  projectId: string,
  reviewId: number,
  updateData: ReviewUpdateRequest
): Promise<ApiSuccessResponse<ReviewResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    const review = await tx.review.findFirst({
      where: {
        id: reviewId,
        post: {
          project_id: project.id,
          type: 'review'
        }
      },
      include: {
        post: true
      }
    });

    if (!review || !review.post) {
      throw new NotFoundError('覆盤記錄不存在');
    }

      const { 
        title, 
        mood, 
        moodDescription, 
        stressLevel, 
        learningReview, 
        learningFeedback, 
        adjustmentPlan 
      } = updateData;

      // 更新 Post 標題
      if (title !== undefined) {
        await tx.post.update({
          where: { id: review.post.id },
          data: { title }
        });
      }

      // 更新 Review 資料
      const reviewUpdates: Record<string, unknown> = {};
      if (mood !== undefined) reviewUpdates.mood = mood;
      if (moodDescription !== undefined) reviewUpdates.mood_description = moodDescription;
      if (stressLevel !== undefined) reviewUpdates.stress_level = Math.min(Math.max(1, stressLevel), 10);
      if (learningReview !== undefined) reviewUpdates.learning_review = Math.min(Math.max(1, learningReview), 10);
      if (learningFeedback !== undefined) reviewUpdates.learning_feedback = learningFeedback;
      if (adjustmentPlan !== undefined) reviewUpdates.adjustment_plan = adjustmentPlan;

      if (Object.keys(reviewUpdates).length > 0) {
        await tx.review.update({
          where: { id: reviewId },
          data: reviewUpdates
        });
      }

      // 獲取更新後的資料
      const updatedReview = await tx.review.findFirst({
        where: { id: reviewId },
        include: {
          post: true
        }
      });

      if (!updatedReview || !updatedReview.post) {
        throw new Error('更新後無法獲取覆盤資料');
      }

    const responseData = formatReviewResponse(updatedReview as Record<string, unknown>, updatedReview.post as Record<string, unknown>);

    return createSuccessResponse(responseData);
  });
};

/**
 * 刪除覆盤
 */
const deleteReview = async (
  projectId: string,
  reviewId: number
): Promise<ApiSuccessResponse<{ message: string }>> => {
  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

    const review = await tx.review.findFirst({
      where: {
        id: reviewId,
        post: {
          project_id: project.id,
          type: 'review'
        }
      },
      include: {
        post: true
      }
    });

    if (!review || !review.post) {
      throw new NotFoundError('覆盤記錄不存在');
    }

    // 刪除覆盤（會級聯刪除相關的 post）
    await tx.review.delete({
      where: { id: reviewId }
    });

    return createSuccessResponse({ message: '覆盤已刪除' });
  });
};

/**
 * 獲取用戶的覆盤統計
 */
const getReviewStats = async (
  userId: number
): Promise<ApiSuccessResponse<{
  total: number;
  averageStressLevel: number;
  averageLearningReview: number;
  moodDistribution: Record<string, number>;
}>> => {
  const reviews = await prisma.review.findMany({
    where: {
      post: {
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

  const validReviews = reviews.filter(review => review.post && review.post.project);

  const stats = {
    total: validReviews.length,
    averageStressLevel: validReviews.length > 0 
      ? validReviews.reduce((sum, r) => sum + r.stress_level, 0) / validReviews.length 
      : 0,
    averageLearningReview: validReviews.length > 0 
      ? validReviews.reduce((sum, r) => sum + r.learning_review, 0) / validReviews.length 
      : 0,
    moodDistribution: validReviews.reduce((acc, r) => {
      acc[r.mood] = (acc[r.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return createSuccessResponse(stats);
};

// 匯出服務函數
export const reviewService = {
  createReview,
  getReviews,
  getReviewDetail,
  updateReview,
  deleteReview,
  getReviewStats
} as const;