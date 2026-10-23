import type { CreateCohortInput, CohortResponse, OrganizationCohortResponse, UpdateCohortInput, CohortUpdateResult, CohortSessionInput } from '../validators/cohort.validators';
import { ACTIVE_PROGRAM_WHERE, COHORT_ARCHIVE_REASONS } from '../constants/archive-state';
import { writeLighthouseAudit } from '../utils/lighthouse-audit';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { randomUUID } from 'crypto';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import type { CohortInteractionMode, CohortFeeType, CohortSignupMethod } from '../constants/cohort-setup';
import { ensureRoom } from './chat-room.service';

/** Prisma select 含新欄位與 sessions */
const select = {
  program: { select: { name: true, organization_id: true, organization: { select: { name: true, status: true } } } },
  id: true, program_id: true, slug: true, display_name: true,
  tagline: true,
  start_date: true, end_date: true, join_token: true, join_paused: true,
  join_deadline: true, capacity: true, invite_message: true,
  show_invite_message_on_signup: true,
  interaction_modes: true, meeting_url: true, location: true,
  fee_type: true, fee_amount: true, signup_method: true, external_signup_url: true,
  is_private: true, checkin_default_private: true, host_comment_default_private: true,
  status: true, visibility: true, archived_at: true, created_at: true, updated_at: true,
  cohort_sessions: { select: { id: true, session_date: true, start_time: true, end_time: true, position: true }, orderBy: { position: 'asc' as const } },
  _count: { select: { cohort_sessions: true } }
} as const;

type CohortRow = {
  program: { name: string; organization_id: number; organization: { name: string; status: string } };
  id: number; program_id: number; slug: string; display_name: string;
  tagline: string | null;
  start_date: Date; end_date: Date; join_token: string | null; join_paused: boolean;
  join_deadline: Date | null; capacity: number | null; invite_message: string | null;
  show_invite_message_on_signup: boolean;
  interaction_modes: string[]; meeting_url: string | null; location: string | null;
  fee_type: string; fee_amount: number | null; signup_method: string; external_signup_url: string | null;
  is_private: boolean; checkin_default_private: boolean; host_comment_default_private: boolean;
  status: string; visibility: string; archived_at?: Date | null; created_at: Date; updated_at: Date | null;
  cohort_sessions: Array<{ id: number; session_date: Date; start_time: Date | null; end_time: Date | null; position: number }>;
  _count: { cohort_sessions: number };
};

const asStatus = (status: string): CohortResponse['status'] => {
  if (status === 'draft' || status === 'published' || status === 'archived') return status;
  throw new Error(`Invalid cohort status: ${status}`);
};
const asVisibility = (visibility: string): CohortResponse['visibility'] => {
  if (visibility === 'private' || visibility === 'public') return visibility;
  throw new Error(`Invalid cohort visibility: ${visibility}`);
};
const asFeeType = (feeType: string): CohortFeeType => {
  if (feeType === 'free' || feeType === 'paid') return feeType;
  throw new Error(`Invalid cohort fee type: ${feeType}`);
};
const asSignupMethod = (method: string): CohortSignupMethod => {
  if (method === 'island_form' || method === 'external') return method;
  throw new Error(`Invalid cohort signup method: ${method}`);
};
const asInteractionModes = (modes: string[]): CohortInteractionMode[] =>
  modes.filter((m): m is CohortInteractionMode => m === 'sync' || m === 'async' || m === 'physical');

/** 格式化 TIME 欄位為 HH:MM */
const formatTime = (value: Date | null): string | null => {
  if (!value) return null;
  return value.toISOString().slice(11, 16);
};
/** 格式化 DATE 欄位為 YYYY-MM-DD */
const formatDate = (value: Date): string => value.toISOString().slice(0, 10);

