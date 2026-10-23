import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortDashboardService } from '@/services/cohort-dashboard.service';
import { ForbiddenError } from '@/middleware/error.middleware';

const now = new Date('2026-03-11T12:00:00Z');
const cohort = { id: 8, start_date: new Date('2026-02-10T00:00:00Z'), end_date: new Date('2026-05-24T00:00:00Z') };
const day = (value: string): Date => new Date(`${value}T00:00:00Z`);
const mockDashboardQueries = () => prismaMock.$queryRaw
  .mockResolvedValueOnce([{ enrolled: 24n }] as never)
  .mockResolvedValueOnce([{ activated: 19n, active_this_week: 12n, checkins: 270n }] as never)
  .mockResolvedValueOnce([{ title: '每天寫下一件小事', start_date: day('2026-02-10'), end_date: day('2026-03-11') }, { title: '每天讀 20 分鐘', start_date: null, end_date: null }] as never)
  .mockResolvedValueOnce([{ title: '每天寫下一件小事', start_date: day('2026-02-10'), end_date: day('2026-03-11'), started: 11n, checkins: 192n, active_days: 30n, participant_days: 126n, avg_length: 67.6 }] as never)
  .mockResolvedValueOnce([{ day: day('2026-03-10'), count: 4n }] as never)
  .mockResolvedValueOnce([{ tag: '語言學習', count: 8n }] as never)
  .mockResolvedValueOnce([{ mood: 'frustrated', count: 6n }, { mood: 'happy', count: 9n }] as never)
  .mockResolvedValueOnce([{ day: day('2026-03-11'), count: 5n }, { day: day('2026-03-04'), count: 2n }, { day: day('2026-02-26'), count: 7n }] as never)
  .mockResolvedValueOnce([{ hour: 21, count: 6n }] as never);

