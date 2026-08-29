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
  it('orders the aggregate list personal → challenge → event spaces by recent activity (FR-1.2)', async () => {
    prismaMock.practices.groupBy.mockResolvedValue([
      { status: 'active', _count: { _all: 2 } },
      { status: 'completed', _count: { _all: 1 } },
    ] as never);
    const spaceRow = (id: number, name: string, activity: string): unknown => ({
      spaces: {
        id, external_id: `uuid-${id}`, name, owner_user_id: 42, last_activity_at: new Date(activity),
        space_members: [{ users: { nickname: '小島', contacts: { photo_url: null } } }],
        _count: { space_members: 4, space_practices: 2 },
        space_practices: [{ id: 1 }],
      },
    });
    prismaMock.space_members.findMany.mockResolvedValue([
      spaceRow(1, '線上讀書會', '2026-08-01T00:00:00Z'),
      spaceRow(2, '自我覺察練習', '2026-08-20T00:00:00Z'),
    ] as never);

    const result = await spaceService.listMySpaces(42);
    expect(result.total).toBe(4);
    expect(result.items.map(item => item.kind)).toEqual(['personal', 'challenge', 'event_course', 'event_course']);
    expect(result.items[0]).toMatchObject({ host: '我的島', memberCount: 1, hasActivePractice: true, practiceCount: 3 });
    expect(result.items[1]).toMatchObject({ host: '島島阿學' });
    expect(result.items[2].name).toBe('自我覺察練習');
    expect(result.items[3].name).toBe('線上讀書會');
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
