import { prisma } from './database/prisma.service'

// ─── Types ────────────────────────────────────────────────────────────────────

type LearningStyleType = 'L' | 'C' | 'A' | 'D' | 'O'

// ─── Quiz Stats ───────────────────────────────────────────────────────────────

export async function getQuizStats() {
  const [totalUsers, byRole] = await Promise.all([
    prisma.users.count(),
    prisma.$queryRaw<Array<{ result_type: string; count: bigint }>>`
      WITH latest AS (
        SELECT DISTINCT ON (user_id) user_id, result_type
        FROM quiz_results WHERE user_id IS NOT NULL ORDER BY user_id, completed_at DESC
      )
      SELECT result_type, COUNT(*) AS count FROM latest GROUP BY result_type
    `,
  ])

  const roles: LearningStyleType[] = ['D', 'A', 'O', 'L', 'C']
  const quizCompletedCount = byRole.reduce((sum, r) => sum + Number(r.count), 0)

  const byRoleMap = Object.fromEntries(
    roles.map(r => {
      const row = byRole.find(x => x.result_type === r)
      const count = Number(row?.count ?? 0)
      return [r, { count, rate: quizCompletedCount > 0 ? Math.round((count / quizCompletedCount) * 1000) / 10 : 0 }]
    })
  ) as Record<LearningStyleType, { count: number; rate: number }>

  return {
    totalUsers,
    quizCompletedCount,
    quizCompletedRate: totalUsers > 0 ? Math.round((quizCompletedCount / totalUsers) * 1000) / 10 : 0,
    byRole: byRoleMap,
  }
}

// ─── Persona Stats ────────────────────────────────────────────────────────────

export async function getPersonaStats() {
  const [totalUsers, distribution, topQuestions] = await Promise.all([
    prisma.users.count(),
    prisma.$queryRaw<Array<{ answer_count: bigint; user_count: bigint }>>`
      SELECT cnt AS answer_count, COUNT(*) AS user_count
      FROM (
        SELECT user_id, COUNT(*) AS cnt
        FROM persona_answers
        GROUP BY user_id
      ) t
      GROUP BY cnt
      ORDER BY cnt
    `,
    prisma.$queryRaw<Array<{ question_id: number; prompt: string; answer_count: bigint }>>`
      SELECT pa.question_id, t.prompt, COUNT(*) AS answer_count
      FROM persona_answers pa
      JOIN persona_question_translations t
        ON t.question_id = pa.question_id AND t.locale = 'zh-TW'
      GROUP BY pa.question_id, t.prompt
      ORDER BY answer_count DESC
      LIMIT 10
    `,
  ])

  const anyAnswerCount = distribution.reduce((sum, r) => sum + Number(r.user_count), 0)
  const unlockedCount = distribution
    .filter(r => Number(r.answer_count) >= 5)
    .reduce((sum, r) => sum + Number(r.user_count), 0)
  const totalAnswers = distribution.reduce(
    (sum, r) => sum + Number(r.answer_count) * Number(r.user_count),
    0
  )
  const avgAnswerCount = anyAnswerCount > 0 ? Math.round((totalAnswers / anyAnswerCount) * 10) / 10 : 0

  return {
    totalUsers,
    anyAnswerCount,
    anyAnswerRate: totalUsers > 0 ? Math.round((anyAnswerCount / totalUsers) * 1000) / 10 : 0,
    unlockedCount,
    unlockedRate: totalUsers > 0 ? Math.round((unlockedCount / totalUsers) * 1000) / 10 : 0,
    avgAnswerCount,
    answerCountDistribution: distribution.map(r => ({
      answerCount: Number(r.answer_count),
      userCount: Number(r.user_count),
    })),
    topQuestions: topQuestions.map(r => ({
      questionId: r.question_id,
      prompt: r.prompt,
      answerCount: Number(r.answer_count),
    })),
  }
}

// ─── Engagement Stats ─────────────────────────────────────────────────────────

