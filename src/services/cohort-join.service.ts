import { cohortRecurrenceRuleSchema } from '../validators/cohort.validators';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { ensureCohortDrafts } from './cohort-draft.service';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { notificationEventService } from './notification-event.service';
import { INITIAL_PROGRESS } from '../utils/practice-progress';
import { appendSystemMessage } from './chat-room.service';
import { CHAT_SYSTEM_EVENTS } from '../constants/chat';
import { getCohortUnavailableReasons } from '../domain/cohort.rules';

const visibilityNotice = '加入後，你的本期打卡內容將對教練與同期學員可見。';
const cohortSelect = {
  id: true,
  display_name: true,
  start_date: true,
  end_date: true,
  join_deadline: true,
  capacity: true,
  invite_message: true,
  show_invite_message_on_signup: true,
  tagline: true,
  timezone: true,
  interaction_modes: true,
  meeting_url: true,
  location: true,
  fee_type: true,
  fee_amount: true,
  signup_method: true,
  external_signup_url: true,
  is_private: true,
  checkin_default_private: true,
  host_comment_default_private: true,
  status: true,
  join_paused: true,
  cohort_sessions: {
    select: { id: true, session_date: true, start_time: true, end_time: true, position: true, recurrence_group_id: true, recurrence_rule: true },
    orderBy: { position: 'asc' as const }
  },
  program: { select: { organization: { select: { name: true, bio: true, external_link: true } } } }
} as const;
const day = (value: Date): string => value.toISOString().slice(0, 10);

/** 格式化 TIME 欄位為 HH:MM */
const formatTime = (value: Date | null): string | null => {
  if (!value) return null;
  return value.toISOString().slice(11, 16);
};

const mapSessions = (sessions: Array<{ id: number; session_date: Date; start_time: Date | null; end_time: Date | null; position: number; recurrence_group_id?: string | null; recurrence_rule?: unknown }>) =>
  sessions.map(s => ({
    id: s.id,
    sessionDate: day(s.session_date),
    startTime: formatTime(s.start_time),
    endTime: formatTime(s.end_time),
    recurrenceGroupId: s.recurrence_group_id ?? null,
    recurrenceRule: s.recurrence_rule ? cohortRecurrenceRuleSchema.parse(s.recurrence_rule) : null
  }));

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
  const participantCount = await prisma.cohort_enrollments.count({ where: { cohort_id: cohort.id, status: 'joined' } });
  // 暫停加入只擋「公開加入連結」；帶邀請 token 的受邀者仍可加入（FR-RS-02：新成員需要邀請信才能加入）
  const unavailableReasons = getCohortUnavailableReasons({
    status: cohort.status, endDate: cohort.end_date, joinDeadline: cohort.join_deadline, capacity: cohort.capacity,
    participantCount, joinPaused: cohort.join_paused, hasInvitation: target.invitation !== null, now
  });
  const unavailableReason = unavailableReasons[0] ?? null;

  // inviteMessage 只在 showInviteMessageOnSignup=true 時回傳
  const inviteMessage = cohort.show_invite_message_on_signup ? cohort.invite_message : null;

  return {
    cohortId: cohort.id, displayName: cohort.display_name, startDate: cohort.start_date, endDate: cohort.end_date,
    tagline: cohort.tagline,
    interactionModes: cohort.interaction_modes,
    timezone: cohort.timezone ?? 'Asia/Taipei',
    location: cohort.location,
    sessions: mapSessions(cohort.cohort_sessions),
    feeType: cohort.fee_type,
    feeAmount: cohort.fee_amount,
    signupMethod: cohort.signup_method,
    externalSignupUrl: cohort.external_signup_url,
    capacity: cohort.capacity,
    joinDeadline: cohort.join_deadline,
    participantCount,
    inviteMessage, canJoin: unavailableReason === null, unavailableReason, unavailableReasons,
    privacy: {
      isPrivate: cohort.is_private,
      checkinDefaultPrivate: cohort.checkin_default_private,
      hostCommentDefaultPrivate: cohort.host_comment_default_private
    },
    visibilityNotice,
    organization: { name: cohort.program.organization.name, bio: cohort.program.organization.bio, externalLink: cohort.program.organization.external_link }
  };
};
const getJoinInfo = async (token: string, now = new Date()) => getJoinInfoForTarget(await resolveJoinTarget(token), now);

const join = async (token: string, userId: number, consent: boolean, now = new Date()) => {
  if (!consent) throw new BadRequestError('必須同意本期內容可見範圍');
  const target = await resolveJoinTarget(token);
  const info = await getJoinInfoForTarget(target, now);
  if (!info.canJoin) {
    const messages = { not_published: '此場次尚未發布', expired: '邀請連結已過期', full: '此場次已額滿', paused: '此場次目前已暫停加入，請透過邀請信加入' } as const;
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
  // 聊天室系統訊息：成員加入（best-effort）
  try {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { nickname: true } });
    await appendSystemMessage(result.cohortId, CHAT_SYSTEM_EVENTS.MEMBER_JOINED, { id: userId, nickname: user?.nickname ?? null });
  } catch (error) {
    console.error('appendSystemMessage (member_joined) failed:', error);
  }
  return { enrollmentId: result.enrollmentId, cohortId: result.cohortId, status: result.status };
};
const getMemberHome = async (cohortId: number, userId: number) => {
  const enrollment = await prisma.cohort_enrollments.findFirst({
    where: { cohort_id: cohortId, user_id: userId, status: 'joined' },
    select: {
      id: true,
      export_opt_in: true,
      cohort: {
        select: {
          id: true, display_name: true, start_date: true, end_date: true,
          tagline: true, timezone: true, interaction_modes: true, meeting_url: true, location: true,
          fee_type: true, is_private: true, checkin_default_private: true, host_comment_default_private: true,
          cohort_sessions: {
            select: { id: true, session_date: true, start_time: true, end_time: true, position: true, recurrence_group_id: true, recurrence_rule: true },
            orderBy: { position: 'asc' as const }
          },
          program: { select: { organization: { select: { name: true, bio: true, external_link: true } } } }
        }
      }
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
  const cohort = enrollment.cohort;
  return {
    cohortId: cohort.id,
    displayName: cohort.display_name,
    startDate: cohort.start_date,
    endDate: cohort.end_date,
    tagline: cohort.tagline,
    interactionModes: cohort.interaction_modes,
    timezone: cohort.timezone ?? 'Asia/Taipei',
    meetingUrl: cohort.meeting_url,
    location: cohort.location,
    sessions: mapSessions(cohort.cohort_sessions),
    feeType: cohort.fee_type,
    privacy: {
      isPrivate: cohort.is_private,
      checkinDefaultPrivate: cohort.checkin_default_private,
      hostCommentDefaultPrivate: cohort.host_comment_default_private
    },
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
          timezone: true,
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
    timezone: e.cohort.timezone ?? 'Asia/Taipei',
    status: e.cohort.status,
    joinedAt: e.joined_at,
    programName: e.cohort.program.name,
    organizationName: e.cohort.program.organization.name,
  }));
};
export const cohortJoinService = { getJoinInfo, join, getMemberHome, listMyCohorts };
