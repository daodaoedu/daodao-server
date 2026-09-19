import { Prisma } from '../../generated/prisma';
import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import type { ActivityType, CohortActivityDetail, CohortActivityItem, CohortActivityQuery, CohortActivityResponse, RhythmEventType } from '../validators/cohort-activity.validators';
import { APP_TIMEZONE } from './cohort-run-state';
import { prisma } from './database/prisma.service';

/**
 * 場次「動態」（FRD frd-activity-outcome-org.md §3.1）：打卡、留言／回應、節奏變化三類事件合併成一條動態，
 * 四張統計卡與列表共用同一組 WHERE（FR-ACT-02），最近 7 天以組織時區為基準（FR-ACT-03）。
 *
 * 節奏事件不落表、即時從打卡序列推導（task.md 實作預設）：
 * - first_checkin：該實踐第一則打卡
 * - quiet：兩則打卡間隔 ≥3 天，事件時間＝前一則 + 3 天；最後一則打卡後至今 ≥3 天也算一筆（進行中的安靜）
 * - return_after_break：間隔 ≥3 天後的那則打卡
 * - month_milestone：首打卡滿 30 天且之後仍有打卡，事件時間＝首打卡 + 30 天
 * 事件 id 合成為 `<event_type>:<practiceId>:<YYYYMMDD>`，同一天同類型只算一筆。
 */

const QUIET_DAYS = 3;
const MILESTONE_DAYS = 30;
const RANGE_DAYS = 7;

const TYPE_LABELS: Record<ActivityType, string> = { checkin: '打卡', comment: '留言', rhythm: '節奏變化' };
const REPLY_LABEL = '回應';
const MOOD_LABELS: Record<string, string> = { give_up: '想放棄', frustrated: '有點挫折', bored: '有點無聊', neutral: '平常心', good: '不錯', happy: '很開心' };
const RHYTHM_LABELS: Record<RhythmEventType, string> = { first_checkin: '首次打卡', quiet: `安靜了 ${QUIET_DAYS} 天以上`, return_after_break: '暫停幾天後又回來了', month_milestone: '持續參與滿一個月' };

type Row = {
  type: ActivityType; id: string; occurred_at: Date; user_id: number; nickname: string | null; avatar: string | null;
  practice_id: number; practice_title: string; summary: string | null; has_text: boolean; detail: string | null;
  meta: Record<string, unknown> | null;
};

const dayFormatter = (timezone: string): Intl.DateTimeFormat => new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
const calendarDay = (value: Date, timezone: string): string => dayFormatter(timezone).format(value);
const shiftDay = (day: string, days: number): string => {
  const base = new Date(`${day}T00:00:00.000Z`);
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
};
const clampDay = (value: string, min: string, max: string): string => (value < min ? min : value > max ? max : value);

/** 最近 7 天：以組織時區的今天為 max、往前 6 天為 min；使用者給的區間夾回範圍、反向自動對調（FR-ACT-03、TP-ACT-02） */
const resolveRange = (query: { from?: string; to?: string }, timezone: string, now: Date): { from: string; to: string; min: string; max: string } => {
  const max = calendarDay(now, timezone);
  const min = shiftDay(max, -(RANGE_DAYS - 1));
  let from = clampDay(query.from ?? min, min, max);
  let to = clampDay(query.to ?? max, min, max);
  if (from > to) [from, to] = [to, from];
  return { from, to, min, max };
};

const assertCohort = async (programId: number, cohortId: number, actorId: number) => {
  const cohort = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, deleted_at: null },
    select: { id: true, program: { select: { organization: { select: { timezone: true, organization_members: { where: { user_id: actorId }, select: { id: true } } } } } } }
  });
  if (!cohort) throw new NotFoundError('找不到場次');
  if (cohort.program.organization.organization_members.length === 0) throw new ForbiddenError('無權限查看此場次動態');
  return { timezone: cohort.program.organization.timezone || APP_TIMEZONE };
};

/**
 * 三類事件的 UNION CTE。每段輸出同一組欄位：
 * type, id(text), occurred_at, user_id, nickname, avatar, practice_id, practice_title, summary, has_text, detail, meta(jsonb)
 */
