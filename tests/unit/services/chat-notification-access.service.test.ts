import { prismaMock } from '@tests/utils/prisma-mock';
import { ForbiddenError, NotFoundError } from '@/middleware/error.middleware';
import { chatNotificationAccessService } from '@/services/chat-notification-access.service';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

// 聊天室 12：使用者仍是成員；聊天室 13：已被移出；聊天室 14：已刪除
const mockResolveRoomAccess = jest.fn(async (roomId: number, _userId: number) => {
  if (roomId === 13) throw new ForbiddenError('無權限存取此聊天室');
  if (roomId === 14) throw new NotFoundError('找不到聊天室');
  return { roomId, cohortId: 1, isMember: true, isHost: false };
});
jest.mock('@/services/chat-acl.service', () => ({
  chatAclService: { resolveRoomAccess: (roomId: number, userId: number) => mockResolveRoomAccess(roomId, userId) },
}));

describe('聊天室通知送達前的權限檢查（daodao#555）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.chat_messages.findMany.mockResolvedValue([
      { id: 101, room_id: 12 },
      { id: 102, room_id: 12 },
      { id: 201, room_id: 13 },
      { id: 301, room_id: 14 },
    ] as never);
  });

  it('只保留仍在聊天室內的訊息通知，被移出或聊天室已刪除的排除，其他類型通知不受影響', async () => {
    const rows = [
      { id: 1, type: 'ChatMessage', entity_id: 101 },
      { id: 2, type: 'ChatMessage', entity_id: 201 },
      { id: 3, type: 'Comment', entity_id: 201 },
      { id: 4, type: 'ChatMessage', entity_id: 301 },
      { id: 5, type: 'ChatMessage', entity_id: 999 }, // 訊息已不存在
      { id: 6, type: 'ChatMessage', entity_id: 102 },
    ];

    const kept = await chatNotificationAccessService.dropInaccessibleChatNotifications(7, rows, 'ChatMessage');

    expect(kept.map((row) => row.id)).toEqual([1, 3, 6]);
    expect(mockResolveRoomAccess).toHaveBeenCalledWith(12, 7);
    // 同一聊天室只檢查一次
    expect(mockResolveRoomAccess.mock.calls.filter(([roomId]) => roomId === 12)).toHaveLength(1);
  });

  it('沒有聊天室通知時不查資料庫', async () => {
    const rows = [{ id: 1, type: 'Comment', entity_id: 5 }];
    const kept = await chatNotificationAccessService.dropInaccessibleChatNotifications(7, rows, 'ChatMessage');
    expect(kept).toEqual(rows);
    expect(prismaMock.chat_messages.findMany).not.toHaveBeenCalled();
  });

  it('權限檢查遇到非權限類錯誤（例如資料庫斷線）時往外丟，不當成無權限默默略過', async () => {
    mockResolveRoomAccess.mockRejectedValueOnce(new Error('connection lost'));
    await expect(
      chatNotificationAccessService.dropInaccessibleChatNotifications(
        7,
        [{ id: 1, type: 'ChatMessage', entity_id: 101 }],
        'ChatMessage'
      )
    ).rejects.toThrow('connection lost');
  });
});
