/**
 * daodao#250 regression：GET /users/:userId/followers|following 對非 UUID 的 userId
 * 以前會一路走到 Prisma 爆 500，error.message 帶出 Prisma invocation 與 /app/dist 絕對路徑。
 * 這裡用真的 validate middleware 與 globalErrorHandler，只 mock service。
 */
import '../config/openapi-registry';
import express from 'express';
import request from 'supertest';
import { globalErrorHandler, NotFoundError } from '../middleware/error.middleware';

const pagination = { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20, hasNext: false, hasPrev: false };
const emptyPage = { success: true, data: [], pagination, timestamp: new Date().toISOString() };

const followService = {
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
};

jest.mock('../services/follow.service', () => ({ followService }));

import { userFollowRouter } from '../routes/follow.routes';

const app = express();
app.use('/api/v1/users', userFollowRouter);
app.use(globalErrorHandler);

const INTERNAL_DETAIL = /prisma|invocation|\/app\/|\.js:\d|Inconsistent column data|stack/i;
const EXISTING_UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const MISSING_UUID = '00000000-0000-4000-8000-000000000000';

describe.each(['followers', 'following'] as const)('GET /api/v1/users/:userId/%s — daodao#250', (list) => {
  beforeEach(() => {
    followService.getFollowers.mockReset().mockResolvedValue(emptyPage);
    followService.getFollowing.mockReset().mockResolvedValue(emptyPage);
  });

  it.each(['no-such-user', '123', 'abc%20def'])('非 UUID userId「%s」→ 400，訊息不含內部資訊，且不呼叫 service', async (badId) => {
    const res = await request(app).get(`/api/v1/users/${badId}/${list}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.text).not.toMatch(INTERNAL_DETAIL);
    expect(followService.getFollowers).not.toHaveBeenCalled();
    expect(followService.getFollowing).not.toHaveBeenCalled();
  });

  it('合法 UUID 且存在 → 200（不回歸）', async () => {
    const res = await request(app).get(`/api/v1/users/${EXISTING_UUID}/${list}`).expect(200);

    expect(res.body.success).toBe(true);
    const called = list === 'followers' ? followService.getFollowers : followService.getFollowing;
    expect(called).toHaveBeenCalledWith(EXISTING_UUID, 1, 20);
  });

  it('合法 UUID 但不存在 → 404（不回歸）', async () => {
    const notFound = new NotFoundError(`user 不存在: ${MISSING_UUID}`);
    followService.getFollowers.mockRejectedValue(notFound);
    followService.getFollowing.mockRejectedValue(notFound);

    const res = await request(app).get(`/api/v1/users/${MISSING_UUID}/${list}`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe(`user 不存在: ${MISSING_UUID}`);
  });
});
