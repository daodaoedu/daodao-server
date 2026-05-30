import { prisma } from './database/prisma.service'

// ─── Types ────────────────────────────────────────────────────────────────────

type LearningStyleType = 'L' | 'C' | 'A' | 'D' | 'O'
type RegistrationFlow = 'landing_page' | 'quiz' | 'action_maker'
type OnboardingEmailType = 'L0' | 'A' | 'B' | 'C' | 'D' | 'E'

// ─── Onboarding Stats ────────────────────────────────────────────────────────

export async function getOnboardingStats() {
  const [total, byFlow, byMethod, byDay] = await Promise.all([
    prisma.$queryRaw<[{ total: bigint; badge_granted: bigint; avg_days: number }]>`
      SELECT
        COUNT(*)                                              AS total,
        COUNT(*) FILTER (WHERE badge_granted = TRUE)         AS badge_granted,
        AVG(days_to_complete) FILTER (WHERE days_to_complete IS NOT NULL) AS avg_days
      FROM user_onboarding
    `,
    prisma.$queryRaw<Array<{ flow: string | null; total: bigint; badge_granted: bigint }>>`
      SELECT
        registration_flow AS flow,
        COUNT(*)           AS total,
        COUNT(*) FILTER (WHERE badge_granted = TRUE) AS badge_granted
      FROM user_onboarding
      GROUP BY registration_flow
    `,
    prisma.$queryRaw<Array<{ method: string | null; total: bigint }>>`
      SELECT creation_method AS method, COUNT(*) AS total
      FROM user_onboarding
      WHERE creation_method IS NOT NULL
      GROUP BY creation_method
    `,
    prisma.$queryRaw<Array<{ days: number; count: bigint }>>`
      SELECT days_to_complete AS days, COUNT(*) AS count
      FROM user_onboarding
      WHERE days_to_complete IS NOT NULL
      GROUP BY days_to_complete
      ORDER BY days_to_complete
    `,
  ])

  const row = total[0]
  const totalUsers = Number(row?.total ?? 0)
  const badgeGrantedCount = Number(row?.badge_granted ?? 0)

  const flowMap: Record<string, { total: number; badgeGranted: number }> = {
    landing_page: { total: 0, badgeGranted: 0 },
    quiz: { total: 0, badgeGranted: 0 },
    action_maker: { total: 0, badgeGranted: 0 },
  }
  for (const r of byFlow) {
    const key = r.flow ?? 'landing_page'
    if (key in flowMap) {
      flowMap[key] = { total: Number(r.total), badgeGranted: Number(r.badge_granted) }
    }
  }

  const methodMap: Record<string, number> = { self_created: 0, copied: 0, action_generator: 0 }
  for (const r of byMethod) {
    if (r.method && r.method in methodMap) methodMap[r.method] = Number(r.total)
  }

  return {
    totalUsers,
    badgeGrantedCount,
    badgeGrantedRate: totalUsers > 0 ? Math.round((badgeGrantedCount / totalUsers) * 1000) / 10 : 0,
    avgDaysToComplete: Math.round((row?.avg_days ?? 0) * 10) / 10,
    byRegistrationFlow: flowMap as Record<RegistrationFlow, { total: number; badgeGranted: number }>,
    byCreationMethod: methodMap,
    completionByDay: byDay.map(r => ({ days: r.days, count: Number(r.count) })),
  }
}

// ─── User Onboarding Detail ──────────────────────────────────────────────────

