/**
 * Admin 遊戲化服務
 * 提供徽章、挑戰、排行榜、連續學習天數管理功能
 */

import { Prisma } from '../../generated/prisma'
import { prisma } from './database/prisma.service'
import type {
  Badge,
  Challenge,
  LeaderboardConfig,
  LeaderboardEntry,
  StreakDistribution,
  CreateBadgeInput,
  CreateChallengeInput,
} from '../types/admin-gamification.types'

/**
 * 列出所有徽章
 */
const listBadges = async (): Promise<Badge[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; description: string; icon_url: string;
    trigger_condition: string; awarded_count: bigint; created_at: Date;
  }>>`
    SELECT b.*, COUNT(ub.user_id)::bigint AS awarded_count
    FROM badges b
    LEFT JOIN user_badges ub ON b.id = ub.badge_id
    GROUP BY b.id
  `

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    iconUrl: r.icon_url,
    triggerCondition: r.trigger_condition,
    awardedCount: Number(r.awarded_count),
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 建立徽章
 * @param input - 建立徽章輸入
 */
const createBadge = async (input: CreateBadgeInput): Promise<Badge> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number; name: string; description: string; icon_url: string;
    trigger_condition: string; created_at: Date;
  }>>`
    INSERT INTO badges (name, description, icon_url, trigger_condition)
    VALUES (${input.name}, ${input.description}, ${input.iconUrl}, ${input.triggerCondition})
    RETURNING *
  `

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    iconUrl: row.icon_url,
    triggerCondition: row.trigger_condition,
    awardedCount: 0,
    createdAt: row.created_at.toISOString(),
  }
}

/**
 * 頒發徽章給用戶
 * @param badgeId - 徽章 ID
 * @param userId - 用戶 ID
 */
const awardBadge = async (badgeId: number, userId: number): Promise<{ badgeId: number; userId: number; awarded: boolean }> => {
  const result = await prisma.$executeRaw`
    INSERT INTO user_badges (badge_id, user_id)
    VALUES (${badgeId}, ${userId})
    ON CONFLICT DO NOTHING
  `
  return { badgeId, userId, awarded: result > 0 }
}

/**
 * 撤銷用戶徽章
 * @param badgeId - 徽章 ID
 * @param userId - 用戶 ID
 */
const revokeBadge = async (badgeId: number, userId: number): Promise<{ badgeId: number; userId: number; revoked: boolean }> => {
  const result = await prisma.$executeRaw`
    DELETE FROM user_badges WHERE badge_id = ${badgeId} AND user_id = ${userId}
  `
  return { badgeId, userId, revoked: result > 0 }
}

/**
 * 列出挑戰
 * @param status - 篩選狀態（可選）
 */
const listChallenges = async (status?: 'active' | 'upcoming' | 'completed'): Promise<Challenge[]> => {
  let statusFilter: Prisma.Sql = Prisma.sql`1=1`
  if (status === 'active') statusFilter = Prisma.sql`c.start_date <= NOW() AND c.end_date >= NOW()`
  else if (status === 'upcoming') statusFilter = Prisma.sql`c.start_date > NOW()`
  else if (status === 'completed') statusFilter = Prisma.sql`c.end_date < NOW()`

  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; description: string;
    start_date: Date; end_date: Date;
    required_action: string; reward: string;
    participant_count: bigint; completion_rate: number;
  }>>(
    Prisma.sql`SELECT c.*,
       COUNT(cp.user_id)::bigint AS participant_count,
       AVG(CASE WHEN cp.completed THEN 1.0 ELSE 0.0 END)::float AS completion_rate
     FROM challenges c
     LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id
     WHERE ${statusFilter}
     GROUP BY c.id
     ORDER BY c.start_date DESC`
  )

  return rows.map(r => {
    const now = new Date()
    let computedStatus: Challenge['status'] = 'active'
    if (r.start_date > now) computedStatus = 'upcoming'
    else if (r.end_date < now) computedStatus = 'completed'

    return {
      id: r.id,
      name: r.name,
      description: r.description,
      startDate: r.start_date.toISOString(),
      endDate: r.end_date.toISOString(),
      requiredAction: r.required_action,
      reward: r.reward,
      participantCount: Number(r.participant_count),
      completionRate: r.completion_rate ?? 0,
      status: computedStatus,
    }
  })
}

/**
 * 建立挑戰
 * @param input - 建立挑戰輸入
 */
const createChallenge = async (input: CreateChallengeInput): Promise<Challenge> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number; name: string; description: string;
    start_date: Date; end_date: Date;
    required_action: string; reward: string;
  }>>`
    INSERT INTO challenges (name, description, start_date, end_date, required_action, reward)
    VALUES (${input.name}, ${input.description}, ${input.startDate}::timestamptz, ${input.endDate}::timestamptz, ${input.requiredAction}, ${input.reward})
    RETURNING *
  `

  const now = new Date()
  let status: Challenge['status'] = 'active'
  if (row.start_date > now) status = 'upcoming'
  else if (row.end_date < now) status = 'completed'

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date.toISOString(),
    endDate: row.end_date.toISOString(),
    requiredAction: row.required_action,
    reward: row.reward,
    participantCount: 0,
    completionRate: 0,
    status,
  }
}

/**
 * 取得挑戰參與者列表
 * @param challengeId - 挑戰 ID
 */
