/**
 * Chat Room Controller
 * 群組聊天的所有 endpoint handler
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { chatAclService } from '../services/chat-acl.service';
import { chatRoomService } from '../services/chat-room.service';
import { chatMessageService } from '../services/chat-message.service';
import { chatPresenceService } from '../services/chat-presence.service';
import { createSuccessResponse, createCursorPaginatedResponse } from '../utils/response-helper';
import type {
  ChatRoomIdParams,
  ChatMessageIdParams,
  ChatMessagesQuery,
  ChatSearchQuery,
  CreateChatMessageInput,
  UpdateChatMessageInput,
  MarkChatRoomReadInput,
} from '../validators/chat-room.validators';

/** 取出已驗證的 userId，未登入拋 401 */
function requireUserId(req: Request): number {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  return req.user.id;
}

/**
 * GET /api/v1/me/chat-rooms
 * 我的聊天室列表
 */
export const listMyRooms = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const data = await chatRoomService.listMyRooms(userId);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * GET /api/v1/chat-rooms/:roomId
 * 聊天室詳情
 */
export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId } = req.params as unknown as ChatRoomIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const data = await chatRoomService.getRoom(access, userId);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * GET /api/v1/chat-rooms/:roomId/members
 * 聊天室成員列表
 */
export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId } = req.params as unknown as ChatRoomIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const data = await chatRoomService.listMembers(access);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * GET /api/v1/chat-rooms/:roomId/messages
 * 歷史分頁 (before) 或增量輪詢 (after+since)
 * after 模式順便寫 presence
 */
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId } = req.params as unknown as ChatRoomIdParams;
  await chatAclService.resolveRoomAccess(roomId, userId);
  const query = req.query as unknown as ChatMessagesQuery;

  if (query.after !== undefined && query.since !== undefined) {
    // 增量輪詢模式 — 順便寫 presence（fire-and-forget）
    chatPresenceService.touch(roomId, userId).catch(() => {});
    const data = await chatMessageService.listDelta(roomId, userId, query.after, query.since);
    res.status(200).json(createSuccessResponse(data));
  } else {
    // 歷史分頁模式
    const { items, nextCursor, hasMore } = await chatMessageService.listPage(roomId, userId, query.before, query.limit);
    res.status(200).json(createCursorPaginatedResponse(items, {
      cursors: { start: items.length > 0 ? String(items[0].id) : null, end: nextCursor },
      hasMore,
      count: items.length,
      limit: query.limit ?? 50,
      hasNext: hasMore,
      hasPrev: query.before !== undefined,
      nextCursor,
      prevCursor: null,
      totalEstimate: null,
      parentTotalEstimate: null,
    }));
  }
});

/**
 * POST /api/v1/chat-rooms/:roomId/messages
 * 發送訊息
 */
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId } = req.params as unknown as ChatRoomIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const { body, replyToMessageId } = req.body as CreateChatMessageInput;
  const data = await chatMessageService.create(access, userId, body, replyToMessageId);
  res.status(201).json(createSuccessResponse(data));
});

/**
 * PATCH /api/v1/chat-rooms/:roomId/messages/:messageId
 * 編輯訊息
 */
export const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId, messageId } = req.params as unknown as ChatMessageIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const { body } = req.body as UpdateChatMessageInput;
  const data = await chatMessageService.update(access, messageId, userId, body);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * DELETE /api/v1/chat-rooms/:roomId/messages/:messageId
 * 刪除訊息
 */
export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId, messageId } = req.params as unknown as ChatMessageIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  await chatMessageService.remove(access, messageId, userId, access.isHost);
  res.status(204).send();
});

/**
 * PUT /api/v1/chat-rooms/:roomId/messages/:messageId/like
 * 按讚
 */
export const likeMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId, messageId } = req.params as unknown as ChatMessageIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const data = await chatMessageService.like(access, messageId, userId);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * DELETE /api/v1/chat-rooms/:roomId/messages/:messageId/like
 * 取消按讚
 */
export const unlikeMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId, messageId } = req.params as unknown as ChatMessageIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const data = await chatMessageService.unlike(access, messageId, userId);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * PUT /api/v1/chat-rooms/:roomId/messages/:messageId/pin
 * 置頂
 */
export const pinMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId, messageId } = req.params as unknown as ChatMessageIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const data = await chatMessageService.pin(access, messageId, userId);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * DELETE /api/v1/chat-rooms/:roomId/messages/:messageId/pin
 * 取消置頂
 */
export const unpinMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId, messageId } = req.params as unknown as ChatMessageIdParams;
  const access = await chatAclService.resolveRoomAccess(roomId, userId);
  const data = await chatMessageService.unpin(access, messageId, userId);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * GET /api/v1/chat-rooms/:roomId/pins
 * 置頂訊息列表
 */
export const listPins = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId } = req.params as unknown as ChatRoomIdParams;
  await chatAclService.resolveRoomAccess(roomId, userId);
  const data = await chatMessageService.listPins(roomId, userId);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * GET /api/v1/chat-rooms/:roomId/messages/search
 * 搜尋訊息
 */
export const searchMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId } = req.params as unknown as ChatRoomIdParams;
  await chatAclService.resolveRoomAccess(roomId, userId);
  const { q } = req.query as unknown as ChatSearchQuery;
  const data = await chatMessageService.search(roomId, q);
  res.status(200).json(createSuccessResponse(data));
});

/**
 * PUT /api/v1/chat-rooms/:roomId/read
 * 標記已讀
 */
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { roomId } = req.params as unknown as ChatRoomIdParams;
  await chatAclService.resolveRoomAccess(roomId, userId);
  const { lastReadMessageId } = req.body as MarkChatRoomReadInput;
  const data = await chatRoomService.markRead(roomId, userId, lastReadMessageId);
  res.status(200).json(createSuccessResponse(data));
});
