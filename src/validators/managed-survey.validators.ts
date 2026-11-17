import { z } from 'zod';
import { registry } from '@/config/openapi-registry';

export const managedQuestionSchema = z.object({
  id: z.number().int().positive().optional(),
  question_text: z.string().trim().min(1).max(1000),
  question_type: z.enum(['multiple_choice', 'single_choice', 'rating', 'text', 'yesno', 'scale', 'ranking']),
  input_type: z.enum(['text', 'email', 'url', 'textarea']).default('text'),
  is_required: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
  scale_min: z.number().int().min(-100).max(100).nullable().optional(),
  scale_max: z.number().int().min(-100).max(100).nullable().optional(),
  scale_min_label: z.string().max(200).nullable().optional(),
  scale_max_label: z.string().max(200).nullable().optional(),
  options: z.array(z.object({ id: z.number().int().positive().optional(), option_text: z.string().trim().min(1).max(200), position: z.number().int().min(0).default(0) })).max(50).default([]),
}).superRefine((q, ctx) => {
  if (['single_choice', 'multiple_choice', 'ranking'].includes(q.question_type) && q.options.length < 2) ctx.addIssue({ code: 'custom', message: '選擇或排序題至少需要兩個選項', path: ['options'] });
  if (q.question_type !== 'text' && q.input_type !== 'text') ctx.addIssue({ code: 'custom', message: '輸入格式只適用文字題', path: ['input_type'] });
  if (q.question_type === 'scale' && (q.scale_min == null || q.scale_max == null || q.scale_min >= q.scale_max || q.scale_max - q.scale_min > 100)) ctx.addIssue({ code: 'custom', message: '量表必須設定遞增範圍，最多100級', path: ['scale_max'] });
}).openapi('ManagedSurveyQuestion');

const imageUrlSchema = z.string().url().max(2048).refine(value => /^https?:\/\//i.test(value), '圖片網址必須使用http或https');

export const managedSurveyCreateSchema = z.object({
  title: z.string().trim().min(1).max(200), description: z.string().max(10000).nullable().optional(),
  is_public: z.boolean().default(true), is_anonymous: z.boolean().default(true),
  max_responses: z.number().int().positive().max(1000000).nullable().optional(),
  tags: z.array(z.string().max(100)).max(20).default([]),
  cover_url: imageUrlSchema.nullable().optional(), logo_url: imageUrlSchema.nullable().optional(),
  thank_you_message: z.string().max(5000).nullable().optional(),
  questions: z.array(managedQuestionSchema).max(50).default([]),
}).openapi('ManagedSurveyCreate');
export const managedSurveyUpdateSchema = managedSurveyCreateSchema.omit({ is_public: true, is_anonymous: true, tags: true, questions: true }).partial().extend({ is_public: z.boolean().optional(), is_anonymous: z.boolean().optional(), tags: z.array(z.string().max(100)).max(20).optional(), questions: z.array(managedQuestionSchema).max(50).optional() }).openapi('ManagedSurveyUpdate');
export const managedStatusSchema = z.object({ status: z.enum(['draft', 'active', 'closed', 'archived']) }).openapi('ManagedSurveyStatus');
export const managedListSchema = z.object({ status: z.enum(['draft', 'active', 'closed', 'archived']).optional(), q: z.string().max(200).optional(), limit: z.coerce.number().int().min(1).max(100).default(20), offset: z.coerce.number().int().min(0).default(0) });
export type ManagedQuestion = z.infer<typeof managedQuestionSchema>;
export type ManagedSurveyCreate = z.infer<typeof managedSurveyCreateSchema>;
export type ManagedSurveyUpdate = z.infer<typeof managedSurveyUpdateSchema>;
registry.register('ManagedSurveyCreate', managedSurveyCreateSchema);
export const managedSubmitSchema = z.object({ answers: z.array(z.object({
  question_id: z.number().int().positive(), answer_text: z.string().max(10000).optional(),
  selected_option_ids: z.array(z.number().int().positive()).max(50).optional(),
  rating_value: z.number().int().min(-100).max(100).optional(), boolean_value: z.boolean().optional(),
})).max(50) }).openapi('ManagedSurveySubmission');

export const managedSurveyResponseSchema = z.object({
  id: z.number().int(), external_id: z.string(), managed_version: z.literal(1), title: z.string(), description: z.string().nullable(),
  status: z.enum(['draft', 'active', 'closed', 'archived']), is_public: z.boolean(), is_anonymous: z.boolean(),
  logo_url: z.string().nullable(), cover_url: z.string().nullable(), thank_you_message: z.string().nullable(), max_responses: z.number().nullable(),
  has_responded: z.boolean().optional(),
  questions: z.array(z.object({ ...managedQuestionSchema.shape, id: z.number().int(), options: z.array(z.object({ id: z.number().int(), option_text: z.string(), position: z.number().int() })) })),
}).openapi('ManagedSurveyResponse');
