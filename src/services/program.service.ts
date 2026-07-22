import type { CreateProgramInput, ProgramResponse, UpdateProgramInput } from '../validators/program.validators';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

const select = {
  id: true, organization_id: true, name: true, description: true,
  deleted_at: true, created_at: true, updated_at: true
} as const;

const toResponse = (row: {
  id: number; organization_id: number; name: string; description: string | null;
  deleted_at: Date | null; created_at: Date; updated_at: Date | null;
}): ProgramResponse => ({
  id: row.id, organizationId: row.organization_id, name: row.name,
  description: row.description, deletedAt: row.deleted_at,
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
    where: { id: programId, organization: { organization_members: { some: { user_id: userId } } } },
    select: { ...select, organization: { select: { status: true } } }
  });
  if (!row) throw new ForbiddenError('無權限存取此系列');
  if (row.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
  return row;
};

const list = async (organizationId: number, userId: number): Promise<ProgramResponse[]> => {
  await assertActiveOrganization(organizationId, userId);
  const rows = await prisma.programs.findMany({ where: { organization_id: organizationId, deleted_at: null }, select, orderBy: { created_at: 'asc' } });
  return rows.map(toResponse);
};
const create = async (input: CreateProgramInput, userId: number): Promise<ProgramResponse> => {
  await assertActiveOrganization(input.organizationId, userId);
  return toResponse(await prisma.programs.create({ data: { organization_id: input.organizationId, name: input.name, description: input.description ?? null }, select }));
};
const update = async (programId: number, input: UpdateProgramInput, userId: number): Promise<ProgramResponse> => {
  await getOwned(programId, userId);
  return toResponse(await prisma.programs.update({ where: { id: programId }, data: { ...(input.name !== undefined && { name: input.name }), ...(input.description !== undefined && { description: input.description }), updated_at: new Date() }, select }));
};
const archive = async (programId: number, userId: number): Promise<void> => {
  await getOwned(programId, userId);
  const cohortCount = await prisma.cohorts.count({ where: { program_id: programId } });
  if (cohortCount > 0) throw new ConflictError('系列仍有期，無法封存');
  try {
    await prisma.programs.update({ where: { id: programId }, data: { deleted_at: new Date(), updated_at: new Date() } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') throw new NotFoundError('找不到系列');
    throw error;
  }
};
export const programService = { list, create, update, archive };

