/**
 * Chat Room Routes
 * 群組聊天路由 — meChatRoomRoutes (GET /api/v1/me/chat-rooms) + chatRoomRoutes (/api/v1/chat-rooms/:roomId/*)
 * 皆 authenticateAny，不掛 requireOnboardingComplete
 */

import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticateAny } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { createLimiter } from '../middleware/rate-limit.middleware';
import * as controller from '../controllers/chat-room.controller';
import {
  chatRoomIdParamsSchema,
  chatMessageIdParamsSchema,
  chatMessagesQuerySchema,
  chatSearchQuerySchema,
  createChatMessageSchema,
  updateChatMessageSchema,
  markChatRoomReadSchema,
  chatRoomListResponseSchema,
  chatRoomDetailSchema,
  chatMemberSchema,
  chatMessageSchema,
  chatMessageDeltaSchema,
  chatSearchResponseSchema,
  chatLikeResponseSchema,
  chatMarkReadResponseSchema,
} from '../validators/chat-room.validators';

const errors = {
  400: { $ref: '#/components/responses/BadRequestError' },
  401: { $ref: '#/components/responses/UnauthorizedError' },
  403: { $ref: '#/components/responses/ForbiddenError' },
  404: { $ref: '#/components/responses/NotFoundError' },
  409: { $ref: '#/components/responses/ConflictError' },
  500: { $ref: '#/components/responses/InternalServerError' },
} as const;

const security = [{ bearerAuth: [] }];