const map = (row: CohortRow): CohortResponse => ({
  organizationId: row.program.organization_id, organizationName: row.program.organization.name,
  id: row.id, programId: row.program_id, slug: row.slug, displayName: row.display_name,
  tagline: row.tagline,
  startDate: row.start_date, endDate: row.end_date, joinToken: row.join_token, joinPaused: row.join_paused,
  joinDeadline: row.join_deadline, capacity: row.capacity, inviteMessage: row.invite_message,
  showInviteMessageOnSignup: row.show_invite_message_on_signup,
  interactionModes: asInteractionModes(row.interaction_modes),
  meetingUrl: row.meeting_url, location: row.location,
  sessions: row.cohort_sessions.map(s => ({
    id: s.id,
    sessionDate: formatDate(s.session_date),
    startTime: formatTime(s.start_time),
    endTime: formatTime(s.end_time)
  })),
  feeType: asFeeType(row.fee_type), feeAmount: row.fee_amount,
  signupMethod: asSignupMethod(row.signup_method), externalSignupUrl: row.external_signup_url,
  isPrivate: row.is_private, checkinDefaultPrivate: row.checkin_default_private,
  hostCommentDefaultPrivate: row.host_comment_default_private,
  hasHomePage: false, // Phase B：space_home_pages 查詢
  signupQuestionCount: 0, // Phase C：cohort_signup_questions count
  status: asStatus(row.status), visibility: asVisibility(row.visibility),
  archivedAt: row.archived_at ?? null,
  createdAt: row.created_at, updatedAt: row.updated_at
});

const date = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
/** 將 HH:MM 轉成 TIME 可存的 Date（1970-01-01 + time） */
const toTime = (value: string | null): Date | null => {
  if (!value) return null;
  return new Date(`1970-01-01T${value}:00.000Z`);
};
const isCode = (error: unknown, code: string): boolean => typeof error === 'object' && error !== null && 'code' in error && error.code === code;

/** 複製場次時的 slug 候選：`<slug>-copy`、`<slug>-copy-2`…，仍需符合 slug 規則與 50 字上限 */
const copySlug = (slug: string, attempt: number): string => {
  const suffix = attempt === 0 ? '-copy' : `-copy-${attempt + 1}`;
  return `${slug.slice(0, 50 - suffix.length)}${suffix}`;
};

/**
 * D3/D4/D5 正規化邏輯：以合併後的完整欄位狀態驗證並正規化。
 * 在 service 層操作（validator 的 superRefine 在 create 驗證，update 以 merge 後的結果在此驗證）。
 */
const normalizeCohortSetup = (merged: {
  feeType: string;
  feeAmount: number | null | undefined;
  signupMethod: string;
  externalSignupUrl: string | null | undefined;
  isPrivate: boolean;
  checkinDefaultPrivate: boolean;
  hostCommentDefaultPrivate: boolean;
  interactionModes: string[];
  meetingUrl: string | null | undefined;
  location: string | null | undefined;
  sessions?: CohortSessionInput[];
}): {
  feeAmount: number | null;
  signupMethod: string;
  externalSignupUrl: string | null;
  checkinDefaultPrivate: boolean;
  hostCommentDefaultPrivate: boolean;
  meetingUrl: string | null;
  location: string | null;
  clearSessions: boolean;
} => {
  // D3：收費正規化
  if (merged.feeType === 'paid') {
    if (!merged.feeAmount) throw new BadRequestError('付費活動必須填寫費用金額');
    if (merged.signupMethod !== 'external') {
      // 強制 external
      merged.signupMethod = 'external';
    }
    if (!merged.externalSignupUrl) throw new BadRequestError('付費活動必須填寫外部報名連結');
  }

  let feeAmount = merged.feeAmount ?? null;
  if (merged.feeType === 'free') {
    feeAmount = null;
  }

  let externalSignupUrl = merged.externalSignupUrl ?? null;
  if (merged.signupMethod === 'island_form') {
    externalSignupUrl = null;
  } else if (merged.signupMethod === 'external' && !externalSignupUrl) {
    throw new BadRequestError('外部報名必須填寫外部報名連結');
  }

  // D4：隱私連動
  let { checkinDefaultPrivate, hostCommentDefaultPrivate } = merged;
  if (!merged.isPrivate) {
    checkinDefaultPrivate = false;
    hostCommentDefaultPrivate = false;
  }

  // D5：附屬欄位清理
  const modes = merged.interactionModes;
  const meetingUrl = modes.includes('sync') ? (merged.meetingUrl ?? null) : null;
  const location = modes.includes('physical') ? (merged.location ?? null) : null;
  const hasSyncOrPhysical = modes.includes('sync') || modes.includes('physical');
  const clearSessions = !hasSyncOrPhysical;

  return {
    feeAmount,
    signupMethod: merged.signupMethod,
    externalSignupUrl,
    checkinDefaultPrivate,
    hostCommentDefaultPrivate,
    meetingUrl,
    location,
    clearSessions
  };
};

