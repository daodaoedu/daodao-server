import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import { loggerService } from './logging/logger.service';
import { prisma } from './database/prisma.service';
import { ensureCohortDrafts } from './cohort-draft.service';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { dateOf, deriveJoinability, deriveRunStatus, today } from './cohort-run-state';

/** 探索頁與詳情共用的查詢欄位 */
const challengeSelect = {
  id: true,
  display_name: true,
  start_date: true,
  end_date: true,
  join_deadline: true,
  join_paused: true,
  capacity: true,
  status: true,
  program: { select: { name: true, description: true, kind: true, archived_at: true, deleted_at: true } }
} as const;

type ChallengeRow = {
  id: number;
  display_name: string;
  start_date: Date;
  end_date: Date;
  join_deadline: Date | null;
  join_paused: boolean;
  capacity: number | null;
  status: string;
  program: { name: string; description: string | null; kind: string; archived_at: Date | null; deleted_at: Date | null };
};

export { deriveRunStatus } from './cohort-run-state';

/** 批次取得已加入人數、使用者參與狀態與卡組指派，組出 summary */
const buildSummaries = async (rows: ChallengeRow[], userId: number | null, now: Date) => {
  const cohortIds = rows.map(row => row.id);
  const [counts, joined, deckAssignments] = await Promise.all([
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
      }),
    prisma.inspiration_deck_assignments.findMany({
      // 卡組軟刪後指派可能仍在：與抽卡查詢一致，只算未刪除的卡組，避免顯示抽卡入口卻抽不到卡
      where: { cohort_id: { in: cohortIds }, unassigned_at: null, deck: { deleted_at: null } },
      select: { cohort_id: true }
    })
  ]);
  const countByCohort = new Map(counts.map(row => [row.cohort_id, row._count.id]));
  const joinedSet = new Set(joined.map(row => row.cohort_id));
  const deckSet = new Set(deckAssignments.map(row => row.cohort_id));

  return rows.map(row => {
    const participantCount = countByCohort.get(row.id) ?? 0;
    const joinability = deriveJoinability(row, participantCount, now);
    return {
      id: row.id,
      displayName: row.display_name,
      programName: row.program.name,
      description: row.program.description,
      startDate: row.start_date,
      endDate: row.end_date,
      joinDeadline: row.join_deadline,
      participantCount,
      runStatus: deriveRunStatus(row.start_date, row.end_date, now),
      canJoin: joinability.canJoin,
      unavailableReason: joinability.unavailableReason,
      isJoined: joinedSet.has(row.id),
      hasInspirationDeck: deckSet.has(row.id)
    };
  });
};

/** 我參加的共同挑戰（含已結束）：依開始日新到舊，附我在該挑戰自動複製的實踐 */
const listMine = async (userId: number, now = new Date()) => {
  const rows = await prisma.cohorts.findMany({
    where: {
      program: { kind: PROGRAM_KINDS.CHALLENGE, archived_at: null, deleted_at: null },
      cohort_enrollments: { some: { user_id: userId, status: 'joined' } }
    },
    select: challengeSelect,
    orderBy: { start_date: 'desc' }
  });
  if (rows.length === 0) return [];
  const [summaries, practices] = await Promise.all([
    buildSummaries(rows, userId, now),
    prisma.practices.findMany({
      where: { user_id: userId, deleted_at: null, creation_source: 'cohort_template', cohort_id: { in: rows.map(row => row.id) } },
      select: { cohort_id: true, external_id: true, id: true, _count: { select: { practice_checkins: true } } },
      orderBy: { created_at: 'asc' }
    })
  ]);
  const practiceByCohort = new Map<number | null, { externalId: string; checkInCount: number }>();
  for (const practice of practices) {
    if (practice.external_id && !practiceByCohort.has(practice.cohort_id)) {
      practiceByCohort.set(practice.cohort_id, { externalId: practice.external_id, checkInCount: practice._count.practice_checkins });
    }
  }
  return summaries.map(summary => {
    const linked = practiceByCohort.get(summary.id);
    return { ...summary, practiceId: linked?.externalId ?? null, checkInCount: linked?.checkInCount ?? 0 };
  });
};

/** 探索共同挑戰頁：列出已發佈且未結束的挑戰（未登入可看） */
const list = async (userId: number | null, now = new Date()) => {
  const rows = await prisma.cohorts.findMany({
    where: {
      status: 'published',
      end_date: { gte: dateOf(today(now)) },
      program: { kind: PROGRAM_KINDS.CHALLENGE, archived_at: null, deleted_at: null }
    },
    select: challengeSelect,
    orderBy: { start_date: 'asc' }
  });
  return buildSummaries(rows, userId, now);
};

