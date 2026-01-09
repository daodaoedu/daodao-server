/**
 * Task Validators
 * 任務相關的 Zod 驗證模式
 */

import { z } from 'zod';
import { DayEnum } from '../types/task.types';

/**
 * 創建任務的請求體驗證
 */
export const createTaskSchema = z.object({
  name: z.string()
    .min(1, '任務名稱不能為空')
    .max(200, '任務名稱不能超過 200 個字符'),
  description: z.string()
    .max(1000, '任務描述不能超過 1000 個字符')
    .optional(),
  position: z.number()
    .int('位置必須是整數')
    .min(0, '位置不能為負數')
    .optional(),
  isCompleted: z.boolean()
    .default(false)
    .optional(),
  daysOfWeek: z.array(z.nativeEnum(DayEnum))
    .optional()
});

/**
 * 更新任務的請求體驗證
 */
export const updateTaskSchema = z.object({
  name: z.string()
    .min(1, '任務名稱不能為空')
    .max(200, '任務名稱不能超過 200 個字符')
    .optional(),
  description: z.string()
    .max(1000, '任務描述不能超過 1000 個字符')
    .optional(),
  position: z.number()
    .int('位置必須是整數')
    .min(0, '位置不能為負數')
    .optional(),
  isCompleted: z.boolean()
    .optional(),
  daysOfWeek: z.array(z.nativeEnum(DayEnum))
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: '至少需要提供一個要更新的欄位' }
);

/**
 * 任務路由參數驗證
 */
export const taskParamsSchema = z.object({
  projectId: z.string()
    .min(1, '專案 ID 不能為空'),
  milestoneId: z.string()
    .regex(/^\d+$/, '里程碑 ID 必須是數字')
    .transform(Number),
  taskId: z.string()
    .regex(/^\d+$/, '任務 ID 必須是數字')
    .transform(Number)
});

/**
 * 任務和里程碑路由參數驗證（不包含 taskId）
 */
export const taskMilestoneParamsSchema = z.object({
  projectId: z.string()
    .min(1, '專案 ID 不能為空'),
  milestoneId: z.string()
    .regex(/^\d+$/, '里程碑 ID 必須是數字')
    .transform(Number)
});

/**
 * 任務響應數據結構
 */
export const taskDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  position: z.number().optional(),
  isCompleted: z.boolean(),
  daysOfWeek: z.array(z.nativeEnum(DayEnum)).optional(),
  milestoneId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
});

/**
 * 單個任務響應驗證
 */
export const singleTaskResponseSchema = z.object({
  success: z.literal(true),
  data: taskDataSchema,
  timestamp: z.string()
});

/**
 * 任務列表響應驗證
 */
export const taskListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(taskDataSchema),
  timestamp: z.string()
});

/**
 * 刪除任務響應驗證
 */
export const deleteTaskResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string()
  }),
  timestamp: z.string()
});