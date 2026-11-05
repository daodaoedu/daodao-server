import { randomUUID } from 'node:crypto';
import { prisma } from '../database/prisma.service';
import userService from '../user.service';
import { commentService } from '../comment.service';

/** Exercise both real account-removal boundaries against the task-owned schema. */
describe('場次副本保留與資源作者刪帳', () => {
  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (url.hostname !== '127.0.0.1' || url.port !== '5601' || url.pathname !== '/daodao_401') throw new Error('Only the task-owned #401 DB is allowed');
  });
  afterAll(() => prisma.$disconnect());

  it.each(['self', 'admin'] as const)('%s deletion preserves anonymous snapshots and other learners; ordinary resources still cascade', async mode => {
    const key = randomUUID();
    const role = await prisma.roles.findFirstOrThrow();
    const author = await prisma.users.create({ data: { mongo_id: key, nickname: '待刪除作者', role_id: role.id, tag_list: [] } });
    const learner = await prisma.users.create({ data: { mongo_id: key + '-learner', nickname: '其他學員', role_id: role.id, tag_list: [] } });
    const organization = await prisma.organization.create({ data: { name: key, status: 'active' } });
    const program = await prisma.programs.create({ data: { organization_id: organization.id, name: key, kind: 'lighthouse' } });
    const cohort = await prisma.cohorts.create({ data: { program_id: program.id, slug: key, display_name: key, start_date: new Date(), end_date: new Date(Date.now() + 86400000) } });
    const template = await prisma.practice_templates.create({ data: { organization_id: organization.id, title: '作者刪帳', practice_action: '閱讀', practice_time_periods: [] } });
    const binding = await prisma.cohort_templates.create({ data: { cohort_id: cohort.id, template_id: template.id } });
    const original = await prisma.resources.create({ data: { created_by: author.id, name: '原模板', url: 'https://example.com/original', description: '', type: 'other', cost: 'free' } });
    const source = await prisma.entity_resources.create({ data: { created_by: author.id, resource_id: original.id, entity_type: 'practice_template', entity_id: template.id } });
    const ordinary = await prisma.resources.create({ data: { created_by: author.id, name: '個人資源', url: '', description: '', type: 'other', cost: 'free' } });
    const practice = await prisma.practices.create({ data: { user_id: learner.id, title: '其他學員的實踐', template_id: template.id, cohort_id: cohort.id, creation_source: 'cohort_template' } });
    const snapshots = [];
    for (const deleted of [false, true]) {
      const resource = await prisma.resources.create({ data: { created_by: author.id, name: '場次講義', url: 'http://example.com/course', description: '', type: 'other', cost: 'free' } });
      const snapshot = await prisma.cohort_template_resources.create({ data: { cohort_template_id: binding.id, resource_id: resource.id, source_template_relation_id: source.id, sort_order: deleted ? 1 : 0, deleted_at: deleted ? new Date() : null } });
      await prisma.entity_resources.create({ data: { created_by: learner.id, resource_id: resource.id, entity_type: 'practice', entity_id: practice.id, cohort_template_resource_id: snapshot.id } });
      const oldComment = await prisma.comments.create({ data: { target_type: 'resource', target_id: resource.id, user_id: learner.id, content: '不得公開的場次留言', visibility: 'public' } });
      await expect(commentService.getComments({ targetType: 'resource', targetId: resource.external_id ?? '' })).rejects.toMatchObject({ statusCode: 404 });
      await expect(commentService.getCommentDetail(oldComment.id)).rejects.toMatchObject({ statusCode: 404 });
      await expect(commentService.createComment({ targetType: 'resource', targetId: resource.external_id ?? '', content: '不應新增', userId: learner.id, visibility: 'public' })).rejects.toMatchObject({ statusCode: 404 });
      expect(await prisma.comments.count({ where: { target_type: 'resource', target_id: resource.id } })).toBe(1);
      snapshots.push(resource);
    }
    if (mode === 'self') await userService.deleteMe(author.external_id ?? '');
    else await userService.deleteUser(author.id);
    expect(await prisma.users.findUnique({ where: { id: author.id } })).toBeNull();
    expect(await prisma.resources.findUnique({ where: { id: ordinary.id } })).toBeNull();
    expect(await prisma.resources.findUnique({ where: { id: original.id } })).toBeNull();
    expect(await prisma.entity_resources.findUnique({ where: { id: source.id } })).toBeNull();
    for (const resource of snapshots) {
      const kept = await prisma.resources.findUniqueOrThrow({ where: { id: resource.id } });
      expect(kept.created_by).toBeNull();
      expect([kept.name, kept.url, kept.external_id]).toEqual([resource.name, resource.url, resource.external_id]);
      const snapshot = await prisma.cohort_template_resources.findUniqueOrThrow({ where: { resource_id: resource.id } });
      expect(snapshot.source_template_relation_id).toBeNull();
      expect(await prisma.entity_resources.count({ where: { cohort_template_resource_id: snapshot.id, entity_id: practice.id } })).toBe(1);
    }
  });
});
