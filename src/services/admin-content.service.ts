import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ContentPerformanceItem {
  id: number;
  externalId: string | null;
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
  featuredStartAt: string | null;
  featuredEndAt: string | null;
  featuredActive: boolean;
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
      external_id: string | null;
      title: string;
      creator_name: string | null;
      creator_email: string | null;
      copy_count: number;
      copied_from_title: string | null;
      view_count: bigint;
      reaction_count: bigint;
      comment_count: bigint;
      is_featured: boolean;
      featured_start_at: Date | null;
      featured_end_at: Date | null;
      featured_active: boolean;
    }>>`
      SELECT
        p.id,
        p.external_id,
        p.title,
        u.nickname AS creator_name,
        c.email AS creator_email,
        COALESCE(p.copy_count, 0) AS copy_count,
        sp.title AS copied_from_title,
        COALESCE(es.view_count, 0)::bigint AS view_count,
        (SELECT COUNT(*)::bigint FROM reactions WHERE target_type = 'practice' AND target_id = p.id) AS reaction_count,
        (SELECT COUNT(*)::bigint FROM comments  WHERE target_type = 'practice' AND target_id = p.id) AS comment_count,
        COALESCE(p.is_featured, false) AS is_featured,
        p.featured_start_at,
        p.featured_end_at,
        (COALESCE(p.is_featured, false)
          AND (p.featured_start_at IS NULL OR p.featured_start_at <= NOW())
          AND (p.featured_end_at IS NULL OR p.featured_end_at > NOW())) AS featured_active
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
        FROM quiz_results WHERE user_id IS NOT NULL AND ${quizFilter} ORDER BY user_id, completed_at DESC
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
      externalId: p.external_id ?? null,
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
      featuredStartAt: p.featured_start_at?.toISOString() ?? null,
      featuredEndAt: p.featured_end_at?.toISOString() ?? null,
      featuredActive: p.featured_active,
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

// ── Checkin list ─────────────────────────────────────────────────────────────

export interface CheckinRecord {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  practiceId: number;
  practiceExternalId: string | null;
  practiceTitle: string;
  mood: string | null;
  content: string | null;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
}

export interface CheckinListResult {
  items: CheckinRecord[];
  pagination: { totalCount: number; currentPage: number; totalPages: number; hasNext: boolean; hasPrev: boolean; limit: number };
}

export async function listCheckins(days?: number, limit = 20, offset = 0): Promise<CheckinListResult> {
  const periodFilter = days
    ? Prisma.sql`pc.created_at > NOW() - ${days} * INTERVAL '1 day'`
    : Prisma.sql`1 = 1`;

  const [countResult, rows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM practice_checkins pc
      WHERE ${periodFilter}
    `,
    prisma.$queryRaw<Array<{
      id: number;
      user_id: number;
      user_name: string | null;
      user_email: string | null;
      practice_id: number;
      practice_external_id: string | null;
      practice_title: string;
      mood: string | null;
      note: string | null;
      reaction_count: bigint;
      comment_count: bigint;
      created_at: Date;
    }>>`
      SELECT
        pc.id,
        pc.user_id,
        u.nickname AS user_name,
        c.email AS user_email,
        pc.practice_id,
        p.external_id AS practice_external_id,
        p.title AS practice_title,
        pc.mood,
        pc.note,
        (SELECT COUNT(*)::bigint FROM reactions WHERE target_type = 'checkin' AND target_id = pc.id) AS reaction_count,
        (SELECT COUNT(*)::bigint FROM comments  WHERE target_type = 'checkin' AND target_id = pc.id) AS comment_count,
        pc.created_at
      FROM practice_checkins pc
      LEFT JOIN users u ON u.id = pc.user_id
      LEFT JOIN contacts c ON c.id = u.contact_id
      LEFT JOIN practices p ON p.id = pc.practice_id
      WHERE ${periodFilter}
      ORDER BY pc.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
  ]);

  const totalCount = Number(countResult[0]?.count ?? 0);
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    items: rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name ?? null,
      userEmail: r.user_email ?? null,
      practiceId: r.practice_id,
      practiceExternalId: r.practice_external_id ?? null,
      practiceTitle: r.practice_title ?? '(已刪除)',
      mood: r.mood ?? null,
      content: r.note ?? null,
      reactionCount: Number(r.reaction_count),
      commentCount: Number(r.comment_count),
      createdAt: r.created_at?.toISOString() ?? '',
    })),
    pagination: { totalCount, currentPage, totalPages, hasNext: currentPage < totalPages, hasPrev: currentPage > 1, limit },
  };
}

// ── Featured ──────────────────────────────────────────────────────────────────

export interface SetFeaturedOptions {
  featuredStartAt?: string | null;
  featuredEndAt?: string | null;
}

/**
 * 設定精選與排程。生效狀態由查詢時計算（is_featured AND now 在起訖區間內），
 * 到期自動失效，無需排程器。
 *
 * 排程欄位採 PATCH 語義：undefined = 保留原值、null = 清空、字串 = 設定新時間；
 * 取消精選（featured=false）時一併清空排程。
 */
export async function setContentFeatured(
  id: number,
  featured: boolean,
  options: SetFeaturedOptions = {},
): Promise<ContentPerformanceItem> {
  const current = await prisma.practices.findFirst({
    where: { id, deleted_at: null },
    select: { featured_start_at: true, featured_end_at: true },
  });
  if (!current) throw new NotFoundError('找不到此 practice');

  const resolveSchedule = (
    input: string | null | undefined,
    existing: Date | null,
    label: string,
  ): Date | null => {
    if (!featured) return null;
    if (input === undefined) return existing;
    if (input === null) return null;
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestError(`${label} 不是有效時間`);
    return parsed;
  };

  const startAt = resolveSchedule(options.featuredStartAt, current.featured_start_at, 'featuredStartAt');
  const endAt = resolveSchedule(options.featuredEndAt, current.featured_end_at, 'featuredEndAt');
  if (startAt && endAt && endAt <= startAt) throw new BadRequestError('featuredEndAt 必須晚於 featuredStartAt');

  await prisma.practices.update({
    where: { id },
    data: { is_featured: featured, featured_start_at: startAt, featured_end_at: endAt },
  });

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    external_id: string | null;
    title: string;
    creator_name: string | null;
    creator_email: string | null;
    copy_count: number;
    copied_from_title: string | null;
    view_count: bigint;
    reaction_count: bigint;
    comment_count: bigint;
    is_featured: boolean;
    featured_start_at: Date | null;
    featured_end_at: Date | null;
    featured_active: boolean;
  }>>`
    SELECT
      p.id, p.external_id, p.title,
      u.nickname AS creator_name,
      c.email AS creator_email,
      COALESCE(p.copy_count, 0) AS copy_count,
      sp.title AS copied_from_title,
      COALESCE(es.view_count, 0)::bigint AS view_count,
      (SELECT COUNT(*)::bigint FROM reactions WHERE target_type = 'practice' AND target_id = p.id) AS reaction_count,
      (SELECT COUNT(*)::bigint FROM comments  WHERE target_type = 'practice' AND target_id = p.id) AS comment_count,
      COALESCE(p.is_featured, false) AS is_featured,
      p.featured_start_at,
      p.featured_end_at,
      (COALESCE(p.is_featured, false)
        AND (p.featured_start_at IS NULL OR p.featured_start_at <= NOW())
        AND (p.featured_end_at IS NULL OR p.featured_end_at > NOW())) AS featured_active
    FROM practices p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN contacts c ON c.id = u.contact_id
    LEFT JOIN practices sp ON sp.id = p.source_practice_id
    LEFT JOIN entity_stats es ON es.entity_id = p.id AND es.entity_type = 'practice'
    WHERE p.id = ${id}
  `;

  const views = Number(row.view_count);
  return {
    id: row.id,
    externalId: row.external_id ?? null,
    title: row.title,
    creatorName: row.creator_name ?? null,
    creatorEmail: row.creator_email ?? null,
    copyCount: Number(row.copy_count),
    copiedFromTitle: row.copied_from_title ?? null,
    views,
    depth: 0,
    avgTime: 0,
    interactionRate: views > 0
      ? Math.round((Number(row.reaction_count) + Number(row.comment_count)) / views * 100)
      : 0,
    featured: row.is_featured,
    featuredStartAt: row.featured_start_at?.toISOString() ?? null,
    featuredEndAt: row.featured_end_at?.toISOString() ?? null,
    featuredActive: row.featured_active,
  };
}

// ── Curation Collections（策展合輯）─────────────────────────────────────────────

export interface CurationCollectionSummary {
  id: number;
  name: string;
  description: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CurationCollectionItem {
  id: number;
  practiceId: number;
  title: string;
  sortOrder: number;
}

export interface CurationCollectionDetail extends CurationCollectionSummary {
  items: CurationCollectionItem[];
}

export async function listCurationCollections(): Promise<CurationCollectionSummary[]> {
  const rows = await prisma.content_collections.findMany({
    include: { _count: { select: { content_collection_items: true } } },
    orderBy: { id: 'desc' },
  });
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    itemCount: r._count.content_collection_items,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at?.toISOString() ?? null,
  }));
}

export async function getCurationCollection(id: number): Promise<CurationCollectionDetail> {
  const collection = await prisma.content_collections.findUnique({
    where: { id },
    include: {
      content_collection_items: { orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] },
    },
  });
  if (!collection) throw new NotFoundError('找不到此合輯');

  const practiceIds = collection.content_collection_items.map(i => i.entity_id);
  const practices = practiceIds.length
    ? await prisma.practices.findMany({
        where: { id: { in: practiceIds } },
        select: { id: true, title: true, deleted_at: true },
      })
    : [];
  const practiceMap = new Map(practices.map(p => [p.id, p]));

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    itemCount: collection.content_collection_items.length,
    createdAt: collection.created_at.toISOString(),
    updatedAt: collection.updated_at?.toISOString() ?? null,
    items: collection.content_collection_items.map(item => {
      const practice = practiceMap.get(item.entity_id);
      return {
        id: item.id,
        practiceId: item.entity_id,
        title: practice && !practice.deleted_at ? practice.title : '(已刪除)',
        sortOrder: item.sort_order,
      };
    }),
  };
}

export async function createCurationCollection(
  name: string,
  description?: string | null,
): Promise<CurationCollectionDetail> {
  if (!name?.trim()) throw new BadRequestError('合輯名稱為必填');
  const created = await prisma.content_collections.create({
    data: { name: name.trim(), description: description?.trim() || null },
  });
  return getCurationCollection(created.id);
}

export async function updateCurationCollection(
  id: number,
  data: { name?: string; description?: string | null },
): Promise<CurationCollectionDetail> {
  if (data.name !== undefined && !data.name.trim()) throw new BadRequestError('合輯名稱不可為空');
  try {
    await prisma.content_collections.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        updated_at: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundError('找不到此合輯');
    }
    throw error;
  }
  return getCurationCollection(id);
}

export async function deleteCurationCollection(id: number): Promise<void> {
  try {
    await prisma.content_collections.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundError('找不到此合輯');
    }
    throw error;
  }
}

export async function addCurationCollectionItem(
  collectionId: number,
  practiceId: number,
): Promise<CurationCollectionDetail> {
  const collection = await prisma.content_collections.findUnique({ where: { id: collectionId } });
  if (!collection) throw new NotFoundError('找不到此合輯');

  const practice = await prisma.practices.findFirst({
    where: { id: practiceId, deleted_at: null },
    select: { id: true },
  });
  if (!practice) throw new NotFoundError('找不到此 practice');

  const maxOrder = await prisma.content_collection_items.aggregate({
    where: { collection_id: collectionId },
    _max: { sort_order: true },
  });

  try {
    await prisma.content_collection_items.create({
      data: {
        collection_id: collectionId,
        entity_type: 'practice',
        entity_id: practiceId,
        sort_order: (maxOrder._max.sort_order ?? -1) + 1,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('此內容已在合輯中');
    }
    throw error;
  }
  return getCurationCollection(collectionId);
}

export async function removeCurationCollectionItem(
  collectionId: number,
  itemId: number,
): Promise<CurationCollectionDetail> {
  const item = await prisma.content_collection_items.findFirst({
    where: { id: itemId, collection_id: collectionId },
  });
  if (!item) throw new NotFoundError('找不到此合輯項目');
  await prisma.content_collection_items.delete({ where: { id: itemId } });
  return getCurationCollection(collectionId);
}

export async function reorderCurationCollectionItems(
  collectionId: number,
  itemIds: number[],
): Promise<CurationCollectionDetail> {
  const items = await prisma.content_collection_items.findMany({
    where: { collection_id: collectionId },
    select: { id: true },
  });
  const existingIds = new Set(items.map(i => i.id));
  const uniqueInput = new Set(itemIds);
  if (
    uniqueInput.size !== itemIds.length ||
    uniqueInput.size !== existingIds.size ||
    itemIds.some(id => !existingIds.has(id))
  ) {
    throw new BadRequestError('itemIds 必須恰好包含此合輯的所有項目且不可重複');
  }

  await prisma.$transaction(
    itemIds.map((itemId, index) =>
      prisma.content_collection_items.update({
        where: { id: itemId },
        data: { sort_order: index },
      }),
    ),
  );
  return getCurationCollection(collectionId);
}
