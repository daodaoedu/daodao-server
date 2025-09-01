/**
 * Review Type Definitions
 * 覆盤相關型別定義
 */

// 直接使用 Prisma 生成的類型
export type { 
  review,
  post
} from '../../generated/prisma';

// 覆盤 API 相關類型
export interface ReviewCreateRequest {
  week: number;
  title?: string;
  mood: string;
  stressLevel: number;
  moodDescription?: string;
  learningReview: number;
  learningFeedback?: string;
  adjustmentPlan?: string;
  visibility?: 'private' | 'public';
}

export interface ReviewUpdateRequest extends Partial<Omit<ReviewCreateRequest, 'week'>> {}

export interface ReviewResponse {
  id: number;
  week: number;
  title: string;
  mood: string;
  stressLevel: number;
  moodDescription?: string;
  learningReview?: string;
  learningFeedback?: string;
  adjustmentPlan?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewQueryParams {
  projectId: string;
  week?: number;
  mood?: string;
  stressLevel?: number;
}

export interface ReviewServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 覆盤驗證相關類型
export interface ReviewValidationError {
  field: string;
  message: string;
}

// 覆盤統計類型
export interface ReviewStats {
  total: number;
  averageStressLevel: number;
  averageLearningReview: number;
  moodDistribution: Record<string, number>;
  weeklyProgress: Record<number, ReviewResponse>;
}

// 心情類型枚舉
export type MoodType = 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';

// 壓力等級範圍 (1-10)
export type StressLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// 學習回顧等級範圍 (1-10)
export type LearningReviewLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;