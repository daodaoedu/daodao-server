import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { ACTIVE_PROGRAM_WHERE } from '../constants/archive-state';
import { ConflictError, ForbiddenError, NotFoundError, UnprocessableEntityError } from '../middleware/error.middleware';
import { inclusiveEndDate } from '../utils/date-utils';
import { sanitizePracticeTimePeriods } from '../utils/practice-time-periods';
import { writeLighthouseAudit } from '../utils/lighthouse-audit';
import { assertTemplateReady, ORG_TEMPLATE_TITLE_MAX, type BindOrganizationTemplateInput, type CreateOrganizationTemplateInput, type OrganizationTemplateListQuery, type OrganizationTemplateResourceInput, type UpdateOrganizationTemplateInput } from '../validators/organization-template.validators';
import { day, today } from './cohort-run-state';
import { prisma } from './database/prisma.service';

const ENTITY_TYPE = 'practice_template';

const select = {
  id: true, external_id: true, organization_id: true, title: true, practice_action: true, duration_days: true, frequency_min_days: true, frequency_max_days: true,
  session_duration_minutes: true, practice_time_periods: true, other_context: true, status: true, archived_at: true, created_at: true, updated_at: true,
  cohort_templates: {
    where: { unbound_at: null },
    select: { cohort_id: true, start_date: true, cohort: { select: { display_name: true, status: true, start_date: true } } }
  },
  _count: { select: { practices: { where: { creation_source: 'cohort_template' } } } }
} as const;

type TemplateResource = { id: string; name: string; url: string | null; dayNumber: number | null };
type TemplateRow = {
  id: number; external_id: string; organization_id: number | null; title: string; practice_action: string | null; duration_days: number | null;
  frequency_min_days: number | null; frequency_max_days: number | null; session_duration_minutes: number | null; practice_time_periods: string[];
  other_context?: string | null; status?: string; archived_at?: Date | null; created_at: Date | null; updated_at: Date | null;
  cohort_templates: Array<{ cohort_id: number; start_date: Date | null; cohort?: { display_name: string; status: string; start_date: Date } }>;
  _count: { practices: number };
};

const asStatus = (status: string | undefined): 'draft' | 'ready' => (status === 'draft' ? 'draft' : 'ready');

/** 場次是否已開始：場次開始日 ≤ 產品時區的今天（FR-TPL-05 已開始場次鎖定） */
const isCohortStarted = (startDate: Date, currentDay: string): boolean => day(startDate) <= currentDay;

const map = (row: TemplateRow, resources: TemplateResource[] = [], tags: string[] = [], currentDay: string = today()) => {
  if (row.organization_id === null) throw new Error('Organization template is missing organization_id');
  const bindings = row.cohort_templates.map(item => {
    const cohortStartDate = item.cohort?.start_date ?? item.start_date ?? new Date(0);
    const startDate = item.start_date ?? (item.cohort ? item.cohort.start_date : null);
    const endDate = startDate && row.duration_days ? inclusiveEndDate(startDate, row.duration_days) : null;
    return {
      cohortId: item.cohort_id,
      cohortName: item.cohort?.display_name ?? '',
      cohortStatus: item.cohort?.status ?? 'draft',
      cohortStartDate,
      startDate: item.start_date,
      endDate,
      locked: item.cohort ? isCohortStarted(item.cohort.start_date, currentDay) : false
    };
  });
  return {
    id: row.id, externalId: row.external_id, organizationId: row.organization_id, title: row.title, practiceAction: row.practice_action,
    durationDays: row.duration_days, frequencyMinDays: row.frequency_min_days, frequencyMaxDays: row.frequency_max_days,
    sessionDurationMinutes: row.session_duration_minutes, practiceTimePeriods: sanitizePracticeTimePeriods(row.practice_time_periods), timingOther: row.other_context ?? null,
    status: asStatus(row.status), archivedAt: row.archived_at ?? null, tags,
    boundCohortIds: row.cohort_templates.map(item => item.cohort_id), bindings, resources,
    generatedDraftCount: row._count.practices, createdAt: row.created_at, updatedAt: row.updated_at
  };
};

