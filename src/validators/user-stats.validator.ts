/**
 * 使用者統計 API 的 Zod 驗證 Schema
 */

import { z } from 'zod';

/**
 * 時間分組類型
 */
export const timeGroupBySchema = z.enum(['day', 'week', 'month', 'year']);

/**
 * 統計分組類型
 */
export const statsGroupBySchema = z.enum(['location', 'role', 'education_stage']);

/**
 * 全部分組類型
 */
export const allGroupBySchema = z.enum([
  'day',
  'week',
  'month',
  'year',
  'location',
  'role',
  'education_stage'
]);

/**
 * 匯出格式
 */
export const exportFormatSchema = z.enum(['csv', 'excel']);

/**
 * 匯出類型
 */
export const exportTypeSchema = z.enum(['registrations', 'activity', 'full']);

/**
 * 日期驗證（ISO 8601 格式 YYYY-MM-DD）
 */
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式必須為 YYYY-MM-DD' })
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: '無效的日期' }
  );

/**
 * 正整數字串轉換
 */
const positiveIntStringSchema = (fieldName: string): z.ZodSchema =>
  z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: `${fieldName} 必須是正整數`
    });

/**
 * 非負整數字串轉換
 */
const nonNegativeIntStringSchema = (fieldName: string, max?: number): z.ZodSchema =>
  z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val >= 0 && (max === undefined || val <= max),
      {
        message: max
          ? `${fieldName} 必須在 0-${max} 之間`
          : `${fieldName} 必須 >= 0`
      }
    );

/**
 * 註冊統計查詢參數 Schema
 */
export const registrationStatsQuerySchema = z
  .object({
    // 時間篩選
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),

    // 統計維度（必選）
    groupBy: allGroupBySchema,

    // 額外篩選
    locationId: positiveIntStringSchema('locationId').optional(),
    roleId: positiveIntStringSchema('roleId').optional(),
    educationStage: z.string().min(1).optional(),

    // 分頁
    limit: nonNegativeIntStringSchema('limit', 1000)
      .default(100)
      .optional(),
    offset: nonNegativeIntStringSchema('offset').default(0).optional()
  })
  .refine(
    (data) => {
      // 如果提供了 endDate，必須也提供 startDate
      if (data.endDate && !data.startDate) {
        return false;
      }
      // startDate 必須 <= endDate
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message:
        'startDate 必須早於或等於 endDate，且提供 endDate 時必須提供 startDate'
    }
  );

/**
 * 活躍度統計查詢參數 Schema
 */
export const activityStatsQuerySchema = z.object({
  // 活躍度時間範圍（天數）
  activeWithinDays: nonNegativeIntStringSchema('activeWithinDays', 365)
    .default(30)
    .optional(),

  // 統計維度
  groupBy: statsGroupBySchema.optional(),

  // 分頁
  limit: nonNegativeIntStringSchema('limit', 1000).default(100).optional(),
  offset: nonNegativeIntStringSchema('offset').default(0).optional()
});

/**
 * 匯出查詢參數 Schema
 */
export const exportStatsQuerySchema = z
  .object({
    // 匯出格式（必選）
    format: exportFormatSchema,

    // 匯出類型（必選）
    type: exportTypeSchema,

    // 時間範圍
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),

    // 統計維度
    groupBy: allGroupBySchema.optional()
  })
  .refine(
    (data) => {
      // 如果 type 是 registrations，必須提供 groupBy
      if (data.type === 'registrations' && !data.groupBy) {
        return false;
      }
      return true;
    },
    {
      message: "當 type 為 'registrations' 時，必須提供 groupBy 參數"
    }
  );

/**
 * 裝置分析查詢參數 Schema
 */
export const deviceAnalyticsQuerySchema = z.object({
  // 時間範圍
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  // 天數（如果沒提供日期範圍，預設最近 N 天）
  days: nonNegativeIntStringSchema('days', 365).default(30).optional()
});

/**
 * 留存率查詢參數 Schema
 */
export const retentionQuerySchema = z.object({
  // 分析的群組數量（最近 N 個群組）
  cohorts: nonNegativeIntStringSchema('cohorts', 30).default(7).optional(),
  // 追蹤天數
  trackDays: nonNegativeIntStringSchema('trackDays', 90).default(30).optional(),
  // 群組粒度
  granularity: z.enum(['day', 'week']).default('day').optional()
});

/**
 * 熱門檔案查詢參數 Schema
 */
export const popularProfilesQuerySchema = z.object({
  // 返回數量
  limit: nonNegativeIntStringSchema('limit', 100).default(10).optional(),
  // 偏移量
  offset: nonNegativeIntStringSchema('offset').default(0).optional(),
  // 最低查看次數
  minViews: nonNegativeIntStringSchema('minViews').default(1).optional()
});

/**
 * 類型推導
 */
export type RegistrationStatsQuery = z.infer<
  typeof registrationStatsQuerySchema
>;
export type ActivityStatsQuery = z.infer<typeof activityStatsQuerySchema>;
export type ExportStatsQuery = z.infer<typeof exportStatsQuerySchema>;
export type DeviceAnalyticsQuery = z.infer<typeof deviceAnalyticsQuerySchema>;
export type RetentionQuery = z.infer<typeof retentionQuerySchema>;
export type PopularProfilesQuery = z.infer<typeof popularProfilesQuerySchema>;

/**
 * 驗證函數
 */
export const validateRegistrationStatsQuery = (data: unknown): RegistrationStatsQuery =>
  registrationStatsQuerySchema.parse(data);
export const validateActivityStatsQuery = (data: unknown): ActivityStatsQuery =>
  activityStatsQuerySchema.parse(data);
export const validateExportStatsQuery = (data: unknown): ExportStatsQuery =>
  exportStatsQuerySchema.parse(data);
export const validateDeviceAnalyticsQuery = (data: unknown): DeviceAnalyticsQuery =>
  deviceAnalyticsQuerySchema.parse(data);
export const validateRetentionQuery = (data: unknown): RetentionQuery =>
  retentionQuerySchema.parse(data);
export const validatePopularProfilesQuery = (data: unknown): PopularProfilesQuery =>
  popularProfilesQuerySchema.parse(data);
