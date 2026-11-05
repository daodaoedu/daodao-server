import type { Prisma } from '../../generated/prisma';
import { ACTIVE_PROGRAM_WHERE } from '../constants/archive-state';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import { pickCoachLockedRelationIds } from '../utils/coach-resource-lock';
import type { CohortTemplateResourceInput } from '../validators/cohort-template-resources.validators';
import { assertCohortTemplateResourceAccess } from './cohort-template-resource-access.service';
import { prisma } from './database/prisma.service';

type Tx = Prisma.TransactionClient;

/** Lock the binding before initialization, edits or learner attachment. */
export async function lockCohortResourceBinding(tx: Tx, cohortId: number, templateId: number) {
  const rows = await tx.$queryRaw<Array<{ id: number }>>`SELECT id FROM cohort_templates WHERE cohort_id = ${cohortId} AND template_id = ${templateId} AND unbound_at IS NULL FOR UPDATE`;
  if (!rows[0]) throw new NotFoundError('找不到有效的場次模板綁定');
  return tx.cohort_templates.findUniqueOrThrow({ where: { id: rows[0].id } });
}

/** Create dedicated resource bodies once; an empty initialized snapshot stays empty. Caller holds the binding lock. */
export async function initializeCohortResources(tx: Tx, bindingId: number) {
  const binding = await tx.cohort_templates.findUniqueOrThrow({ where: { id: bindingId } });
  if (binding.resources_initialized_at) return;
  const sources = await tx.entity_resources.findMany({
    where: { entity_type: 'practice_template', entity_id: binding.template_id, deleted_at: null, resources: { deleted_at: null } },
    include: { resources: true }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }]
  });
  for (const [index, source] of sources.entries()) {
    const original = source.resources;
    const resource = await tx.resources.create({ data: {
      created_by: original.created_by, name: original.name, url: original.url,
      description: original.description, type: original.type, cost: original.cost, level: original.level,
      image_url: original.image_url, video_url: original.video_url,
      major_category_id: original.major_category_id, sub_category_id: original.sub_category_id
    } });
    await tx.cohort_template_resources.create({ data: {
      cohort_template_id: bindingId, resource_id: resource.id,
      source_template_relation_id: source.id, sort_order: index
    } });
  }
  await tx.cohort_templates.update({ where: { id: bindingId }, data: { resources_initialized_at: new Date() } });
}

/** Attach active shared sources without touching personal or unresolved legacy relations. Caller holds the binding lock. */
export async function attachCohortResources(tx: Tx, bindingId: number, practiceIds?: number[]) {
  const binding = await tx.cohort_templates.findUniqueOrThrow({ where: { id: bindingId } });
  const [shared, practices] = await Promise.all([
    tx.cohort_template_resources.findMany({ where: { cohort_template_id: bindingId, deleted_at: null, resources: { deleted_at: null } }, orderBy: [{ sort_order: 'asc' }, { id: 'desc' }] }),
    tx.practices.findMany({ where: {
      cohort_id: binding.cohort_id, template_id: binding.template_id, creation_source: 'cohort_template', deleted_at: null,
      ...(practiceIds ? { id: { in: practiceIds } } : {})
    }, select: { id: true, user_id: true } })
  ]);
  for (const practice of practices) {
    for (const source of shared) {
      await tx.entity_resources.upsert({
        where: { resource_id_entity_type_entity_id: { resource_id: source.resource_id, entity_type: 'practice', entity_id: practice.id } },
        create: { resource_id: source.resource_id, entity_type: 'practice', entity_id: practice.id, created_by: practice.user_id, cohort_template_resource_id: source.id },
        update: { deleted_at: null, cohort_template_resource_id: source.id, updated_at: new Date() }
      });
    }
    const count = await tx.entity_resources.count({ where: { entity_type: 'practice', entity_id: practice.id, deleted_at: null, resources: { deleted_at: null } } });
    await tx.practices.update({ where: { id: practice.id }, data: { has_resources: count > 0, cohort_resources_initialized_at: new Date() } });
  }
}

/** Map persistence to the stable public source identifier. */
async function readResources(tx: Tx, bindingId: number) {
  const rows = await tx.cohort_template_resources.findMany({
    where: { cohort_template_id: bindingId, deleted_at: null, resources: { deleted_at: null } },
    include: { resources: true }, orderBy: [{ sort_order: 'asc' }, { id: 'desc' }]
  });
  return rows.map(row => ({ id: row.id, name: row.resources.name, url: row.resources.url, relevantDate: row.resource_date?.toISOString().slice(0, 10) ?? null }));
}

/** Read an authorized binding snapshot. */
async function list(organizationId: number, templateId: number, cohortId: number, userId: number) {
  return prisma.$transaction(async tx => {
    // Reject unauthorized actors before they can wait on an editor's binding lock.
    await assertCohortTemplateResourceAccess(organizationId, templateId, cohortId, userId, tx);
    const binding = await lockCohortResourceBinding(tx, cohortId, templateId);
    await assertCohortTemplateResourceAccess(organizationId, templateId, cohortId, userId, tx);
    await initializeCohortResources(tx, binding.id);
    return readResources(tx, binding.id);
  });
}