const eventsCte = (cohortId: number, practiceTitle: string | null, now: Date): Prisma.Sql => {
  const practiceFilter = practiceTitle === null ? Prisma.empty : Prisma.sql`AND COALESCE(pt.title, p.title) = ${practiceTitle}`;
  return Prisma.sql`
    scoped_practices AS (
      SELECT p.id, p.user_id, COALESCE(pt.title, p.title) AS title
      FROM practices p LEFT JOIN practice_templates pt ON pt.id = p.template_id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL ${practiceFilter}
    ),
    checkin_rows AS (
      SELECT pc.id, pc.practice_id, sp.user_id, sp.title, pc.created_at, pc.note, pc.mood, pc.image_urls,
             LAG(pc.created_at) OVER (PARTITION BY pc.practice_id ORDER BY pc.created_at, pc.id) AS previous_at,
             COUNT(*) OVER (PARTITION BY pc.practice_id) AS total_count,
             MIN(pc.created_at) OVER (PARTITION BY pc.practice_id) AS first_at,
             MAX(pc.created_at) OVER (PARTITION BY pc.practice_id) AS latest_at,
             ROW_NUMBER() OVER (PARTITION BY pc.practice_id ORDER BY pc.created_at, pc.id) AS seq
      FROM practice_checkins pc JOIN scoped_practices sp ON sp.id = pc.practice_id
      WHERE pc.created_at IS NOT NULL
    ),
    events AS (
      -- 打卡
      SELECT 'checkin'::text AS type, cr.id::text AS id, cr.created_at AS occurred_at, cr.user_id, cr.practice_id, cr.title AS practice_title,
             NULLIF(BTRIM(cr.note), '') AS summary, (NULLIF(BTRIM(cr.note), '') IS NOT NULL) AS has_text, cr.note AS detail,
             jsonb_build_object('mood', cr.mood, 'imageCount', COALESCE(array_length(cr.image_urls, 1), 0),
               'commentCount', (SELECT COUNT(*) FROM comments c WHERE c.target_type = 'checkin' AND c.target_id = cr.id)) AS meta
      FROM checkin_rows cr
      UNION ALL
      -- 留言與回應（打卡底下的 comments；parent_id 有值＝回應）
      SELECT 'comment', c.id::text, c.created_at, c.user_id, cr.practice_id, cr.title,
             NULLIF(BTRIM(c.content), ''), TRUE, c.content,
             jsonb_build_object('isReply', c.parent_id IS NOT NULL, 'targetCheckinId', cr.id, 'visibility', c.visibility)
      FROM comments c JOIN checkin_rows cr ON cr.id = c.target_id
      WHERE c.target_type = 'checkin' AND c.created_at IS NOT NULL
      UNION ALL
      -- 節奏變化：首次打卡
      SELECT 'rhythm', 'first_checkin:' || cr.practice_id || ':' || to_char(cr.created_at, 'YYYYMMDD'), cr.created_at, cr.user_id, cr.practice_id, cr.title,
             NULL, FALSE, NULL,
             jsonb_build_object('eventType', 'first_checkin', 'basisMetrics', jsonb_build_object('first_checkin_at', cr.created_at))
      FROM checkin_rows cr WHERE cr.seq = 1
      UNION ALL
      -- 節奏變化：間隔 ≥ N 天後回歸
      SELECT 'rhythm', 'return_after_break:' || cr.practice_id || ':' || to_char(cr.created_at, 'YYYYMMDD'), cr.created_at, cr.user_id, cr.practice_id, cr.title,
             NULL, FALSE, NULL,
             jsonb_build_object('eventType', 'return_after_break', 'basisMetrics', jsonb_build_object('quiet_days', FLOOR(EXTRACT(EPOCH FROM (cr.created_at - cr.previous_at)) / 86400), 'last_checkin_at', cr.previous_at))
      FROM checkin_rows cr WHERE cr.previous_at IS NOT NULL AND cr.created_at - cr.previous_at >= make_interval(days => ${QUIET_DAYS}::int)
      UNION ALL
      -- 節奏變化：安靜下來（前一則 + N 天）——兩則之間的空檔
      SELECT 'rhythm', 'quiet:' || cr.practice_id || ':' || to_char(cr.previous_at + make_interval(days => ${QUIET_DAYS}::int), 'YYYYMMDD'), cr.previous_at + make_interval(days => ${QUIET_DAYS}::int), cr.user_id, cr.practice_id, cr.title,
             NULL, FALSE, NULL,
             jsonb_build_object('eventType', 'quiet', 'basisMetrics', jsonb_build_object('quiet_days', FLOOR(EXTRACT(EPOCH FROM (cr.created_at - cr.previous_at)) / 86400), 'last_checkin_at', cr.previous_at, 'resumed', TRUE))
      FROM checkin_rows cr WHERE cr.previous_at IS NOT NULL AND cr.created_at - cr.previous_at >= make_interval(days => ${QUIET_DAYS}::int)
      UNION ALL
      -- 節奏變化：最後一則打卡之後安靜至今
      SELECT 'rhythm', 'quiet:' || cr.practice_id || ':' || to_char(cr.latest_at + make_interval(days => ${QUIET_DAYS}::int), 'YYYYMMDD'), cr.latest_at + make_interval(days => ${QUIET_DAYS}::int), cr.user_id, cr.practice_id, cr.title,
             NULL, FALSE, NULL,
             jsonb_build_object('eventType', 'quiet', 'basisMetrics', jsonb_build_object('quiet_days', FLOOR(EXTRACT(EPOCH FROM (${now}::timestamptz - cr.latest_at)) / 86400), 'last_checkin_at', cr.latest_at, 'resumed', FALSE))
      FROM checkin_rows cr WHERE cr.created_at = cr.latest_at AND cr.latest_at + make_interval(days => ${QUIET_DAYS}::int) <= ${now}::timestamptz
      UNION ALL
      -- 節奏變化：持續參與滿一個月
      SELECT 'rhythm', 'month_milestone:' || cr.practice_id || ':' || to_char(cr.first_at + make_interval(days => ${MILESTONE_DAYS}::int), 'YYYYMMDD'), cr.first_at + make_interval(days => ${MILESTONE_DAYS}::int), cr.user_id, cr.practice_id, cr.title,
             NULL, FALSE, NULL,
             jsonb_build_object('eventType', 'month_milestone', 'basisMetrics', jsonb_build_object('first_checkin_at', cr.first_at, 'last_checkin_at', cr.latest_at, 'checkin_count', cr.total_count))
      FROM checkin_rows cr WHERE cr.seq = 1 AND cr.latest_at >= cr.first_at + make_interval(days => ${MILESTONE_DAYS}::int)
    ),
    enriched AS (
      SELECT DISTINCT ON (e.type, e.id) e.*, u.nickname, ct.photo_url AS avatar
      FROM events e JOIN users u ON u.id = e.user_id LEFT JOIN contacts ct ON ct.id = u.contact_id
      ORDER BY e.type, e.id
    )
  `;
};

