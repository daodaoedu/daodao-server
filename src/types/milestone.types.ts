/**
 * Milestone Type Definitions
 * 里程碑相關型別定義
 */

// 直接使用 Prisma 生成的類型
export type { 
  milestone,
  task,
  project
} from '../../generated/prisma';

// 里程碑 API 相關類型
export interface MilestoneCreateRequestData {
  position?: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isCompleted?: boolean;
}

export interface MilestoneUpdateRequest extends Partial<MilestoneCreateRequestData> {}

export interface MilestoneResponse {
  id: number;
  position: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  tasks: TaskResponse[];
}

export interface TaskResponse {
  id: number;
  name: string;
  position: number;
  description: string;
  daysOfWeek?: unknown;
  isCompleted: boolean;
}

export interface MilestoneQueryParams {
  projectId: string;
}

export interface MilestoneServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 里程碑驗證相關類型
export interface MilestoneValidationError {
  field: string;
  message: string;
}

// 里程碑統計類型
export interface MilestoneStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}