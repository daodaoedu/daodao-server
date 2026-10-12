import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { effectivePublishStatus, sortBlocksForDisplay, spaceService } from '@/services/space.service';
import { BadRequestError, ForbiddenError, UnprocessableEntityError } from '@/middleware/error.middleware';

const SPACE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const space = { id: 5, external_id: SPACE_UUID, owner_user_id: 42, name: '自我覺察練習', subtitle: '島島阿學', public_token: 'token-uuid', status: 'active', last_activity_at: new Date('2026-08-20T00:00:00Z'), deleted_at: null };

function mockHostAccess(): void {
  prismaMock.spaces.findFirst.mockResolvedValue(space as never);
  prismaMock.space_members.findUnique.mockResolvedValue({ role: 'host' } as never);
}

function mockMemberAccess(): void {
  prismaMock.spaces.findFirst.mockResolvedValue(space as never);
  prismaMock.space_members.findUnique.mockResolvedValue({ role: 'member' } as never);
}

const bareBlock = { title: '', body: null, is_pinned: false, scheduled_at: null, space_block_links: [], space_block_events: [] };

describe('effectivePublishStatus', () => {
  const now = new Date('2026-08-27T12:00:00Z');
  it('treats a scheduled block whose time has arrived as published (FR-7.6)', () => {
    expect(effectivePublishStatus({ publish_status: 'scheduled', scheduled_at: new Date('2026-08-27T11:59:00Z') } as never, now)).toBe('published');
  });
  it('keeps a future schedule as scheduled', () => {
    expect(effectivePublishStatus({ publish_status: 'scheduled', scheduled_at: new Date('2026-08-27T12:01:00Z') } as never, now)).toBe('scheduled');
  });
  it('passes draft and published through unchanged', () => {
    expect(effectivePublishStatus({ publish_status: 'draft', scheduled_at: null } as never, now)).toBe('draft');
    expect(effectivePublishStatus({ publish_status: 'published', scheduled_at: null } as never, now)).toBe('published');
  });
});

describe('sortBlocksForDisplay', () => {
  it('keeps the pinned announcement first regardless of position (FR-6.7)', () => {
    const ordered = sortBlocksForDisplay([
      { position: 0, is_pinned: false },
      { position: 2, is_pinned: true },
      { position: 1, is_pinned: false },
    ]);
    expect(ordered.map(block => block.position)).toEqual([2, 0, 1]);
  });
});

