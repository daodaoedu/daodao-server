/**
 * Project Validators
 * 專案驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import { 
  ProjectMotivation, 
  ProjectStrategy, 
  ProjectOutcome, 
  ProjectStatus 
} from '../models/project.model';

// 專案動機驗證
const motivationSchema = z.array(z.enum(ProjectMotivation)).optional();

// 專案策略驗證
const strategySchema = z.array(z.enum(ProjectStrategy)).optional();

// 專案成果驗證
const outcomeSchema = z.array(z.enum(ProjectOutcome)).optional();

// 專案狀態驗證
const statusSchema = z.enum(ProjectStatus);

// 創建專案驗證
export const createProjectSchema = z.object({
  title: z.string()
    .min(1, '專案標題不能為空')
    .max(100, '專案標題不能超過 100 字元')
    .optional(),
  description: z.string()
    .max(2000, '專案描述不能超過 2000 字元')
    .optional(),
  motivation: motivationSchema,
  motivation_description: z.string()
    .max(1000, '動機描述不能超過 1000 字元')
    .optional(),
  goal: z.string()
    .max(500, '專案目標不能超過 500 字元')
    .optional(),
  content: z.string()
    .max(5000, '專案內容不能超過 5000 字元')
    .optional(),
  strategy: strategySchema,
  strategy_description: z.string()
    .max(1000, '策略描述不能超過 1000 字元')
    .optional(),
  resource: z.string()
    .max(2000, '資源描述不能超過 2000 字元')
    .optional(),
  outcome: outcomeSchema,
  outcome_description: z.string()
    .max(1000, '成果描述不能超過 1000 字元')
    .optional(),
  is_public: z.boolean().optional(),
  status: statusSchema.optional(),
  start_date: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional(),
  end_date: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional(),
  interval: z.number()
    .int('間隔必須是整數')
    .min(1, '間隔必須大於 0')
    .max(365, '間隔不能超過 365 天')
    .optional(),
  img_url: z.string()
    .url('圖片 URL 格式不正確')
    .optional()
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: '開始日期不能晚於結束日期',
    path: ['end_date']
  }
);

// 更新專案驗證
export const updateProjectSchema = z.object({
  title: z.string()
    .min(1, '專案標題不能為空')
    .max(100, '專案標題不能超過 100 字元')
    .optional(),
  description: z.string()
    .max(2000, '專案描述不能超過 2000 字元')
    .optional(),
  motivation: motivationSchema,
  motivation_description: z.string()
    .max(1000, '動機描述不能超過 1000 字元')
    .optional(),
  goal: z.string()
    .max(500, '專案目標不能超過 500 字元')
    .optional(),
  content: z.string()
    .max(5000, '專案內容不能超過 5000 字元')
    .optional(),
  strategy: strategySchema,
  strategy_description: z.string()
    .max(1000, '策略描述不能超過 1000 字元')
    .optional(),
  resource: z.string()
    .max(2000, '資源描述不能超過 2000 字元')
    .optional(),
  outcome: outcomeSchema,
  outcome_description: z.string()
    .max(1000, '成果描述不能超過 1000 字元')
    .optional(),
  is_public: z.boolean().optional(),
  status: statusSchema.optional(),
  start_date: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional(),
  end_date: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional(),
  interval: z.number()
    .int('間隔必須是整數')
    .min(1, '間隔必須大於 0')
    .max(365, '間隔不能超過 365 天')
    .optional(),
  img_url: z.string()
    .url('圖片 URL 格式不正確')
    .optional()
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: '開始日期不能晚於結束日期',
    path: ['end_date']
  }
);

// 專案 ID 參數驗證
export const projectParamsSchema = z.object({
  id: z.string()
    .uuid('專案 ID 格式不正確')
});

// 專案查詢參數驗證
export const projectQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, '頁碼必須是數字')
    .transform(Number)
    .refine(n => n > 0, '頁碼必須大於 0')
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, '每頁數量必須是數字')
    .transform(Number)
    .refine(n => n > 0 && n <= 100, '每頁數量必須在 1-100 之間')
    .optional(),
  status: statusSchema.optional(),
  is_public: z.string()
    .transform(val => val === 'true')
    .optional(),
  user_id: z.string()
    .regex(/^\d+$/, '使用者 ID 必須是數字')
    .transform(Number)
    .optional(),
  search: z.string()
    .max(100, '搜尋關鍵字不能超過 100 字元')
    .optional(),
  sort_by: z.enum([
    'created_at',
    'updated_at',
    'title',
    'start_date',
    'end_date'
  ]).optional(),
  sort_order: z.enum(['ASC', 'DESC']).optional()
});

// 複製專案驗證
export const duplicateProjectSchema = z.object({
  title: z.string()
    .min(1, '新專案標題不能為空')
    .max(100, '新專案標題不能超過 100 字元')
    .optional()
});

// 專案統計查詢參數驗證
export const projectStatsQuerySchema = z.object({
  user_id: z.string()
    .regex(/^\d+$/, '使用者 ID 必須是數字')
    .transform(Number)
    .optional()
});

// 批量操作驗證
export const batchProjectOperationSchema = z.object({
  action: z.enum(['delete', 'update_status', 'change_visibility']),
  project_ids: z.array(
    z.string().uuid('專案 ID 格式不正確')
  ).min(1, '至少選擇一個專案'),
  data: z.object({
    status: statusSchema.optional(),
    is_public: z.boolean().optional()
  }).optional()
}).refine(
  (data) => {
    if (data.action === 'update_status') {
      return data.data?.status !== undefined;
    }
    if (data.action === 'change_visibility') {
      return data.data?.is_public !== undefined;
    }
    return true;
  },
  {
    message: '操作所需的資料不完整',
    path: ['data']
  }
);

// 里程碑相關驗證
export const createMilestoneSchema = z.object({
  project_id: z.string()
    .uuid('專案 ID 格式不正確'),
  position: z.number()
    .int('位置必須是整數')
    .min(1, '位置必須大於 0'),
  name: z.string()
    .min(1, '里程碑名稱不能為空')
    .max(100, '里程碑名稱不能超過 100 字元')
    .optional(),
  description: z.string()
    .max(1000, '里程碑描述不能超過 1000 字元')
    .optional(),
  start_date: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional(),
  end_date: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional()
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: '開始日期不能晚於結束日期',
    path: ['end_date']
  }
);

export const updateMilestoneSchema = z.object({
  position: z.number()
    .int('位置必須是整數')
    .min(1, '位置必須大於 0')
    .optional(),
  name: z.string()
    .min(1, '里程碑名稱不能為空')
    .max(100, '里程碑名稱不能超過 100 字元')
    .optional(),
  description: z.string()
    .max(1000, '里程碑描述不能超過 1000 字元')
    .optional(),
  start_date: z.string()
    .datetime({ message: '開始日期格式不正確' })
    .optional(),
  end_date: z.string()
    .datetime({ message: '結束日期格式不正確' })
    .optional(),
  is_completed: z.boolean().optional()
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: '開始日期不能晚於結束日期',
    path: ['end_date']
  }
);

// 里程碑 ID 參數驗證
export const milestoneParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, '里程碑 ID 必須是數字')
    .transform(Number)
});

// 任務相關驗證
export const createTaskSchema = z.object({
  milestone_id: z.number()
    .int('里程碑 ID 必須是整數'),
  position: z.number()
    .int('位置必須是整數')
    .min(1, '位置必須大於 0'),
  name: z.string()
    .min(1, '任務名稱不能為空')
    .max(100, '任務名稱不能超過 100 字元')
    .optional(),
  description: z.string()
    .max(1000, '任務描述不能超過 1000 字元')
    .optional(),
  days_of_week: z.array(
    z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  ).optional()
});

export const updateTaskSchema = z.object({
  position: z.number()
    .int('位置必須是整數')
    .min(1, '位置必須大於 0')
    .optional(),
  name: z.string()
    .min(1, '任務名稱不能為空')
    .max(100, '任務名稱不能超過 100 字元')
    .optional(),
  description: z.string()
    .max(1000, '任務描述不能超過 1000 字元')
    .optional(),
  days_of_week: z.array(
    z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  ).optional(),
  is_completed: z.boolean().optional()
});

// 任務 ID 參數驗證
export const taskParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, '任務 ID 必須是數字')
    .transform(Number)
});

export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type ProjectParams = z.infer<typeof projectParamsSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
export type DuplicateProjectData = z.infer<typeof duplicateProjectSchema>;
export type ProjectStatsQuery = z.infer<typeof projectStatsQuerySchema>;
export type BatchProjectOperation = z.infer<typeof batchProjectOperationSchema>;
export type CreateMilestoneData = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneData = z.infer<typeof updateMilestoneSchema>;
export type MilestoneParams = z.infer<typeof milestoneParamsSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type TaskParams = z.infer<typeof taskParamsSchema>;