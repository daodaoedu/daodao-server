import { prismaMock } from '@tests/utils/prisma-mock';
import { ensureCohortDrafts } from '@/services/cohort-draft.service';

const bindings = [
  { template_id: 5, practice_template: { title: '每日反思', practice_action: '寫反思', duration_days: 30, frequency_min_days: 1, frequency_max_days: 7, session_duration_minutes: 15, practice_time_periods: ['evening'], other_context: null } },
  { template_id: 6, practice_template: { title: '晨間閱讀', practice_action: '閱讀', duration_days: 21, frequency_min_days: 1, frequency_max_days: 3, session_duration_minutes: 30, practice_time_periods: ['morning'], other_context: null } }
];

describe('ensureCohortDrafts', () => {
  beforeEach(() => {
    prismaMock.cohorts.findUnique.mockResolvedValue({ start_date: new Date('2026-08-03T00:00:00Z') } as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
  });

  it('copies every active bound template into an idempotent cohort draft', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue(bindings as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 2 });
    const count = await ensureCohortDrafts(prismaMock, 8, 42);
    expect(count).toBe(2);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ user_id: 42, cohort_id: 8, template_id: 5, status: 'draft', creation_source: 'cohort_template' }),
        expect.objectContaining({ user_id: 42, cohort_id: 8, template_id: 6, status: 'draft', creation_source: 'cohort_template' })
      ]),
      skipDuplicates: true
    });
  });

  it('seeds the draft dates from the cohort so the start date is never blank', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ start_date: new Date('2026-08-03T00:00:00Z'), end_date: new Date('2026-09-01T00:00:00Z') })]
    }));
  });

  it('links template resources onto the generated drafts', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    prismaMock.entity_resources.findMany.mockResolvedValue([{ entity_id: 5, resource_id: 77 }] as never);
    prismaMock.practices.findMany.mockResolvedValue([{ id: 900, template_id: 5 }] as never);
    prismaMock.entity_resources.createMany.mockResolvedValue({ count: 1 });
    prismaMock.practices.updateMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.entity_resources.createMany).toHaveBeenCalledWith({
      data: [{ resource_id: 77, entity_type: 'practice', entity_id: 900, created_by: 42 }],
      skipDuplicates: true
    });
    expect(prismaMock.practices.updateMany).toHaveBeenCalledWith({ where: { id: { in: [900] } }, data: { has_resources: true } });
  });

  it('does not issue a write when there are no active bindings', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([]);
    await expect(ensureCohortDrafts(prismaMock, 8, 42)).resolves.toBe(0);
    expect(prismaMock.practices.createMany).not.toHaveBeenCalled();
  });
});
