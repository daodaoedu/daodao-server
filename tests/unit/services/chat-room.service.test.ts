import { prismaMock } from '@tests/utils/prisma-mock';
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
