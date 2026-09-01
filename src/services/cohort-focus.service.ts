import { ForbiddenError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

const get = async (programId: number, cohortId: number, actorId: number, now = new Date()) => {
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, program: { organization: { organization_members: { some: { user_id: actorId } } } } }, select: { id: true } });
  if (!cohort) throw new ForbiddenError('無權限查看此期焦點');
  const [needs, celebrations] = await Promise.all([
    prisma.$queryRaw<Array<{ user_id: number; nickname: string | null; avatar: string | null; last_at: Date; preview: string | null; interrupted_days: number }>>`
      SELECT p.user_id, u.nickname, c.photo_url AS avatar,
             MAX(pc.created_at) AS last_at,
             (ARRAY_AGG(pc.note ORDER BY pc.created_at DESC))[1] AS preview,
             FLOOR(EXTRACT(EPOCH FROM (${now} - MAX(pc.created_at))) / 86400)::int AS interrupted_days
      FROM practices p
      JOIN practice_checkins pc ON pc.practice_id = p.id
      JOIN users u ON u.id = p.user_id
      LEFT JOIN contacts c ON c.id = u.contact_id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      GROUP BY p.user_id, u.nickname, c.photo_url
      HAVING MAX(pc.created_at) < ${now} - INTERVAL '3 days'
      ORDER BY last_at ASC
    `,
    prisma.$queryRaw<Array<{ user_id: number; nickname: string | null; avatar: string | null; moment: 'first_checkin' | 'return_after_break' | 'month_milestone'; occurred_at: Date }>>`
      WITH activity AS (
        SELECT p.user_id, pc.created_at,
               LAG(pc.created_at) OVER (PARTITION BY p.user_id ORDER BY pc.created_at) AS previous_at,
               COUNT(*) OVER (PARTITION BY p.user_id) AS total_count,
               MIN(pc.created_at) OVER (PARTITION BY p.user_id) AS first_at,
               MAX(pc.created_at) OVER (PARTITION BY p.user_id) AS latest_at
        FROM practices p JOIN practice_checkins pc ON pc.practice_id = p.id
        WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      ), moments AS (
        SELECT DISTINCT ON (user_id, moment) user_id, moment, occurred_at FROM (
          SELECT user_id, 'first_checkin'::text AS moment, first_at AS occurred_at FROM activity WHERE total_count = 1
          UNION ALL
          SELECT user_id, 'return_after_break', created_at FROM activity WHERE previous_at IS NOT NULL AND created_at - previous_at >= INTERVAL '3 days' AND created_at >= ${now} - INTERVAL '1 day'
          UNION ALL
          SELECT user_id, 'month_milestone', latest_at FROM activity WHERE first_at <= ${now} - INTERVAL '30 days' AND latest_at >= ${now} - INTERVAL '1 day'
        ) x ORDER BY user_id, moment, occurred_at DESC
      )
      SELECT m.user_id, u.nickname, c.photo_url AS avatar, m.moment, m.occurred_at
      FROM moments m JOIN users u ON u.id = m.user_id LEFT JOIN contacts c ON c.id = u.contact_id
      ORDER BY m.occurred_at DESC
    `
  ]);
  return {
    needsEncouragement: needs.map(row => ({ userId: row.user_id, nickname: row.nickname, avatar: row.avatar, lastCheckinAt: row.last_at, lastCheckinPreview: row.preview, interruptedDays: row.interrupted_days })),
    celebrations: celebrations.map(row => ({ userId: row.user_id, nickname: row.nickname, avatar: row.avatar, moment: row.moment, occurredAt: row.occurred_at }))
  };
};
export const cohortFocusService = { get };

