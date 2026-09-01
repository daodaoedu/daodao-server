import { z } from 'zod';
export const cohortMetricsSchema = z.object({
  enrolled: z.number().int().nonnegative(), activated: z.number().int().nonnegative(), checkins: z.number().int().nonnegative(), active_members: z.number().int().nonnegative(),
  top_tags: z.array(z.object({ tag: z.string(), count: z.number().int().nonnegative() })), exited: z.number().int().nonnegative(),
  hour_histogram: z.record(z.string(), z.number().int().nonnegative()), daily_heatmap: z.record(z.string(), z.number().int().nonnegative()),
  blocker_moods: z.record(z.string(), z.number().int().nonnegative()), completed_members: z.number().int().nonnegative(), sustained_members: z.number().int().nonnegative()
});
export const cohortDashboardResponseSchema = z.object({
  snapshotKind: z.enum(['weekly', 'realtime']), computedAt: z.date(),
  rhythmHeatmap: z.record(z.string(), z.number()), tagDistribution: z.array(z.object({ tag: z.string(), count: z.number() })),
  commonBlockers: z.record(z.string(), z.number()), funnel: z.object({ enrolled: z.number(), activated: z.number(), activeMembers: z.number() }),
  timeRhythm: z.record(z.string(), z.number()), checkins: z.number(), exited: z.number()
});
