import { z } from 'zod';
import '../config/openapi-registry';
/** 每週／期末快照的 metrics JSON 形狀（cohort_stat_snapshots.metrics），供排程與成果頁使用 */
export const cohortMetricsSchema = z.object({
  enrolled: z.number().int().nonnegative(), activated: z.number().int().nonnegative(), checkins: z.number().int().nonnegative(), active_members: z.number().int().nonnegative(),
  top_tags: z.array(z.object({ tag: z.string(), count: z.number().int().nonnegative() })), exited: z.number().int().nonnegative(),
  hour_histogram: z.record(z.string(), z.number().int().nonnegative()), daily_heatmap: z.record(z.string(), z.number().int().nonnegative()),
  blocker_moods: z.record(z.string(), z.number().int().nonnegative()), completed_members: z.number().int().nonnegative(), sustained_members: z.number().int().nonnegative()
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD');
const dateRangeQuery = {
  practiceTitle: z.string().trim().min(1).max(100).optional().openapi({ description: '只看這個實踐（以實踐名稱分組）；不帶＝全部實踐', example: '每天寫下一件小事' }),
  from: dateSchema.optional().openapi({ description: '打卡日期範圍起（含），預設場次開始日', example: '2026-02-10' }),
  to: dateSchema.optional().openapi({ description: '打卡日期範圍迄（含），預設今天或場次結束日', example: '2026-03-11' })
};
export const cohortDashboardQuerySchema = z.object(dateRangeQuery).refine(value => !value.from || !value.to || value.from <= value.to, { message: '起始日不可晚於結束日', path: ['to'] });
export const cohortParticipantsQuerySchema = z.object({
  ...dateRangeQuery,
  search: z.string().trim().max(100).optional().openapi({ description: '姓名或 email 模糊搜尋', example: '林' }),
  sort: z.enum(['nickname', 'startDate', 'checkinCount', 'commentCount', 'viewCount', 'reactionCount']).default('nickname').openapi({ description: '排序欄位' }),
  order: z.enum(['asc', 'desc']).default('asc')
}).refine(value => !value.from || !value.to || value.from <= value.to, { message: '起始日不可晚於結束日', path: ['to'] });

const nonNegative = z.number().int().nonnegative();
export const cohortDashboardResponseSchema = z.object({
  computedAt: z.date(),
  range: z.object({ from: dateSchema, to: dateSchema }),
  practiceTitle: z.string().nullable().openapi({ description: '目前套用的實踐篩選；null＝全部實踐' }),
  practices: z.array(z.object({ title: z.string(), startDate: z.date().nullable(), endDate: z.date().nullable() })).openapi({ description: '實踐篩選 chip 列（FR-DB-01）' }),
  kpi: z.object({
    enrolled: nonNegative.openapi({ description: '已加入' }),
    activated: nonNegative.openapi({ description: '已開始：至少一則打卡的參與者數' }),
    activeThisWeek: nonNegative.openapi({ description: '持續行動中（本週）' })
  }),
  checkins: nonNegative.openapi({ description: '範圍內打卡總數' }),
  practiceOverview: z.array(z.object({
    title: z.string(), startDate: z.date().nullable(), endDate: z.date().nullable(),
    startedCount: nonNegative, checkinCount: nonNegative,
    avgCheckinPeople: z.number().nonnegative().openapi({ description: '有打卡的日子裡，平均每天打卡人數' }),
    avgCheckinLength: nonNegative.openapi({ description: '平均打卡字數' })
  })).openapi({ description: '實踐總覽表（FR-DB-03），不受 practiceTitle 影響' }),
  heatmap: z.record(z.string(), nonNegative).openapi({ description: '每日打卡數（FR-DB-04），key 為 YYYY-MM-DD' }),
  tagDistribution: z.array(z.object({ tag: z.string(), count: nonNegative })),
  moodDistribution: z.array(z.object({ mood: z.enum(['happy', 'good', 'neutral', 'bored', 'frustrated', 'give_up']), count: nonNegative })),
  trend: z.object({
    days: z.array(z.object({ date: dateSchema, count: nonNegative })).openapi({ description: '近 14 天逐日打卡數' }),
    thisWeek: nonNegative, lastWeek: nonNegative, delta: z.number().int()
  }),
  hourHistogram: z.record(z.string(), nonNegative).openapi({ description: '24 小時制打卡時段（Asia/Taipei）' })
});
export const cohortParticipantsResponseSchema = z.object({
  range: z.object({ from: dateSchema, to: dateSchema }),
  total: nonNegative,
  items: z.array(z.object({
    userId: z.number().int(), nickname: z.string().nullable(), email: z.string().nullable(),
    practiceId: z.number().int(), practiceTitle: z.string(), startDate: z.date().nullable(),
    checkinCount: nonNegative, commentCount: nonNegative, viewCount: nonNegative, reactionCount: nonNegative
  }))
});
export type CohortDashboardQuery = z.infer<typeof cohortDashboardQuerySchema>;
export type CohortParticipantsQuery = z.infer<typeof cohortParticipantsQuerySchema>;
