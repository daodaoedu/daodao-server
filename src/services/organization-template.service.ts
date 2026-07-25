import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import type { BindOrganizationTemplateInput, CreateOrganizationTemplateInput, UpdateOrganizationTemplateInput } from '../validators/organization-template.validators';
import { prisma } from './database/prisma.service';

const select = { id: true, external_id: true, organization_id: true, title: true, practice_action: true, duration_days: true, frequency_min_days: true, frequency_max_days: true, session_duration_minutes: true, practice_time_periods: true, created_at: true, updated_at: true, cohort_templates: { where: { unbound_at: null }, select: { cohort_id: true, start_date: true } }, _count: { select: { practices: { where: { creation_source: 'cohort_template' } } } } } as const;
type TemplateResource = { id: string; name: string; url: string | null };
const map = (row: { id: number; external_id: string; organization_id: number | null; title: string; practice_action: string | null; duration_days: number | null; frequency_min_days: number | null; frequency_max_days: number | null; session_duration_minutes: number | null; practice_time_periods: string[]; created_at: Date | null; updated_at: Date | null; cohort_templates: Array<{ cohort_id: number; start_date: Date | null }>; _count: { practices: number } }, resources: TemplateResource[] = []) => {
  if (row.organization_id === null) throw new Error('Organization template is missing organization_id');
  return { id: row.id, externalId: row.external_id, organizationId: row.organization_id, title: row.title, practiceAction: row.practice_action, durationDays: row.duration_days, frequencyMinDays: row.frequency_min_days, frequencyMaxDays: row.frequency_max_days, sessionDurationMinutes: row.session_duration_minutes, practiceTimePeriods: row.practice_time_periods, boundCohortIds: row.cohort_templates.map(item => item.cohort_id), bindings: row.cohort_templates.map(item => ({ cohortId: item.cohort_id, startDate: item.start_date })), resources, generatedDraftCount: row._count.practices, createdAt: row.created_at, updatedAt: row.updated_at };
};

/** 模板資源走 entity_resources 多態關聯（entity_type = 'practice_template'），沒有 Prisma relation 可直接 select */
const loadResources = async (templateIds: number[]): Promise<Map<number, TemplateResource[]>> => {
  const grouped = new Map<number, TemplateResource[]>();
  if (templateIds.length === 0) return grouped;
  const rows = await prisma.entity_resources.findMany({
    where: { entity_type: 'practice_template', entity_id: { in: templateIds }, deleted_at: null },
    select: { entity_id: true, resources: { select: { id: true, external_id: true, name: true, url: true } } },
    orderBy: { id: 'asc' }
  });
  for (const row of rows) {
    const list = grouped.get(row.entity_id) ?? [];
    list.push({ id: row.resources.external_id ?? String(row.resources.id), name: row.resources.name, url: row.resources.url || null });
    grouped.set(row.entity_id, list);
  }
  return grouped;
};