// ─── OpenAPI Registry ────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/api/v1/me/chat-rooms', tags: ['Chat'], summary: '我的聊天室列表',
  responses: { 200: { description: '聊天室列表', content: { 'application/json': { schema: chatRoomListResponseSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'get', path: '/api/v1/chat-rooms/{roomId}', tags: ['Chat'], summary: '聊天室詳情',
  request: { params: chatRoomIdParamsSchema },
  responses: { 200: { description: '聊天室詳情', content: { 'application/json': { schema: chatRoomDetailSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'get', path: '/api/v1/chat-rooms/{roomId}/members', tags: ['Chat'], summary: '聊天室成員列表',
  request: { params: chatRoomIdParamsSchema },
  responses: { 200: { description: '成員列表', content: { 'application/json': { schema: chatMemberSchema.array() } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'get', path: '/api/v1/chat-rooms/{roomId}/messages', tags: ['Chat'], summary: '歷史訊息（before 分頁）或增量輪詢（after+since）',
  request: { params: chatRoomIdParamsSchema, query: chatMessagesQuerySchema },
  responses: { 200: { description: '訊息列表或增量回應', content: { 'application/json': { schema: chatMessageDeltaSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'post', path: '/api/v1/chat-rooms/{roomId}/messages', tags: ['Chat'], summary: '發送訊息',
  request: { params: chatRoomIdParamsSchema, body: { content: { 'application/json': { schema: createChatMessageSchema } } } },
  responses: { 201: { description: '訊息已發送', content: { 'application/json': { schema: chatMessageSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'patch', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}', tags: ['Chat'], summary: '編輯訊息',
  request: { params: chatMessageIdParamsSchema, body: { content: { 'application/json': { schema: updateChatMessageSchema } } } },
  responses: { 200: { description: '訊息已編輯', content: { 'application/json': { schema: chatMessageSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'delete', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}', tags: ['Chat'], summary: '刪除訊息',
  request: { params: chatMessageIdParamsSchema },
  responses: { 204: { description: '訊息已刪除' }, ...errors },
  security,
});

registry.registerPath({
  method: 'put', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/like', tags: ['Chat'], summary: '按讚',
  request: { params: chatMessageIdParamsSchema },
  responses: { 200: { description: '按讚結果', content: { 'application/json': { schema: chatLikeResponseSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'delete', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/like', tags: ['Chat'], summary: '取消按讚',
  request: { params: chatMessageIdParamsSchema },
  responses: { 200: { description: '取消按讚結果', content: { 'application/json': { schema: chatLikeResponseSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'put', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/pin', tags: ['Chat'], summary: '置頂訊息',
  request: { params: chatMessageIdParamsSchema },
  responses: { 200: { description: '置頂結果', content: { 'application/json': { schema: chatMessageSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'delete', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/pin', tags: ['Chat'], summary: '取消置頂',
  request: { params: chatMessageIdParamsSchema },
  responses: { 200: { description: '取消置頂結果', content: { 'application/json': { schema: chatMessageSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'get', path: '/api/v1/chat-rooms/{roomId}/pins', tags: ['Chat'], summary: '置頂訊息列表',
  request: { params: chatRoomIdParamsSchema },
  responses: { 200: { description: '置頂訊息', content: { 'application/json': { schema: chatMessageSchema.array() } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'get', path: '/api/v1/chat-rooms/{roomId}/messages/search', tags: ['Chat'], summary: '搜尋訊息',
  request: { params: chatRoomIdParamsSchema, query: chatSearchQuerySchema },
  responses: { 200: { description: '搜尋結果', content: { 'application/json': { schema: chatSearchResponseSchema } } }, ...errors },
  security,
});

registry.registerPath({
  method: 'put', path: '/api/v1/chat-rooms/{roomId}/read', tags: ['Chat'], summary: '標記已讀',
  request: { params: chatRoomIdParamsSchema, body: { content: { 'application/json': { schema: markChatRoomReadSchema } } } },
  responses: { 200: { description: '已讀結果', content: { 'application/json': { schema: chatMarkReadResponseSchema } } }, ...errors },
  security,
});

// ─── me/chat-rooms router ────────────────────────────────

export const meChatRoomRoutes = Router();
meChatRoomRoutes.use(authenticateAny);
meChatRoomRoutes.get('/', controller.listMyRooms);

// ─── chat-rooms/:roomId/* router ─────────────────────────

export const chatRoomRoutes = Router({ mergeParams: true });
chatRoomRoutes.use(authenticateAny);

chatRoomRoutes.get('/:roomId', validate(chatRoomIdParamsSchema, 'params'), controller.getRoom);
chatRoomRoutes.get('/:roomId/members', validate(chatRoomIdParamsSchema, 'params'), controller.listMembers);
chatRoomRoutes.get('/:roomId/messages/search', validate(chatRoomIdParamsSchema, 'params'), validate(chatSearchQuerySchema, 'query'), controller.searchMessages);
chatRoomRoutes.get('/:roomId/messages', validate(chatRoomIdParamsSchema, 'params'), validate(chatMessagesQuerySchema, 'query'), controller.listMessages);
chatRoomRoutes.post('/:roomId/messages', validate(chatRoomIdParamsSchema, 'params'), createLimiter, validate(createChatMessageSchema), controller.createMessage);
chatRoomRoutes.patch('/:roomId/messages/:messageId', validate(chatMessageIdParamsSchema, 'params'), validate(updateChatMessageSchema), controller.updateMessage);
chatRoomRoutes.delete('/:roomId/messages/:messageId', validate(chatMessageIdParamsSchema, 'params'), controller.deleteMessage);
chatRoomRoutes.put('/:roomId/messages/:messageId/like', validate(chatMessageIdParamsSchema, 'params'), controller.likeMessage);
chatRoomRoutes.delete('/:roomId/messages/:messageId/like', validate(chatMessageIdParamsSchema, 'params'), controller.unlikeMessage);
chatRoomRoutes.put('/:roomId/messages/:messageId/pin', validate(chatMessageIdParamsSchema, 'params'), controller.pinMessage);
chatRoomRoutes.delete('/:roomId/messages/:messageId/pin', validate(chatMessageIdParamsSchema, 'params'), controller.unpinMessage);
chatRoomRoutes.get('/:roomId/pins', validate(chatRoomIdParamsSchema, 'params'), controller.listPins);
chatRoomRoutes.put('/:roomId/read', validate(chatRoomIdParamsSchema, 'params'), validate(markChatRoomReadSchema), controller.markRead);
