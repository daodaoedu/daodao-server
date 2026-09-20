/** HTTP response contracts for follow routes: social graph scoping, no PII in follower info. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  followActionApiResponseSchema,
  followListApiResponseSchema,
  followingListApiResponseSchema
} from '../validators/follow.validators';

const sensitiveEmail = 'follower-secret@hidden.com';


const mockFollowItem = {
  userId: 101,
  externalId: 'follower-uuid-001',
  nickname: '學習者小明',
  followedAt: '2024-01-20T10:00:00.000Z'
};

// getFollowing 回的是 FollowingItem（targetType 分流 user／practice），不是 followers 的 FollowUserItem——
// daodao#238：controller 拿 followers schema 驗 following 回應，有關注就 400
const mockFollowingItems = [
  {
    targetType: 'user',
    user: { id: 'target-user-uuid', name: '被關注的人', photoURL: null, bio: '一句話簡介', identifier: 'custom-id' }
  },
  {
    targetType: 'practice',
    practice: { id: 'practice-uuid', title: '每天寫一點', ownerName: '主題主人', ownerPhotoURL: 'https://cdn.example/p.png' }
  }
];

const followService = {
  followUser: jest.fn().mockResolvedValue({ success: true, data: { message: '關注成功' }, timestamp: new Date().toISOString() }),
  followPractice: jest.fn().mockResolvedValue({ success: true, data: { message: '關注成功' }, timestamp: new Date().toISOString() }),
  unfollowUser: jest.fn().mockResolvedValue({ success: true, data: { message: '已取消關注' }, timestamp: new Date().toISOString() }),
  unfollowPractice: jest.fn().mockResolvedValue({ success: true, data: { message: '已取消關注' }, timestamp: new Date().toISOString() }),
  checkFollowStatus: jest.fn().mockResolvedValue({ success: true, data: { isFollowing: true }, timestamp: new Date().toISOString() }),
  getFollowers: jest.fn().mockResolvedValue({ success: true, data: [mockFollowItem], timestamp: new Date().toISOString() }),
  getFollowing: jest.fn().mockResolvedValue({ success: true, data: mockFollowingItems, timestamp: new Date().toISOString() })
};

jest.mock('../services/follow.service', () => ({ followService }));

jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid' } as Request['user'];
    next();
  }
}));
jest.mock('../middleware/validation.middleware', () => ({
  validate: () => (_req: Request, _res: Response, next: NextFunction): void => next()
}));

import followRouter, { userFollowRouter } from '../routes/follow.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/follows', followRouter);
app.use('/api/v1/users', userFollowRouter);
app.use(globalErrorHandler);

describe('follow response contracts', () => {
  it('validates follow action response against followActionApiResponseSchema', async () => {
    const res = await request(app)
      .post('/api/v1/follows')
      .send({ targetType: 'user', targetId: 'target-uuid' })
      .expect(201);
    expect(() => followActionApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.message).toBeDefined();
  });

  it('validates unfollow response against followActionApiResponseSchema', async () => {
    const res = await request(app)
      .delete('/api/v1/follows/user/target-uuid')
      .expect(200);
    expect(() => followActionApiResponseSchema.parse(res.body)).not.toThrow();
  });

  it('validates followers list against followListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/users/user-uuid/followers').expect(200);
    expect(() => followListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data[0].externalId).toBe('follower-uuid-001');
    expect(res.body.data[0].nickname).toBeDefined();
  });

  it('validates following list (user + practice targets) against followingListApiResponseSchema', async () => {
    // daodao#238 regression：service 回 FollowingItem 形狀時 controller 必須放行，不能 400
    const res = await request(app).get('/api/v1/users/user-uuid/following').expect(200);
    expect(() => followingListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ targetType: 'user', user: { id: 'target-user-uuid', name: '被關注的人' } });
    expect(res.body.data[1]).toMatchObject({ targetType: 'practice', practice: { id: 'practice-uuid', title: '每天寫一點' } });
  });

  it('rejects followers-shaped items under followingListApiResponseSchema (schemas must not be interchangeable)', () => {
    const followersShaped = { success: true, data: [mockFollowItem], timestamp: new Date().toISOString() };
    expect(() => followingListApiResponseSchema.parse(followersShaped)).toThrow();
    // 反向也成立：FollowingItem 塞進 followers schema 要 fail
    const followingShaped = { success: true, data: mockFollowingItems, timestamp: new Date().toISOString() };
    expect(() => followListApiResponseSchema.parse(followingShaped)).toThrow();
  });

  it('rejects a following item whose payload does not match its targetType', () => {
    const mismatched = { success: true, data: [{ targetType: 'user', practice: mockFollowingItems[1].practice }], timestamp: new Date().toISOString() };
    expect(() => followingListApiResponseSchema.parse(mismatched)).toThrow();
  });

  it('never leaks email or sensitive PII in follower items', async () => {
    const res = await request(app).get('/api/v1/users/user-uuid/followers').expect(200);
    expect(res.text).not.toContain(sensitiveEmail);
    expect(res.text).not.toContain('password');
    expect(res.text).not.toContain('birthDay');
    const item = res.body.data[0];
    expect(item).not.toHaveProperty('email');
    expect(item).not.toHaveProperty('password');
    expect(item).not.toHaveProperty('contactList');
  });
});
