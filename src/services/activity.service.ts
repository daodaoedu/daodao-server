import { NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { COHORT_VISIBILITY } from '../constants/cohort-visibility';
import { dateOf, deriveJoinability, deriveRunStatus, today } from './cohort-run-state';

/** 探索活動頁與詳情共用的查詢欄位 */
const activitySelect = {
  id: true,
  display_name: true,
  start_date: true,
  end_date: true,
  join_deadline: true,
  join_token: true,
  join_paused: true,
  capacity: true,
  invite_message: true,
  status: true,
  visibility: true,
  program: {
    select: {
      name: true,
      description: true,
      kind: true,
      deleted_at: true,
      organization: { select: { name: true, bio: true, external_link: true, status: true } }
    }
  }
} as const;

type ActivityRow = {
  id: number;
  display_name: string;
  start_date: Date;
  end_date: Date;
  join_deadline: Date | null;
  join_token: string | null;
  join_paused: boolean;
  capacity: number | null;
  invite_message: string | null;
  status: string;
  visibility: string;
  program: {
    name: string;
    description: string | null;
    kind: string;
    deleted_at: Date | null;
    organization: { name: string; bio: string | null; external_link: string | null; status: string };
  };
};

/** 是否為可公開展示的活動：燈塔系列、已發佈、visibility=public、組織未停權 */
const isPublicActivity = (row: ActivityRow): boolean =>
  row.program.kind === PROGRAM_KINDS.LIGHTHOUSE &&
  row.program.deleted_at === null &&
  row.program.organization.status === 'active' &&
  row.status === 'published' &&
  row.visibility === COHORT_VISIBILITY.PUBLIC;

/** 批次取得已加入人數與使用者參與狀態，組出 summary；joinToken 只在可加入時回傳 */
const buildSummaries = async (rows: ActivityRow[], userId: number | null, now: Date) => {
  const cohortIds = rows.map(row => row.id);
  const [counts, joined] = await Promise.all([
    prisma.cohort_enrollments.groupBy({
      by: ['cohort_id'],
      where: { cohort_id: { in: cohortIds }, status: 'joined' },
      _count: { id: true }
    }),
    userId === null
      ? Promise.resolve([])
      : prisma.cohort_enrollments.findMany({
        where: { cohort_id: { in: cohortIds }, user_id: userId, status: 'joined' },
        select: { cohort_id: true }
      })
  ]);
  const countByCohort = new Map(counts.map(row => [row.cohort_id, row._count.id]));
  const joinedSet = new Set(joined.map(row => row.cohort_id));

  return rows.map(row => {
    const participantCount = countByCohort.get(row.id) ?? 0;
    const joinability = deriveJoinability(row, participantCount, now);
    return {
      id: row.id,
      displayName: row.display_name,
      programName: row.program.name,
      description: row.program.description,
      organizationName: row.program.organization.name,
      startDate: row.start_date,
      endDate: row.end_date,
      joinDeadline: row.join_deadline,
      capacity: row.capacity,
      participantCount,
      runStatus: deriveRunStatus(row.start_date, row.end_date, now),
      canJoin: joinability.canJoin,
      unavailableReason: joinability.unavailableReason,
      isJoined: joinedSet.has(row.id),
      joinToken: joinability.canJoin ? row.join_token : null
    };
  });
};

/** 探索活動頁：列出組織公開、已發佈且未結束的燈塔期（未登入可看） */
const list = async (userId: number | null, now = new Date()) => {
  const rows = await prisma.cohorts.findMany({
    where: {
      status: 'published',
      visibility: COHORT_VISIBILITY.PUBLIC,
      end_date: { gte: dateOf(today(now)) },
      program: { kind: PROGRAM_KINDS.LIGHTHOUSE, deleted_at: null, organization: { status: 'active' } }
    },
    select: activitySelect,
    orderBy: { start_date: 'asc' }
  });
  return buildSummaries(rows, userId, now);
};

/** 活動詳情（公開；已結束仍可查看） */
const getDetail = async (cohortId: number, userId: number | null, now = new Date()) => {
  const row = await prisma.cohorts.findUnique({ where: { id: cohortId }, select: activitySelect });
  if (!row || !isPublicActivity(row)) throw new NotFoundError('找不到活動');
  const [summary] = await buildSummaries([row], userId, now);
  return {
    ...summary,
    organization: { name: row.program.organization.name, bio: row.program.organization.bio, externalLink: row.program.organization.external_link },
    inviteMessage: row.invite_message
  };
};

export const activityService = { list, getDetail };
