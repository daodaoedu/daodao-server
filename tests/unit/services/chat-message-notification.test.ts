import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { chatMessageService } from '@/services/chat-message.service';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/chat-acl.service', () => ({ chatAclService: { listHostUserIds: async () => new Set([3]) } }));

const room = { roomId: 12, cohortId: 4, isMember: true, isHost: false };

describe('群組聊天室通知', () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{ user_id: 1 }, { user_id: 2 }] as never);
    prismaMock.cohorts.findUnique.mockResolvedValue({
      display_name: '讀書會', program: { organization: { organization_members: [{ user_id: 2 }, { user_id: 3 }] } },
    } as never);
    prismaMock.chat_messages.create.mockResolvedValue({
      id: 50, room_id: 12, sender: { id: 1, nickname: 'Pei' }, created_at: new Date(), updated_at: new Date(),
    } as never);
  });

  it.each([
    { body: '新訊息', ids: [], all: false, kind: 'general', recipients: [2, 3] },
    { body: '@all 大家好', ids: [], all: true, kind: 'mention', recipients: [2, 3] },
    { body: '你好，@小島', ids: [1, 2, 2, 99], all: false, kind: 'mention', recipients: [2] },
  ])('$body 只通知適用的成員', async ({ body, ids, all, kind, recipients }) => {
    prismaMock.users.findMany.mockResolvedValue([{ id: 2, nickname: '小島' }] as never);
    await chatMessageService.create({ ...room, isHost: all }, 1, body, undefined, ids, all);
    if (ids.length) expect(prismaMock.users.findMany.mock.calls[0][0]?.where?.id).toEqual({ in: [2] });
    expect(prismaMock.notification_events.createMany).toHaveBeenCalledWith({
      data: recipients.map(recipient_id => ({
        recipient_id, actor_id: 1, entity_id: 50, entity_type: 'chat_message', priority: 'P1', type: 'ChatMessage',
        payload: { chatNotificationKind: kind, chatRoomName: '讀書會', actorName: 'Pei', url: expect.stringMatching(/\/messages\/12$/) },
      })),
    });
  });

  it('忽略失效的提及，避免轉成全員通知', async () => {
    prismaMock.users.findMany.mockResolvedValue([]);
    await chatMessageService.create(room, 1, '@小島', undefined, [99]);
    expect(prismaMock.notification_events.createMany).not.toHaveBeenCalled();
  });

  it('一般成員無法提及全體', async () => {
    await expect(chatMessageService.create(room, 1, '@all', undefined, [], true)).rejects.toThrow('僅聊天室管理員');
    expect(prismaMock.chat_messages.create).not.toHaveBeenCalled();
  });
});
