jest.mock('@/queues', () => ({ enqueuePracticeEmail: jest.fn() }));
const mockOfficialOrg = { id: 0 };
jest.mock('../challenge-organization.service', () => ({
  challengeOrganizationService: { getOrganizationId: async () => mockOfficialOrg.id, getActiveOrganizationId: async () => mockOfficialOrg.id }
}));
import { randomUUID } from 'node:crypto';
import { prisma } from '../database/prisma.service';
import { cohortTemplateResourcesService as cohortResources } from '../cohort-template-resources.service';
import { organizationTemplateService } from '../organization-template.service';
import { ensureCohortDrafts } from '../cohort-draft.service';
import { ConflictError } from '../../middleware/error.middleware';
import { cohortService } from '../cohort.service';
import { meService } from '../me.service';
import { adminChallengeService } from '../admin-challenge.service';

/**
 * daodao#544（2026-11-24 產品澄清）：
 * - 模板指派到燈塔場次時建立資源快照；之後模板資源新增／刪除／修改都不回寫已指派場次（開始前也一樣）。
 * - 場次建立後（含已開始）再指派的模板，要替已加入的學員補建實踐；已開始場次仍不得解綁或改開始日（FR-TPL-05）。
 * Run only through `pnpm test:local -- --config jest.pg.config.js <this file>` (disposable PostgreSQL).
 */
