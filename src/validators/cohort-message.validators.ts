import { z } from 'zod';
import '../config/openapi-registry';

/** 訊息／範本類別：鼓勵（給需要鼓勵的人）或慶祝（給值得慶祝的時刻） */
export const cohortMessageCategorySchema = z.enum(['encourage', 'celebrate']).openapi({ description: 'encourage 鼓勵、celebrate 慶祝', example: 'encourage' });

export const cohortParticipantParamsSchema = z.object({
  programId: z.coerce.number().int().positive(), cohortId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive().openapi({ description: '參與者 users.id' })
});
export const cohortParticipantPracticeParamsSchema = cohortParticipantParamsSchema.extend({
  practiceId: z.coerce.number().int().positive().openapi({ description: '該參與者在本場次的 practices.id' })
});
export const cohortMessageTemplateParamsSchema = z.object({
  organizationId: z.coerce.number().int().positive(), templateId: z.coerce.number().int().positive()
});
export const cohortMessageTemplateListQuerySchema = z.object({ category: cohortMessageCategorySchema.optional() });

export const sendCohortMessageSchema = z.object({
  category: cohortMessageCategorySchema,
  body: z.string().trim().min(1).max(2000).openapi({ description: '訊息內容', example: '看到你這週又回來打卡了，真好。' }),
  practiceId: z.number().int().positive().nullable().optional().openapi({ description: '訊息來源列對應的實踐；可不帶' }),
  templateId: z.number().int().positive().nullable().optional().openapi({ description: '若由範本帶入，記錄範本 id' })
});
export const createCohortMessageTemplateSchema = z.object({
  category: cohortMessageCategorySchema,
  title: z.string().trim().min(1).max(100).openapi({ description: '範本名稱（下拉選單顯示）', example: '節奏很穩' }),
  body: z.string().trim().min(1).max(2000).openapi({ description: '範本內容', example: '看到你連續打卡一週了，節奏抓得很穩，繼續加油！' })
});

export const cohortParticipantCheckinsResponseSchema = z.object({
  participant: z.object({ userId: z.number().int(), nickname: z.string().nullable(), avatar: z.string().nullable() }),
  practice: z.object({ id: z.number().int(), externalId: z.string().uuid().nullable().openapi({ description: '實踐公開識別碼，用於連到參與者打卡頁' }), title: z.string(), startDate: z.date().nullable(), endDate: z.date().nullable() }),
  total: z.number().int().nonnegative(),
  items: z.array(z.object({
    id: z.number().int(), checkinDate: z.date(), mood: z.string().nullable(), note: z.string().nullable(),
    imageUrls: z.array(z.string()), createdAt: z.date().nullable()
  }))
});
export const cohortMessageResponseSchema = z.object({
  id: z.number().int(), cohortId: z.number().int(), recipientUserId: z.number().int().nullable(),
  senderUserId: z.number().int().nullable(), senderNickname: z.string().nullable(),
  practiceId: z.number().int().nullable(), practiceTitle: z.string().nullable(), templateId: z.number().int().nullable(),
  category: cohortMessageCategorySchema, body: z.string(), sentAt: z.date()
});
export const cohortMessageListResponseSchema = z.object({
  participant: z.object({ userId: z.number().int(), nickname: z.string().nullable(), avatar: z.string().nullable() }),
  total: z.number().int().nonnegative(),
  items: z.array(cohortMessageResponseSchema)
});
export const cohortMessageTemplateResponseSchema = z.object({
  id: z.number().int(), organizationId: z.number().int(), createdBy: z.number().int().nullable(),
  category: cohortMessageCategorySchema, title: z.string(), body: z.string(),
  createdAt: z.date(), updatedAt: z.date().nullable()
});
export const cohortMessageTemplateListResponseSchema = z.array(cohortMessageTemplateResponseSchema);

export type SendCohortMessageInput = z.infer<typeof sendCohortMessageSchema>;
export type CreateCohortMessageTemplateInput = z.infer<typeof createCohortMessageTemplateSchema>;
export type CohortMessageCategory = z.infer<typeof cohortMessageCategorySchema>;