export async function getEngagementStats() {
  const [practiceStats, streakStats, retention] = await Promise.all([
    prisma.$queryRaw<[{
      avg_practice_count: number
      avg_active_count: number
      total_practices: bigint
      abandoned: bigint
    }]>`
      SELECT
        AVG(cnt)        AS avg_practice_count,
        AVG(active_cnt) AS avg_active_count,
        SUM(cnt)        AS total_practices,
        SUM(abandoned)  AS abandoned
      FROM (
        SELECT
          p.user_id,
          COUNT(DISTINCT p.id)                                          AS cnt,
          COUNT(DISTINCT pc.practice_id)                                AS active_cnt,
          COUNT(DISTINCT p.id) FILTER (WHERE pc.practice_id IS NULL)   AS abandoned
        FROM practices p
        LEFT JOIN practice_checkins pc ON pc.practice_id = p.id
        WHERE p.deleted_at IS NULL
        GROUP BY p.user_id
      ) t
    `,
    prisma.$queryRaw<[{ avg_max_streak: number; streak7: bigint; streak30: bigint }]>`
      WITH deduped AS (
        SELECT DISTINCT user_id, checkin_date::date AS checkin_date
        FROM practice_checkins
      ),
      ranked AS (
        SELECT user_id,
               checkin_date,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY checkin_date) AS rn
        FROM deduped
      ),
      island_groups AS (
        SELECT user_id,
               (checkin_date - (rn * INTERVAL '1 day'))::date AS grp
        FROM ranked
      ),
      streak_counts AS (
        SELECT user_id, COUNT(*) AS streak_len
        FROM island_groups
        GROUP BY user_id, grp
      ),
      user_streaks AS (
        SELECT user_id, MAX(streak_len) AS max_streak
        FROM streak_counts
        GROUP BY user_id
      )
      SELECT
        AVG(max_streak)                              AS avg_max_streak,
        COUNT(*) FILTER (WHERE max_streak >= 7)      AS streak7,
        COUNT(*) FILTER (WHERE max_streak >= 30)     AS streak30
      FROM user_streaks
    `,
    prisma.$queryRaw<Array<{ day: number; retention_rate: number }>>`
      WITH cohort AS (
        SELECT user_id, MIN(checkin_date) AS first_checkin
        FROM practice_checkins
        GROUP BY user_id
      ),
      days AS (SELECT generate_series(1, 30) AS day)
      SELECT
        d.day,
        ROUND(
          COUNT(DISTINCT pc.user_id)::numeric / NULLIF(COUNT(DISTINCT c.user_id), 0) * 100,
          1
        ) AS retention_rate
      FROM cohort c
      CROSS JOIN days d
      LEFT JOIN practice_checkins pc
        ON pc.user_id = c.user_id
        AND pc.checkin_date = c.first_checkin + (d.day * INTERVAL '1 day')
      GROUP BY d.day
      ORDER BY d.day
    `,
  ])

  const ps = practiceStats[0]
  const ss = streakStats[0]
  const total = Number(ps?.total_practices ?? 0)
  const abandoned = Number(ps?.abandoned ?? 0)

  return {
    practiceStats: {
      avgPracticeCount: Math.round((ps?.avg_practice_count ?? 0) * 10) / 10,
      avgActivePracticeCount: Math.round((ps?.avg_active_count ?? 0) * 10) / 10,
      abandonmentRate: total > 0 ? Math.round((abandoned / total) * 1000) / 10 : 0,
    },
    checkinStats: {
      avgMaxStreak: Math.round((ss?.avg_max_streak ?? 0) * 10) / 10,
      usersWithStreak7Plus: Number(ss?.streak7 ?? 0),
      usersWithStreak30Plus: Number(ss?.streak30 ?? 0),
    },
    retentionByDay: retention.map(r => ({ day: r.day, retentionRate: Number(r.retention_rate) })),
  }
}

type DrillDownUser = {
  id: string
  name: string | null
  email: string | null
  photoURL: string | null
  lastActiveAt: string | null
}

function mapUsers(rows: Array<{
  external_id: string | null
  id: number
  nickname: string | null
  contacts: { email: string | null; photo_url: string | null } | null
  user_activity_stats: { last_active_at: Date | null } | null
}>): DrillDownUser[] {
  return rows.map(u => ({
    id: u.external_id || String(u.id),
    name: u.nickname,
    email: u.contacts?.email || null,
    photoURL: u.contacts?.photo_url || null,
    lastActiveAt: u.user_activity_stats?.last_active_at?.toISOString() || null,
  }))
}

