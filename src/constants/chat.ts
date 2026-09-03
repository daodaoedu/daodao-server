/**
 * 群組聊天常量
 */

/** 訊息類型 */
export const CHAT_MESSAGE_KINDS = {
  TEXT: 'text',
  SYSTEM: 'system',
} as const;

export type ChatMessageKind = (typeof CHAT_MESSAGE_KINDS)[keyof typeof CHAT_MESSAGE_KINDS];

/** 系統訊息事件 */
export const CHAT_SYSTEM_EVENTS = {
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
} as const;

export type ChatSystemEvent = (typeof CHAT_SYSTEM_EVENTS)[keyof typeof CHAT_SYSTEM_EVENTS];

/** 聊天室可寫狀態（僅封存為 read_only，結束日不影響） */
export const CHAT_ROOM_CONTENT_STATES = {
  WRITABLE: 'writable',
  READ_ONLY: 'read_only',
} as const;

export type ChatRoomContentState = (typeof CHAT_ROOM_CONTENT_STATES)[keyof typeof CHAT_ROOM_CONTENT_STATES];

/** 訊息 body 上限 */
export const CHAT_MESSAGE_MAX_LENGTH = 2000;

/** 歷史訊息分頁預設筆數 */
export const CHAT_PAGE_DEFAULT = 50;

/** 歷史訊息分頁上限 */
export const CHAT_PAGE_MAX = 100;

/** 搜尋結果上限 */
export const CHAT_SEARCH_MAX = 200;

/** 在線狀態 Redis TTL（秒） */
export const CHAT_PRESENCE_TTL_SEC = 90;
