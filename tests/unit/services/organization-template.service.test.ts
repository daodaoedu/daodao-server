import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { organizationTemplateService } from '@/services/organization-template.service';
import { ConflictError, NotFoundError } from '@/middleware/error.middleware';

const template = { id: 5, external_id: '123e4567-e89b-12d3-a456-426614174000', organization_id: 3, title: '每日反思', practice_action: '寫一段反思', duration_days: 30, frequency_min_days: 1, frequency_max_days: 7, session_duration_minutes: 30, practice_time_periods: ['evening'], created_at: new Date('2026-07-22'), updated_at: null, cohort_templates: [], _count: { practices: 4 } };
const allow = () => prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);

describe('organizationTemplateService', () => {
  it('creates a template scoped to the organization', async () => {
    allow(); prismaMock.practice_templates.create.mockResolvedValue(template as never); prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
    const result = await organizationTemplateService.create(3, 42, { title: '每日反思', practiceAction: '寫一段反思', durationDays: 30, frequencyMinDays: 1, frequencyMaxDays: 7, sessionDurationMinutes: 30, practiceTimePeriods: ['evening'] });
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
    prismaMock.entity_resources.findMany.mockResolvedValue([{ entity_id: 5, resources: { id: 77, external_id: '223e4567-e89b-12d3-a456-426614174000', name: '反思提示卡', url: 'https://example.com/card' } }] as never);
    const result = await organizationTemplateService.create(3, 42, { title: '每日反思', practiceTimePeriods: ['evening'], resources: [{ name: '反思提示卡', url: 'https://example.com/card' }] });
    expect(prismaMock.entity_resources.create).toHaveBeenCalledWith({ data: { resource_id: 77, entity_type: 'practice_template', entity_id: 5, created_by: 42 } });
    expect(result.resources).toEqual([{ id: '223e4567-e89b-12d3-a456-426614174000', name: '反思提示卡', url: 'https://example.com/card' }]);
  });
  it('binds only when template and cohort belong to the same organization', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5 } as never); prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never); prismaMock.cohort_templates.upsert.mockResolvedValue({ id: 1 } as never);
    await expect(organizationTemplateService.bind(3, 5, 8, 42, true)).resolves.toEqual({ templateId: 5, cohortId: 8, bound: true });
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith({ where: { id: 8, program: { organization_id: 3 } }, select: { id: true } });
  });
  it('records unbound_at and rejects a missing active binding', async () => {
    allow(); prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 5 } as never); prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never); prismaMock.cohort_templates.updateMany.mockResolvedValue({ count: 0 });
    await expect(organizationTemplateService.bind(3, 5, 8, 42, false)).rejects.toBeInstanceOf(NotFoundError);
  });
  it('protects templates with binding history from hard deletion', async () => {
    allow(); prismaMock.cohort_templates.count.mockResolvedValue(1);
    await expect(organizationTemplateService.remove(3, 5, 42)).rejects.toBeInstanceOf(ConflictError);
  });
});
