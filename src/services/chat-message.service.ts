/**
 * Chat Message Service
 * 訊息讀寫核心：listPage、listDelta、create、update、remove、like/unlike、pin/unpin、listPins、search
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import {
  CHAT_MESSAGE_KINDS,
  CHAT_PAGE_DEFAULT,
  CHAT_PAGE_MAX,
  CHAT_SEARCH_MAX,
} from '../constants/chat';
import { chatAclService, type RoomAccess } from './chat-acl.service';

/** 共用的訊息 select 子句 */
const messageSelect = {
  id: true,
  room_id: true,
  kind: true,
  body: true,
  metadata: true,
  sender_user_id: true,
  reply_to_message_id: true,
  pinned_at: true,
  edited_at: true,
  deleted_at: true,
  created_at: true,
  updated_at: true,
  sender: {
    select: { id: true, nickname: true, contacts: { select: { photo_url: true } } },
  },
  reply_to: {
    select: {
      id: true,
      body: true,
      deleted_at: true,
      sender: { select: { nickname: true } },
    },
  },
} as const;

/** 格式化訊息（加入 likeCount、likedByMe、hostIds） */
const formatMessage = (
  msg: {
    id: number; room_id: number; kind: string; body: string; metadata: Prisma.JsonValue;
    sender_user_id: number | null; reply_to_message_id: number | null;
    pinned_at: Date | null; edited_at: Date | null; deleted_at: Date | null;
    created_at: Date; updated_at: Date;
    sender: { id: number; nickname: string | null; contacts: { photo_url: string | null } | null } | null;
    reply_to: { id: number; body: string; deleted_at: Date | null; sender: { nickname: string | null } | null } | null;
  },
  likeCount: number,
  likedByMe: boolean,
  hostIds: Set<number>
) => ({
  id: msg.id,
  roomId: msg.room_id,
  kind: msg.kind,
  body: msg.body,
  metadata: msg.metadata as Record<string, unknown> | null,
  author: msg.sender
    ? {
        userId: msg.sender.id,
        nickname: msg.sender.nickname,
        avatar: msg.sender.contacts?.photo_url ?? null,
        isHost: hostIds.has(msg.sender.id),
      }
    : null,
  replyTo: msg.reply_to
    ? {
        id: msg.reply_to.id,
        authorName: msg.reply_to.sender?.nickname ?? null,
        bodyPreview: msg.reply_to.deleted_at
          ? null
          : msg.reply_to.body.length > 100
            ? msg.reply_to.body.slice(0, 100) + '...'
            : msg.reply_to.body,
        isDeleted: msg.reply_to.deleted_at !== null,
      }
    : null,
  likeCount,
  likedByMe,
  isPinned: msg.pinned_at !== null,
  pinnedAt: msg.pinned_at?.toISOString() ?? null,
  editedAt: msg.edited_at?.toISOString() ?? null,
  createdAt: msg.created_at.toISOString(),
  updatedAt: msg.updated_at.toISOString(),
});

/**
 * 取得訊息的按讚數與 likedByMe
 */
const getLikesForMessages = async (messageIds: number[], userId: number) => {
  if (messageIds.length === 0) return { countMap: new Map<number, number>(), likedSet: new Set<number>() };
  const counts = await prisma.chat_message_likes.groupBy({
    by: ['message_id'],
    where: { message_id: { in: messageIds } },
    _count: { id: true },
  });
  const myLikes = await prisma.chat_message_likes.findMany({
    where: { message_id: { in: messageIds }, user_id: userId },
    select: { message_id: true },
  });
  return {
    countMap: new Map(counts.map(c => [c.message_id, c._count.id])),
    likedSet: new Set(myLikes.map(l => l.message_id)),
  };
};

/**
 * 歷史訊息分頁（cursor = before id，DESC）
 */