describe('cohortDashboardService.get', () => {
  beforeEach(() => {
    prismaMock.cohort_templates.findMany.mockResolvedValue([] as never);
  });

  // daodao#343：篩選與實踐總覽以場次「連結實踐模板」為準——沒有學員實踐的模板也要列出，日期用綁定設定（開始日＋模板天數）
  it('lists every linked template with the dates saved on the binding, even when no learner practice exists yet', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...cohort, start_date: day('2026-10-19'), end_date: day('2026-11-30') } as never);
    prismaMock.cohort_templates.findMany.mockResolvedValue([
      { start_date: day('2026-10-15'), practice_template: { title: '一個月準備 iPAS', duration_days: 14 } },
      { start_date: day('2026-10-21'), practice_template: { title: '共讀102', duration_days: 7 } },
      { start_date: null, practice_template: { title: '無天數模板', duration_days: null } }
    ] as never);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ enrolled: 1n }] as never)
      .mockResolvedValueOnce([{ activated: 1n, active_this_week: 1n, checkins: 2n }] as never)
      // 學員實踐只有「共讀102」（日期是舊的）＋一個自建實踐
      .mockResolvedValueOnce([{ title: '共讀102', start_date: day('2026-10-15'), end_date: day('2026-10-26') }, { title: '自己的實踐', start_date: day('2026-10-20'), end_date: day('2026-10-30') }] as never)
      .mockResolvedValueOnce([
        { title: '共讀102', start_date: day('2026-10-15'), end_date: day('2026-10-26'), started: 1n, checkins: 2n, active_days: 2n, participant_days: 2n, avg_length: 10 },
        { title: '自己的實踐', start_date: day('2026-10-20'), end_date: day('2026-10-30'), started: 0n, checkins: 0n, active_days: 0n, participant_days: 0n, avg_length: null }
      ] as never)
      .mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);
    const result = await cohortDashboardService.get(2, 8, 42, {}, new Date('2026-10-23T04:00:00Z'));
    expect(prismaMock.cohort_templates.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { cohort_id: 8, unbound_at: null } }));
    expect(result.practices).toEqual([
      { title: '一個月準備 iPAS', startDate: day('2026-10-15'), endDate: day('2026-10-28') },
      { title: '共讀102', startDate: day('2026-10-21'), endDate: day('2026-10-27') },
      { title: '無天數模板', startDate: day('2026-10-19'), endDate: null },
      { title: '自己的實踐', startDate: day('2026-10-20'), endDate: day('2026-10-30') }
    ]);
    expect(result.practiceOverview.map(row => [row.title, row.startDate, row.endDate, row.startedCount, row.checkinCount])).toEqual([
      ['一個月準備 iPAS', day('2026-10-15'), day('2026-10-28'), 0, 0],
      ['共讀102', day('2026-10-21'), day('2026-10-27'), 1, 2],
      ['無天數模板', day('2026-10-19'), null, 0, 0],
      ['自己的實踐', day('2026-10-20'), day('2026-10-30'), 0, 0]
    ]);
  });

  it('rejects a cohort outside the actor organizations', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(cohortDashboardService.get(2, 8, 42, {}, now)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('builds every dashboard block from realtime queries with the default range = cohort start → today', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    mockDashboardQueries();
    const result = await cohortDashboardService.get(2, 8, 42, {}, now);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(9);
    expect(result.range).toEqual({ from: '2026-02-10', to: '2026-03-11' });
    expect(result.practiceTitle).toBeNull();
    expect(result.kpi).toEqual({ enrolled: 24, activated: 19, activeThisWeek: 12 });
    expect(result.checkins).toBe(270);
    expect(result.practices).toEqual([expect.objectContaining({ title: '每天寫下一件小事' }), expect.objectContaining({ title: '每天讀 20 分鐘' })]);
    expect(result.practiceOverview).toEqual([expect.objectContaining({ title: '每天寫下一件小事', startedCount: 11, checkinCount: 192, avgCheckinPeople: 4.2, avgCheckinLength: 68 })]);
    expect(result.heatmap).toEqual({ '2026-03-10': 4 });
    expect(result.tagDistribution).toEqual([{ tag: '語言學習', count: 8 }]);
    expect(result.moodDistribution).toEqual([
      { mood: 'happy', count: 9 }, { mood: 'good', count: 0 }, { mood: 'neutral', count: 0 },
      { mood: 'bored', count: 0 }, { mood: 'frustrated', count: 6 }, { mood: 'give_up', count: 0 }
    ]);
    expect(result.trend.days).toHaveLength(14);
    expect(result.trend.days[0]).toEqual({ date: '2026-02-26', count: 7 });
    expect(result.trend.days[13]).toEqual({ date: '2026-03-11', count: 5 });
    // 近 7 天（03-05～03-11）= 5；前 7 天（02-26～03-04）= 7 + 2
    expect(result.trend).toEqual(expect.objectContaining({ thisWeek: 5, lastWeek: 9, delta: -4 }));
    expect(result.hourHistogram).toEqual({ '21': 6 });
  });

  it('applies practice filter and explicit date range, clamping the end to the cohort end date', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ ...cohort, end_date: day('2026-03-01') } as never);
    mockDashboardQueries();
    const result = await cohortDashboardService.get(2, 8, 42, { practiceTitle: '每天寫下一件小事', from: '2026-02-20' }, now);
    expect(result.range).toEqual({ from: '2026-02-20', to: '2026-03-01' });
    expect(result.practiceTitle).toBe('每天寫下一件小事');
    expect(JSON.stringify(prismaMock.$queryRaw.mock.calls)).toContain('COALESCE(pt.title, p.title) =');
  });

  it('reports zero averages when a practice has no check-ins in range', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ enrolled: 3n }] as never)
      .mockResolvedValueOnce([{ activated: 0n, active_this_week: 0n, checkins: 0n }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ title: '冥想靜心', start_date: null, end_date: null, started: 0n, checkins: 0n, active_days: 0n, participant_days: 0n, avg_length: null }] as never)
      .mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);
    const result = await cohortDashboardService.get(2, 8, 42, {}, now);
    expect(result.practiceOverview[0]).toEqual(expect.objectContaining({ startedCount: 0, checkinCount: 0, avgCheckinPeople: 0, avgCheckinLength: 0 }));
    expect(result.trend.days.every(item => item.count === 0)).toBe(true);
  });
});

describe('cohortDashboardService.listParticipants', () => {
  it('maps one row per participant × practice with counts and honours sort/search', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { user_id: 7, nickname: '林宜萱', email: 'yihsuan@example.com', practice_id: 31, practice_title: '每天寫下一件小事', start_date: day('2026-02-10'), checkin_count: 18n, comment_count: 13n, view_count: 174, reaction_count: 35n }
    ] as never);
    const result = await cohortDashboardService.listParticipants(2, 8, 42, { search: '林', sort: 'checkinCount', order: 'desc' }, now);
    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual({ userId: 7, nickname: '林宜萱', email: 'yihsuan@example.com', practiceId: 31, practiceTitle: '每天寫下一件小事', startDate: day('2026-02-10'), checkinCount: 18, commentCount: 13, viewCount: 174, reactionCount: 35 });
    const call = JSON.stringify(prismaMock.$queryRaw.mock.calls[0]);
    expect(call).toContain('ILIKE');
    expect(call).toContain('%林%');
    expect(call).toContain('checkin_count');
    expect(call).toContain('DESC');
  });

  it('rejects when the actor cannot coach the cohort', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(cohortDashboardService.listParticipants(2, 8, 42, { sort: 'nickname', order: 'asc' }, now)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
