import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { ensureCohortDrafts } from './cohort-draft.service';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { notificationEventService } from './notification-event.service';
import { INITIAL_PROGRESS } from '../utils/practice-progress';

const visibilityNotice = '加入後，你的本期打卡內容將對教練與同期學員可見。';
const cohortSelect = {
  id: true,
  display_name: true,
  start_date: true,
  end_date: true,
  join_deadline: true,
  capacity: true,
  invite_message: true,
  status: true,
  program: { select: { organization: { select: { name: true, bio: true, external_link: true } } } }
} as const;
const day = (value: Date): string => value.toISOString().slice(0, 10);

const resolveJoinTarget = async (token: string) => {
  const cohort = await prisma.cohorts.findUnique({ where: { join_token: token }, select: cohortSelect });
  if (cohort) return { cohort, invitation: null };

  const invitation = await prisma.cohort_enrollments.findUnique({
    where: { invite_token: token },
    select: { id: true, user_id: true, status: true, cohort: { select: cohortSelect } }
  });
  if (!invitation) throw new NotFoundError('邀請連結不存在或已失效');
  return {
    cohort: invitation.cohort,
    invitation: { id: invitation.id, userId: invitation.user_id, status: invitation.status }
  };
};

const getJoinInfoForTarget = async (target: Awaited<ReturnType<typeof resolveJoinTarget>>, now: Date) => {
  const { cohort } = target;
  const deadline = cohort.join_deadline ?? cohort.end_date;
  const joined = cohort.capacity === null ? 0 : await prisma.cohort_enrollments.count({ where: { cohort_id: cohort.id, status: 'joined' } });
  const unavailableReason = cohort.status !== 'published' ? 'not_published' as const
    : day(now) > day(deadline) ? 'expired' as const
      : cohort.capacity !== null && joined >= cohort.capacity ? 'full' as const : null;
  return {
    cohortId: cohort.id, displayName: cohort.display_name, startDate: cohort.start_date, endDate: cohort.end_date,
    inviteMessage: cohort.invite_message, canJoin: unavailableReason === null, unavailableReason, visibilityNotice,
    organization: { name: cohort.program.organization.name, bio: cohort.program.organization.bio, externalLink: cohort.program.organization.external_link }
  };
};
const getJoinInfo = async (token: string, now = new Date()) => getJoinInfoForTarget(await resolveJoinTarget(token), now);

