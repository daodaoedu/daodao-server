/**
 * Chat Presence Service
 * 在線狀態：Redis TTL 90 秒，語意為「90 秒內有開啟此聊天室」
 * Redis 不可用時 isOnline 全 false，不拋錯
 */

import redis from './database/redis.service';
import { CHAT_PRESENCE_TTL_SEC } from '../constants/chat';

const presenceKey = (roomId: number, userId: number): string =>
  `chat:presence:${roomId}:${userId}`;

/**
 * 更新使用者在聊天室的在線狀態
 * SET EX 90
 */
export const touch = async (roomId: number, userId: number): Promise<void> => {
  try {
    await redis.set(presenceKey(roomId, userId), '1', 'EX', CHAT_PRESENCE_TTL_SEC);
  } catch (error) {
    // Redis 錯誤吞掉，只 log
    console.error('chat-presence touch failed:', error);
  }
};

/**
 * 取得一組使用者的在線狀態
 * MGET，Redis 錯誤時全部回 false
 */
export const getOnlineSet = async (roomId: number, userIds: number[]): Promise<Set<number>> => {
  if (userIds.length === 0) return new Set();
  try {
    const keys = userIds.map(uid => presenceKey(roomId, uid));
    const values = await redis.mget(...keys);
    const online = new Set<number>();
    for (let i = 0; i < userIds.length; i++) {
      if (values[i] !== null) online.add(userIds[i]);
    }
    return online;
  } catch (error) {
    console.error('chat-presence getOnlineSet failed:', error);
    return new Set();
  }
};

export const chatPresenceService = { touch, getOnlineSet };
