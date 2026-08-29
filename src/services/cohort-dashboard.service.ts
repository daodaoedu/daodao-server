import { Prisma } from '../../generated/prisma';
import { ForbiddenError } from '../middleware/error.middleware';
import type { CohortDashboardQuery, CohortParticipantsQuery } from '../validators/cohort-dashboard.validators';
import { prisma } from './database/prisma.service';
import { startOfWeekUtc } from './cohort-stat.service';

/**
 * 儀表板改走即時查詢（FRD 3.3）：所有區塊都吃「實踐篩選 × 日期範圍」，
 * 每週 JSON 快照（cohort_stat_snapshots）只留給排程與成果頁使用。
 *
 * 實踐維度以「實踐名稱」分組——場次內每位學員各有一列 practices，
 * 同一模板產生的實踐共用標題，自行建立的實踐（template_id NULL）也能被納入。
 */

const count = (value: bigint | number | undefined | null): number => Number(value ?? 0);
const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const utcDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const addDays = (value: Date, days: number): Date => new Date(value.getTime() + days * 86_400_000);
const MOODS = ['happy', 'good', 'neutral', 'bored', 'frustrated', 'give_up'] as const;
const TREND_DAYS = 14;

type Range = { from: Date; to: Date };
type Scope = { cohortId: number; practiceTitle: string | null; range: Range };

const assertCoach = async (programId: number, cohortId: number, actorId: number) => {
  const cohort = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, program: { organization: { organization_members: { some: { user_id: actorId } } } } },
    select: { id: true, start_date: true, end_date: true }
  });
  if (!cohort) throw new ForbiddenError('無權限查看此場次儀表板');
  return cohort;
};
/** 日期範圍：預設場次起日～今天（不超過場次迄日）；from/to 為含頭含尾的 checkin_date */
const resolveRange = (cohort: { start_date: Date; end_date: Date }, query: { from?: string; to?: string }, now: Date): Range => {
  const today = utcDate(dateOnly(now));
  const from = query.from ? utcDate(query.from) : cohort.start_date;
  const to = query.to ? utcDate(query.to) : (cohort.end_date < today ? cohort.end_date : today);
  return { from, to: to < from ? from : to };
};
/** practices 別名 p 的共同 WHERE：場次、未刪除、（可選）實踐名稱 */
const practiceWhere = (scope: Scope): Prisma.Sql => Prisma.sql`
  p.cohort_id = ${scope.cohortId} AND p.deleted_at IS NULL
  ${scope.practiceTitle === null ? Prisma.empty : Prisma.sql`AND COALESCE(pt.title, p.title) = ${scope.practiceTitle}`}
`;
/** practice_checkins 別名 pc 的日期範圍（含頭含尾） */
const checkinRange = (range: Range): Prisma.Sql => Prisma.sql`pc.checkin_date >= ${range.from}::date AND pc.checkin_date <= ${range.to}::date`;
const practiceJoin = Prisma.sql`practices p LEFT JOIN practice_templates pt ON pt.id = p.template_id`;

