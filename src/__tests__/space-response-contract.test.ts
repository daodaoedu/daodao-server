/** HTTP response contracts for space routes: public token isolation, schema compliance, internal field leakage. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  spaceListResponseSchema,
  spaceDetailResponseSchema,
  spaceMembersResponseSchema,
  spacePracticesResponseSchema,
  publicSpaceResponseSchema,
} from '../validators/space.validators';

const internalPublicToken = '660e8400-e29b-41d4-a716-446655440099';
const sensitiveInternalDbId = 77889900;

const mockSpaceListData = {
  total: 1,
  items: [{
    kind: 'event_course' as const,
    id: '12',
    name: '自我覺察練習',
    host: '我的島',
    memberCount: 5,
    memberAvatars: [{ nickname: '學員A', avatar: 'https://example.com/a.jpg' }],
    hasActivePractice: true,
    practiceCount: 2,
    isHost: false,
    lastActivityAt: '2026-09-01T10:00:00.000Z',
  }],
};

const spaceUuid = '550e8400-e29b-41d4-a716-446655440000';

const mockSpaceDetail = {
  id: spaceUuid,
  name: '自我覺察練習',
  subtitle: '一句話簡介',
  memberCount: 5,
  memberAvatars: [{ nickname: '學員A', avatar: 'https://example.com/a.jpg' }],
  practiceCount: 2,
  viewerRole: 'member' as const,
  homePage: { status: 'published' as const },
  publicToken: null,
  publicBlockCount: null,
};

const mockMembers = [
  { userId: 42, nickname: '學員A', avatar: 'https://example.com/a.jpg', isHost: true },
  { userId: 43, nickname: '學員B', avatar: null, isHost: false },
];

const mockPractices = [{
  id: '550e8400-e29b-41d4-a716-446655440001',
  title: '每日反思',
  status: 'active',
  progressPercentage: 60,
  themeColor: '#FCDD84',
  startDate: '2026-07-01',
  endDate: '2026-08-01',
  durationDays: 31,
  ownerNickname: '學員A',
}];

const mockPublicSpace = {
  id: spaceUuid,
  name: '自我覺察練習',
  subtitle: '一句話簡介',
  memberCount: 5,
  memberAvatars: [{ nickname: '學員A', avatar: 'https://example.com/a.jpg' }],
  practiceCount: 2,
  homePage: {
    status: 'published' as const,
    blocks: [{
      id: 1, blockType: 'text' as const, title: '歡迎', body: '歡迎來到空間',
      position: 0, isPinned: false, publishStatus: 'published' as const, scheduledAt: null,
      links: [], events: [],
    }],
  },
};

const service = {
  listMySpaces: jest.fn().mockResolvedValue(mockSpaceListData),
  getSpaceDetail: jest.fn().mockResolvedValue(mockSpaceDetail),
  listMembers: jest.fn().mockResolvedValue(mockMembers),
  listSpacePractices: jest.fn().mockResolvedValue(mockPractices),
  getPublicSpace: jest.fn().mockResolvedValue(mockPublicSpace),
  getHomePage: jest.fn(),
  createHomePage: jest.fn(),
  publishHomePage: jest.fn(),
  createBlock: jest.fn(),
  updateBlock: jest.fn(),
  moveBlock: jest.fn(),
  publishBlock: jest.fn(),
  draftBlock: jest.fn(),
  deleteBlock: jest.fn(),
};

jest.mock('../services/space.service', () => ({ spaceService: service }));
jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '需要登入' } });
      return;
    }
    req.user = { id: 42, _id: 'test-uuid-001' } as Request['user'];
    next();
  },
}));
jest.mock('../middleware/onboarding-gate.middleware', () => ({
  requireOnboardingComplete: (_req: Request, _res: Response, next: NextFunction): void => next(),
}));

import router from '../routes/space.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/spaces', router);
app.use(globalErrorHandler);

beforeEach(() => jest.clearAllMocks());

describe('space list (GET /spaces)', () => {
  it('validates the list response against spaceListResponseSchema', async () => {
    const res = await request(app).get('/api/v1/spaces').set('Authorization', 'Bearer test').expect(200);
    expect(() => spaceListResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('自我覺察練習');
  });

  it('returns 401 without authentication (middleware requires auth)', async () => {
    const res = await request(app).get('/api/v1/spaces').expect(401);
    expect(res.body.success).toBe(false);
    expect(service.listMySpaces).not.toHaveBeenCalled();
  });
});

describe('space detail (GET /spaces/:id)', () => {
  it('validates the detail response against spaceDetailResponseSchema', async () => {
    const res = await request(app).get(`/api/v1/spaces/${spaceUuid}`).set('Authorization', 'Bearer test').expect(200);
    expect(() => spaceDetailResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.id).toBe(spaceUuid);
    expect(res.body.data.viewerRole).toBe('member');
  });

  it('hides publicToken from non-host members', async () => {
    const res = await request(app).get(`/api/v1/spaces/${spaceUuid}`).set('Authorization', 'Bearer test').expect(200);
    expect(res.body.data.publicToken).toBeNull();
    expect(res.body.data.publicBlockCount).toBeNull();
  });

  it('shows publicToken to hosts', async () => {
    service.getSpaceDetail.mockResolvedValueOnce({
      ...mockSpaceDetail,
      viewerRole: 'host',
      publicToken: internalPublicToken,
      publicBlockCount: 3,
    });
    const res = await request(app).get(`/api/v1/spaces/${spaceUuid}`).set('Authorization', 'Bearer test').expect(200);
    expect(res.body.data.publicToken).toBe(internalPublicToken);
    expect(res.body.data.publicBlockCount).toBe(3);
  });

  it('rejects invalid UUID parameters', async () => {
    const res = await request(app).get('/api/v1/spaces/not-a-uuid').set('Authorization', 'Bearer test').expect(400);
    expect(res.body.success).toBe(false);
    expect(service.getSpaceDetail).not.toHaveBeenCalled();
  });
});

describe('public space via token (GET /spaces/public/:token)', () => {
  it('validates the public response against publicSpaceResponseSchema', async () => {
    const res = await request(app).get(`/api/v1/spaces/public/${internalPublicToken}`).expect(200);
    expect(() => publicSpaceResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.name).toBe('自我覺察練習');
    expect(res.body.data.homePage.blocks).toHaveLength(1);
  });

  it('does not expose publicToken, viewerRole, or host-only fields in the public response', async () => {
    const res = await request(app).get(`/api/v1/spaces/public/${internalPublicToken}`).expect(200);
    expect(res.body.data).not.toHaveProperty('publicToken');
    expect(res.body.data).not.toHaveProperty('viewerRole');
    expect(res.body.data).not.toHaveProperty('publicBlockCount');
    expect(res.text).not.toContain(String(sensitiveInternalDbId));
  });

  it('does not require authentication for the public endpoint', async () => {
    const res = await request(app).get(`/api/v1/spaces/public/${internalPublicToken}`).expect(200);
    expect(res.body.success).toBe(true);
  });
});

describe('space members (GET /spaces/:id/members)', () => {
  it('validates the members response against spaceMembersResponseSchema', async () => {
    const res = await request(app).get(`/api/v1/spaces/${spaceUuid}/members`).set('Authorization', 'Bearer test').expect(200);
    expect(() => spaceMembersResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].isHost).toBe(true);
  });
});

describe('space practices (GET /spaces/:id/practices)', () => {
  it('validates the practices response against spacePracticesResponseSchema', async () => {
    const res = await request(app).get(`/api/v1/spaces/${spaceUuid}/practices`).set('Authorization', 'Bearer test').expect(200);
    expect(() => spacePracticesResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data[0].title).toBe('每日反思');
    expect(res.body.data[0].status).toBe('active');
  });
});