const rhythmSummary = (meta: Record<string, unknown> | null): string => {
  const eventType = (meta?.eventType as RhythmEventType | undefined) ?? 'first_checkin';
  const basis = (meta?.basisMetrics as Record<string, unknown> | undefined) ?? {};
  if (eventType === 'quiet') {
    const days = Number(basis.quiet_days ?? QUIET_DAYS);
    return basis.resumed ? `安靜了 ${days} 天` : `已安靜 ${days} 天`;
  }
  if (eventType === 'return_after_break') return `暫停 ${Number(basis.quiet_days ?? QUIET_DAYS)} 天後又回來了`;
  return RHYTHM_LABELS[eventType] ?? RHYTHM_LABELS.first_checkin;
};

const checkinSummary = (row: Row): string => {
  if (row.summary) return row.summary;
  const mood = row.meta?.mood as string | undefined;
  const moodLabel = mood ? MOOD_LABELS[mood] ?? mood : null;
  const images = Number(row.meta?.imageCount ?? 0);
  if (moodLabel && images > 0) return `（未寫筆記，心情：${moodLabel}，${images} 張圖片）`;
  if (moodLabel) return `（未寫筆記，心情：${moodLabel}）`;
  if (images > 0) return `（未寫筆記，${images} 張圖片）`;
  return '（未寫筆記）';
};

const typeLabel = (row: Row): string => (row.type === 'comment' && row.meta?.isReply ? REPLY_LABEL : TYPE_LABELS[row.type]);

const toItem = (row: Row): CohortActivityItem => ({
  id: row.id, type: row.type, typeLabel: typeLabel(row), occurredAt: row.occurred_at,
  member: { userId: row.user_id, nickname: row.nickname, avatar: row.avatar },
  practice: { id: row.practice_id, title: row.practice_title },
  summary: row.type === 'rhythm' ? rhythmSummary(row.meta) : row.type === 'checkin' ? checkinSummary(row) : (row.summary ?? ''),
  hasText: row.has_text,
  meta: row.meta ?? {}
});

/** 關鍵字：成員、實踐、摘要、meta（心情文案）與類型文案，不比對 detail（FR-ACT-04 原型行為） */
const matchesKeyword = (item: CohortActivityItem, keyword: string): boolean => {
  const mood = item.meta.mood as string | undefined;
  const eventType = item.meta.eventType as RhythmEventType | undefined;
  const haystack = [
    item.member.nickname ?? '', item.practice.title, item.summary, item.typeLabel,
    mood ? MOOD_LABELS[mood] ?? mood : '', eventType ? RHYTHM_LABELS[eventType] : ''
  ].join('\n').toLowerCase();
  return haystack.includes(keyword);
};