/** Produce legacy candidates using the existing lock rule; this report never assigns provenance. */
export async function inspectLegacyCohortResourceLinks(tx: Tx, bindingId: number) {
  const binding = await tx.cohort_templates.findUniqueOrThrow({ where: { id: bindingId } });
  const [templates, practices] = await Promise.all([
    tx.entity_resources.findMany({ where: { entity_type: 'practice_template', entity_id: binding.template_id }, include: { resources: true } }),
    tx.practices.findMany({ where: { cohort_id: binding.cohort_id, template_id: binding.template_id, creation_source: 'cohort_template', deleted_at: null }, select: { id: true, cohort_resources_initialized_at: true } })
  ]);
  const legacy = practices.filter(row => row.cohort_resources_initialized_at === null);
  const relations = await tx.entity_resources.findMany({ where: { entity_type: 'practice', entity_id: { in: legacy.map(row => row.id) }, deleted_at: null, cohort_template_resource_id: null, resources: { deleted_at: null } }, include: { resources: true } });
  return legacy.flatMap(practice => {
    const links = relations.filter(row => row.entity_id === practice.id);
    const locked = pickCoachLockedRelationIds(templates, links);
    return links.filter(row => locked.has(row.id)).map(row => ({ practiceId: practice.id, relationId: row.id, resourceId: row.resource_id }));
  });
}

/** Fail safely for ambiguous historical source links until the reviewed mapping has been applied. */
async function assertLegacySourcesReviewed(tx: Tx, bindingId: number) {
  if ((await inspectLegacyCohortResourceLinks(tx, bindingId)).length) throw new ConflictError('此場次有舊版資源來源待核對，請先完成資料遷移');
}

/** Save a complete source set atomically and propagate only provenance-marked learner relations. */
async function update(organizationId: number, templateId: number, cohortId: number, userId: number, input: CohortTemplateResourceInput[]) {
  return prisma.$transaction(async tx => {
    // Reject unauthorized actors before they can wait on an editor's binding lock.
    await assertCohortTemplateResourceAccess(organizationId, templateId, cohortId, userId, tx);
    const binding = await lockCohortResourceBinding(tx, cohortId, templateId);
    await assertCohortTemplateResourceAccess(organizationId, templateId, cohortId, userId, tx);
    await initializeCohortResources(tx, binding.id);
    await assertLegacySourcesReviewed(tx, binding.id);
    const current = await tx.cohort_template_resources.findMany({ where: { cohort_template_id: binding.id, deleted_at: null }, orderBy: [{ sort_order: 'asc' }, { id: 'desc' }] });
    const existingIds = new Set(current.map(row => row.id));
    if (input.some(row => row.id !== undefined && !existingIds.has(row.id))) throw new BadRequestError('資源不屬於此場次');
    // A source keeps its position when edited. Newly added cards precede all existing cards.
    const keep = new Set(input.flatMap(row => row.id === undefined ? [] : [row.id]));
    const removed = current.filter(row => !keep.has(row.id));
    const now = new Date();
    if (removed.length) {
      await tx.cohort_template_resources.updateMany({ where: { id: { in: removed.map(row => row.id) } }, data: { deleted_at: now, updated_at: now } });
      await tx.entity_resources.updateMany({ where: { cohort_template_resource_id: { in: removed.map(row => row.id) }, deleted_at: null }, data: { deleted_at: now, updated_at: now } });
    }
    const newCount = input.filter(row => row.id === undefined).length;
    let newOrder = 0;
    for (const row of input) {
      const resourceDate = row.relevantDate ? new Date(`${row.relevantDate}T00:00:00.000Z`) : null;
      if (row.id !== undefined) {
        const old = current.find(item => item.id === row.id);
        if (!old) throw new BadRequestError('資源不屬於此場次');
        await tx.resources.update({ where: { id: old.resource_id }, data: { name: row.name, url: row.url, updated_at: now } });
        await tx.cohort_template_resources.update({ where: { id: row.id }, data: { resource_date: resourceDate, sort_order: newCount + current.filter(item => keep.has(item.id)).findIndex(item => item.id === row.id), updated_at: now } });
      } else {
        const resource = await tx.resources.create({ data: { created_by: userId, name: row.name, url: row.url, description: '', type: 'other', cost: 'free', level: 'all_levels' } });
        await tx.cohort_template_resources.create({ data: { cohort_template_id: binding.id, resource_id: resource.id, resource_date: resourceDate, sort_order: newOrder++ } });
      }
    }
    await attachCohortResources(tx, binding.id);
    return readResources(tx, binding.id);
  }, { timeout: 30000 });
}

/** Only current joined leaders see coach-only binding entries; membership is deliberately unnecessary. */
async function myBindings(userId: number) {
  const bindings = await prisma.cohort_templates.findMany({ where: {
    unbound_at: null, practice_template: { deleted_at: null }, cohort: {
      deleted_at: null, program: { kind: PROGRAM_KINDS.LIGHTHOUSE, ...ACTIVE_PROGRAM_WHERE, organization: { status: 'active' } },
      cohort_enrollments: { some: { user_id: userId, status: 'joined', role: { in: ['owner', 'assistant'] } } }
    }
  }, select: { template_id: true, cohort_id: true, practice_template: { select: { title: true, organization_id: true } }, cohort: { select: { display_name: true, program: { select: { organization_id: true } } } } }, orderBy: [{ cohort_id: 'asc' }, { template_id: 'asc' }] });
  return bindings.filter(row => row.practice_template.organization_id === row.cohort.program.organization_id).map(row => ({ organizationId: row.practice_template.organization_id, templateId: row.template_id, cohortId: row.cohort_id, cohortName: row.cohort.display_name, templateName: row.practice_template.title }));
}

export const cohortTemplateResourcesService = { list, update, myBindings };
