import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

let currentUserId = 7;

jest.mock('@/config/openapi-registry', () => {
  const { extendZodWithOpenApi } = jest.requireActual('@asteasolutions/zod-to-openapi');
  const { z } = jest.requireActual('zod');
  extendZodWithOpenApi(z);
  return { registry: { registerPath: jest.fn() } };
});

jest.mock('@/middleware/auth', () => ({
  authenticateAny: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '需要登入' } });
      return;
    }
    req.user = { id: currentUserId } as never;
    next();
  },
  authenticate: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '需要登入' } });
      return;
    }
    req.user = { id: currentUserId } as never;
    next();
  },
}));

jest.mock('@/middleware/rate-limit.middleware', () => ({
  createLimiter: (_req: Request, _res: Response, next: NextFunction): void => next(),
}));

const aclService = {
  resolveRoomAccess: jest.fn(),
  listHostUserIds: jest.fn(),
};
jest.mock('@/services/chat-acl.service', () => ({ chatAclService: aclService }));

const roomService = {
  ensureRoom: jest.fn(),
  appendSystemMessage: jest.fn(),
  listMyRooms: jest.fn(),
  getRoom: jest.fn(),
  listMembers: jest.fn(),
  markRead: jest.fn(),
};
jest.mock('@/services/chat-room.service', () => ({ chatRoomService: roomService }));

const messageService = {
  listPage: jest.fn(),
  listDelta: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  like: jest.fn(),
  unlike: jest.fn(),
  pin: jest.fn(),
  unpin: jest.fn(),
  listPins: jest.fn(),
  search: jest.fn(),
};
jest.mock('@/services/chat-message.service', () => ({ chatMessageService: messageService }));

const presenceService = {
  touch: jest.fn(),
  getOnlineSet: jest.fn(),
};
jest.mock('@/services/chat-presence.service', () => ({ chatPresenceService: presenceService }));

import { meChatRoomRoutes, chatRoomRoutes } from '@/routes/chat-room.routes';
import { BadRequestError, ForbiddenError, globalErrorHandler, NotFoundError } from '@/middleware/error.middleware';
import { registry } from '@/config/openapi-registry';
import type { ZodTypeAny } from 'zod';

// registerPath 是 module 載入時呼叫的；beforeEach 的 clearAllMocks 會清掉 mock.calls，所以先存下來
type RegisteredPath = {
  method: string;
  path: string;
  responses: Record<string, { content?: { 'application/json'?: { schema: ZodTypeAny } } }>;
};
const registeredPaths: RegisteredPath[] = (registry.registerPath as jest.Mock).mock.calls.map(
  ([config]) => config as RegisteredPath,
);
const documentedSchema = (method: string, path: string, status: number): ZodTypeAny => {
  const entry = registeredPaths.find((p) => p.method === method && p.path === path);
  const schema = entry?.responses[String(status)]?.content?.['application/json']?.schema;
  if (!schema) throw new Error(`OpenAPI 未登記 ${method.toUpperCase()} ${path} ${status}`);
  return schema;
};

// ─── Mock data ───────────────────────────────────────────

const mockAccess = { roomId: 1, cohortId: 10, isMember: true, isHost: false };
const mockHostAccess = { roomId: 1, cohortId: 10, isMember: true, isHost: true };

const mockRoomList = {
  totalUnread: 3,
  items: [{
    id: 1, cohortId: 10, name: '測試期', iconLabel: '測', colorSeed: 1,
    organizationName: '測試組織', memberCount: 5, unreadCount: 3,
    lastMessage: null, lastActivityAt: '2026-09-01T00:00:00.000Z',
  }],
};

const mockRoomDetail = {
  ...mockRoomList.items[0], viewerRole: 'member' as const, viewerUserId: 7, pinnedCount: 1,
  memberPreview: [{ nickname: '島民A', avatar: null }],
};

const mockMessage = {
  id: 100, roomId: 1, kind: 'text', body: '你好', metadata: null,
  author: { userId: 7, nickname: '測試', avatar: null, isHost: false },
  replyTo: null, likeCount: 0, likedByMe: false, isPinned: false,
  pinnedAt: null, editedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
};

const mockPage = {
  items: [mockMessage],
  nextCursor: null,
  hasMore: false,
};

const mockDelta = {
  messages: [mockMessage], changed: [], deletedIds: [],
  pinnedCount: 0, memberCount: 5, serverTime: '2026-09-01T00:00:05.000Z',
};