describe('Lighthouse cohort template assignment (#544)', () => {
  let owner: number, learner: number, org: number, program: number;
  const prefix = `assign544_${randomUUID()}`;
  const day = (n: number) => new Date(Date.now() + n * 86400000);
  const ymd = (n: number) => day(n).toISOString().slice(0, 10);

  /** Learner-visible shared resources of the learner's practice for one template, by name. */
  const learnerShared = async (cohortId: number, templateId: number) => {
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohortId, template_id: templateId, user_id: learner, deleted_at: null } });
    const rows = await prisma.entity_resources.findMany({
      where: { entity_type: 'practice', entity_id: practice.id, deleted_at: null, cohort_template_resource_id: { not: null } },
      include: { resources: true }
    });
    return { practice, names: rows.map(row => row.resources.name).sort() };
  };

  const createTemplate = async (resources: Array<{ name: string }>) => {
    return organizationTemplateService.create(org, owner, { title: prefix.slice(0, 20), practiceAction: '閱讀', durationDays: 7, practiceTimePeriods: [], status: 'draft', resources });
  };

  /** Cohort with the learner joined as a member and one template assigned through the coach API. */
  const setup = async (startOffsetDays: number, resources: Array<{ name: string }>) => {
    const cohort = await prisma.cohorts.create({ data: { program_id: program, slug: randomUUID(), display_name: prefix, start_date: day(startOffsetDays), end_date: day(startOffsetDays + 30) } });
    const template = await createTemplate(resources);
    await organizationTemplateService.bind(org, template.id, cohort.id, owner, true);
    await prisma.cohort_enrollments.create({ data: { cohort_id: cohort.id, email: `${randomUUID()}@example.com`, user_id: learner, status: 'joined', role: 'member', joined_at: new Date() } });
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

  describe('resource snapshot is frozen at assignment', () => {
    it('keeps the assigned defaults when the template adds, removes or renames defaults before the cohort starts', async () => {
      const { cohortId, templateId } = await setup(10, [{ name: '預設A' }, { name: '預設B' }]);
      expect((await learnerShared(cohortId, templateId)).names).toEqual(['預設A', '預設B']);

      await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '預設B（改名）' }, { name: '預設C' }] });

      expect((await learnerShared(cohortId, templateId)).names).toEqual(['預設A', '預設B']);
      expect((await cohortResources.list(org, templateId, cohortId, owner)).map(row => row.name).sort()).toEqual(['預設A', '預設B']);
    });

    it('does not add defaults that the template gains after assignment', async () => {
      const { cohortId, templateId } = await setup(10, []);
      await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '指派後新增' }] });

      expect((await learnerShared(cohortId, templateId)).names).toEqual([]);
      expect(await cohortResources.list(org, templateId, cohortId, owner)).toEqual([]);
    });

    it('freezes legacy bindings that were never snapshotted before the template resources change', async () => {
      const template = await createTemplate([{ name: '舊綁定原資源' }]);
      const cohort = await prisma.cohorts.create({ data: { program_id: program, slug: randomUUID(), display_name: prefix, start_date: day(10), end_date: day(40) } });
      // 快照機制上線前建立的綁定：resources_initialized_at 為 null
      await prisma.cohort_templates.create({ data: { cohort_id: cohort.id, template_id: template.id } });

      await organizationTemplateService.update(org, template.id, owner, { resources: [{ name: '之後才改' }] });

      expect((await cohortResources.list(org, template.id, cohort.id, owner)).map(row => row.name)).toEqual(['舊綁定原資源']);
    });

    it('freezes legacy bindings when the official-organization template is edited from the admin challenge path', async () => {
      mockOfficialOrg.id = org;
      const template = await createTemplate([{ name: '後台改前' }]);
      const cohort = await prisma.cohorts.create({ data: { program_id: program, slug: randomUUID(), display_name: prefix, start_date: day(10), end_date: day(40) } });
      await prisma.cohort_templates.create({ data: { cohort_id: cohort.id, template_id: template.id } });

      await adminChallengeService.updateTemplate(template.id, { resources: [{ name: '後台改後' }] }, owner);

      expect((await cohortResources.list(org, template.id, cohort.id, owner)).map(row => row.name)).toEqual(['後台改前']);
    });

    it('gives a newly assigned cohort the template defaults as they are at assignment', async () => {
      const { templateId } = await setup(10, [{ name: '舊預設' }]);
      await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '新預設' }] });
      const later = await prisma.cohorts.create({ data: { program_id: program, slug: randomUUID(), display_name: prefix, start_date: day(12), end_date: day(40) } });

      await organizationTemplateService.bind(org, templateId, later.id, owner, true);

      expect((await cohortResources.list(org, templateId, later.id, owner)).map(row => row.name)).toEqual(['新預設']);
    });
    it('freezes resources of a duplicated cohort at duplication time', async () => {
      const { cohortId, templateId } = await setup(10, [{ name: '複製時預設' }]);
      const copy = await cohortService.duplicate(program, cohortId, owner);
      await organizationTemplateService.update(org, templateId, owner, { resources: [{ name: '複製後才改' }] });

      expect((await cohortResources.list(org, templateId, copy.id, owner)).map(row => row.name)).toEqual(['複製時預設']);
    });
  });

  describe('assigning a template after learners joined', () => {
    it('creates the new practice, with its default resources, for learners already in an unstarted cohort', async () => {
      const { cohortId } = await setup(10, [{ name: '第一個' }]);
      const second = await createTemplate([{ name: '第二個的預設' }]);

      await organizationTemplateService.bind(org, second.id, cohortId, owner, true);

      const { practice, names } = await learnerShared(cohortId, second.id);
      expect(practice.status).toBe('draft');
      expect(practice.creation_source).toBe('cohort_template');
      expect(names).toEqual(['第二個的預設']);
      expect(await prisma.practices.count({ where: { cohort_id: cohortId, user_id: learner, deleted_at: null } })).toBe(2);
    });

    it('allows assigning a new template to a started cohort and gives joined learners the practice', async () => {
      const { cohortId } = await setup(10, []);
      await prisma.cohorts.update({ where: { id: cohortId }, data: { start_date: day(-3) } });
      const late = await createTemplate([{ name: '開始後加入' }]);

      await organizationTemplateService.bind(org, late.id, cohortId, owner, true, { startDate: ymd(2) });

      const { practice, names } = await learnerShared(cohortId, late.id);
      expect(practice.start_date?.toISOString().slice(0, 10)).toBe(ymd(2));
      expect(names).toEqual(['開始後加入']);
    });

    it('starts a template added to a started cohort today when no start date is given', async () => {
      const { cohortId } = await setup(10, []);
      await prisma.cohorts.update({ where: { id: cohortId }, data: { start_date: day(-20) } });
      const late = await createTemplate([]);

      const result = await organizationTemplateService.bind(org, late.id, cohortId, owner, true);

      const todayTaipei = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
      expect(result.startDate?.toISOString().slice(0, 10)).toBe(todayTaipei);
      const { practice } = await learnerShared(cohortId, late.id);
      expect(practice.start_date?.toISOString().slice(0, 10)).toBe(todayTaipei);
    });

    it('does not recreate a practice the learner deleted for another template', async () => {
      const { cohortId, templateId } = await setup(10, []);
      await prisma.practices.updateMany({ where: { cohort_id: cohortId, template_id: templateId, user_id: learner }, data: { deleted_at: new Date() } });
      const second = await createTemplate([]);

      await organizationTemplateService.bind(org, second.id, cohortId, owner, true);

      expect(await prisma.practices.count({ where: { cohort_id: cohortId, template_id: templateId, user_id: learner, deleted_at: null } })).toBe(0);
      expect(await prisma.practices.count({ where: { cohort_id: cohortId, template_id: second.id, user_id: learner, deleted_at: null } })).toBe(1);
    });

    it('skips learners who have exited the cohort', async () => {
      const { cohortId } = await setup(10, []);
      await prisma.cohort_enrollments.updateMany({ where: { cohort_id: cohortId, user_id: learner }, data: { status: 'exited', exited_at: new Date() } });
      const second = await createTemplate([]);

      await organizationTemplateService.bind(org, second.id, cohortId, owner, true);

      expect(await prisma.practices.count({ where: { cohort_id: cohortId, template_id: second.id } })).toBe(0);
    });
    it('backfills a missing learner practice when the coach resends an existing binding on a started cohort', async () => {
      const { cohortId, templateId } = await setup(10, [{ name: '既有預設' }]);
      await prisma.cohorts.update({ where: { id: cohortId }, data: { start_date: day(-1) } });
      // cohort 167 情境：綁定在學員加入後建立、當時沒有替學員補建實踐
      await prisma.practices.deleteMany({ where: { cohort_id: cohortId, template_id: templateId, user_id: learner } });
      const before = await prisma.cohort_templates.findFirstOrThrow({ where: { cohort_id: cohortId, template_id: templateId, unbound_at: null } });

      await organizationTemplateService.bind(org, templateId, cohortId, owner, true);

      expect((await learnerShared(cohortId, templateId)).names).toEqual(['既有預設']);
      const after = await prisma.cohort_templates.findFirstOrThrow({ where: { id: before.id } });
      expect(after.bound_at).toEqual(before.bound_at);
      expect(after.start_date).toEqual(before.start_date);
    });
    it('does not resurrect a practice of the same template that the learner soft-deleted', async () => {
      const { cohortId, templateId } = await setup(10, []);
      await prisma.practices.updateMany({ where: { cohort_id: cohortId, template_id: templateId, user_id: learner }, data: { deleted_at: new Date() } });

      await organizationTemplateService.bind(org, templateId, cohortId, owner, true);
      await prisma.cohorts.update({ where: { id: cohortId }, data: { start_date: day(-1) } });
      await organizationTemplateService.bind(org, templateId, cohortId, owner, true);

      expect(await prisma.practices.count({ where: { cohort_id: cohortId, template_id: templateId, user_id: learner, deleted_at: null } })).toBe(0);
    });
  });

  describe('learner practice list', () => {
    it('marks Lighthouse cohort practices so the list does not show them as drafts', async () => {
      const { cohortId, templateId } = await setup(10, []);
      const personal = await prisma.practices.create({ data: { user_id: learner, title: `${prefix}_personal`, status: 'draft' } });
      const cohortPractice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohortId, template_id: templateId, user_id: learner } });

      const list = await meService.getMyPractices(learner, { page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });

      expect(list.data.find(row => row.id === cohortPractice.external_id)?.isCohortPractice).toBe(true);
      expect(list.data.find(row => row.id === personal.external_id)?.isCohortPractice).toBe(false);
    });
  });

  describe('started cohorts keep existing bindings locked (FR-TPL-05)', () => {
    it('keeps a started Challenge cohort locked against new templates (AC-05)', async () => {
      const challenge = (await prisma.programs.create({ data: { organization_id: org, name: `${prefix}_c`, kind: 'challenge' } })).id;
      const cohort = await prisma.cohorts.create({ data: { program_id: challenge, slug: randomUUID(), display_name: prefix, start_date: day(-1), end_date: day(20) } });
      const template = await createTemplate([]);

      await expect(organizationTemplateService.bind(org, template.id, cohort.id, owner, true)).rejects.toBeInstanceOf(ConflictError);
      expect(await prisma.cohort_templates.count({ where: { cohort_id: cohort.id } })).toBe(0);
    });

    it('rejects unbinding or moving the start date of an existing binding once the cohort started', async () => {
      const { cohortId, templateId } = await setup(10, []);
      await prisma.cohorts.update({ where: { id: cohortId }, data: { start_date: day(-1) } });

      await expect(organizationTemplateService.bind(org, templateId, cohortId, owner, false)).rejects.toBeInstanceOf(ConflictError);
      await expect(organizationTemplateService.bind(org, templateId, cohortId, owner, true, { startDate: ymd(5) })).rejects.toBeInstanceOf(ConflictError);
      expect(await prisma.cohort_templates.count({ where: { cohort_id: cohortId, template_id: templateId, unbound_at: null, start_date: null } })).toBe(1);
    });
  });
});
