/** HTTP response contracts for challenge routes: schema compliance, public vs auth views, join. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  challengeJoinResultSchema
} from '../validators/challenge.validator';

const mockChallengeSummary = {
  id: 1,
  displayName: '21 天晨間書寫',
  programName: '晨間書寫',
  description: '每天早起寫 500 字',
  startDate: new Date('2026-07-01'),
  endDate: new Date('2026-07-21'),
  joinDeadline: null,
  participantCount: 12,
  runStatus: 'ongoing' as const,
  canJoin: true,
  unavailableReason: null,
  isJoined: false,
  hasInspirationDeck: true
};

const mockChallengeDetail = {
  ...mockChallengeSummary,
  template: {
    title: '晨間書寫模板',
    practiceAction: '早起寫 500 字'
  }
};

const mockJoinResult = {
  enrollmentId: 99,
  cohortId: 1,
  status: 'joined' as const,
  practiceId: '550e8400-e29b-41d4-a716-446655440000'
};

const challengeServiceMock = {
  list: jest.fn().mockResolvedValue([mockChallengeSummary]),
  getDetail: jest.fn().mockResolvedValue(mockChallengeDetail),
  join: jest.fn().mockResolvedValue(mockJoinResult),
  listMine: jest.fn().mockResolvedValue([])
};

jest.mock('../services/challenge.service', () => ({
  challengeService: challengeServiceMock
}));
jest.mock('../controllers/inspiration-deck.controller', () => ({
  inspirationDeckController: {
    todayDraws: jest.fn(),
    draw: jest.fn(),
    selectDraw: jest.fn()
  }
}));
jest.mock('../middleware/auth', () => ({
  authenticateAny: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'user-uuid-001' } as Request['user']; next();
  },
  optionalAuth: (req: Request, _res: Response, next: NextFunction): void => {
    if (req.headers.authorization) {
      req.user = { id: 42, _id: 'user-uuid-001' } as Request['user'];
    }
    next();
  }
}));

import router from '../routes/challenge.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/challenges', router);
app.use(globalErrorHandler);

beforeEach(() => jest.clearAllMocks());

describe('challenge list (GET /challenges)', () => {
  it('returns a valid challenge list with expected fields', async () => {
    const res = await request(app).get('/api/v1/challenges').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const challenge = res.body.data[0];
    expect(challenge).toHaveProperty('id');
    expect(challenge).toHaveProperty('displayName');
    expect(challenge).toHaveProperty('runStatus');
    expect(challenge).toHaveProperty('canJoin');
    expect(challenge).toHaveProperty('isJoined');
    expect(challenge).toHaveProperty('hasInspirationDeck');
  });

  it('serializes dates as ISO strings in the HTTP response', async () => {
    const res = await request(app).get('/api/v1/challenges').expect(200);
    const challenge = res.body.data[0];
    expect(typeof challenge.startDate).toBe('string');
    expect(typeof challenge.endDate).toBe('string');
    expect(challenge.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('shows isJoined=false when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/challenges').expect(200);
    expect(res.body.data[0].isJoined).toBe(false);
  });
});

describe('challenge detail (GET /challenges/:challengeId)', () => {
  it('returns challenge detail with expected fields including template', async () => {
    const res = await request(app).get('/api/v1/challenges/1').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('displayName');
    expect(res.body.data).toHaveProperty('template');
    expect(res.body.data).toHaveProperty('runStatus');
  });

  it('includes template info in detail response', async () => {
    const res = await request(app).get('/api/v1/challenges/1').expect(200);
    expect(res.body.data.template).toEqual({
      title: '晨間書寫模板',
      practiceAction: '早起寫 500 字'
    });
  });
});

describe('join challenge (POST /challenges/:challengeId/join)', () => {
  it('validates join result against challengeJoinResultSchema with 201 status', async () => {
    const res = await request(app).post('/api/v1/challenges/1/join').expect(201);
    expect(res.body.success).toBe(true);
    const parsed = challengeJoinResultSchema.safeParse(res.body.data);
    expect(parsed.success).toBe(true);
    expect(res.body.data.status).toBe('joined');
    expect(res.body.data.practiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});

describe('field leakage prevention', () => {
  it('does not expose internal cohort fields in challenge responses', async () => {
    const leakyChallenge = {
      ...mockChallengeSummary,
      meeting_url: 'https://meet.secret.com',
      internalToken: 'secret-token',
      fee_amount: 500
    };
    challengeServiceMock.list.mockResolvedValue([leakyChallenge]);
    const res = await request(app).get('/api/v1/challenges').expect(200);
    expect(res.text).not.toContain('meet.secret.com');
    expect(res.text).not.toContain('secret-token');
  });
});
