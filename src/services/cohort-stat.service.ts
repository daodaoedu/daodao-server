import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';

export interface CohortMetrics {
  enrolled: number;
  activated: number;
  checkins: number;
  active_members: number;
  top_tags: Array<{ tag: string; count: number }>;
  exited: number;
  hour_histogram: Record<string, number>;
  daily_heatmap: Record<string, number>;
  blocker_moods: Record<string, number>;
  completed_members: number;
  sustained_members: number;
}

const count = (value: bigint | number | undefined): number => Number(value ?? 0);

export const computeCohortMetrics = async (cohortId: number, periodStart: Date, periodEnd: Date): Promise<CohortMetrics> => {
  const [enrollmentRows, practiceRows, checkinRows, tagRows, hourRows, dailyRows, blockerRows, outcomeRows] = await Promise.all([
    prisma.$queryRaw<Array<{ enrolled: bigint; exited: bigint }>>`
      SELECT COUNT(*) FILTER (WHERE status IN ('joined','exited'))::bigint AS enrolled,
             COUNT(*) FILTER (WHERE status = 'exited')::bigint AS exited
      FROM cohort_enrollments WHERE cohort_id = ${cohortId}
    `,
    prisma.$queryRaw<Array<{ activated: bigint }>>`
      SELECT COUNT(DISTINCT user_id)::bigint AS activated
      FROM practices WHERE cohort_id = ${cohortId} AND deleted_at IS NULL AND status <> 'draft'
    `,
    prisma.$queryRaw<Array<{ checkins: bigint; active_members: bigint }>>`
      SELECT COUNT(pc.id)::bigint AS checkins, COUNT(DISTINCT p.user_id)::bigint AS active_members
      FROM practices p JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
        AND pc.created_at >= ${periodStart} AND pc.created_at < ${periodEnd}
    `,
    prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT t.name AS tag, COUNT(*)::bigint AS count
      FROM practices p JOIN entity_tags et ON et.entity_type = 'practice' AND et.entity_id = p.id
      JOIN tags t ON t.id = et.tag_id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      GROUP BY t.name ORDER BY count DESC, t.name ASC LIMIT 10
    `,
    prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT EXTRACT(HOUR FROM pc.created_at AT TIME ZONE 'Asia/Taipei')::int AS hour, COUNT(*)::bigint AS count
      FROM practices p JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
        AND pc.created_at >= ${periodStart} AND pc.created_at < ${periodEnd}
      GROUP BY hour ORDER BY hour
    `,
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT pc.checkin_date AS day, COUNT(*)::bigint AS count
      FROM practices p JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
        AND pc.created_at >= ${periodStart} AND pc.created_at < ${periodEnd}
      GROUP BY pc.checkin_date ORDER BY pc.checkin_date
    `,
    prisma.$queryRaw<Array<{ mood: string; count: bigint }>>`
      SELECT pc.mood, COUNT(*)::bigint AS count
      FROM practices p JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
        AND pc.created_at >= ${periodStart} AND pc.created_at < ${periodEnd}
        AND pc.mood IN ('give_up','frustrated','bored')
      GROUP BY pc.mood ORDER BY count DESC
    `,
    prisma.$queryRaw<Array<{ completed_members: bigint; sustained_members: bigint }>>`
      WITH member_weeks AS (
        SELECT p.user_id, COUNT(DISTINCT DATE_TRUNC('week', pc.checkin_date)) AS active_weeks
        FROM practices p LEFT JOIN practice_checkins pc ON pc.practice_id = p.id
        WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
        GROUP BY p.user_id
      )
      SELECT COUNT(DISTINCT p.user_id) FILTER (WHERE p.status = 'completed')::bigint AS completed_members,
             (SELECT COUNT(*)::bigint FROM member_weeks WHERE active_weeks >= 2) AS sustained_members
      FROM practices p WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
    `
  ]);
  return {
    enrolled: count(enrollmentRows[0]?.enrolled),
    activated: count(practiceRows[0]?.activated),
    checkins: count(checkinRows[0]?.checkins),
    active_members: count(checkinRows[0]?.active_members),
    top_tags: tagRows.map(row => ({ tag: row.tag, count: count(row.count) })),
    exited: count(enrollmentRows[0]?.exited),
    hour_histogram: Object.fromEntries(hourRows.map(row => [String(row.hour), count(row.count)])),
    daily_heatmap: Object.fromEntries(dailyRows.map(row => [row.day.toISOString().slice(0, 10), count(row.count)])),
    blocker_moods: Object.fromEntries(blockerRows.map(row => [row.mood, count(row.count)])),
    completed_members: count(outcomeRows[0]?.completed_members),
    sustained_members: count(outcomeRows[0]?.sustained_members)
  };
};

export const upsertCohortSnapshot = async (cohortId: number, kind: 'weekly' | 'final', periodStart: Date, periodEnd: Date) => {
  const metrics = await computeCohortMetrics(cohortId, periodStart, periodEnd);
  return prisma.cohort_stat_snapshots.upsert({
    where: { cohort_id_kind_period_start: { cohort_id: cohortId, kind, period_start: periodStart } },
    create: { cohort_id: cohortId, kind, period_start: periodStart, metrics: metrics as unknown as Prisma.InputJsonValue },
    update: { metrics: metrics as unknown as Prisma.InputJsonValue, computed_at: new Date() }
  });
};

export const startOfWeekUtc = (now: Date): Date => {
  const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const offset = (value.getUTCDay() + 6) % 7;
  value.setUTCDate(value.getUTCDate() - offset);
  return value;
};
