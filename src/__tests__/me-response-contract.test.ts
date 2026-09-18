/** HTTP response contracts for /me routes: authenticated aggregation views, schema compliance. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  myPracticesApiResponseSchema,
  myPracticeStatsApiResponseSchema
} from '../validators/me.validators';

const internalDbId = 77889900;

const mockPractice = {
  id: 'practice-uuid-001',
  title: '每日閱讀',
  practiceAction: '讀技術書',
  startDate: '2024-01-15',
  endDate: '2024-02-15',
  durationDays: 30,
  frequencyMinDays: 1,
  frequencyMaxDays: 7,
  sessionDurationMinutes: 30,
  practiceTimePeriods: ['morning', 'evening'],
  status: 'active' as const,
  hasResources: false,
  progressPercentage: 45,
  firstCheckinAt: '2024-01-16T08:30:00.000Z',
  lastCheckinAt: '2024-01-25T20:15:00.000Z',
  checkInCount: 5,
  themeColor: '#FCDD84',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-20T15:45:00.000Z',
  tags: ['閱讀', '學習'],
  viewCount: 24,
  commentCount: 3
};

const mockStats = {
  totalPractices: 5,
  activePractices: 2,
  completedPractices: 1,
  archivedPractices: 1,
  totalCheckIns: 42,
  currentStreak: 3,
  maxStreak: 7,
  averageProgress: 65,
  timeSpentToday: 30,
  timeSpentThisWeek: 180,
  timeSpentThisMonth: 720,
  practicesByCategory: [{ category: '前端開發', count: 3, avgProgress: 70 }],
  recentActivity: [{ date: '2024-01-20', checkInCount: 2, timeSpent: 60 }],
  achievements: [{ type: 'streak' as const, milestone: 7, achievedAt: '2024-01-20T10:00:00.000Z', description: '連續簽到7天' }]
};

const mockFootprint = {
  id: 1001,
  content: '今天完成了每日閱讀打卡',
  createdAt: '2024-01-15T10:30:00.000Z',
  practiceId: 'practice-uuid-001',
  practiceTitle: '每日閱讀',
  practiceDeleted: false
};

const meService = {
  getMyPractices: jest.fn().mockResolvedValue({
    success: true,
    data: [mockPractice],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 10, hasNext: false, hasPrev: false },
    timestamp: new Date().toISOString()
  }),
  getMyPracticeStats: jest.fn().mockResolvedValue({
    success: true,
    data: mockStats,
    timestamp: new Date().toISOString()
  }),
  getMyResources: jest.fn().mockResolvedValue({
    success: true,
    data: [],
    pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10, hasNext: false, hasPrev: false },
    timestamp: new Date().toISOString()
  }),
  getMyPreferences: jest.fn().mockResolvedValue({
    success: true,
    data: { preferences: [], availableTypes: [] },
    timestamp: new Date().toISOString()
  }),
  updateMyPreferences: jest.fn(),
  getMyLearningFootprints: jest.fn().mockResolvedValue({
    success: true,
    data: [mockFootprint],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 10, hasNext: false, hasPrev: false },
    timestamp: new Date().toISOString()
  })
};

jest.mock('../services/me.service', () => ({ meService }));

const cohortJoinController = { listMyCohorts: jest.fn((_req: Request, res: Response) => res.json({ success: true, data: [], timestamp: new Date().toISOString() })) };
jest.mock('../controllers/cohort-join.controller', () => ({ cohortJoinController }));

const challengeController = { listMine: jest.fn((_req: Request, res: Response) => res.json({ success: true, data: [], timestamp: new Date().toISOString() })) };
jest.mock('../controllers/challenge.controller', () => ({ challengeController }));

jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid' } as Request['user'];
    next();
  }
}));
jest.mock('../middleware/validation.middleware', () => ({
  validate: () => (_req: Request, _res: Response, next: NextFunction): void => next()
}));

import router from '../routes/me.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/me', router);
app.use(globalErrorHandler);

describe('me response contracts', () => {
  it('validates GET /me/practices against myPracticesApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/me/practices').expect(200);
    expect(() => myPracticesApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data[0].id).toBe('practice-uuid-001');
    expect(res.body.pagination).toBeDefined();
  });

  it('validates GET /me/practice-stats against myPracticeStatsApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/me/practice-stats').expect(200);
    expect(() => myPracticeStatsApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.totalPractices).toBe(5);
    expect(res.body.data.currentStreak).toBe(3);
  });

  it('uses UUID-only practice id, never internal numeric id', async () => {
    const res = await request(app).get('/api/v1/me/practices').expect(200);
    const practice = res.body.data[0];
    expect(practice.id).toMatch(/^[a-z0-9-]+$/);
    expect(res.text).not.toContain(String(internalDbId));
    expect(practice).not.toHaveProperty('internalId');
    expect(practice).not.toHaveProperty('user_id');
  });

  it('returns cohorts list via delegated controller', async () => {
    const res = await request(app).get('/api/v1/me/cohorts').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns challenges list via delegated controller', async () => {
    const res = await request(app).get('/api/v1/me/challenges').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