const getDashboard = async (programId: number, cohortId: number, actorId: number, query: CohortDashboardQuery, now = new Date()) => {
  const cohort = await assertCoach(programId, cohortId, actorId);
  const range = resolveRange(cohort, query, now);
  const scope: Scope = { cohortId, practiceTitle: query.practiceTitle ?? null, range };
  const weekStart = startOfWeekUtc(now);
  const trendStart = addDays(utcDate(dateOnly(now)), -(TREND_DAYS - 1));
  const thisWeekStart = addDays(utcDate(dateOnly(now)), -6);
  const lastWeekStart = addDays(thisWeekStart, -7);

  const [enrollmentRows, kpiRows, practiceRows, overviewRows, heatRows, tagRows, moodRows, trendRows, hourRows] = await Promise.all([
    prisma.$queryRaw<Array<{ enrolled: bigint }>>`
      SELECT COUNT(*)::bigint AS enrolled FROM cohort_enrollments
      WHERE cohort_id = ${cohortId} AND status = 'joined' AND role = 'member'
    `,
    prisma.$queryRaw<Array<{ activated: bigint; active_this_week: bigint; checkins: bigint }>>`
      SELECT COUNT(DISTINCT p.user_id) FILTER (WHERE pc.id IS NOT NULL)::bigint AS activated,
             COUNT(DISTINCT p.user_id) FILTER (WHERE pc.created_at >= ${weekStart})::bigint AS active_this_week,
             COUNT(pc.id) FILTER (WHERE ${checkinRange(range)})::bigint AS checkins
      FROM ${practiceJoin}
      LEFT JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE ${practiceWhere({ ...scope, range })}
    `,
    prisma.$queryRaw<Array<{ title: string; start_date: Date | null; end_date: Date | null }>>`
      SELECT COALESCE(pt.title, p.title) AS title, MIN(p.start_date) AS start_date, MAX(p.end_date) AS end_date
      FROM ${practiceJoin}
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      GROUP BY 1 ORDER BY MIN(p.created_at), 1
    `,
    prisma.$queryRaw<Array<{ title: string; start_date: Date | null; end_date: Date | null; started: bigint; checkins: bigint; active_days: bigint; participant_days: bigint; avg_length: number | null }>>`
      WITH scoped AS (
        SELECT COALESCE(pt.title, p.title) AS title, p.user_id, p.start_date, p.end_date,
               pc.id AS checkin_id, pc.checkin_date, pc.user_id AS checkin_user_id, LENGTH(COALESCE(pc.note, '')) AS note_length
        FROM ${practiceJoin}
        LEFT JOIN practice_checkins pc ON pc.practice_id = p.id AND ${checkinRange(range)}
        WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      )
      SELECT title, MIN(start_date) AS start_date, MAX(end_date) AS end_date,
             COUNT(DISTINCT user_id) FILTER (WHERE checkin_id IS NOT NULL)::bigint AS started,
             COUNT(checkin_id)::bigint AS checkins,
             COUNT(DISTINCT checkin_date)::bigint AS active_days,
             COUNT(DISTINCT (checkin_user_id, checkin_date))::bigint AS participant_days,
             AVG(note_length) FILTER (WHERE checkin_id IS NOT NULL)::float AS avg_length
      FROM scoped GROUP BY title ORDER BY title
    `,
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT pc.checkin_date AS day, COUNT(*)::bigint AS count
      FROM ${practiceJoin} JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE ${practiceWhere(scope)} AND ${checkinRange(range)}
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT t.name AS tag, COUNT(*)::bigint AS count
      FROM ${practiceJoin}
      JOIN entity_tags et ON et.entity_type = 'practice' AND et.entity_id = p.id
      JOIN tags t ON t.id = et.tag_id
      WHERE ${practiceWhere(scope)}
      GROUP BY t.name ORDER BY count DESC, t.name ASC LIMIT 10
    `,
    prisma.$queryRaw<Array<{ mood: string; count: bigint }>>`
      SELECT pc.mood, COUNT(*)::bigint AS count
      FROM ${practiceJoin} JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE ${practiceWhere(scope)} AND ${checkinRange(range)} AND pc.mood IS NOT NULL
      GROUP BY pc.mood
    `,
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT pc.checkin_date AS day, COUNT(*)::bigint AS count
      FROM ${practiceJoin} JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE ${practiceWhere(scope)} AND pc.checkin_date >= ${lastWeekStart}::date
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT EXTRACT(HOUR FROM pc.created_at AT TIME ZONE 'Asia/Taipei')::int AS hour, COUNT(*)::bigint AS count
      FROM ${practiceJoin} JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE ${practiceWhere(scope)} AND ${checkinRange(range)}
      GROUP BY hour ORDER BY hour
    `
  ]);

  const trendByDay = new Map(trendRows.map(row => [dateOnly(row.day), count(row.count)]));
  const trendDays = Array.from({ length: TREND_DAYS }, (_, index) => { const day = dateOnly(addDays(trendStart, index)); return { date: day, count: trendByDay.get(day) ?? 0 }; });
  const sum = (from: Date, to: Date): number => trendRows.filter(row => row.day >= from && row.day < to).reduce((total, row) => total + count(row.count), 0);
  const thisWeek = sum(thisWeekStart, addDays(thisWeekStart, 7));
  const lastWeek = sum(lastWeekStart, thisWeekStart);
  const moodByKey = new Map(moodRows.map(row => [row.mood, count(row.count)]));

  return {
    computedAt: now,
    range: { from: dateOnly(range.from), to: dateOnly(range.to) },
    practiceTitle: scope.practiceTitle,
    practices: practiceRows.map(row => ({ title: row.title, startDate: row.start_date, endDate: row.end_date })),
    kpi: { enrolled: count(enrollmentRows[0]?.enrolled), activated: count(kpiRows[0]?.activated), activeThisWeek: count(kpiRows[0]?.active_this_week) },
    checkins: count(kpiRows[0]?.checkins),
    practiceOverview: overviewRows.map(row => ({
      title: row.title, startDate: row.start_date, endDate: row.end_date,
      startedCount: count(row.started), checkinCount: count(row.checkins),
      avgCheckinPeople: count(row.active_days) === 0 ? 0 : Math.round((count(row.participant_days) / count(row.active_days)) * 10) / 10,
      avgCheckinLength: Math.round(Number(row.avg_length ?? 0))
    })),
    heatmap: Object.fromEntries(heatRows.map(row => [dateOnly(row.day), count(row.count)])),
    tagDistribution: tagRows.map(row => ({ tag: row.tag, count: count(row.count) })),
    moodDistribution: MOODS.map(mood => ({ mood, count: moodByKey.get(mood) ?? 0 })),
    trend: { days: trendDays, thisWeek, lastWeek, delta: thisWeek - lastWeek },
    hourHistogram: Object.fromEntries(hourRows.map(row => [String(row.hour), count(row.count)]))
  };
};

