import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/cohort-draft.service', () => ({
  ensureCohortDrafts: jest.fn().mockResolvedValue(1),
}));
jest.mock('@/queues/challenge-email.queue', () => ({
  enqueueChallengeWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}));

import { challengeService, deriveRunStatus } from '@/services/challenge.service';
import { ensureCohortDrafts } from '@/services/cohort-draft.service';
import { deriveChallengeJoinability } from '@/services/cohort-run-state';

const challengeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  display_name: '21 天晨間書寫',
  start_date: new Date('2026-09-01T00:00:00.000Z'),
  end_date: new Date('2026-09-21T00:00:00.000Z'),
  join_deadline: null,
  join_paused: false,
  capacity: null,
  status: 'published',
  program: {
    name: '晨間書寫',
    description: '一起寫',
    kind: 'challenge',
    archived_at: null,
    deleted_at: null,
  },
  ...overrides,
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
    expect(summary).toMatchObject({
      id: 1,
      participantCount: 12,
      isJoined: false,
      canJoin: true,
      unavailableReason: null,
      runStatus: 'upcoming',
    });
  });

  it('超過加入截止日回報 expired', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([
      challengeRow({ join_deadline: new Date('2026-08-20T00:00:00.000Z') }),
    ] as never);
    setupCounts();
    const [summary] = await challengeService.list(null, new Date('2026-08-27T00:00:00.000Z'));
    expect(summary).toMatchObject({ canJoin: false, unavailableReason: 'expired' });
  });

  it('進行中的挑戰回報 canJoin=false、started（daodao#181／#184 FR-EXP-04）', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow()] as never);
    setupCounts();
    const [summary] = await challengeService.list(null, new Date('2026-09-05T00:00:00.000Z'));
    expect(summary).toMatchObject({ runStatus: 'ongoing', canJoin: false, unavailableReason: 'started' });
  });

  it('額滿回報 full', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow({ capacity: 10 })] as never);
    setupCounts(10);
    const [summary] = await challengeService.list(null, new Date('2026-08-27T00:00:00.000Z'));
    expect(summary).toMatchObject({ canJoin: false, unavailableReason: 'full' });
  });

  it('已登入且已加入回傳 isJoined=true', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([challengeRow()] as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([
      { cohort_id: 1, _count: { id: 1 } },
    ] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ cohort_id: 1 }] as never);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([{ cohort_id: 1 }] as never);
    const [summary] = await challengeService.list(7, new Date('2026-08-27T00:00:00.000Z'));
    expect(summary).toMatchObject({ isJoined: true, hasInspirationDeck: true });
  });
});

describe('challengeService.getDetail', () => {
  it('非 challenge kind 的期回 404', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(
      challengeRow({
        program: {
          name: '燈塔',
          description: null,
          kind: 'lighthouse',
          archived_at: null,
          deleted_at: null,
        },
      }) as never
    );
    await expect(challengeService.getDetail(1, null)).rejects.toThrow('找不到共同挑戰');
  });

  it('已封存計畫的挑戰回 404', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(
      challengeRow({
        program: { ...challengeRow().program, archived_at: new Date('2026-08-01T00:00:00.000Z') },
      }) as never
    );
    await expect(challengeService.getDetail(1, null)).rejects.toThrow('找不到共同挑戰');
  });

  it('已結束的挑戰仍可取得詳情（歷史足跡）', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(challengeRow() as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([]);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([]);
    prismaMock.cohort_templates.findFirst.mockResolvedValue({
      practice_template: { title: '晨間書寫', practice_action: '每天寫 10 分鐘' },
    } as never);
    const detail = await challengeService.getDetail(1, null, new Date('2026-10-01T00:00:00.000Z'));
    expect(detail).toMatchObject({
      runStatus: 'ended',
      canJoin: false,
      unavailableReason: 'ended',
      template: { title: '晨間書寫' },
    });
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
      { cohort_id: 1, external_id: 'second-uuid', _count: { practice_checkins: 1 } },
    ] as never);

    const [mine] = await challengeService.listMine(42, new Date('2026-09-10T00:00:00.000Z'));
    expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ creation_source: 'cohort_template' }),
        orderBy: { created_at: 'asc' },
      })
    );
    expect(mine.practiceId).toBe('first-uuid');
    expect(mine.checkInCount).toBe(2);
  });

  it('回傳我參加的挑戰並附自動複製的實踐 id', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([
      challengeRow(),
      challengeRow({ id: 2, display_name: '已結束的挑戰' }),
    ] as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue([
      { cohort_id: 1, _count: { id: 12 } },
    ] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      { cohort_id: 1 },
      { cohort_id: 2 },
    ] as never);
    prismaMock.inspiration_deck_assignments.findMany.mockResolvedValue([]);
    prismaMock.practices.findMany.mockResolvedValue([
      {
        cohort_id: 1,
        external_id: '550e8400-e29b-41d4-a716-446655440000',
        _count: { practice_checkins: 0 },
      },
    ] as never);

    const mine = await challengeService.listMine(42, new Date('2026-09-10T00:00:00.000Z'));
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          cohort_enrollments: { some: { user_id: 42, status: 'joined' } },
        }),
      })
    );
    expect(mine).toHaveLength(2);
    expect(mine[0]).toMatchObject({
      id: 1,
      isJoined: true,
      participantCount: 12,
      practiceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(mine[1]).toMatchObject({ id: 2, practiceId: null, checkInCount: 0 });
  });

  it('沒有參加任何挑戰時回空陣列且不查實踐', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([]);
    expect(await challengeService.listMine(42)).toEqual([]);
    expect(prismaMock.practices.findMany).not.toHaveBeenCalled();
  });
});