export const listPage = async (roomId: number, userId: number, before?: number, limit?: number) => {
  const take = Math.min(limit ?? CHAT_PAGE_DEFAULT, CHAT_PAGE_MAX);
  const hostIds = await chatAclService.listHostUserIds(
    (await prisma.chat_rooms.findUnique({ where: { id: roomId }, select: { cohort_id: true } }))!.cohort_id
  );

  const messages = await prisma.chat_messages.findMany({
    where: {
      room_id: roomId,
      deleted_at: null,
      ...(before ? { id: { lt: before } } : {}),
    },
    select: messageSelect,
    orderBy: { id: 'desc' },
    take: take + 1, // 多取一筆判斷 hasMore
  });

  const hasMore = messages.length > take;
  const page = hasMore ? messages.slice(0, take) : messages;
  const ids = page.map(m => m.id);
  const { countMap, likedSet } = await getLikesForMessages(ids, userId);

  const items = page.map(m => formatMessage(m, countMap.get(m.id) ?? 0, likedSet.has(m.id), hostIds));

  return {
    items,
    nextCursor: page.length > 0 ? String(page[page.length - 1].id) : null,
    hasMore,
  };
};

/**
 * 增量輪詢（新訊息 + changed + deletedIds）
 */
export const listDelta = async (
  roomId: number,
  userId: number,
  after: number,
  since: string
) => {
  const sinceDate = new Date(since);
  const cohortId = (await prisma.chat_rooms.findUnique({ where: { id: roomId }, select: { cohort_id: true } }))!.cohort_id;
  const hostIds = await chatAclService.listHostUserIds(cohortId);

  // 新訊息（id > after，未刪除）
  const newMessages = await prisma.chat_messages.findMany({
    where: { room_id: roomId, id: { gt: after }, deleted_at: null },
    select: messageSelect,
    orderBy: { id: 'asc' },
    take: CHAT_PAGE_MAX,
  });

  // changed：updated_at > since，未刪除，id <= after（排除新訊息重複）
  const changed = await prisma.chat_messages.findMany({
    where: {
      room_id: roomId,
      id: { lte: after },
      deleted_at: null,
      updated_at: { gt: sinceDate },
    },
    select: messageSelect,
    orderBy: { id: 'asc' },
    take: CHAT_PAGE_MAX,
  });

  // deletedIds：deleted_at > since
  const deletedRows = await prisma.chat_messages.findMany({
    where: {
      room_id: roomId,
      deleted_at: { gt: sinceDate },
    },
    select: { id: true },
    take: CHAT_PAGE_MAX,
  });

  const allIds = [
    ...newMessages.map(m => m.id),
    ...changed.map(m => m.id),
  ];
  const { countMap, likedSet } = await getLikesForMessages(allIds, userId);

  // pinnedCount & memberCount
  const pinnedCount = await prisma.chat_messages.count({
    where: { room_id: roomId, pinned_at: { not: null }, deleted_at: null },
  });
  const memberCount = await prisma.cohort_enrollments.count({
    where: { cohort_id: cohortId, status: 'joined', user_id: { not: null } },
  });

  return {
    messages: newMessages.map(m => formatMessage(m, countMap.get(m.id) ?? 0, likedSet.has(m.id), hostIds)),
    changed: changed.map(m => formatMessage(m, countMap.get(m.id) ?? 0, likedSet.has(m.id), hostIds)),
    deletedIds: deletedRows.map(r => r.id),
    pinnedCount,
    memberCount,
    serverTime: new Date().toISOString(),
  };
};

/**
 * 發送訊息
 */
export const create = async (
  access: RoomAccess,
  userId: number,
  body: string,
  replyToMessageId?: number
) => {
  // 驗證引用訊息
  if (replyToMessageId) {
    const replyTarget = await prisma.chat_messages.findFirst({
      where: { id: replyToMessageId, room_id: access.roomId },
      select: { id: true, kind: true, deleted_at: true },
    });
    if (!replyTarget) throw new BadRequestError('引用的訊息不存在於此聊天室');
    if (replyTarget.kind === CHAT_MESSAGE_KINDS.SYSTEM) throw new BadRequestError('不可引用系統訊息');
  }

  const now = new Date();
  const msg = await prisma.chat_messages.create({
    data: {
      room_id: access.roomId,
      sender_user_id: userId,
      kind: CHAT_MESSAGE_KINDS.TEXT,
      body,
      reply_to_message_id: replyToMessageId ?? null,
      created_at: now,
      updated_at: now,
    },
    select: messageSelect,
  });

  // 更新 last_message_at
  await prisma.chat_rooms.update({
    where: { id: access.roomId },
    data: { last_message_at: now },
  });

  const hostIds = await chatAclService.listHostUserIds(access.cohortId);
  return formatMessage(msg, 0, false, hostIds);
};