const PARTICIPANT_SORT: Record<CohortParticipantsQuery['sort'], Prisma.Sql> = {
  nickname: Prisma.sql`nickname`,
  startDate: Prisma.sql`start_date`,
  checkinCount: Prisma.sql`checkin_count`,
  commentCount: Prisma.sql`comment_count`,
  viewCount: Prisma.sql`view_count`,
  reactionCount: Prisma.sql`reaction_count`
};

/** 參與者明細表（FR-DB-09）：一列＝一位參與者 × 一個實踐；四個 count 皆限定在日期範圍內的打卡 */
const listParticipants = async (programId: number, cohortId: number, actorId: number, query: CohortParticipantsQuery, now = new Date()) => {
  const cohort = await assertCoach(programId, cohortId, actorId);
  const range = resolveRange(cohort, query, now);
  const scope: Scope = { cohortId, practiceTitle: query.practiceTitle ?? null, range };
  const search = query.search?.trim() ? `%${query.search.trim()}%` : null;
  const rows = await prisma.$queryRaw<Array<{ user_id: number; nickname: string | null; email: string | null; practice_id: number; practice_title: string; start_date: Date | null; checkin_count: bigint; comment_count: bigint; view_count: number; reaction_count: bigint }>>`
    WITH rows AS (
      SELECT p.user_id, u.nickname, ce.email, p.id AS practice_id, COALESCE(pt.title, p.title) AS practice_title,
             COALESCE(p.start_date, p.first_checkin_at::date) AS start_date,
             (SELECT COUNT(*)::bigint FROM practice_checkins pc WHERE pc.practice_id = p.id AND ${checkinRange(range)}) AS checkin_count,
             (SELECT COUNT(*)::bigint FROM comments c JOIN practice_checkins pc ON pc.id = c.target_id
               WHERE c.target_type = 'checkin' AND pc.practice_id = p.id AND ${checkinRange(range)}) AS comment_count,
             COALESCE((SELECT es.view_count FROM entity_stats es WHERE es.entity_type = 'practice' AND es.entity_id = p.id), 0) AS view_count,
             (SELECT COUNT(*)::bigint FROM reactions r JOIN practice_checkins pc ON pc.id = r.target_id
               WHERE r.target_type = 'checkin' AND pc.practice_id = p.id AND ${checkinRange(range)}) AS reaction_count
      FROM ${practiceJoin}
      JOIN users u ON u.id = p.user_id
      LEFT JOIN cohort_enrollments ce ON ce.cohort_id = p.cohort_id AND ce.user_id = p.user_id
      WHERE ${practiceWhere(scope)}
        ${search === null ? Prisma.empty : Prisma.sql`AND (u.nickname ILIKE ${search} OR ce.email ILIKE ${search})`}
    )
    SELECT * FROM rows
    ORDER BY ${PARTICIPANT_SORT[query.sort]} ${query.order === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`} NULLS LAST, practice_title ASC, user_id ASC
  `;
  return {
    range: { from: dateOnly(range.from), to: dateOnly(range.to) },
    total: rows.length,
    items: rows.map(row => ({
      userId: row.user_id, nickname: row.nickname, email: row.email,
      practiceId: row.practice_id, practiceTitle: row.practice_title, startDate: row.start_date,
      checkinCount: count(row.checkin_count), commentCount: count(row.comment_count), viewCount: count(row.view_count), reactionCount: count(row.reaction_count)
    }))
  };
};
export const cohortDashboardService = { get: getDashboard, listParticipants };
