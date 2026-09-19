import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { challengeService, deriveRunStatus } from '@/services/challenge.service';

const challengeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  display_name: '21 天晨間書寫',
  start_date: new Date('2026-09-01T00:00:00.000Z'),
  end_date: new Date('2026-09-21T00:00:00.000Z'),
  join_deadline: null,
  join_paused: false,
  capacity: null,
  status: 'published',
  program: { name: '晨間書寫', description: '一起寫', kind: 'challenge', archived_at: null, deleted_at: null },
  ...overrides
});

describe('deriveRunStatus', () => {
  const start = new Date('2026-09-01T00:00:00.000Z');
  const end = new Date('2026-09-21T00:00:00.000Z');

  it('開始日前為 upcoming（台灣 08-31 23:00 = UTC 15:00）', () => {
    expect(deriveRunStatus(start, end, new Date('2026-08-31T15:00:00.000Z'))).toBe('upcoming');
  });

  it('台灣已是開始日（UTC 前一日 16:00）即為 ongoing', () => {
    expect(deriveRunStatus(start, end, new Date('2026-08-31T16:00:00.000Z'))).toBe('ongoing');
  });

  it('開始日當天即為 ongoing（含頭）', () => {
    expect(deriveRunStatus(start, end, new Date('2026-09-01T00:00:00.000Z'))).toBe('ongoing');
  });

  it('結束日當天仍為 ongoing（含尾）', () => {
    expect(deriveRunStatus(start, end, new Date('2026-09-21T12:00:00.000Z'))).toBe('ongoing');
  });

  it('結束日隔天為 ended', () => {
    expect(deriveRunStatus(start, end, new Date('2026-09-22T00:00:00.000Z'))).toBe('ended');
  });
});

describe('challengeService.list', () => {
  const setupCounts = (joinedCount = 0) => {
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue(
      joinedCount === 0 ? [] : ([{ cohort_id: 1, _count: { id: joinedCount } }] as never)
    );
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([]);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([]);
  };

  it('未登入回傳 isJoined=false 與參與人數', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow()] as never);
    setupCounts(12);
    const [summary] = await challengeService.list(null, new Date('2026-08-27T00:00:00.000Z'));
    expect(summary).toMatchObject({ id: 1, participantCount: 12, isJoined: false, canJoin: true, unavailableReason: null, runStatus: 'upcoming' });
  });

  it('超過加入截止日回報 expired', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow({ join_deadline: new Date('2026-08-20T00:00:00.000Z') })] as never);
    setupCounts();
    const [summary] = await challengeService.list(null, new Date('2026-08-27T00:00:00.000Z'));
    expect(summary).toMatchObject({ canJoin: false, unavailableReason: 'expired' });
  });

  it('額滿回報 full', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow({ capacity: 10 })] as never);
    setupCounts(10);
    const [summary] = await challengeService.list(null, new Date('2026-08-27T00:00:00.000Z'));
    expect(summary).toMatchObject({ canJoin: false, unavailableReason: 'full' });
  });

  it('已登入且已加入回傳 isJoined=true', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow()] as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([{ cohort_id: 1, _count: { id: 1 } }] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ cohort_id: 1 }] as never);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([{ cohort_id: 1 }] as never);
    const [summary] = await challengeService.list(7, new Date('2026-08-27T00:00:00.000Z'));
    expect(summary).toMatchObject({ isJoined: true, hasInspirationDeck: true });
  });
});

describe('challengeService.getDetail', () => {
  it('非 challenge kind 的期回 404', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(
      challengeRow({ program: { name: '燈塔', description: null, kind: 'lighthouse', archived_at: null, deleted_at: null } }) as never
    );
    await expect(challengeService.getDetail(1, null)).rejects.toThrow('找不到共同挑戰');
  });

  it('已封存計畫的挑戰回 404', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(
      challengeRow({ program: { ...challengeRow().program, archived_at: new Date('2026-08-01T00:00:00.000Z') } }) as never
    );
    await expect(challengeService.getDetail(1, null)).rejects.toThrow('找不到共同挑戰');
  });

  it('已結束的挑戰仍可取得詳情（歷史足跡）', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(challengeRow() as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([]);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([]);
    prismaMock.cohort_templates.findFirst.mockResolvedValue({ practice_template: { title: '晨間書寫', practice_action: '每天寫 10 分鐘' } } as never);
    const detail = await challengeService.getDetail(1, null, new Date('2026-10-01T00:00:00.000Z'));
    expect(detail).toMatchObject({ runStatus: 'ended', canJoin: false, unavailableReason: 'ended', template: { title: '晨間書寫' } });
  });
});

describe('challengeService.listMine', () => {
  it('同一挑戰有多筆實踐時取最早建立的模板實踐（與 join 回傳一致）', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow()] as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([]);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ cohort_id: 1 }] as never);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([]);
    prismaMock.practices.findMany.mockResolvedValue([
      { cohort_id: 1, external_id: 'first-uuid', _count: { practice_checkins: 2 } },
      { cohort_id: 1, external_id: 'second-uuid', _count: { practice_checkins: 1 } }
    ] as never);

    const [mine] = await challengeService.listMine(42, new Date('2026-09-10T00:00:00.000Z'));
    expect(prismaMock.practices.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ creation_source: 'cohort_template' }),
      orderBy: { created_at: 'asc' }
    }));
    expect(mine.practiceId).toBe('first-uuid');
    expect(mine.checkInCount).toBe(2);
  });

  it('回傳我參加的挑戰並附自動複製的實踐 id', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow(), challengeRow({ id: 2, display_name: '已結束的挑戰' })] as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([{ cohort_id: 1, _count: { id: 12 } }] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ cohort_id: 1 }, { cohort_id: 2 }] as never);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([]);
    prismaMock.practices.findMany.mockResolvedValue([{ cohort_id: 1, external_id: '550e8400-e29b-41d4-a716-446655440000', _count: { practice_checkins: 0 } }] as never);

    const mine = await challengeService.listMine(42, new Date('2026-09-10T00:00:00.000Z'));
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ cohort_enrollments: { some: { user_id: 42, status: 'joined' } } })
    }));
    expect(mine).toHaveLength(2);
    expect(mine[0]).toMatchObject({ id: 1, isJoined: true, participantCount: 12, practiceId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(mine[1]).toMatchObject({ id: 2, practiceId: null, checkInCount: 0 });
  });

  it('沒有參加任何挑戰時回空陣列且不查實踐', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([]);
    expect(await challengeService.listMine(42)).toEqual([]);
    expect(prismaMock.practices.findMany).not.toHaveBeenCalled();
  });
});
