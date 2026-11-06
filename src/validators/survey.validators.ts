import { z } from 'zod';
import { registry } from '@/config/openapi-registry';

export const questionTypeSchema = z.enum([
  'multiple_choice', 'single_choice', 'rating', 'text', 'yesno', 'scale', 'ranking'
]).openapi({ description: '題型' });

export const surveyStatusSchema = z.enum(['draft', 'active', 'closed', 'archived'])
  .openapi({ description: '問卷狀態' });

// Condition for conditional logic
export const conditionSchema = z.object({
  depends_on_position: z.number().int().min(0),
  operator: z.enum(['equals', 'not_equals', 'contains']),
  value: z.string(),
}).openapi('Condition');

// Question option
export const questionOptionSchema = z.object({
  option_text: z.string().min(1).max(200),
  position: z.number().int().min(0).default(0),
}).openapi('QuestionOption');

// Question in create request
export const createQuestionSchema = z.object({
  question_text: z.string().min(1).max(1000),
  question_type: questionTypeSchema,
  is_required: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
  options: z.array(questionOptionSchema).optional(),
  conditions: z.array(conditionSchema).default([]),
}).openapi('CreateQuestion');

// Create survey request
export const createSurveyBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  is_anonymous: z.boolean().default(false),
  max_responses: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  cover_url: z.string().url().optional(),
  questions: z.array(createQuestionSchema).min(1).max(50),
}).openapi('CreateSurveyRequest');

// Update status request
export const updateSurveyStatusBodySchema = z.object({
  status: surveyStatusSchema,
}).openapi('UpdateSurveyStatusRequest');

// Answer in submit response
export const submitAnswerSchema = z.object({
  question_id: z.number().int().positive(),
  answer_text: z.string().optional(),
  selected_option_ids: z.array(z.number().int().positive()).optional(),
  rating_value: z.number().int().min(0).max(10).optional(),
  boolean_value: z.boolean().optional(),
}).openapi('SubmitAnswer');

// Submit response request
export const submitResponseBodySchema = z.object({
  answers: z.array(submitAnswerSchema).min(1),
  started_at: z.string().datetime().optional(),
  session_key: z.string().min(1).max(100).optional(),
}).openapi('SubmitSurveyResponseRequest');

// Partial submission tracking
export const trackPartialBodySchema = z.object({
  session_key: z.string().min(1).max(100),
  last_position: z.number().int().min(0),
}).openapi('TrackPartialRequest');
registry.register('TrackPartialRequest', trackPartialBodySchema);
export type TrackPartialBody = z.infer<typeof trackPartialBodySchema>;

// Response schemas
export const questionOptionResponseSchema = z.object({
  id: z.number(),
  option_text: z.string(),
  position: z.number(),
});

export const questionResponseSchema = z.object({
  id: z.number(),
  question_text: z.string(),
  question_type: questionTypeSchema,
  is_required: z.boolean(),
  position: z.number(),
  conditions: z.array(conditionSchema),
  options: z.array(questionOptionResponseSchema),
}).openapi('QuestionResponse');

export const surveyResponseSchema = z.object({
  id: z.number(),
  external_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: surveyStatusSchema,
  is_anonymous: z.boolean(),
  max_responses: z.number().nullable(),
  tags: z.array(z.string()),
  cover_url: z.string().nullable(),
  created_by: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  questions: z.array(questionResponseSchema),
  cohort_feedback: z.object({ state: z.enum(['login_required', 'ineligible', 'ready', 'completed']), privacy_notice: z.string() }).optional(),
}).openapi('SurveyResponse');

export const surveyListItemSchema = z.object({
  id: z.number(),
  external_id: z.string(),
  title: z.string(),
  status: surveyStatusSchema,
  is_anonymous: z.boolean(),
  tags: z.array(z.string()),
  created_at: z.string(),
  response_count: z.number(),
}).openapi('SurveyListItem');

export const analyticsResponseSchema = z.object({
  survey_id: z.number(),
  response_count: z.number(),
  per_question: z.array(z.object({
    question_id: z.number(),
    question_text: z.string(),
    question_type: questionTypeSchema,
    answer_count: z.number(),
    stats: z.record(z.string(), z.unknown()),
  })),
}).openapi('SurveyAnalytics');

// Register all schemas
registry.register('Condition', conditionSchema);
registry.register('CreateSurveyRequest', createSurveyBodySchema);
registry.register('UpdateSurveyStatusRequest', updateSurveyStatusBodySchema);
registry.register('SubmitSurveyResponseRequest', submitResponseBodySchema);
registry.register('SurveyResponse', surveyResponseSchema);
registry.register('SurveyListItem', surveyListItemSchema);
registry.register('SurveyAnalytics', analyticsResponseSchema);

export const updateSurveyBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  cover_url: z.string().url().nullable().optional(),
}).openapi('UpdateSurveyRequest');
registry.register('UpdateSurveyRequest', updateSurveyBodySchema);

export type CreateSurveyBody = z.infer<typeof createSurveyBodySchema>;
export type UpdateSurveyStatusBody = z.infer<typeof updateSurveyStatusBodySchema>;
export type SubmitResponseBody = z.infer<typeof submitResponseBodySchema>;
export type UpdateSurveyBody = z.infer<typeof updateSurveyBodySchema>;
export type ConditionBody = z.infer<typeof conditionSchema>;
