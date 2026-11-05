import { cohortRecurrenceRuleSchema } from '../validators/cohort.validators';
import { NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { COHORT_VISIBILITY } from '../constants/cohort-visibility';
import { ACTIVITY_ENDED_LIMIT } from '../constants/activity';
import { dateOf, deriveJoinability, deriveRunStatus, today } from './cohort-run-state';
import type { ActivityHost } from '../validators/activity.validator';

/** 探索活動頁與詳情共用的查詢欄位 */
const activitySelect = {
  id: true,
  display_name: true,
  tagline: true,
  start_date: true,
  end_date: true,
  join_deadline: true,
  join_token: true,
  join_paused: true,
  capacity: true,
  invite_message: true,
  timezone: true,
  interaction_modes: true,
  fee_type: true,
  fee_amount: true,
  signup_method: true,
  external_signup_url: true,
  location: true,
  status: true,
  visibility: true,
  cohort_sessions: {
    select: { id: true, session_date: true, start_time: true, end_time: true, position: true, recurrence_group_id: true, recurrence_rule: true },
    orderBy: { position: 'asc' as const }
  },
  program: {
    select: {
      name: true,
      description: true,
      kind: true,
      archived_at: true,
      deleted_at: true,
      organization_id: true,
      organization: { select: { id: true, name: true, bio: true, external_link: true, status: true } }
    }
  }
} as const;

type ActivityRow = {
  id: number;
  display_name: string;
  tagline: string | null;
  start_date: Date;
  end_date: Date;
  join_deadline: Date | null;
  join_token: string | null;
  join_paused: boolean;
  capacity: number | null;
  invite_message: string | null;
  timezone: string;
  interaction_modes: string[];
  fee_type: string;
  fee_amount: number | null;
  signup_method: string;
  external_signup_url: string | null;
  location: string | null;
  status: string;
  visibility: string;
  cohort_sessions: Array<{ id: number; session_date: Date; start_time: Date | null; end_time: Date | null; position: number; recurrence_group_id?: string | null; recurrence_rule?: unknown }>;
  program: {
    name: string;
    description: string | null;
    kind: string;
    archived_at: Date | null;
    deleted_at: Date | null;
    organization_id: number;
    organization: { id: number; name: string; bio: string | null; external_link: string | null; status: string };
  };
};

/** 格式化 TIME 欄位為 HH:MM */
const formatTime = (value: Date | null): string | null => {
  if (!value) return null;
  return value.toISOString().slice(11, 16);
};

/** 格式化 DATE 欄位為 YYYY-MM-DD */
const formatDate = (value: Date): string => value.toISOString().slice(0, 10);

const mapSessions = (sessions: Array<{ id: number; session_date: Date; start_time: Date | null; end_time: Date | null; position: number; recurrence_group_id?: string | null; recurrence_rule?: unknown }>) =>
  sessions.map(s => ({
    id: s.id,
    sessionDate: formatDate(s.session_date),
    startTime: formatTime(s.start_time),
    endTime: formatTime(s.end_time),
    recurrenceGroupId: s.recurrence_group_id ?? null,
    recurrenceRule: s.recurrence_rule ? cohortRecurrenceRuleSchema.parse(s.recurrence_rule) : null
  }));

/** 是否為可公開展示的活動：燈塔系列、已發佈、visibility=public、組織未停權 */
const isPublicActivity = (row: ActivityRow): boolean =>
  row.program.kind === PROGRAM_KINDS.LIGHTHOUSE &&
  row.program.archived_at === null &&
  row.program.deleted_at === null &&
  row.program.organization.status === 'active' &&
  row.status === 'published' &&
  row.visibility === COHORT_VISIBILITY.PUBLIC;

/**
 * 三層 fallback 發起人解析（批次）：
 * 1. cohort_enrollments 中 role='owner'、status='joined'、user_id 非空，取最早 joined_at
 * 2. organization_members 中 role='owner'，取最早 created_at
 * 3. userId=null, name=組織名稱
 */
const resolveHosts = async (rows: ActivityRow[]): Promise<Map<number, ActivityHost>> => {
  const cohortIds = rows.map(r => r.id);
  if (cohortIds.length === 0) return new Map();

  // Layer 1: cohort enrollment owners
  const enrollmentOwners = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: { in: cohortIds }, status: 'joined', role: 'owner', user_id: { not: null } },
    select: {
      cohort_id: true, user_id: true, joined_at: true,
      user: {
        select: {
          nickname: true, external_id: true, custom_id: true,
          contacts: { select: { photo_url: true } }
        }
      }
    },
    orderBy: { joined_at: 'asc' }
  });

  const hostMap = new Map<number, ActivityHost>();
  for (const eo of enrollmentOwners) {
    if (hostMap.has(eo.cohort_id)) continue;
    const user = eo.user;
    if (!user) continue;
    hostMap.set(eo.cohort_id, {
      userId: eo.user_id!,
      name: user.nickname || rows.find(r => r.id === eo.cohort_id)!.program.organization.name,
      avatar: user.contacts?.photo_url ?? null,
      identifier: user.custom_id ?? user.external_id ?? null
    });
  }

  // Layer 2: organization owners (for cohorts without enrollment owner)
  const missingCohorts = rows.filter(r => !hostMap.has(r.id));
  if (missingCohorts.length > 0) {
    const orgIds = [...new Set(missingCohorts.map(r => r.program.organization.id))];
    const orgOwners = await prisma.organization_members.findMany({
      where: { organization_id: { in: orgIds }, role: 'owner' },
      select: {
        organization_id: true,
        user_id: true,
        created_at: true,
        user: {
          select: {
            nickname: true, external_id: true, custom_id: true,
            contacts: { select: { photo_url: true } }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    const orgOwnerMap = new Map<number, typeof orgOwners[0]>();
    for (const oo of orgOwners) {
      if (!orgOwnerMap.has(oo.organization_id)) {
        orgOwnerMap.set(oo.organization_id, oo);
      }
    }

    for (const row of missingCohorts) {
      const orgOwner = orgOwnerMap.get(row.program.organization.id);
      if (orgOwner?.user) {
        hostMap.set(row.id, {
          userId: orgOwner.user_id,
          name: orgOwner.user.nickname || row.program.organization.name,
          avatar: orgOwner.user.contacts?.photo_url ?? null,
          identifier: orgOwner.user.custom_id ?? orgOwner.user.external_id ?? null
        });
      } else {
        // Layer 3: fallback to org name
        hostMap.set(row.id, {
          userId: null,
          name: row.program.organization.name,
          avatar: null,
          identifier: null
        });
      }
    }
  }

  return hostMap;
};

/** 批次取得已加入人數、使用者參與狀態、host、templateCount，組出 summary */
const buildSummaries = async (rows: ActivityRow[], userId: number | null, now: Date) => {
  const cohortIds = rows.map(row => row.id);
  const [counts, joined, hosts, templateCounts] = await Promise.all([
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
    resolveHosts(rows),
    cohortIds.length === 0
      ? Promise.resolve([])
      : prisma.cohort_templates.groupBy({
        by: ['cohort_id'],
        where: { cohort_id: { in: cohortIds }, unbound_at: null },
        _count: { id: true }
      })
  ]);
  const countByCohort = new Map(counts.map(row => [row.cohort_id, row._count.id]));
  const joinedSet = new Set(joined.map(row => row.cohort_id));
  const templateCountMap = new Map(templateCounts.map(row => [row.cohort_id, row._count.id]));

  return rows.map(row => {
    const participantCount = countByCohort.get(row.id) ?? 0;
    const joinability = deriveJoinability(row, participantCount, now);
    return {
      id: row.id,
      displayName: row.display_name,
      tagline: row.tagline,
      programName: row.program.name,
      description: row.program.description,
      organizationName: row.program.organization.name,
      host: hosts.get(row.id) ?? { userId: null, name: row.program.organization.name, avatar: null, identifier: null },
      startDate: row.start_date,
      endDate: row.end_date,
      joinDeadline: row.join_deadline,
      capacity: row.capacity,
      participantCount,
      interactionModes: row.interaction_modes,
      location: row.location,
      feeType: row.fee_type,
      feeAmount: row.fee_amount,
      signupMethod: row.signup_method,
      templateCount: templateCountMap.get(row.id) ?? 0,
      runStatus: deriveRunStatus(row.start_date, row.end_date, now),
      canJoin: joinability.canJoin,
      unavailableReason: joinability.unavailableReason,
      isJoined: joinedSet.has(row.id),
      joinToken: joinability.canJoin ? row.join_token : null
    };
  });
};

const publicActivityWhere = (mode?: string) => ({
  status: 'published' as const,
  visibility: COHORT_VISIBILITY.PUBLIC,
  program: { kind: PROGRAM_KINDS.LIGHTHOUSE, archived_at: null, deleted_at: null, organization: { status: 'active' } },
  ...(mode ? { interaction_modes: { has: mode } } : {})
});

/** 探索活動頁：兩段查詢（active + ended），含 meta */
const list = async (userId: number | null, mode?: string, now = new Date()) => {
  const todayStr = today(now);
  const todayDate = dateOf(todayStr);

  const [activeRows, endedRows] = await Promise.all([
    prisma.cohorts.findMany({
      where: { ...publicActivityWhere(mode), end_date: { gte: todayDate } },
      select: activitySelect,
      orderBy: { start_date: 'asc' }
    }),
    prisma.cohorts.findMany({
      where: { ...publicActivityWhere(mode), end_date: { lt: todayDate } },
      select: activitySelect,
      orderBy: { end_date: 'desc' },
      take: ACTIVITY_ENDED_LIMIT + 1
    })
  ]);

  const endedTruncated = endedRows.length > ACTIVITY_ENDED_LIMIT;
  const trimmedEnded = endedTruncated ? endedRows.slice(0, ACTIVITY_ENDED_LIMIT) : endedRows;
  const allRows = [...activeRows, ...trimmedEnded] as ActivityRow[];
  const data = await buildSummaries(allRows, userId, now);
  const meta = { endedLimit: ACTIVITY_ENDED_LIMIT, endedTruncated };

  return { data, meta };
};

/** 活動詳情（公開；已結束仍可查看），含 location、sessions、externalSignupUrl */
const getDetail = async (cohortId: number, userId: number | null, now = new Date()) => {
  const row = await prisma.cohorts.findUnique({ where: { id: cohortId }, select: activitySelect });
  if (!row || !isPublicActivity(row as ActivityRow)) throw new NotFoundError('找不到活動');
  const [summary] = await buildSummaries([row as ActivityRow], userId, now);
  return {
    ...summary,
    timezone: row.timezone ?? 'Asia/Taipei',
    sessions: mapSessions(row.cohort_sessions),
    externalSignupUrl: row.external_signup_url,
    organization: { name: row.program.organization.name, bio: row.program.organization.bio, externalLink: row.program.organization.external_link },
    inviteMessage: row.invite_message
  };
};

/**
 * 發起人快覽：回傳發起人統計資訊。
 * 只有在至少一個公開已發佈期的 host 才會回傳，否則 404。
 */
const getHostPreview = async (targetUserId: number) => {
  const user = await prisma.users.findUnique({
    where: { id: targetUserId },
    select: {
      id: true, nickname: true, external_id: true, custom_id: true, created_at: true,
      contacts: { select: { photo_url: true } },
      basic_info: { select: { self_introduction: true } }
    }
  });
  if (!user) throw new NotFoundError('找不到使用者');

  // 找出此人為 host 的所有已發佈燈塔期（不限 visibility）
  const hostedEnrollments = await prisma.cohort_enrollments.findMany({
    where: {
      user_id: targetUserId, status: 'joined', role: 'owner',
      cohort: {
        status: 'published',
        program: { kind: PROGRAM_KINDS.LIGHTHOUSE, archived_at: null, deleted_at: null, organization: { status: 'active' } }
      }
    },
    select: {
      cohort_id: true,
      cohort: { select: { visibility: true, program: { select: { organization: { select: { name: true } } } } } }
    }
  });

  // 也要檢查 org owner fallback: 此人是 org owner 且 cohort 沒有 enrollment owner 的期
  const orgMemberships = await prisma.organization_members.findMany({
    where: { user_id: targetUserId, role: 'owner' },
    select: { organization_id: true, organization: { select: { name: true } } }
  });

  let orgFallbackCohortIds: number[] = [];
  let orgName = '';
  if (orgMemberships.length > 0) {
    orgName = orgMemberships[0].organization.name;
    const orgIds = orgMemberships.map(m => m.organization_id);
    // 找出這些 org 下沒有 enrollment owner 的已發佈燈塔期
    const orgCohorts = await prisma.cohorts.findMany({
      where: {
        status: 'published',
        program: { kind: PROGRAM_KINDS.LIGHTHOUSE, archived_at: null, deleted_at: null, organization_id: { in: orgIds }, organization: { status: 'active' } },
        NOT: { cohort_enrollments: { some: { status: 'joined', role: 'owner', user_id: { not: null } } } }
      },
      select: { id: true }
    });
    // 進一步確認：此 user 是最早的 org owner（與 resolveHosts layer 2 一致）
    const earliestOwners = await prisma.organization_members.findMany({
      where: { organization_id: { in: orgIds }, role: 'owner' },
      select: { organization_id: true, user_id: true },
      orderBy: { created_at: 'asc' }
    });
    const orgFirstOwner = new Map<number, number>();
    for (const eo of earliestOwners) {
      if (!orgFirstOwner.has(eo.organization_id)) {
        orgFirstOwner.set(eo.organization_id, eo.user_id);
      }
    }
    const myOrgIds = new Set(orgMemberships.filter(m => orgFirstOwner.get(m.organization_id) === targetUserId).map(m => m.organization_id));
    // 用 orgCohorts + 需要 program.organization_id in myOrgIds，但 orgCohorts 已篩過 org
    // 需要重新查帶 organization_id
    const orgCohortsWithOrg = await prisma.cohorts.findMany({
      where: {
        id: { in: orgCohorts.map(c => c.id) },
        program: { organization_id: { in: [...myOrgIds] } }
      },
      select: { id: true }
    });
    orgFallbackCohortIds = orgCohortsWithOrg.map(c => c.id);
  }

  const hostedCohortIds = new Set([
    ...hostedEnrollments.map(e => e.cohort_id),
    ...orgFallbackCohortIds
  ]);

  // 至少一個公開已發佈期才回傳
  const hasPublicCohort = hostedEnrollments.some(e => e.cohort.visibility === COHORT_VISIBILITY.PUBLIC);
  // 也檢查 fallback 的 cohorts 是否有 public
  let fallbackHasPublic = false;
  if (!hasPublicCohort && orgFallbackCohortIds.length > 0) {
    const publicCount = await prisma.cohorts.count({
      where: { id: { in: orgFallbackCohortIds }, visibility: COHORT_VISIBILITY.PUBLIC }
    });
    fallbackHasPublic = publicCount > 0;
  }

  if (!hasPublicCohort && !fallbackHasPublic) {
    throw new NotFoundError('此使用者不是任何公開活動的發起人');
  }

  if (!orgName && hostedEnrollments.length > 0) {
    orgName = hostedEnrollments[0].cohort.program.organization.name;
  }

  const hostedActivityCount = hostedCohortIds.size;

  // learnedWithCount: 上述期內 status='joined' 的 distinct 使用者（排除本人）
  const allCohortIds = [...hostedCohortIds];
  let learnedWithCount = 0;
  if (allCohortIds.length > 0) {
    const result = await prisma.cohort_enrollments.findMany({
      where: { cohort_id: { in: allCohortIds }, status: 'joined', user_id: { not: null, notIn: [targetUserId] } },
      select: { user_id: true },
      distinct: ['user_id']
    });
    learnedWithCount = result.length;
  }

  return {
    userId: user.id,
    name: user.nickname || orgName,
    avatar: user.contacts?.photo_url ?? null,
    identifier: user.custom_id ?? user.external_id ?? null,
    selfIntroduction: user.basic_info?.self_introduction ?? null,
    organizationName: orgName,
    hostedActivityCount,
    learnedWithCount,
    joinedYear: user.created_at ? user.created_at.getFullYear() : new Date().getFullYear()
  };
};

export const activityService = { list, getDetail, getHostPreview };
