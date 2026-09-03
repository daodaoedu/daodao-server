import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { activityService } from '@/services/activity.service';
import { deriveJoinability } from '@/services/cohort-run-state';
import { NotFoundError } from '@/middleware/error.middleware';

const TOKEN = '123e4567-e89b-12d3-a456-426614174000';
const activityRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  display_name: '2026 秋季讀書會',
  tagline: null,
  start_date: new Date('2026-09-15T00:00:00.000Z'),
  end_date: new Date('2026-10-15T00:00:00.000Z'),
  join_deadline: null,
  join_token: TOKEN,
  join_paused: false,
  capacity: null,
  invite_message: '歡迎加入',
  interaction_modes: ['sync'],
  fee_type: 'free',
  fee_amount: null,
  signup_method: 'island_form',
  external_signup_url: null,
  location: null,
  status: 'published',
  visibility: 'public',
  cohort_sessions: [],
  program: { name: '線上讀書會', description: '每週二讀一章', kind: 'lighthouse', deleted_at: null, organization_id: 10, organization: { id: 10, name: '燈塔工作室', bio: null, external_link: null, status: 'active' } },
  ...overrides
});

const setupListMocks = (activeRows: unknown[] = [], endedRows: unknown[] = [], joinedCount = 0, joinedByUser = false) => {
  prismaMock.cohorts.findMany
    .mockResolvedValueOnce(activeRows as never)
    .mockResolvedValueOnce(endedRows as never);
  prismaMock.cohort_enrollments.groupBy.mockResolvedValue(
    joinedCount === 0 ? [] : ([{ cohort_id: 1, _count: { id: joinedCount } }] as never)
  );
  // resolveHosts: enrollment owners
  prismaMock.cohort_enrollments.findMany.mockResolvedValueOnce([] as never);
  // resolveHosts: org owners (layer 2 fallback)
  prismaMock.organization_members.findMany.mockResolvedValueOnce([] as never);
  // templateCount
  prismaMock.cohort_templates.groupBy.mockResolvedValue([] as never);
  // user joined
  if (joinedByUser) {
    prismaMock.cohort_enrollments.findMany.mockResolvedValueOnce([{ cohort_id: 1 }] as never);
  }
};

describe('deriveJoinability', () => {
  const base = { start_date: new Date('2026-09-15T00:00:00.000Z'), end_date: new Date('2026-10-15T00:00:00.000Z'), join_deadline: null, capacity: null, join_paused: false };
  const now = new Date('2026-09-01T00:00:00.000Z');

  it('join_paused 視為暫停加入', () => {
    expect(deriveJoinability({ ...base, join_paused: true }, 0, now)).toEqual({ canJoin: false, unavailableReason: 'paused' });
  });

  it('結束優先於暫停', () => {
    expect(deriveJoinability({ ...base, join_paused: true }, 0, new Date('2026-11-01T00:00:00.000Z'))).toEqual({ canJoin: false, unavailableReason: 'ended' });
  });

  it('暫停優先於額滿', () => {
    expect(deriveJoinability({ ...base, join_paused: true, capacity: 1 }, 1, now)).toEqual({ canJoin: false, unavailableReason: 'paused' });
  });

  it('以 Asia/Taipei 日曆日判斷：結束日當天台灣 23:00（UTC 15:00）仍可加入', () => {
    expect(deriveJoinability(base, 0, new Date('2026-10-15T15:00:00.000Z'))).toEqual({ canJoin: true, unavailableReason: null });
  });

  it('以 Asia/Taipei 日曆日判斷：結束日隔天台灣 00:30（UTC 前一日 16:30）已結束', () => {
    expect(deriveJoinability(base, 0, new Date('2026-10-15T16:30:00.000Z'))).toEqual({ canJoin: false, unavailableReason: 'ended' });
  });
});

describe('activityService.list', () => {
  const now = new Date('2026-09-01T00:00:00.000Z');

  it('回傳 data + meta 結構', async () => {
    setupListMocks();
    const result = await activityService.list(null, undefined, now);
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(result.meta).toEqual({ endedLimit: 24, endedTruncated: false });
  });

  it('只查公開、已發佈的燈塔期，未登入回傳 isJoined=false', async () => {
    setupListMocks([activityRow()], [], 5);
    const { data } = await activityService.list(null, undefined, now);
    expect(data[0]).toMatchObject({ id: 1, organizationName: '燈塔工作室', participantCount: 5, isJoined: false, canJoin: true, runStatus: 'upcoming' });
  });

  it('暫停加入時 unavailableReason=paused 且不回傳 joinToken', async () => {
    setupListMocks([activityRow({ join_paused: true })]);
    const { data } = await activityService.list(null, undefined, now);
    expect(data[0]).toMatchObject({ canJoin: false, unavailableReason: 'paused', joinToken: null });
  });

  it('額滿時不回傳 joinToken', async () => {
    setupListMocks([activityRow({ capacity: 3 })], [], 3);
    const { data } = await activityService.list(null, undefined, now);
    expect(data[0]).toMatchObject({ canJoin: false, unavailableReason: 'full', joinToken: null });
  });
});

describe('activityService.getDetail', () => {
  const now = new Date('2026-09-01T00:00:00.000Z');

  const setupDetailMocks = (row: unknown, joinedCount = 0) => {
    prismaMock.cohorts.findUnique.mockResolvedValue(row as never);
    prismaMock.cohort_enrollments.groupBy.mockResolvedValue(
      joinedCount === 0 ? [] : ([{ cohort_id: 1, _count: { id: joinedCount } }] as never)
    );
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([] as never);
    prismaMock.organization_members.findMany.mockResolvedValue([] as never);
    prismaMock.cohort_templates.groupBy.mockResolvedValue([] as never);
  };

  it('回傳組織資訊與邀請文案', async () => {
    setupDetailMocks(activityRow(), 2);
    const detail = await activityService.getDetail(1, null, now);
    expect(detail).toMatchObject({ organization: { name: '燈塔工作室', bio: null, externalLink: null }, inviteMessage: '歡迎加入', participantCount: 2 });
  });

  it.each([
    ['private 期', { visibility: 'private' }],
    ['草稿期', { status: 'draft' }],
    ['共同挑戰期', { program: { ...activityRow().program, kind: 'challenge' } }],
    ['已停權組織', { program: { ...activityRow().program, organization: { ...activityRow().program.organization, status: 'suspended' } } }]
  ])('%s 回 404', async (_label, overrides) => {
    setupDetailMocks(activityRow(overrides));
    await expect(activityService.getDetail(1, null, now)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('已結束仍可查看', async () => {
    setupDetailMocks(activityRow());
    const detail = await activityService.getDetail(1, null, new Date('2026-11-01T00:00:00.000Z'));
    expect(detail).toMatchObject({ runStatus: 'ended', canJoin: false, unavailableReason: 'ended', joinToken: null });
  });
});
