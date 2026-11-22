import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { assertCohortPracticeUpdatable, assertLighthouseCheckinAllowed } from '@/services/cohort-acl.service';
import { BadRequestError, ConflictError } from '@/middleware/error.middleware';
import { today } from '@/services/cohort-run-state';

/** daodao#544：燈塔場次實踐的期間由場次設定，學員不可改開始日、天數，開始日前不可打卡 */
const practice = (kind: 'lighthouse' | 'challenge' | null, creationSource: string | null = 'cohort_template') => ({
  start_date: new Date('2026-12-01T00:00:00.000Z'),
  duration_days: 14,
  cohort_id: kind ? 150 : null,
  template_id: kind ? 93 : null,
  creation_source: kind ? creationSource : null,
  cohorts: kind ? { program: { kind } } : null
});

describe('assertCohortPracticeUpdatable — Lighthouse schedule lock (#544)', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    [{ startDate: '2026-11-20' }],
    [{ durationDays: 30 }],
    [{ startDate: '2026-12-01', durationDays: 7 }]
  ])('rejects a learner changing the schedule of a Lighthouse cohort practice: %j', async data => {
    prismaMock.practices.findUnique.mockResolvedValue(practice('lighthouse') as never);
    await expect(assertCohortPracticeUpdatable(1, data)).rejects.toThrow(BadRequestError);
  });

  it('accepts unchanged schedule values so a full-form save of other fields still works', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(practice('lighthouse') as never);
    await expect(assertCohortPracticeUpdatable(1, { startDate: '2026-12-01', durationDays: 14, title: '新名稱' })).resolves.toBeUndefined();
  });

  it.each(['challenge', null] as const)('leaves %s practices to their own rules', async kind => {
    prismaMock.practices.findUnique.mockResolvedValue(practice(kind) as never);
    await expect(assertCohortPracticeUpdatable(1, { startDate: '2026-11-20', durationDays: 30 })).resolves.toBeUndefined();
  });

  it('does not lock the schedule of a Lighthouse cohort practice that was not assigned from a template', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(practice('lighthouse', null) as never);
    await expect(assertCohortPracticeUpdatable(1, { startDate: '2026-11-20', durationDays: 30 })).resolves.toBeUndefined();
  });

  it('still rejects Lighthouse privacy changes', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(practice('lighthouse') as never);
    await expect(assertCohortPracticeUpdatable(1, { privacyStatus: 'public' })).rejects.toThrow(BadRequestError);
  });

  it('does not query when no locked field is sent', async () => {
    await expect(assertCohortPracticeUpdatable(1, { title: 'x' })).resolves.toBeUndefined();
    expect(prismaMock.practices.findUnique).not.toHaveBeenCalled();
  });
});

describe('assertLighthouseCheckinAllowed (#544)', () => {
  const start = new Date('2026-12-01T00:00:00.000Z');

  it('rejects check-in on the Taipei day before the start date', () => {
    expect(() => assertLighthouseCheckinAllowed(true, start, '2026-11-30')).toThrow(ConflictError);
  });

  it('allows check-in on the start date in Taipei, including 00:00–08:00 when UTC is still the previous day', () => {
    expect(() => assertLighthouseCheckinAllowed(true, start, today(new Date('2026-11-30T17:30:00.000Z')))).not.toThrow();
  });

  it('keeps early check-in for practices outside the lock', () => {
    expect(() => assertLighthouseCheckinAllowed(false, start, '2026-11-30')).not.toThrow();
  });
});
