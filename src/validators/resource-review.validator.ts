/**
 * ResourceReview 相關驗證器
 */

import { z } from 'zod';

// 時間使用選項驗證
export const timeUsageSchema = z.enum([
  '1_2_hours_daily',
  'few_intensive_days_week',
  'spare_moments',
  'not_applicable_time'
]);

// 評分驗證 (支援 0.5 分間距)
export const scoreSchema = z.number()
  .min(1.0, { message: "評分最低為1.0" })
  .max(5.0, { message: "評分最高為5.0" })
  .refine(value => {
    const decimal = value % 1;
    return decimal === 0 || decimal === 0.5;
  }, { message: "評分必須以0.5為間距（如1.0, 1.5, 2.0等）" });

// 狀態類型驗證
export const reviewStatusSchema = z.enum([
  'draft',
  'published',
  'archived',
  'reported'
]);

// 內容特色物件 schema
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false),
  practiceFocused: z.boolean().default(false),
  wellRoundedConcepts: z.boolean().default(false),
  thoughtProvoking: z.boolean().default(false),
  progressiveLearning: z.boolean().default(false),
  problemBased: z.boolean().default(false),
  realWorldExamples: z.boolean().default(false),
  interactive: z.boolean().default(false),
  visuallyRich: z.boolean().default(false)
});

// 資源使用物件 schema
export const resourceUsageSchema = z.object({
  withOnlineCourses: z.boolean().default(false),
  withBooks: z.boolean().default(false),
  withOtherTools: z.boolean().default(false),
  withCommunity: z.boolean().default(false),
  onlyThisResource: z.boolean().default(false),
  notApplicableResource: z.boolean().default(false)
});

// 心得評價基本驗證 Schema
export const resourceReviewBaseSchema = z.object({
  content: z.string().min(1, { message: "評論內容不能為空" }),
  overallImpact: scoreSchema,
  changeMindset: scoreSchema,
  solveProblems: scoreSchema,
  gainPerspectives: scoreSchema,
  achieveGoals: scoreSchema,
  timeUsage: timeUsageSchema.optional().nullable(),
  contentFeatures: contentFeaturesSchema.optional().default({
    wellStructured: false,
    practiceFocused: false,
    wellRoundedConcepts: false,
    thoughtProvoking: false,
    progressiveLearning: false,
    problemBased: false,
    realWorldExamples: false,
    interactive: false,
    visuallyRich: false
  }),
  resourceUsage: resourceUsageSchema.optional().default({
    withOnlineCourses: false,
    withBooks: false,
    withOtherTools: false,
    withCommunity: false,
    onlyThisResource: false,
    notApplicableResource: false
  }),
  tags: z.array(z.string()).optional()
});

// 建立心得評價驗證 Schema
export const resourceReviewSchema = resourceReviewBaseSchema;

// 更新心得評價驗證 Schema
export const updateResourceReviewSchema = resourceReviewBaseSchema.partial().extend({
  status: reviewStatusSchema.optional()
});

// 狀態更新驗證 Schema
export const updateReviewStatusSchema = z.object({
  status: reviewStatusSchema
});

// 使用 zod 推導型別
export type ResourceReviewSchema = z.infer<typeof resourceReviewSchema>;
export type UpdateResourceReviewSchema = z.infer<typeof updateResourceReviewSchema>;
export type UpdateReviewStatusSchema = z.infer<typeof updateReviewStatusSchema>;
export type ContentFeaturesSchema = z.infer<typeof contentFeaturesSchema>;
export type ResourceUsageSchema = z.infer<typeof resourceUsageSchema>;

// 匯出驗證中間件
export const validateCreateResourceReview = (data: unknown): ResourceReviewSchema => resourceReviewSchema.parse(data);
export const validateUpdateResourceReview = (data: unknown): UpdateResourceReviewSchema => updateResourceReviewSchema.parse(data);
export const validateUpdateReviewStatus = (data: unknown): UpdateReviewStatusSchema => updateReviewStatusSchema.parse(data);