const list = async (programId: number, cohortId: number, actorId: number, query: CohortActivityQuery, now = new Date()): Promise<CohortActivityResponse> => {
  const { timezone } = await assertCohort(programId, cohortId, actorId);
  const range = resolveRange(query, timezone, now);
  const practiceTitle = query.practiceTitle ?? null;
  const type = query.type ?? null;
  const keyword = query.q?.trim().toLowerCase() || null;
  const rangeWhere = Prisma.sql`
    e.occurred_at >= (${range.from}::date::timestamp AT TIME ZONE ${timezone})
    AND e.occurred_at < ((${range.to}::date + 1)::timestamp AT TIME ZONE ${timezone})
    AND e.occurred_at <= ${now}::timestamptz
    ${type === null ? Prisma.empty : Prisma.sql`AND e.type = ${type}`}
    ${query.hasText ? Prisma.sql`AND e.has_text` : Prisma.empty}
  `;
  const [rows, practiceRows] = await Promise.all([
    prisma.$queryRaw<Row[]>(Prisma.sql`
      WITH ${eventsCte(cohortId, practiceTitle, now)}
      SELECT e.* FROM enriched e
      WHERE ${rangeWhere}
      ORDER BY e.occurred_at DESC, e.type, e.id DESC
    `),
    prisma.$queryRaw<Array<{ title: string }>>(Prisma.sql`
      SELECT COALESCE(pt.title, p.title) AS title
      FROM practices p LEFT JOIN practice_templates pt ON pt.id = p.template_id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      GROUP BY 1 ORDER BY MIN(p.created_at), 1
    `)
  ]);
  // 關鍵字比對牽涉後端組出來的文案（心情、類型），在應用層做；一場次 7 天的動態量在千筆等級，可承受
  const all = rows.map(toItem).filter(item => (keyword === null ? true : matchesKeyword(item, keyword)));
  const stats = {
    checkins: all.filter(item => item.type === 'checkin').length,
    comments: all.filter(item => item.type === 'comment').length,
    rhythm: all.filter(item => item.type === 'rhythm').length,
    total: all.length
  };
  return {
    range: { from: range.from, to: range.to, min: range.min, max: range.max, timezone },
    filters: { type, practiceTitle, q: query.q?.trim() || null, hasText: query.hasText },
    practices: practiceRows.map(row => ({ title: row.title })),
    stats,
    total: all.length,
    items: all.slice(query.offset, query.offset + query.limit)
  };
};

/** 單筆明細（FR-ACT-07）：直接用同一個 CTE 撈該 (type, id)，確保跟列表同源 */
const get = async (programId: number, cohortId: number, actorId: number, type: ActivityType, activityId: string, now = new Date()): Promise<CohortActivityDetail> => {
  await assertCohort(programId, cohortId, actorId);
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    WITH ${eventsCte(cohortId, null, now)}
    SELECT e.* FROM enriched e WHERE e.type = ${type} AND e.id = ${activityId} LIMIT 1
  `);
  const row = rows[0];
  if (!row) throw new NotFoundError('找不到這筆動態');
  const item = toItem(row);
  let images: string[] = [];
  let target: CohortActivityDetail['target'] = null;
  if (type === 'checkin') {
    const checkin = await prisma.practice_checkins.findUnique({ where: { id: Number(activityId) }, select: { image_urls: true } });
    images = checkin?.image_urls ?? [];
  }
  if (type === 'comment') {
    const targetId = Number(row.meta?.targetCheckinId);
    const checkin = Number.isFinite(targetId) ? await prisma.practice_checkins.findUnique({ where: { id: targetId }, select: { id: true, note: true, mood: true, created_at: true } }) : null;
    if (checkin) {
      const mood = checkin.mood ? MOOD_LABELS[checkin.mood] ?? checkin.mood : null;
      target = { checkinId: checkin.id, summary: checkin.note?.trim() || (mood ? `（未寫筆記，心情：${mood}）` : '（未寫筆記）'), occurredAt: checkin.created_at ?? row.occurred_at };
    }
  }
  const detail = type === 'rhythm' ? `${item.summary}（${item.practice.title}）` : row.detail;
  return { ...item, detail: detail ?? null, images, target };
};

export const cohortActivityService = { list, get, resolveRange };