describe('spaceService.listMySpaces', () => {
  beforeEach(() => {
    prismaMock.cohorts.findMany.mockResolvedValue([] as never);
  });
  afterEach(() => jest.useRealTimers());
  const cohortRow = (opts: { id: number; kind: 'lighthouse' | 'challenge'; name: string; start: string; end: string; joined: number; programId?: number; practices?: Array<{ status: string; updated_at: string }>; createdAt?: string }): unknown => ({
    id: opts.id, display_name: opts.name, start_date: new Date(opts.start), end_date: new Date(opts.end),
    created_at: new Date(opts.createdAt ?? '2026-07-01T00:00:00Z'), updated_at: null,
    program: { id: opts.programId ?? 3, kind: opts.kind, organization: { name: opts.kind === 'challenge' ? '島島阿學' : '燈塔工作室' } },
    _count: { cohort_enrollments: opts.joined },
    cohort_enrollments: [{ user: { nickname: '小島', contacts: { photo_url: null } } }],
    practices: (opts.practices ?? []).map(practice => ({ status: practice.status, updated_at: new Date(practice.updated_at), created_at: new Date('2026-07-01T00:00:00Z') })),
  });
  const enrollment = (opts: Parameters<typeof cohortRow>[0] & { role?: string; joinedAt?: string }): unknown => ({
    joined_at: new Date(opts.joinedAt ?? '2026-08-01T00:00:00Z'),
    role: opts.role ?? 'member',
    cohort: cohortRow(opts),
  });

  it('組織成員建立的燈塔場次（尚無任何 enrollment）出現在空間清單，標為發起人 (#201)', async () => {
    prismaMock.practices.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([] as never);
    prismaMock.cohorts.findMany.mockResolvedValue([
      cohortRow({ id: 64, kind: 'lighthouse', name: '剛建立的場次', start: '2026-11-01', end: '2026-11-30', joined: 0, programId: 7, createdAt: '2026-10-12T00:00:00Z' }),
    ] as never);

    const result = await spaceService.listMySpaces(42);
    expect(result.total).toBe(3);
    expect(result.items[2]).toMatchObject({
      kind: 'event_course', id: '64', programId: 7, name: '剛建立的場次', host: '燈塔工作室',
      memberCount: 0, isHost: true, practiceCount: 0, lastActivityAt: '2026-10-12T00:00:00.000Z',
    });
    const where = prismaMock.cohorts.findMany.mock.calls[0][0]?.where;
    expect(where).toMatchObject({
      deleted_at: null,
      status: { in: ['draft', 'published'] },
      program: { kind: 'lighthouse', archived_at: null, deleted_at: null, organization: { status: 'active', organization_members: { some: { user_id: 42 } } } },
    });
  });

  it('既是學員又是組織成員的場次只出現一張卡，且以發起人身份呈現 (#201)', async () => {
    prismaMock.practices.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      enrollment({ id: 11, kind: 'lighthouse', name: '讀書會', start: '2026-07-01', end: '2026-12-31', joined: 4, programId: 7 }),
    ] as never);
    prismaMock.cohorts.findMany.mockResolvedValue([
      cohortRow({ id: 11, kind: 'lighthouse', name: '讀書會', start: '2026-07-01', end: '2026-12-31', joined: 4, programId: 7 }),
    ] as never);

    const result = await spaceService.listMySpaces(42);
    const events = result.items.filter(item => item.kind === 'event_course');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: '11', programId: 7, isHost: true });
  });

  it('orders the aggregate list personal → challenge → event cohorts by recent activity (FR-1.2)', async () => {
    prismaMock.practices.groupBy.mockResolvedValue([
      { status: 'active', _count: { _all: 2 } },
      { status: 'completed', _count: { _all: 1 } },
    ] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      enrollment({ id: 11, kind: 'lighthouse', name: '線上讀書會', start: '2026-07-01', end: '2026-12-31', joined: 4, practices: [{ status: 'active', updated_at: '2026-08-01T00:00:00Z' }] }),
      enrollment({ id: 12, kind: 'lighthouse', name: '自我覺察練習', start: '2026-07-01', end: '2026-12-31', joined: 9, role: 'owner', practices: [{ status: 'completed', updated_at: '2026-08-20T00:00:00Z' }] }),
    ] as never);

    const result = await spaceService.listMySpaces(42);
    expect(result.total).toBe(4);
    expect(result.items.map(item => item.kind)).toEqual(['personal', 'challenge', 'event_course', 'event_course']);
    expect(result.items[0]).toMatchObject({ host: '我的島', memberCount: 1, hasActivePractice: true, practiceCount: 3 });
    expect(result.items[0].programId).toBeNull();
    expect(result.items[1]).toMatchObject({ host: '島島阿學', memberCount: 0, practiceCount: 0, hasActivePractice: false });
    expect(result.items[2]).toMatchObject({ id: '12', name: '自我覺察練習', host: '燈塔工作室', memberCount: 9, isHost: true, hasActivePractice: false, practiceCount: 1 });
    expect(result.items[3]).toMatchObject({ id: '11', name: '線上讀書會', memberCount: 4, isHost: false, hasActivePractice: true });
    expect(result.items[3].programId).toBe(3);
    expect(prismaMock.space_members.findMany).not.toHaveBeenCalled();
  });

  it('fills the challenge card from joined challenge cohorts and keeps them out of the event list', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-10T00:00:00Z'));
    prismaMock.practices.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      enrollment({ id: 21, kind: 'challenge', name: '21 天晨間書寫', start: '2026-09-01', end: '2026-09-21', joined: 12, practices: [{ status: 'active', updated_at: '2026-09-09T00:00:00Z' }] }),
      enrollment({ id: 22, kind: 'challenge', name: '已結束的挑戰', start: '2026-06-01', end: '2026-06-21', joined: 30, practices: [{ status: 'completed', updated_at: '2026-06-21T00:00:00Z' }] }),
    ] as never);

    const result = await spaceService.listMySpaces(42);
    jest.useRealTimers();
    expect(result.items.map(item => item.kind)).toEqual(['personal', 'challenge']);
    expect(result.items[1]).toMatchObject({ memberCount: 12, practiceCount: 2, hasActivePractice: true, lastActivityAt: '2026-09-09T00:00:00.000Z' });
    expect(result.items[1].memberAvatars).toHaveLength(1);
  });

  it('多檔進行中挑戰時人數與頭像取最近開始的一檔', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-10T00:00:00Z'));
    prismaMock.practices.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      enrollment({ id: 21, kind: 'challenge', name: '八月底開始', start: '2026-08-25', end: '2026-09-30', joined: 40 }),
      enrollment({ id: 22, kind: 'challenge', name: '九月開始', start: '2026-09-05', end: '2026-09-30', joined: 7 }),
    ] as never);
    const result = await spaceService.listMySpaces(42);
    expect(result.items[1]).toMatchObject({ memberCount: 7 });
  });

  it('同一期重複的 joined 列只產生一張活動卡', async () => {
    prismaMock.practices.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      enrollment({ id: 11, kind: 'lighthouse', name: '讀書會', start: '2026-07-01', end: '2026-12-31', joined: 4 }),
      enrollment({ id: 11, kind: 'lighthouse', name: '讀書會', start: '2026-07-01', end: '2026-12-31', joined: 4 }),
    ] as never);
    const result = await spaceService.listMySpaces(42);
    expect(result.items.filter(item => item.kind === 'event_course')).toHaveLength(1);
  });

  it('falls back to the latest challenge when none is ongoing', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-12-01T00:00:00Z'));
    prismaMock.practices.groupBy.mockResolvedValue([] as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      enrollment({ id: 21, kind: 'challenge', name: '九月挑戰', start: '2026-09-01', end: '2026-09-21', joined: 12 }),
      enrollment({ id: 22, kind: 'challenge', name: '六月挑戰', start: '2026-06-01', end: '2026-06-21', joined: 30 }),
    ] as never);

    const result = await spaceService.listMySpaces(42);
    jest.useRealTimers();
    expect(result.items[1]).toMatchObject({ memberCount: 12, hasActivePractice: false });
  });
});