const assertProgram = async (programId: number, userId: number): Promise<void> => {
  const program = await prisma.programs.findFirst({
    where: { id: programId, ...ACTIVE_PROGRAM_WHERE, organization: { organization_members: { some: { user_id: userId } } } },
    select: { organization: { select: { status: true } } }
  });
  if (!program) throw new ForbiddenError('無權限存取此系列');
  if (program.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};
const assertOrganization = async (organizationId: number, userId: number): Promise<void> => {
  const organization = await prisma.organization.findFirst({
    where: { id: organizationId, organization_members: { some: { user_id: userId } } },
    select: { status: true }
  });
  if (!organization) throw new ForbiddenError('無權限存取此組織');
  if (organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};
const getOwned = async (programId: number, cohortId: number, userId: number) => {
  const row = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, deleted_at: null, program: { ...ACTIVE_PROGRAM_WHERE, organization: { organization_members: { some: { user_id: userId } } } } },
    select
  });
  if (!row) throw new ForbiddenError('無權限存取此場次');
  if (row.program.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
  return row;
};
const list = async (programId: number, userId: number): Promise<CohortResponse[]> => {
  await assertProgram(programId, userId);
  return (await prisma.cohorts.findMany({ where: { program_id: programId, deleted_at: null }, select, orderBy: { created_at: 'asc' } })).map(map);
};
/**
 * 組織底下所有系列的全部場次（總覽頁一次列出，含草稿與封存），附系列名稱與已加入人數
 */
const listByOrganization = async (organizationId: number, userId: number): Promise<OrganizationCohortResponse[]> => {
  await assertOrganization(organizationId, userId);
  const rows = await prisma.cohorts.findMany({
    where: { deleted_at: null, program: { organization_id: organizationId, ...ACTIVE_PROGRAM_WHERE } },
    select,
    orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }]
  });
  const joined = rows.length === 0 ? [] : await prisma.cohort_enrollments.groupBy({
    by: ['cohort_id'],
    where: { cohort_id: { in: rows.map(row => row.id) }, status: 'joined', role: 'member' },
    _count: { id: true }
  });
  const joinedByCohort = new Map(joined.map(row => [row.cohort_id, row._count.id]));
  const cohortIds = rows.map(r => r.id);
  const [encourageRows, celebrateRows] = cohortIds.length === 0 ? [[], []] : await Promise.all([
    prisma.$queryRaw<Array<{ cohort_id: number; count: bigint }>>`
      SELECT sub.cohort_id, COUNT(*) AS count FROM (
        SELECT p.cohort_id
        FROM practices p
        JOIN practice_checkins pc ON pc.practice_id = p.id
        WHERE p.cohort_id = ANY(${cohortIds}::int[]) AND p.deleted_at IS NULL
        GROUP BY p.cohort_id, p.user_id, p.id
        HAVING MAX(pc.created_at) < NOW() - INTERVAL '3 days'
      ) sub
      GROUP BY sub.cohort_id
    `,
    prisma.$queryRaw<Array<{ cohort_id: number; count: bigint }>>`
      WITH activity AS (
        SELECT p.cohort_id, p.id AS practice_id, pc.created_at,
               LAG(pc.created_at) OVER (PARTITION BY p.id ORDER BY pc.created_at) AS previous_at,
               COUNT(*) OVER (PARTITION BY p.id) AS total_count,
               MIN(pc.created_at) OVER (PARTITION BY p.id) AS first_at,
               MAX(pc.created_at) OVER (PARTITION BY p.id) AS latest_at
        FROM practices p JOIN practice_checkins pc ON pc.practice_id = p.id
        WHERE p.cohort_id = ANY(${cohortIds}::int[]) AND p.deleted_at IS NULL
      )
      SELECT cohort_id, COUNT(DISTINCT (practice_id, moment)) AS count FROM (
        SELECT cohort_id, practice_id, 'first_checkin' AS moment FROM activity WHERE total_count = 1
        UNION ALL
        SELECT cohort_id, practice_id, 'return_after_break' FROM activity
        WHERE previous_at IS NOT NULL AND created_at - previous_at >= INTERVAL '3 days' AND created_at >= NOW() - INTERVAL '1 day'
        UNION ALL
        SELECT DISTINCT cohort_id, practice_id, 'month_milestone' FROM activity
        WHERE first_at <= NOW() - INTERVAL '30 days' AND latest_at >= NOW() - INTERVAL '1 day'
      ) x
      GROUP BY cohort_id
    `
  ]);
  const encourageByCohort = new Map(encourageRows.map(r => [r.cohort_id, Number(r.count)]));
  const celebrateByCohort = new Map(celebrateRows.map(r => [r.cohort_id, Number(r.count)]));
  return rows.map(row => ({
    ...map(row),
    programName: row.program.name,
    joinedCount: joinedByCohort.get(row.id) ?? 0,
    encourageCount: encourageByCohort.get(row.id) ?? 0,
    celebrateCount: celebrateByCohort.get(row.id) ?? 0,
  }));
};
const get = async (programId: number, cohortId: number, userId: number): Promise<CohortResponse> => map(await getOwned(programId, cohortId, userId));

