import { Prisma } from '../../generated/prisma';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { ConflictError, ForbiddenError, NotFoundError, TooManyRequestsError } from '../middleware/error.middleware';
import { writeLighthouseAudit } from '../utils/lighthouse-audit';
import type { CohortOutcomeResponse, EditOutcomeSummaryInput, GenerateOutcomeSummaryInput, OutcomePhase, OutcomeSummaryVersion } from '../validators/cohort-outcome.validators';
import { AiBackendError, aiBackendClient } from './ai-backend.client';
import { APP_TIMEZONE, day } from './cohort-run-state';
import { prisma } from './database/prisma.service';
import { organizationAiCredentialService } from './organization-ai-credential.service';

/**
 * 場次「成果」（FRD frd-activity-outcome-org.md §3.2）：
 * - 概況／實踐成果／參與者進度改為即時查詢（final 快照只用來標示「已結算」時間）
 * - AI 摘要走 ai-backend（平台 AI 或組織自帶 key），每次產生或人工編輯都是 cohort_outcome_summaries 的新版本
 * - PDF 由前端列印版頁面產生；後端只記匯出稽核
 */

const PLATFORM_DAILY_LIMIT = 5;
const SUMMARY_VERSIONS_LIMIT = 10;
const SUMMARY_MAX_CHECKINS = 200;
const SUMMARY_MAX_COMMENTS = 100;
const SUMMARY_PROMPT_VERSION = 'cohort-summary-v1';

type CohortRow = {
  id: number; display_name: string; start_date: Date; end_date: Date;
  program: { name: string; organization_id: number; organization: { timezone: string; organization_members: Array<{ id: number }> } };
};

const assertCoach = async (programId: number, cohortId: number, actorId: number): Promise<CohortRow> => {
  const cohort = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, deleted_at: null },
    select: {
      id: true, display_name: true, start_date: true, end_date: true,
      program: { select: { name: true, organization_id: true, organization: { select: { timezone: true, organization_members: { where: { user_id: actorId }, select: { id: true } } } } } }
    }
  });
  if (!cohort) throw new NotFoundError('找不到場次');
  if (cohort.program.organization.organization_members.length === 0) throw new ForbiddenError('無權限查看此場次成果');
  return cohort;
};

