import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { assertCohortPracticeUpdatable, assertLighthouseCheckinAllowed } from '@/services/cohort-acl.service';
import { BadRequestError, ConflictError } from '@/middleware/error.middleware';

/** daodao#544：燈塔場次實踐的期間由場次設定，學員不可改開始日、天數，開始日前不可打卡 */
const practice = (kind: 'lighthouse' | 'challenge' | null) => ({
  start_date: new Date('2026-12-01T00:00:00.000Z'),
  duration_days: 14,
  cohort_id: kind ? 150 : null,
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

  it('rejects check-in before the cohort practice start date', () => {
    expect(() => assertLighthouseCheckinAllowed(true, start, new Date('2026-11-30T00:00:00.000Z'))).toThrow(ConflictError);
  });

  it('allows check-in from the start date', () => {
    expect(() => assertLighthouseCheckinAllowed(true, start, start)).not.toThrow();
  });

  it('keeps early check-in for non-Lighthouse practices', () => {
    expect(() => assertLighthouseCheckinAllowed(false, start, new Date('2026-11-30T00:00:00.000Z'))).not.toThrow();
  });
});