/** 建立場次（走正規化） */
const create = async (programId: number, input: CreateCohortInput, userId: number): Promise<CohortResponse> => {
  await assertProgram(programId, userId);

  const feeType = input.feeType ?? 'free';
  const signupMethod = input.signupMethod ?? 'island_form';
  const isPrivate = input.isPrivate ?? true;
  const interactionModes = input.interactionModes ?? [];
  const checkinDefaultPrivate = input.checkinDefaultPrivate ?? false;
  const hostCommentDefaultPrivate = input.hostCommentDefaultPrivate ?? false;

  const normalized = normalizeCohortSetup({
    feeType, feeAmount: input.feeAmount, signupMethod, externalSignupUrl: input.externalSignupUrl,
    isPrivate, checkinDefaultPrivate, hostCommentDefaultPrivate,
    interactionModes, meetingUrl: input.meetingUrl, location: input.location, sessions: input.sessions
  });

  try {
    const result = await prisma.$transaction(async tx => {
      const created = await tx.cohorts.create({
        data: {
          program_id: programId,
          slug: input.slug,
          display_name: input.displayName,
          tagline: input.tagline ?? null,
          start_date: date(input.startDate),
          end_date: date(input.endDate),
          join_deadline: input.joinDeadline ? date(input.joinDeadline) : null,
          capacity: input.capacity ?? null,
          invite_message: input.inviteMessage ?? null,
          show_invite_message_on_signup: input.showInviteMessageOnSignup ?? false,
          interaction_modes: interactionModes,
          meeting_url: normalized.meetingUrl,
          location: normalized.location,
          fee_type: feeType,
          fee_amount: normalized.feeAmount,
          signup_method: normalized.signupMethod,
          external_signup_url: normalized.externalSignupUrl,
          is_private: isPrivate,
          checkin_default_private: normalized.checkinDefaultPrivate,
          host_comment_default_private: normalized.hostCommentDefaultPrivate,
          visibility: input.visibility,
          status: input.status
        },
        select
      });

      // 建立 sessions
      if (input.sessions && input.sessions.length > 0 && !normalized.clearSessions) {
        await tx.cohort_sessions.createMany({
          data: input.sessions.map((s, i) => ({
            cohort_id: created.id,
            session_date: date(s.sessionDate),
            start_time: toTime(s.startTime),
            end_time: toTime(s.endTime),
            position: i
          }))
        });
        // 聊天室：lighthouse cohort 同交易建立
        await ensureRoom(tx, created.id);
        // 重新 select 含 sessions
        return await tx.cohorts.findUniqueOrThrow({ where: { id: created.id }, select });
      }
      // 聊天室：lighthouse cohort 同交易建立
      await ensureRoom(tx, created.id);
      return created;
    });
    return map(result as CohortRow);
  } catch (error) {
    if (isCode(error, 'P2002')) throw new ConflictError('同一系列下不可使用重複 slug');
    throw error;
  }
};

