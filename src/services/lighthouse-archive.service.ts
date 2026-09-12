import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { ACTIVE_PROGRAM_WHERE, COHORT_ARCHIVE_REASONS, type ArchiveItemType } from '../constants/archive-state';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { writeLighthouseAudit } from '../utils/lighthouse-audit';
import type { ArchiveItem, ArchiveRestoreResult } from '../validators/lighthouse-archive.validators';
import { organizationTemplateService } from './organization-template.service';
import { prisma } from './database/prisma.service';

/**
 * 封存區（FRD frd-templates-org-archive.md §3.3）：集中列出已封存的模板／場次／系列，支援恢復與刪除。
 * - 封存：模板 archived_at、場次 status='archived' + archived_at、系列 archived_at
 * - 刪除：一律軟刪 deleted_at（多張 FK 為 NO ACTION，且 FRD 要求不得破壞歷史、學員與成果資料）
 * - 恢復保留原 id；場次還原到 archived_from_status（缺省 draft）；系列恢復只復活隨系列封存（program_cascade）的場次
 */

const archiverSelect = { select: { id: true, nickname: true } } as const;
type Archiver = { id: number; nickname: string | null } | null;
/** users 只有 nickname（可為空）；空時回「使用者 #id」讓封存區仍能顯示操作人 */
const archivedBy = (row: Archiver): ArchiveItem['archivedBy'] => (row ? { id: row.id, name: row.nickname?.trim() || `使用者 #${row.id}` } : null);

const assertOrganization = async (organizationId: number, userId: number): Promise<void> => {
  const member = await prisma.organization_members.findUnique({ where: { organization_id_user_id: { organization_id: organizationId, user_id: userId } }, select: { organization: { select: { status: true } } } });
  if (!member) throw new ForbiddenError('無權限存取此組織');
  if (member.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};

const listTemplates = async (organizationId: number): Promise<ArchiveItem[]> => {
  const rows = await prisma.practice_templates.findMany({
    where: { organization_id: organizationId, archived_at: { not: null }, deleted_at: null },
    select: { id: true, title: true, archived_at: true, archiver: archiverSelect },
    orderBy: { archived_at: 'desc' }
  });
  return rows.map(row => ({ type: 'template' as const, id: row.id, name: row.title, archivedAt: row.archived_at, archivedBy: archivedBy(row.archiver), archivedFromStatus: null, archivedReason: null, parentName: null, parentArchived: false }));
};

const listCohorts = async (organizationId: number): Promise<ArchiveItem[]> => {
  const rows = await prisma.cohorts.findMany({
    where: { status: 'archived', deleted_at: null, program: { organization_id: organizationId, kind: PROGRAM_KINDS.LIGHTHOUSE, deleted_at: null } },
    select: { id: true, display_name: true, archived_at: true, archived_from_status: true, archived_reason: true, updated_at: true, created_at: true, archiver: archiverSelect, program: { select: { name: true, archived_at: true } } },
    orderBy: [{ archived_at: 'desc' }, { updated_at: 'desc' }]
  });
  return rows.map(row => ({
    type: 'cohort' as const, id: row.id, name: row.display_name,
    // 089 前封存的場次 backfill 過 archived_at；保險起見仍回退到 updated_at
    archivedAt: row.archived_at ?? row.updated_at ?? row.created_at,
    archivedBy: archivedBy(row.archiver), archivedFromStatus: row.archived_from_status, archivedReason: row.archived_reason,
    parentName: row.program.name, parentArchived: row.program.archived_at !== null
  }));
};

const listPrograms = async (organizationId: number): Promise<ArchiveItem[]> => {
  const rows = await prisma.programs.findMany({
    where: { organization_id: organizationId, kind: PROGRAM_KINDS.LIGHTHOUSE, archived_at: { not: null }, deleted_at: null },
    select: { id: true, name: true, archived_at: true, archiver: archiverSelect },
    orderBy: { archived_at: 'desc' }
  });
  return rows.map(row => ({ type: 'program' as const, id: row.id, name: row.name, archivedAt: row.archived_at, archivedBy: archivedBy(row.archiver), archivedFromStatus: null, archivedReason: null, parentName: null, parentArchived: false }));
};

const list = async (organizationId: number, userId: number, type: ArchiveItemType): Promise<ArchiveItem[]> => {
  await assertOrganization(organizationId, userId);
  if (type === 'templates') return listTemplates(organizationId);
  if (type === 'cohorts') return listCohorts(organizationId);
  return listPrograms(organizationId);
};

const getArchivedCohort = async (organizationId: number, cohortId: number) => {
  const row = await prisma.cohorts.findFirst({
    where: { id: cohortId, deleted_at: null, program: { organization_id: organizationId, kind: PROGRAM_KINDS.LIGHTHOUSE, deleted_at: null } },
    select: { id: true, display_name: true, status: true, archived_at: true, archived_from_status: true, archived_reason: true, program: { select: { id: true, archived_at: true } } }
  });
  if (!row) throw new NotFoundError('找不到場次');
  if (row.status !== 'archived') throw new ConflictError('場次不在封存區');
  return row;
};

const getArchivedProgram = async (organizationId: number, programId: number) => {
  const row = await prisma.programs.findFirst({
    where: { id: programId, organization_id: organizationId, kind: PROGRAM_KINDS.LIGHTHOUSE, deleted_at: null },
    select: { id: true, name: true, archived_at: true }
  });
  if (!row) throw new NotFoundError('找不到系列');
  if (!row.archived_at) throw new ConflictError('系列不在封存區');
  return row;
};

const restoreCohort = async (organizationId: number, cohortId: number, userId: number): Promise<ArchiveRestoreResult> => {
  const row = await getArchivedCohort(organizationId, cohortId);
  // 父層仍封存時擋下，避免場次復活在一個看不見的系列底下（FR-ARC-02 例外）
  if (row.program.archived_at) throw new ConflictError('所屬系列仍在封存區，請先恢復系列');
  const status = row.archived_from_status === 'published' ? 'published' : 'draft';
  await prisma.$transaction(async tx => {
    // 條件式更新：並發恢復只有第一個請求生效，其餘回 409（TP-ARC-05）
    const updated = await tx.cohorts.updateMany({ where: { id: cohortId, status: 'archived', deleted_at: null }, data: { status, archived_at: null, archived_by: null, archived_from_status: null, archived_reason: null, updated_at: new Date() } });
    if (updated.count === 0) throw new ConflictError('場次不在封存區');
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.COHORT_RESTORED, 'cohort', cohortId, { status: 'archived', archivedAt: row.archived_at }, { status });
  });
  return { type: 'cohort', id: cohortId, name: row.display_name, restoredCohortCount: 0 };
};

