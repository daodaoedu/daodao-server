/** HTTP response contracts for practice routes: schema compliance, field leakage, embedded user shape. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  practiceApiResponseSchema,
  practicesListApiResponseSchema,
  checkInsListApiResponseSchema,
  practiceStatsApiResponseSchema,
} from '../validators/practice.validators';

const internalNumericId = 77889900;
const sensitiveEmail = 'owner-private@secret.com';

const mockUserBasic = {
  id: 'user-uuid-001',
  name: '實踐者',
  photoURL: 'https://example.com/avatar.jpg',
  roleList: ['normal_student'],
  educationStage: 'university',
  tagList: ['React'],
  selfIntroduction: '熱愛學習',
  customId: 'practitioner'
};

const mockPractice = {
  id: 'practice-uuid-001',
  title: '每日閱讀 30 分鐘',
  isChallenge: false,
  practiceAction: '閱讀技術書籍',
  startDate: '2024-01-15',
  endDate: '2024-01-29',
  durationDays: 14,
  frequencyMinDays: 4,
  frequencyMaxDays: 7,
  sessionDurationMinutes: 30,
  practiceTimePeriods: ['morning', 'evening'],
  otherContext: undefined,
  status: 'active' as const,
  hasResources: false,
  resources: [],
  progressPercentage: 50,
  firstCheckinAt: '2024-01-15T08:30:00.000Z',
  lastCheckinAt: '2024-01-20T09:00:00.000Z',
  checkInCount: 5,
  themeColor: '#FCDD84',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-20T15:45:00.000Z',
  user: mockUserBasic,
  tags: ['閱讀', '學習'],
  stats: { likeCount: 10, viewCount: 50, favoriteCount: 3, shareCount: 2, commentCount: 1 }
};

const mockCheckIn = {
  id: 456,
  practiceId: 123,
  userId: 789,
  checkinDate: '2024-01-20',
  mood: 'happy' as const,
  note: '今天閱讀了第三章',
  imageUrls: [],
  ogImageUrl: null,
  tags: ['專注'],
  viewCount: 24,
  createdAt: '2024-01-20T15:45:00.000Z',
  updatedAt: '2024-01-20T15:45:00.000Z'
};

const paginatedPractices = {
  success: true as const,
  data: [mockPractice],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 20, hasNext: false, hasPrev: false },
  timestamp: new Date().toISOString()
};

const singlePractice = {
  success: true as const,
  data: mockPractice,
  timestamp: new Date().toISOString()
};

const paginatedCheckIns = {
  success: true as const,
  data: [mockCheckIn],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 20, hasNext: false, hasPrev: false },
  timestamp: new Date().toISOString()
};

const userStats = {
  success: true as const,
  data: { totalPractices: 12, activePractices: 3, completedPractices: 7, totalCheckIns: 245, averageStreak: 8.5, maxStreak: 25 },
  timestamp: new Date().toISOString()
};

const practiceServiceMock = {
  findAll: jest.fn().mockResolvedValue(paginatedPractices),
  findById: jest.fn().mockResolvedValue(singlePractice),
  findUserPractices: jest.fn().mockResolvedValue(paginatedPractices),
  getUserStats: jest.fn().mockResolvedValue(userStats),
  create: jest.fn(),
  batchCreate: jest.fn(),
  update: jest.fn(),
  deleteFunction: jest.fn(),
  getRecentPracticeCount: jest.fn().mockResolvedValue(0),
};

const checkInServiceMock = {
  getCheckIns: jest.fn().mockResolvedValue(paginatedCheckIns),
  getCheckInStats: jest.fn(),
  createCheckIn: jest.fn(),
  updateCheckIn: jest.fn(),
  deleteCheckIn: jest.fn(),
  recordView: jest.fn(),
};

jest.mock('../services/practice.service', () => practiceServiceMock);
jest.mock('../services/practice-checkin.service', () => checkInServiceMock);
jest.mock('../services/practice-interaction.service', () => ({
  toggleLike: jest.fn(), toggleFavorite: jest.fn(), recordShare: jest.fn(),
  recordView: jest.fn(), getInteractionStats: jest.fn(), getUserInteractionStatus: jest.fn()
}));
jest.mock('../services/encouragement.service', () => ({ getEncouragement: jest.fn() }));
jest.mock('../services/tag-prompt.service', () => ({ suggestTags: jest.fn() }));
jest.mock('../services/practice-template.service', () => ({
  findAll: jest.fn(), findById: jest.fn(), create: jest.fn(),
  update: jest.fn(), deleteTemplate: jest.fn(), getCategories: jest.fn(), getRandomTemplate: jest.fn(),
  batchCreate: jest.fn(),
}));
jest.mock('../services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockResolvedValue(42)
}));
jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'user-uuid-001' } as Request['user']; next();
  },
  optionalAuth: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'user-uuid-001' } as Request['user']; next();
  }
}));
jest.mock('../middleware/cohort-content-lifecycle.middleware', () => ({
  enforcePracticeCohortContentLifecycle: (_req: Request, _res: Response, next: NextFunction): void => next()
}));
jest.mock('../middleware/multer.middleware', () => ({
  __esModule: true,
  default: { array: () => (_req: Request, _res: Response, next: NextFunction): void => next() }
}));

import router from '../routes/practice.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/practices', router);
app.use(globalErrorHandler);

beforeEach(() => {
  jest.clearAllMocks();
  practiceServiceMock.findAll.mockResolvedValue(structuredClone(paginatedPractices));
  practiceServiceMock.findById.mockResolvedValue(structuredClone(singlePractice));
  practiceServiceMock.findUserPractices.mockResolvedValue(structuredClone(paginatedPractices));
  practiceServiceMock.getUserStats.mockResolvedValue(structuredClone(userStats));
  checkInServiceMock.getCheckIns.mockResolvedValue(structuredClone(paginatedCheckIns));
});

describe('practice list (GET /practices)', () => {
  it('validates paginated response against practicesListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/practices').expect(200);
    expect(() => practicesListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns practice with UUID id, not internal numeric id', async () => {
    const res = await request(app).get('/api/v1/practices').expect(200);
    const practice = res.body.data[0];
    expect(practice.id).toBe('practice-uuid-001');
    expect(typeof practice.id).toBe('string');
    expect(practice).not.toHaveProperty('internalId');
  });
});

describe('my practices (GET /practices/me)', () => {
  it('validates authenticated user practices against practicesListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/practices/me').expect(200);
    expect(() => practicesListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(practiceServiceMock.findUserPractices).toHaveBeenCalledWith(42, expect.any(Object));
  });
});

describe('single practice (GET /practices/:id)', () => {
  it('validates single practice response against practiceApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/practices/123e4567-e89b-12d3-a456-426614174000').expect(200);
    expect(() => practiceApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.title).toBe('每日閱讀 30 分鐘');
  });

  it('rejects non-UUID practice id', async () => {
    const res = await request(app).get('/api/v1/practices/not-a-uuid').expect(400);
    expect(res.body.success).toBe(false);
  });
});

describe('user practices (GET /practices/user/:userId)', () => {
  it('validates other user practices response', async () => {
    const res = await request(app).get('/api/v1/practices/user/123e4567-e89b-12d3-a456-426614174000').expect(200);
    expect(() => practicesListApiResponseSchema.parse(res.body)).not.toThrow();
  });
});

describe('check-ins (GET /practices/:id/checkins)', () => {
  it('validates check-in list against checkInsListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/practices/123e4567-e89b-12d3-a456-426614174000/checkins').expect(200);
    expect(() => checkInsListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data[0].mood).toBe('happy');
  });
});

describe('user stats (GET /practices/stats)', () => {
  it('validates user practice stats against practiceStatsApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/practices/stats').expect(200);
    expect(() => practiceStatsApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.totalPractices).toBe(12);
    expect(res.body.data.maxStreak).toBe(25);
  });
});

describe('embedded user info shape', () => {
  it('practice response embeds only userBasicInfo, not full user profile', async () => {
    const res = await request(app).get('/api/v1/practices/123e4567-e89b-12d3-a456-426614174000').expect(200);
    const user = res.body.data.user;
    expect(user.id).toBe('user-uuid-001');
    expect(user.name).toBe('實踐者');
    expect(user).not.toHaveProperty('email');
    expect(user).not.toHaveProperty('birthDay');
    expect(user).not.toHaveProperty('gender');
    expect(user).not.toHaveProperty('loginCount');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('contactList');
  });
});

describe('field leakage prevention', () => {
  it('never exposes internal numeric IDs or sensitive sentinels in practice responses', async () => {
    const practiceWithInternalId = { ...mockPractice, internalId: internalNumericId, ownerEmail: sensitiveEmail };
    practiceServiceMock.findAll.mockResolvedValue({
      ...paginatedPractices,
      data: [practiceWithInternalId]
    });
    const res = await request(app).get('/api/v1/practices').expect(200);
    expect(res.text).not.toContain(String(internalNumericId));
    expect(res.text).not.toContain(sensitiveEmail);
    expect(res.body.data[0]).not.toHaveProperty('internalId');
    expect(res.body.data[0]).not.toHaveProperty('ownerEmail');
  });

  it('never exposes snake_case Prisma field names in practice responses', async () => {
    const practiceWithSnakeCase = {
      ...mockPractice,
      practice_action: 'leaked_snake_case',
      start_date: '2024-01-15',
      theme_color: '#FF0000',
      check_in_count: 99
    };
    practiceServiceMock.findById.mockResolvedValue({
      success: true as const, data: practiceWithSnakeCase, timestamp: new Date().toISOString()
    });
    const res = await request(app).get('/api/v1/practices/123e4567-e89b-12d3-a456-426614174000').expect(200);
    expect(res.body.data).not.toHaveProperty('practice_action');
    expect(res.body.data).not.toHaveProperty('start_date');
    expect(res.body.data).not.toHaveProperty('theme_color');
    expect(res.body.data).not.toHaveProperty('check_in_count');
  });
});
