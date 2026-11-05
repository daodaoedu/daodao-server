import { ForbiddenError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

/** 值得慶祝的時刻（FR-TF-03）：enum → 顯示文案由後端定，前端不必各自翻譯 */
export const CELEBRATION_MOMENTS = {
  first_checkin: '首次打卡',
  return_after_break: '暫停幾天後又回來了',
  month_milestone: '持續參與滿一個月'
} as const;
export type CelebrationMoment = keyof typeof CELEBRATION_MOMENTS;

/**
 * 今日焦點（FRD 3.5）：兩張表都以「參與者 × 實踐」為列，實踐欄可點開該參與者該實踐的打卡紀錄；
 * messageCount 讓「訊息紀錄」欄能顯示已往來幾則，沒有就顯示「尚未送出」
 */
const get = async (programId: number, cohortId: number, actorId: number, now = new Date()) => {
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, program: { organization: { status: 'active', organization_members: { some: { user_id: actorId } } } } }, select: { id: true } });
  if (!cohort) throw new ForbiddenError('無權限查看此場次焦點');
  const [needs, celebrations, messageRows] = await Promise.all([
    prisma.$queryRaw<Array<{ user_id: number; nickname: string | null; avatar: string | null; practice_id: number; practice_title: string; last_at: Date; last_date: Date; preview: string | null; interrupted_days: number }>>`
      SELECT p.user_id, u.nickname, c.photo_url AS avatar, p.id AS practice_id, COALESCE(pt.title, p.title) AS practice_title,
             MAX(pc.created_at) AS last_at, MAX(pc.checkin_date) AS last_date,
             (ARRAY_AGG(pc.note ORDER BY pc.created_at DESC))[1] AS preview,
             FLOOR(EXTRACT(EPOCH FROM (${now} - MAX(pc.created_at))) / 86400)::int AS interrupted_days
      FROM practices p
      JOIN practice_checkins pc ON pc.practice_id = p.id
      JOIN users u ON u.id = p.user_id
      LEFT JOIN contacts c ON c.id = u.contact_id
      LEFT JOIN practice_templates pt ON pt.id = p.template_id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      GROUP BY p.user_id, u.nickname, c.photo_url, p.id, COALESCE(pt.title, p.title)
      HAVING MAX(pc.created_at) < ${now} - INTERVAL '3 days'
      ORDER BY last_at ASC
    `,
    prisma.$queryRaw<Array<{ user_id: number; nickname: string | null; avatar: string | null; practice_id: number; practice_title: string; moment: CelebrationMoment; occurred_at: Date; first_at: Date }>>`
      WITH activity AS (
        SELECT p.user_id, p.id AS practice_id, COALESCE(pt.title, p.title) AS practice_title, pc.created_at,
               LAG(pc.created_at) OVER (PARTITION BY p.id ORDER BY pc.created_at) AS previous_at,
               COUNT(*) OVER (PARTITION BY p.id) AS total_count,
               MIN(pc.created_at) OVER (PARTITION BY p.id) AS first_at,
               MAX(pc.created_at) OVER (PARTITION BY p.id) AS latest_at
        FROM practices p JOIN practice_checkins pc ON pc.practice_id = p.id
        LEFT JOIN practice_templates pt ON pt.id = p.template_id
        WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      ), moments AS (
        SELECT DISTINCT ON (practice_id, moment) user_id, practice_id, practice_title, moment, occurred_at, first_at FROM (
          SELECT user_id, practice_id, practice_title, 'first_checkin'::text AS moment, first_at AS occurred_at, first_at FROM activity WHERE total_count = 1
          UNION ALL
          SELECT user_id, practice_id, practice_title, 'return_after_break', created_at, first_at FROM activity WHERE previous_at IS NOT NULL AND created_at - previous_at >= INTERVAL '3 days' AND created_at >= ${now} - INTERVAL '1 day'
          UNION ALL
          SELECT user_id, practice_id, practice_title, 'month_milestone', latest_at, first_at FROM activity WHERE first_at <= ${now} - INTERVAL '30 days' AND latest_at >= ${now} - INTERVAL '1 day'
        ) x ORDER BY practice_id, moment, occurred_at DESC
      )
      SELECT m.user_id, u.nickname, c.photo_url AS avatar, m.practice_id, m.practice_title, m.moment, m.occurred_at, m.first_at
      FROM moments m JOIN users u ON u.id = m.user_id LEFT JOIN contacts c ON c.id = u.contact_id
      ORDER BY m.occurred_at DESC
    `,
    prisma.cohort_messages.groupBy({ by: ['recipient_user_id'], where: { cohort_id: cohortId, recipient_user_id: { not: null } }, _count: { id: true } })
  ]);
  const messageCount = new Map(messageRows.map(row => [row.recipient_user_id, row._count.id]));
  return {
    needsEncouragement: needs.map(row => ({
      userId: row.user_id, nickname: row.nickname, avatar: row.avatar,
      practiceId: row.practice_id, practiceTitle: row.practice_title,
      lastCheckinAt: row.last_at, lastCheckinDate: row.last_date, lastCheckinPreview: row.preview, interruptedDays: row.interrupted_days,
      messageCount: messageCount.get(row.user_id) ?? 0
    })),
    celebrations: celebrations.map(row => ({
      userId: row.user_id, nickname: row.nickname, avatar: row.avatar,
      practiceId: row.practice_id, practiceTitle: row.practice_title,
      moment: row.moment, momentDescription: CELEBRATION_MOMENTS[row.moment], occurredAt: row.occurred_at, firstCheckinAt: row.first_at,
      messageCount: messageCount.get(row.user_id) ?? 0
    }))
  };
};
export const cohortFocusService = { get };
