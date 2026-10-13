/**
 * 共同挑戰管理服務（admin）
 *
 * openspec: challenge-authoring。以 lighthouse 資料模型管理挑戰：
 * 主題 = programs(kind='challenge') → 期 = cohorts → 模板/開始日 = cohort_templates。
 * 權限由 requireAdmin 把關，此處不做組織成員檢查（與 lighthouse owner 端服務的差異）。
 * 共同挑戰只屬於島島阿學（daodao#179）：主題與模板一律落在官方組織，讀寫也只看官方組織的資料，
 * 不接受 client 指定組織。
 *
 * 期間規則：共同挑戰為固定時段，所有參與者共用同一段起訖日；綁定的模板若有 duration_days，
 * end_date 由 start_date + duration_days - 1 推算，確保加入時複製出的實踐與挑戰期間一致。
 */

import { randomBytes } from 'crypto';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import { MS_PER_DAY } from '../utils/date-utils';
import { PROGRAM_KINDS } from '../constants/program-kind';
import type {
  AdminCohortResponse,
  AdminCreateCohortInput,
  AdminCreateProgramInput,
  AdminCreateTemplateInput,
  AdminUpdateCohortInput,
  AdminUpdateProgramInput,
  AdminUpdateTemplateInput
} from '../validators/admin-challenge.validator';
import { DURATION_DAYS_MAX } from '../validators/practice.validators';
import { challengeOrganizationService } from './challenge-organization.service';
import { deriveRunStatus } from './challenge.service';
import { prisma } from './database/prisma.service';
import { organizationTemplateInternals } from './organization-template.service';

const { select: templateSelect, map: mapTemplate, loadResources, replaceResources } = organizationTemplateInternals;

const toDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const isCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code;

/** 由開始日與持續天數推算結束日（含頭尾共 durationDays 天，與 cohort-draft.service 一致） */
export const computeEndDate = (startDate: Date, durationDays: number): Date => {
  const end = new Date(startDate);
  end.setUTCDate(end.getUTCDate() + durationDays - 1);
  return end;
};

// ── program ─────────────────────────────────────────────────────

const programSelect = {
  id: true, organization_id: true, name: true, description: true, created_at: true, updated_at: true,
  organization: { select: { name: true } },
  cohorts: { select: { status: true } }
} as const;

type ProgramRow = {
  id: number; organization_id: number; name: string; description: string | null; created_at: Date; updated_at: Date | null;
  organization: { name: string };
  cohorts: Array<{ status: string }>;
};

