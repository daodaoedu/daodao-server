import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { activityService } from '@/services/activity.service';
import { deriveJoinability } from '@/services/cohort-run-state';
import { NotFoundError } from '@/middleware/error.middleware';

const TOKEN = '123e4567-e89b-12d3-a456-426614174000';
const activityRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  display_name: '2026 秋季讀書會',
  start_date: new Date('2026-09-15T00:00:00.000Z'),
  end_date: new Date('2026-10-15T00:00:00.000Z'),
  join_deadline: null,
  join_token: TOKEN,
  join_paused: false,
  capacity: null,
  invite_message: '歡迎加入',
  status: 'published',
  visibility: 'public',
  program: { name: '線上讀書會', description: '每週二讀一章', kind: 'lighthouse', deleted_at: null, organization: { name: '燈塔工作室', bio: null, external_link: null, status: 'active' } },
  ...overrides
});

const setupCounts = (joinedCount = 0, joinedByUser = false) => {
  prismaMock.cohort_enrollments.groupBy.mockResolvedValue(joinedCount === 0 ? [] : ([{ cohort_id: 1, _count: { id: joinedCount } }] as never));
  prismaMock.cohort_enrollments.findMany.mockResolvedValue(joinedByUser ? ([{ cohort_id: 1 }] as never) : []);
};

describe('deriveJoinability', () => {
  const base = { start_date: new Date('2026-09-15T00:00:00.000Z'), end_date: new Date('2026-10-15T00:00:00.000Z'), join_deadline: null, capacity: null };
  const now = new Date('2026-09-01T00:00:00.000Z');

  it('join_paused 視為暫停加入', () => {
    expect(deriveJoinability({ ...base, join_paused: true }, 0, now)).toEqual({ canJoin: false, unavailableReason: 'paused' });
  });

  it('結束優先於暫停', () => {
    expect(deriveJoinability({ ...base, join_paused: true }, 0, new Date('2026-11-01T00:00:00.000Z'))).toEqual({ canJoin: false, unavailableReason: 'ended' });
  });

  it('未帶 join_paused 時沿用挑戰語意', () => {
    expect(deriveJoinability(base, 0, now)).toEqual({ canJoin: true, unavailableReason: null });
  });
});

describe('activityService.list', () => {
  const now = new Date('2026-09-01T00:00:00.000Z');

  it('只查公開、已發佈、未結束的燈塔期，未登入回傳 isJoined=false 與 joinToken', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([activityRow()] as never);
    setupCounts(5);

    const [summary] = await activityService.list(null, now);
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'published', visibility: 'public', program: expect.objectContaining({ kind: 'lighthouse' }) })
    }));
    expect(summary).toMatchObject({ id: 1, organizationName: '燈塔工作室', participantCount: 5, isJoined: false, canJoin: true, unavailableReason: null, runStatus: 'upcoming', joinToken: TOKEN });
    expect(prismaMock.cohort_enrollments.findMany).not.toHaveBeenCalled();
  });

  it('登入者已加入時 isJoined=true', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([activityRow()] as never);
    setupCounts(5, true);
    const [summary] = await activityService.list(42, now);
    expect(summary.isJoined).toBe(true);
  });

  it('暫停加入時 unavailableReason=paused 且不回傳 joinToken', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([activityRow({ join_paused: true })] as never);
    setupCounts();
    const [summary] = await activityService.list(null, now);
    expect(summary).toMatchObject({ canJoin: false, unavailableReason: 'paused', joinToken: null });
  });

  it('額滿時不回傳 joinToken', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([activityRow({ capacity: 3 })] as never);
    setupCounts(3);
    const [summary] = await activityService.list(null, now);
    expect(summary).toMatchObject({ canJoin: false, unavailableReason: 'full', joinToken: null });
  });
});

describe('activityService.getDetail', () => {
  const now = new Date('2026-09-01T00:00:00.000Z');

  it('回傳組織資訊與邀請文案', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(activityRow() as never);
    setupCounts(2);
    const detail = await activityService.getDetail(1, null, now);
    expect(detail).toMatchObject({ organization: { name: '燈塔工作室', bio: null, externalLink: null }, inviteMessage: '歡迎加入', participantCount: 2 });
  });

  it.each([
    ['private 期', { visibility: 'private' }],
    ['草稿期', { status: 'draft' }],
    ['共同挑戰期', { program: { ...activityRow().program, kind: 'challenge' } }],
    ['已停權組織', { program: { ...activityRow().program, organization: { ...activityRow().program.organization, status: 'suspended' } } }]
  ])('%s 回 404', async (_label, overrides) => {
    prismaMock.cohorts.findUnique.mockResolvedValue(activityRow(overrides) as never);
    await expect(activityService.getDetail(1, null, now)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('已結束仍可查看', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue(activityRow() as never);
    setupCounts();
    const detail = await activityService.getDetail(1, null, new Date('2026-11-01T00:00:00.000Z'));
    expect(detail).toMatchObject({ runStatus: 'ended', canJoin: false, unavailableReason: 'ended', joinToken: null });
  });
});