const calendarDay = (value: Date, timezone: string): string => new Intl.DateTimeFormat('en-CA', { timeZone: timezone || APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);

/** 場次尚未開始／進行中／已結束：FR-OUT-01「尚未產生成果」「進行中資料」「最終成果」 */
const resolvePhase = (cohort: { start_date: Date; end_date: Date }, timezone: string, now: Date): OutcomePhase => {
  const current = calendarDay(now, timezone);
  if (current < day(cohort.start_date)) return 'not_started';
  if (current > day(cohort.end_date)) return 'ended';
  return 'in_progress';
};

const count = (value: bigint | number | null | undefined): number => Number(value ?? 0);

type SummaryRow = {
  id: number; version: number; source: string; content: string; provider: string | null; model_name: string | null; generated_at: Date | null;
  is_current: boolean; created_at: Date; creator: { id: number; nickname: string | null } | null;
};
const summarySelect = {
  id: true, version: true, source: true, content: true, provider: true, model_name: true, generated_at: true, is_current: true, created_at: true,
  creator: { select: { id: true, nickname: true } }
} as const;
const asSource = (value: string): OutcomeSummaryVersion['source'] => (value === 'platform_ai' || value === 'own_ai' ? value : 'manual');
const mapSummary = (row: SummaryRow): OutcomeSummaryVersion => ({
  id: row.id, version: row.version, source: asSource(row.source), content: row.content, provider: row.provider, modelName: row.model_name,
  generatedAt: row.generated_at, createdBy: row.creator ? { id: row.creator.id, nickname: row.creator.nickname } : null, createdAt: row.created_at, isCurrent: row.is_current
});

const listSummaries = async (cohortId: number): Promise<SummaryRow[]> =>
  prisma.cohort_outcome_summaries.findMany({ where: { cohort_id: cohortId }, select: summarySelect, orderBy: { version: 'desc' }, take: SUMMARY_VERSIONS_LIMIT });

const platformUsedToday = async (cohortId: number, timezone: string, now: Date): Promise<number> => {
  // 額度視窗 = 組織時區的「今天」：日曆日字串在 SQL 端用 AT TIME ZONE 換回真正的當地午夜（與 cohort-activity 一致）
  const day = calendarDay(now, timezone);
  const rows = await prisma.$queryRaw<Array<{ used: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS used
    FROM cohort_outcome_summaries
    WHERE cohort_id = ${cohortId} AND source = 'platform_ai'
      AND created_at >= (${day}::date::timestamp AT TIME ZONE ${timezone})
  `);
  return Number(rows[0]?.used ?? 0);
};

const get = async (programId: number, cohortId: number, actorId: number, now = new Date()): Promise<CohortOutcomeResponse> => {
  const cohort = await assertCoach(programId, cohortId, actorId);
  const timezone = cohort.program.organization.timezone || APP_TIMEZONE;
  const [overviewRows, practiceRows, participantRows, summaries, credential, finalSnapshot, usedToday] = await Promise.all([
    prisma.$queryRaw<Array<{ participants: bigint; activated: bigint; checkins: bigint; comments: bigint }>>(Prisma.sql`
      SELECT
        (SELECT COUNT(*) FROM cohort_enrollments ce WHERE ce.cohort_id = ${cohortId} AND ce.status = 'joined' AND ce.role = 'member')::bigint AS participants,
        (SELECT COUNT(*) FROM practices p WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL AND p.status <> 'draft')::bigint AS activated,
        (SELECT COUNT(*) FROM practice_checkins pc JOIN practices p ON p.id = pc.practice_id WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL)::bigint AS checkins,
        (SELECT COUNT(*) FROM comments c JOIN practice_checkins pc ON pc.id = c.target_id JOIN practices p ON p.id = pc.practice_id
           WHERE c.target_type = 'checkin' AND p.cohort_id = ${cohortId} AND p.deleted_at IS NULL)::bigint AS comments
    `),
    prisma.$queryRaw<Array<{ title: string; participants: bigint; started: bigint; completed: bigint; checkins: bigint; comments: bigint }>>(Prisma.sql`
      SELECT COALESCE(pt.title, p.title) AS title,
             COUNT(DISTINCT p.id)::bigint AS participants,
             COUNT(DISTINCT p.id) FILTER (WHERE p.status <> 'draft')::bigint AS started,
             COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed')::bigint AS completed,
             COUNT(DISTINCT pc.id)::bigint AS checkins,
             COUNT(DISTINCT c.id)::bigint AS comments
      FROM practices p
      LEFT JOIN practice_templates pt ON pt.id = p.template_id
      LEFT JOIN practice_checkins pc ON pc.practice_id = p.id
      LEFT JOIN comments c ON c.target_type = 'checkin' AND c.target_id = pc.id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      GROUP BY 1 ORDER BY MIN(p.created_at), 1
    `),
    prisma.$queryRaw<Array<{ user_id: number; nickname: string | null; avatar: string | null; practice_id: number; practice_title: string; practice_status: string | null; checkin_count: bigint; response_count: bigint; target_count: number | null; progress: number | null; last_checkin_at: Date | null; last_response_at: Date | null }>>(Prisma.sql`
      SELECT p.user_id, u.nickname, ct.photo_url AS avatar, p.id AS practice_id, COALESCE(pt.title, p.title) AS practice_title, p.status AS practice_status,
             (SELECT COUNT(*) FROM practice_checkins pc WHERE pc.practice_id = p.id)::bigint AS checkin_count,
             (SELECT COUNT(*) FROM comments c JOIN practice_checkins pc ON pc.id = c.target_id WHERE c.target_type = 'checkin' AND pc.practice_id = p.id)::bigint AS response_count,
             CASE WHEN p.duration_days IS NOT NULL AND p.frequency_min_days IS NOT NULL
                  THEN CEIL(p.duration_days / 7.0 * p.frequency_min_days)::int ELSE NULL END AS target_count,
             p.progress_percentage::float AS progress,
             (SELECT MAX(pc.created_at) FROM practice_checkins pc WHERE pc.practice_id = p.id) AS last_checkin_at,
             (SELECT MAX(c.created_at) FROM comments c JOIN practice_checkins pc ON pc.id = c.target_id WHERE c.target_type = 'checkin' AND pc.practice_id = p.id) AS last_response_at
      FROM practices p
      LEFT JOIN practice_templates pt ON pt.id = p.template_id
      JOIN users u ON u.id = p.user_id
      LEFT JOIN contacts ct ON ct.id = u.contact_id
      WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL
      ORDER BY u.nickname NULLS LAST, p.user_id, practice_title
    `),
    listSummaries(cohortId),
    prisma.organization_ai_credentials.findUnique({ where: { organization_id: cohort.program.organization_id }, select: { status: true, provider: true, key_last4: true } }),
    prisma.cohort_stat_snapshots.findFirst({ where: { cohort_id: cohortId, kind: 'final' }, orderBy: { computed_at: 'desc' }, select: { computed_at: true } }),
    platformUsedToday(cohortId, timezone, now)
  ]);
  const overview = overviewRows[0];
  const versions = summaries.map(mapSummary);
  return {
    cohortId,
    cohort: { displayName: cohort.display_name, programName: cohort.program.name, startDate: cohort.start_date, endDate: cohort.end_date },
    phase: resolvePhase(cohort, timezone, now),
    finalizedAt: finalSnapshot?.computed_at ?? null,
    overview: { participants: count(overview?.participants), activatedPractices: count(overview?.activated), checkins: count(overview?.checkins), comments: count(overview?.comments) },
    ai: {
      platformAvailable: aiBackendClient.isConfigured(),
      ownKey: {
        status: (credential?.status as CohortOutcomeResponse['ai']['ownKey']['status'] | undefined) ?? 'unset',
        provider: (credential?.provider as CohortOutcomeResponse['ai']['ownKey']['provider'] | undefined) ?? 'openai',
        keyLast4: credential?.key_last4 ?? null
      },
      platformDailyLimit: PLATFORM_DAILY_LIMIT,
      platformUsedToday: usedToday
    },
    summary: { current: versions.find(version => version.isCurrent) ?? null, versions },
    practiceOutcomes: practiceRows.map(row => ({ title: row.title, participants: count(row.participants), started: count(row.started), completed: count(row.completed), checkins: count(row.checkins), comments: count(row.comments) })),
    participantProgress: participantRows.map(row => {
      const checkinCount = count(row.checkin_count);
      const targetCount = row.target_count ?? 0;
      const lastActivityAt = [row.last_checkin_at, row.last_response_at].filter((value): value is Date => value instanceof Date).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
      return {
        userId: row.user_id, nickname: row.nickname, avatar: row.avatar, practiceId: row.practice_id, practiceTitle: row.practice_title, practiceStatus: row.practice_status ?? 'draft',
        completedCount: targetCount > 0 ? Math.min(checkinCount, targetCount) : checkinCount, targetCount,
        progressPercentage: Math.max(0, Math.round(row.progress ?? 0)), checkinCount, responseCount: count(row.response_count), lastActivityAt
      };
    }),
    generatedAt: now
  };
};

/** 新增一版摘要並把它設為目前版本（partial unique index 保證同時只有一筆 is_current） */
const insertVersion = async (cohortId: number, actorId: number, data: { source: 'platform_ai' | 'own_ai' | 'manual'; content: string; provider?: string | null; modelName?: string | null; inputRange?: Record<string, unknown> | null; usage?: Record<string, unknown> | null; generatedAt?: Date | null }): Promise<OutcomeSummaryVersion> => {
  const row = await prisma.$transaction(async tx => {
    const latest = await tx.cohort_outcome_summaries.findFirst({ where: { cohort_id: cohortId }, orderBy: { version: 'desc' }, select: { version: true } });
    await tx.cohort_outcome_summaries.updateMany({ where: { cohort_id: cohortId, is_current: true }, data: { is_current: false } });
    const created = await tx.cohort_outcome_summaries.create({
      data: {
        cohort_id: cohortId, version: (latest?.version ?? 0) + 1, source: data.source, content: data.content, is_current: true,
        provider: data.provider ?? null, model_name: data.modelName ?? null, prompt_version: data.source === 'manual' ? null : SUMMARY_PROMPT_VERSION,
        input_range: (data.inputRange ?? undefined) as Prisma.InputJsonValue | undefined, usage: (data.usage ?? undefined) as Prisma.InputJsonValue | undefined,
        generated_at: data.generatedAt ?? null, created_by: actorId
      },
      select: summarySelect
    });
    await writeLighthouseAudit(tx, actorId, LIGHTHOUSE_AUDIT_ACTIONS.COHORT_OUTCOME_SUMMARY_SAVED, 'cohort', cohortId, { previousVersion: latest?.version ?? null }, { version: created.version, source: data.source });
    return created;
  });
  return mapSummary(row);
};

interface SummaryEntry { participant: string; practice: string; date: string; kind: 'checkin' | 'comment'; mood: string | null; text: string }

/** 組給 AI 的資料：打卡筆記與公開留言，暱稱去識別化為「參與者 N」，私密留言（帶領人私訊）不送 */
const collectSummaryInput = async (cohortId: number): Promise<{ entries: SummaryEntry[]; range: Record<string, unknown> }> => {
  // 先撈這個場次的打卡 id 對照表，留言查詢用 target_id IN (...) 鎖在場次內（不然全站最近 N 筆留言可能完全不含本場次）
  const checkinRows = await prisma.practice_checkins.findMany({ where: { practices: { cohort_id: cohortId, deleted_at: null } }, select: { id: true, practices: { select: { title: true, practice_templates: { select: { title: true } } } } } });
  const checkinIds = new Set<number>();
  const practiceByCheckin = new Map(checkinRows.map(row => { checkinIds.add(row.id); return [row.id, row.practices.practice_templates?.title ?? row.practices.title]; }));
  const [checkins, comments] = await Promise.all([
    prisma.practice_checkins.findMany({
      where: { practices: { cohort_id: cohortId, deleted_at: null }, note: { not: null }, created_at: { not: null } },
      select: { user_id: true, note: true, mood: true, created_at: true, practices: { select: { title: true, practice_templates: { select: { title: true } } } } },
      orderBy: { created_at: 'desc' }, take: SUMMARY_MAX_CHECKINS
    }),
    checkinIds.size === 0
      ? Promise.resolve([] as Array<{ user_id: number; content: string; created_at: Date | null; target_id: number }>)
      : prisma.comments.findMany({
        where: { target_type: 'checkin', target_id: { in: [...checkinIds] }, visibility: 'public', created_at: { not: null }, content: { not: '' } },
        select: { user_id: true, content: true, created_at: true, target_id: true },
        orderBy: { created_at: 'desc' }, take: SUMMARY_MAX_COMMENTS
      })
  ]);
  const aliases = new Map<number, string>();
  const alias = (userId: number): string => { if (!aliases.has(userId)) aliases.set(userId, `參與者 ${aliases.size + 1}`); return aliases.get(userId) as string; };
  const entries: SummaryEntry[] = [];
  for (const row of checkins) {
    if (!row.note?.trim() || !row.created_at) continue;
    entries.push({ participant: alias(row.user_id), practice: row.practices.practice_templates?.title ?? row.practices.title, date: row.created_at.toISOString().slice(0, 10), kind: 'checkin', mood: row.mood, text: row.note.trim() });
  }
  let commentCount = 0;
  for (const row of comments) {
    if (!checkinIds.has(row.target_id) || !row.created_at || commentCount >= SUMMARY_MAX_COMMENTS) continue;
    commentCount += 1;
    entries.push({ participant: alias(row.user_id), practice: practiceByCheckin.get(row.target_id) ?? '', date: row.created_at.toISOString().slice(0, 10), kind: 'comment', mood: null, text: row.content.trim() });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  const dates = entries.map(entry => entry.date);
  return {
    entries,
    range: { from: dates[0] ?? null, to: dates[dates.length - 1] ?? null, checkinCount: entries.length - commentCount, commentCount, participants: aliases.size, includesPrivateComments: false, anonymized: true }
  };
};

interface AiSummaryResponse { summary: string; provider?: string; model?: string; usage?: Record<string, unknown> }

/** 產生／重新產生 AI 摘要（FR-OUT-02/03/08） */
const generateSummary = async (programId: number, cohortId: number, actorId: number, input: GenerateOutcomeSummaryInput, userToken: string | null, now = new Date()): Promise<OutcomeSummaryVersion> => {
  const cohort = await assertCoach(programId, cohortId, actorId);
  const timezone = cohort.program.organization.timezone || APP_TIMEZONE;
  if (!aiBackendClient.isConfigured()) throw new ConflictError('AI 服務尚未設定，暫時無法產生摘要');

  let credential: { provider: string; apiKey: string } | null = null;
  if (input.mode === 'own') {
    const status = await prisma.organization_ai_credentials.findUnique({ where: { organization_id: cohort.program.organization_id }, select: { status: true } });
    if (!status || status.status === 'unset') throw new ConflictError('請先到組織設定完成 AI API key 設定');
    if (status.status === 'invalid') throw new ConflictError('組織的 AI API key 測試連線失敗，請先到組織設定更新');
    if (status.status === 'disabled') throw new ConflictError('組織的 AI API key 已停用');
    credential = await organizationAiCredentialService.resolveApiKey(cohort.program.organization_id);
    if (!credential) throw new ConflictError('請先到組織設定完成 AI API key 設定');
  } else {
    const used = await platformUsedToday(cohortId, timezone, now);
    if (used >= PLATFORM_DAILY_LIMIT) throw new TooManyRequestsError(`平台 AI 每個場次每天最多產生 ${PLATFORM_DAILY_LIMIT} 次摘要，今天已用完`);
  }

  const { entries, range } = await collectSummaryInput(cohortId);
  if (entries.length === 0) throw new ConflictError('目前還沒有打卡或留言可以整理，請等參與者開始行動後再產生摘要');

  const overview = await prisma.$queryRaw<Array<{ participants: bigint; checkins: bigint }>>(Prisma.sql`
    SELECT (SELECT COUNT(*) FROM cohort_enrollments ce WHERE ce.cohort_id = ${cohortId} AND ce.status = 'joined' AND ce.role = 'member')::bigint AS participants,
           (SELECT COUNT(*) FROM practice_checkins pc JOIN practices p ON p.id = pc.practice_id WHERE p.cohort_id = ${cohortId} AND p.deleted_at IS NULL)::bigint AS checkins
  `);
  let result: AiSummaryResponse;
  try {
    result = await aiBackendClient.post<AiSummaryResponse>('/api/v1/cohort-summary/generate', {
      cohort: { name: cohort.display_name, programName: cohort.program.name, startDate: day(cohort.start_date), endDate: day(cohort.end_date), phase: resolvePhase(cohort, timezone, now), participants: count(overview[0]?.participants), checkins: count(overview[0]?.checkins) },
      entries,
      ...(credential ? { provider: credential.provider, apiKey: credential.apiKey } : {})
    }, { userToken });
  } catch (error) {
    if (error instanceof AiBackendError) {
      if (error.code === 'rate_limited') throw new TooManyRequestsError(error.message);
      throw new ConflictError(error.message);
    }
    throw error;
  }
  const content = result.summary?.trim();
  if (!content) throw new ConflictError('AI 沒有產生可用的摘要，請再試一次');
  return insertVersion(cohortId, actorId, {
    source: input.mode === 'own' ? 'own_ai' : 'platform_ai', content,
    provider: result.provider ?? credential?.provider ?? null, modelName: result.model ?? null, inputRange: range, usage: result.usage ?? null, generatedAt: now
  });
};

/** 人工編輯摘要：新版本 source=manual（FR-OUT-04，空白由 validator 擋） */
const editSummary = async (programId: number, cohortId: number, actorId: number, input: EditOutcomeSummaryInput): Promise<OutcomeSummaryVersion> => {
  await assertCoach(programId, cohortId, actorId);
  const content = input.content.trim();
  if (!content) throw new ConflictError('摘要不可空白');
  return insertVersion(cohortId, actorId, { source: 'manual', content });
};

/** PDF 由前端列印版頁面產生；這裡只記匯出稽核（FR-OUT-07 權限與紀錄） */
const recordReportExport = async (programId: number, cohortId: number, actorId: number, filename: string | undefined, now = new Date()): Promise<{ cohortId: number; filename: string; exportedAt: Date }> => {
  const cohort = await assertCoach(programId, cohortId, actorId);
  const resolvedName = filename?.trim() || `${cohort.display_name}_成果報告_${calendarDay(now, cohort.program.organization.timezone || APP_TIMEZONE).replace(/-/g, '')}.pdf`;
  await writeLighthouseAudit(prisma, actorId, LIGHTHOUSE_AUDIT_ACTIONS.COHORT_OUTCOME_EXPORTED, 'cohort', cohortId, {}, { format: 'pdf', filename: resolvedName, phase: resolvePhase(cohort, cohort.program.organization.timezone || APP_TIMEZONE, now) });
  return { cohortId, filename: resolvedName, exportedAt: now };
};

export const cohortOutcomeService = { get, generateSummary, editSummary, recordReportExport, resolvePhase };
