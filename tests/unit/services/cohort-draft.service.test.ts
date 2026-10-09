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

  it('prefers the start date pinned on the binding over the cohort start date', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[0], start_date: new Date('2026-09-07T00:00:00Z') }
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ start_date: new Date('2026-09-07T00:00:00Z'), end_date: new Date('2026-10-06T00:00:00Z') })]
    }));
  });

  it('links template resources onto the generated drafts', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    prismaMock.entity_resources.findMany.mockResolvedValue([{ entity_id: 5, resource_id: 77, note: 'day:3' }] as never);
    prismaMock.practices.findMany.mockResolvedValue([{ id: 900, template_id: 5 }] as never);
    prismaMock.entity_resources.createMany.mockResolvedValue({ count: 1 });
    prismaMock.practices.updateMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.entity_resources.createMany).toHaveBeenCalledWith({
      data: [{ resource_id: 77, entity_type: 'practice', entity_id: 900, created_by: 42, note: 'day:3' }],
      skipDuplicates: true
    });
    expect(prismaMock.practices.updateMany).toHaveBeenCalledWith({ where: { id: { in: [900] } }, data: { has_resources: true } });
  });

  // daodao#295：共同挑戰加入後複製出的實踐不可是草稿（草稿不能打卡，FRD FR-CC-11 開始日即可打卡）
  it('uses the caller-provided initial status instead of draft', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, { status: 'not_started' });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ status: 'not_started', creation_source: 'cohort_template' })]
    }));
  });

  // daodao#295 AC-03：挑戰 2026-10-09 起 14 天、結束 2026-10-22，複製出的實踐結束日要同一天
  it('ends the copied practice on the same day as a 14-day challenge (start + duration - 1)', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({ start_date: new Date('2026-10-09T00:00:00Z') } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[0], practice_template: { ...bindings[0].practice_template, duration_days: 14 } }
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ start_date: new Date('2026-10-09T00:00:00Z'), end_date: new Date('2026-10-22T00:00:00Z') })]
    }));
  });

  it('does not issue a write when there are no active bindings', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([]);
    await expect(ensureCohortDrafts(prismaMock, 8, 42)).resolves.toBe(0);
    expect(prismaMock.practices.createMany).not.toHaveBeenCalled();
  });
});
