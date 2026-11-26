/**
 * daodao#569：首頁 Your Day 依 cohort／實踐期限決定顯示與打卡入口，
 * /me/practices 每筆實踐需帶出所屬 cohort 的 id、起訖日與是否為共同挑戰。
 */
import { prismaMock } from '../../../tests/utils/prisma-mock';

jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../logging/logger.service', () => ({ loggerService: { error: jest.fn(), info: jest.fn(), debug: jest.fn(), warn: jest.fn() } }));
const mockFindUserPractices = jest.fn();
jest.mock('../practice.service', () => ({ findUserPractices: (...args: unknown[]) => mockFindUserPractices(...args) }));

import { meService } from '../me.service';
import type { MyPracticeItem } from '../../types/me.types';

const practice = (id: string): Record<string, unknown> => ({
  id,
  title: `實踐 ${id}`,
  startDate: '2026-11-20',
  endDate: '2026-11-22',
  status: 'active',
  checkInCount: 0,
  createdAt: '2026-11-01T00:00:00.000Z',
  tags: [],
  stats: { viewCount: 0, commentCount: 0 }
});

type CohortRow = { external_id: string; cohort_id: number; cohorts: { start_date: Date; end_date: Date; program: { kind: string } } };

/** 模擬 DB：只回傳 where.external_id.in 內、且有 cohort 的實踐 */
const givenCohortRows = (rows: CohortRow[]): void => {
  prismaMock.practices.findMany.mockImplementation((async (args: { where: { external_id: { in: string[] } } }): Promise<CohortRow[]> =>
    rows.filter(row => args.where.external_id.in.includes(row.external_id))) as never);
};

const listMyPractices = async (ids: string[]): Promise<Record<string, MyPracticeItem>> => {
  mockFindUserPractices.mockResolvedValue({ success: true, data: ids.map(practice), pagination: { totalItems: ids.length } });
  const res = await meService.getMyPractices(7, { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' } as never);
  return Object.fromEntries(res.data.map(item => [item.id, item]));
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getMyPractices cohort fields (daodao#569)', () => {
  it('returns the lighthouse cohort window, independent of the practice own dates', async () => {
    givenCohortRows([{
      external_id: 'lh',
      cohort_id: 12,
      cohorts: { start_date: new Date('2026-11-01T00:00:00.000Z'), end_date: new Date('2026-11-30T00:00:00.000Z'), program: { kind: 'lighthouse' } }
    }]);

    const { lh } = await listMyPractices(['lh']);

    expect(lh).toMatchObject({ cohortId: 12, cohortStartDate: '2026-11-01', cohortEndDate: '2026-11-30', isChallenge: false });
    expect(lh).toMatchObject({ startDate: '2026-11-20', endDate: '2026-11-22' });
  });

  it('marks challenge cohort practices as challenges', async () => {
    givenCohortRows([{
      external_id: 'ch',
      cohort_id: 30,
      cohorts: { start_date: new Date('2026-11-10T00:00:00.000Z'), end_date: new Date('2026-12-10T00:00:00.000Z'), program: { kind: 'challenge' } }
    }]);

    const { ch } = await listMyPractices(['ch']);

    expect(ch).toMatchObject({ cohortId: 30, isChallenge: true });
  });

  it('returns null cohort fields for personal practices in the same page', async () => {
    givenCohortRows([{
      external_id: 'lh',
      cohort_id: 12,
      cohorts: { start_date: new Date('2026-11-01T00:00:00.000Z'), end_date: new Date('2026-11-30T00:00:00.000Z'), program: { kind: 'lighthouse' } }
    }]);

    const { mine, lh } = await listMyPractices(['mine', 'lh']);

    expect(mine).toMatchObject({ cohortId: null, cohortStartDate: null, cohortEndDate: null, isChallenge: false });
    expect(lh.cohortId).toBe(12);
  });

  it('keeps legacy practices without external id and only looks up the user own ids', async () => {
    givenCohortRows([]);

    const result = await listMyPractices(['', 'mine']);

    expect(result['']).toMatchObject({ cohortId: null, isChallenge: false });
    expect(prismaMock.practices.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ user_id: 7, external_id: { in: ['mine'] } })
    }));
  });

  it('skips the cohort lookup when the user has no practices', async () => {
    const result = await listMyPractices([]);

    expect(result).toEqual({});
    expect(prismaMock.practices.findMany).not.toHaveBeenCalled();
  });
});
