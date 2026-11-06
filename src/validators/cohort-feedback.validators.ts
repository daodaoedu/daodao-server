import { z } from 'zod';
import { registry } from '../config/openapi-registry';

export const cohortFeedbackQuerySchema = z.object({
  status: z.enum(['all', 'completed', 'pending']).default('all').openapi({ description: '完成狀態篩選', example: 'all' }),
  page: z.coerce.number().int().min(1).max(100000).default(1).openapi({ description: '頁碼，每頁最多五人', example: 1 })
});
export type CohortFeedbackQuery = z.infer<typeof cohortFeedbackQuerySchema>;
export const cohortFeedbackResponseSchema = z.object({
  state: z.enum(['scheduled', 'sending', 'waiting', 'available', 'legacy']),
  completedCount: z.number().int().nonnegative(),
  eligibleCount: z.number().int().nonnegative(),
  participants: z.array(z.object({ userId: z.number().int(), name: z.string(), completed: z.boolean() })).max(5),
  pagination: z.object({ page: z.number().int(), pageSize: z.literal(5), total: z.number().int(), totalPages: z.number().int() }),
  ratingDistribution: z.array(z.object({ rating: z.number().int().min(1).max(5), count: z.number().int().nonnegative() })).length(5),
  totalResponses: z.number().int().nonnegative(),
  textQuestions: z.array(z.object({ questionId: z.number().int(), title: z.string(), answers: z.array(z.string()) }))
}).openapi('CohortFeedbackResponse');
export type CohortFeedbackResponse = z.infer<typeof cohortFeedbackResponseSchema>;
registry.register('CohortFeedbackResponse', cohortFeedbackResponseSchema);