const getParticipants = async (challengeId: number): Promise<Array<{ userId: number; userName: string; progress: number; completedAt: string | null }>> => {
  const rows = await prisma.$queryRaw<Array<{
    user_id: number; user_name: string | null;
    progress: number; completed_at: Date | null;
  }>>`
    SELECT cp.user_id, u.name AS user_name, cp.progress, cp.completed_at
    FROM challenge_progress cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.challenge_id = ${challengeId}
  `

  return rows.map(r => ({
    userId: r.user_id,
    userName: r.user_name ?? '',
    progress: r.progress,
    completedAt: r.completed_at?.toISOString() ?? null,
  }))
}

/**
 * 取得連續學習天數分佈
 */
const getStreakDistribution = async (): Promise<StreakDistribution[]> => {
  const rows = await prisma.$queryRaw<Array<{ range: string; count: bigint }>>`
    WITH user_streaks AS (
      SELECT user_id,
        COUNT(DISTINCT checkin_date)::int AS streak_days
      FROM practice_checkins
      WHERE checkin_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY user_id
    )
    SELECT
      CASE
        WHEN streak_days BETWEEN 1 AND 7 THEN '1-7 天'
        WHEN streak_days BETWEEN 8 AND 14 THEN '8-14 天'
        WHEN streak_days BETWEEN 15 AND 30 THEN '15-30 天'
        WHEN streak_days BETWEEN 31 AND 60 THEN '31-60 天'
        WHEN streak_days > 60 THEN '60+ 天'
        ELSE '0 天'
      END AS range,
      COUNT(*)::bigint AS count
    FROM user_streaks
    GROUP BY range
    ORDER BY MIN(streak_days)
  `

  return rows.map(r => ({
    range: r.range,
    count: Number(r.count),
  }))
}

/**
 * 取得排行榜設定
 */
const getLeaderboardConfig = async (): Promise<LeaderboardConfig> => {
  const [row] = await prisma.$queryRaw<Array<{
    activity_weights: Record<string, number>;
    period: string;
  }>>`SELECT * FROM leaderboard_configs LIMIT 1`

  if (!row) {
    return {
      activityWeights: { post: 10, comment: 5, likeReceived: 2, courseCompleted: 50 },
      period: 'weekly',
    }
  }

  return {
    activityWeights: {
      post: row.activity_weights.post ?? 10,
      comment: row.activity_weights.comment ?? 5,
      likeReceived: row.activity_weights.likeReceived ?? row.activity_weights.like_received ?? 2,
      courseCompleted: row.activity_weights.courseCompleted ?? row.activity_weights.course_completed ?? 50,
    },
    period: row.period as LeaderboardConfig['period'],
  }
}

/**
 * 更新排行榜設定
 * @param config - 排行榜設定
 */
const updateLeaderboardConfig = async (config: LeaderboardConfig): Promise<LeaderboardConfig> => {
  const weightsJson = JSON.stringify(config.activityWeights)

  await prisma.$executeRaw(
    Prisma.sql`UPDATE leaderboard_configs SET activity_weights = ${weightsJson}::jsonb, period = ${config.period}`
  )

  return config
}

/**
 * 取得排行榜
 * @param period - 計算週期
 */
const getLeaderboard = async (period: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> => {
  // orderCol is derived from a validated enum, safe to use Prisma.raw for identifier
  const orderCol = period === 'weekly' ? 'weekly_points'
    : period === 'monthly' ? 'monthly_points'
    : 'total_points'

  const rows = await prisma.$queryRaw<Array<{
    user_id: number; user_name: string | null; photo_url: string | null;
    total_points: number; weekly_points: number; monthly_points: number;
    breakdown: Record<string, number> | null;
  }>>(
    Prisma.sql`SELECT up.*, u.name AS user_name, u.photo_url
     FROM user_points up
     JOIN users u ON up.user_id = u.id
     ORDER BY ${Prisma.raw(`up.${orderCol}`)} DESC
     LIMIT 20`
  )

  return rows.map((r, idx) => ({
    rank: idx + 1,
    userId: r.user_id,
    userName: r.user_name ?? '',
    avatarUrl: r.photo_url ?? '',
    totalPoints: period === 'weekly' ? r.weekly_points
      : period === 'monthly' ? r.monthly_points
      : r.total_points,
    breakdown: {
      posts: r.breakdown?.posts ?? 0,
      comments: r.breakdown?.comments ?? 0,
      likes: r.breakdown?.likes ?? 0,
      courses: r.breakdown?.courses ?? 0,
    },
  }))
}

/**
 * 重置排行榜
 * @param period - 計算週期
 */
const resetLeaderboard = async (period: 'weekly' | 'monthly' | 'alltime'): Promise<{ reset: boolean; period: string }> => {
  if (period === 'weekly') {
    await prisma.$executeRaw`UPDATE user_points SET weekly_points = 0`
  } else if (period === 'monthly') {
    await prisma.$executeRaw`UPDATE user_points SET monthly_points = 0`
  } else {
    await prisma.$executeRaw`UPDATE user_points SET total_points = 0, weekly_points = 0, monthly_points = 0`
  }
  return { reset: true, period }
}

export default {
  listBadges,
  createBadge,
  awardBadge,
  revokeBadge,
  listChallenges,
  createChallenge,
  getParticipants,
  getStreakDistribution,
  getLeaderboardConfig,
  updateLeaderboardConfig,
  getLeaderboard,
  resetLeaderboard,
}