/** 挑戰詳情：已發佈即可看，含已結束（歷史足跡） */
const getDetail = async (challengeId: number, userId: number | null, now = new Date()) => {
  const row = await prisma.cohorts.findUnique({ where: { id: challengeId }, select: challengeSelect });
  if (!row || row.program.kind !== PROGRAM_KINDS.CHALLENGE || row.program.archived_at !== null || row.program.deleted_at !== null || row.status !== 'published') {
    throw new NotFoundError('找不到共同挑戰');
  }
  const [summary] = await buildSummaries([row], userId, now);
  const binding = await prisma.cohort_templates.findFirst({
    where: { cohort_id: challengeId, unbound_at: null },
    select: { practice_template: { select: { title: true, practice_action: true } } },
    orderBy: { bound_at: 'asc' }
  });
  return {
    ...summary,
    template: binding === null
      ? null
      : { title: binding.practice_template.title, practiceAction: binding.practice_template.practice_action }
  };
};

/**
 * 加入共同挑戰：公開加入（無邀請 token），建立參與記錄並自動複製綁定模板為個人實踐。
 * 挑戰無主揪/教練角色，不發加入通知。
 */
const join = async (challengeId: number, userId: number, now = new Date()) => {
  const row = await prisma.cohorts.findUnique({ where: { id: challengeId }, select: challengeSelect });
  if (!row || row.program.kind !== PROGRAM_KINDS.CHALLENGE || row.program.archived_at !== null || row.program.deleted_at !== null || row.status !== 'published') {
    throw new NotFoundError('找不到共同挑戰');
  }
  const user = await prisma.users.findUnique({ where: { id: userId }, select: { contacts: { select: { email: true } } } });
  const email = user?.contacts?.email?.trim().toLowerCase();
  if (!email) throw new BadRequestError('帳號缺少可用 email，無法加入');

  const result = await prisma.$transaction(async tx => {
    const [cohort] = await tx.$queryRaw<Array<{ id: number; capacity: number | null }>>`
      SELECT id, capacity FROM cohorts WHERE id = ${challengeId} FOR UPDATE
    `;
    if (!cohort) throw new NotFoundError('找不到共同挑戰');

    const participantCount = await tx.cohort_enrollments.count({ where: { cohort_id: challengeId, status: 'joined' } });
    const joinability = deriveJoinability(row, participantCount, now);
    if (!joinability.canJoin) {
      const messages = { ended: '此挑戰已結束，不再接受新加入', expired: '此挑戰的加入期限已截止', full: '此挑戰已額滿', paused: '此挑戰目前暫停加入' } as const;
      throw new ConflictError(messages[joinability.unavailableReason!]);
    }

    const existing = await tx.cohort_enrollments.findFirst({
      where: { cohort_id: challengeId, user_id: userId },
      select: { id: true, status: true }
    });
    if (existing?.status === 'joined') throw new ConflictError('你已加入此挑戰');

    const enrollment = existing
      ? await tx.cohort_enrollments.update({
        where: { id: existing.id },
        data: { status: 'joined', joined_at: now, exited_at: null },
        select: { id: true, cohort_id: true }
      })
      : await tx.cohort_enrollments.upsert({
        where: { cohort_id_email: { cohort_id: challengeId, email } },
        create: { cohort_id: challengeId, email, user_id: userId, status: 'joined', role: 'member', joined_at: now },
        update: { user_id: userId, status: 'joined', joined_at: now, exited_at: null },
        select: { id: true, cohort_id: true }
      });
    // 共同挑戰沒有「啟用草稿」步驟：依挑戰期間直接給未開始／進行中，草稿不能打卡（daodao#295）
    const practiceStatus = deriveRunStatus(row.start_date, row.end_date, now) === 'upcoming' ? 'not_started' : 'active';
    await ensureCohortDrafts(tx, challengeId, userId, { status: practiceStatus });
    const practice = await tx.practices.findFirst({
      where: { cohort_id: challengeId, user_id: userId, creation_source: 'cohort_template', deleted_at: null },
      select: { external_id: true },
      orderBy: { created_at: 'asc' }
    });
    return { enrollmentId: enrollment.id, cohortId: enrollment.cohort_id, practiceExternalId: practice?.external_id ?? null };
  });

  // Welcome 信（CE01）：加入後立即寄送；enqueue 失敗不影響加入結果
  try {
    const { enqueueChallengeWelcomeEmail } = await import('../queues/challenge-email.queue');
    await enqueueChallengeWelcomeEmail(result.cohortId, userId);
  } catch (error) {
    loggerService.error('Failed to enqueue challenge welcome email', {
      cohortId: result.cohortId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return {
    enrollmentId: result.enrollmentId,
    cohortId: result.cohortId,
    status: 'joined' as const,
    practiceId: result.practiceExternalId
  };
};

export const challengeService = { list, listMine, getDetail, join, deriveRunStatus };