/** 更新場次（走正規化 + 隱私連動） */
const update = async (programId: number, cohortId: number, input: UpdateCohortInput, userId: number): Promise<CohortUpdateResult> => {
  const current = await getOwned(programId, cohortId, userId);
  const startDate = input.startDate ? date(input.startDate) : current.start_date;
  const endDate = input.endDate ? date(input.endDate) : current.end_date;
  if (startDate > endDate) throw new ConflictError('開始日期不可晚於結束日期');

  // 合併當前值與輸入，用正規化驗證
  const mergedFeeType = input.feeType ?? current.fee_type;
  const mergedSignupMethod = input.signupMethod ?? current.signup_method;
  const mergedIsPrivate = input.isPrivate ?? current.is_private;
  const mergedInteractionModes = input.interactionModes ?? current.interaction_modes;
  const mergedCheckinDefaultPrivate = input.checkinDefaultPrivate ?? current.checkin_default_private;
  const mergedHostCommentDefaultPrivate = input.hostCommentDefaultPrivate ?? current.host_comment_default_private;

  const normalized = normalizeCohortSetup({
    feeType: mergedFeeType,
    feeAmount: input.feeAmount !== undefined ? input.feeAmount : current.fee_amount,
    signupMethod: mergedSignupMethod,
    externalSignupUrl: input.externalSignupUrl !== undefined ? input.externalSignupUrl : current.external_signup_url,
    isPrivate: mergedIsPrivate,
    checkinDefaultPrivate: mergedCheckinDefaultPrivate,
    hostCommentDefaultPrivate: mergedHostCommentDefaultPrivate,
    interactionModes: mergedInteractionModes,
    meetingUrl: input.meetingUrl !== undefined ? input.meetingUrl : current.meeting_url,
    location: input.location !== undefined ? input.location : current.location,
    sessions: input.sessions
  });

  const isPrivacyChanged = input.isPrivate !== undefined && input.isPrivate !== current.is_private;

  try {
    const result = await prisma.$transaction(async tx => {
      await tx.cohorts.update({
        where: { id: cohortId },
        data: {
          ...(input.slug !== undefined && { slug: input.slug }),
          ...(input.displayName !== undefined && { display_name: input.displayName }),
          ...(input.tagline !== undefined && { tagline: input.tagline }),
          start_date: startDate,
          end_date: endDate,
          ...(input.joinDeadline !== undefined && { join_deadline: input.joinDeadline ? date(input.joinDeadline) : null }),
          ...(input.capacity !== undefined && { capacity: input.capacity }),
          ...(input.inviteMessage !== undefined && { invite_message: input.inviteMessage }),
          ...(input.showInviteMessageOnSignup !== undefined && { show_invite_message_on_signup: input.showInviteMessageOnSignup }),
          ...(input.interactionModes !== undefined && { interaction_modes: mergedInteractionModes }),
          meeting_url: normalized.meetingUrl,
          location: normalized.location,
          ...(input.feeType !== undefined && { fee_type: mergedFeeType }),
          fee_amount: normalized.feeAmount,
          signup_method: normalized.signupMethod,
          external_signup_url: normalized.externalSignupUrl,
          is_private: mergedIsPrivate,
          checkin_default_private: normalized.checkinDefaultPrivate,
          host_comment_default_private: normalized.hostCommentDefaultPrivate,
          ...(input.visibility !== undefined && { visibility: input.visibility }),
          ...(input.status !== undefined && { status: input.status }),
          // 用 PATCH 切到 archived 也要留下封存紀錄；從 archived 切回其他狀態則清掉（FR-ARC-04）
          ...(input.status === 'archived' && current.status !== 'archived' && { archived_at: new Date(), archived_by: userId, archived_from_status: current.status, archived_reason: COHORT_ARCHIVE_REASONS.MANUAL }),
          ...(input.status !== undefined && input.status !== 'archived' && current.status === 'archived' && { archived_at: null, archived_by: null, archived_from_status: null, archived_reason: null }),
          updated_at: new Date()
        },
        select
      });

      // Sessions 全量覆寫（如果有傳 sessions）
      if (input.sessions !== undefined) {
        await tx.cohort_sessions.deleteMany({ where: { cohort_id: cohortId } });
        if (input.sessions.length > 0 && !normalized.clearSessions) {
          await tx.cohort_sessions.createMany({
            data: input.sessions.map((s, i) => ({
              cohort_id: cohortId,
              session_date: date(s.sessionDate),
              start_time: toTime(s.startTime),
              end_time: toTime(s.endTime),
              position: i
            }))
          });
        }
      } else if (normalized.clearSessions) {
        // modes 移除了 sync/physical → 清空 sessions
        await tx.cohort_sessions.deleteMany({ where: { cohort_id: cohortId } });
      }

      // D7：切換 isPrivate 時同交易 updateMany 實踐 privacy_status
      let affectedPracticeCount: number | undefined;
      if (isPrivacyChanged) {
        const newPrivacyStatus = mergedIsPrivate ? 'private' : 'public';
        // 只改屬於此 cohort、尚未退出成員的 cohort_template 實踐
        const updateResult = await tx.practices.updateMany({
          where: {
            cohort_id: cohortId,
            creation_source: 'cohort_template',
            deleted_at: null
          },
          data: { privacy_status: newPrivacyStatus }
        });
        affectedPracticeCount = updateResult.count;

        await tx.$executeRaw`
          INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
          VALUES (${userId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PRIVACY_TOGGLED}, 'cohort', ${String(cohortId)},
                  ${JSON.stringify({ isPrivate: current.is_private })}::jsonb,
                  ${JSON.stringify({ isPrivate: mergedIsPrivate, affectedPracticeCount })}::jsonb)
        `;
      }

      // 重新 select 含最新的 sessions
      const final = await tx.cohorts.findUniqueOrThrow({ where: { id: cohortId }, select });
      return { row: final, affectedPracticeCount };
    });

    const mapped = map(result.row as CohortRow);
    return { ...mapped, affectedPracticeCount: result.affectedPracticeCount };
  } catch (error) {
    if (isCode(error, 'P2002')) throw new ConflictError('同一系列下不可使用重複 slug');
    if (isCode(error, 'P2025')) throw new NotFoundError('找不到場次');
    throw error;
  }
};

