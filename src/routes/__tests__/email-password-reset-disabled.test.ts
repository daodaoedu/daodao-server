import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';

jest.mock('../../services/email/email.service', () => ({
  emailService: {
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'controlled-mail' }),
    validateEmailAddress: jest.fn().mockReturnValue(true),
  },
  sendWelcomeEmailWithLog: jest.fn(),
}));
jest.mock('../../services/email/email-log.service', () => ({
  resolveUserIdByEmail: jest.fn().mockResolvedValue(null),
  createEmailLog: jest.fn(), updateEmailLogStatus: jest.fn(), prepareBulkEmailLogs: jest.fn(), recordEmailOpen: jest.fn(),
}));
jest.mock('../../services/email-history.service', () => ({ emailHistoryService: {} }));
jest.mock('../../services/database/prisma.service', () => ({ prisma: {} }));
jest.mock('../../services/logging/logger.service', () => ({
  __esModule: true, default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
jest.mock('../../middleware/auth', () => ({
  optionalAuth: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
  authenticate: jest.fn((req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) { res.status(401).json({ success: false }); return; }
    next();
  }),
}));
jest.mock('../../middleware/permission.middleware', () => ({
  requireAdmin: (_req: Request, res: Response): void => { res.status(403).json({ success: false }); },
}));
jest.mock('../../middleware/rate-limit.middleware', () => ({
  strictLimiter: (_req: Request, _res: Response, next: NextFunction): void => next(),
}));

import emailRouter from '../email.routes';
import { emailService } from '../../services/email/email.service';
import { resolveUserIdByEmail } from '../../services/email/email-log.service';
import { optionalAuth } from '../../middleware/auth';
import { globalErrorHandler } from '../../middleware/error.middleware';
import { responseEnhancerMiddleware } from '../../middleware/response-enhancer';

const app = express();
app.use(express.json());
app.use(responseEnhancerMiddleware);
app.use('/api/v1/email', emailRouter);
app.use(globalErrorHandler);

const legacyPayload = {
  email: 'victim@example.com',
  resetLink: 'https://attacker.example/reset-password?token=controlled',
  name: '中文使用者',
};

function expectUnavailable(response: request.Response): void {
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    success: false,
    data: null,
    error: { code: 'APP_ERROR', message: '密碼重設功能暫時不可用' },
    timestamp: expect.any(String),
    meta: { requestId: expect.any(String), processingTime: expect.any(Number) },
  });
  expect(response.headers['set-cookie']).toBeUndefined();
  expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  expect(resolveUserIdByEmail).not.toHaveBeenCalled();
  expect(optionalAuth).not.toHaveBeenCalled();
}

describe('disabled legacy password-reset email endpoint', () => {
  beforeEach(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });

  it('refuses the formerly valid phishing-mail request without looking up the account or sending mail', async () => {
    expectUnavailable(await request(app).post('/api/v1/email/password-reset').send(legacyPayload));
  });

  it.each([
    ['missing fields', {}],
    ['invalid email and URL', { email: 'invalid', resetLink: 'javascript:alert(1)' }],
    ['first-party link', { ...legacyPayload, resetLink: 'https://daodao.so/reset-password' }],
    ['mixed-case email', { ...legacyPayload, email: 'VICTIM@EXAMPLE.COM' }],
  ])('returns the same unavailable response for %s', async (_name, payload) => {
    expectUnavailable(await request(app).post('/api/v1/email/password-reset').send(payload));
  });

  it('ignores supplied authentication rather than authenticating or sending mail', async () => {
    expectUnavailable(await request(app).post('/api/v1/email/password-reset').set('Authorization', 'Bearer controlled-invalid-token').send(legacyPayload));
  });

  it('preserves the separate optional-auth email validation endpoint', async () => {
    const response = await request(app).post('/api/v1/email/validate').send({ email: 'valid@example.com' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { email: 'valid@example.com', isValid: true } });
    expect(optionalAuth).toHaveBeenCalledTimes(1);
    expect(emailService.validateEmailAddress).toHaveBeenCalledWith('valid@example.com');
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('preserves authentication and admin protection for welcome mail', async () => {
    expect((await request(app).post('/api/v1/email/welcome').send({})).status).toBe(401);
    expect((await request(app).post('/api/v1/email/welcome').set('Authorization', 'Bearer controlled').send({})).status).toBe(403);
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
