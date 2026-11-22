/**
 * 聊天室通知的送達前權限檢查（daodao#555）。
 *
 * 聊天室通知事件在訊息送出當下依成員資格建立，但站內批次（每小時）、Email 摘要（每 4 小時）
 * 與通知列表都在之後才送達。這段時間內被移除或退出的成員，不應再收到或看到該聊天室的通知。
 */
import { prisma } from './database/prisma.service';
import { chatAclService } from './chat-acl.service';
import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';

/** 回傳 userId 目前仍可讀取的聊天訊息 ID（訊息不存在、聊天室不存在或已無權限都排除） */
export const listAccessibleChatMessageIds = async (
  userId: number,
  messageIds: readonly number[]
): Promise<Set<number>> => {
  const accessible = new Set<number>();
  const uniqueIds = [...new Set(messageIds)];
  if (uniqueIds.length === 0) return accessible;

  const messages = await prisma.chat_messages.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, room_id: true },
  });
  const byRoom = new Map<number, number[]>();
  for (const message of messages) {
    const ids = byRoom.get(message.room_id) ?? [];
    ids.push(message.id);
    byRoom.set(message.room_id, ids);
  }

  for (const [roomId, ids] of byRoom) {
    try {
      await chatAclService.resolveRoomAccess(roomId, userId);
      for (const id of ids) accessible.add(id);
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError) continue;
      throw error;
    }
  }
  return accessible;
};

/**
 * 從一位收件人的事件／通知中，移除他已無權讀取的聊天室通知；其他類型原樣保留。
 */
export const dropInaccessibleChatNotifications = async <
  T extends { type: string; entity_id: number },
>(
  userId: number,
  rows: readonly T[],
  chatType: string
): Promise<T[]> => {
  const chatIds = rows.filter((row) => row.type === chatType).map((row) => row.entity_id);
  if (chatIds.length === 0) return [...rows];
  const accessible = await listAccessibleChatMessageIds(userId, chatIds);
  return rows.filter((row) => row.type !== chatType || accessible.has(row.entity_id));
};

export const chatNotificationAccessService = {
  listAccessibleChatMessageIds,
  dropInaccessibleChatNotifications,
};