/**
 * 編輯訊息（僅本人、僅 text）
 */
export const update = async (
  access: RoomAccess,
  messageId: number,
  userId: number,
  body: string
) => {
  const msg = await prisma.chat_messages.findFirst({
    where: { id: messageId, room_id: access.roomId },
    select: { id: true, sender_user_id: true, kind: true, deleted_at: true },
  });
  if (!msg) throw new NotFoundError('找不到訊息');
  if (msg.deleted_at !== null) throw new NotFoundError('訊息已刪除');
  if (msg.kind !== CHAT_MESSAGE_KINDS.TEXT) throw new BadRequestError('僅可編輯文字訊息');
  if (msg.sender_user_id !== userId) throw new ForbiddenError('僅可編輯自己的訊息');

  const now = new Date();
  const updated = await prisma.chat_messages.update({
    where: { id: messageId },
    data: { body, edited_at: now, updated_at: now },
    select: messageSelect,
  });

  const hostIds = await chatAclService.listHostUserIds(access.cohortId);
  const { countMap, likedSet } = await getLikesForMessages([updated.id], userId);
  return formatMessage(updated, countMap.get(updated.id) ?? 0, likedSet.has(updated.id), hostIds);
};

/**
 * 刪除訊息（本人或 host，軟刪 + 取消置頂）
 */
export const remove = async (
  access: RoomAccess,
  messageId: number,
  userId: number,
  isHost: boolean
) => {
  const msg = await prisma.chat_messages.findFirst({
    where: { id: messageId, room_id: access.roomId },
    select: { id: true, sender_user_id: true, deleted_at: true },
  });
  if (!msg) throw new NotFoundError('找不到訊息');
  if (msg.deleted_at !== null) throw new NotFoundError('訊息已刪除');
  if (msg.sender_user_id !== userId && !isHost) throw new ForbiddenError('無權刪除此訊息');

  const now = new Date();
  await prisma.chat_messages.update({
    where: { id: messageId },
    data: {
      deleted_at: now,
      deleted_by_user_id: userId,
      pinned_at: null,
      pinned_by_user_id: null,
      updated_at: now,
    },
  });
};

/**
 * 按讚（冪等）
 */
export const like = async (access: RoomAccess, messageId: number, userId: number) => {
  const msg = await prisma.chat_messages.findFirst({
    where: { id: messageId, room_id: access.roomId },
    select: { id: true, kind: true, deleted_at: true },
  });
  if (!msg) throw new NotFoundError('找不到訊息');
  if (msg.deleted_at !== null) throw new NotFoundError('訊息已刪除');
  if (msg.kind === CHAT_MESSAGE_KINDS.SYSTEM) throw new BadRequestError('不可對系統訊息按讚');

  // 冪等 upsert
  await prisma.$executeRaw`
    INSERT INTO chat_message_likes (message_id, user_id)
    VALUES (${messageId}, ${userId})
    ON CONFLICT (message_id, user_id) DO NOTHING
  `;

  // touch updated_at
  await prisma.chat_messages.update({
    where: { id: messageId },
    data: { updated_at: new Date() },
  });

  const likeCount = await prisma.chat_message_likes.count({ where: { message_id: messageId } });
  return { likeCount, likedByMe: true };
};

/**
 * 取消按讚（冪等）
 */
export const unlike = async (access: RoomAccess, messageId: number, userId: number) => {
  const msg = await prisma.chat_messages.findFirst({
    where: { id: messageId, room_id: access.roomId },
    select: { id: true, deleted_at: true },
  });
  if (!msg) throw new NotFoundError('找不到訊息');
  if (msg.deleted_at !== null) throw new NotFoundError('訊息已刪除');

  await prisma.chat_message_likes.deleteMany({
    where: { message_id: messageId, user_id: userId },
  });

  // touch updated_at
  await prisma.chat_messages.update({
    where: { id: messageId },
    data: { updated_at: new Date() },
  });

  const likeCount = await prisma.chat_message_likes.count({ where: { message_id: messageId } });
  return { likeCount, likedByMe: false };
};

