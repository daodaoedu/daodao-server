import { Prisma } from '../../generated/prisma';
import { ForbiddenError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

interface CountRow { count: bigint }

interface CohortFeed {
  perspective: 'coach' | 'learner';
  total: number;
  pendingResponseCount: number;
  items: Array<{
    id: number;
    practiceId: number;
    userId: number;
    nickname: string | null;
    avatar: string | null;
    checkinDate: Date;
    mood: string | null;
    note: string | null;
    imageUrls: string[];
    createdAt: Date;
  }>;
}

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
      select: { id: true, practice_id: true, user_id: true, checkin_date: true, mood: true, note: true, image_urls: true, created_at: true, users: { select: { nickname: true, contacts: { select: { photo_url: true } } } } }
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
  return { perspective, total, pendingResponseCount: Number(pendingRows[0]?.count ?? 0n), items: rows.flatMap(row => row.created_at === null ? [] : [{ id: row.id, practiceId: row.practice_id, userId: row.user_id, nickname: row.users.nickname, avatar: row.users.contacts?.photo_url ?? null, checkinDate: row.checkin_date, mood: row.mood, note: row.note, imageUrls: row.image_urls, createdAt: row.created_at }]) };
};
export const cohortFeedService = { get };
