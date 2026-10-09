import { prismaMock } from '@tests/utils/prisma-mock';
import { ensureCohortDrafts } from '@/services/cohort-draft.service';

const bindings = [
  {
    template_id: 5,
    practice_template: {
      title: '每日反思',
      practice_action: '寫反思',
      duration_days: 30,
      frequency_min_days: 1,
      frequency_max_days: 7,
      session_duration_minutes: 15,
      practice_time_periods: ['evening'],
      other_context: null,
    },
  },
  {
    template_id: 6,
    practice_template: {
      title: '晨間閱讀',
      practice_action: '閱讀',
      duration_days: 21,
      frequency_min_days: 1,
      frequency_max_days: 3,
      session_duration_minutes: 30,
      practice_time_periods: ['morning'],
      other_context: null,
    },
  },
];

describe('ensureCohortDrafts', () => {
  beforeEach(() => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-08-03T00:00:00Z'),
    } as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([] as never);
  });

  it('copies every active bound template into an idempotent cohort draft', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue(bindings as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 2 });
    const count = await ensureCohortDrafts(prismaMock, 8, 42);
    expect(count).toBe(2);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          user_id: 42,
          cohort_id: 8,
          template_id: 5,
          status: 'draft',
          creation_source: 'cohort_template',
        }),
        expect.objectContaining({
          user_id: 42,
          cohort_id: 8,
          template_id: 6,
          status: 'draft',
          creation_source: 'cohort_template',
        }),
      ]),
      skipDuplicates: true,
    });
  });

  it('seeds the draft dates from the cohort so the start date is never blank', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-08-03T00:00:00Z'),
            end_date: new Date('2026-09-01T00:00:00Z'),
          }),
        ],
      })
    );
  });

  it('prefers the start date pinned on the binding over the cohort start date', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[0], start_date: new Date('2026-09-07T00:00:00Z') },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-09-07T00:00:00Z'),
            end_date: new Date('2026-10-06T00:00:00Z'),
          }),
        ],
      })
    );
  });

  it('links template resources onto the generated drafts', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    prismaMock.entity_resources.findMany.mockResolvedValue([
      { entity_id: 5, resource_id: 77, note: 'day:3' },
    ] as never);
    prismaMock.practices.findMany.mockResolvedValue([{ id: 900, template_id: 5 }] as never);
    prismaMock.entity_resources.createMany.mockResolvedValue({ count: 1 });
    prismaMock.practices.updateMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.entity_resources.createMany).toHaveBeenCalledWith({
      data: [
        { resource_id: 77, entity_type: 'practice', entity_id: 900, created_by: 42, note: 'day:3' },
      ],
      skipDuplicates: true,
    });
    expect(prismaMock.practices.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [900] } },
      data: { has_resources: true },
    });
  });

  // daodao#295：共同挑戰加入後複製出的實踐不可是草稿（草稿不能打卡，FRD FR-CC-11 開始日即可打卡）
  it('uses the caller-provided initial status instead of draft', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, { status: 'not_started' });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({ status: 'not_started', creation_source: 'cohort_template' }),
        ],
      })
    );
  });

  // daodao#295 AC-03：挑戰 2026-10-09 起 14 天、結束 2026-10-22，複製出的實踐結束日要同一天
  it('ends the copied practice on the same day as a 14-day challenge (start + duration - 1)', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-09T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      {
        ...bindings[0],
        practice_template: { ...bindings[0].practice_template, duration_days: 14 },
      },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-09T00:00:00Z'),
            end_date: new Date('2026-10-22T00:00:00Z'),
          }),
        ],
      })
    );
  });

  // daodao#295 review：模板沒有 duration_days 時，複製出的實踐不可留 null end_date——
  // 共同挑戰的實踐直接是 not_started／active，completeExpiredPractices 會用 created_at + 14 天提早完成
  it('falls back to the cohort period when the template has no duration', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-09T00:00:00Z'),
      end_date: new Date('2026-11-27T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      {
        ...bindings[0],
        practice_template: { ...bindings[0].practice_template, duration_days: null },
      },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, { status: 'active' });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-09T00:00:00Z'),
            end_date: new Date('2026-11-27T00:00:00Z'),
            duration_days: 50,
            status: 'active',
          }),
        ],
      })
    );
  });

  it('keeps end_date null when a pinned start date falls after the cohort end (no negative period)', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-09T00:00:00Z'),
      end_date: new Date('2026-10-22T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      {
        ...bindings[0],
        start_date: new Date('2026-10-30T00:00:00Z'),
        practice_template: { ...bindings[0].practice_template, duration_days: null },
      },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-30T00:00:00Z'),
            end_date: null,
            duration_days: null,
          }),
        ],
      })
    );
  });

  // daodao#295 review 2：期間 > 90 天時回推的天數會違反 practices.duration_days CHECK（1–90），createMany 失敗
  it('keeps the cohort end date but leaves duration_days null when the inferred period exceeds 90 days', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-09T00:00:00Z'),
      end_date: new Date('2027-01-16T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      {
        ...bindings[0],
        practice_template: { ...bindings[0].practice_template, duration_days: null },
      },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, { status: 'active' });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-09T00:00:00Z'),
            end_date: new Date('2027-01-16T00:00:00Z'),
            duration_days: null,
          }),
        ],
      })
    );
  });

  it('still writes the inferred duration at exactly 90 days', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-09T00:00:00Z'),
      end_date: new Date('2027-01-06T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      {
        ...bindings[0],
        practice_template: { ...bindings[0].practice_template, duration_days: null },
      },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, { status: 'active' });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            end_date: new Date('2027-01-06T00:00:00Z'),
            duration_days: 90,
          }),
        ],
      })
    );
  });

  // daodao#295 review 2：綁定可釘選自己的開始日；本期進行中但該模板開始日在未來 → 該實踐應為未開始
  it('derives the status per binding from its effective start date when status is by_period', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-01T00:00:00Z'),
      end_date: new Date('2026-11-30T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      bindings[0],
      { ...bindings[1], start_date: new Date('2026-10-20T00:00:00Z') },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 2 });
    // 台灣 2026-10-10 中午
    await ensureCohortDrafts(prismaMock, 8, 42, {
      status: 'by_period',
      now: new Date('2026-10-10T04:00:00Z'),
    });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({ template_id: 5, status: 'active' }),
          expect.objectContaining({ template_id: 6, status: 'not_started' }),
        ],
      })
    );
  });

  it('by_period uses the Taipei calendar day: a binding starting today (UTC previous day 16:00) is active', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-20T00:00:00Z'),
      end_date: new Date('2026-11-30T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, {
      status: 'by_period',
      now: new Date('2026-10-19T16:00:00Z'),
    });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ status: 'active' })],
      })
    );
  });

  // daodao#295 review 3：共同挑戰（by_period）模板有天數但釘選開始日較晚時，結束日不可超出本期（FR-CC-03 固定時段）
  it('clamps a templated end date to the cohort end and recomputes the duration for challenges (by_period)', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-01T00:00:00Z'),
      end_date: new Date('2026-10-25T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[1], start_date: new Date('2026-10-20T00:00:00Z') },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, { status: 'by_period', now: new Date('2026-10-10T04:00:00Z') });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-20T00:00:00Z'),
            end_date: new Date('2026-10-25T00:00:00Z'),
            duration_days: 6,
          }),
        ],
      })
    );
  });

  it('keeps the templated period when it already ends within the cohort', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-01T00:00:00Z'),
      end_date: new Date('2026-10-21T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[1]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-01T00:00:00Z'),
            end_date: new Date('2026-10-21T00:00:00Z'),
            duration_days: 21,
          }),
        ],
      })
    );
  });

  // daodao#295 final check：燈塔場次（預設 draft）不截期間，要與 organizationTemplateService.map 給教練看的
  // 「開始日 + 天數 − 1」一致；30 天模板釘選 10-20、本期 10-25 結束 → 學員實踐仍是 10-20～11-18
  it('keeps start + duration - 1 for Lighthouse cohorts even past the cohort end (matches organizer view)', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-01T00:00:00Z'),
      end_date: new Date('2026-10-25T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[0], start_date: new Date('2026-10-20T00:00:00Z') },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-20T00:00:00Z'),
            end_date: new Date('2026-11-18T00:00:00Z'),
            duration_days: 30,
            status: 'draft',
          }),
        ],
      })
    );
  });

  it('keeps start + duration - 1 for Lighthouse cohorts when the pinned start is after the cohort end', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-01T00:00:00Z'),
      end_date: new Date('2026-10-21T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[1], start_date: new Date('2026-10-30T00:00:00Z') },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42);
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-30T00:00:00Z'),
            end_date: new Date('2026-11-19T00:00:00Z'),
            duration_days: 21,
          }),
        ],
      })
    );
  });

  it('leaves the period null for challenges when a templated binding starts after the cohort end', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-01T00:00:00Z'),
      end_date: new Date('2026-10-21T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[1], start_date: new Date('2026-10-30T00:00:00Z') },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, { status: 'by_period', now: new Date('2026-10-10T04:00:00Z') });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            start_date: new Date('2026-10-30T00:00:00Z'),
            end_date: null,
            duration_days: null,
          }),
        ],
      })
    );
  });

  // daodao#295 review 3：by_period 拿不到完整期間時不可給 not_started／active——
  // null end_date 的可打卡實踐會被 completeExpiredPractices 以 created_at + 14 天提早完成；保持草稿最安全
  it('keeps the practice as draft in by_period when no start date is known', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({ start_date: null, end_date: null } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([bindings[0]] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, {
      status: 'by_period',
      now: new Date('2026-10-10T04:00:00Z'),
    });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ start_date: null, end_date: null, status: 'draft' })],
      })
    );
  });

  it('keeps the practice as draft in by_period when the period could not be resolved (start after cohort end)', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({
      start_date: new Date('2026-10-01T00:00:00Z'),
      end_date: new Date('2026-10-21T00:00:00Z'),
    } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { ...bindings[1], start_date: new Date('2026-10-30T00:00:00Z') },
    ] as never);
    prismaMock.practices.createMany.mockResolvedValue({ count: 1 });
    await ensureCohortDrafts(prismaMock, 8, 42, {
      status: 'by_period',
      now: new Date('2026-10-10T04:00:00Z'),
    });
    expect(prismaMock.practices.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ end_date: null, status: 'draft' })],
      })
    );
  });

  it('does not issue a write when there are no active bindings', async () => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([]);
    await expect(ensureCohortDrafts(prismaMock, 8, 42)).resolves.toBe(0);
    expect(prismaMock.practices.createMany).not.toHaveBeenCalled();
  });
});