const mapProgram = (row: ProgramRow) => ({
  id: row.id,
  organizationId: row.organization_id,
  organizationName: row.organization.name,
  name: row.name,
  description: row.description,
  cohortCount: row.cohorts.filter(cohort => cohort.status !== 'archived').length,
  publishedCohortCount: row.cohorts.filter(cohort => cohort.status === 'published').length,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const getProgram = async (programId: number) => {
  const organizationId = await challengeOrganizationService.getOrganizationId();
  const row = await prisma.programs.findFirst({
    where: { id: programId, organization_id: organizationId, kind: PROGRAM_KINDS.CHALLENGE, archived_at: null, deleted_at: null },
    select: programSelect
  });
  if (!row) throw new NotFoundError('找不到挑戰主題');
  return row;
};

const listPrograms = async () => {
  const organizationId = await challengeOrganizationService.getOrganizationId();
  const rows = await prisma.programs.findMany({
    where: { kind: PROGRAM_KINDS.CHALLENGE, organization_id: organizationId, archived_at: null, deleted_at: null },
    select: programSelect,
    orderBy: { created_at: 'desc' }
  });
  return rows.map(mapProgram);
};

const createProgram = async (input: AdminCreateProgramInput) => {
  const organizationId = await challengeOrganizationService.getActiveOrganizationId();
  const row = await prisma.programs.create({
    data: { organization_id: organizationId, name: input.name, description: input.description ?? null, kind: PROGRAM_KINDS.CHALLENGE },
    select: programSelect
  });
  return mapProgram(row);
};

const updateProgram = async (programId: number, input: AdminUpdateProgramInput) => {
  await getProgram(programId);
  const row = await prisma.programs.update({
    where: { id: programId },
    data: { ...(input.name !== undefined && { name: input.name }), ...(input.description !== undefined && { description: input.description }), updated_at: new Date() },
    select: programSelect
  });
  return mapProgram(row);
};

/** 封存主題（軟刪除）：底下仍有未封存的期時拒絕，避免把已發佈挑戰一併藏掉 */
const archiveProgram = async (programId: number): Promise<void> => {
  const program = await getProgram(programId);
  if (program.cohorts.some(cohort => cohort.status !== 'archived')) {
    throw new ConflictError('主題底下仍有未封存的挑戰，請先封存所有挑戰');
  }
  await prisma.programs.update({ where: { id: programId }, data: { archived_at: new Date(), updated_at: new Date() } });
};

/** 複製主題（只複製名稱與描述，不複製期） */
const duplicateProgram = async (programId: number) => {
  await challengeOrganizationService.getActiveOrganizationId();
  const source = await getProgram(programId);
  const row = await prisma.programs.create({
    data: { organization_id: source.organization_id, name: `${source.name}（副本）`.slice(0, 100), description: source.description, kind: PROGRAM_KINDS.CHALLENGE },
    select: programSelect
  });
  return mapProgram(row);
};

// ── cohort ──────────────────────────────────────────────────────

const cohortSelect = {
  id: true, program_id: true, slug: true, display_name: true, start_date: true, end_date: true,
  join_deadline: true, capacity: true, status: true, created_at: true, updated_at: true,
  cohort_templates: {
    where: { unbound_at: null },
    select: { template_id: true, practice_template: { select: { title: true, duration_days: true } } },
    orderBy: { bound_at: 'asc' as const }
  },
  inspiration_deck_assignments: {
    where: { unassigned_at: null, deck: { deleted_at: null } },
    select: { deck: { select: { id: true, name: true } } }
  },
  _count: { select: { cohort_enrollments: { where: { status: 'joined' } } } }
} as const;

type CohortRow = {
  id: number; program_id: number; slug: string; display_name: string; start_date: Date; end_date: Date;
  join_deadline: Date | null; capacity: number | null; status: string; created_at: Date; updated_at: Date | null;
  cohort_templates: Array<{ template_id: number; practice_template: { title: string; duration_days: number | null } }>;
  inspiration_deck_assignments: Array<{ deck: { id: number; name: string } }>;
  _count: { cohort_enrollments: number };
};

const asEditStatus = (status: string): AdminCohortResponse['status'] => {
  if (status === 'draft' || status === 'published' || status === 'archived') return status;
  throw new Error(`Invalid cohort status: ${status}`);
};

const mapCohort = (row: CohortRow, now = new Date()): AdminCohortResponse => {
  const binding = row.cohort_templates[0] ?? null;
  return {
    id: row.id,
    programId: row.program_id,
    slug: row.slug,
    displayName: row.display_name,
    startDate: row.start_date,
    endDate: row.end_date,
    joinDeadline: row.join_deadline,
    capacity: row.capacity,
    status: asEditStatus(row.status),
    runStatus: deriveRunStatus(row.start_date, row.end_date, now),
    participantCount: row._count.cohort_enrollments,
    template: binding === null
      ? null
      : { id: binding.template_id, title: binding.practice_template.title, durationDays: binding.practice_template.duration_days },
    decks: row.inspiration_deck_assignments.map(assignment => ({ id: assignment.deck.id, name: assignment.deck.name })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const getCohort = async (programId: number, cohortId: number) => {
  const organizationId = await challengeOrganizationService.getOrganizationId();
  const row = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, program: { organization_id: organizationId, kind: PROGRAM_KINDS.CHALLENGE, archived_at: null, deleted_at: null } },
    select: cohortSelect
  });
  if (!row) throw new NotFoundError('找不到挑戰');
  return row;
};

const listCohorts = async (programId: number, now = new Date()) => {
  await getProgram(programId);
  const rows = await prisma.cohorts.findMany({ where: { program_id: programId }, select: cohortSelect, orderBy: { start_date: 'desc' } });
  return rows.map(row => mapCohort(row, now));
};

/** 取模板（必須與主題同組織），回傳持續天數供推算結束日 */
const getTemplateForProgram = async (templateId: number, organizationId: number) => {
  const template = await prisma.practice_templates.findFirst({
    where: { id: templateId, organization_id: organizationId },
    select: { id: true, duration_days: true }
  });
  if (!template) throw new NotFoundError('找不到同組織的模板');
  return template;
};

/**
 * 共同挑戰期間上限（FRD FR-CC-03「91 天內」，daodaoedu/daodao#300）：含頭尾超過 DURATION_DAYS_MAX 天時拒絕，
 * 讓加入時複製出的實踐 duration_days 一定寫得進 practices CHECK（1–91），不會落到空天數。
 */
const assertWithinMaxPeriod = (startDate: Date, endDate: Date): void => {
  const days = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  if (days > DURATION_DAYS_MAX) {
    throw new BadRequestError(`挑戰期間最多 ${DURATION_DAYS_MAX} 天（目前為 ${days} 天），請調整開始日或結束日`);
  }
};

/** 依模板持續天數推算結束日；沒有持續天數時必須手動給結束日 */
const resolveEndDate = (startDate: Date, endDateInput: string | undefined, durationDays: number | null | undefined): Date => {
  if (durationDays) {
    const endDate = computeEndDate(startDate, durationDays);
    assertWithinMaxPeriod(startDate, endDate);
    return endDate;
  }
  if (!endDateInput) throw new BadRequestError('模板未設定持續天數時，必須提供結束日');
  const endDate = toDate(endDateInput);
  if (startDate > endDate) throw new BadRequestError('開始日期不可晚於結束日期');
  assertWithinMaxPeriod(startDate, endDate);
  return endDate;
};

/** 自動 slug：挑戰不走邀請連結，slug 只需在主題內唯一 */
const generateSlug = (startDate: string): string => `challenge-${startDate}-${randomBytes(2).toString('hex')}`;

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** 共同挑戰一期只綁一個模板：綁定新模板時解除其他綁定；開始日一律同步為期的開始日 */
const syncTemplateBinding = async (tx: Tx, cohortId: number, templateId: number | null, startDate: Date): Promise<void> => {
  await tx.cohort_templates.updateMany({
    where: { cohort_id: cohortId, unbound_at: null, ...(templateId !== null && { template_id: { not: templateId } }) },
    data: { unbound_at: new Date() }
  });
  if (templateId === null) return;
  await tx.cohort_templates.upsert({
    where: { cohort_id_template_id: { cohort_id: cohortId, template_id: templateId } },
    create: { cohort_id: cohortId, template_id: templateId, start_date: startDate },
    update: { unbound_at: null, bound_at: new Date(), start_date: startDate }
  });
};

const createCohort = async (programId: number, input: AdminCreateCohortInput, now = new Date()) => {
  await challengeOrganizationService.getActiveOrganizationId();
  const program = await getProgram(programId);
  const template = input.templateId ? await getTemplateForProgram(input.templateId, program.organization_id) : null;
  const startDate = toDate(input.startDate);
  const endDate = resolveEndDate(startDate, input.endDate, template?.duration_days);
  if (input.joinDeadline && toDate(input.joinDeadline) > endDate) throw new BadRequestError('加入截止日不可晚於結束日');

  const cohortId = await prisma.$transaction(async tx => {
    let created: { id: number } | null = null;
    for (let attempt = 0; attempt < 3 && created === null; attempt += 1) {
      try {
        created = await tx.cohorts.create({
          data: {
            program_id: programId, slug: generateSlug(input.startDate), display_name: input.displayName,
            start_date: startDate, end_date: endDate, join_deadline: input.joinDeadline ? toDate(input.joinDeadline) : null,
            capacity: input.capacity ?? null, status: 'draft', join_token: null
          },
          select: { id: true }
        });
      } catch (error) {
        if (!isCode(error, 'P2002') || attempt === 2) throw error;
      }
    }
    if (created === null) throw new ConflictError('無法產生唯一的挑戰代碼，請重試');
    if (template) await syncTemplateBinding(tx, created.id, template.id, startDate);
    return created.id;
  });
  return mapCohort(await getCohort(programId, cohortId), now);
};

const LOCKED_AFTER_JOIN: Array<keyof AdminUpdateCohortInput> = ['startDate', 'endDate', 'templateId'];

const updateCohort = async (programId: number, cohortId: number, input: AdminUpdateCohortInput, now = new Date()) => {
  const program = await getProgram(programId);
  const current = await getCohort(programId, cohortId);
  if (current.status === 'archived') throw new ConflictError('已封存的挑戰不可修改');
  if (current._count.cohort_enrollments > 0 && LOCKED_AFTER_JOIN.some(field => input[field] !== undefined)) {
    throw new ConflictError('已有人加入的挑戰不可更改期間或模板');
  }

  const currentBinding = current.cohort_templates[0] ?? null;
  // 只有換模板才驗證同組織；沿用既有綁定時直接取其持續天數（既有綁定可能是平台共用模板）
  const nextTemplateId = input.templateId === undefined ? (currentBinding?.template_id ?? null) : input.templateId;
  const durationDays = input.templateId === undefined
    ? currentBinding?.practice_template.duration_days ?? null
    : input.templateId === null ? null : (await getTemplateForProgram(input.templateId, program.organization_id)).duration_days;
  const startDate = input.startDate ? toDate(input.startDate) : current.start_date;
  // 只在動到期間或模板時重算結束日（模板有持續天數 → 由推算決定；否則沿用輸入或現值）；
  // 純改名稱／名額不碰日期，避免歷史資料被靜默改寫
  const touchesPeriod = input.startDate !== undefined || input.endDate !== undefined || input.templateId !== undefined;
  const endDate = touchesPeriod
    ? resolveEndDate(startDate, input.endDate ?? current.end_date.toISOString().slice(0, 10), durationDays)
    : current.end_date;
  const joinDeadline = input.joinDeadline === undefined ? current.join_deadline : input.joinDeadline === null ? null : toDate(input.joinDeadline);
  if (joinDeadline && joinDeadline > endDate) throw new BadRequestError('加入截止日不可晚於結束日');

  await prisma.$transaction(async tx => {
    await tx.cohorts.update({
      where: { id: cohortId },
      data: {
        ...(input.displayName !== undefined && { display_name: input.displayName }),
        start_date: startDate, end_date: endDate, join_deadline: joinDeadline,
        ...(input.capacity !== undefined && { capacity: input.capacity }),
        updated_at: new Date()
      }
    });
    await syncTemplateBinding(tx, cohortId, nextTemplateId, startDate);
  });
  return mapCohort(await getCohort(programId, cohortId), now);
};

/** 發佈／下架：發佈前必須綁定模板（FR-CC-05），已結束的挑戰不可再發佈 */
const setCohortStatus = async (programId: number, cohortId: number, status: 'draft' | 'published', now = new Date()) => {
  const current = await getCohort(programId, cohortId);
  if (current.status === 'archived') throw new ConflictError('已封存的挑戰不可變更發佈狀態');
  if (status === 'published') {
    if (current.cohort_templates.length === 0) throw new ConflictError('發佈前必須先指定使用模板');
    if (deriveRunStatus(current.start_date, current.end_date, now) === 'ended') throw new ConflictError('已結束的挑戰不可發佈');
  }
  await prisma.cohorts.update({ where: { id: cohortId }, data: { status, updated_at: new Date() } });
  return mapCohort(await getCohort(programId, cohortId), now);
};

const archiveCohort = async (programId: number, cohortId: number): Promise<void> => {
  await getCohort(programId, cohortId);
  await prisma.cohorts.update({ where: { id: cohortId }, data: { status: 'archived', updated_at: new Date() } });
};

/** 複製挑戰：以草稿建立同期間、同模板的新挑戰（不複製參與者與卡組指派） */
const duplicateCohort = async (programId: number, cohortId: number, now = new Date()) => {
  await challengeOrganizationService.getActiveOrganizationId();
  const source = await getCohort(programId, cohortId);
  // 複製也是建立新挑戰：#300 之前建立的舊挑戰可能超過 91 天，副本不可沿用
  assertWithinMaxPeriod(source.start_date, source.end_date);
  const templateId = source.cohort_templates[0]?.template_id ?? null;
  const startDate = source.start_date.toISOString().slice(0, 10);
  const newId = await prisma.$transaction(async tx => {
    const created = await tx.cohorts.create({
      data: {
        program_id: programId, slug: generateSlug(startDate), display_name: `${source.display_name}（副本）`.slice(0, 100),
        start_date: source.start_date, end_date: source.end_date, join_deadline: source.join_deadline,
        capacity: source.capacity, status: 'draft', join_token: null
      },
      select: { id: true }
    });
    if (templateId !== null) await syncTemplateBinding(tx, created.id, templateId, source.start_date);
    return created.id;
  });
  return mapCohort(await getCohort(programId, newId), now);
};

const listParticipants = async (programId: number, cohortId: number) => {
  await getCohort(programId, cohortId);
  const [enrollments, practices] = await Promise.all([
    prisma.cohort_enrollments.findMany({
      where: { cohort_id: cohortId, status: 'joined', user_id: { not: null } },
      select: { id: true, user_id: true, joined_at: true, user: { select: { nickname: true } } },
      orderBy: { joined_at: 'asc' }
    }),
    prisma.practices.findMany({
      where: { cohort_id: cohortId, creation_source: 'cohort_template', deleted_at: null },
      select: { user_id: true, external_id: true, _count: { select: { practice_checkins: true } } }
    })
  ]);
  const practiceByUser = new Map(practices.map(practice => [practice.user_id, practice]));
  return enrollments.map(enrollment => {
    const practice = enrollment.user_id === null ? undefined : practiceByUser.get(enrollment.user_id);
    return {
      enrollmentId: enrollment.id,
      userId: enrollment.user_id as number,
      nickname: enrollment.user?.nickname ?? null,
      joinedAt: enrollment.joined_at,
      practiceId: practice?.external_id ?? null,
      checkinCount: practice?._count.practice_checkins ?? 0
    };
  });
};

// ── template ────────────────────────────────────────────────────

const listTemplates = async () => {
  const organizationId = await challengeOrganizationService.getOrganizationId();
  const rows = await prisma.practice_templates.findMany({ where: { organization_id: organizationId }, select: templateSelect, orderBy: { created_at: 'desc' } });
  const resources = await loadResources(rows.map(row => row.id));
  return rows.map(row => mapTemplate(row, resources.get(row.id) ?? []));
};

const createTemplate = async (input: AdminCreateTemplateInput, actorId: number) => {
  const organizationId = await challengeOrganizationService.getActiveOrganizationId();
  const row = await prisma.practice_templates.create({
    data: {
      organization_id: organizationId, title: input.title, practice_action: input.practiceAction ?? null,
      duration_days: input.durationDays ?? null, frequency_min_days: input.frequencyMinDays ?? null,
      frequency_max_days: input.frequencyMaxDays ?? null, session_duration_minutes: input.sessionDurationMinutes ?? null,
      practice_time_periods: input.practiceTimePeriods
    },
    select: templateSelect
  });
  if (input.resources?.length) await replaceResources(row.id, actorId, input.resources);
  return mapTemplate(row, (await loadResources([row.id])).get(row.id) ?? []);
};

const getTemplate = async (templateId: number) => {
  const organizationId = await challengeOrganizationService.getOrganizationId();
  const existing = await prisma.practice_templates.findFirst({ where: { id: templateId, organization_id: organizationId }, select: { id: true } });
  if (!existing) throw new NotFoundError('找不到模板');
};

const updateTemplate = async (templateId: number, input: AdminUpdateTemplateInput, actorId: number) => {
  await getTemplate(templateId);
  const row = await prisma.practice_templates.update({
    where: { id: templateId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.practiceAction !== undefined && { practice_action: input.practiceAction }),
      ...(input.durationDays !== undefined && { duration_days: input.durationDays }),
      ...(input.frequencyMinDays !== undefined && { frequency_min_days: input.frequencyMinDays }),
      ...(input.frequencyMaxDays !== undefined && { frequency_max_days: input.frequencyMaxDays }),
      ...(input.sessionDurationMinutes !== undefined && { session_duration_minutes: input.sessionDurationMinutes }),
      ...(input.practiceTimePeriods !== undefined && { practice_time_periods: input.practiceTimePeriods }),
      updated_at: new Date()
    },
    select: templateSelect
  });
  if (input.resources !== undefined) await replaceResources(templateId, actorId, input.resources);
  return mapTemplate(row, (await loadResources([templateId])).get(templateId) ?? []);
};

const deleteTemplate = async (templateId: number): Promise<void> => {
  await getTemplate(templateId);
  const bindings = await prisma.cohort_templates.count({ where: { template_id: templateId } });
  if (bindings > 0) throw new ConflictError('模板已有綁定歷程，請保留或先建立新模板');
  await prisma.practice_templates.delete({ where: { id: templateId } });
};

export const adminChallengeService = {
  listPrograms, createProgram, updateProgram, archiveProgram, duplicateProgram,
  listCohorts, createCohort, updateCohort, setCohortStatus, archiveCohort, duplicateCohort, listParticipants,
  listTemplates, createTemplate, updateTemplate, deleteTemplate
};