const join = async (token: string, userId: number, consent: boolean, now = new Date()) => {
  if (!consent) throw new BadRequestError('必須同意本期內容可見範圍');
  const target = await resolveJoinTarget(token);
  const info = await getJoinInfoForTarget(target, now);
  if (!info.canJoin) {
    const messages = { not_published: '此期尚未發布', expired: '邀請連結已過期', full: '此期已額滿' } as const;
    throw new ConflictError(messages[info.unavailableReason!]);
  }
  let email: string | undefined;
  if (!target.invitation) {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { contacts: { select: { email: true } } } });
    email = user?.contacts?.email?.trim().toLowerCase();
    if (!email) throw new BadRequestError('帳號缺少可用 email，無法加入');
  }

  const result = await prisma.$transaction(async tx => {
    const [cohort] = await tx.$queryRaw<Array<{ id: number; capacity: number | null }>>`
      SELECT id, capacity FROM cohorts WHERE id = ${info.cohortId} FOR UPDATE
    `;
    if (!cohort) throw new NotFoundError('找不到期');

    if (target.invitation) {
      const invitation = await tx.cohort_enrollments.findUnique({
        where: { id: target.invitation.id },
        select: { id: true, cohort_id: true, user_id: true, status: true }
      });
      if (!invitation || invitation.cohort_id !== cohort.id) throw new NotFoundError('邀請連結不存在或已失效');
      if (invitation.status === 'joined') {
        if (invitation.user_id !== userId) throw new ConflictError('此邀請已由其他帳號使用');
        return { enrollmentId: invitation.id, cohortId: invitation.cohort_id, status: 'joined' as const, newlyJoined: false };
      }
      if (invitation.status !== 'invited') throw new ConflictError('此邀請已失效');
    }

    if (cohort.capacity !== null) {
      const joined = await tx.cohort_enrollments.count({ where: { cohort_id: cohort.id, status: 'joined' } });
      if (joined >= cohort.capacity) throw new ConflictError('此期已額滿');
    }
    const enrollment = target.invitation
      ? await tx.cohort_enrollments.update({
        where: { id: target.invitation.id },
        data: { user_id: userId, status: 'joined', joined_at: now, exited_at: null },
        select: { id: true, cohort_id: true, status: true }
      })
      : await tx.cohort_enrollments.upsert({
        where: { cohort_id_email: { cohort_id: cohort.id, email: email! } },
        create: { cohort_id: cohort.id, email: email!, user_id: userId, status: 'joined', role: 'member', joined_at: now },
        update: { user_id: userId, status: 'joined', joined_at: now, exited_at: null },
        select: { id: true, cohort_id: true, status: true }
      });
    await ensureCohortDrafts(tx, cohort.id, userId);
    return { enrollmentId: enrollment.id, cohortId: enrollment.cohort_id, status: 'joined' as const, newlyJoined: true };
  });

  if (!result.newlyJoined) {
    return { enrollmentId: result.enrollmentId, cohortId: result.cohortId, status: result.status };
  }
  const coaches = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: result.cohortId, status: 'joined', role: { in: ['owner', 'assistant'] }, user_id: { not: null } },
    select: { user_id: true }
  });
  await Promise.all(coaches.flatMap(coach => coach.user_id === null ? [] : [notificationEventService.createEvent({
    type: NOTIFICATION_TYPES.COHORT_JOINED,
    actorId: userId,
    recipientId: coach.user_id,
    entityType: 'cohort',
    entityId: result.cohortId,
    payload: { message: '有一位學員加入了本期。', enrollmentId: result.enrollmentId },
    priority: 'P1'
  })]));
  return { enrollmentId: result.enrollmentId, cohortId: result.cohortId, status: result.status };
};
const getMemberHome = async (cohortId: number, userId: number) => {
  const enrollment = await prisma.cohort_enrollments.findFirst({
    where: { cohort_id: cohortId, user_id: userId, status: 'joined' },
    select: {
      id: true,
      export_opt_in: true,
      cohort: { select: { id: true, display_name: true, start_date: true, end_date: true, program: { select: { organization: { select: { name: true, bio: true, external_link: true } } } } } }
    }
  });
  if (!enrollment) throw new NotFoundError('找不到已加入的期');
  const practices = await prisma.practices.findMany({
    where: { cohort_id: cohortId, user_id: userId, deleted_at: null },
    select: {
      id: true, external_id: true, title: true, practice_action: true, status: true, creation_source: true,
      start_date: true, end_date: true, progress_percentage: true, theme_color: true
    },
    orderBy: { created_at: 'asc' }
  });
  const checkins = await prisma.practice_checkins.groupBy({
    by: ['practice_id'],
    where: { practice_id: { in: practices.map(practice => practice.id) } },
    _count: { id: true },
    _max: { checkin_date: true }
  });
  const checkinByPracticeId = new Map(checkins.map(row => [row.practice_id, row]));
  const organization = enrollment.cohort.program.organization;
  return {
    cohortId: enrollment.cohort.id,
    displayName: enrollment.cohort.display_name,
    startDate: enrollment.cohort.start_date,
    endDate: enrollment.cohort.end_date,
    exportOptIn: enrollment.export_opt_in,
    organization: { name: organization.name, bio: organization.bio, externalLink: organization.external_link },
    practices: practices.flatMap(practice => practice.external_id === null ? [] : [{
      id: practice.external_id,
      title: practice.title,
      practiceAction: practice.practice_action,
      status: practice.status ?? 'draft',
      creationSource: practice.creation_source,
      startDate: practice.start_date,
      endDate: practice.end_date,
      progressPercentage: practice.progress_percentage ? Number(practice.progress_percentage) : INITIAL_PROGRESS,
      checkInCount: checkinByPracticeId.get(practice.id)?._count.id ?? 0,
      lastCheckinAt: checkinByPracticeId.get(practice.id)?._max.checkin_date ?? null,
      themeColor: practice.theme_color
    }])
  };
};
const listMyCohorts = async (userId: number) => {
  const enrollments = await prisma.cohort_enrollments.findMany({
    where: { user_id: userId, status: 'joined' },
    select: {
      joined_at: true,
      cohort: {
        select: {
          id: true,
          display_name: true,
          start_date: true,
          end_date: true,
          status: true,
          program: { select: { name: true, organization: { select: { name: true } } } },
        },
      },
    },
    orderBy: { joined_at: 'desc' },
  });
  return enrollments.map(e => ({
    cohortId: e.cohort.id,
    displayName: e.cohort.display_name,
    startDate: e.cohort.start_date,
    endDate: e.cohort.end_date,
    status: e.cohort.status,
    joinedAt: e.joined_at,
    programName: e.cohort.program.name,
    organizationName: e.cohort.program.organization.name,
  }));
};
export const cohortJoinService = { getJoinInfo, join, getMemberHome, listMyCohorts };
