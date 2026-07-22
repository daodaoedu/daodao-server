import { prismaMock } from '@tests/utils/prisma-mock';
import { ensureCohortDrafts } from '@/services/cohort-draft.service';

describe('ensureCohortDrafts', () => {
  it('copies every active bound template into an idempotent cohort draft', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { template_id: 5, practice_template: { title: '每日反思', practice_action: '寫反思', duration_days: 30, frequency_min_days: 1, frequency_max_days: 7, session_duration_minutes: 15, practice_time_periods: ['evening'], other_context: null } },
      { template_id: 6, practice_template: { title: '晨間閱讀', practice_action: '閱讀', duration_days: 21, frequency_min_days: 1, frequency_max_days: 3, session_duration_minutes: 30, practice_time_periods: ['morning'], other_context: null } }
    ] as never);
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

  it('does not issue a write when there are no active bindings', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([]);
    await expect(ensureCohortDrafts(prismaMock, 8, 42)).resolves.toBe(0);
    expect(prismaMock.practices.createMany).not.toHaveBeenCalled();
  });
});

