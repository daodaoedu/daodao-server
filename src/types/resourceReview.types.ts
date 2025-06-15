/**
 * ResourceReview 相關類型定義
 */

import { TimeUsage, UserBasicInfo } from './common.types';

// Re-export TimeUsage for convenient access
export { TimeUsage };

// 評分值類型（1.0-5.0，支援 0.5 分間距）
export type ScoreValue = 1.0 | 1.5 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0 | 4.5 | 5.0;

/**
 * 資料庫中的 ResourceReview 模型
 */
export interface ResourceReviewDbModel {
  id: number;
  user_id: number;
  resource_id: number;
  score_impact: number;
  score_mindset: number;
  score_problems: number;
  score_perspectives: number;
  score_goals: number;
  content: string;
  well_structured: boolean;
  practice_focused: boolean;
  well_rounded_concepts: boolean;
  thought_provoking: boolean;
  progressive_learning: boolean;
  problem_based: boolean;
  real_world_examples: boolean;
  interactive: boolean;
  visually_rich: boolean;
  time_usage: TimeUsage | null;
  with_online_courses: boolean;
  with_books: boolean;
  with_other_tools: boolean;
  with_community: boolean;
  only_this_resource: boolean;
  not_applicable_resource: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * 內容特色
 */
export interface ContentFeatures {
  wellStructured: boolean;
  practiceFocused: boolean;
  wellRoundedConcepts: boolean;
  thoughtProvoking: boolean;
  progressiveLearning: boolean;
  problemBased: boolean;
  realWorldExamples: boolean;
  interactive: boolean;
  visuallyRich: boolean;
}

/**
 * 資源使用方式
 */
export interface ResourceUsage {
  withOnlineCourses: boolean;
  withBooks: boolean;
  withOtherTools: boolean;
  withCommunity: boolean;
  onlyThisResource: boolean;
  notApplicableResource: boolean;
}

/**
 * API 回應的 ResourceReview 格式
 */
export interface ResourceReviewResponse {
  id: number;
  content: string;
  overallImpact: number;
  changeMindset: number;
  solveProblems: number;
  gainPerspectives: number;
  achieveGoals: number;
  avgRating: number;
  timeUsage: TimeUsage | null;
  contentFeatures: ContentFeatures;
  resourceUsage: ResourceUsage;
  status: string;
  likesCount: number;
  user: UserBasicInfo;
  resourceId: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 創建 ResourceReview 的 DTO
 */
export interface CreateResourceReviewDto {
  content: string;
  overallImpact: ScoreValue;
  changeMindset: ScoreValue;
  solveProblems: ScoreValue;
  gainPerspectives: ScoreValue;
  achieveGoals: ScoreValue;
  timeUsage?: TimeUsage | null;
  contentFeatures?: Partial<ContentFeatures>;
  resourceUsage?: Partial<ResourceUsage>;
  tags?: string[];
}

/**
 * 更新 ResourceReview 的 DTO
 */
export interface UpdateResourceReviewDto {
  content?: string;
  overallImpact?: ScoreValue;
  changeMindset?: ScoreValue;
  solveProblems?: ScoreValue;
  gainPerspectives?: ScoreValue;
  achieveGoals?: ScoreValue;
  timeUsage?: TimeUsage | null;
  contentFeatures?: Partial<ContentFeatures>;
  resourceUsage?: Partial<ResourceUsage>;
  tags?: string[];
  status?: string;
}

/**
 * DTO 到資料庫布爾欄位的映射類型
 */
export interface DtoToBooleanFields {
  well_structured: boolean;
  practice_focused: boolean;
  well_rounded_concepts: boolean;
  thought_provoking: boolean;
  progressive_learning: boolean;
  problem_based: boolean;
  real_world_examples: boolean;
  interactive: boolean;
  visually_rich: boolean;
  with_online_courses: boolean;
  with_books: boolean;
  with_other_tools: boolean;
  with_community: boolean;
  only_this_resource: boolean;
  not_applicable_resource: boolean;
}
