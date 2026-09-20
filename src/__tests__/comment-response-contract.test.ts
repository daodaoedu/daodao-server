/** HTTP response contracts for comment routes: user info scope, recursive replies, field leakage. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';

const sensitiveEmail = 'commenter@secret.com';
const internalDbId = 77889900;

const mockCommentUser = {
  id: 'user-ext-uuid-001',
  name: '留言者',
  roleList: ['normal_student'],
  photoURL: 'https://example.com/avatar.jpg',
  customId: 'commenter123'
};

const mockComment = {
  id: 101,
  userId: 42,
  targetId: 'target-uuid-001',
  targetType: 'practice',
  content: '很棒的實踐！',
  visibility: 'public',
  createdAt: new Date('2024-06-01T10:00:00Z'),
  updatedAt: new Date('2024-06-01T10:00:00Z'),
  parent_id: null,
  user: mockCommentUser,
  replies: []
};

const mockMentionCandidate = {
  userId: 'user-ext-uuid-002',
  numericUserId: 43,
  name: '被提及者',
  photoURL: null,
  customId: null
};

const commentServiceMock = {
  createComment: jest.fn().mockResolvedValue({
    success: true, data: mockComment, timestamp: new Date().toISOString()
  }),
  getComments: jest.fn().mockResolvedValue({
    success: true, data: [mockComment], timestamp: new Date().toISOString()
  }),
  getMentionCandidates: jest.fn().mockResolvedValue({
    success: true, data: [mockMentionCandidate], timestamp: new Date().toISOString()
  }),
  getCommentDetail: jest.fn().mockResolvedValue({
    success: true, data: mockComment, timestamp: new Date().toISOString()
  }),
  updateComment: jest.fn().mockResolvedValue({
    success: true, data: mockComment, timestamp: new Date().toISOString()
  }),
  deleteComment: jest.fn().mockResolvedValue({
    success: true, data: { message: 'Comment deleted', id: 101 }, timestamp: new Date().toISOString()
  })
};

jest.mock('../services/comment.service', () => ({
  commentService: commentServiceMock
}));
jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'user-ext-uuid-001' } as Request['user']; next();
  },
  optionalAuth: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'user-ext-uuid-001' } as Request['user']; next();
  }
}));

import router from '../routes/comment.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/comments', router);
app.use(globalErrorHandler);

beforeEach(() => jest.clearAllMocks());

describe('comment list (GET /comments)', () => {
  it('returns a valid comment list response with success envelope', async () => {
    const res = await request(app)
      .get('/api/v1/comments?targetType=post&targetId=target-uuid-001')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('content');
    expect(res.body.data[0]).toHaveProperty('replies');
  });

  it('includes user info scoped to commentUserSchema (id, name, roleList, photoURL, customId only)', async () => {
    const res = await request(app)
      .get('/api/v1/comments?targetType=post&targetId=target-uuid-001')
      .expect(200);
    const user = res.body.data[0].user;
    expect(user.id).toBe('user-ext-uuid-001');
    expect(user.name).toBe('留言者');
    expect(user.customId).toBe('commenter123');
    expect(user).not.toHaveProperty('email');
    expect(user).not.toHaveProperty('birthDay');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('loginCount');
  });

  it('serializes dates as ISO strings in HTTP response', async () => {
    const res = await request(app)
      .get('/api/v1/comments?targetType=post&targetId=target-uuid-001')
      .expect(200);
    const comment = res.body.data[0];
    expect(typeof comment.createdAt).toBe('string');
    expect(comment.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('comment detail (GET /comments/:commentId)', () => {
  it('returns single comment with expected fields', async () => {
    const res = await request(app)
      .get('/api/v1/comments/101')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(101);
    expect(res.body.data.content).toBe('很棒的實踐！');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data).toHaveProperty('replies');
  });
});

describe('mention candidates (GET /comments/mention-candidates)', () => {
  it('returns mention candidates with expected fields', async () => {
    const res = await request(app)
      .get('/api/v1/comments/mention-candidates?targetType=post&targetId=target-uuid-001')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toEqual(expect.objectContaining({
      userId: 'user-ext-uuid-002',
      name: '被提及者'
    }));
  });
});

describe('comment deletion (DELETE /comments/:commentId)', () => {
  it('returns delete response with message', async () => {
    const res = await request(app)
      .delete('/api/v1/comments/101')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('message');
  });
});

describe('field leakage prevention', () => {
  it('never leaks email or internal database ID sentinels in comment responses', async () => {
    const commentWithLeak = {
      ...mockComment,
      user: { ...mockCommentUser, email: sensitiveEmail, internalId: internalDbId }
    };
    commentServiceMock.getComments.mockResolvedValue({
      success: true, data: [commentWithLeak], timestamp: new Date().toISOString()
    });
    const res = await request(app)
      .get('/api/v1/comments?targetType=post&targetId=target-uuid-001')
      .expect(200);
    expect(res.text).not.toContain(sensitiveEmail);
    expect(res.text).not.toContain(String(internalDbId));
  });
});
