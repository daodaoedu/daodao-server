jest.mock('@/queues', () => ({ enqueuePracticeEmail: jest.fn() }));
import { randomUUID } from 'node:crypto';
import { prisma } from '../database/prisma.service';
import { getTargetEntity } from '../id-converter.service';
import { getResourceById, getResources } from '../resource.service';
import { getReviewById, getReviews, createReview } from '../resource-review.service';

describe('private cohort snapshot generic resource exclusion (#401)', () => {
  const prefix = `privacy401_${randomUUID()}`;
  let userId: number, binding: number;
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (url.hostname !== '127.0.0.1' || url.port !== '5601' || url.pathname !== '/daodao_401') throw new Error('Only task-owned #401 PostgreSQL allowed');
    const role = await prisma.roles.findFirstOrThrow();
    userId = (await prisma.users.create({ data: { mongo_id: prefix, nickname: prefix, role_id: role.id, tag_list: [] } })).id;
    const org = await prisma.organization.create({ data: { name: prefix, status: 'active' } });
    const program = await prisma.programs.create({ data: { organization_id: org.id, name: prefix, kind: 'lighthouse' } });
    const cohort = await prisma.cohorts.create({ data: { program_id: program.id, slug: randomUUID(), display_name: prefix, start_date: new Date(), end_date: new Date(Date.now() + 86400000) } });
    const template = await prisma.practice_templates.create({ data: { organization_id: org.id, title: prefix.slice(0, 20), practice_action: '閱讀', practice_time_periods: [] } });
    binding = (await prisma.cohort_templates.create({ data: { cohort_id: cohort.id, template_id: template.id } })).id;
  });
  afterAll(async () => prisma.$disconnect());
  test.each([false, true])('snapshot with deleted provenance=%s stays hidden while ordinary resource is public', async deleted => {
    const create = (suffix: string) => prisma.resources.create({ data: { created_by: userId, name: `${prefix}_${suffix}`, url: 'https://example.com/private', description: '', type: 'other', cost: 'free', status: 'active' } });
    const ordinary = await create('ordinary');
    const snapshot = await create('snapshot');
    await prisma.cohort_template_resources.create({ data: { cohort_template_id: binding, resource_id: snapshot.id, sort_order: 0, deleted_at: deleted ? new Date() : null } });
    const review = await prisma.resource_review.create({ data: { resource_id: snapshot.id, user_id: userId, content: 'private marker', status: 'published', score_impact: 1, score_mindset: 1, score_problems: 1, score_perspectives: 1, score_goals: 1 } });
    await expect(getResourceById(snapshot.external_id!)).rejects.toThrow('資源不存在');
    await expect(getTargetEntity('resource', snapshot.external_id!)).rejects.toThrow();
    await expect(getResourceById(ordinary.external_id!)).resolves.toMatchObject({ data: { name: ordinary.name } });
    const listing = await getResources({ query: prefix }, {});
    expect(listing.data.map(row => row.id)).toContain(ordinary.external_id);
    expect(listing.data.map(row => row.id)).not.toContain(snapshot.external_id);
    await expect(getReviewById(review.id)).rejects.toThrow('找不到');
    await expect(getReviews({ resourceId: snapshot.external_id! })).rejects.toThrow('找不到');
    const reviews = await getReviews({ userId });
    expect(reviews.data.map(row => row.id)).not.toContain(review.id);
    await expect(createReview(snapshot.external_id!, {} as never, userId)).rejects.toThrow('找不到');
    await prisma.resources.update({ where: { id: ordinary.id }, data: { created_by: null } });
    await expect(getResourceById(ordinary.external_id!)).rejects.toThrow('資源不存在');
    expect((await getResources({ query: prefix }, {})).data.map(row => row.id)).not.toContain(ordinary.external_id);
    await prisma.resources.update({ where: { id: snapshot.id }, data: { created_by: null } });
    await expect(getResourceById(snapshot.external_id!)).rejects.toThrow('資源不存在');
    await expect(getTargetEntity('resource', snapshot.external_id!)).rejects.toThrow();
  });
});
