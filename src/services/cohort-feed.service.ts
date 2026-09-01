import { Prisma } from '../../generated/prisma';
import { ForbiddenError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

interface CountRow { count: bigint }

interface CommentPreviewUser {
  id: string;
  name: string;
  photoUrl: string | null;
  customId: string | null;
}

interface CommentPreview {
  id: string;
  content: string;
  createdAt: string;
  user?: CommentPreviewUser;
}

interface CohortFeedItem {
  id: string;
  checkinDate: string;
  mood: string | null;
  note: string;
  tags: string[];
  imageUrls: string[];
  createdAt: string;
  practice: { id: string; title: string };
  user?: {
    id: string;
    name: string;
    photoUrl: string | null;
    customId: string | null;
  };
  commentCount: number;
  commentPreview: CommentPreview[];
}

interface CohortFeed {
  perspective: 'coach' | 'learner';
  total: number;
  pendingResponseCount: number;
  items: CohortFeedItem[];
}

const COMMENT_PREVIEW_LIMIT = 2;

const get = async (
  cohortId: number,
  actorId: number,
  limit: number,
  offset: number,
  programId?: number
): Promise<CohortFeed> => {
  const access = await prisma.cohorts.findFirst({
    where: { id: cohortId, ...(programId === undefined ? {} : { program_id: programId }), OR: [
      { program: { organization: { organization_members: { some: { user_id: actorId } } } } },
      { cohort_enrollments: { some: { user_id: actorId, status: 'joined' } } }
    ] },
    select: { program: { select: { organization: { select: { organization_members: { where: { user_id: actorId }, select: { id: true } } } } } } }
  });
  if (!access) throw new ForbiddenError('無權限查看本期動態');
  const perspective = access.program.organization.organization_members.length > 0 ? 'coach' as const : 'learner' as const;
  const where = { practices: { cohort_id: cohortId, deleted_at: null }, created_at: { not: null } } as const;
  const [rows, total, pendingRows] = await Promise.all([
    prisma.practice_checkins.findMany({
      where, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: limit, skip: offset,
      select: {
        id: true,
        practice_id: true,
        user_id: true,
        checkin_date: true,
        mood: true,
        note: true,
        image_urls: true,
        created_at: true,
        practices: { select: { external_id: true, title: true } },
        users: {
          select: {
            external_id: true,
            nickname: true,
            custom_id: true,
            contacts: { select: { photo_url: true } },
          },
        },
      },
    }),
    prisma.practice_checkins.count({ where }),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM practice_checkins pc
      JOIN practices p ON p.id = pc.practice_id
      WHERE p.cohort_id = ${cohortId}
        AND p.deleted_at IS NULL
        AND pc.created_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM comments c
          WHERE c.target_type = 'checkin' AND c.target_id = pc.id
        )
    `)
  ]);

  const checkinIds = rows.map(r => r.id);

  const [commentCounts, commentPreviews] = checkinIds.length > 0
    ? await Promise.all([
        prisma.comments.groupBy({
          by: ['target_id'],
          where: { target_type: 'checkin', target_id: { in: checkinIds } },
          _count: true,
        }),
        prisma.comments.findMany({
          where: { target_type: 'checkin', target_id: { in: checkinIds }, parent_id: null },
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            target_id: true,
            content: true,
            created_at: true,
            users: {
              select: {
                external_id: true,
                nickname: true,
                custom_id: true,
                contacts: { select: { photo_url: true } },
              },
            },
          },
        }),
      ])
    : [[], []];

  const countMap = new Map(commentCounts.map(c => [c.target_id, c._count]));

  const previewMap = new Map<number, CommentPreview[]>();
  for (const c of commentPreviews) {
    const existing = previewMap.get(c.target_id) ?? [];
    if (existing.length >= COMMENT_PREVIEW_LIMIT) continue;
    existing.push({
      id: String(c.id),
      content: c.content,
      createdAt: c.created_at?.toISOString() ?? new Date().toISOString(),
      user: c.users ? {
        id: c.users.external_id ?? String(c.target_id),
        name: c.users.nickname ?? '',
        photoUrl: c.users.contacts?.photo_url ?? null,
        customId: c.users.custom_id ?? null,
      } : undefined,
    });
    previewMap.set(c.target_id, existing);
  }

  const items: CohortFeedItem[] = rows.flatMap(row => {
    if (row.created_at === null) return [];
    return [{
      id: String(row.id),
      checkinDate: row.checkin_date.toISOString().split('T')[0],
      mood: row.mood,
      note: row.note ?? '',
      tags: [],
      imageUrls: row.image_urls,
      createdAt: row.created_at.toISOString(),
      practice: {
        id: row.practices.external_id ?? String(row.practice_id),
        title: row.practices.title,
      },
      user: row.users ? {
        id: row.users.external_id ?? String(row.user_id),
        name: row.users.nickname ?? '',
        photoUrl: row.users.contacts?.photo_url ?? null,
        customId: row.users.custom_id ?? null,
      } : undefined,
      commentCount: countMap.get(row.id) ?? 0,
      commentPreview: previewMap.get(row.id) ?? [],
    }];
  });

  return { perspective, total, pendingResponseCount: Number(pendingRows[0]?.count ?? 0n), items };
};
export const cohortFeedService = { get };