/** 封存場次：記封存時間／操作人／封存前狀態，寫 audit；已封存再封存回 409（FR-ARC-04） */
const archive = async (programId: number, cohortId: number, userId: number): Promise<void> => {
  const current = await getOwned(programId, cohortId, userId);
  if (current.status === 'archived') throw new ConflictError('場次已在封存區');
  const now = new Date();
  await prisma.$transaction(async tx => {
    // 條件式更新：並發封存只有第一個請求生效，其餘回 409（TP-ARC-05）
    const updated = await tx.cohorts.updateMany({ where: { id: cohortId, status: { not: 'archived' }, deleted_at: null }, data: { status: 'archived', archived_at: now, archived_by: userId, archived_from_status: current.status, archived_reason: COHORT_ARCHIVE_REASONS.MANUAL, updated_at: now } });
    if (updated.count === 0) throw new ConflictError('場次已在封存區');
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ARCHIVED, 'cohort', cohortId, { status: current.status }, { status: 'archived' });
  });
};

/**
 * 複製場次（D10 深複製）：草稿狀態副本，含新欄位、sessions、模板綁定。
 * visibility 強制 private、joinPaused=false、新 token。
 */
const duplicate = async (programId: number, cohortId: number, actorId: number): Promise<CohortResponse> => {
  const source = await getOwned(programId, cohortId, actorId);
  const bindings = await prisma.cohort_templates.findMany({ where: { cohort_id: cohortId, unbound_at: null }, select: { template_id: true, start_date: true } });
  const sessions = await prisma.cohort_sessions.findMany({ where: { cohort_id: cohortId }, select: { session_date: true, start_time: true, end_time: true, position: true }, orderBy: { position: 'asc' } });

  const data = {
    program_id: programId,
    display_name: `${source.display_name}（副本）`.slice(0, 100),
    tagline: source.tagline,
    start_date: source.start_date,
    end_date: source.end_date,
    join_deadline: source.join_deadline,
    capacity: source.capacity,
    invite_message: source.invite_message,
    show_invite_message_on_signup: source.show_invite_message_on_signup,
    interaction_modes: source.interaction_modes,
    meeting_url: source.meeting_url,
    location: source.location,
    fee_type: source.fee_type,
    fee_amount: source.fee_amount,
    signup_method: source.signup_method,
    external_signup_url: source.external_signup_url,
    is_private: source.is_private,
    checkin_default_private: source.checkin_default_private,
    host_comment_default_private: source.host_comment_default_private,
    visibility: 'private' as const,
    status: 'draft' as const
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return map(await prisma.$transaction(async tx => {
        const created = await tx.cohorts.create({ data: { ...data, slug: copySlug(source.slug, attempt) }, select });
        if (bindings.length > 0) await tx.cohort_templates.createMany({ data: bindings.map(binding => ({ cohort_id: created.id, template_id: binding.template_id, start_date: binding.start_date })) });
        if (sessions.length > 0) {
          await tx.cohort_sessions.createMany({
            data: sessions.map(s => ({
              cohort_id: created.id,
              session_date: s.session_date,
              start_time: s.start_time,
              end_time: s.end_time,
              position: s.position
            }))
          });
        }
        await tx.$executeRaw`
          INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
          VALUES (${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_DUPLICATED}, 'cohort', ${String(created.id)},
                  ${JSON.stringify({ sourceCohortId: cohortId })}::jsonb,
                  ${JSON.stringify({ slug: created.slug, templateCount: bindings.length, sessionCount: sessions.length })}::jsonb)
        `;
        // 聊天室：lighthouse cohort 同交易建立
        await ensureRoom(tx, created.id);
        // 重新 select 含 sessions
        return await tx.cohorts.findUniqueOrThrow({ where: { id: created.id }, select });
      }) as CohortRow);
    } catch (error) {
      if (!isCode(error, 'P2002')) throw error;
    }
  }
  throw new ConflictError('副本 slug 已重複多次，請手動建立場次');
};