/** 模板資源走 entity_resources 多態關聯（entity_type = 'practice_template'），沒有 Prisma relation 可直接 select */
const loadResources = async (templateIds: number[]): Promise<Map<number, TemplateResource[]>> => {
  const grouped = new Map<number, TemplateResource[]>();
  if (templateIds.length === 0) return grouped;
  const rows = await prisma.entity_resources.findMany({
    where: { entity_type: ENTITY_TYPE, entity_id: { in: templateIds }, deleted_at: null },
    select: { entity_id: true, dayNumber: true, resources: { select: { id: true, external_id: true, name: true, url: true } } },
    orderBy: { id: 'asc' }
  });
  for (const row of rows) {
    const list = grouped.get(row.entity_id) ?? [];
    list.push({ id: row.resources.external_id ?? String(row.resources.id), name: row.resources.name, url: row.resources.url || null, dayNumber: (row.dayNumber ?? null) });
    grouped.set(row.entity_id, list);
  }
  return grouped;
};

/** 標籤走 entity_tags 多態關聯（entity_type = 'practice_template'） */
const loadTags = async (templateIds: number[]): Promise<Map<number, string[]>> => {
  const grouped = new Map<number, string[]>();
  if (templateIds.length === 0) return grouped;
  const rows = await prisma.entity_tags.findMany({
    where: { entity_type: ENTITY_TYPE, entity_id: { in: templateIds } },
    select: { entity_id: true, tags: { select: { name: true } } },
    orderBy: { id: 'asc' }
  });
  for (const row of rows) {
    const list = grouped.get(row.entity_id) ?? [];
    list.push(row.tags.name);
    grouped.set(row.entity_id, list);
  }
  return grouped;
};

/** 整批換掉模板標籤：tags 以名稱 upsert，entity_tags 先清後建 */
const replaceTags = async (templateId: number, userId: number, tagNames: string[]): Promise<void> => {
  const unique = Array.from(new Set(tagNames.map(name => name.trim()).filter(Boolean)));
  await prisma.entity_tags.deleteMany({ where: { entity_type: ENTITY_TYPE, entity_id: templateId } });
  for (const name of unique) {
    const tag = await prisma.tags.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.entity_tags.create({ data: { entity_type: ENTITY_TYPE, entity_id: templateId, tag_id: tag.id, created_by: userId } });
  }
};

/** URL 正規化：trim、host 小寫、去尾端斜線；供同一模板內去重（FR-TPL-03） */
const normalizeUrl = (value: string): string => {
  try {
    const url = new URL(value.trim());
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';
    const normalized = url.toString();
    return normalized.endsWith('/') && url.pathname === '/' && !url.search ? normalized.slice(0, -1) : normalized.replace(/\/+$/, '');
  } catch {
    return value.trim().toLowerCase();
  }
};

/** 同一模板內：URL 去重（正規化後）、名稱去重、名稱不可空白 */
const assertResourcesUnique = (resources: OrganizationTemplateResourceInput[]): void => {
  const urls = new Set<string>();
  const names = new Set<string>();
  for (const resource of resources) {
    const name = resource.name.trim().toLowerCase();
    if (!name) throw new UnprocessableEntityError('資源名稱不可空白');
    if (names.has(name)) throw new UnprocessableEntityError(`資源名稱「${resource.name}」重複`);
    names.add(name);
    if (resource.url) {
      const key = normalizeUrl(resource.url);
      if (urls.has(key)) throw new UnprocessableEntityError(`資源連結「${resource.url}」已加入`);
      urls.add(key);
    }
  }
};

/** 整批換掉模板資源：舊關聯軟刪除，新的重建（resources 本體保留，供既有草稿續用） */
const replaceResources = async (templateId: number, userId: number, resources: Array<{ name: string; url?: string; dayNumber?: number | null }>): Promise<void> => {
  // 前端每次存檔都會帶 resources（即使只改了標題），沒有這道比對就會每次重造一批
  // resources 列，孤兒資料越積越多、id 也無謂地換掉
  const existing = await prisma.entity_resources.findMany({
    where: { entity_type: ENTITY_TYPE, entity_id: templateId, deleted_at: null },
    select: { dayNumber: true, resources: { select: { name: true, url: true } } },
    orderBy: { id: 'asc' }
  });
  const unchanged = existing.length === resources.length
    && existing.every((row, index) => row.resources.name === resources[index]?.name
      && (row.resources.url ?? '') === (resources[index]?.url ?? '')
      && (row.dayNumber ?? null) === (resources[index]?.dayNumber ?? null));
  if (unchanged) return;

  await prisma.entity_resources.updateMany({ where: { entity_type: ENTITY_TYPE, entity_id: templateId, deleted_at: null }, data: { deleted_at: new Date() } });
  for (const resource of resources) {
    const created = await prisma.resources.create({ data: { name: resource.name, url: resource.url || '', description: '', type: 'other', cost: 'free', created_by: userId } });
    await prisma.entity_resources.create({ data: { resource_id: created.id, entity_type: ENTITY_TYPE, entity_id: templateId, created_by: userId, dayNumber: resource.dayNumber ?? null } });
  }
};

