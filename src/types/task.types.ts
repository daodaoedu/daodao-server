/**
 * Task Types
 * 任務相關的 TypeScript 類型定義
 */

import type { ApiSuccessResponse, ApiResponse } from './api-response.types';

/**
 * 星期枚舉
 */
export enum DayEnum {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday'
}

/**
 * 任務基本資料結構
 */
export interface TaskData {
  id: number;
  name: string;
  description?: string;
  position?: number;
  isCompleted: boolean;
  daysOfWeek?: DayEnum[];
  milestoneId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 創建任務請求資料
 */
export interface TaskCreateRequestData {
  name: string;
  description?: string;
  position?: number;
  isCompleted?: boolean;
  daysOfWeek?: DayEnum[];
}

/**
 * 更新任務請求資料
 */
export interface TaskUpdateRequest {
  name?: string;
  description?: string;
  position?: number;
  isCompleted?: boolean;
  daysOfWeek?: DayEnum[];
}

/**
 * 任務參數（路由參數）
 */
export interface TaskParams {
  projectId: string;
  milestoneId: string;
  taskId: string;
}

/**
 * API 響應類型
 */
export type TaskResponse = ApiResponse<TaskData>;
export type TaskListResponse = ApiResponse<TaskData[]>;
export type CreateTaskResponse = ApiSuccessResponse<TaskData>;
export type UpdateTaskResponse = ApiSuccessResponse<TaskData>;
export type DeleteTaskResponse = ApiSuccessResponse<{ message: string }>;

/**
 * 任務列表查詢響應（與 JavaScript 版本兼容）
 */
export interface TaskListLegacyResponse {
  success: boolean;
  tasks: TaskData[];
}

/**
 * 單個任務響應（與 JavaScript 版本兼容）
 */
export interface TaskLegacyResponse {
  success: boolean;
  task: TaskData;
}