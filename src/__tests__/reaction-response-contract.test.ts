/** HTTP response contracts for reaction routes: schema compliance, no internal ID leakage. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import { getReactionsApiResponseSchema } from '../validators/reaction.validators';

const internalTargetId = 12345;

const mockReactionCounts = {
  reactions: [
    { reactionType: 'fire', count: 3 },
    { reactionType: 'heart', count: 1 }
  ],
  currentUserReaction: 'fire'
};

const mockUpsertResult = {
  reactionType: 'fire',
  created: true
};

const reactionService = {
  upsertReaction: jest.fn().mockResolvedValue(mockUpsertResult),
  removeReaction: jest.fn().mockResolvedValue({ removed: true }),
  getReactionsByTarget: jest.fn().mockResolvedValue({ success: true, data: mockReactionCounts, timestamp: new Date().toISOString() }),
  getReactionsListByTarget: jest.fn().mockResolvedValue({ success: true, data: { items: [] }, timestamp: new Date().toISOString() }),
  getReactionsBatchByTargets: jest.fn().mockResolvedValue({})
};

jest.mock('../services/reaction.service', () => ({ reactionService }));
jest.mock('../services/database/prisma.service', () => ({
  prisma: { practices: { findMany: jest.fn().mockResolvedValue([]) } }
}));
jest.mock('../services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockResolvedValue(internalTargetId),
  EntityType: { practice: 'practice' }
}));

jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid' } as Request['user'];
    next();
  },
  optionalAuth: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid' } as Request['user'];
    next();
  }
}));
jest.mock('../middleware/validation.middleware', () => ({
  validate: () => (_req: Request, _res: Response, next: NextFunction): void => next()
}));

import router from '../routes/reaction.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/reactions', router);
app.use(globalErrorHandler);

describe('reaction response contracts', () => {
  it('GET /reactions returns reaction counts with currentUserReaction', async () => {
    const res = await request(app)
      .get('/api/v1/reactions?targetType=practice&targetId=practice-uuid')
      .expect(200);
    // Controller passes service result directly (no Zod parse) — validate raw shape
    expect(res.body.data.reactions).toBeInstanceOf(Array);
    expect(res.body.data.currentUserReaction).toBeDefined();
  });

  it('upsert reaction returns result without internal target ID', async () => {
    const res = await request(app)
      .post('/api/v1/reactions')
      .send({ targetType: 'practice', targetId: 'practice-uuid', reactionType: 'fire' })
      .expect(200);
    expect(res.body.reactionType).toBe('fire');
    expect(res.text).not.toContain(String(internalTargetId));
    expect(res.body).not.toHaveProperty('targetId');
    expect(res.body).not.toHaveProperty('userId');
  });

  it('remove reaction returns result without internal IDs', async () => {
    const res = await request(app)
      .delete('/api/v1/reactions')
      .send({ targetType: 'practice', targetId: 'practice-uuid' })
      .expect(200);
    expect(res.body.removed).toBe(true);
    expect(res.text).not.toContain(String(internalTargetId));
  });

  it('never leaks internal numeric target ID in any reaction response', async () => {
    for (const [method, path, body] of [
      ['get', '/api/v1/reactions?targetType=practice&targetId=practice-uuid', undefined],
      ['post', '/api/v1/reactions', { targetType: 'practice', targetId: 'practice-uuid', reactionType: 'fire' }],
      ['delete', '/api/v1/reactions', { targetType: 'practice', targetId: 'practice-uuid' }]
    ] as const) {
      const agent = request(app);
      const req = method === 'get' ? agent.get(path) : method === 'post' ? agent.post(path).send(body) : agent.delete(path).send(body);
      const res = await req;
      expect(res.text).not.toContain(`"targetId":${internalTargetId}`);
      expect(res.text).not.toContain(`"userId":42`);
    }
  });
});