// daodao#295 AC-02：加入後複製出的實踐依挑戰期間給狀態（未開始／進行中），不是草稿
describe('challengeService.join', () => {
  beforeEach(() => jest.mocked(ensureCohortDrafts).mockClear());
  const setupJoin = (): void => {
    prismaMock.cohorts.findUnique.mockResolvedValue(challengeRow() as never);
    prismaMock.users.findUnique.mockResolvedValue({
      contacts: { email: 'member@example.test' },
    } as never);
    setupTransactionMock();
    prismaMock.$queryRaw.mockResolvedValue([{ id: 1, capacity: null }] as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(0);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    prismaMock.cohort_enrollments.upsert.mockResolvedValue({ id: 9, cohort_id: 1 } as never);
    prismaMock.practices.findFirst.mockResolvedValue({ external_id: 'p-ext' } as never);
  };

  // 狀態依每個綁定的實際開始日推導（綁定可釘選開始日），由 ensureCohortDrafts 的 by_period 處理（cohort-draft.service.test.ts 覆蓋）
  it('加入時以 by_period 複製實踐，cohortId 即挑戰 id（挑戰＝cohorts 一列），並帶入加入時間', async () => {
    setupJoin();
    const now = new Date('2026-08-27T04:00:00.000Z');
    const result = await challengeService.join(1, 42, now);
    expect(ensureCohortDrafts).toHaveBeenCalledWith(prismaMock, 1, 42, {
      status: 'by_period',
      now,
    });
    expect(result).toEqual({ enrollmentId: 9, cohortId: 1, status: 'joined', practiceId: 'p-ext' });
  });

  it('已加入再加入回 409，不再複製實踐', async () => {
    setupJoin();
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 9, status: 'joined' } as never);
    await expect(
      challengeService.join(1, 42, new Date('2026-08-27T04:00:00.000Z'))
    ).rejects.toThrow('你已加入此挑戰');
    expect(ensureCohortDrafts).not.toHaveBeenCalled();
  });

  // daodao#181／#184 regression：FR-EXP-04 進行中的挑戰不接受新加入（前端已不顯示入口，API 也要擋）
  it('已開始（進行中）的挑戰回 409，不建立參與記錄也不複製實踐', async () => {
    setupJoin();
    await expect(
      challengeService.join(1, 42, new Date('2026-09-05T04:00:00.000Z'))
    ).rejects.toThrow('此挑戰已開始，不再接受新加入');
    expect(prismaMock.cohort_enrollments.upsert).not.toHaveBeenCalled();
    expect(ensureCohortDrafts).not.toHaveBeenCalled();
  });

  it('開始日當天（台灣時間）即視為已開始', async () => {
    setupJoin();
    await expect(
      challengeService.join(1, 42, new Date('2026-08-31T16:00:00.000Z'))
    ).rejects.toThrow('此挑戰已開始，不再接受新加入');
  });

  it('開始日前一天（台灣 23:00）仍可加入', async () => {
    setupJoin();
    const result = await challengeService.join(1, 42, new Date('2026-08-31T15:00:00.000Z'));
    expect(result).toMatchObject({ status: 'joined' });
  });
});

describe('deriveChallengeJoinability', () => {
  const base = {
    start_date: new Date('2026-09-01T00:00:00.000Z'),
    end_date: new Date('2026-09-21T00:00:00.000Z'),
    join_deadline: null,
    capacity: null,
    join_paused: false,
  };
  const upcoming = new Date('2026-08-27T00:00:00.000Z');
  const ongoing = new Date('2026-09-05T00:00:00.000Z');

  it('未開始可加入', () => {
    expect(deriveChallengeJoinability(base, 0, upcoming)).toEqual({ canJoin: true, unavailableReason: null });
  });

  it('進行中回 started（即使未額滿、未截止、未暫停）', () => {
    expect(deriveChallengeJoinability(base, 0, ongoing)).toEqual({ canJoin: false, unavailableReason: 'started' });
  });

  it('進行中且已截止／額滿／暫停時仍以 started 為準', () => {
    expect(
      deriveChallengeJoinability({ ...base, join_deadline: new Date('2026-09-02T00:00:00.000Z'), capacity: 1, join_paused: true }, 1, ongoing)
    ).toEqual({ canJoin: false, unavailableReason: 'started' });
  });

  it('已結束仍回 ended', () => {
    expect(deriveChallengeJoinability(base, 0, new Date('2026-09-22T00:00:00.000Z'))).toEqual({ canJoin: false, unavailableReason: 'ended' });
  });

  it('未開始時 expired／paused／full 不回歸', () => {
    expect(deriveChallengeJoinability({ ...base, join_deadline: new Date('2026-08-20T00:00:00.000Z') }, 0, upcoming)).toEqual({ canJoin: false, unavailableReason: 'expired' });
    expect(deriveChallengeJoinability({ ...base, join_paused: true }, 0, upcoming)).toEqual({ canJoin: false, unavailableReason: 'paused' });
    expect(deriveChallengeJoinability({ ...base, capacity: 2 }, 2, upcoming)).toEqual({ canJoin: false, unavailableReason: 'full' });
  });
});
