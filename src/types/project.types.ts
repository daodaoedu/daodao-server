/**
 * Project Type Definitions
 * 專案相關型別定義 - 使用 Prisma 生成的類型
 */

// 直接使用 Prisma 生成的類型
export type { 
  project,
  milestone,
  task,
  users,
  position
} from '../../generated/prisma';

// 專案 API 相關類型
export interface ProjectCreateRequest {
  title?: string;
  description?: string;
  motivation?: unknown;
  motivationDescription?: string;
  goal?: string;
  content?: string;
  strategy?: unknown;
  strategyDescription?: string;
  resources?: string;
  outcome?: unknown;
  outcomeDescription?: string;
  isPublic?: boolean;
  status?: string;
  start_date?: string;
  end_date?: string;
  interval?: number;
  imgUrl?: string;
  milestones?: MilestoneCreateRequest[];
}

export interface MilestoneCreateRequest {
  position: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
  tasks?: TaskCreateRequest[];
}

export interface TaskCreateRequest {
  position: number;
  name: string;
  description?: string;
  daysOfWeek?: string[];
  isCompleted?: boolean;
}

export interface ProjectUpdateRequest extends Partial<ProjectCreateRequest> {}

export interface ProjectResponse {
  id: string;
  userId: number;
  imgUrl?: string | null;
  title: string;
  description: string;
  motivation?: unknown;
  motivationDescription?: string | null;
  goal?: string | null;
  content?: string | null;
  strategy?: unknown;
  strategyDescription?: string | null;
  resources?: string | null;
  outcome?: unknown;
  outcomeDescription?: string | null;
  isPublic: boolean;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  interval?: number | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  user?: {
    id: number;
    name?: string | null;
    _id?: string | null;
    roleList: string[];
    photoURL?: string | null;
  } | null;
  milestones: Array<{
    id: number;
    position: number;
    name: string;
    description: string;
    startDate?: Date | null;
    endDate?: Date | null;
    isCompleted: boolean;
    tasks: Array<{
      id: number;
      name: string;
      position: number;
      description: string;
      daysOfWeek?: unknown;
      isCompleted: boolean;
    }>;
  }>;
}

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  is_public?: boolean;
  user_id?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ProjectServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProjectStats {
  total_projects: number;
  ongoing_projects: number;
  completed_projects: number;
  not_started_projects: number;
  canceled_projects: number;
}