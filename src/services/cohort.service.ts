import type { CreateCohortInput, CohortResponse, UpdateCohortInput } from '../validators/cohort.validators';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { randomUUID } from 'crypto';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';

const select = { id: true, program_id: true, slug: true, display_name: true, start_date: true, end_date: true, join_token: true, join_deadline: true, capacity: true, invite_message: true, status: true, created_at: true, updated_at: true } as const;
const asStatus = (status: string): CohortResponse['status'] => {
  if (status === 'draft' || status === 'published' || status === 'archived') return status;
  throw new Error(`Invalid cohort status: ${status}`);
};
const map = (row: { id: number; program_id: number; slug: string; display_name: string; start_date: Date; end_date: Date; join_token: string | null; join_deadline: Date | null; capacity: number | null; invite_message: string | null; status: string; created_at: Date; updated_at: Date | null }): CohortResponse => ({
  id: row.id, programId: row.program_id, slug: row.slug, displayName: row.display_name,
  startDate: row.start_date, endDate: row.end_date, joinToken: row.join_token,
  joinDeadline: row.join_deadline, capacity: row.capacity, inviteMessage: row.invite_message,
  status: asStatus(row.status), createdAt: row.created_at, updatedAt: row.updated_at
});
const date = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const isCode = (error: unknown, code: string): boolean => typeof error === 'object' && error !== null && 'code' in error && error.code === code;

const assertProgram = async (programId: number, userId: number): Promise<void> => {
  const program = await prisma.programs.findFirst({
    where: { id: programId, deleted_at: null, organization: { organization_members: { some: { user_id: userId } } } },
    select: { organization: { select: { status: true } } }
  });
  if (!program) throw new ForbiddenError('無權限存取此系列');
  if (program.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};
const getOwned = async (programId: number, cohortId: number, userId: number) => {
  const row = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, program: { deleted_at: null, organization: { organization_members: { some: { user_id: userId } } } } },
    select: { ...select, program: { select: { organization: { select: { status: true } } } } }
  });
  if (!row) throw new ForbiddenError('無權限存取此期');
  if (row.program.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
  return row;
};
const list = async (programId: number, userId: number): Promise<CohortResponse[]> => {
  await assertProgram(programId, userId);
  return (await prisma.cohorts.findMany({ where: { program_id: programId }, select, orderBy: { created_at: 'asc' } })).map(map);
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
    if (isCode(error, 'P2025')) throw new NotFoundError('找不到期');
    throw error;
  }
};
const archive = async (programId: number, cohortId: number, userId: number): Promise<void> => { await getOwned(programId, cohortId, userId); await prisma.cohorts.update({ where: { id: cohortId }, data: { status: 'archived', updated_at: new Date() } }); };
const setJoinToken = async (programId: number, cohortId: number, actorId: number, mode: 'rotate' | 'pause') => {
  const current = await getOwned(programId, cohortId, actorId);
  const joinToken = mode === 'rotate' ? randomUUID() : null;
  await prisma.$transaction(async tx => {
    await tx.cohorts.update({ where: { id: cohortId }, data: { join_token: joinToken, updated_at: new Date() } });
    await tx.$executeRaw`
      INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
      VALUES (${actorId}, ${mode === 'rotate' ? LIGHTHOUSE_AUDIT_ACTIONS.COHORT_JOIN_TOKEN_ROTATED : LIGHTHOUSE_AUDIT_ACTIONS.COHORT_JOIN_PAUSED}, 'cohort', ${String(cohortId)},
              ${JSON.stringify({ joinToken: current.join_token })}::jsonb,
              ${JSON.stringify({ joinToken, affectedCount: 1 })}::jsonb)
    `;
  });
  return { cohortId, joinToken };
};
export const cohortService = { list, get, create, update, archive, setJoinToken };
