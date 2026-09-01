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

export const personaQuestionsDataSchema = z.object({
  questions: z.array(personaQuestionItemSchema),
}).openapi('PersonaQuestionsData');

export const personaQuestionsApiResponseSchema = apiSuccessResponseSchema(
  personaQuestionsDataSchema
).openapi('PersonaQuestionsApiResponse');

export const personaAnswerApiResponseSchema = apiSuccessResponseSchema(
  personaAnswerItemSchema
).openapi('PersonaAnswerApiResponse');

export const profileUserParamSchema = z.object({
  userId: z.string().uuid().openapi({ description: '目標使用者 UUID', example: '123e4567-e89b-12d3-a456-426614174000' }),
}).openapi('PersonaProfileUserParam');

export const profileUserQuerySchema = z.object({
  exclude: z.coerce.number().int().positive().optional().openapi({ description: '要排除的問題 ID', example: 3 }),
  locale: z.enum(['zh-TW', 'en']).optional().default('zh-TW').openapi({ description: '語系代碼（預設 zh-TW）', example: 'zh-TW' }),
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

export const localeQuerySchema = z.object({
  locale: z.enum(['zh-TW', 'en']).optional().default('zh-TW').openapi({ description: '語系代碼（預設 zh-TW）', example: 'zh-TW' }),
}).openapi('LocaleQuery');

export const questionAnswersParamSchema = z.object({
  questionId: z.coerce.number().int().positive().openapi({ description: '問題 ID', example: 1 }),
}).openapi('QuestionAnswersParam');

export const questionAnswersQuerySchema = z.object({
  locale: z.enum(['zh-TW', 'en']).optional().default('zh-TW').openapi({ description: '語系代碼（預設 zh-TW）', example: 'zh-TW' }),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20).openapi({ description: '每頁項目數（1–50，預設 20）', example: 20 }),
  cursor: z.coerce.number().int().positive().optional().openapi({ description: '游標（上一頁最後一筆答案的 ID）', example: 100 }),
}).openapi('QuestionAnswersQuery');

export const questionAnswerItemSchema = z.object({
  answerId: z.number().openapi({ description: '答案 ID', example: 123 }),
  userId: z.string().nullable().openapi({ description: '使用者 external_id（UUID），不公開時為 null', example: '123e4567-e89b-12d3-a456-426614174000' }),
  customId: z.string().nullable().openapi({ description: '使用者自訂 ID，未設定或不公開時為 null', example: 'xiaoming' }),
  name: z.string().nullable().openapi({ description: '使用者暱稱，不公開時為 null', example: '小明' }),
  photoURL: z.string().nullable().openapi({ description: '頭像 URL，不公開時為 null' }),
  selectedValue: z.string().nullable().openapi({ description: '選擇題答案' }),
  textAnswer: z.string().nullable().openapi({ description: '文字題答案' }),
  resonanceCount: z.number().openapi({ description: '獲得的共鳴數', example: 3 }),
  currentUserReaction: z.string().nullable().openapi({ description: '目前登入者對此答案的反應類型', example: 'encourage' }),
  isPublic: z.boolean().openapi({ description: '作答者是否公開個人資料' }),
  isConnection: z.boolean().openapi({ description: '作答者是否為目前登入者的連結好友' }),
  answeredAt: z.string().openapi({ description: '作答時間（ISO 8601）' }),
  isSelf: z.boolean().openapi({ description: '是否為目前登入者自己的答案' }),
}).openapi('QuestionAnswerItem');

export const questionAnswersDataSchema = z.object({
  question: z.object({
    id: z.number(),
    prompt: z.string(),
    questionType: z.enum(['choice', 'sentence_completion', 'scenario']),
    options: z.array(z.string()).nullable(),
    totalAnswerCount: z.number().openapi({ description: '此題目的總回應數' }),
    optionCounts: z.record(z.string(), z.number().int().nonnegative()).openapi({
      description: '各選擇題選項的作答人數；非選擇題或尚無選項回答時為空物件',
      example: { '看影片教學': 12, 'PDF 閱讀': 7 },
    }),
  }).openapi('QuestionAnswersSummary'),
  answers: z.array(questionAnswerItemSchema),
  hasMore: z.boolean().openapi({ description: '是否還有更多資料' }),
  nextCursor: z.number().nullable().openapi({ description: '下一頁游標（最後一筆答案 ID），無更多資料時為 null' }),
  viewerIsLocked: z.boolean().optional().openapi({ description: '登入者是否因答題數不足而被鎖定' }),
  answersNeeded: z.number().optional().openapi({ description: '解鎖所需的額外答題數' }),
}).openapi('QuestionAnswersData');

export const questionAnswersApiResponseSchema = apiSuccessResponseSchema(questionAnswersDataSchema).openapi('QuestionAnswersApiResponse');

export const questionViewParamSchema = z.object({
  questionId: z.coerce.number().int().positive().openapi({ description: '問題 ID', example: 1 }),
}).openapi('QuestionViewParam');

export const questionViewDataSchema = z.object({
  viewCount: z.number().openapi({ description: '此題目目前的累計觀看數', example: 42 }),
}).openapi('QuestionViewData');

export const questionViewApiResponseSchema = apiSuccessResponseSchema(questionViewDataSchema).openapi('QuestionViewApiResponse');

export const carouselStateQuerySchema = z.object({
  replace: z.coerce.number().int().positive().optional().openapi({ description: '要替換的問題 ID', example: 3 }),
  locale: z.enum(['zh-TW', 'en']).optional().default('zh-TW').openapi({ description: '語系代碼（預設 zh-TW）', example: 'zh-TW' }),
}).openapi('CarouselStateQuery');

export const carouselStateDataSchema = z.object({
  shouldShow: z.boolean().openapi({ description: '是否應顯示輪播' }),
  allAnswered: z.boolean().openapi({ description: '是否所有問題已回答' }),
  questions: z.array(personaQuestionItemSchema).openapi({ description: '本次輪播的全部可用題目' }),
}).openapi('PersonaCarouselState');

export const carouselDismissDataSchema = z.object({
  dismissed: z.boolean().openapi({ description: '是否成功 dismiss' }),
}).openapi('PersonaCarouselDismiss');

export const carouselStateApiResponseSchema = apiSuccessResponseSchema(carouselStateDataSchema).openapi('PersonaCarouselStateApiResponse');
export const carouselDismissApiResponseSchema = apiSuccessResponseSchema(carouselDismissDataSchema).openapi('PersonaCarouselDismissApiResponse');

// ─── Component Registration ───────────────────────────────────────────────────

registry.register('PersonaQuestionItem', personaQuestionItemSchema);
registry.register('PersonaAnswerItem', personaAnswerItemSchema);
registry.register('PersonaCarouselState', carouselStateDataSchema);

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type SubmitAnswerBody = z.infer<typeof submitAnswerBodySchema>;
export type SubmitSkipBody = z.infer<typeof submitSkipBodySchema>;
export type PersonaQuestionItem = z.infer<typeof personaQuestionItemSchema>;
export type PersonaAnswerItem = z.infer<typeof personaAnswerItemSchema>;
export type CarouselStateQuery = z.infer<typeof carouselStateQuerySchema>;
export type PersonaCarouselState = z.infer<typeof carouselStateDataSchema>;
export type ProfileUserQuery = z.infer<typeof profileUserQuerySchema>;
export type LocaleQuery = z.infer<typeof localeQuerySchema>;
export type QuestionAnswersParam = z.infer<typeof questionAnswersParamSchema>;
export type QuestionAnswersQuery = z.infer<typeof questionAnswersQuerySchema>;
export type QuestionAnswerItem = z.infer<typeof questionAnswerItemSchema>;
export type QuestionViewParam = z.infer<typeof questionViewParamSchema>;
