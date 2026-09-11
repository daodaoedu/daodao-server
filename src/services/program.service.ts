import type { CreateProgramInput, ProgramResponse, UpdateProgramInput } from '../validators/program.validators';
import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { ACTIVE_PROGRAM_WHERE, COHORT_ARCHIVE_REASONS } from '../constants/archive-state';
import { ConflictError } from '../middleware/error.middleware';

const select = {
  id: true, organization_id: true, name: true, description: true,
  archived_at: true, deleted_at: true, created_at: true, updated_at: true
} as const;

const toResponse = (row: {
  id: number; organization_id: number; name: string; description: string | null;
  archived_at: Date | null; deleted_at: Date | null; created_at: Date; updated_at: Date | null;
}): ProgramResponse => ({
  id: row.id, organizationId: row.organization_id, name: row.name,
  description: row.description, archivedAt: row.archived_at, deletedAt: row.deleted_at,
  createdAt: row.created_at, updatedAt: row.updated_at
});

const assertActiveOrganization = async (organizationId: number, userId: number): Promise<void> => {
  const membership = await prisma.organization_members.findUnique({
    where: { organization_id_user_id: { organization_id: organizationId, user_id: userId } },
    select: { organization: { select: { status: true } } }
  });
  if (!membership) throw new ForbiddenError('無權限存取此組織');
  if (membership.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};

const getOwned = async (programId: number, userId: number) => {
  const row = await prisma.programs.findFirst({
    // 挑戰主題只能經 admin 後台管理，燈塔的 update/archive 不得觸及（與 list 的 kind 過濾一致）
    where: { id: programId, kind: PROGRAM_KINDS.LIGHTHOUSE, deleted_at: null, organization: { organization_members: { some: { user_id: userId } } } },
    select: { ...select, organization: { select: { status: true } } }
  });
  if (!row) throw new ForbiddenError('無權限存取此系列');
  if (row.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
  return row;
};

const list = async (organizationId: number, userId: number): Promise<ProgramResponse[]> => {
  await assertActiveOrganization(organizationId, userId);
  // 共同挑戰主題（kind='challenge'）由 admin 後台管理，不混入組織 owner 的燈塔介面
  // 封存中的系列改由封存區列出（migration 089：archived_at 封存、deleted_at 封存區刪除）
  const rows = await prisma.programs.findMany({ where: { organization_id: organizationId, ...ACTIVE_PROGRAM_WHERE, kind: PROGRAM_KINDS.LIGHTHOUSE }, select, orderBy: { created_at: 'asc' } });
  return rows.map(toResponse);
};
const create = async (input: CreateProgramInput, userId: number): Promise<ProgramResponse> => {
  await assertActiveOrganization(input.organizationId, userId);
  return toResponse(await prisma.programs.create({ data: { organization_id: input.organizationId, name: input.name, description: input.description ?? null }, select }));
};
const update = async (programId: number, input: UpdateProgramInput, userId: number): Promise<ProgramResponse> => {
  const current = await getOwned(programId, userId);
  if (current.archived_at) throw new ConflictError('系列已封存，請先從封存區恢復再編輯');
  return toResponse(await prisma.programs.update({ where: { id: programId }, data: { ...(input.name !== undefined && { name: input.name }), ...(input.description !== undefined && { description: input.description }), updated_at: new Date() }, select }));
};

/**
 * 封存系列（D9 級聯封存）：同一交易內把該系列下 status<>'archived' 的場次全部封存
 * （記下封存前狀態與 program_cascade 原因，恢復系列時只復活這些），再寫系列 archived_at / archived_by。
 * 回應帶 archivedCohortCount。已封存再封存回 409（FR-ARC-04）。
 */
const archive = async (programId: number, userId: number): Promise<{ programId: number; archivedCohortCount: number }> => {
  const current = await getOwned(programId, userId);
  if (current.archived_at) throw new ConflictError('系列已在封存區');
  const result = await prisma.$transaction(async tx => {
    const now = new Date();
    // 級聯封存所有未封存場次；archived_from_status 保留原 status 供恢復
    const cohortUpdate = await tx.$executeRaw`
      UPDATE cohorts
      SET archived_from_status = status, status = 'archived',
          archived_at = ${now}, archived_by = ${userId}, archived_reason = ${COHORT_ARCHIVE_REASONS.PROGRAM_CASCADE},
          updated_at = ${now}
      WHERE program_id = ${programId} AND status <> 'archived' AND deleted_at IS NULL
    `;
    // 封存系列本體
    try {
      await tx.programs.update({ where: { id: programId }, data: { archived_at: now, archived_by: userId, updated_at: now } });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') throw new NotFoundError('找不到系列');
      throw error;
    }
    // 寫 audit
    await tx.$executeRaw`
      INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
      VALUES (${userId}, ${LIGHTHOUSE_AUDIT_ACTIONS.PROGRAM_ARCHIVED_CASCADE}, 'program', ${String(programId)},
              ${JSON.stringify({})}::jsonb,
              ${JSON.stringify({ archivedCohortCount: cohortUpdate })}::jsonb)
    `;
    return { archivedCohortCount: cohortUpdate };
  });
  return { programId, archivedCohortCount: result.archivedCohortCount };
};

/**
 * 複製系列（D9）：只複製 program 本體（name 加「（複製）」截 100 字、description），不複製場次。
 */
const duplicate = async (programId: number, userId: number): Promise<ProgramResponse> => {
  const source = await getOwned(programId, userId);
  const newName = `${source.name}（複製）`.slice(0, 100);
  const created = await prisma.$transaction(async tx => {
    const row = await tx.programs.create({
      data: {
        organization_id: source.organization_id,
        name: newName,
        description: source.description
      },
      select
    });
    await tx.$executeRaw`
      INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
      VALUES (${userId}, ${LIGHTHOUSE_AUDIT_ACTIONS.PROGRAM_DUPLICATED}, 'program', ${String(row.id)},
              ${JSON.stringify({ sourceProgramId: programId })}::jsonb,
              ${JSON.stringify({ name: newName })}::jsonb)
    `;
    return row;
  });
  return toResponse(created);
};

export const programService = { list, create, update, archive, duplicate };