export async function getUserOnboardingDetail(externalUserId: string) {
  const user = await prisma.users.findUnique({
    where: { external_id: externalUserId },
    select: { id: true }
  })
  if (!user) return null

  const [onboarding, latestQuiz, personaAnswers, emails, checkins, practiceStats] = await Promise.all([
    prisma.user_onboarding.findUnique({ where: { user_id: user.id } }),
    prisma.$queryRaw<Array<{ result_type: string; completed_at: Date; attempt_count: bigint }>>`
      SELECT result_type, completed_at, COUNT(*) OVER (PARTITION BY user_id) AS attempt_count
      FROM quiz_results
      WHERE user_id = ${user.id}
      ORDER BY completed_at DESC
      LIMIT 1
    `,
    prisma.$queryRaw<[{ count: bigint; last_answered_at: Date | null }]>`
      SELECT COUNT(*) AS count, MAX(created_at) AS last_answered_at
      FROM persona_answers
      WHERE user_id = ${user.id}
    `,
    prisma.$queryRaw<Array<{ email_type: string; status: string; sent_at: Date | null; opened_at: Date | null; open_count: number }>>`
      SELECT email_type, status, sent_at, opened_at, open_count
      FROM email_logs
      WHERE user_id = ${user.id}
        AND email_type IN ('L0', 'A', 'B', 'C', 'D', 'E')
      ORDER BY sent_at DESC
    `,
    prisma.$queryRaw<[{ max_streak: number | null; last_active_at: Date | null }]>`
      WITH ranked AS (
        SELECT checkin_date,
               ROW_NUMBER() OVER (ORDER BY checkin_date) AS rn
        FROM practice_checkins
        WHERE user_id = ${user.id}
      ),
      island_groups AS (
        SELECT (checkin_date - (rn * INTERVAL '1 day'))::date AS grp
        FROM ranked
      ),
      streak_counts AS (
        SELECT COUNT(*) AS streak_len FROM island_groups GROUP BY grp
      )
      SELECT
        COALESCE(MAX(streak_len), 0) AS max_streak,
        (SELECT MAX(checkin_date) FROM practice_checkins WHERE user_id = ${user.id}) AS last_active_at
      FROM streak_counts
    `,
    prisma.$queryRaw<[{ total: bigint; active: bigint }]>`
      SELECT
        COUNT(DISTINCT p.id) AS total,
        COUNT(DISTINCT pc.practice_id) AS active
      FROM practices p
      LEFT JOIN practice_checkins pc ON pc.practice_id = p.id
      WHERE p.user_id = ${user.id} AND p.deleted_at IS NULL
    `,
  ])

  if (!onboarding) return null

  const emailTypes: OnboardingEmailType[] = ['L0', 'A', 'B', 'C', 'D', 'E']
  const sentEmails = new Map(emails.map(e => [e.email_type, e]))
  const emailSequence = emailTypes.map(type => {
    const e = sentEmails.get(type)
    return {
      emailType: type,
      status: e ? e.status : 'not_sent',
      sentAt: e?.sent_at?.toISOString() ?? null,
      openedAt: e?.opened_at?.toISOString() ?? null,
      openCount: e?.open_count ?? 0,
    }
  })

  const personaRow = personaAnswers[0]
  const answerCount = Number(personaRow?.count ?? 0)
  const practiceRow = practiceStats[0]
  const checkinRow = checkins[0]

  return {
    userId: externalUserId,
    registrationFlow: onboarding.registration_flow as RegistrationFlow | null,
    userSource: onboarding.user_source,
    creationMethod: onboarding.creation_method,
    taskStates: onboarding.task_states as Record<string, string>,
    taskCompletedAt: (onboarding.task_completed_at ?? {}) as Record<string, string>,
    badgeGranted: onboarding.badge_granted,
    badgeGrantedAt: onboarding.badge_granted_at?.toISOString() ?? null,
    daysToComplete: onboarding.days_to_complete,
    completedAt: onboarding.completed_at?.toISOString() ?? null,
    learningStyle: latestQuiz[0]
      ? {
          resultType: latestQuiz[0].result_type as LearningStyleType,
          completedAt: latestQuiz[0].completed_at.toISOString(),
          attemptCount: Number(latestQuiz[0].attempt_count),
        }
      : null,
    persona: {
      answerCount,
      isUnlocked: answerCount >= 5,
      lastAnsweredAt: personaRow?.last_answered_at?.toISOString() ?? null,
    },
    emailSequence,
    engagement: {
      practiceCount: Number(practiceRow?.total ?? 0),
      activePracticeCount: Number(practiceRow?.active ?? 0),
      maxCheckinStreak: checkinRow?.max_streak ?? 0,
      lastActiveAt: checkinRow?.last_active_at?.toISOString() ?? null,
    },
  }
}

// ─── Quiz Stats ───────────────────────────────────────────────────────────────

