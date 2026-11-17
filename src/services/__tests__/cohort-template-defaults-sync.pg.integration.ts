jest.mock('@/queues', () => ({ enqueuePracticeEmail: jest.fn() }));
import { randomUUID } from 'node:crypto';
import { prisma } from '../database/prisma.service';
import { cohortTemplateResourcesService as cohortResources } from '../cohort-template-resources.service';
import { organizationTemplateService } from '../organization-template.service';
import { ensureCohortDrafts } from '../cohort-draft.service';
import { updateCohortTemplateResourcesSchema } from '../../validators/cohort-template-resources.validators';

/**
 * daodao#544：場次開始前，模板預設資源的變更要同步到場次快照與學員實踐；開始後凍結。
 * Run only through `pnpm test:local -- --config jest.pg.config.js <this file>` (disposable PostgreSQL).
 */
describe('template default resources follow unstarted Lighthouse cohorts (#544)', () => {
  let owner: number, learner: number, org: number, program: number;
  const prefix = `sync544_${randomUUID()}`;
  const day = (n: number) => new Date(Date.now() + n * 86400000);

  /** Learner-visible shared resources of the learner's cohort practice, by name. */
  const learnerShared = async (cohortId: number) => {
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohortId, user_id: learner } });
    const rows = await prisma.entity_resources.findMany({
      where: { entity_type: 'practice', entity_id: practice.id, deleted_at: null, cohort_template_resource_id: { not: null } },
      include: { resources: true, shared_resource: true }
    });
    return { practice, names: rows.map(row => row.resources.name).sort(), rows };
  };

  const setup = async (startOffsetDays: number) => {
    const cohort = await prisma.cohorts.create({ data: { program_id: program, slug: randomUUID(), display_name: prefix, start_date: day(startOffsetDays), end_date: day(startOffsetDays + 20) } });
    const template = await prisma.practice_templates.create({ data: { organization_id: org, title: prefix.slice(0, 20), practice_action: '閱讀', practice_time_periods: [], status: 'draft' } });
    await prisma.cohort_templates.create({ data: { cohort_id: cohort.id, template_id: template.id } });
    // Snapshot initialized while the template still has no resources (the cohort 150 case).
    expect(await cohortResources.list(org, template.id, cohort.id, owner)).toEqual([]);
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort.id, learner));
    return { cohortId: cohort.id, templateId: template.id };
  };

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (url.hostname !== '127.0.0.1' || url.pathname !== '/daodao_test') throw new Error('Only the disposable test:local PostgreSQL may run these tests');
    const role = await prisma.roles.findFirstOrThrow();
    const users = await Promise.all([0, 1].map(i => prisma.users.create({ data: { mongo_id: `${prefix}_${i}`, nickname: `${prefix}_${i}`, role_id: role.id, tag_list: [] } })));
    [owner, learner] = users.map(row => row.id);
    org = (await prisma.organization.create({ data: { name: prefix, status: 'active' } })).id;
    await prisma.organization_members.create({ data: { organization_id: org, user_id: owner, role: 'owner' } });
    program = (await prisma.programs.create({ data: { organization_id: org, name: prefix, kind: 'lighthouse' } })).id;
  });

  afterAll(async () => { await prisma.$disconnect(); });

  it('adds template defaults added after assignment to an unstarted cohort and its learners, without dates', async () => {
    const { cohortId, templateId } = await setup(10);
    await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '預設A', url: 'https://example.com/a' }, { name: '預設B' }] });

    const { names, rows, practice } = await learnerShared(cohortId);
    expect(names).toEqual(['預設A', '預設B']);
    expect(rows.every(row => row.shared_resource?.resource_date === null)).toBe(true);
    expect(practice.has_resources).toBe(true);
    expect((await cohortResources.list(org, templateId, cohortId, owner)).map(row => row.name).sort()).toEqual(['預設A', '預設B']);
  });

  it('keeps cohort-specific and personal resources while replacing removed defaults', async () => {
    const { cohortId, templateId } = await setup(10);
    await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '預設A' }, { name: '預設B' }] });
    const current = await cohortResources.list(org, templateId, cohortId, owner);
    await cohortResources.update(org, templateId, cohortId, owner, updateCohortTemplateResourcesSchema.parse({
      resources: [{ name: '場次專屬', url: '', relevantDate: '2099-01-01' }, ...current]
    }).resources);
    const { practice } = await learnerShared(cohortId);
    const personal = await prisma.resources.create({ data: { created_by: learner, name: '個人', url: '', description: '', type: 'other', cost: 'free' } });
    await prisma.entity_resources.create({ data: { resource_id: personal.id, entity_type: 'practice', entity_id: practice.id, created_by: learner } });

    await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '預設B' }, { name: '預設C' }] });

    expect((await learnerShared(cohortId)).names).toEqual(['場次專屬', '預設B', '預設C']);
    const listed = await cohortResources.list(org, templateId, cohortId, owner);
    expect(listed.find(row => row.name === '場次專屬')?.relevantDate).toBe('2099-01-01');
    expect(await prisma.entity_resources.count({ where: { entity_type: 'practice', entity_id: practice.id, resource_id: personal.id, deleted_at: null } })).toBe(1);
  });

  it('leaves a started cohort snapshot unchanged when the template defaults change', async () => {
    const { cohortId, templateId } = await setup(10);
    await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '開始前' }] });
    await prisma.cohorts.update({ where: { id: cohortId }, data: { start_date: day(-1) } });

    await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '開始後新增' }] });

    expect((await learnerShared(cohortId)).names).toEqual(['開始前']);
    expect((await cohortResources.list(org, templateId, cohortId, owner)).map(row => row.name)).toEqual(['開始前']);
  });

  it('does nothing when a save resends identical template resources', async () => {
    const { cohortId, templateId } = await setup(10);
    await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '預設A' }] });
    const before = await learnerShared(cohortId);
    await organizationTemplateService.update(org, templateId, owner, { title: '只改名稱', resources: [{ name: '預設A' }] });
    const after = await learnerShared(cohortId);
    expect(after.rows.map(row => row.id)).toEqual(before.rows.map(row => row.id));
  });
});
