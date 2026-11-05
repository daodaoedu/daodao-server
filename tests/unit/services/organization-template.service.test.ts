import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { organizationTemplateService } from '@/services/organization-template.service';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '@/middleware/error.middleware';

const template = { id: 5, external_id: '123e4567-e89b-12d3-a456-426614174000', organization_id: 3, title: '每日反思', practice_action: '寫一段反思', duration_days: 30, frequency_min_days: 1, frequency_max_days: 7, session_duration_minutes: 30, practice_time_periods: ['evening'], other_context: null, status: 'ready', archived_at: null, created_at: new Date('2026-07-22'), updated_at: null, cohort_templates: [], _count: { practices: 4 } };
const allow = () => prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
const futureDay = new Date(Date.now() + 30 * 86_400_000);
const pastDay = new Date(Date.now() - 30 * 86_400_000);

describe('organizationTemplateService', () => {
  beforeEach(() => { prismaMock.entity_tags.findMany.mockResolvedValue([] as never); });
  it('creates a template scoped to the organization', async () => {
    allow(); prismaMock.practice_templates.create.mockResolvedValue(template as never); prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
    const result = await organizationTemplateService.create(3, 42, { title: '每日反思', practiceAction: '寫一段反思', durationDays: 30, frequencyMinDays: 1, frequencyMaxDays: 7, sessionDurationMinutes: 30, practiceTimePeriods: ['evening'], status: 'ready' });
    expect(result.organizationId).toBe(3);
    expect(result.generatedDraftCount).toBe(4);
    expect(result.resources).toEqual([]);
    expect(prismaMock.practice_templates.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organization_id: 3 }) }));
  });

  it('stores template resources through the entity_resources relation', async () => {
    allow(); prismaMock.practice_templates.create.mockResolvedValue(template as never);
    prismaMock.entity_resources.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.resources.create.mockResolvedValue({ id: 77, external_id: '223e4567-e89b-12d3-a456-426614174000', name: '反思提示卡', url: 'https://example.com/card' } as never);
    prismaMock.entity_resources.create.mockResolvedValue({ id: 1 } as never);
    // 第一次 findMany 是 replaceResources 的比對（新模板尚無資源），第二次才是讀回結果
    prismaMock.entity_resources.findMany
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ entity_id: 5, dayNumber: 3, resources: { id: 77, external_id: '223e4567-e89b-12d3-a456-426614174000', name: '反思提示卡', url: 'https://example.com/card' } }] as never);
    const result = await organizationTemplateService.create(3, 42, { title: '每日反思', practiceTimePeriods: ['evening'], status: 'draft', resources: [{ name: '反思提示卡', url: 'https://example.com/card', dayNumber: 3 }] });
    expect(prismaMock.entity_resources.create).toHaveBeenCalledWith({ data: { resource_id: 77, entity_type: 'practice_template', entity_id: 5, created_by: 42, dayNumber: 3 } });
    expect(result.resources).toEqual([{ id: '223e4567-e89b-12d3-a456-426614174000', name: '反思提示卡', url: 'https://example.com/card', dayNumber: 3 }]);
  });
  it('skips rewriting resources when the incoming set matches what is stored', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never);
    prismaMock.practice_templates.update.mockResolvedValue(template as never);
    prismaMock.entity_resources.findMany
      .mockResolvedValueOnce([{ dayNumber: 3, resources: { name: '反思提示卡', url: 'https://example.com/card' } }] as never)
      .mockResolvedValueOnce([] as never);
    await organizationTemplateService.update(3, 5, 42, { title: '換個標題', resources: [{ name: '反思提示卡', url: 'https://example.com/card', dayNumber: 3 }] });
    expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.resources.create).not.toHaveBeenCalled();
  });

  it('rewrites resources when only the assigned day changes', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never);
    prismaMock.practice_templates.update.mockResolvedValue(template as never);
    prismaMock.entity_resources.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.resources.create.mockResolvedValue({ id: 79, external_id: '423e4567-e89b-12d3-a456-426614174000', name: '反思提示卡', url: 'https://example.com/card' } as never);
    prismaMock.entity_resources.create.mockResolvedValue({ id: 3 } as never);
    prismaMock.entity_resources.findMany
      .mockResolvedValueOnce([{ dayNumber: 3, resources: { name: '反思提示卡', url: 'https://example.com/card' } }] as never)
      .mockResolvedValueOnce([] as never);
    await organizationTemplateService.update(3, 5, 42, { resources: [{ name: '反思提示卡', url: 'https://example.com/card', dayNumber: 5 }] });
    expect(prismaMock.entity_resources.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ dayNumber: 5 }) }));
  });

  it('rewrites resources when the set actually differs', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never);
    prismaMock.practice_templates.update.mockResolvedValue(template as never);
    prismaMock.entity_resources.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.resources.create.mockResolvedValue({ id: 78, external_id: '323e4567-e89b-12d3-a456-426614174000', name: '新資源', url: '' } as never);
    prismaMock.entity_resources.create.mockResolvedValue({ id: 2 } as never);
    prismaMock.entity_resources.findMany
      .mockResolvedValueOnce([{ resources: { name: '反思提示卡', url: 'https://example.com/card' } }] as never)
      .mockResolvedValueOnce([] as never);
    await organizationTemplateService.update(3, 5, 42, { resources: [{ name: '新資源' }] });
    expect(prismaMock.entity_resources.updateMany).toHaveBeenCalled();
    expect(prismaMock.resources.create).toHaveBeenCalled();
  });

  it('binds only when template and cohort belong to the same organization', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5, archived_at: null } as never); prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, status: 'draft', start_date: futureDay } as never); prismaMock.cohort_templates.upsert.mockResolvedValue({ start_date: null } as never);
    await expect(organizationTemplateService.bind(3, 5, 8, 42, true)).resolves.toEqual({ templateId: 5, cohortId: 8, bound: true, startDate: null });
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 8, deleted_at: null, program: expect.objectContaining({ organization_id: 3, archived_at: null, deleted_at: null }) }) }));
  });

  it('stores the start date supplied when the template is assigned to a cohort', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5, archived_at: null } as never); prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, status: 'draft', start_date: futureDay } as never);
    prismaMock.cohort_templates.upsert.mockResolvedValue({ start_date: new Date('2026-08-03T00:00:00.000Z') } as never);
    await expect(organizationTemplateService.bind(3, 5, 8, 42, true, { startDate: '2026-08-03' }))
      .resolves.toEqual({ templateId: 5, cohortId: 8, bound: true, startDate: new Date('2026-08-03T00:00:00.000Z') });
    expect(prismaMock.cohort_templates.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: { cohort_id: 8, template_id: 5, start_date: new Date('2026-08-03T00:00:00.000Z') },
      update: expect.objectContaining({ start_date: new Date('2026-08-03T00:00:00.000Z') })
    }));
  });

  it('leaves an existing start date untouched when the caller omits it', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5, archived_at: null } as never); prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, status: 'draft', start_date: futureDay } as never);
    prismaMock.cohort_templates.upsert.mockResolvedValue({ start_date: new Date('2026-08-03T00:00:00.000Z') } as never);
    await organizationTemplateService.bind(3, 5, 8, 42, true);
    const update = prismaMock.cohort_templates.upsert.mock.calls[0]?.[0]?.update as Record<string, unknown>;
    expect(update).not.toHaveProperty('start_date');
  });
  it('records unbound_at and rejects a missing active binding', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5, archived_at: null } as never); prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, status: 'draft', start_date: futureDay } as never); prismaMock.cohort_templates.updateMany.mockResolvedValue({ count: 0 });
    await expect(organizationTemplateService.bind(3, 5, 8, 42, false)).rejects.toBeInstanceOf(NotFoundError);
  });
  it('refuses to delete a template that still has active bindings', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never); prismaMock.cohort_templates.count.mockResolvedValue(1);
    await expect(organizationTemplateService.remove(3, 5, 42)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.practice_templates.update).not.toHaveBeenCalled();
  });

  it('soft-deletes instead of removing the row so binding history and generated practices keep their template_id', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never); prismaMock.cohort_templates.count.mockResolvedValue(0);
    prismaMock.practice_templates.update.mockResolvedValue(template as never);
    await organizationTemplateService.remove(3, 5, 42);
    expect(prismaMock.practice_templates.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 5 }, data: expect.objectContaining({ deleted_at: expect.any(Date) }) }));
    expect(prismaMock.practice_templates.deleteMany).not.toHaveBeenCalled();
  });

  it('lists only visible templates, newest touched first, and searches name / action / tags / resources', async () => {
    allow();
    prismaMock.practice_templates.findMany.mockResolvedValue([
      { ...template, id: 1, title: '每日反思', updated_at: new Date('2026-08-01') },
      { ...template, id: 2, title: '晨跑', practice_action: '跑 3 公里', updated_at: new Date('2026-09-01') },
      { ...template, id: 3, title: '閱讀', practice_action: '讀 10 頁', updated_at: null, created_at: new Date('2026-08-15') }
    ] as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([{ entity_id: 3, note: null, resources: { id: 9, external_id: null, name: '書單', url: 'https://example.com/books' } }] as never);
    prismaMock.entity_tags.findMany.mockResolvedValue([{ entity_id: 1, tags: { name: '反思' } }] as never);
    const all = await organizationTemplateService.list(3, 42);
    expect(prismaMock.practice_templates.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organization_id: 3, archived_at: null, deleted_at: null } }));
    expect(all.map(item => item.id)).toEqual([2, 3, 1]);
    expect((await organizationTemplateService.list(3, 42, { q: '公里' })).map(item => item.id)).toEqual([2]);
    expect((await organizationTemplateService.list(3, 42, { q: 'BOOKS' })).map(item => item.id)).toEqual([3]);
    expect((await organizationTemplateService.list(3, 42, { q: '反思' })).map(item => item.id)).toEqual([1]);
  });

  it('derives the title from the practice action when a draft omits it', async () => {
    allow(); prismaMock.practice_templates.create.mockResolvedValue(template as never); prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
    await organizationTemplateService.create(3, 42, { practiceAction: '每天寫下三件感謝的事，並記錄當下的心情與想法', practiceTimePeriods: [], status: 'draft' });
    expect(prismaMock.practice_templates.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: '每天寫下三件感謝的事，並記錄當下的心情與想法'.slice(0, 20), status: 'draft' }) }));
  });

  it('rejects promoting a draft to ready while required fields are still empty', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ ...template, status: 'draft', practice_action: null, duration_days: null } as never);
    await expect(organizationTemplateService.update(3, 5, 42, { status: 'ready' })).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(prismaMock.practice_templates.update).not.toHaveBeenCalled();
  });

  it('rejects duplicate resource URLs after normalisation', async () => {
    allow();
    await expect(organizationTemplateService.create(3, 42, { title: 'x', practiceTimePeriods: [], status: 'draft', resources: [{ name: 'A', url: 'https://Example.com/card/' }, { name: 'B', url: 'https://example.com/card' }] })).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(prismaMock.practice_templates.create).not.toHaveBeenCalled();
  });

  it('duplicates with a unique「（複製）」title and copies resources and tags', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never);
    prismaMock.practice_templates.findMany.mockResolvedValue([{ title: '每日反思' }, { title: '每日反思（複製）' }] as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([{ entity_id: 5, note: null, resources: { id: 9, external_id: null, name: '卡片', url: 'https://example.com/card' } }] as never);
    prismaMock.entity_tags.findMany.mockResolvedValue([{ entity_id: 5, tags: { name: '反思' } }] as never);
    prismaMock.practice_templates.create.mockResolvedValue({ ...template, id: 6, title: '每日反思（複製） 2' } as never);
    prismaMock.entity_resources.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.resources.create.mockResolvedValue({ id: 10 } as never);
    prismaMock.entity_resources.create.mockResolvedValue({ id: 1 } as never);
    prismaMock.entity_tags.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.tags.upsert.mockResolvedValue({ id: 3, name: '反思' } as never);
    prismaMock.entity_tags.create.mockResolvedValue({ id: 1 } as never);
    const copy = await organizationTemplateService.duplicate(3, 5, 42);
    expect(prismaMock.practice_templates.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: '每日反思（複製） 2', practice_action: '寫一段反思' }) }));
    expect(prismaMock.entity_tags.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entity_id: 6, tag_id: 3 }) }));
    expect(copy.id).toBe(6);
  });

  it('archives once and refuses to archive an already archived template', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never);
    prismaMock.practice_templates.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.practice_templates.findUniqueOrThrow.mockResolvedValue({ ...template, archived_at: new Date() } as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
    const archived = await organizationTemplateService.archive(3, 5, 42);
    expect(archived.archivedAt).toBeInstanceOf(Date);
    expect(prismaMock.practice_templates.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 5, archived_at: null, deleted_at: null }, data: expect.objectContaining({ archived_at: expect.any(Date), archived_by: 42 }) }));
    prismaMock.practice_templates.findFirst.mockResolvedValue({ ...template, archived_at: new Date() } as never);
    await expect(organizationTemplateService.archive(3, 5, 42)).rejects.toBeInstanceOf(ConflictError);
    await expect(organizationTemplateService.update(3, 5, 42, { title: '改名' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns 409 and writes no audit when a concurrent archive already won the race', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue(template as never);
    prismaMock.practice_templates.updateMany.mockResolvedValue({ count: 0 });
    await expect(organizationTemplateService.archive(3, 5, 42)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.practice_templates.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it('restores through a conditional update and returns 409 when the row is no longer archived', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ ...template, archived_at: new Date() } as never);
    prismaMock.practice_templates.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.practice_templates.findUniqueOrThrow.mockResolvedValue(template as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
    const restored = await organizationTemplateService.restore(3, 5, 42);
    expect(restored.archivedAt).toBeNull();
    expect(prismaMock.practice_templates.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 5, archived_at: { not: null }, deleted_at: null }, data: expect.objectContaining({ archived_at: null, archived_by: null }) }));
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    prismaMock.$executeRaw.mockClear();
    prismaMock.practice_templates.updateMany.mockResolvedValue({ count: 0 });
    await expect(organizationTemplateService.restore(3, 5, 42)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it('locks bindings once the cohort has started', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5, archived_at: null } as never);
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8, status: 'published', start_date: pastDay } as never);
    await expect(organizationTemplateService.bind(3, 5, 8, 42, false)).rejects.toBeInstanceOf(ConflictError);
    await expect(organizationTemplateService.bind(3, 5, 8, 42, true, { startDate: '2026-10-01' })).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.cohort_templates.upsert).not.toHaveBeenCalled();
    expect(prismaMock.cohort_templates.updateMany).not.toHaveBeenCalled();
  });

  it('marks bindings to started cohorts as locked and computes the end date from duration', async () => {
    allow();
    prismaMock.practice_templates.findMany.mockResolvedValue([{ ...template, duration_days: 7, cohort_templates: [
      { cohort_id: 8, start_date: new Date('2026-10-01T00:00:00.000Z'), cohort: { display_name: '秋季', status: 'published', start_date: futureDay } },
      { cohort_id: 9, start_date: null, cohort: { display_name: '春季', status: 'published', start_date: pastDay } }
    ] }] as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
    const [item] = await organizationTemplateService.list(3, 42);
    expect(item.bindings[0]).toEqual(expect.objectContaining({ cohortId: 8, cohortName: '秋季', locked: false, endDate: new Date('2026-10-07T00:00:00.000Z') }));
    expect(item.bindings[1]).toEqual(expect.objectContaining({ cohortId: 9, locked: true, startDate: null }));
  });
});
