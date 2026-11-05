jest.mock('@/queues', () => ({ enqueuePracticeEmail: jest.fn() }));
import { update as updatePractice, findById as findPractice } from '../practice.service';
import { randomUUID } from 'node:crypto';
import { prisma } from '../database/prisma.service';
import { cohortTemplateResourcesService as service, inspectLegacyCohortResourceLinks } from '../cohort-template-resources.service';
import { cohortMembershipService } from '../cohort-membership.service';
import { organizationTemplateService } from '../organization-template.service';
import { ensureCohortDrafts } from '../cohort-draft.service';
import { updatePracticeSchema } from '../../validators/practice.validators';
import { updateCohortTemplateResourcesSchema } from '../../validators/cohort-template-resources.validators';

// Run through jest.pg.config.js against the guarded task-owned database.
describe('cohort resource persistence and propagation (#401)', () => {
  let owner: number, leader: number, learner: number, newcomer: number, outsider: number;
  let org: number, template: number, cohort: number, binding: number, original: number;
  const prefix = `core401_${randomUUID()}`;
  const day = (n: number) => new Date(Date.now() + n * 86400000);
  const payload = (resources: unknown[]) => updateCohortTemplateResourcesSchema.parse({ resources }).resources;
  const put = (resources: unknown[], user = owner) => service.update(org, template, cohort, user, payload(resources));

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (url.hostname !== '127.0.0.1' || url.port !== '5601' || url.pathname !== '/daodao_401') throw new Error('Only the task-owned #401 PostgreSQL may run these tests');
    const identity = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
    expect(identity[0].db).toBe('daodao_401');
    const role = await prisma.roles.findFirstOrThrow();
    const users = await Promise.all(Array.from({ length: 5 }, (_, i) => prisma.users.create({ data: { mongo_id: `${prefix}_${i}`, nickname: `${prefix}_${i}`, role_id: role.id, tag_list: [] } })));
    [owner, leader, learner, newcomer, outsider] = users.map(row => row.id);
  });

  beforeEach(async () => {
    const organization = await prisma.organization.create({ data: { name: prefix, status: 'active' } }); org = organization.id;
    await prisma.organization_members.create({ data: { organization_id: org, user_id: owner, role: 'owner' } });
    const program = await prisma.programs.create({ data: { organization_id: org, name: prefix, kind: 'lighthouse' } });
    const run = await prisma.cohorts.create({ data: { program_id: program.id, slug: randomUUID(), display_name: prefix, start_date: day(10), end_date: day(30) } }); cohort = run.id;
    const tpl = await prisma.practice_templates.create({ data: { organization_id: org, title: prefix.slice(0, 20), practice_action: '閱讀', practice_time_periods: [] } }); template = tpl.id;
    const resource = await prisma.resources.create({ data: { created_by: owner, name: '原模板', url: 'https://example.com/original', description: '', type: 'other', cost: 'free' } }); original = resource.id;
    await prisma.entity_resources.create({ data: { resource_id: original, entity_type: 'practice_template', entity_id: template, created_by: owner } });
    binding = (await prisma.cohort_templates.create({ data: { cohort_id: cohort, template_id: template } })).id;
    await prisma.cohort_enrollments.create({ data: { cohort_id: cohort, email: `${prefix}@example.test`, user_id: leader, role: 'owner', status: 'joined' } });
  });

  afterAll(async () => { await prisma.$disconnect(); });

  it('clones at initialization, preserves stable id/order and leaves template and other binding unchanged', async () => {
    const initial = await service.list(org, template, cohort, owner);
    expect(initial).toHaveLength(1);
    const clone = await prisma.cohort_template_resources.findUniqueOrThrow({ where: { id: initial[0].id } });
    expect(clone.resource_id).not.toBe(original);
    const saved = await put([{ name: '最新', url: 'http://example.com/new', relevantDate: '2099-01-01' }, { ...initial[0], name: '改名' }]);
    expect(saved.map(row => row.name)).toEqual(['最新', '改名']);
    expect(saved[1].id).toBe(initial[0].id);
    expect(saved[0].relevantDate).toBe('2099-01-01');
    const edited = await put([{ ...saved[1], name: '仍在後面' }, { ...saved[0], name: '修改不改排序' }]);
    expect(edited.map(row => row.id)).toEqual(saved.map(row => row.id));
    expect((await prisma.resources.findUniqueOrThrow({ where: { id: original } })).name).toBe('原模板');
    const otherCohort = await prisma.cohorts.create({ data: { program_id: (await prisma.cohorts.findUniqueOrThrow({ where: { id: cohort } })).program_id, slug: randomUUID(), display_name: 'other', start_date: day(10), end_date: day(30) } });
    await prisma.cohort_templates.create({ data: { cohort_id: otherCohort.id, template_id: template } });
    expect((await service.list(org, template, otherCohort.id, owner))[0].name).toBe('原模板');
  });

  it('keeps a cleared initialized snapshot empty for future learners despite template edits', async () => {
    await put([]);
    await prisma.resources.update({ where: { id: original }, data: { name: '模板後續改名' } });
    expect(await service.list(org, template, cohort, owner)).toEqual([]);
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, newcomer));
    const draft = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: newcomer } });
    expect(await prisma.entity_resources.count({ where: { entity_type: 'practice', entity_id: draft.id, deleted_at: null } })).toBe(0);
    expect(draft.has_resources).toBe(false);
  });

  it('propagates changes/deletion to existing and new learners while preserving personal resources', async () => {
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const personal = await prisma.resources.create({ data: { created_by: learner, name: '個人', url: 'https://example.com/personal', description: '', type: 'other', cost: 'free' } });
    await prisma.entity_resources.create({ data: { resource_id: personal.id, entity_type: 'practice', entity_id: practice.id, created_by: learner } });
    const sources = await service.list(org, template, cohort, owner);
    const saved = await put([{ ...sources[0], name: '所有人看到', relevantDate: '2099-12-31' }, { name: '新卡', url: '', relevantDate: null }]);
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, newcomer));
    const later = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: newcomer } });
    for (const id of [practice.id, later.id]) {
      const linked = await prisma.entity_resources.findMany({ where: { entity_type: 'practice', entity_id: id, deleted_at: null, cohort_template_resource_id: { not: null } }, include: { resources: true } });
      expect(linked.map(row => row.resources.name).sort()).toEqual(['所有人看到', '新卡'].sort());
      expect(linked.map(row => row.cohort_template_resource_id).sort()).toEqual(saved.map(row => row.id).sort());
    }
    await put([]);
    expect(await prisma.entity_resources.count({ where: { entity_type: 'practice', entity_id: practice.id, resource_id: personal.id, deleted_at: null } })).toBe(1);
    expect((await prisma.practices.findUniqueOrThrow({ where: { id: practice.id } })).has_resources).toBe(true);
    expect((await prisma.practices.findUniqueOrThrow({ where: { id: later.id } })).has_resources).toBe(false);
  });

  it('allows nonmember leaders, rejects outsiders and foreign source IDs atomically', async () => {
    expect(await service.myBindings(leader)).toEqual(expect.arrayContaining([expect.objectContaining({ cohortId: cohort, templateId: template, organizationId: org })]));
    expect(await service.myBindings(outsider)).toEqual([]);
    const saved = await put([{ name: '帶領者新增', url: '' }], leader);
    await expect(put([], outsider)).rejects.toThrow('無權限');
    await expect(put([{ id: 2147483647, name: '外部來源', url: '' }])).rejects.toThrow('不屬於此場次');
    expect(await service.list(org, template, cohort, owner)).toEqual(saved);
  });

  it('permits an assistant then immediately revokes GET/PUT and binding discovery after exit', async () => {
    await prisma.cohort_enrollments.updateMany({ where: { cohort_id: cohort, user_id: leader }, data: { role: 'assistant' } });
    expect(await service.list(org, template, cohort, leader)).toHaveLength(1);
    const saved = await put([{ name: '助教保存', url: 'https://example.com/assistant' }], leader);
    expect(saved[0].name).toBe('助教保存');
    expect(await service.myBindings(leader)).toEqual(expect.arrayContaining([expect.objectContaining({ organizationId: org, templateId: template, cohortId: cohort })]));
    const exit = await cohortMembershipService.exit(cohort, leader);
    expect(exit.status).toBe('exited');
    await expect(service.list(org, template, cohort, leader)).rejects.toMatchObject({ statusCode: 403 });
    await expect(put([], leader)).rejects.toMatchObject({ statusCode: 403 });
    expect((await service.myBindings(leader)).some(row => row.cohortId === cohort && row.templateId === template)).toBe(false);
    expect(await service.list(org, template, cohort, owner)).toEqual(saved);
  });

  it('rejects organization and cohort owners on foreign or mismatched exact bindings', async () => {
    const saved = await service.list(org, template, cohort, owner);
    const foreignOrg = await prisma.organization.create({ data: { name: `${prefix}_foreign`, status: 'active' } });
    await prisma.organization_members.create({ data: { organization_id: foreignOrg.id, user_id: outsider, role: 'owner' } });
    const foreignProgram = await prisma.programs.create({ data: { organization_id: foreignOrg.id, name: 'other organization program', kind: 'lighthouse' } });
    const foreignCohort = await prisma.cohorts.create({ data: { program_id: foreignProgram.id, slug: randomUUID(), display_name: '其他組織場次', start_date: day(10), end_date: day(30) } });
    const foreignTemplate = await prisma.practice_templates.create({ data: { organization_id: foreignOrg.id, title: '其他組織模板', practice_time_periods: [] } });
    await prisma.cohort_templates.create({ data: { cohort_id: foreignCohort.id, template_id: foreignTemplate.id } });
    for (const actor of [owner, leader]) {
      await expect(service.list(foreignOrg.id, foreignTemplate.id, foreignCohort.id, actor)).rejects.toMatchObject({ statusCode: 403 });
      await expect(service.update(foreignOrg.id, foreignTemplate.id, foreignCohort.id, actor, [])).rejects.toMatchObject({ statusCode: 403 });
      await expect(service.list(foreignOrg.id, template, cohort, actor)).rejects.toMatchObject({ statusCode: 404 });
      await expect(service.update(org, foreignTemplate.id, cohort, actor, [])).rejects.toMatchObject({ statusCode: 404 });
    }
    expect(await service.list(foreignOrg.id, foreignTemplate.id, foreignCohort.id, outsider)).toEqual([]);
    expect(await service.list(org, template, cohort, owner)).toEqual(saved);
  });

  it('blocks suspended organization reads/writes and discovery while preserving the saved snapshot', async () => {
    const saved = await put([{ name: '停權前保存', url: 'https://example.com/before-suspension', relevantDate: '2099-01-01' }]);
    await prisma.organization.update({ where: { id: org }, data: { status: 'suspended' } });
    for (const actor of [owner, leader]) {
      await expect(service.list(org, template, cohort, actor)).rejects.toMatchObject({ statusCode: 403 });
      await expect(put([], actor)).rejects.toMatchObject({ statusCode: 403 });
    }
    expect((await service.myBindings(leader)).some(row => row.cohortId === cohort && row.templateId === template)).toBe(false);
    await prisma.organization.update({ where: { id: org }, data: { status: 'active' } });
    expect(await service.list(org, template, cohort, owner)).toEqual(saved);
    expect(await service.list(org, template, cohort, leader)).toEqual(saved);
  });

  it('reports legacy content-clone candidates and refuses destructive sync until reviewed', async () => {
    const practice = await prisma.practices.create({ data: { user_id: learner, cohort_id: cohort, template_id: template, creation_source: 'cohort_template', title: '舊學員', practice_time_periods: [], created_at: new Date('2020-01-01') } });
    const copy = await prisma.resources.create({ data: { created_by: learner, name: '原模板', url: 'https://example.com/original', description: '', type: 'other', cost: 'free' } });
    const relation = await prisma.entity_resources.create({ data: { resource_id: copy.id, entity_type: 'practice', entity_id: practice.id, created_by: learner } });
    await service.list(org, template, cohort, owner);
    const report = await prisma.$transaction(tx => inspectLegacyCohortResourceLinks(tx, binding));
    expect(report).toEqual([{ practiceId: practice.id, relationId: relation.id, resourceId: copy.id }]);
    await expect(put([])).rejects.toThrow('來源待核對');
    expect((await prisma.entity_resources.findUniqueOrThrow({ where: { id: relation.id } })).deleted_at).toBeNull();
    expect((await service.list(org, template, cohort, owner))).toHaveLength(1);
  });

  it('snapshots during bind and retains the snapshot across unbind/rebind', async () => {
    await prisma.cohort_templates.delete({ where: { id: binding } });
    await organizationTemplateService.bind(org, template, cohort, owner, true);
    const created = await prisma.cohort_templates.findUniqueOrThrow({ where: { cohort_id_template_id: { cohort_id: cohort, template_id: template } } });
    expect(created.resources_initialized_at).not.toBeNull();
    await prisma.resources.update({ where: { id: original }, data: { name: '綁定後模板更名' } });
    await organizationTemplateService.bind(org, template, cohort, owner, false);
    await organizationTemplateService.bind(org, template, cohort, owner, true);
    expect((await service.list(org, template, cohort, owner))[0].name).toBe('原模板');
  });

  it('marks reviewed empty legacy practices so later personal matches stay personal', async () => {
    const practice = await prisma.practices.create({ data: { user_id: learner, cohort_id: cohort, template_id: template, creation_source: 'cohort_template', title: '舊但無共用', practice_time_periods: [] } });
    await put([]);
    expect((await prisma.practices.findUniqueOrThrow({ where: { id: practice.id } })).cohort_resources_initialized_at).not.toBeNull();
    const personal = await prisma.resources.create({ data: { created_by: learner, name: '原模板', url: 'https://example.com/original', description: '', type: 'other', cost: 'free' } });
    const link = await prisma.entity_resources.create({ data: { resource_id: personal.id, entity_type: 'practice', entity_id: practice.id, created_by: learner } });
    expect(await prisma.$transaction(tx => inspectLegacyCohortResourceLinks(tx, binding))).toEqual([]);
    await put([{ name: '新共用', url: '' }]);
    const untouched = await prisma.entity_resources.findUniqueOrThrow({ where: { id: link.id } });
    expect(untouched.deleted_at).toBeNull();
    expect(untouched.cohort_template_resource_id).toBeNull();
  });

  it('preserves personal same-content resources across learner save/delete and rejects shared edits', async () => {
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const detail = (await findPractice(practice.id, learner)).data;
    const shared = detail.resources ?? [];
    expect(shared).toHaveLength(1);
    expect(shared[0].isLocked).toBe(true);
    await updatePractice(practice.id, { resources: [...shared, { name: shared[0].name, url: shared[0].url }] }, learner);
    const withPersonal = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(withPersonal.map(row => row.isLocked)).toEqual([true, false]);
    expect(withPersonal[0].id).toBe(shared[0].id);
    await updatePractice(practice.id, { resources: withPersonal.filter(row => row.isLocked) }, learner);
    const remaining = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(remaining.map(row => row.id)).toEqual([shared[0].id]);
    await expect(updatePractice(practice.id, { resources: [{ ...shared[0], name: '學員偽造共用名稱' }] }, learner)).rejects.toThrow('不可移除或修改');
    expect((await findPractice(practice.id, learner)).data.resources?.[0].name).toBe(shared[0].name);
  });

  it('rejects a stale learner snapshot after admin deletion instead of recreating shared resources as personal', async () => {
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const stale = (await findPractice(practice.id, learner)).data.resources ?? [];
    await put([]);
    await expect(updatePractice(practice.id, { resources: stale }, learner)).rejects.toThrow();
    expect((await findPractice(practice.id, learner)).data.resources ?? []).toEqual([]);
    expect(await prisma.entity_resources.count({ where: { entity_type: 'practice', entity_id: practice.id, deleted_at: null } })).toBe(0);
  });

  it('rolls back the entire learner save when concurrent admin changes invalidate its resource snapshot', async () => {
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const resources = (await findPractice(practice.id, learner)).data.resources ?? [];
    const sources = await service.list(org, template, cohort, owner);
    let unlock = () => {};
    let locked = () => {};
    const ready = new Promise<void>(resolve => { locked = resolve; });
    const release = new Promise<void>(resolve => { unlock = resolve; });
    const blocker = prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM cohort_templates WHERE id = ${binding} FOR UPDATE`;
      locked();
      await release;
    }, { timeout: 15000 });
    const waitForQueued = async (count: number) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        const rows = await prisma.$queryRaw<Array<{ n: bigint }>>`SELECT count(*) AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE '%cohort_templates%'`;
        if (Number(rows[0].n) >= count) return;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw new Error('Expected binding lock contenders did not arrive');
    };
    await ready;
    const adminSave = put([{ ...sources[0], name: '管理端同步新名稱' }]);
    let learnerSave: Promise<{ error?: unknown }> | undefined;
    try {
      await waitForQueued(1);
      learnerSave = updatePractice(practice.id, { title: '這次失敗不應改名', resources }, learner).then(() => ({}), error => ({ error }));
      await waitForQueued(2);
    } finally { unlock(); }
    await blocker;
    await adminSave;
    const result = await learnerSave;
    expect(result?.error).toBeInstanceOf(Error);
    expect((await prisma.practices.findUniqueOrThrow({ where: { id: practice.id } })).title).toBe(practice.title);
    expect((await findPractice(practice.id, learner)).data.resources?.[0].name).toBe('管理端同步新名稱');
  });

  it('round-trips 50 shared resources plus personal resources through the real learner update validator and persistence', async () => {
    await put(Array.from({ length: 50 }, (_, i) => ({ name: `共用講義 ${i}`, url: `https://example.com/large/${i}` })));
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const shared = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(shared).toHaveLength(50);
    const request = updatePracticeSchema.parse({ resources: [...shared, { name: '我的筆記', url: 'https://example.com/personal-note' }] });
    await updatePractice(practice.id, request, learner);
    const resources = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(resources.filter(row => row.isLocked).map(row => row.id)).toEqual(shared.map(row => row.id));
    expect(resources.filter(row => !row.isLocked).map(row => row.name)).toEqual(['我的筆記']);
    expect(resources).toHaveLength(51);
  });

  it('rejects 11 personal resources after shared partition without changing title or existing links', async () => {
    await put(Array.from({ length: 49 }, (_, i) => ({ name: `共用卡 ${i}`, url: `https://example.com/personal-limit/${i}` })));
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const shared = (await findPractice(practice.id, learner)).data.resources ?? [];
    const request = updatePracticeSchema.parse({ title: '這個失敗不可改名', resources: [
      ...shared, ...Array.from({ length: 11 }, (_, i) => ({ name: `個人筆記 ${i}`, url: `https://example.com/personal-limit-note/${i}` }))
    ] });
    expect(request.resources).toHaveLength(60);
    await expect(updatePractice(practice.id, request, learner)).rejects.toThrow();
    expect((await prisma.practices.findUniqueOrThrow({ where: { id: practice.id } })).title).toBe(practice.title);
    const persisted = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(persisted.map(row => row.id)).toEqual(shared.map(row => row.id));
    expect(persisted.every(row => row.isLocked)).toBe(true);
  });

  it('preserves existing personal UUIDs and creation order when adding and removing personal resources', async () => {
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const shared = (await findPractice(practice.id, learner)).data.resources ?? [];
    await updatePractice(practice.id, updatePracticeSchema.parse({ resources: [
      ...shared, { name: '原舊筆記', url: 'https://example.com/old-personal' },
      { name: '原新筆記', url: 'https://example.com/newer-personal' }
    ] }), learner);
    const before = (await findPractice(practice.id, learner)).data.resources ?? [];
    const originalPersonal = before.filter(row => !row.isLocked);
    expect(originalPersonal.map(row => row.name)).toEqual(['原新筆記', '原舊筆記']);
    const originalBodies = await prisma.resources.findMany({ where: { external_id: { in: originalPersonal.map(row => row.id) } }, select: { id: true, external_id: true, created_at: true }, orderBy: { id: 'asc' } });
    const originalLinks = await prisma.entity_resources.findMany({ where: { entity_type: 'practice', entity_id: practice.id, resource_id: { in: originalBodies.map(row => row.id) }, deleted_at: null }, select: { id: true, resource_id: true, created_at: true }, orderBy: { id: 'asc' } });
    await updatePractice(practice.id, updatePracticeSchema.parse({ resources: [
      ...before, { name: '最新個人筆記', url: 'https://example.com/latest-personal' }
    ] }), learner);
    const after = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(after.filter(row => !row.isLocked).map(row => row.name)).toEqual(['最新個人筆記', '原新筆記', '原舊筆記']);
    expect(after.filter(row => !row.isLocked).slice(1).map(row => row.id)).toEqual(originalPersonal.map(row => row.id));
    expect(await prisma.resources.findMany({ where: { external_id: { in: originalPersonal.map(row => row.id) } }, select: { id: true, external_id: true, created_at: true }, orderBy: { id: 'asc' } })).toEqual(originalBodies);
    expect(await prisma.entity_resources.findMany({ where: { entity_type: 'practice', entity_id: practice.id, resource_id: { in: originalBodies.map(row => row.id) }, deleted_at: null }, select: { id: true, resource_id: true, created_at: true }, orderBy: { id: 'asc' } })).toEqual(originalLinks);
    const removed = originalPersonal[0];
    await updatePractice(practice.id, updatePracticeSchema.parse({ resources: after.filter(row => row.id !== removed.id) }), learner);
    const final = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(final.filter(row => !row.isLocked).map(row => row.name)).toEqual(['最新個人筆記', '原舊筆記']);
    expect(final.filter(row => row.isLocked).map(row => row.id)).toEqual(shared.map(row => row.id));
    expect(final.find(row => row.name === '原舊筆記')?.id).toBe(originalPersonal[1].id);
  });

  it('keeps personal edit order and relation identity without changing another practice sharing its body', async () => {
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, learner));
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, newcomer));
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: learner } });
    const other = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: newcomer } });
    const shared = (await findPractice(practice.id, learner)).data.resources ?? [];
    await updatePractice(practice.id, updatePracticeSchema.parse({ resources: [...shared,
      { name: 'older personal', url: 'https://example.com/older', dayNumber: 1 },
      { name: 'newer personal', url: 'https://example.com/newer' }
    ] }), learner);
    const before = (await findPractice(practice.id, learner)).data.resources ?? [];
    const older = before.find(row => row.name === 'older personal')!;
    const body = await prisma.resources.findUniqueOrThrow({ where: { external_id: older.id } });
    const relation = await prisma.entity_resources.findFirstOrThrow({ where: { entity_type: 'practice', entity_id: practice.id, resource_id: body.id, deleted_at: null } });
    await prisma.entity_resources.create({ data: { resource_id: body.id, entity_type: 'practice', entity_id: other.id, created_by: newcomer } });
    await updatePractice(practice.id, updatePracticeSchema.parse({ resources: before.map(row => row.id === older.id
      ? { ...row, name: 'edited older', url: 'https://example.com/edited', dayNumber: 3 } : row) }), learner);
    const after = (await findPractice(practice.id, learner)).data.resources ?? [];
    expect(after.filter(row => !row.isLocked).map(row => row.name)).toEqual(['newer personal', 'edited older']);
    expect(after.find(row => row.name === 'edited older')).toMatchObject({ url: 'https://example.com/edited', dayNumber: 3 });
    const savedRelation = await prisma.entity_resources.findUniqueOrThrow({ where: { id: relation.id } });
    expect(savedRelation).toMatchObject({ deleted_at: null, created_at: relation.created_at, cohort_template_resource_id: null });
    expect(await prisma.resources.findUniqueOrThrow({ where: { id: body.id } })).toEqual(body);
    expect((await findPractice(other.id, newcomer)).data.resources?.find(row => row.id === older.id)).toMatchObject({ name: 'older personal', url: 'https://example.com/older' });
    expect(after.filter(row => row.isLocked)).toEqual(before.filter(row => row.isLocked));
    expect(after.find(row => row.name === 'newer personal')).toEqual(before.find(row => row.name === 'newer personal'));
  });

  it('serializes simultaneous replacement and learner join without partial source sets', async () => {
    await service.list(org, template, cohort, owner);
    await Promise.all([
      put(Array.from({ length: 50 }, (_, i) => ({ name: `第${i}份`, url: `https://example.com/${i}` }))),
      prisma.$transaction(tx => ensureCohortDrafts(tx, cohort, newcomer), { timeout: 30000 })
    ]);
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohort, user_id: newcomer } });
    const sources = await service.list(org, template, cohort, owner);
    const linked = await prisma.entity_resources.findMany({ where: { entity_type: 'practice', entity_id: practice.id, deleted_at: null, cohort_template_resource_id: { not: null } } });
    expect(sources).toHaveLength(50);
    expect(linked.map(row => row.cohort_template_resource_id).sort()).toEqual(sources.map(row => row.id).sort());
  });
});