const USER_SELECT = {
  id: true,
  external_id: true,
  nickname: true,
  contacts: { select: { email: true, photo_url: true } },
  user_activity_stats: { select: { last_active_at: true } },
} as const

export async function getMetricDrillDown(metric: string, period?: string): Promise<DrillDownUser[]> {
  const sinceDate = period ? (() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 0
    if (days === 0) return undefined
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d
  })() : undefined

  switch (metric) {
    case 'quiz_completed': {
      const userIds = await prisma.$queryRaw<Array<{ user_id: number }>>`
        SELECT DISTINCT user_id FROM quiz_results WHERE user_id IS NOT NULL
      `
      if (userIds.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: userIds.map(r => r.user_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    case 'practice_abandoned': {
      const userIds = await prisma.$queryRaw<Array<{ user_id: number }>>`
        SELECT p.user_id
        FROM practices p
        LEFT JOIN practice_checkins pc ON pc.practice_id = p.id
        WHERE p.deleted_at IS NULL AND pc.practice_id IS NULL
        GROUP BY p.user_id
      `
      if (userIds.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: userIds.map(r => r.user_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    case 'streak_7plus': {
      const userIds = await prisma.$queryRaw<Array<{ user_id: number }>>`
        WITH deduped AS (
          SELECT DISTINCT user_id, checkin_date::date AS checkin_date
          FROM practice_checkins
        ),
        ranked AS (
          SELECT user_id, checkin_date,
                 ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY checkin_date) AS rn
          FROM deduped
        ),
        island_groups AS (
          SELECT user_id, (checkin_date - (rn * INTERVAL '1 day'))::date AS grp
          FROM ranked
        ),
        streak_counts AS (
          SELECT user_id, COUNT(*) AS streak_len
          FROM island_groups GROUP BY user_id, grp
        )
        SELECT user_id FROM streak_counts WHERE streak_len >= 7 GROUP BY user_id
      `
      if (userIds.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: userIds.map(r => r.user_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    case 'persona_D':
    case 'persona_A':
    case 'persona_O':
    case 'persona_L':
    case 'persona_C': {
      const personaType = metric.split('_')[1]
      const userIds = await prisma.$queryRaw<Array<{ user_id: number }>>`
        SELECT DISTINCT ON (user_id) user_id
        FROM quiz_results
        WHERE user_id IS NOT NULL AND result_type = ${personaType}
        ORDER BY user_id, completed_at DESC
      `
      if (userIds.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: userIds.map(r => r.user_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    case 'comments': {
      const comments = await prisma.comments.findMany({
        where: sinceDate ? { created_at: { gte: sinceDate } } : {},
        select: { user_id: true },
        distinct: ['user_id'],
      })
      if (comments.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: comments.map(c => c.user_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    case 'reactions': {
      const reactions = await prisma.reactions.findMany({
        where: sinceDate ? { created_at: { gte: sinceDate } } : {},
        select: { user_id: true },
        distinct: ['user_id'],
      })
      if (reactions.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: reactions.map(r => r.user_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    case 'follows': {
      const follows = await prisma.follows.findMany({
        where: sinceDate ? { created_at: { gte: sinceDate } } : {},
        select: { follower_id: true },
        distinct: ['follower_id'],
      })
      if (follows.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: follows.map(f => f.follower_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    case 'connects': {
      const userIds = sinceDate
        ? await prisma.$queryRaw<Array<{ user_id: number }>>`
            SELECT DISTINCT user_id FROM (
              SELECT user_a_id AS user_id FROM connections WHERE connected_at >= ${sinceDate}
              UNION
              SELECT user_b_id AS user_id FROM connections WHERE connected_at >= ${sinceDate}
            ) t
          `
        : await prisma.$queryRaw<Array<{ user_id: number }>>`
            SELECT DISTINCT user_id FROM (
              SELECT user_a_id AS user_id FROM connections
              UNION
              SELECT user_b_id AS user_id FROM connections
            ) t
          `
      if (userIds.length === 0) return []
      const rows = await prisma.users.findMany({
        where: { id: { in: userIds.map(r => r.user_id) } },
        select: USER_SELECT,
      })
      return mapUsers(rows)
    }
    default:
      return []
  }
}

export default {
  getQuizStats,
  getPersonaStats,
  getEngagementStats,
  getMetricDrillDown,
}