/**
 * 置頂（host only，冪等）
 */
export const pin = async (access: RoomAccess, messageId: number, userId: number) => {
  if (!access.isHost) throw new ForbiddenError('僅帶領人可置頂訊息');

  const msg = await prisma.chat_messages.findFirst({
    where: { id: messageId, room_id: access.roomId },
    select: { id: true, kind: true, deleted_at: true, pinned_at: true },
  });
  if (!msg) throw new NotFoundError('找不到訊息');
  if (msg.deleted_at !== null) throw new BadRequestError('不可置頂已刪除的訊息');
  if (msg.kind === CHAT_MESSAGE_KINDS.SYSTEM) throw new BadRequestError('不可置頂系統訊息');

  const now = new Date();
  const updated = await prisma.chat_messages.update({
    where: { id: messageId },
    data: {
      pinned_at: msg.pinned_at ?? now,
      pinned_by_user_id: userId,
      updated_at: now,
    },
    select: messageSelect,
  });

  const hostIds = await chatAclService.listHostUserIds(access.cohortId);
  const { countMap, likedSet } = await getLikesForMessages([updated.id], userId);
  return formatMessage(updated, countMap.get(updated.id) ?? 0, likedSet.has(updated.id), hostIds);
};

/**
 * 取消置頂（host only，冪等）
 */
export const unpin = async (access: RoomAccess, messageId: number, userId: number) => {
  if (!access.isHost) throw new ForbiddenError('僅帶領人可取消置頂');

  const msg = await prisma.chat_messages.findFirst({
    where: { id: messageId, room_id: access.roomId },
    select: { id: true, deleted_at: true },
  });
  if (!msg) throw new NotFoundError('找不到訊息');
  if (msg.deleted_at !== null) throw new NotFoundError('訊息已刪除');

  const now = new Date();
  const updated = await prisma.chat_messages.update({
    where: { id: messageId },
    data: { pinned_at: null, pinned_by_user_id: null, updated_at: now },
    select: messageSelect,
  });

  const hostIds = await chatAclService.listHostUserIds(access.cohortId);
  const { countMap, likedSet } = await getLikesForMessages([updated.id], userId);
  return formatMessage(updated, countMap.get(updated.id) ?? 0, likedSet.has(updated.id), hostIds);
};

/**
 * 列出置頂訊息（pinned_at DESC）
 */
export const listPins = async (roomId: number, userId: number) => {
  const cohortId = (await prisma.chat_rooms.findUnique({ where: { id: roomId }, select: { cohort_id: true } }))!.cohort_id;
  const hostIds = await chatAclService.listHostUserIds(cohortId);

  const messages = await prisma.chat_messages.findMany({
    where: { room_id: roomId, pinned_at: { not: null }, deleted_at: null },
    select: messageSelect,
    orderBy: { pinned_at: 'desc' },
  });

  const ids = messages.map(m => m.id);
  const { countMap, likedSet } = await getLikesForMessages(ids, userId);

  return messages.map(m => formatMessage(m, countMap.get(m.id) ?? 0, likedSet.has(m.id), hostIds));
};

/**
 * 搜尋訊息（ILIKE body 或 sender nickname，text 且未刪，max 200）
 */
export const search = async (roomId: number, q: string) => {
  const pattern = `%${q}%`;
  const results = await prisma.$queryRaw<Array<{ id: number; created_at: Date }>>`
    SELECT m.id, m.created_at
    FROM chat_messages m
    LEFT JOIN users u ON u.id = m.sender_user_id
    WHERE m.room_id = ${roomId}
      AND m.kind = 'text'
      AND m.deleted_at IS NULL
      AND (m.body ILIKE ${pattern} OR u.nickname ILIKE ${pattern})
    ORDER BY m.id DESC
    LIMIT ${CHAT_SEARCH_MAX}
  `;

  return {
    total: results.length,
    items: results.map(r => ({ id: r.id, createdAt: r.created_at.toISOString() })),
  };
};

export const chatMessageService = {
  listPage, listDelta, create, update, remove,
  like, unlike, pin, unpin, listPins, search,
};
