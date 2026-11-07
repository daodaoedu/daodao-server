/** HTTP response contracts for auth routes: credential exposure, token format, response schema compliance. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  logoutResponseSchema,
  refreshTokenResponseSchema,
  getCurrentUserResponseSchema
} from '../validators/auth.validators';

const sensitivePasswordHash = '$2b$10$secrethashvalue_never_expose';
const internalDbId = 55443322;
const sensitiveGoogleId = 'google-oauth-id-secret-1234567890';
const testExternalId = '123e4567-e89b-12d3-a456-426614174000';
const testToken = 'eyJhbGciOiJIUzI1NiJ9.test-token-value';
const refreshedToken = 'eyJhbGciOiJIUzI1NiJ9.refreshed-token-value';

const jwtMock = {
  verifyToken: jest.fn().mockReturnValue({ id: internalDbId, _id: testExternalId, isTemp: false }),
  refreshToken: jest.fn().mockReturnValue(refreshedToken),
  generateToken: jest.fn().mockReturnValue(testToken)
};

const authServiceMock = {
  findUserByExternalId: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: internalDbId,
      external_id: testExternalId,
      nickname: '測試用戶',
      name: '測試',
      photo_url: 'https://example.com/photo.jpg',
      is_active: true,
      verified: true,
      verified_at: new Date('2024-06-01T00:00:00Z'),
      google_id: sensitiveGoogleId,
      password_hash: sensitivePasswordHash,
      contacts: {
        email: 'test@example.com',
        photo_url: 'https://example.com/photo.jpg'
      }
    }
  }),
  getUserRoles: jest.fn().mockResolvedValue({ success: true, data: [{ name: 'user' }] }),
  getUserPermissions: jest.fn().mockResolvedValue({ success: true, data: [{ name: 'read_resources' }] })
};

jest.mock('../services/jwt.service', () => ({ jwtService: jwtMock }));
jest.mock('../services/auth/auth.service', () => ({ authService: authServiceMock }));
jest.mock('../services/database/prisma.service', () => ({
  prisma: { temp_users: { findUnique: jest.fn() } }
}));
jest.mock('../services/email/email.service', () => ({ emailService: {} }));
jest.mock('../services/persona.service', () => ({ personaService: {} }));
jest.mock('../services/quiz.service', () => ({
  quizService: { claimByToken: jest.fn() }
}));
jest.mock('../services/auth/apple-auth.service', () => ({ appleAuthService: {} }));
jest.mock('../services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));
jest.mock('../services/auth/oauth-nonce.service', () => ({ oauthNonceService: {} }));
jest.mock('../services/auth/auth-code.service', () => ({ authCodeService: {} }));
jest.mock('../services/auth/oauth.service', () => ({
  authenticateGoogle: (_req: Request, _res: Response, next: NextFunction): void => next(),
  authenticateGoogleCallback: (_req: Request, _res: Response, next: NextFunction): void => next()
}));
jest.mock('../middleware/auth', () => ({
  authenticateAny: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: internalDbId, _id: testExternalId } as Request['user']; next();
  }
}));
jest.mock('../middleware/rate-limit.middleware', () => ({
  strictLimiter: (_req: Request, _res: Response, next: NextFunction): void => next(),
  authLimiter: (_req: Request, _res: Response, next: NextFunction): void => next(),
  tokenExchangeLimiter: (_req: Request, _res: Response, next: NextFunction): void => next()
}));
jest.mock('../utils/cookie-config', () => ({
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
  getAuthToken: jest.fn().mockReturnValue(testToken),
  clearQuizClaimCookie: jest.fn(),
  QUIZ_CLAIM_COOKIE_NAME: 'quiz_claim'
}));

import router from '../routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', router);
app.use(globalErrorHandler);

beforeEach(() => {
  jest.clearAllMocks();
  jwtMock.verifyToken.mockReturnValue({ id: internalDbId, _id: testExternalId, isTemp: false });
  jwtMock.refreshToken.mockReturnValue(refreshedToken);
  authServiceMock.findUserByExternalId.mockResolvedValue({
    success: true,
    data: {
      id: internalDbId, external_id: testExternalId,
      nickname: '測試用戶', name: '測試',
      photo_url: 'https://example.com/photo.jpg',
      is_active: true, verified: true,
      verified_at: new Date('2024-06-01T00:00:00Z'),
      google_id: sensitiveGoogleId,
      password_hash: sensitivePasswordHash,
      contacts: { email: 'test@example.com', photo_url: 'https://example.com/photo.jpg' }
    }
  });
  authServiceMock.getUserRoles.mockResolvedValue({ success: true, data: [{ name: 'user' }] });
  authServiceMock.getUserPermissions.mockResolvedValue({ success: true, data: [{ name: 'read_resources' }] });
});

describe('GET /auth/me — current user response contract', () => {
  it('validates the full response against getCurrentUserResponseSchema', async () => {
    const res = await request(app).get('/api/v1/auth/me').expect(200);
    expect(() => getCurrentUserResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.user.id).toBe(testExternalId);
    expect(res.body.data.user.roles).toEqual(['user']);
    expect(res.body.data.user.permissions).toEqual(['read_resources']);
    expect(res.body.data.isTemporary).toBe(false);
  });

  it('never exposes password hash, google_id, or internal numeric ID', async () => {
    const res = await request(app).get('/api/v1/auth/me').expect(200);
    expect(res.text).not.toContain(sensitivePasswordHash);
    expect(res.text).not.toContain(sensitiveGoogleId);
    expect(res.text).not.toContain(`"${internalDbId}"`);
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.user).not.toHaveProperty('google_id');
  });

  it('serializes email_verified_at as ISO datetime string', async () => {
    const res = await request(app).get('/api/v1/auth/me').expect(200);
    expect(res.body.data.user.email_verified_at).toBe('2024-06-01T00:00:00.000Z');
    expect(res.body.data.user.email_verified).toBe(true);
  });

  it('returns 401 when token is missing', async () => {
    const { getAuthToken } = jest.requireMock('../utils/cookie-config');
    getAuthToken.mockReturnValueOnce(null);
    const res = await request(app).get('/api/v1/auth/me').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.text).not.toContain(sensitivePasswordHash);
  });

  it('returns 401 when token is invalid', async () => {
    jwtMock.verifyToken.mockReturnValueOnce({ error: 'invalid_token' });
    const res = await request(app).get('/api/v1/auth/me').expect(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /auth/logout — response contract', () => {
  it('validates the logout response against logoutResponseSchema', async () => {
    const res = await request(app).post('/api/v1/auth/logout').expect(200);
    expect(() => logoutResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.message).toBe('登出成功');
    expect(res.body.success).toBe(true);
  });
});

describe('POST /auth/refresh — response contract', () => {
  it('validates the refresh response against refreshTokenResponseSchema', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').expect(200);
    expect(() => refreshTokenResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.token).toBe(refreshedToken);
  });

  it('never includes the old token or internal state in the refresh response', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').expect(200);
    expect(res.body.data).not.toHaveProperty('oldToken');
    expect(res.body.data).not.toHaveProperty('userId');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('returns 401 when token is missing', async () => {
    const { getAuthToken } = jest.requireMock('../utils/cookie-config');
    getAuthToken.mockReturnValueOnce(null);
    const res = await request(app).post('/api/v1/auth/refresh').expect(401);
    expect(res.body.success).toBe(false);
  });
});

describe('credential exposure prevention', () => {
  it('never leaks password hash in any auth response', async () => {
    for (const [method, path] of [['get', '/me'], ['post', '/logout'], ['post', '/refresh']] as const) {
      const agent = request(app);
      const res = await (method === 'get' ? agent.get(`/api/v1/auth${path}`) : agent.post(`/api/v1/auth${path}`));
      expect(res.text).not.toContain(sensitivePasswordHash);
      expect(res.text).not.toContain('password_hash');
    }
  });
});
