import type { CreateCohortInput, CohortResponse, OrganizationCohortResponse, UpdateCohortInput } from '../validators/cohort.validators';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { randomUUID } from 'crypto';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';

const select = { id: true, program_id: true, slug: true, display_name: true, start_date: true, end_date: true, join_token: true, join_paused: true, join_deadline: true, capacity: true, invite_message: true, status: true, created_at: true, updated_at: true } as const;
type CohortRow = { id: number; program_id: number; slug: string; display_name: string; start_date: Date; end_date: Date; join_token: string | null; join_paused: boolean; join_deadline: Date | null; capacity: number | null; invite_message: string | null; status: string; created_at: Date; updated_at: Date | null };
const asStatus = (status: string): CohortResponse['status'] => {
  if (status === 'draft' || status === 'published' || status === 'archived') return status;
  throw new Error(`Invalid cohort status: ${status}`);
};
const map = (row: CohortRow): CohortResponse => ({
  id: row.id, programId: row.program_id, slug: row.slug, displayName: row.display_name,
  startDate: row.start_date, endDate: row.end_date, joinToken: row.join_token, joinPaused: row.join_paused,
  joinDeadline: row.join_deadline, capacity: row.capacity, inviteMessage: row.invite_message,
  status: asStatus(row.status), createdAt: row.created_at, updatedAt: row.updated_at
});
const date = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const isCode = (error: unknown, code: string): boolean => typeof error === 'object' && error !== null && 'code' in error && error.code === code;
/** 複製場次時的 slug 候選：`<slug>-copy`、`<slug>-copy-2`…，仍需符合 slug 規則與 50 字上限 */
const copySlug = (slug: string, attempt: number): string => {
  const suffix = attempt === 0 ? '-copy' : `-copy-${attempt + 1}`;
  return `${slug.slice(0, 50 - suffix.length)}${suffix}`;
};

const assertProgram = async (programId: number, userId: number): Promise<void> => {
  const program = await prisma.programs.findFirst({
    where: { id: programId, deleted_at: null, organization: { organization_members: { some: { user_id: userId } } } },
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
    where: { id: cohortId, program_id: programId, program: { deleted_at: null, organization: { organization_members: { some: { user_id: userId } } } } },
    select: { ...select, program: { select: { organization: { select: { status: true } } } } }
  });
  if (!row) throw new ForbiddenError('無權限存取此場次');
  if (row.program.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
  return row;
};
const list = async (programId: number, userId: number): Promise<CohortResponse[]> => {
  await assertProgram(programId, userId);
  return (await prisma.cohorts.findMany({ where: { program_id: programId }, select, orderBy: { created_at: 'asc' } })).map(map);
};
/**
 * 組織底下所有系列的全部場次（總覽頁一次列出，含草稿與封存），附系列名稱與已加入人數
 */
const listByOrganization = async (organizationId: number, userId: number): Promise<OrganizationCohortResponse[]> => {
  await assertOrganization(organizationId, userId);
  const rows = await prisma.cohorts.findMany({
    where: { program: { organization_id: organizationId, deleted_at: null } },
    select: { ...select, program: { select: { name: true } } },
    orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }]
  });
  const joined = rows.length === 0 ? [] : await prisma.cohort_enrollments.groupBy({
    by: ['cohort_id'],
    where: { cohort_id: { in: rows.map(row => row.id) }, status: 'joined', role: 'member' },
    _count: { id: true }
  });
  const joinedByCohort = new Map(joined.map(row => [row.cohort_id, row._count.id]));
  return rows.map(row => ({ ...map(row), programName: row.program.name, joinedCount: joinedByCohort.get(row.id) ?? 0 }));
};
const get = async (programId: number, cohortId: number, userId: number): Promise<CohortResponse> => map(await getOwned(programId, cohortId, userId));
const create = async (programId: number, input: CreateCohortInput, userId: number): Promise<CohortResponse> => {
  await assertProgram(programId, userId);
  try {
    return map(await prisma.cohorts.create({ data: { program_id: programId, slug: input.slug, display_name: input.displayName, start_date: date(input.startDate), end_date: date(input.endDate), join_deadline: input.joinDeadline ? date(input.joinDeadline) : null, capacity: input.capacity ?? null, invite_message: input.inviteMessage ?? null, status: input.status }, select }));
  } catch (error) {
    if (isCode(error, 'P2002')) throw new ConflictError('同一系列下不可使用重複 slug');
    throw error;
  }
};
const update = async (programId: number, cohortId: number, input: UpdateCohortInput, userId: number): Promise<CohortResponse> => {
  const current = await getOwned(programId, cohortId, userId);
  const startDate = input.startDate ? date(input.startDate) : current.start_date;
  const endDate = input.endDate ? date(input.endDate) : current.end_date;
  if (startDate > endDate) throw new ConflictError('開始日期不可晚於結束日期');
  try {
    return map(await prisma.cohorts.update({ where: { id: cohortId }, data: { ...(input.slug !== undefined && { slug: input.slug }), ...(input.displayName !== undefined && { display_name: input.displayName }), start_date: startDate, end_date: endDate, ...(input.joinDeadline !== undefined && { join_deadline: input.joinDeadline ? date(input.joinDeadline) : null }), ...(input.capacity !== undefined && { capacity: input.capacity }), ...(input.inviteMessage !== undefined && { invite_message: input.inviteMessage }), ...(input.status !== undefined && { status: input.status }), updated_at: new Date() }, select }));
  } catch (error) {
    if (isCode(error, 'P2002')) throw new ConflictError('同一系列下不可使用重複 slug');
    if (isCode(error, 'P2025')) throw new NotFoundError('找不到場次');
    throw error;
  }
};
const archive = async (programId: number, cohortId: number, userId: number): Promise<void> => { await getOwned(programId, cohortId, userId); await prisma.cohorts.update({ where: { id: cohortId }, data: { status: 'archived', updated_at: new Date() } }); };
/**
 * 複製場次（FR-OV-03）：以草稿狀態建立副本，沿用日期／人數上限／邀請文案，
 * 並複製目前仍綁定中的模板；不複製名單、打卡與加入連結（副本自帶新 token）
 */
const duplicate = async (programId: number, cohortId: number, actorId: number): Promise<CohortResponse> => {
  const source = await getOwned(programId, cohortId, actorId);
  const bindings = await prisma.cohort_templates.findMany({ where: { cohort_id: cohortId, unbound_at: null }, select: { template_id: true, start_date: true } });
  const data = { program_id: programId, display_name: `${source.display_name}（副本）`.slice(0, 100), start_date: source.start_date, end_date: source.end_date, join_deadline: source.join_deadline, capacity: source.capacity, invite_message: source.invite_message, status: 'draft' as const };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return map(await prisma.$transaction(async tx => {
        const created = await tx.cohorts.create({ data: { ...data, slug: copySlug(source.slug, attempt) }, select });
        if (bindings.length > 0) await tx.cohort_templates.createMany({ data: bindings.map(binding => ({ cohort_id: created.id, template_id: binding.template_id, start_date: binding.start_date })) });
        await tx.$executeRaw`
          INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
          VALUES (${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_DUPLICATED}, 'cohort', ${String(created.id)},
                  ${JSON.stringify({ sourceCohortId: cohortId })}::jsonb,
                  ${JSON.stringify({ slug: created.slug, templateCount: bindings.length })}::jsonb)
        `;
        return created;
      }));
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