const assertOrganization = async (organizationId: number, userId: number): Promise<void> => {
  const member = await prisma.organization_members.findUnique({ where: { organization_id_user_id: { organization_id: organizationId, user_id: userId } }, select: { organization: { select: { status: true } } } });
  if (!member) throw new ForbiddenError('無權限存取此組織模板');
  if (member.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};

const hydrate = async (rows: TemplateRow[]) => {
  const ids = rows.map(row => row.id);
  const [resources, tags] = await Promise.all([loadResources(ids), loadTags(ids)]);
  const currentDay = today();
  return rows.map(row => map(row, resources.get(row.id) ?? [], tags.get(row.id) ?? [], currentDay));
};

/** 找組織底下未刪除的模板；找不到回 404 */
const getOwnedTemplate = async (organizationId: number, templateId: number) => {
  const row = await prisma.practice_templates.findFirst({ where: { id: templateId, organization_id: organizationId, deleted_at: null }, select });
  if (!row) throw new NotFoundError('找不到組織模板');
  return row;
};

/** 模板名稱：未填時由實踐行動推導（FR-TPL-02「可自動產生模板名稱」） */
const deriveTitle = (title: string | undefined, practiceAction: string | null | undefined): string => {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  const fromAction = practiceAction?.trim();
  if (fromAction) return fromAction.slice(0, ORG_TEMPLATE_TITLE_MAX);
  return '未命名模板';
};

type Sortable = { created_at: Date | null; updated_at: Date | null };
const lastTouched = (row: Sortable): number => (row.updated_at ?? row.created_at ?? new Date(0)).getTime();

/**
 * 模板庫列表：排除封存與刪除，最後更新在前；`q` 對名稱／實踐行動／標籤／資源名稱／資源連結做不分大小寫比對（FR-TPL-01）。
 * 組織模板數量小，搜尋在應用層做，省掉跨三張多態表的 SQL。
 */
const list = async (organizationId: number, userId: number, query: OrganizationTemplateListQuery = {}) => {
  await assertOrganization(organizationId, userId);
  const rows = await prisma.practice_templates.findMany({ where: { organization_id: organizationId, archived_at: null, deleted_at: null }, select });
  const sorted = [...rows].sort((a, b) => lastTouched(b) - lastTouched(a));
  const items = await hydrate(sorted);
  const keyword = query.q?.trim().toLowerCase();
  if (!keyword) return items;
  return items.filter(item => [
    item.title, item.practiceAction ?? '', ...item.tags,
    ...item.resources.flatMap(resource => [resource.name, resource.url ?? ''])
  ].some(text => text.toLowerCase().includes(keyword)));
};

const create = async (organizationId: number, userId: number, input: CreateOrganizationTemplateInput) => {
  await assertOrganization(organizationId, userId);
  if (input.resources) assertResourcesUnique(input.resources);
  const status = input.status ?? 'ready';
  const row = await prisma.practice_templates.create({
    data: {
      organization_id: organizationId, title: deriveTitle(input.title, input.practiceAction), practice_action: input.practiceAction ?? null,
      duration_days: input.durationDays ?? null, frequency_min_days: input.frequencyMinDays ?? null, frequency_max_days: input.frequencyMaxDays ?? null,
      session_duration_minutes: input.sessionDurationMinutes ?? null, practice_time_periods: input.practiceTimePeriods ?? [],
      other_context: input.timingOther ?? null, status
    },
    select
  });
  if (input.resources?.length) await replaceResources(row.id, userId, input.resources);
  if (input.tags?.length) await replaceTags(row.id, userId, input.tags);
  return (await hydrate([row]))[0];
};

/** 改名時同步尚未開始場次裡由此模板產生、仍是草稿的實踐名稱（FR-TPL-02） */
const syncDraftPracticeTitles = async (templateId: number, title: string, currentDay: string): Promise<void> => {
  await prisma.practices.updateMany({
    where: { template_id: templateId, creation_source: 'cohort_template', status: 'draft', deleted_at: null, cohorts: { start_date: { gt: new Date(`${currentDay}T00:00:00.000Z`) } } },
    data: { title, updated_at: new Date() }
  });
};

const update = async (organizationId: number, templateId: number, userId: number, input: UpdateOrganizationTemplateInput) => {
  await assertOrganization(organizationId, userId);
  const existing = await getOwnedTemplate(organizationId, templateId);
  if (existing.archived_at) throw new ConflictError('模板已封存，請先從封存區恢復再編輯');
  if (input.resources) assertResourcesUnique(input.resources);
  const merged = {
    practiceAction: input.practiceAction !== undefined ? input.practiceAction : existing.practice_action,
    durationDays: input.durationDays !== undefined ? input.durationDays : existing.duration_days,
    frequencyMinDays: input.frequencyMinDays !== undefined ? input.frequencyMinDays : existing.frequency_min_days,
    frequencyMaxDays: input.frequencyMaxDays !== undefined ? input.frequencyMaxDays : existing.frequency_max_days
  };
  const nextStatus = input.status ?? asStatus(existing.status);
  if (nextStatus === 'ready') {
    const issues = assertTemplateReady(merged);
    if (issues.length > 0) throw new UnprocessableEntityError(issues.join('；'));
  }
  const nextTitle = input.title !== undefined ? deriveTitle(input.title, merged.practiceAction) : undefined;
  const row = await prisma.practice_templates.update({
    where: { id: templateId },
    data: {
      ...(nextTitle !== undefined && { title: nextTitle }),
      ...(input.practiceAction !== undefined && { practice_action: input.practiceAction }),
      ...(input.durationDays !== undefined && { duration_days: input.durationDays }),
      ...(input.frequencyMinDays !== undefined && { frequency_min_days: input.frequencyMinDays }),
      ...(input.frequencyMaxDays !== undefined && { frequency_max_days: input.frequencyMaxDays }),
      ...(input.sessionDurationMinutes !== undefined && { session_duration_minutes: input.sessionDurationMinutes }),
      ...(input.practiceTimePeriods !== undefined && { practice_time_periods: input.practiceTimePeriods }),
      ...(input.timingOther !== undefined && { other_context: input.timingOther }),
      ...(input.status !== undefined && { status: input.status }),
      updated_at: new Date()
    },
    select
  });
  if (nextTitle !== undefined && nextTitle !== existing.title) await syncDraftPracticeTitles(templateId, nextTitle, today());
  if (input.resources !== undefined) await replaceResources(templateId, userId, input.resources);
  if (input.tags !== undefined) await replaceTags(templateId, userId, input.tags);
  return (await hydrate([row]))[0];
};

/** 複製名稱：「原名（複製）」，與可見模板重名時加序號（FR-TPL-04） */
const duplicateTitle = (source: string, existingTitles: Set<string>): string => {
  const base = `${source}（複製）`;
  if (!existingTitles.has(base)) return base.slice(0, 100);
  for (let attempt = 2; attempt < 1000; attempt += 1) {
    const candidate = `${base} ${attempt}`;
    if (!existingTitles.has(candidate)) return candidate.slice(0, 100);
  }
  return `${base} ${Date.now()}`.slice(0, 100);
};

const duplicate = async (organizationId: number, templateId: number, userId: number) => {
  await assertOrganization(organizationId, userId);
  const source = await getOwnedTemplate(organizationId, templateId);
  const siblings = await prisma.practice_templates.findMany({ where: { organization_id: organizationId, deleted_at: null }, select: { title: true } });
  const title = duplicateTitle(source.title, new Set(siblings.map(row => row.title)));
  const [resources, tags] = await Promise.all([loadResources([source.id]), loadTags([source.id])]);
  const row = await prisma.practice_templates.create({
    data: {
      organization_id: organizationId, title, practice_action: source.practice_action, duration_days: source.duration_days,
      frequency_min_days: source.frequency_min_days, frequency_max_days: source.frequency_max_days, session_duration_minutes: source.session_duration_minutes,
      practice_time_periods: sanitizePracticeTimePeriods(source.practice_time_periods), other_context: source.other_context ?? null, status: asStatus(source.status)
    },
    select
  });
  const sourceResources = resources.get(source.id) ?? [];
  if (sourceResources.length) await replaceResources(row.id, userId, sourceResources.map(resource => ({ name: resource.name, url: resource.url ?? undefined, dayNumber: resource.dayNumber })));
  const sourceTags = tags.get(source.id) ?? [];
  if (sourceTags.length) await replaceTags(row.id, userId, sourceTags);
  await writeLighthouseAudit(prisma, userId, LIGHTHOUSE_AUDIT_ACTIONS.TEMPLATE_DUPLICATED, 'practice_template', row.id, { sourceTemplateId: source.id }, { title });
  return (await hydrate([row]))[0];
};

/** 封存模板：移出模板庫、進封存區（FR-TPL-04、FR-ARC-04）；已封存再封存回 409 */
const archive = async (organizationId: number, templateId: number, userId: number) => {
  await assertOrganization(organizationId, userId);
  const existing = await getOwnedTemplate(organizationId, templateId);
  if (existing.archived_at) throw new ConflictError('模板已在封存區');
  const now = new Date();
  // 條件式更新：同一模板被並發封存時只有第一個請求生效，其餘回 409（TP-ARC-05）
  const updated = await prisma.practice_templates.updateMany({ where: { id: templateId, archived_at: null, deleted_at: null }, data: { archived_at: now, archived_by: userId, updated_at: now } });
  if (updated.count === 0) throw new ConflictError('模板已在封存區');
  const row = await prisma.practice_templates.findUniqueOrThrow({ where: { id: templateId }, select });
  await writeLighthouseAudit(prisma, userId, LIGHTHOUSE_AUDIT_ACTIONS.TEMPLATE_ARCHIVED, 'practice_template', templateId, { archivedAt: null }, { archivedAt: row.archived_at });
  return (await hydrate([row]))[0];
};

/** 恢復封存模板：回到模板庫，保留原 id 與綁定歷程（FR-ARC-02） */
const restore = async (organizationId: number, templateId: number, userId: number) => {
  await assertOrganization(organizationId, userId);
  const existing = await getOwnedTemplate(organizationId, templateId);
  if (!existing.archived_at) throw new ConflictError('模板不在封存區');
  const updated = await prisma.practice_templates.updateMany({ where: { id: templateId, archived_at: { not: null }, deleted_at: null }, data: { archived_at: null, archived_by: null, updated_at: new Date() } });
  if (updated.count === 0) throw new ConflictError('模板不在封存區');
  const row = await prisma.practice_templates.findUniqueOrThrow({ where: { id: templateId }, select });
  await writeLighthouseAudit(prisma, userId, LIGHTHOUSE_AUDIT_ACTIONS.TEMPLATE_RESTORED, 'practice_template', templateId, { archivedAt: existing.archived_at }, { archivedAt: null });
  return (await hydrate([row]))[0];
};

/**
 * 刪除模板（軟刪 deleted_at）：仍有有效綁定時回 409。
 * 不硬刪：cohort_templates 的 FK 是 NO ACTION，且已生成的學員實踐要保留 template_id 才能在管理端維持分組名稱。
 */
const remove = async (organizationId: number, templateId: number, userId: number): Promise<void> => {
  await assertOrganization(organizationId, userId);
  await getOwnedTemplate(organizationId, templateId);
  const bindings = await prisma.cohort_templates.count({ where: { template_id: templateId, unbound_at: null } });
  if (bindings > 0) throw new ConflictError('模板仍綁定場次，請先解除綁定');
  await prisma.practice_templates.update({ where: { id: templateId }, data: { deleted_at: new Date(), updated_at: new Date() } });
  await writeLighthouseAudit(prisma, userId, LIGHTHOUSE_AUDIT_ACTIONS.TEMPLATE_DELETED, 'practice_template', templateId, {}, { deleted: true });
};

const bind = async (organizationId: number, templateId: number, cohortId: number, userId: number, bound: boolean, input: BindOrganizationTemplateInput = {}) => {
  await assertOrganization(organizationId, userId);
  const [template, cohort] = await Promise.all([
    prisma.practice_templates.findFirst({ where: { id: templateId, organization_id: organizationId, deleted_at: null }, select: { id: true, archived_at: true } }),
    prisma.cohorts.findFirst({ where: { id: cohortId, deleted_at: null, program: { organization_id: organizationId, ...ACTIVE_PROGRAM_WHERE } }, select: { id: true, status: true, start_date: true } })
  ]);
  if (!template || !cohort) throw new NotFoundError('找不到同組織的模板或期');
  if (template.archived_at) throw new ConflictError('模板已封存，請先從封存區恢復');
  if (cohort.status === 'archived') throw new ConflictError('場次已封存，無法變更模板綁定');
  // 已開始的場次不得綁定／解綁／修改開始日（FR-TPL-05）
  if (isCohortStarted(cohort.start_date, today())) throw new ConflictError('場次已開始，無法變更模板綁定');
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
export const organizationTemplateService = { list, create, update, duplicate, archive, restore, remove, bind };

/** 供 admin 共同挑戰管理重用（跳過組織成員檢查，由 requireAdmin 把關） */
export const organizationTemplateInternals = { select, map, loadResources, replaceResources };
