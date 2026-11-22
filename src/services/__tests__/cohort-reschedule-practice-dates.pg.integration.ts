jest.mock('@/queues', () => ({ enqueuePracticeEmail: jest.fn() }));
import { randomUUID } from 'node:crypto';
import { prisma } from '../database/prisma.service';
import { cohortService } from '../cohort.service';
import { organizationTemplateService } from '../organization-template.service';
import { ensureCohortDrafts } from '../cohort-draft.service';
import { updateCohortSchema } from '../../validators/cohort.validators';

/**
 * daodao#544：學員不能自行改場次實踐期間，帶領人改場次或綁定開始日時，尚未開始的學員實踐要跟著改；已開始的不動。
 * Run only through `pnpm test:local -- --config jest.pg.config.js <this file>` (disposable PostgreSQL).
 */
describe('rescheduling an unstarted Lighthouse cohort moves learner practice dates (#544)', () => {
  let owner: number, learner: number, org: number;
  const prefix = `resched544_${randomUUID()}`;
  const offset = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const dateOnly = (value: Date | null) => value?.toISOString().slice(0, 10) ?? null;

  const learnerPractice = async (cohortId: number) => {
    const row = await prisma.practices.findFirstOrThrow({ where: { cohort_id: cohortId, user_id: learner, deleted_at: null } });
    return { start: dateOnly(row.start_date), end: dateOnly(row.end_date), days: row.duration_days, status: row.status };
  };

  const setup = async (kind: 'lighthouse' | 'challenge', startOffset: number) => {
    const program = await prisma.programs.create({ data: { organization_id: org, name: `${prefix}_${kind}`, kind } });
    const cohort = await prisma.cohorts.create({ data: { program_id: program.id, slug: randomUUID(), display_name: prefix, start_date: new Date(`${offset(startOffset)}T00:00:00.000Z`), end_date: new Date(`${offset(startOffset + 60)}T00:00:00.000Z`) } });
    const template = await prisma.practice_templates.create({ data: { organization_id: org, title: prefix.slice(0, 20), practice_action: '閱讀', practice_time_periods: [], duration_days: 14, status: 'ready' } });
    await prisma.cohort_templates.create({ data: { cohort_id: cohort.id, template_id: template.id } });
    await prisma.$transaction(tx => ensureCohortDrafts(tx, cohort.id, learner));
    return { programId: program.id, cohortId: cohort.id, templateId: template.id };
  };

  const reschedule = (programId: number, cohortId: number, startDate: string) =>
    cohortService.update(programId, cohortId, updateCohortSchema.parse({ startDate }), owner);

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (url.hostname !== '127.0.0.1' || url.pathname !== '/daodao_test') throw new Error('Only the disposable test:local PostgreSQL may run these tests');
    const role = await prisma.roles.findFirstOrThrow();
    const users = await Promise.all([0, 1].map(i => prisma.users.create({ data: { mongo_id: `${prefix}_${i}`, nickname: `${prefix}_${i}`, role_id: role.id, tag_list: [] } })));
    [owner, learner] = users.map(row => row.id);
    org = (await prisma.organization.create({ data: { name: prefix, status: 'active' } })).id;
    await prisma.organization_members.create({ data: { organization_id: org, user_id: owner, role: 'owner' } });
  });

  afterAll(async () => { await prisma.$disconnect(); });

  it('moves the learner draft start and end when the coach moves the cohort start before it begins', async () => {
    const { programId, cohortId } = await setup('lighthouse', 10);
    await reschedule(programId, cohortId, offset(20));
    expect(await learnerPractice(cohortId)).toEqual({ start: offset(20), end: offset(33), days: 14, status: 'draft' });
  });

  it('lets the learner check in from the new start date when the coach moves the cohort start to today', async () => {
    const { programId, cohortId } = await setup('lighthouse', 10);
    await reschedule(programId, cohortId, offset(0));
    expect((await learnerPractice(cohortId)).start).toBe(offset(0));
  });

  it('follows a template-specific start date set on the binding instead of the cohort start', async () => {
    const { cohortId, templateId } = await setup('lighthouse', 10);
    await organizationTemplateService.bind(org, templateId, cohortId, owner, true, { startDate: offset(15) });
    expect((await learnerPractice(cohortId)).start).toBe(offset(15));
  });

  it('leaves practices with check-ins, and non-Lighthouse cohorts, on their original dates', async () => {
    const lighthouse = await setup('lighthouse', 10);
    const practice = await prisma.practices.findFirstOrThrow({ where: { cohort_id: lighthouse.cohortId, user_id: learner } });
    await prisma.practice_checkins.create({ data: { practice_id: practice.id, user_id: learner, checkin_date: new Date(), image_urls: [] } });
    await reschedule(lighthouse.programId, lighthouse.cohortId, offset(20));
    expect((await learnerPractice(lighthouse.cohortId)).start).toBe(offset(10));

    const challenge = await setup('challenge', 10);
    await reschedule(challenge.programId, challenge.cohortId, offset(20));
    expect((await learnerPractice(challenge.cohortId)).start).toBe(offset(10));
  });
});
