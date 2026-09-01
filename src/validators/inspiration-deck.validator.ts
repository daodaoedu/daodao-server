import { z } from 'zod';

// ── 參與者端 ─────────────────────────────────────────────

export const drawParamsSchema = z.object({
  challengeId: z.coerce.number().int().positive().openapi({ description: '挑戰（期）ID', example: 1 })
});

export const selectDrawParamsSchema = drawParamsSchema.extend({
  drawId: z.coerce.number().int().positive().openapi({ description: '抽卡記錄 ID' })
});

export const drawItemSchema = z.object({
  drawId: z.number().int(),
  cardId: z.number().int(),
  content: z.string().openapi({ description: '卡片文字內容（≤50 字）' }),
  isSelected: z.boolean()
});

export const todayDrawsResponseSchema = z.object({
  drawsUsed: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative().openapi({ description: '今日剩餘抽卡次數（每日上限 3）' }),
  draws: z.array(drawItemSchema),
  selectedDrawId: z.number().int().nullable()
});

export const drawResultResponseSchema = z.object({
  drawId: z.number().int(),
  cardId: z.number().int(),
  content: z.string(),
  remaining: z.number().int().nonnegative()
});

export const selectDrawResponseSchema = z.object({
  drawId: z.number().int(),
  isSelected: z.literal(true)
});

// ── 管理端 ───────────────────────────────────────────────

export const deckParamsSchema = z.object({
  deckId: z.coerce.number().int().positive().openapi({ description: '卡組 ID' })
});

export const deckCardParamsSchema = deckParamsSchema.extend({
  cardId: z.coerce.number().int().positive().openapi({ description: '卡片 ID' })
});

const cardContentSchema = z.string().trim().min(1, '卡片內容不可為空').max(50, '卡片內容最多 50 字')
  .openapi({ description: '卡片文字內容，最多 50 字', example: '今天為自己保留 10 分鐘安靜時間' });

export const createDeckSchema = z.object({
  name: z.string().trim().min(1).max(100).openapi({ description: '卡組名稱', example: '晨間書寫靈感' }),
  cards: z.array(cardContentSchema).max(500).default([]).openapi({ description: '初始卡片內容（可空）' })
});

export const updateDeckSchema = z.object({
  name: z.string().trim().min(1).max(100).openapi({ description: '卡組名稱' })
});

export const cardBodySchema = z.object({ content: cardContentSchema });

export const assignDeckSchema = z.object({
  cohortId: z.coerce.number().int().positive().openapi({ description: '共同挑戰（期）ID' })
});

export const deckCardSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  sortOrder: z.number().int()
});

export const deckSummarySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  cardCount: z.number().int().nonnegative(),
  assignments: z.array(z.object({ cohortId: z.number().int(), cohortName: z.string() })),
  createdAt: z.date(),
  updatedAt: z.date().nullable()
});

export const deckListResponseSchema = z.array(deckSummarySchema);

export const deckDetailResponseSchema = deckSummarySchema.extend({
  cards: z.array(deckCardSchema)
});

export const importCardsResponseSchema = z.object({
  imported: z.number().int().nonnegative(),
  errors: z.array(z.object({ row: z.number().int(), reason: z.string() }))
});

export const assignResultResponseSchema = z.object({
  deckId: z.number().int(),
  cohortId: z.number().int(),
  assigned: z.boolean()
});
