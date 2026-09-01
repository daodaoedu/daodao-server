import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

const DAY_MS = 24 * 60 * 60 * 1000;
export const FUTURE_LETTER_MIN_DELAY_MS = 3 * DAY_MS;
export const FUTURE_LETTER_MAX_DELAY_MS = 90 * DAY_MS;

/** Determine whether a delivery date is inside the inclusive 3-to-90-day window. */
export function isValidFutureLetterDeliveryDate(value: string, nowMs = Date.now()): boolean {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const delay = timestamp - nowMs;
  return delay >= FUTURE_LETTER_MIN_DELAY_MS && delay <= FUTURE_LETTER_MAX_DELAY_MS;
}

const draftTextSchema = z.string();
const isoDateSchema = z.iso.datetime({ offset: true });
const optionalPracticeIdSchema = z.uuid().nullable().optional().openapi({
  description: '關聯主題實踐的 UUID；null 表示清除關聯',
  example: '550e8400-e29b-41d4-a716-446655440000',
});

/** Create a draft; empty text is intentionally allowed until send time. */
export const createFutureLetterSchema = z.object({
  currentSelf: draftTextSchema.default('').openapi({ description: '寫信當下的自己，草稿可空', example: '我正在開始新的學習計畫' }),
  message: draftTextSchema.default('').openapi({ description: '想對未來的自己說的話，草稿可空', example: '希望你仍然享受學習' }),
  deliverAt: isoDateSchema.optional().openapi({ description: '草稿預填的送達時間', example: '2026-09-01T08:00:00.000Z' }),
  practiceId: optionalPracticeIdSchema,
}).openapi('CreateFutureLetter');

/** Update a draft; at least one field must be supplied. */
export const updateFutureLetterSchema = z.object({
  currentSelf: draftTextSchema.optional().openapi({ description: '寫信當下的自己，草稿可空' }),
  message: draftTextSchema.optional().openapi({ description: '想對未來的自己說的話，草稿可空' }),
  deliverAt: isoDateSchema.optional().openapi({ description: '草稿預填的送達時間' }),
  practiceId: optionalPracticeIdSchema,
}).refine(
  data => Object.keys(data).length > 0,
  { message: '至少提供一個要更新的欄位' },
).openapi('UpdateFutureLetter');

/** Send a complete draft within the inclusive delivery window. */
export const sendFutureLetterSchema = z.object({
  deliverAt: isoDateSchema.refine(value => isValidFutureLetterDeliveryDate(value), {
    message: '送達時間必須介於 3 到 90 天後',
  }).openapi({ description: '送達時間，必須介於現在 3 到 90 天後（含邊界）', example: '2026-09-01T08:00:00.000Z' }),
}).openapi('SendFutureLetter');

export const futureLetterIdParamSchema = z.object({
  id: z.uuid().openapi({ description: '信件 UUID', example: '550e8400-e29b-41d4-a716-446655440000' }),
}).openapi('FutureLetterIdParam');

export const futureLetterListQuerySchema = z.object({
  status: z.enum(['draft', 'scheduled', 'delivered']).optional().openapi({ description: '信件狀態篩選', example: 'draft' }),
  page: z.coerce.number().int().min(1).default(1).openapi({ description: '頁碼', example: 1 }),
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({ description: '每頁筆數', example: 20 }),
}).openapi('FutureLetterListQuery');

export const futureLetterPracticeSchema = z.object({
  id: z.string().nullable(),
  title: z.string(),
}).openapi('FutureLetterPractice');

export const futureLetterSchema = z.object({
  id: z.string(),
  currentSelf: z.string().nullable(),
  message: z.string().nullable(),
  status: z.enum(['draft', 'scheduled', 'delivered', 'deleted']),
  deliverAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  openedAt: z.string().nullable(),
  practiceId: z.string().nullable(),
  practice: futureLetterPracticeSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('FutureLetter');

export const futureLetterApiResponseSchema = apiSuccessResponseSchema(futureLetterSchema).openapi('FutureLetterApiResponse');

export const futureLetterListApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(futureLetterSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
    itemsPerPage: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  timestamp: z.string(),
}).openapi('FutureLetterListApiResponse');

registry.register('FutureLetter', futureLetterSchema);
registry.register('FutureLetterApiResponse', futureLetterApiResponseSchema);
registry.register('FutureLetterListApiResponse', futureLetterListApiResponseSchema);

export type CreateFutureLetterInput = z.infer<typeof createFutureLetterSchema>;
export type UpdateFutureLetterInput = z.infer<typeof updateFutureLetterSchema>;
export type SendFutureLetterInput = z.infer<typeof sendFutureLetterSchema>;
export type FutureLetterListQuery = z.infer<typeof futureLetterListQuerySchema>;
export type FutureLetterIdParam = z.infer<typeof futureLetterIdParamSchema>;
