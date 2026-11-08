const mockTemplateDb = {
  organization_members: {
    findUnique: jest.fn<Promise<{ organization: { status: string } }>, []>(),
  },
  practice_templates: {
    findFirst: jest.fn<Promise<Record<string, unknown>>, []>(),
    update: jest.fn<Promise<Record<string, unknown>>, [{ data: Record<string, unknown> }]>(),
  },
  entity_resources: { findMany: jest.fn<Promise<unknown[]>, []>() },
  entity_tags: { findMany: jest.fn<Promise<unknown[]>, []>() },
  practices: { updateMany: jest.fn<Promise<{ count: number }>, []>() },
};

jest.mock('@/services/database/prisma.service', () => ({ prisma: mockTemplateDb }));

import { organizationTemplateService } from '../organization-template.service';
import { updateOrganizationTemplateSchema } from '../../validators/organization-template.validators';

describe('organization template validated partial updates', () => {
  let saved: Record<string, unknown>;

  beforeEach(() => {
    saved = {
      id: 5,
      external_id: '123e4567-e89b-12d3-a456-426614174000',
      organization_id: 3,
      title: '每日閱讀',
      practice_action: '閱讀十分鐘',
      duration_days: 21,
      frequency_min_days: 3,
      frequency_max_days: 5,
      session_duration_minutes: 30,
      practice_time_periods: ['morning', 'evening'],
      other_context: null,
      status: 'draft',
      archived_at: null,
      created_at: new Date('2026-07-22T00:00:00Z'),
      updated_at: null,
      cohort_templates: [],
      _count: { practices: 0 },
    };
    mockTemplateDb.organization_members.findUnique.mockResolvedValue({
      organization: { status: 'active' },
    });
    mockTemplateDb.practice_templates.findFirst.mockImplementation(async () => saved);
    mockTemplateDb.practice_templates.update.mockImplementation(async ({ data }) => {
      saved = { ...saved, ...data };
      return saved;
    });
    mockTemplateDb.entity_resources.findMany.mockResolvedValue([]);
    mockTemplateDb.entity_tags.findMany.mockResolvedValue([]);
    mockTemplateDb.practices.updateMany.mockResolvedValue({ count: 0 });
  });

  it('renames a draft without clearing its saved timing or publishing it', async () => {
    const result = await organizationTemplateService.update(
      3, 5, 42, updateOrganizationTemplateSchema.parse({ title: '新閱讀計畫 📚' })
    );

    expect(result.title).toBe('新閱讀計畫 📚');
    expect(result.practiceTimePeriods).toEqual(['morning', 'evening']);
    expect(result.status).toBe('draft');
    expect(saved.practice_time_periods).toEqual(['morning', 'evening']);
    expect(saved.status).toBe('draft');
  });

  it('can rename an incomplete draft without accidentally validating it as ready', async () => {
    saved.practice_action = null;
    saved.duration_days = null;

    const result = await organizationTemplateService.update(
      3, 5, 42, updateOrganizationTemplateSchema.parse({ title: '尚在規劃的閱讀計畫' })
    );

    expect(result.title).toBe('尚在規劃的閱讀計畫');
    expect(result.practiceTimePeriods).toEqual(['morning', 'evening']);
    expect(result.status).toBe('draft');
    expect(result.practiceAction).toBeNull();
  });

  it('clears timing only when an empty array is explicitly requested', async () => {
    const result = await organizationTemplateService.update(
      3, 5, 42, updateOrganizationTemplateSchema.parse({ practiceTimePeriods: [] })
    );

    expect(result.practiceTimePeriods).toEqual([]);
    expect(result.status).toBe('draft');
    expect(saved.practice_time_periods).toEqual([]);
    expect(saved.status).toBe('draft');
  });

  it('can explicitly publish a complete draft without clearing its saved timing', async () => {
    const result = await organizationTemplateService.update(
      3, 5, 42, updateOrganizationTemplateSchema.parse({ status: 'ready' })
    );

    expect(result.status).toBe('ready');
    expect(result.practiceTimePeriods).toEqual(['morning', 'evening']);
    expect(saved.status).toBe('ready');
    expect(saved.practice_time_periods).toEqual(['morning', 'evening']);
  });
});
