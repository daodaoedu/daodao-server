import { z } from 'zod';

export const ACTIVITY_TYPES = ['checkin', 'comment', 'rhythm'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const RHYTHM_EVENT_TYPES = ['first_checkin', 'quiet', 'return_after_break', 'month_milestone'] as const;
export type RhythmEventType = (typeof RHYTHM_EVENT_TYPES)[number];

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD');

export const cohortActivityQuerySchema = z.object({
  from: dateSchema.optional().openapi({ description: '起始日（場次時區日曆日）；預設今天往前 6 天；超出最近 7 天會被夾回範圍' }),
  to: dateSchema.optional().openapi({ description: '結束日；預設今天；早於 from 時自動對調' }),
  type: z.enum(ACTIVITY_TYPES).optional().openapi({ description: '類型篩選：checkin（打卡）| comment（留言與回應）| rhythm（節奏變化）；不帶＝全部' }),
  practiceTitle: z.string().trim().min(1).max(100).optional().openapi({ description: '只看這個實踐（與儀表板一樣以實踐名稱分組）' }),
  q: z.string().trim().max(100).optional().openapi({ description: '關鍵字：比對成員、實踐、摘要、meta 與類型（不比對詳細內容）' }),
  hasText: z.preprocess(value => value === 'true' || value === true, z.boolean()).optional().default(false).openapi({ description: '只看有文字內容的動態（打卡有筆記、留言／回應）' }),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0)
});

export const cohortActivityParamsSchema = z.object({
  programId: z.coerce.number().int().positive(),
  cohortId: z.coerce.number().int().positive(),
  type: z.enum(ACTIVITY_TYPES),
  activityId: z.string().min(1).max(80).openapi({ description: '打卡／留言為數字 id；節奏事件為 `<event_type>:<practiceId>:<YYYYMMDD>`' })
});

const memberSchema = z.object({ userId: z.number().int(), nickname: z.string().nullable(), avatar: z.string().nullable() });
const practiceSchema = z.object({ id: z.number().int(), title: z.string() });

export const cohortActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum(ACTIVITY_TYPES),
  typeLabel: z.string().openapi({ description: '打卡 | 留言 | 回應 | 節奏變化' }),
  occurredAt: z.date(),
  member: memberSchema,
  practice: practiceSchema,
  summary: z.string().openapi({ description: '列表摘要：打卡筆記／留言內容／節奏事件描述；打卡無筆記時為心情文案' }),
  hasText: z.boolean(),
  meta: z.record(z.string(), z.unknown()).openapi({ description: '打卡：mood、imageCount、commentCount；留言：isReply、targetCheckinId；節奏：eventType、basisMetrics' })
});

export const cohortActivityStatsSchema = z.object({
  checkins: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  rhythm: z.number().int().nonnegative(),
  total: z.number().int().nonnegative()
});

export const cohortActivityResponseSchema = z.object({
  range: z.object({
    from: z.string(), to: z.string(),
    min: z.string().openapi({ description: '可選的最早日期（今天往前 6 天）' }),
    max: z.string().openapi({ description: '可選的最晚日期（今天）' }),
    timezone: z.string()
  }),
  filters: z.object({ type: z.enum(ACTIVITY_TYPES).nullable(), practiceTitle: z.string().nullable(), q: z.string().nullable(), hasText: z.boolean() }),
  practices: z.array(z.object({ title: z.string() })).openapi({ description: '實踐篩選選項（本場次實踐名稱）' }),
  stats: cohortActivityStatsSchema.openapi({ description: '四張統計卡，與 items 套用同一組篩選' }),
  total: z.number().int().nonnegative().openapi({ description: '符合篩選的總筆數（= stats.total）' }),
  items: z.array(cohortActivityItemSchema)
});

export const cohortActivityDetailSchema = cohortActivityItemSchema.extend({
  detail: z.string().nullable().openapi({ description: '詳細內容：打卡完整筆記／留言全文／節奏事件說明' }),
  images: z.array(z.string()).openapi({ description: '打卡圖片' }),
  target: z.object({ checkinId: z.number().int(), summary: z.string(), occurredAt: z.date() }).nullable().openapi({ description: '留言／回應所屬的打卡' })
});

export type CohortActivityQuery = z.infer<typeof cohortActivityQuerySchema>;
export type CohortActivityItem = z.infer<typeof cohortActivityItemSchema>;
export type CohortActivityResponse = z.infer<typeof cohortActivityResponseSchema>;
export type CohortActivityDetail = z.infer<typeof cohortActivityDetailSchema>;
