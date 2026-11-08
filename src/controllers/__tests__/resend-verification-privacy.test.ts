import '../../config/openapi-registry';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../../middleware/error.middleware';
import { jwtService } from '../../services/jwt.service';

const mockFindFirst = jest.fn();
const mockSendVerificationEmail = jest.fn();
let mockRateLimited = false;

jest.mock('../../services/database/prisma.service', () => ({
  prisma: { users: { findFirst: (...args: unknown[]): unknown => mockFindFirst(...args) } }
}));
jest.mock('../../services/email/email.service', () => ({
  emailService: { sendVerificationEmail: (...args: unknown[]): unknown => mockSendVerificationEmail(...args) }
}));
jest.mock('../../services/email/welcome-email.service', () => ({ sendWelcomeEmailInBackground: jest.fn() }));
jest.mock('../../services/auth/auth.service', () => ({ authService: {} }));
jest.mock('../../services/persona.service', () => ({ personaService: {} }));
jest.mock('../../services/quiz.service', () => ({ quizService: {} }));
jest.mock('../../services/auth/apple-auth.service', () => ({ appleAuthService: {} }));
jest.mock('../../services/auth/oauth-nonce.service', () => ({ oauthNonceService: {} }));
jest.mock('../../services/auth/auth-code.service', () => ({ authCodeService: {} }));
jest.mock('../../services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));
jest.mock('../../services/auth/oauth.service', () => ({
  authenticateGoogle: (_req: Request, _res: Response, next: NextFunction): void => next(),
  authenticateGoogleCallback: (_req: Request, _res: Response, next: NextFunction): void => next()
}));
jest.mock('../../middleware/auth', () => ({
  authenticateAny: (_req: Request, _res: Response, next: NextFunction): void => next()
}));
// The existing router's gate is controlled here; shared Redis budgets have their own integration tests.
jest.mock('../../middleware/rate-limit.middleware', () => ({
  strictLimiter: (_req: Request, res: Response, next: NextFunction): void => {
    if (mockRateLimited) {
      res.status(429).json({ success: false, error: 'STRICT_RATE_LIMIT_EXCEEDED' });
      return;
    }
    next();
  },
  authLimiter: (_req: Request, _res: Response, next: NextFunction): void => next(),
  tokenExchangeLimiter: (_req: Request, _res: Response, next: NextFunction): void => next()
}));
jest.mock('../../routes/dev-login.routes', () => ({ createDevLoginRouter: (): null => null }));

import router from '../../routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', router);
app.use(globalErrorHandler);

const path = '/api/v1/auth/resend-verification';
const email = 'synthetic-verification@example.invalid';
const timestamp = '2026-11-08T00:00:00.000Z';
const success = {
  success: true,
  data: { message: '如果此電子郵件已註冊且尚未驗證，驗證郵件已發送' },
  timestamp
};
const user = {
  id: 953301,
  external_id: 'b693ab8c-399a-41b0-92aa-625330195330',
  nickname: '測試島民',
  verified: false,
  contacts: { email }
};
const originalBackendUrl = process.env.BACKEND_URL;

beforeEach(() => {
  mockRateLimited = false;
  mockFindFirst.mockReset().mockResolvedValue(user);
  mockSendVerificationEmail.mockReset().mockResolvedValue(undefined);
  process.env.BACKEND_URL = 'https://api.example.invalid';
  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(timestamp);
});

afterAll(() => {
  if (originalBackendUrl === undefined) delete process.env.BACKEND_URL;
  else process.env.BACKEND_URL = originalBackendUrl;
});

describe('POST /auth/resend-verification privacy', () => {
  it.each([
    ['unknown', null],
    ['verified', { ...user, verified: true }],
    ['unverified', user]
  ])('returns the identical raw success envelope for %s email', async (_state, found) => {
    mockFindFirst.mockResolvedValue(found);
    const response = await request(app).post(path).send({ email }).expect(200);
    expect(response.body).toEqual(success);
    expect(response.text).toBe(JSON.stringify(success));
    expect(response.text).not.toContain(email);
    expect(response.text).not.toContain(String(user.id));
    expect(response.text).not.toContain(user.external_id);
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('verified');
  });

  it.each([
    ['unknown', null],
    ['verified', { ...user, verified: true }]
  ])('does not issue a token or send mail for %s email', async (_state, found) => {
    mockFindFirst.mockResolvedValue(found);
    const generate = jest.spyOn(jwtService, 'generateToken');
    await request(app).post(path).send({ email }).expect(200);
    expect(generate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it('sends exactly one verifiable token to the normalized unverified recipient', async () => {
    const generate = jest.spyOn(jwtService, 'generateToken');
    await request(app).post(path).send({ email: email.toUpperCase() }).expect(200);
    expect(mockFindFirst).toHaveBeenCalledTimes(1);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { contacts: { email } }, include: { contacts: true }
    });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
    const [recipient, link, nickname, userId] = mockSendVerificationEmail.mock.calls[0] as [string, string, string, number];
    expect(recipient).toBe(email);
    expect(nickname).toBe('測試島民');
    expect(userId).toBe(953301);
    const url = new URL(link);
    expect(url.origin).toBe('https://api.example.invalid');
    expect(url.pathname).toBe('/api/v1/auth/verify-email');
    expect([...url.searchParams.keys()]).toEqual(['token']);
    expect(jwtService.verifyToken(url.searchParams.get('token') || '')).toEqual(expect.objectContaining({
      id: 953301, _id: user.external_id, isTemp: false
    }));
  });

  it.each([{}, { email: '' }, { email: null }, { email: 12 }, { email: 'not-an-email' }, { email: ' 測試@example.invalid ' }])(
    'rejects malformed input without lookup, signing, or mail: %j', async body => {
      const generate = jest.spyOn(jwtService, 'generateToken');
      const response = await request(app).post(path).send(body).expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toEqual(expect.objectContaining({
        type: 'bad_request', message: '驗證失敗', details: expect.arrayContaining([expect.objectContaining({ path: 'email' })])
      }));
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(generate).not.toHaveBeenCalled();
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    }
  );

  it('retains the existing router limiter before lookup or sending', async () => {
    mockRateLimited = true;
    const generate = jest.spyOn(jwtService, 'generateToken');
    await request(app).post(path).send({ email }).expect(429);
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it('preserves database failure instead of falsely claiming success', async () => {
    mockFindFirst.mockRejectedValue(new Error('synthetic database failure'));
    const response = await request(app).post(path).send({ email }).expect(500);
    expect(response.body.success).toBe(false);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it('retains generic acknowledgement when the existing sender returns success:false', async () => {
    mockSendVerificationEmail.mockResolvedValue({ success: false, error: 'synthetic rejected mail' });
    const response = await request(app).post(path).send({ email }).expect(200);
    expect(response.body).toEqual(success);
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('preserves signing failure without sending an invalid verification link', async () => {
    jest.spyOn(jwtService, 'generateToken').mockImplementation((): never => { throw new Error('synthetic signing failure'); });
    const response = await request(app).post(path).send({ email }).expect(500);
    expect(response.body.success).toBe(false);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it('awaits mail failure instead of falsely claiming delivery', async () => {
    mockSendVerificationEmail.mockRejectedValue(new Error('synthetic mail failure'));
    const response = await request(app).post(path).send({ email }).expect(500);
    expect(response.body.success).toBe(false);
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