const restoreProgram = async (organizationId: number, programId: number, userId: number): Promise<ArchiveRestoreResult> => {
  const row = await getArchivedProgram(organizationId, programId);
  const restoredCohortCount = await prisma.$transaction(async tx => {
    const updated = await tx.programs.updateMany({ where: { id: programId, archived_at: { not: null }, deleted_at: null }, data: { archived_at: null, archived_by: null, updated_at: new Date() } });
    if (updated.count === 0) throw new ConflictError('系列不在封存區');
    // 只復活隨系列封存的場次；使用者先前手動封存的維持封存
    const restored = await tx.$executeRaw`
      UPDATE cohorts
      SET status = COALESCE(archived_from_status, 'draft'),
          archived_at = NULL, archived_by = NULL, archived_from_status = NULL, archived_reason = NULL,
          updated_at = NOW()
      WHERE program_id = ${programId}
        AND status = 'archived'
        AND archived_reason = ${COHORT_ARCHIVE_REASONS.PROGRAM_CASCADE}
        AND deleted_at IS NULL
    `;
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.PROGRAM_RESTORED, 'program', programId, { archivedAt: row.archived_at }, { restoredCohortCount: restored });
    return restored;
  });
  return { type: 'program', id: programId, name: row.name, restoredCohortCount };
};

const restore = async (organizationId: number, userId: number, type: ArchiveItemType, itemId: number): Promise<ArchiveRestoreResult> => {
  await assertOrganization(organizationId, userId);
  if (type === 'templates') {
    const template = await organizationTemplateService.restore(organizationId, itemId, userId);
    return { type: 'template', id: template.id, name: template.title, restoredCohortCount: 0 };
  }
  if (type === 'cohorts') return restoreCohort(organizationId, itemId, userId);
  return restoreProgram(organizationId, itemId, userId);
};

const removeTemplate = async (organizationId: number, templateId: number, userId: number): Promise<void> => {
  const row = await prisma.practice_templates.findFirst({ where: { id: templateId, organization_id: organizationId, deleted_at: null }, select: { id: true, archived_at: true } });
  if (!row) throw new NotFoundError('找不到模板');
  if (!row.archived_at) throw new ConflictError('模板不在封存區');
  await prisma.$transaction(async tx => {
    const updated = await tx.practice_templates.updateMany({ where: { id: templateId, archived_at: { not: null }, deleted_at: null }, data: { deleted_at: new Date(), updated_at: new Date() } });
    if (updated.count === 0) throw new ConflictError('模板不在封存區');
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.ARCHIVE_ITEM_DELETED, 'practice_template', templateId, {}, { deleted: true });
  });
};

const removeCohort = async (organizationId: number, cohortId: number, userId: number): Promise<void> => {
  const row = await getArchivedCohort(organizationId, cohortId);
  await prisma.$transaction(async tx => {
    const updated = await tx.cohorts.updateMany({ where: { id: row.id, status: 'archived', deleted_at: null }, data: { deleted_at: new Date(), updated_at: new Date() } });
    if (updated.count === 0) throw new ConflictError('場次不在封存區');
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.ARCHIVE_ITEM_DELETED, 'cohort', cohortId, {}, { deleted: true });
  });
};

const removeProgram = async (organizationId: number, programId: number, userId: number): Promise<void> => {
  const row = await getArchivedProgram(organizationId, programId);
  await prisma.$transaction(async tx => {
    const now = new Date();
    // 系列刪除連同其場次一起軟刪（FR-ARC-03「刪除系列時需明確處理子場次」）
    const cohorts = await tx.cohorts.updateMany({ where: { program_id: row.id, deleted_at: null }, data: { deleted_at: now, updated_at: now } });
    const updated = await tx.programs.updateMany({ where: { id: row.id, archived_at: { not: null }, deleted_at: null }, data: { deleted_at: now, updated_at: now } });
    if (updated.count === 0) throw new ConflictError('系列不在封存區');
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.ARCHIVE_ITEM_DELETED, 'program', programId, {}, { deleted: true, deletedCohortCount: cohorts.count });
  });
};

const remove = async (organizationId: number, userId: number, type: ArchiveItemType, itemId: number): Promise<void> => {
  await assertOrganization(organizationId, userId);
  if (type === 'templates') return removeTemplate(organizationId, itemId, userId);
  if (type === 'cohorts') return removeCohort(organizationId, itemId, userId);
  return removeProgram(organizationId, itemId, userId);
};

export const lighthouseArchiveService = { list, restore, remove };

/** 供其他 service 判斷系列是否仍可見（未封存、未刪除） */
export const activeProgramWhere = ACTIVE_PROGRAM_WHERE;