/**
 * 加入連結治理（FR-RS-02）：rotate 換新 token；pause / resume 只切 join_paused，token 保留，
 * 重新開放時沿用原連結（token 為 NULL 的舊資料補發一組）
 */
const setJoinToken = async (programId: number, cohortId: number, actorId: number, mode: 'rotate' | 'pause' | 'resume') => {
  const current = await getOwned(programId, cohortId, actorId);
  const joinToken = mode === 'rotate' || current.join_token === null ? randomUUID() : current.join_token;
  const joinPaused = mode === 'pause' ? true : mode === 'resume' ? false : current.join_paused;
  const action = mode === 'rotate' ? LIGHTHOUSE_AUDIT_ACTIONS.COHORT_JOIN_TOKEN_ROTATED : mode === 'pause' ? LIGHTHOUSE_AUDIT_ACTIONS.COHORT_JOIN_PAUSED : LIGHTHOUSE_AUDIT_ACTIONS.COHORT_JOIN_RESUMED;
  await prisma.$transaction(async tx => {
    await tx.cohorts.update({ where: { id: cohortId }, data: { join_token: joinToken, join_paused: joinPaused, updated_at: new Date() } });
    await tx.$executeRaw`
      INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
      VALUES (${actorId}, ${action}, 'cohort', ${String(cohortId)},
              ${JSON.stringify({ joinToken: current.join_token, joinPaused: current.join_paused })}::jsonb,
              ${JSON.stringify({ joinToken, joinPaused, affectedCount: 1 })}::jsonb)
    `;
  });
  return { cohortId, joinToken, joinPaused };
};
export const cohortService = { list, listByOrganization, get, create, update, archive, duplicate, setJoinToken };
