/**
 * Project Type Definitions
 * 專案相關型別定義
 */

import type { 
  ProjectAttributes, 
  ProjectCreationAttributes,
  ProjectMotivation,
  ProjectStrategy,
  ProjectOutcome,
  ProjectStatus
} from '../models/project.model';

import type { 
  MilestoneAttributes, 
  MilestoneCreationAttributes 
} from '../models/milestone.model';

import type { 
  TaskAttributes, 
  TaskCreationAttributes,
  DaysOfWeek
} from '../models/task.model';

import type { 
  PostAttributes, 
  PostCreationAttributes,
  PostType,
  Visibility,
  PostStatus
} from '../models/post.model';

import type { 
  NoteAttributes, 
  NoteCreationAttributes,
  NoteVisibility
} from '../models/note.model';

import type { 
  OutcomeAttributes, 
  OutcomeCreationAttributes,
  OutcomeVisibility
} from '../models/outcome.model';

import type { 
  ReviewAttributes, 
  ReviewCreationAttributes,
  Mood,
  ReviewVisibility
} from '../models/review.model';

// 重新匯出模型屬性類型
export type {
  ProjectAttributes,
  ProjectCreationAttributes,
  MilestoneAttributes,
  MilestoneCreationAttributes,
  TaskAttributes,
  TaskCreationAttributes,
  PostAttributes,
  PostCreationAttributes,
  NoteAttributes,
  NoteCreationAttributes,
  OutcomeAttributes,
  OutcomeCreationAttributes,
  ReviewAttributes,
  ReviewCreationAttributes
};

// 重新匯出枚舉類型
export type {
  ProjectMotivation,
  ProjectStrategy,
  ProjectOutcome,
  ProjectStatus,
  DaysOfWeek,
  PostType,
  Visibility,
  PostStatus,
  NoteVisibility,
  OutcomeVisibility,
  Mood,
  ReviewVisibility
};

// 專案 API 相關類型
export interface ProjectCreateRequest {
  title?: string;
  description?: string;
  motivation?: (typeof ProjectMotivation)[number][];
  motivation_description?: string;
  goal?: string;
  content?: string;
  strategy?: (typeof ProjectStrategy)[number][];
  strategy_description?: string;
  resource?: string;
  outcome?: (typeof ProjectOutcome)[number][];
  outcome_description?: string;
  is_public?: boolean;
  status?: (typeof ProjectStatus)[number];
  start_date?: string;
  end_date?: string;
  interval?: number;
  img_url?: string;
}

export interface ProjectUpdateRequest extends Partial<ProjectCreateRequest> {
  id: number;
}

export interface ProjectResponse extends ProjectAttributes {
  milestones?: MilestoneResponse[];
  posts?: PostResponse[];
}

// 里程碑 API 相關類型
export interface MilestoneCreateRequest {
  project_id: string;
  position: number;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface MilestoneUpdateRequest extends Partial<MilestoneCreateRequest> {
  id: number;
  is_completed?: boolean;
}

export interface MilestoneResponse extends MilestoneAttributes {
  tasks?: TaskResponse[];
}

// 任務 API 相關類型
export interface TaskCreateRequest {
  milestone_id: number;
  position: number;
  name?: string;
  description?: string;
  days_of_week?: (typeof DaysOfWeek)[number][];
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  id: number;
  is_completed?: boolean;
}

export interface TaskResponse extends TaskAttributes {}

// 發文 API 相關類型
export interface PostCreateRequest {
  project_id: number;
  type: (typeof PostType)[number];
  week: number;
  title: string;
  date: string;
  visibility?: (typeof Visibility)[number];
  status?: (typeof PostStatus)[number];
}

export interface PostUpdateRequest extends Partial<PostCreateRequest> {
  id: number;
}

export interface PostResponse extends PostAttributes {
  note?: NoteResponse;
  outcome?: OutcomeResponse;
  review?: ReviewResponse;
}

// 筆記 API 相關類型
export interface NoteCreateRequest {
  post_id: number;
  content: string;
  image_urls?: string[];
  video_urls?: string[];
  visibility?: (typeof NoteVisibility)[number];
}

export interface NoteUpdateRequest extends Partial<NoteCreateRequest> {
  id: number;
}

export interface NoteResponse extends NoteAttributes {
  post?: PostResponse;
}

// 成果 API 相關類型
export interface OutcomeCreateRequest {
  post_id: number;
  content: string;
  image_urls?: string[];
  video_urls?: string[];
  visibility?: (typeof OutcomeVisibility)[number];
}

export interface OutcomeUpdateRequest extends Partial<OutcomeCreateRequest> {
  id: number;
}

export interface OutcomeResponse extends OutcomeAttributes {
  post?: PostResponse;
}

// 評審 API 相關類型
export interface ReviewCreateRequest {
  post_id: number;
  mood: (typeof Mood)[number];
  mood_description?: string;
  stress_level?: number;
  learning_review?: number;
  learning_feedback?: string;
  adjustment_plan?: string;
  visibility?: (typeof ReviewVisibility)[number];
}

export interface ReviewUpdateRequest extends Partial<ReviewCreateRequest> {
  id: number;
}

export interface ReviewResponse extends ReviewAttributes {
  post?: PostResponse;
}

// 查詢參數類型
export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  status?: (typeof ProjectStatus)[number];
  is_public?: boolean;
  user_id?: number;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'start_date' | 'end_date';
  sort_order?: 'ASC' | 'DESC';
}

export interface MilestoneQueryParams {
  project_id?: string;
  is_completed?: boolean;
  is_deleted?: boolean;
}

export interface TaskQueryParams {
  milestone_id?: number;
  is_completed?: boolean;
  is_deleted?: boolean;
  days_of_week?: (typeof DaysOfWeek)[number];
}

export interface PostQueryParams {
  project_id?: number;
  user_id?: number;
  type?: (typeof PostType)[number];
  week?: number;
  visibility?: (typeof Visibility)[number];
  status?: (typeof PostStatus)[number];
  start_date?: string;
  end_date?: string;
}

// 統計類型
export interface ProjectStats {
  total_projects: number;
  ongoing_projects: number;
  completed_projects: number;
  not_started_projects: number;
  canceled_projects: number;
}

export interface MilestoneStats {
  total_milestones: number;
  completed_milestones: number;
  pending_milestones: number;
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
}

// 服務層返回類型
export interface ProjectServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 批量操作類型
export interface BatchProjectOperation {
  action: 'delete' | 'update_status' | 'change_visibility';
  project_ids: number[];
  data?: {
    status?: (typeof ProjectStatus)[number];
    is_public?: boolean;
  };
}

export interface BatchMilestoneOperation {
  action: 'delete' | 'complete' | 'move';
  milestone_ids: number[];
  data?: {
    is_completed?: boolean;
    position?: number;
  };
}

export interface BatchTaskOperation {
  action: 'delete' | 'complete' | 'move';
  task_ids: number[];
  data?: {
    is_completed?: boolean;
    position?: number;
  };
}