describe('spaceService.getHomePage viewer filtering', () => {
  it('hides a draft page from members entirely (FR-4.3 page draft)', async () => {
    mockMemberAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7, status: 'draft', space_blocks: [] } as never);
    expect(await spaceService.getHomePage(9, SPACE_UUID)).toBeNull();
  });

  it('filters draft and pending-scheduled blocks out of the member view (FR-7.2)', async () => {
    mockMemberAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({
      id: 7,
      status: 'published',
      space_blocks: [
        { id: 1, block_type: 'text', position: 0, publish_status: 'published', ...bareBlock },
        { id: 2, block_type: 'text', position: 1, publish_status: 'draft', ...bareBlock },
        { id: 3, block_type: 'text', position: 2, publish_status: 'scheduled', ...bareBlock, scheduled_at: new Date(Date.now() + 60_000) },
        { id: 4, block_type: 'text', position: 3, publish_status: 'scheduled', ...bareBlock, scheduled_at: new Date(Date.now() - 60_000) },
      ],
    } as never);
    const page = await spaceService.getHomePage(9, SPACE_UUID);
    expect(page?.blocks.map(block => block.id)).toEqual([1, 4]);
  });

  it('shows every block with status badges to the host', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({
      id: 7,
      status: 'draft',
      space_blocks: [
        { id: 1, block_type: 'text', position: 0, publish_status: 'draft', ...bareBlock },
        { id: 2, block_type: 'text', position: 1, publish_status: 'published', ...bareBlock },
      ],
    } as never);
    const page = await spaceService.getHomePage(42, SPACE_UUID);
    expect(page?.blocks).toHaveLength(2);
    expect(page?.blocks[0].publishStatus).toBe('draft');
  });

  it('rejects non-members outright', async () => {
    prismaMock.spaces.findFirst.mockResolvedValue(space as never);
    prismaMock.space_members.findUnique.mockResolvedValue(null as never);
    await expect(spaceService.getHomePage(999, SPACE_UUID)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('spaceService.moveBlock', () => {
  beforeEach(() => setupTransactionMock());

  it('swaps positions with the adjacent non-pinned neighbor (FR-6.6)', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst
      .mockResolvedValueOnce({ ...bareBlock, id: 12, page_id: 7, position: 2, is_pinned: false, block_type: 'text', publish_status: 'draft' } as never)
      .mockResolvedValueOnce({ id: 11, position: 1, is_pinned: false } as never);
    prismaMock.space_blocks.update.mockResolvedValue({} as never);
    prismaMock.space_blocks.findUniqueOrThrow.mockResolvedValue({ ...bareBlock, id: 12, block_type: 'text', position: 1, is_pinned: false, publish_status: 'draft' } as never);

    await spaceService.moveBlock(42, SPACE_UUID, 12, 'up');
    expect(prismaMock.space_blocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 12 }, data: expect.objectContaining({ position: 1 }) }));
    expect(prismaMock.space_blocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 11 }, data: expect.objectContaining({ position: 2 }) }));
  });

  it('refuses to move a pinned announcement (FR-6.7)', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst.mockResolvedValueOnce({ ...bareBlock, id: 12, page_id: 7, position: 0, is_pinned: true, block_type: 'text', publish_status: 'draft' } as never);
    await expect(spaceService.moveBlock(42, SPACE_UUID, 12, 'up')).rejects.toBeInstanceOf(BadRequestError);
  });

  it('refuses to move past the boundary', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst
      .mockResolvedValueOnce({ ...bareBlock, id: 12, page_id: 7, position: 0, is_pinned: false, block_type: 'text', publish_status: 'draft' } as never)
      .mockResolvedValueOnce(null as never);
    await expect(spaceService.moveBlock(42, SPACE_UUID, 12, 'up')).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe('spaceService block publish lifecycle', () => {
  it('publishes immediately when the scheduled time is already past (FR-7.6)', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst.mockResolvedValue({ id: 12, page_id: 7, position: 0, block_type: 'text', publish_status: 'draft', ...bareBlock } as never);
    prismaMock.space_blocks.update.mockResolvedValue({ id: 12, block_type: 'text', position: 0, publish_status: 'published', ...bareBlock } as never);

    await spaceService.publishBlock(42, SPACE_UUID, 12, '2020-01-01T00:00:00.000Z');
    expect(prismaMock.space_blocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ publish_status: 'published', scheduled_at: null }),
    }));
  });

  it('stores a future schedule as scheduled (FR-7.4)', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst.mockResolvedValue({ id: 12, page_id: 7, position: 0, block_type: 'text', publish_status: 'draft', ...bareBlock } as never);
    prismaMock.space_blocks.update.mockResolvedValue({ id: 12, block_type: 'text', position: 0, publish_status: 'scheduled', ...bareBlock } as never);

    const future = new Date(Date.now() + 86_400_000).toISOString();
    await spaceService.publishBlock(42, SPACE_UUID, 12, future);
    expect(prismaMock.space_blocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ publish_status: 'scheduled', scheduled_at: new Date(future) }),
    }));
  });

  it('never lets a published block fall back to draft (FR-7.8)', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst.mockResolvedValue({ id: 12, page_id: 7, position: 0, block_type: 'text', publish_status: 'published', ...bareBlock } as never);
    await expect(spaceService.draftBlock(42, SPACE_UUID, 12)).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('lets a pending scheduled block go back to draft', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst.mockResolvedValue({ id: 12, page_id: 7, position: 0, block_type: 'text', publish_status: 'scheduled', ...bareBlock, scheduled_at: new Date(Date.now() + 60_000) } as never);
    prismaMock.space_blocks.update.mockResolvedValue({ id: 12, block_type: 'text', position: 0, publish_status: 'draft', ...bareBlock } as never);
    const result = await spaceService.draftBlock(42, SPACE_UUID, 12);
    expect(result.publishStatus).toBe('draft');
  });
});

describe('spaceService.updateBlock content guards', () => {
  it('rejects link edits on a non-resources block', async () => {
    mockHostAccess();
    prismaMock.space_home_pages.findUnique.mockResolvedValue({ id: 7 } as never);
    prismaMock.space_blocks.findFirst.mockResolvedValue({ id: 12, page_id: 7, position: 0, block_type: 'text', publish_status: 'draft', ...bareBlock } as never);
    await expect(spaceService.updateBlock(42, SPACE_UUID, 12, { links: [] } as never)).rejects.toBeInstanceOf(BadRequestError);
  });
});