export async function getQuizStats() {
  const [totalUsers, byRole, byRoleAndBadge, byRoleAndFlow] = await Promise.all([
    prisma.users.count(),
    prisma.$queryRaw<Array<{ result_type: string; count: bigint }>>`
      WITH latest AS (
        SELECT DISTINCT ON (user_id) user_id, result_type
        FROM quiz_results ORDER BY user_id, completed_at DESC
      )
      SELECT result_type, COUNT(*) AS count FROM latest GROUP BY result_type
    `,
    prisma.$queryRaw<Array<{ result_type: string; badge_granted: bigint; total: bigint }>>`
      WITH latest AS (
        SELECT DISTINCT ON (qr.user_id) qr.user_id, qr.result_type, uo.badge_granted
        FROM quiz_results qr
        LEFT JOIN user_onboarding uo ON uo.user_id = qr.user_id
        ORDER BY qr.user_id, qr.completed_at DESC
      )
      SELECT result_type,
        COUNT(*) FILTER (WHERE badge_granted = TRUE) AS badge_granted,
        COUNT(*)                                      AS total
      FROM latest GROUP BY result_type
    `,
    prisma.$queryRaw<Array<{ result_type: string; flow: string | null; count: bigint }>>`
      WITH latest AS (
        SELECT DISTINCT ON (qr.user_id) qr.user_id, qr.result_type, uo.registration_flow AS flow
        FROM quiz_results qr
        LEFT JOIN user_onboarding uo ON uo.user_id = qr.user_id
        ORDER BY qr.user_id, qr.completed_at DESC
      )
      SELECT result_type, flow, COUNT(*) AS count FROM latest GROUP BY result_type, flow
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

  const byRoleBadgeMap = Object.fromEntries(
    roles.map(r => {
      const row = byRoleAndBadge.find(x => x.result_type === r)
      return [r, { badgeGranted: Number(row?.badge_granted ?? 0), total: Number(row?.total ?? 0) }]
    })
  ) as Record<LearningStyleType, { badgeGranted: number; total: number }>

  const flows: RegistrationFlow[] = ['landing_page', 'quiz', 'action_maker']
  const byRoleFlowMap = Object.fromEntries(
    roles.map(r => {
      const flowCounts = Object.fromEntries(
        flows.map(f => {
          const row = byRoleAndFlow.find(x => x.result_type === r && (x.flow ?? 'landing_page') === f)
          return [f, Number(row?.count ?? 0)]
        })
      )
      return [r, flowCounts]
    })
  ) as Record<LearningStyleType, Record<RegistrationFlow, number>>

  return {
    totalUsers,
    quizCompletedCount,
    quizCompletedRate: totalUsers > 0 ? Math.round((quizCompletedCount / totalUsers) * 1000) / 10 : 0,
    byRole: byRoleMap,
    byRoleAndBadge: byRoleBadgeMap,
    byRoleAndRegistrationFlow: byRoleFlowMap,
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

// ─── Email Onboarding Stats ───────────────────────────────────────────────────

export async function getEmailOnboardingStats() {
  const rows = await prisma.$queryRaw<Array<{
    email_type: string
    user_source: string | null
    sent_count: bigint
    opened_count: bigint
    failed_count: bigint
  }>>`
    SELECT
      el.email_type,
      uo.user_source,
      COUNT(*)                                        AS sent_count,
      COUNT(*) FILTER (WHERE el.opened_at IS NOT NULL) AS opened_count,
      COUNT(*) FILTER (WHERE el.status = 'failed')     AS failed_count
    FROM email_logs el
    LEFT JOIN user_onboarding uo ON uo.user_id = el.user_id
    WHERE el.email_type IN ('L0', 'A', 'B', 'C', 'D', 'E')
    GROUP BY el.email_type, uo.user_source
  `

  const emailTypes: OnboardingEmailType[] = ['L0', 'A', 'B', 'C', 'D', 'E']
  const sources = ['S1', 'S2', 'S3']

  const byEmailType = Object.fromEntries(
    emailTypes.map(type => {
      const typeRows = rows.filter(r => r.email_type === type)
      const sentCount = typeRows.reduce((s, r) => s + Number(r.sent_count), 0)
      const openedCount = typeRows.reduce((s, r) => s + Number(r.opened_count), 0)
      const failedCount = typeRows.reduce((s, r) => s + Number(r.failed_count), 0)
      return [type, {
        sentCount,
        openedCount,
        openRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 1000) / 10 : 0,
        failedCount,
      }]
    })
  ) as Record<OnboardingEmailType, { sentCount: number; openedCount: number; openRate: number; failedCount: number }>

  const byUserSource = Object.fromEntries(
    sources.map(source => {
      const sourceRows = rows.filter(r => r.user_source === source)
      const sentCount = sourceRows.reduce((s, r) => s + Number(r.sent_count), 0)
      const openedCount = sourceRows.reduce((s, r) => s + Number(r.opened_count), 0)
      return [source, {
        sentCount,
        openedCount,
        openRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 1000) / 10 : 0,
      }]
    })
  ) as Record<string, { sentCount: number; openedCount: number; openRate: number }>

  return { byEmailType, byUserSource }
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
      WITH ranked AS (
        SELECT user_id,
               checkin_date,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY checkin_date) AS rn
        FROM practice_checkins
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

export default {
  getOnboardingStats,
  getUserOnboardingDetail,
  getQuizStats,
  getPersonaStats,
  getEmailOnboardingStats,
  getEngagementStats,
}
