import { prismaMock } from '@tests/utils/prisma-mock';
import type { Prisma } from '../../../generated/prisma';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/chat-presence.service', () => ({ chatPresenceService: { getOnlineSet: jest.fn() } }));
import { chatRoomService } from '@/services/chat-room.service';

// daodao#154 regression：訊息 author.userId 是內部 users.id（整數），但 /users/me、/auth/me 只回 external UUID，
// auth cookie 又是 httpOnly，前端沒有任何 API 能拿到自己的內部 id，於是永遠認不出「本人訊息」。
// 聊天室詳情帶 viewerUserId（與 author.userId 同一種 id），前端才能判斷本人訊息。
describe('chatRoomService.getRoom', () => {
  const access = { roomId: 9372, cohortId: 37, isMember: true, isHost: true };

  beforeEach(() => {
    prismaMock.chat_rooms.findUnique.mockResolvedValue({
      id: 9372,
      cohort_id: 37,
      last_message_at: new Date('2026-10-10T02:00:00.000Z'),
      cohort: { display_name: 'QA 272 dev 冒煙', status: 'published', program: { organization: { name: 'lighthouse test' } } },
    } as never);
    prismaMock.cohort_enrollments.count.mockResolvedValue(1);
    prismaMock.cohorts.findUnique.mockResolvedValue({ program: { organization_id: 5 } } as never);
    prismaMock.organization_members.count.mockResolvedValue(2);
    prismaMock.chat_messages.count.mockResolvedValue(0);
    prismaMock.chat_room_reads.findUnique.mockResolvedValue(null);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([] as never);
  });

  it('returns the viewer internal user id so the client can tell own messages apart', async () => {
    const room = await chatRoomService.getRoom(access, 2);
    expect(room.viewerUserId).toBe(2);
    expect(room.viewerRole).toBe('host');
  });

  it('viewerUserId follows the requesting user, not the room', async () => {
    const room = await chatRoomService.getRoom({ ...access, isHost: false }, 306);
    expect(room.viewerUserId).toBe(306);
    expect(room.viewerRole).toBe('member');
  });
});

// daodao#392: organization owners must not see rooms that the room ACL rejects
// because their program is archived. Cohort archival alone remains supported.
describe('chatRoomService.listMyRooms program visibility', () => {
  const timestamp = new Date('2026-10-09T00:54:28.184Z');
  const fixtures = [
    { id: 23, roomId: 7848, name: 'Archived program room', status: 'archived', programArchivedAt: timestamp },
    { id: 37, roomId: 9372, name: 'Archived cohort in active program', status: 'archived', programArchivedAt: null },
    { id: 38, roomId: 9373, name: 'Published cohort in active program', status: 'published', programArchivedAt: null },
  ];

  beforeEach(() => {
    // The affected owner has organization membership, but no cohort enrollment.
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([]);
    prismaMock.$executeRaw.mockResolvedValue(0);
    prismaMock.chat_rooms.findUnique.mockImplementation((async (args: Prisma.chat_roomsFindUniqueArgs) => {
      const fixture = fixtures.find(row => row.id === args.where.cohort_id);
      return fixture ? { id: fixture.roomId } : null;
    }) as never);
    // Filter-aware storage double: unlike mockResolvedValue, dropping the archive
    // predicate changes the returned data and exposes the actual leaked room.
    prismaMock.cohorts.findMany.mockImplementation((async (args?: Prisma.cohortsFindManyArgs) => {
      const programFilter = args?.where?.program;
      const archivedAt = programFilter && 'archived_at' in programFilter
        ? programFilter.archived_at
        : undefined;
      const cohortStatus = args?.where?.status;
      return fixtures
        .filter(row => archivedAt === undefined || row.programArchivedAt === archivedAt)
        .filter(row => typeof cohortStatus !== 'string' || row.status === cohortStatus)
        .map(row => ({ id: row.id }));
    }) as never);
    prismaMock.chat_rooms.findMany.mockImplementation((async (args?: Prisma.chat_roomsFindManyArgs) => {
      const cohortFilter = args?.where?.cohort_id;
      const cohortIds = typeof cohortFilter === 'object' && Array.isArray(cohortFilter.in)
        ? cohortFilter.in : [];
      return fixtures.filter(row => cohortIds?.includes(row.id)).map(row => ({
        id: row.roomId,
        cohort_id: row.id,
        created_at: timestamp,
        last_message_at: timestamp,
        cohort: {
          display_name: row.name,
          status: row.status,
          program: { organization: { name: 'Test organization' } },
        },
      }));
    }) as never);
    prismaMock.$queryRaw.mockImplementation((async (query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => {
      const sql = 'sql' in query ? query.sql : query.join('');
      // Prisma.join exposes the selected room IDs through the interpolated Sql.
      const ids = values.flatMap(value =>
        typeof value === 'object' && value !== null && 'values' in value
          ? (value.values as number[])
          : []
      );
      const rooms = fixtures.filter(row => ids.includes(row.roomId));
      if (sql.includes('SELECT DISTINCT ON')) {
        return rooms.map(row => ({
          room_id: row.roomId, id: row.roomId, kind: 'system',
          body: 'A member joined', sender_user_id: null, sender_nickname: null,
          created_at: timestamp,
        })) as never;
      }
      if (sql.includes('LEFT JOIN chat_room_reads')) {
        // Each room has one unread system message; null senders must count.
        return rooms.map(row => ({ room_id: row.roomId, cnt: BigInt(1) })) as never;
      }
      return [];
    }) as never);
  });

  it('excludes archived programs and their unread messages for organization-only members', async () => {
    const result = await chatRoomService.listMyRooms(2);

    expect(result.items.map(room => room.id)).toEqual([9372, 9373]);
    expect(result.totalUnread).toBe(2);
    expect(result.items.some(room => room.id === 7848)).toBe(false);
  });

  it('keeps archived cohorts under active programs and their unread system messages', async () => {
    const result = await chatRoomService.listMyRooms(2);
    const archivedCohort = result.items.find(room => room.id === 9372);

    expect(archivedCohort).toMatchObject({
      name: 'Archived cohort in active program',
      unreadCount: 1,
      lastMessage: { kind: 'system', authorName: null, isMine: false },
    });
    expect(result.items.find(room => room.id === 9373)?.unreadCount).toBe(1);
  });
});
