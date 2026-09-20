/** HTTP response contracts for user routes: PII sanitization, schema compliance, field leakage. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import { usersListResponseSchema, userSuccessResponseSchema } from '../validators/user.validators';

const sensitiveEmail = 'private@secret-domain.com';
const sensitivePassword = 'hashed_$2b$10_secret_password_hash';
const sensitiveBirthDay = '1990-05-15';
const sensitiveReferralSource = 'secret_campaign_2026';
const internalDbId = 99887766;

const mockUser = {
  id: 'test-uuid-001',
  name: '測試用戶',
  email: sensitiveEmail,
  photoURL: 'https://example.com/photo.jpg',
  gender: 'male' as const,
  birthDay: sensitiveBirthDay,
  educationStage: 'university' as const,
  isOpenLocation: true,
  isOpenProfile: true,
  isSubscribeEmail: true,
  location: 'taipei_city',
  locationNameZh: '台北市, 台灣',
  locationNameEn: 'Taipei City, Taiwan',
  selfIntroduction: '自我介紹',
  share: null,
  wantToDoList: ['學習'],
  tagList: ['React'],
  interestList: ['程式設計'],
  preferences: null,
  role: 2,
  positionList: ['normal_student'],
  basicInfo: { selfIntroduction: '自我介紹', shareList: null, wantToDoList: ['學習'] },
  contactList: {
    email: sensitiveEmail, photoURL: null, isSubscribeEmail: true,
    instagram: null, discord: null, line: null, facebook: null,
    threads: null, linkedin: null, website: null, github: null
  },
  customId: 'testuser',
  customIdVerified: true,
  customIdCreatedAt: '2024-01-15T10:30:00.000Z',
  professionalField: ['technology_ict'],
  personalSlogan: null,
  referralSource: sensitiveReferralSource,
  lastLoginAt: '2024-01-20T08:30:00.000Z',
  lastActiveAt: '2024-01-20T14:25:00.000Z',
  loginCount: 42,
  profileViews: 128,
  latestQuizResult: null,
  createdDate: '2024-01-15T10:30:00.000Z',
  updatedDate: '2024-01-20T14:25:00.000Z'
};

const paginatedResult = {
  success: true as const,
  data: [mockUser],
  pagination: {
    currentPage: 1, totalPages: 1, totalItems: 1,
    itemsPerPage: 10, hasNext: false, hasPrev: false
  },
  timestamp: new Date().toISOString()
};

const successResult = {
  success: true as const,
  data: mockUser,
  timestamp: new Date().toISOString()
};

const service = {
  getAllUsers: jest.fn().mockResolvedValue(paginatedResult),
  getMe: jest.fn().mockResolvedValue(successResult),
  getOneUser: jest.fn().mockResolvedValue(successResult),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  requestPasswordReset: jest.fn(),
  getLoginHistory: jest.fn(),
  getActivityStats: jest.fn()
};

jest.mock('../services/user.service', () => ({
  userService: service,
  getCommonCirclesCount: jest.fn().mockResolvedValue(0),
  getUserConnectionsCount: jest.fn().mockResolvedValue(0)
}));
jest.mock('../services/practice.service', () => ({
  getRecentPracticeCount: jest.fn().mockResolvedValue(0)
}));
jest.mock('../services/auth/permission.service', () => ({
  permissionService: { isAdmin: jest.fn().mockResolvedValue(false) }
}));
jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid-001' } as Request['user']; next();
  },
  optionalAuth: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid-001' } as Request['user']; next();
  }
}));
jest.mock('../middleware/permission.middleware', () => ({
  canUpdateUser: () => (_req: Request, _res: Response, next: NextFunction): void => next(),
  requireAdmin: (_req: Request, _res: Response, next: NextFunction): void => next()
}));
jest.mock('../services/user-island.service', () => ({
  getUserIslandData: jest.fn().mockResolvedValue(null)
}));
jest.mock('../middleware/multer.middleware', () => ({
  __esModule: true,
  default: { single: () => (_req: Request, _res: Response, next: NextFunction): void => next() }
}));
jest.mock('../middleware/parse-formdata.middleware', () => ({
  parseFormData: (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction): void => next()
}));

import router from '../routes/user.routes';
import { permissionService } from '../services/auth/permission.service';

const app = express();
app.use(express.json());
app.use('/api/v1/users', router);
app.use(globalErrorHandler);

beforeEach(() => {
  jest.clearAllMocks();
  service.getAllUsers.mockResolvedValue(structuredClone(paginatedResult));
  service.getMe.mockResolvedValue(structuredClone(successResult));
  service.getOneUser.mockResolvedValue(structuredClone(successResult));
  (permissionService.isAdmin as jest.Mock).mockResolvedValue(false);
});

describe('user list PII sanitization (GET /users)', () => {
  it('strips email, loginCount, lastLoginAt, lastActiveAt, profileViews and referralSource for non-admin', async () => {
    const res = await request(app).get('/api/v1/users').expect(200);
    const user = res.body.data[0];
    expect(user.email).toBeNull();
    expect(user.isSubscribeEmail).toBe(false);
    expect(user.loginCount).toBe(0);
    expect(user.lastLoginAt).toBeNull();
    expect(user.lastActiveAt).toBeNull();
    expect(user.profileViews).toBe(0);
    expect(user.referralSource).toBeNull();
    expect(user.contactList.email).toBeNull();
    expect(user.contactList.isSubscribeEmail).toBeNull();
  });

  it('does not leak PII sentinel strings anywhere in the non-admin list response', async () => {
    const res = await request(app).get('/api/v1/users').expect(200);
    expect(res.text).not.toContain(sensitiveEmail);
    expect(res.text).not.toContain(sensitiveReferralSource);
  });

  it('strips birthDay from non-admin user list', async () => {
    const res = await request(app).get('/api/v1/users').expect(200);
    const user = res.body.data[0];
    expect(user.birthDay).toBeNull();
    expect(res.text).not.toContain(sensitiveBirthDay);
  });

  it('validates the user list response envelope against paginatedApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/users').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination).toEqual(expect.objectContaining({
      currentPage: 1, totalPages: 1, totalItems: 1,
      itemsPerPage: 10, hasNext: false, hasPrev: false
    }));
    expect(res.body.timestamp).toBeDefined();
    expect(() => usersListResponseSchema.parse(res.body)).not.toThrow();
  });

  it('returns full PII for admin users', async () => {
    (permissionService.isAdmin as jest.Mock).mockResolvedValue(true);
    const res = await request(app).get('/api/v1/users').expect(200);
    const user = res.body.data[0];
    expect(user.email).toBe(sensitiveEmail);
    expect(user.loginCount).toBe(42);
    expect(user.profileViews).toBe(128);
    expect(user.referralSource).toBe(sensitiveReferralSource);
    expect(user.contactList.email).toBe(sensitiveEmail);
  });
});

describe('authenticated self-view (GET /users/me)', () => {
  it('returns full user profile with all fields for the authenticated user', async () => {
    const res = await request(app).get('/api/v1/users/me').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('test-uuid-001');
    expect(res.body.data.email).toBe(sensitiveEmail);
    expect(res.body.data.loginCount).toBe(42);
    expect(() => userSuccessResponseSchema.parse(res.body)).not.toThrow();
  });

  it('returns 200 with null data when user record does not exist', async () => {
    service.getMe.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/users/me').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });
});

describe('public profile (GET /users/:id)', () => {
  it('validates the single-user response against userSuccessResponseSchema', async () => {
    const res = await request(app).get('/api/v1/users/123e4567-e89b-12d3-a456-426614174000').expect(200);
    expect(() => userSuccessResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.id).toBe('test-uuid-001');
  });

  it('returns 404 for a nonexistent user', async () => {
    service.getOneUser.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/users/123e4567-e89b-12d3-a456-426614174000').expect(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-UUID path parameters', async () => {
    const res = await request(app).get('/api/v1/users/not-a-uuid').expect(400);
    expect(res.body.success).toBe(false);
    expect(service.getOneUser).not.toHaveBeenCalled();
  });
});

describe('field leakage prevention', () => {
  it('never exposes password hash sentinel in any user response', async () => {
    // The service should never include password, but verify end-to-end.
    const userWithPassword = { ...mockUser, password: sensitivePassword, password_hash: sensitivePassword };
    service.getAllUsers.mockResolvedValue({
      ...paginatedResult,
      data: [userWithPassword]
    });
    const res = await request(app).get('/api/v1/users').expect(200);
    expect(res.text).not.toContain(sensitivePassword);
    expect(res.body.data[0]).not.toHaveProperty('password');
    expect(res.body.data[0]).not.toHaveProperty('password_hash');
  });

  it('never exposes internal numeric database ID', async () => {
    const userWithInternalId = { ...mockUser, internalId: internalDbId };
    service.getMe.mockResolvedValue({ success: true as const, data: userWithInternalId, timestamp: new Date().toISOString() });
    const res = await request(app).get('/api/v1/users/me').expect(200);
    expect(res.text).not.toContain(String(internalDbId));
    expect(res.body.data).not.toHaveProperty('internalId');
  });
});
