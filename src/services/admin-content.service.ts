import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { NotFoundError } from '../middleware/error.middleware';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ContentPerformanceItem {
  id: number;
  title: string;
  creatorName: string | null;
  creatorEmail: string | null;
  copyCount: number;
  copiedFromTitle: string | null;
  views: number;
  depth: number;
  avgTime: number;
  interactionRate: number;
  featured: boolean;
}

export interface ContentCollection {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface CheckinSummary {
  total: number;
  last7Days: number;
  uniqueUsers: number;
  withReaction: number;
  withComment: number;
  moodDistribution: Array<{ mood: string; count: number }>;
}

export interface QuizSummary {
  completed: number;
  completionRate: number;
  byRole: Array<{ role: string; count: number; rate: number }>;
}

export interface PersonaSummary {
  totalQuestions: number;
  usersAnswered: number;
  totalAnswers: number;
  questions: Array<{ id: number; prompt: string; answerCount: number }>;
}

export interface ContentPerformanceData {
  items: ContentPerformanceItem[];
  collections: ContentCollection[];
  checkinSummary: CheckinSummary;
  quizSummary: QuizSummary;
  personaSummary: PersonaSummary;
}

// ── Main query ────────────────────────────────────────────────────────────────

export async function getContentPerformance(days?: number): Promise<ContentPerformanceData> {
  const periodFilter = days
    ? Prisma.sql`created_at > NOW() - ${days} * INTERVAL '1 day'`
    : Prisma.sql`1 = 1`;
  const eventsFilter = days
    ? Prisma.sql`created_at > NOW() - ${days} * INTERVAL '1 day'`
    : Prisma.sql`1 = 1`;
  const quizFilter = days
    ? Prisma.sql`completed_at > NOW() - ${days} * INTERVAL '1 day'`
    : Prisma.sql`1 = 1`;
  const personaFilter = days
    ? Prisma.sql`pa.created_at > NOW() - ${days} * INTERVAL '1 day'`
    : Prisma.sql`1 = 1`;

  const [
    practiceRows,
    depthRows,
    timeRows,
    collectionRows,
    checkinRows,
    checkinMoodRows,
    quizRows,
    totalUsersCount,
    personaStatRows,
    personaQuestionRows,
  ] = await Promise.all([
    // ── Practices ──────────────────────────────────────────────────
    prisma.$queryRaw<Array<{
      id: number;
      title: string;
      creator_name: string | null;
      creator_email: string | null;
      copy_count: number;
      copied_from_title: string | null;
      view_count: bigint;
      reaction_count: bigint;
      comment_count: bigint;
      is_featured: boolean;
    }>>`
      SELECT
        p.id,
        p.title,
        u.nickname AS creator_name,
        c.email AS creator_email,
        COALESCE(p.copy_count, 0) AS copy_count,
        sp.title AS copied_from_title,
        COALESCE(es.view_count, 0)::bigint AS view_count,
        (SELECT COUNT(*)::bigint FROM reactions WHERE target_type = 'practice' AND target_id = p.id) AS reaction_count,
        (SELECT COUNT(*)::bigint FROM comments  WHERE target_type = 'practice' AND target_id = p.id) AS comment_count,
        COALESCE(p.is_featured, false) AS is_featured
      FROM practices p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN contacts c ON c.id = u.contact_id
      LEFT JOIN practices sp ON sp.id = p.source_practice_id
      LEFT JOIN entity_stats es ON es.entity_id = p.id AND es.entity_type = 'practice'
      WHERE p.deleted_at IS NULL AND p.visibility = 'public'
      ORDER BY COALESCE(es.view_count, 0) DESC
    `,

    // ── Practices: read depth ───────────────────────────────────────
    prisma.$queryRaw<Array<{ entity_id: number; avg_depth: number }>>`
      SELECT entity_id, ROUND(AVG((metadata->>'depth_percent')::numeric)) AS avg_depth
      FROM interaction_events
      WHERE entity_type = 'practice' AND event_type = 'read_progress'
        AND metadata->>'depth_percent' IS NOT NULL
        AND ${eventsFilter}
      GROUP BY entity_id
    `,

    // ── Practices: time spent ───────────────────────────────────────
    prisma.$queryRaw<Array<{ entity_id: number; avg_seconds: number }>>`
      SELECT entity_id, AVG((metadata->>'seconds')::numeric) AS avg_seconds
      FROM interaction_events
      WHERE entity_type = 'practice' AND event_type = 'time_spent'
        AND metadata->>'seconds' IS NOT NULL
        AND ${eventsFilter}
      GROUP BY entity_id
    `,

    // ── Collections ─────────────────────────────────────────────────
    prisma.$queryRaw<Array<{ id: number; name: string; description: string | null; count: bigint }>>`
      SELECT cc.id, cc.name, cc.description,
        COUNT(DISTINCT ptc.template_id)::bigint AS count
      FROM content_categories cc
      LEFT JOIN practice_template_categories ptc ON ptc.category_id = cc.id
      GROUP BY cc.id, cc.name, cc.description
      ORDER BY count DESC, cc.name
    `,

    // ── Checkins: aggregate ─────────────────────────────────────────
    prisma.$queryRaw<Array<{
      total: bigint;
      last_7_days: bigint;
      unique_users: bigint;
      with_reaction: bigint;
      with_comment: bigint;
    }>>`
      SELECT
        COUNT(*) FILTER (WHERE ${periodFilter})::bigint AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::bigint AS last_7_days,
        COUNT(DISTINCT user_id) FILTER (WHERE ${periodFilter})::bigint AS unique_users,
        (SELECT COUNT(DISTINCT target_id)::bigint FROM reactions WHERE target_type = 'checkin') AS with_reaction,
        (SELECT COUNT(DISTINCT target_id)::bigint FROM comments  WHERE target_type = 'checkin') AS with_comment
      FROM practice_checkins
    `,

    // ── Checkins: mood distribution ─────────────────────────────────
    prisma.$queryRaw<Array<{ mood: string; count: bigint }>>`
      SELECT mood, COUNT(*)::bigint AS count
      FROM practice_checkins
      WHERE mood IS NOT NULL AND ${periodFilter}
      GROUP BY mood ORDER BY count DESC
    `,

    // ── Quiz: role distribution (quiz_results) ──────────────────────
    prisma.$queryRaw<Array<{ result_type: string; count: bigint }>>`
      WITH latest AS (
        SELECT DISTINCT ON (user_id) user_id, result_type
        FROM quiz_results WHERE ${quizFilter} ORDER BY user_id, completed_at DESC
      )
      SELECT result_type, COUNT(*)::bigint AS count
      FROM latest GROUP BY result_type ORDER BY count DESC
    `,

    // ── Total users ─────────────────────────────────────────────────
    prisma.users.count(),

    // ── Persona: aggregate (persona_answers) ────────────────────────
    prisma.$queryRaw<Array<{
      total_questions: bigint;
      users_answered: bigint;
      total_answers: bigint;
    }>>`
      SELECT
        (SELECT COUNT(*)::bigint FROM persona_questions) AS total_questions,
        COUNT(DISTINCT pa.user_id)::bigint               AS users_answered,
        COUNT(pa.id)::bigint                             AS total_answers
      FROM persona_answers pa
      WHERE ${personaFilter}
    `,

    // ── Persona: per-question fill rate ─────────────────────────────
    prisma.$queryRaw<Array<{ id: number; prompt: string | null; answer_count: bigint }>>`
      SELECT
        pq.id,
        pqt.prompt,
        COUNT(pa.id)::bigint AS answer_count
      FROM persona_questions pq
      LEFT JOIN persona_question_translations pqt ON pqt.question_id = pq.id AND pqt.locale = 'zh-TW'
      LEFT JOIN persona_answers pa ON pa.question_id = pq.id AND ${personaFilter}
      GROUP BY pq.id, pqt.prompt
      ORDER BY answer_count DESC, pq.id
    `,
  ]);

  // ── Practices ─────────────────────────────────────────────────────────────
  const depthMap = new Map(depthRows.map(r => [r.entity_id, Number(r.avg_depth)]));
  const timeMap  = new Map(timeRows.map(r => [r.entity_id, Number(r.avg_seconds)]));
  const items: ContentPerformanceItem[] = practiceRows.map(p => {
    const views = Number(p.view_count);
    const reactions = Number(p.reaction_count);
    const comments  = Number(p.comment_count);
    const avgSecs   = timeMap.get(p.id) ?? 0;
    return {
      id: p.id,
      title: p.title,
      creatorName: p.creator_name ?? null,
      creatorEmail: p.creator_email ?? null,
      copyCount: Number(p.copy_count),
      copiedFromTitle: p.copied_from_title ?? null,
      views,
      depth: depthMap.get(p.id) ?? 0,
      avgTime: avgSecs > 0 ? Math.round(avgSecs / 60 * 10) / 10 : 0,
      interactionRate: views > 0 ? Math.round((reactions + comments) / views * 100) : 0,
      featured: p.is_featured,
    };
  });

  const collections: ContentCollection[] = collectionRows.map(c => ({
    id: String(c.id),
    name: c.name,
    description: c.description ?? '',
    count: Number(c.count),
  }));

  // ── Checkins ──────────────────────────────────────────────────────────────
  const cr = checkinRows[0];
  const checkinSummary: CheckinSummary = {
    total:        Number(cr?.total ?? 0),
    last7Days:    Number(cr?.last_7_days ?? 0),
    uniqueUsers:  Number(cr?.unique_users ?? 0),
    withReaction: Number(cr?.with_reaction ?? 0),
    withComment:  Number(cr?.with_comment ?? 0),
    moodDistribution: checkinMoodRows.map(r => ({ mood: r.mood, count: Number(r.count) })),
  };

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const quizCompleted = quizRows.reduce((s, r) => s + Number(r.count), 0);
  const quizSummary: QuizSummary = {
    completed:      quizCompleted,
    completionRate: totalUsersCount > 0 ? Math.round(quizCompleted / totalUsersCount * 1000) / 10 : 0,
    byRole: quizRows.map(r => ({
      role:  r.result_type,
      count: Number(r.count),
      rate:  quizCompleted > 0 ? Math.round(Number(r.count) / quizCompleted * 1000) / 10 : 0,
    })),
  };

  // ── Persona ───────────────────────────────────────────────────────────────
  const ps = personaStatRows[0];
  const personaSummary: PersonaSummary = {
    totalQuestions: Number(ps?.total_questions ?? 0),
    usersAnswered:  Number(ps?.users_answered ?? 0),
    totalAnswers:   Number(ps?.total_answers ?? 0),
    questions: personaQuestionRows.map(r => ({
      id:          r.id,
      prompt:      r.prompt ?? `問題 ${r.id}`,
      answerCount: Number(r.answer_count),
    })),
  };

  return { items, collections, checkinSummary, quizSummary, personaSummary };
}

// ── Featured ──────────────────────────────────────────────────────────────────

export async function setContentFeatured(id: number, featured: boolean): Promise<ContentPerformanceItem> {
  const updated = await prisma.$queryRaw<Array<{ id: number }>>`
    UPDATE practices SET is_featured = ${featured}
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING id
  `;

  if (!updated.length) throw new NotFoundError('找不到此 practice');

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    title: string;
    view_count: bigint;
    reaction_count: bigint;
    comment_count: bigint;
    is_featured: boolean;
  }>>`
    SELECT
      p.id, p.title,
      COALESCE(es.view_count, 0)::bigint AS view_count,
      (SELECT COUNT(*)::bigint FROM reactions WHERE target_type = 'practice' AND target_id = p.id) AS reaction_count,
      (SELECT COUNT(*)::bigint FROM comments  WHERE target_type = 'practice' AND target_id = p.id) AS comment_count,
      COALESCE(p.is_featured, false) AS is_featured
    FROM practices p
    LEFT JOIN entity_stats es ON es.entity_id = p.id AND es.entity_type = 'practice'
    WHERE p.id = ${id}
  `;

  const views = Number(row.view_count);
  return {
    id: row.id,
    title: row.title,
    creatorName: null,
    creatorEmail: null,
    copyCount: 0,
    copiedFromTitle: null,
    views,
    depth: 0,
    avgTime: 0,
    interactionRate: views > 0
      ? Math.round((Number(row.reaction_count) + Number(row.comment_count)) / views * 100)
      : 0,
    featured: row.is_featured,
  };
}
