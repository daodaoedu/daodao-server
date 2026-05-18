import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

// ─── Request Schemas ──────────────────────────────────────────────────────────

export const submitAnswerBodySchema = z.object({
  questionId: z.number().int().positive().openapi({ description: '問題 ID', example: 1 }),
  selectedValue: z.string().min(1).optional().openapi({ description: '選擇題所選值', example: '看影片教學' }),
  textAnswer: z.string().min(1).optional().openapi({ description: '文字題答案', example: '因為好奇心驅使' }),
}).openapi('SubmitPersonaAnswerBody');

export const submitSkipBodySchema = z.object({
  questionId: z.number().int().positive().openapi({ description: '問題 ID', example: 1 }),
}).openapi('SubmitPersonaSkipBody');

export const addResonanceBodySchema = z.object({
  answerId: z.number().int().positive().openapi({ description: '答案 ID', example: 1 }),
}).openapi('AddPersonaResonanceBody');

export const resonanceAnswerIdParamSchema = z.object({
  answerId: z.coerce.number().int().positive().openapi({ description: '答案 ID', example: 1 }),
}).openapi('PersonaResonanceAnswerIdParam');

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const personaQuestionItemSchema = z.object({
  id: z.number().openapi({ description: '問題 ID', example: 1 }),
  prompt: z.string().openapi({ description: '問題文字', example: '你最喜歡哪種學習方式？' }),
  questionType: z.enum(['choice', 'sentence_completion', 'scenario']).openapi({ description: '題型' }),
  options: z.array(z.string()).nullable().openapi({ description: '選擇題選項（非選擇題為 null）' }),
  isNewUserPriority: z.boolean().openapi({ description: '是否為新使用者優先題' }),
  answered: z.boolean().openapi({ description: '當前使用者是否已回答' }),
  skipCount: z.number().openapi({ description: '當前使用者的跳過次數', example: 0 }),
  suppressed: z.boolean().openapi({ description: '是否已被壓制（不再展示）' }),
}).openapi('PersonaQuestionItem');

export const personaAnswerItemSchema = z.object({
  id: z.number().openapi({ description: '答案 ID', example: 1 }),
  userId: z.number().openapi({ description: '使用者 ID', example: 42 }),
  questionId: z.number().openapi({ description: '問題 ID', example: 1 }),
  selectedValue: z.string().nullable().openapi({ description: '選擇題答案' }),
  textAnswer: z.string().nullable().openapi({ description: '文字題答案' }),
  resonanceCount: z.number().openapi({ description: '獲得的共鳴數', example: 3 }),
  createdAt: z.string().openapi({ description: '建立時間（ISO 8601）' }),
  updatedAt: z.string().nullable().openapi({ description: '更新時間（ISO 8601）' }),
}).openapi('PersonaAnswerItem');

export const personaResonanceDataSchema = z.object({
  answerId: z.number().openapi({ description: '答案 ID', example: 1 }),
  resonanceCount: z.number().openapi({ description: '最新共鳴總數', example: 5 }),
}).openapi('PersonaResonanceData');

export const personaQuestionsDataSchema = z.object({
  questions: z.array(personaQuestionItemSchema),
}).openapi('PersonaQuestionsData');

export const personaQuestionsApiResponseSchema = apiSuccessResponseSchema(
  personaQuestionsDataSchema
).openapi('PersonaQuestionsApiResponse');

export const personaAnswerApiResponseSchema = apiSuccessResponseSchema(
  personaAnswerItemSchema
).openapi('PersonaAnswerApiResponse');

export const personaResonanceApiResponseSchema = apiSuccessResponseSchema(
  personaResonanceDataSchema
).openapi('PersonaResonanceApiResponse');

export const profileUserParamSchema = z.object({
  userId: z.coerce.number().int().positive().openapi({ description: '目標使用者 ID', example: 42 }),
}).openapi('PersonaProfileUserParam');

export const profileUserQuerySchema = z.object({
  exclude: z.coerce.number().int().positive().optional().openapi({ description: '要排除的問題 ID', example: 3 }),
}).openapi('PersonaProfileUserQuery');

const profileAnswerSchema = z.object({
  id: z.number(),
  selectedValue: z.string().nullable(),
  textAnswer: z.string().nullable(),
  resonanceCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
}).openapi('PersonaProfileAnswer');

export const profileQuestionItemSchema = z.object({
  id: z.number(),
  prompt: z.string(),
  questionType: z.enum(['choice', 'sentence_completion', 'scenario']),
  options: z.array(z.string()).nullable(),
  isNewUserPriority: z.boolean(),
  isPlaceholder: z.boolean(),
  answer: profileAnswerSchema.nullable(),
}).openapi('PersonaProfileQuestionItem');

export const profileMeDataSchema = z.object({
  questions: z.array(profileQuestionItemSchema),
}).openapi('PersonaProfileMeData');

export const profileUserDataSchema = z.object({
  questions: z.array(profileQuestionItemSchema),
  viewerIsLocked: z.boolean().optional(),
  answersNeeded: z.number().optional(),
}).openapi('PersonaProfileUserData');

export const profileMeApiResponseSchema = apiSuccessResponseSchema(profileMeDataSchema).openapi('PersonaProfileMeApiResponse');
export const profileUserApiResponseSchema = apiSuccessResponseSchema(profileUserDataSchema).openapi('PersonaProfileUserApiResponse');

export const carouselStateQuerySchema = z.object({
  replace: z.coerce.number().int().positive().optional().openapi({ description: '要替換的問題 ID', example: 3 }),
}).openapi('CarouselStateQuery');

export const carouselStateDataSchema = z.object({
  shouldShow: z.boolean().openapi({ description: '是否應顯示輪播' }),
  allAnswered: z.boolean().openapi({ description: '是否所有問題已回答' }),
  questions: z.array(personaQuestionItemSchema).openapi({ description: '本次輪播問題（最多 5 題）' }),
}).openapi('PersonaCarouselState');

export const carouselDismissDataSchema = z.object({
  dismissed: z.boolean().openapi({ description: '是否成功 dismiss' }),
}).openapi('PersonaCarouselDismiss');

export const carouselStateApiResponseSchema = apiSuccessResponseSchema(carouselStateDataSchema).openapi('PersonaCarouselStateApiResponse');
export const carouselDismissApiResponseSchema = apiSuccessResponseSchema(carouselDismissDataSchema).openapi('PersonaCarouselDismissApiResponse');

// ─── Component Registration ───────────────────────────────────────────────────

registry.register('PersonaQuestionItem', personaQuestionItemSchema);
registry.register('PersonaAnswerItem', personaAnswerItemSchema);
registry.register('PersonaResonanceData', personaResonanceDataSchema);
registry.register('PersonaCarouselState', carouselStateDataSchema);

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type SubmitAnswerBody = z.infer<typeof submitAnswerBodySchema>;
export type SubmitSkipBody = z.infer<typeof submitSkipBodySchema>;
export type AddResonanceBody = z.infer<typeof addResonanceBodySchema>;
export type PersonaQuestionItem = z.infer<typeof personaQuestionItemSchema>;
export type PersonaAnswerItem = z.infer<typeof personaAnswerItemSchema>;
export type PersonaResonanceData = z.infer<typeof personaResonanceDataSchema>;
export type CarouselStateQuery = z.infer<typeof carouselStateQuerySchema>;
export type PersonaCarouselState = z.infer<typeof carouselStateDataSchema>;
export type ProfileUserQuery = z.infer<typeof profileUserQuerySchema>;