/** 整批換掉模板資源：舊關聯軟刪除，新的重建（resources 本體保留，供既有草稿續用） */
const replaceResources = async (templateId: number, userId: number, resources: Array<{ name: string; url?: string }>): Promise<void> => {
  // 前端每次存檔都會帶 resources（即使只改了標題），沒有這道比對就會每次重造一批
  // resources 列，孤兒資料越積越多、id 也無謂地換掉
  const existing = await prisma.entity_resources.findMany({
    where: { entity_type: 'practice_template', entity_id: templateId, deleted_at: null },
    select: { resources: { select: { name: true, url: true } } },
    orderBy: { id: 'asc' }
  });
  const unchanged = existing.length === resources.length
    && existing.every((row, index) => row.resources.name === resources[index]?.name
      && (row.resources.url ?? '') === (resources[index]?.url ?? ''));
  if (unchanged) return;

  await prisma.entity_resources.updateMany({ where: { entity_type: 'practice_template', entity_id: templateId, deleted_at: null }, data: { deleted_at: new Date() } });
  for (const resource of resources) {
    const created = await prisma.resources.create({ data: { name: resource.name, url: resource.url || '', description: '', type: 'other', cost: 'free', created_by: userId } });
    await prisma.entity_resources.create({ data: { resource_id: created.id, entity_type: 'practice_template', entity_id: templateId, created_by: userId } });
  }
};
const assertOrganization = async (organizationId: number, userId: number): Promise<void> => {
  const member = await prisma.organization_members.findUnique({ where: { organization_id_user_id: { organization_id: organizationId, user_id: userId } }, select: { organization: { select: { status: true } } } });
  if (!member) throw new ForbiddenError('無權限存取此組織模板');
  if (member.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};
const list = async (organizationId: number, userId: number) => {
  await assertOrganization(organizationId, userId);
  const rows = await prisma.practice_templates.findMany({ where: { organization_id: organizationId }, select, orderBy: { created_at: 'asc' } });
  const resources = await loadResources(rows.map(row => row.id));
  return rows.map(row => map(row, resources.get(row.id) ?? []));
};
const create = async (organizationId: number, userId: number, input: CreateOrganizationTemplateInput) => {
  await assertOrganization(organizationId, userId);
  const row = await prisma.practice_templates.create({ data: { organization_id: organizationId, title: input.title, practice_action: input.practiceAction ?? null, duration_days: input.durationDays ?? null, frequency_min_days: input.frequencyMinDays ?? null, frequency_max_days: input.frequencyMaxDays ?? null, session_duration_minutes: input.sessionDurationMinutes ?? null, practice_time_periods: input.practiceTimePeriods }, select });
  if (input.resources?.length) await replaceResources(row.id, userId, input.resources);
  return map(row, (await loadResources([row.id])).get(row.id) ?? []);
};
const update = async (organizationId: number, templateId: number, userId: number, input: UpdateOrganizationTemplateInput) => {
  await assertOrganization(organizationId, userId);
  const existing = await prisma.practice_templates.findFirst({ where: { id: templateId, organization_id: organizationId }, select: { id: true } });
  if (!existing) throw new NotFoundError('找不到組織模板');
  const row = await prisma.practice_templates.update({ where: { id: templateId }, data: { ...(input.title !== undefined && { title: input.title }), ...(input.practiceAction !== undefined && { practice_action: input.practiceAction }), ...(input.durationDays !== undefined && { duration_days: input.durationDays }), ...(input.frequencyMinDays !== undefined && { frequency_min_days: input.frequencyMinDays }), ...(input.frequencyMaxDays !== undefined && { frequency_max_days: input.frequencyMaxDays }), ...(input.sessionDurationMinutes !== undefined && { session_duration_minutes: input.sessionDurationMinutes }), ...(input.practiceTimePeriods !== undefined && { practice_time_periods: input.practiceTimePeriods }), updated_at: new Date() }, select });
  if (input.resources !== undefined) await replaceResources(templateId, userId, input.resources);
  return map(row, (await loadResources([templateId])).get(templateId) ?? []);
};
const remove = async (organizationId: number, templateId: number, userId: number): Promise<void> => { await assertOrganization(organizationId, userId); const bindings = await prisma.cohort_templates.count({ where: { template_id: templateId } }); if (bindings > 0) throw new ConflictError('模板已有綁定歷程，請保留或先建立新模板'); const deleted = await prisma.practice_templates.deleteMany({ where: { id: templateId, organization_id: organizationId } }); if (deleted.count === 0) throw new NotFoundError('找不到組織模板'); };
const bind = async (organizationId: number, templateId: number, cohortId: number, userId: number, bound: boolean, input: BindOrganizationTemplateInput = {}) => {
  await assertOrganization(organizationId, userId);
  const [template, cohort] = await Promise.all([
    prisma.practice_templates.findFirst({ where: { id: templateId, organization_id: organizationId }, select: { id: true } }),
    prisma.cohorts.findFirst({ where: { id: cohortId, program: { organization_id: organizationId } }, select: { id: true } })
  ]);
  if (!template || !cohort) throw new NotFoundError('找不到同組織的模板或期');
  // 只有明確帶了 startDate 才動它，重新綁定時不會把既有的指定日洗掉
  const startDate = input.startDate === undefined ? undefined : input.startDate === null ? null : new Date(`${input.startDate}T00:00:00.000Z`);
  if (bound) {
    const row = await prisma.cohort_templates.upsert({
      where: { cohort_id_template_id: { cohort_id: cohortId, template_id: templateId } },
      create: { cohort_id: cohortId, template_id: templateId, start_date: startDate ?? null },
      update: { unbound_at: null, bound_at: new Date(), ...(startDate !== undefined && { start_date: startDate }) },
      select: { start_date: true }
    });
    return { templateId, cohortId, bound, startDate: row.start_date };
  }
  const result = await prisma.cohort_templates.updateMany({ where: { cohort_id: cohortId, template_id: templateId, unbound_at: null }, data: { unbound_at: new Date() } });
  if (result.count === 0) throw new NotFoundError('找不到有效綁定');
  return { templateId, cohortId, bound, startDate: null };
};
export const organizationTemplateService = { list, create, update, remove, bind };