const mockMembers = [
  { userId: 7, nickname: '島民A', avatar: null, isHost: false, isOnline: true, bio: null },
  { userId: 8, nickname: '帶領人', avatar: null, isHost: true, isOnline: false, bio: '你好' },
];

const mockLikeResponse = { likeCount: 1, likedByMe: true };
const mockUnlikeResponse = { likeCount: 0, likedByMe: false };
const mockReadResponse = { lastReadMessageId: 100, unreadCount: 0 };
const mockSearchResponse = { total: 1, items: [{ id: 100, createdAt: '2026-09-01T00:00:00.000Z' }] };

// ─── Setup ───────────────────────────────────────────────

const auth = { Authorization: 'Bearer test' };

describe('chat room routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/me/chat-rooms', meChatRoomRoutes);
  app.use('/api/v1/chat-rooms', chatRoomRoutes);
  app.use(globalErrorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    currentUserId = 7;
    aclService.resolveRoomAccess.mockResolvedValue(mockAccess);
    roomService.listMyRooms.mockResolvedValue(mockRoomList);
    roomService.getRoom.mockResolvedValue(mockRoomDetail);
    roomService.listMembers.mockResolvedValue(mockMembers);
    roomService.markRead.mockResolvedValue(mockReadResponse);
    messageService.listPage.mockResolvedValue(mockPage);
    messageService.listDelta.mockResolvedValue(mockDelta);
    messageService.create.mockResolvedValue(mockMessage);
    messageService.update.mockResolvedValue({ ...mockMessage, body: '修改後', editedAt: '2026-09-01T00:01:00.000Z' });
    messageService.remove.mockResolvedValue(undefined);
    messageService.like.mockResolvedValue(mockLikeResponse);
    messageService.unlike.mockResolvedValue(mockUnlikeResponse);
    messageService.pin.mockResolvedValue({ ...mockMessage, isPinned: true, pinnedAt: '2026-09-01T00:02:00.000Z' });
    messageService.unpin.mockResolvedValue({ ...mockMessage, isPinned: false, pinnedAt: null });
    messageService.listPins.mockResolvedValue([{ ...mockMessage, isPinned: true }]);
    messageService.search.mockResolvedValue(mockSearchResponse);
    presenceService.touch.mockResolvedValue(undefined);
  });

  // ─── Auth ──────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 for all endpoints without auth', async () => {
      const endpoints = [
        () => request(app).get('/api/v1/me/chat-rooms'),
        () => request(app).get('/api/v1/chat-rooms/1'),
        () => request(app).get('/api/v1/chat-rooms/1/members'),
        () => request(app).get('/api/v1/chat-rooms/1/messages'),
        () => request(app).post('/api/v1/chat-rooms/1/messages').send({ body: 'hi' }),
        () => request(app).patch('/api/v1/chat-rooms/1/messages/100').send({ body: 'edit' }),
        () => request(app).delete('/api/v1/chat-rooms/1/messages/100'),
        () => request(app).put('/api/v1/chat-rooms/1/messages/100/like'),
        () => request(app).delete('/api/v1/chat-rooms/1/messages/100/like'),
        () => request(app).put('/api/v1/chat-rooms/1/messages/100/pin'),
        () => request(app).delete('/api/v1/chat-rooms/1/messages/100/pin'),
        () => request(app).get('/api/v1/chat-rooms/1/pins'),
        () => request(app).get('/api/v1/chat-rooms/1/messages/search').query({ q: 'test' }),
        () => request(app).put('/api/v1/chat-rooms/1/read').send({ lastReadMessageId: 1 }),
      ];
      for (const ep of endpoints) {
        const res = await ep();
        expect(res.status).toBe(401);
      }
    });
  });

  // ─── GET /me/chat-rooms ────────────────────────────────

  describe('GET /me/chat-rooms', () => {
    it('returns room list with totalUnread', async () => {
      const res = await request(app).get('/api/v1/me/chat-rooms').set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.totalUnread).toBe(3);
      expect(res.body.data.items).toHaveLength(1);
      expect(roomService.listMyRooms).toHaveBeenCalledWith(7);
    });
  });

  // ─── GET /chat-rooms/:roomId ───────────────────────────

  describe('GET /chat-rooms/:roomId', () => {
    it('returns room detail', async () => {
      const res = await request(app).get('/api/v1/chat-rooms/1').set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.viewerRole).toBe('member');
      expect(res.body.data.viewerUserId).toBe(7);
      expect(res.body.data.pinnedCount).toBe(1);
      expect(res.body.data.memberPreview).toHaveLength(1);
    });

    it('returns 404 for non-existent room', async () => {
      aclService.resolveRoomAccess.mockRejectedValueOnce(new NotFoundError('找不到聊天室'));
      const res = await request(app).get('/api/v1/chat-rooms/999').set(auth);
      expect(res.status).toBe(404);
    });

    it('returns 403 for non-member', async () => {
      aclService.resolveRoomAccess.mockRejectedValueOnce(new ForbiddenError('無權限存取此聊天室'));
      const res = await request(app).get('/api/v1/chat-rooms/1').set(auth);
      expect(res.status).toBe(403);
    });
  });

  // ─── GET /chat-rooms/:roomId/members ───────────────────

  describe('GET /chat-rooms/:roomId/members', () => {
    it('returns member list with presence', async () => {
      const res = await request(app).get('/api/v1/chat-rooms/1/members').set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].isOnline).toBe(true);
      expect(res.body.data[1].isHost).toBe(true);
    });
  });

  // ─── GET /chat-rooms/:roomId/messages ──────────────────

  describe('GET /chat-rooms/:roomId/messages', () => {
    it('returns history page when no after/since', async () => {
      const res = await request(app).get('/api/v1/chat-rooms/1/messages').set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
      expect(messageService.listPage).toHaveBeenCalled();
    });

    it('returns history page with before cursor', async () => {
      const res = await request(app).get('/api/v1/chat-rooms/1/messages').query({ before: 200, limit: 20 }).set(auth);
      expect(res.status).toBe(200);
      expect(messageService.listPage).toHaveBeenCalledWith(1, 7, 200, 20);
    });

    it('returns delta when after+since provided', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages')
        .query({ after: 50, since: '2026-09-01T00:00:00.000Z' })
        .set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(1);
      expect(res.body.data.serverTime).toBeDefined();
      expect(messageService.listDelta).toHaveBeenCalledWith(1, 7, 50, '2026-09-01T00:00:00.000Z');
    });

    // daodao#154 regression：聊天室還沒有訊息時，前端用 after=0 輪詢，不能被 400 擋掉
    it('returns delta when after=0 (room has no messages yet)', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages')
        .query({ after: 0, since: '2026-09-01T00:00:00.000Z' })
        .set(auth);
      expect(res.status).toBe(200);
      expect(messageService.listDelta).toHaveBeenCalledWith(1, 7, 0, '2026-09-01T00:00:00.000Z');
      expect(presenceService.touch).toHaveBeenCalledWith(1, 7);
    });

    it('returns 400 when after is negative', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages')
        .query({ after: -1, since: '2026-09-01T00:00:00.000Z' })
        .set(auth);
      expect(res.status).toBe(400);
    });

    it('returns 400 when before is combined with after=0', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages')
        .query({ before: 100, after: 0 })
        .set(auth);
      expect(res.status).toBe(400);
    });

    it('calls presence.touch in delta mode', async () => {
      await request(app)
        .get('/api/v1/chat-rooms/1/messages')
        .query({ after: 50, since: '2026-09-01T00:00:00.000Z' })
        .set(auth);
      expect(presenceService.touch).toHaveBeenCalledWith(1, 7);
    });

    it('returns 400 when both before and after are provided', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages')
        .query({ before: 100, after: 50 })
        .set(auth);
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /chat-rooms/:roomId/messages ─────────────────

  describe('POST /chat-rooms/:roomId/messages', () => {
    it('creates a message with 201', async () => {
      const res = await request(app)
        .post('/api/v1/chat-rooms/1/messages')
        .set(auth)
        .send({ body: '你好' });
      expect(res.status).toBe(201);
      expect(res.body.data.body).toBe('你好');
      expect(messageService.create).toHaveBeenCalledWith(mockAccess, 7, '你好', undefined);
    });

    it('creates a message with replyToMessageId', async () => {
      await request(app)
        .post('/api/v1/chat-rooms/1/messages')
        .set(auth)
        .send({ body: '回覆你', replyToMessageId: 42 });
      expect(messageService.create).toHaveBeenCalledWith(mockAccess, 7, '回覆你', 42);
    });

    it('returns 400 for empty body', async () => {
      const res = await request(app)
        .post('/api/v1/chat-rooms/1/messages')
        .set(auth)
        .send({ body: '' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for body exceeding max length', async () => {
      const res = await request(app)
        .post('/api/v1/chat-rooms/1/messages')
        .set(auth)
        .send({ body: 'x'.repeat(2001) });
      expect(res.status).toBe(400);
    });

    it('returns 400 when replying to message in another room', async () => {
      messageService.create.mockRejectedValueOnce(new BadRequestError('引用的訊息不存在於此聊天室'));
      const res = await request(app)
        .post('/api/v1/chat-rooms/1/messages')
        .set(auth)
        .send({ body: '回覆', replyToMessageId: 999 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when replying to system message', async () => {
      messageService.create.mockRejectedValueOnce(new BadRequestError('不可引用系統訊息'));
      const res = await request(app)
        .post('/api/v1/chat-rooms/1/messages')
        .set(auth)
        .send({ body: '回覆', replyToMessageId: 50 });
      expect(res.status).toBe(400);
    });
  });

  // ─── PATCH /chat-rooms/:roomId/messages/:messageId ─────

  describe('PATCH /chat-rooms/:roomId/messages/:messageId', () => {
    it('edits a message', async () => {
      const res = await request(app)
        .patch('/api/v1/chat-rooms/1/messages/100')
        .set(auth)
        .send({ body: '修改後' });
      expect(res.status).toBe(200);
      expect(res.body.data.body).toBe('修改後');
      expect(res.body.data.editedAt).not.toBeNull();
    });

    it('returns 403 when editing another user message', async () => {
      messageService.update.mockRejectedValueOnce(new ForbiddenError('僅可編輯自己的訊息'));
      const res = await request(app)
        .patch('/api/v1/chat-rooms/1/messages/101')
        .set(auth)
        .send({ body: '偷改' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when editing system message', async () => {
      messageService.update.mockRejectedValueOnce(new BadRequestError('僅可編輯文字訊息'));
      const res = await request(app)
        .patch('/api/v1/chat-rooms/1/messages/50')
        .set(auth)
        .send({ body: '改系統訊息' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty body', async () => {
      const res = await request(app)
        .patch('/api/v1/chat-rooms/1/messages/100')
        .set(auth)
        .send({ body: '' });
      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE /chat-rooms/:roomId/messages/:messageId ────

  describe('DELETE /chat-rooms/:roomId/messages/:messageId', () => {
    it('deletes own message with 204', async () => {
      const res = await request(app)
        .delete('/api/v1/chat-rooms/1/messages/100')
        .set(auth);
      expect(res.status).toBe(204);
      expect(messageService.remove).toHaveBeenCalledWith(mockAccess, 100, 7, false);
    });

    it('host can delete others message', async () => {
      aclService.resolveRoomAccess.mockResolvedValueOnce(mockHostAccess);
      const res = await request(app)
        .delete('/api/v1/chat-rooms/1/messages/101')
        .set(auth);
      expect(res.status).toBe(204);
      expect(messageService.remove).toHaveBeenCalledWith(mockHostAccess, 101, 7, true);
    });

    it('returns 403 for non-owner non-host', async () => {
      messageService.remove.mockRejectedValueOnce(new ForbiddenError('無權刪除此訊息'));
      const res = await request(app)
        .delete('/api/v1/chat-rooms/1/messages/101')
        .set(auth);
      expect(res.status).toBe(403);
    });
  });

  // ─── Like ──────────────────────────────────────────────

  describe('PUT/DELETE /chat-rooms/:roomId/messages/:messageId/like', () => {
    it('likes a message', async () => {
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/messages/100/like')
        .set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.likeCount).toBe(1);
      expect(res.body.data.likedByMe).toBe(true);
    });

    it('unlikes a message', async () => {
      const res = await request(app)
        .delete('/api/v1/chat-rooms/1/messages/100/like')
        .set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.likeCount).toBe(0);
      expect(res.body.data.likedByMe).toBe(false);
    });

    it('returns 400 for liking system message', async () => {
      messageService.like.mockRejectedValueOnce(new BadRequestError('不可對系統訊息按讚'));
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/messages/50/like')
        .set(auth);
      expect(res.status).toBe(400);
    });
  });

  // ─── Pin ───────────────────────────────────────────────

  describe('PUT/DELETE /chat-rooms/:roomId/messages/:messageId/pin', () => {
    it('host pins a message', async () => {
      aclService.resolveRoomAccess.mockResolvedValueOnce(mockHostAccess);
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/messages/100/pin')
        .set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.isPinned).toBe(true);
    });

    it('host unpins a message', async () => {
      aclService.resolveRoomAccess.mockResolvedValueOnce(mockHostAccess);
      const res = await request(app)
        .delete('/api/v1/chat-rooms/1/messages/100/pin')
        .set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.isPinned).toBe(false);
    });

    it('returns 403 for non-host pin', async () => {
      messageService.pin.mockRejectedValueOnce(new ForbiddenError('僅帶領人可置頂訊息'));
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/messages/100/pin')
        .set(auth);
      expect(res.status).toBe(403);
    });

    it('returns 400 for pinning deleted message', async () => {
      aclService.resolveRoomAccess.mockResolvedValueOnce(mockHostAccess);
      messageService.pin.mockRejectedValueOnce(new BadRequestError('不可置頂已刪除的訊息'));
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/messages/100/pin')
        .set(auth);
      expect(res.status).toBe(400);
    });

    it('returns 400 for pinning system message', async () => {
      aclService.resolveRoomAccess.mockResolvedValueOnce(mockHostAccess);
      messageService.pin.mockRejectedValueOnce(new BadRequestError('不可置頂系統訊息'));
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/messages/50/pin')
        .set(auth);
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /chat-rooms/:roomId/pins ──────────────────────

  describe('GET /chat-rooms/:roomId/pins', () => {
    it('returns pinned messages', async () => {
      const res = await request(app).get('/api/v1/chat-rooms/1/pins').set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].isPinned).toBe(true);
    });
  });

  // ─── GET /chat-rooms/:roomId/messages/search ───────────

  describe('GET /chat-rooms/:roomId/messages/search', () => {
    it('returns search results', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages/search')
        .query({ q: '你好' })
        .set(auth);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('returns 400 for empty query', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages/search')
        .query({ q: '' })
        .set(auth);
      expect(res.status).toBe(400);
    });

    it('returns 400 for query exceeding 100 chars', async () => {
      const res = await request(app)
        .get('/api/v1/chat-rooms/1/messages/search')
        .query({ q: 'x'.repeat(101) })
        .set(auth);
      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /chat-rooms/:roomId/read ──────────────────────

  describe('PUT /chat-rooms/:roomId/read', () => {
    it('marks room as read', async () => {
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/read')
        .set(auth)
        .send({ lastReadMessageId: 100 });
      expect(res.status).toBe(200);
      expect(res.body.data.lastReadMessageId).toBe(100);
      expect(res.body.data.unreadCount).toBe(0);
      expect(roomService.markRead).toHaveBeenCalledWith(1, 7, 100);
    });

    it('returns 400 for invalid lastReadMessageId', async () => {
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/read')
        .set(auth)
        .send({ lastReadMessageId: -1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing lastReadMessageId', async () => {
      const res = await request(app)
        .put('/api/v1/chat-rooms/1/read')
        .set(auth)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ─── ACL error propagation ─────────────────────────────

  describe('ACL error propagation', () => {
    it('returns 404 for challenge cohort room', async () => {
      aclService.resolveRoomAccess.mockRejectedValue(new NotFoundError('找不到聊天室'));
      const res = await request(app).get('/api/v1/chat-rooms/99').set(auth);
      expect(res.status).toBe(404);
    });

    it('returns 403 for non-member across all room endpoints', async () => {
      aclService.resolveRoomAccess.mockRejectedValue(new ForbiddenError('無權限存取此聊天室'));
      const endpoints = [
        () => request(app).get('/api/v1/chat-rooms/1').set(auth),
        () => request(app).get('/api/v1/chat-rooms/1/members').set(auth),
        () => request(app).get('/api/v1/chat-rooms/1/messages').set(auth),
        () => request(app).post('/api/v1/chat-rooms/1/messages').set(auth).send({ body: 'hi' }),
        () => request(app).patch('/api/v1/chat-rooms/1/messages/100').set(auth).send({ body: 'edit' }),
        () => request(app).delete('/api/v1/chat-rooms/1/messages/100').set(auth),
        () => request(app).put('/api/v1/chat-rooms/1/messages/100/like').set(auth),
        () => request(app).put('/api/v1/chat-rooms/1/read').set(auth).send({ lastReadMessageId: 1 }),
      ];
      for (const ep of endpoints) {
        const res = await ep();
        expect(res.status).toBe(403);
      }
    });
  });

  // ─── Param validation ──────────────────────────────────

  describe('param validation', () => {
    it('returns 400 for non-numeric roomId', async () => {
      const res = await request(app).get('/api/v1/chat-rooms/abc').set(auth);
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative roomId', async () => {
      const res = await request(app).get('/api/v1/chat-rooms/-1').set(auth);
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-numeric messageId', async () => {
      const res = await request(app).delete('/api/v1/chat-rooms/1/messages/abc').set(auth);
      expect(res.status).toBe(400);
    });
  });
  // ─── OpenAPI 文件 vs 實際回應（daodao#154 regression）──
  // f2e 的型別由 OpenAPI 產生；文件少了 { success, data } 外層時，前端會讀錯層級而整個聊天畫面空白

  describe('OpenAPI response contract matches wire body', () => {
    const cases: Array<{ name: string; method: string; path: string; status: number; send: () => request.Test }> = [
      { name: 'room list', method: 'get', path: '/api/v1/me/chat-rooms', status: 200, send: () => request(app).get('/api/v1/me/chat-rooms').set(auth) },
      { name: 'room detail', method: 'get', path: '/api/v1/chat-rooms/{roomId}', status: 200, send: () => request(app).get('/api/v1/chat-rooms/1').set(auth) },
      { name: 'members', method: 'get', path: '/api/v1/chat-rooms/{roomId}/members', status: 200, send: () => request(app).get('/api/v1/chat-rooms/1/members').set(auth) },
      { name: 'history page', method: 'get', path: '/api/v1/chat-rooms/{roomId}/messages', status: 200, send: () => request(app).get('/api/v1/chat-rooms/1/messages').set(auth) },
      { name: 'delta', method: 'get', path: '/api/v1/chat-rooms/{roomId}/messages', status: 200, send: () => request(app).get('/api/v1/chat-rooms/1/messages').query({ after: 50, since: '2026-09-01T00:00:00.000Z' }).set(auth) },
      { name: 'send message', method: 'post', path: '/api/v1/chat-rooms/{roomId}/messages', status: 201, send: () => request(app).post('/api/v1/chat-rooms/1/messages').set(auth).send({ body: '你好' }) },
      { name: 'edit message', method: 'patch', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}', status: 200, send: () => request(app).patch('/api/v1/chat-rooms/1/messages/100').set(auth).send({ body: '修改後' }) },
      { name: 'like', method: 'put', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/like', status: 200, send: () => request(app).put('/api/v1/chat-rooms/1/messages/100/like').set(auth) },
      { name: 'unlike', method: 'delete', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/like', status: 200, send: () => request(app).delete('/api/v1/chat-rooms/1/messages/100/like').set(auth) },
      { name: 'pin', method: 'put', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/pin', status: 200, send: () => { aclService.resolveRoomAccess.mockResolvedValue(mockHostAccess); return request(app).put('/api/v1/chat-rooms/1/messages/100/pin').set(auth); } },
      { name: 'unpin', method: 'delete', path: '/api/v1/chat-rooms/{roomId}/messages/{messageId}/pin', status: 200, send: () => { aclService.resolveRoomAccess.mockResolvedValue(mockHostAccess); return request(app).delete('/api/v1/chat-rooms/1/messages/100/pin').set(auth); } },
      { name: 'pins', method: 'get', path: '/api/v1/chat-rooms/{roomId}/pins', status: 200, send: () => request(app).get('/api/v1/chat-rooms/1/pins').set(auth) },
      { name: 'search', method: 'get', path: '/api/v1/chat-rooms/{roomId}/messages/search', status: 200, send: () => request(app).get('/api/v1/chat-rooms/1/messages/search').query({ q: '你好' }).set(auth) },
      { name: 'mark read', method: 'put', path: '/api/v1/chat-rooms/{roomId}/read', status: 200, send: () => request(app).put('/api/v1/chat-rooms/1/read').set(auth).send({ lastReadMessageId: 100 }) },
    ];

    it.each(cases)('$name: documented $status schema accepts the actual body', async ({ method, path, status, send }) => {
      const res = await send();
      expect(res.status).toBe(status);
      const result = documentedSchema(method, path, status).safeParse(res.body);
      expect(result.error?.issues ?? []).toEqual([]);
      expect(result.success).toBe(true);
    });
  });
});
