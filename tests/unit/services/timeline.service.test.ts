import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { buildStreakMilestones, timelineService } from '@/services/timeline.service';

describe('timeline service', () => {
  it('creates 7, 14, 30, 60 and 90-day milestones on the exact reached dates', () => {
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    const dates = Array.from({ length: 90 }, (_, index) => new Date(start + index * 24 * 60 * 60 * 1000));
    const milestones = buildStreakMilestones(dates);
    expect(milestones.map(entry => entry.meta.streak)).toEqual([7, 14, 30, 60, 90]);
    expect(milestones[0].date).toBe('2026-01-07T00:00:00.000Z');
  });

  it('deduplicates same-day check-ins and resets after a gap', () => {
    const milestones = buildStreakMilestones([
      new Date('2026-01-01T03:00:00.000Z'),
      new Date('2026-01-01T09:00:00.000Z'),
      ...Array.from({ length: 7 }, (_, index) => new Date(Date.parse('2026-01-03T00:00:00.000Z') + index * 24 * 60 * 60 * 1000)),
    ]);
    expect(milestones).toHaveLength(1);
    expect(milestones[0].meta.streak).toBe(7);
    expect(milestones[0].date).toBe('2026-01-09T00:00:00.000Z');
  });

  it('bounds historical streak reads to distinct check-in dates', async () => {
    prismaMock.future_letters.findMany.mockResolvedValue([]);
    prismaMock.quiz_results.findMany.mockResolvedValue([]);
    prismaMock.practice_checkins.findMany.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);

    await timelineService.getTimeline(7, undefined, 20);

    expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    const query = prismaMock.$queryRaw.mock.calls[0][0] as { strings: string[]; values: unknown[] };
    expect(query.strings.join(' ')).toMatch(/SELECT DISTINCT checkin_date[\s\S]*ORDER BY checkin_date DESC[\s\S]*LIMIT/);
    expect(query.values).toContain(7);
    expect(query.values).toContain(500);
  });

  it('excludes check-ins of soft-deleted practices from events and streaks (daodao#386)', async () => {
    prismaMock.future_letters.findMany.mockResolvedValue([]);
    prismaMock.quiz_results.findMany.mockResolvedValue([]);
    prismaMock.practice_checkins.findMany.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);

    await timelineService.getTimeline(7, undefined, 20);

    const where = prismaMock.practice_checkins.findMany.mock.calls[0][0]?.where;
    expect(where).toMatchObject({ user_id: 7, practices: { deleted_at: null } });
    const query = prismaMock.$queryRaw.mock.calls[0][0] as { strings: string[] };
    expect(query.strings.join(' ')).toMatch(/JOIN practices[\s\S]*deleted_at IS NULL/);
  });

  it('binds the timeline cursor date in the bounded streak query', async () => {
    const before = new Date('2026-08-22T00:00:00.000Z');
    prismaMock.future_letters.findMany.mockResolvedValue([]);
    prismaMock.quiz_results.findMany.mockResolvedValue([]);
    prismaMock.practice_checkins.findMany.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);

    await timelineService.getTimeline(7, before.toISOString(), 20);

    const query = prismaMock.$queryRaw.mock.calls[0][0] as { values: unknown[] };
    expect(query.values).toContainEqual(before);
  });
});
