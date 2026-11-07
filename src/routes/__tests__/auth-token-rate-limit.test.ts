import express, { type Request, type Response } from 'express';
import request from 'supertest';

// Only the Redis transport is substituted. Production authLimiter, its policy,
// express-rate-limit and rate-limit-redis execute unchanged, without sockets.
jest.mock('ioredis', () => {
  const counters = new Map<string, number>();
  return { __esModule: true, default: class RedisStub {
    static counters = counters;
    status = 'ready';
    on(): void { /* No external connection. */ }
    disconnect(): void { /* No external connection. */ }
    async call(command: string, ...args: string[]): Promise<string | number[]> {
      if (command === 'SCRIPT') return 'increment-script';
      if (command === 'EVALSHA') {
        const key = args[2];
        const hits = (counters.get(key) ?? 0) + 1;
        counters.set(key, hits);
        return [hits, Number(args[4])];
      }
      throw new Error(`Unexpected Redis command: ${command}`);
    }
  } };
});
jest.mock('../../controllers/auth.controller', () => {
  return { authController: Object.fromEntries([
    'login', 'register', 'googleCallback', 'logout', 'refreshToken', 'getCurrentUser',
    'forgotPassword', 'resetPassword', 'verifyEmail', 'verifyEmailGet',
    'resendVerificationEmail', 'appleSignIn', 'exchangeToken',
  ].map(name => [name, jest.fn((_req: Request, res: Response) => { res.status(200).json({ admitted: true }); })])) };
});
jest.mock('../../services/auth/oauth.service', () => ({
  authenticateGoogle: jest.fn(), authenticateGoogleCallback: jest.fn(),
}));
jest.mock('../dev-login.routes', () => ({ createDevLoginRouter: (): null => null }));

import Redis from 'ioredis';
import authRouter from '../auth.routes';
import { authController } from '../../controllers/auth.controller';
import { disconnectRateLimitRedis } from '../../middleware/shared-rate-limit';

const server = express();
server.set('trust proxy', 1);
server.use(express.json());
server.use('/api/v1/auth', authRouter);
const login = { email: 'qa@example.invalid', password: 'Password123' };
const register = { ...login, username: 'qa_user', confirmPassword: login.password };

/** HTTP source addresses are synthetic only in this isolated trusted-proxy harness. */
function post(route: string, ip: string, body: object = { code: 'synthetic-code' }): request.Test {
  return request(server).post(`/api/v1/auth/${route}`).set('X-Forwarded-For', ip).send(body);
}
const consumeCode = jest.fn();
beforeEach(() => {
  (Redis as unknown as { counters: Map<string, number> }).counters.clear();
  (authController.exchangeToken as jest.Mock).mockImplementation((req: Request, res: Response) => {
    if (!req.body.code || typeof req.body.code !== 'string') { res.status(400).json({ invalidCode: true }); return; }
    consumeCode(req.body.code);
    res.cookie('auth_token', 'synthetic-token', { httpOnly: true });
    res.status(200).json({ admitted: true, accessToken: 'synthetic-token' });
  });
});
afterAll(() => disconnectRateLimitRedis());

describe('independent authorization-code exchange budget', () => {
  it('admits sixty exchanges then rejects before controller or code consumption', async () => {
    const remaining: string[] = [];
    for (let i = 0; i < 60; i += 1) {
      const admitted = await post('token', '192.0.2.40');
      expect(admitted.status).toBe(200);
      expect(admitted.body).toEqual({ admitted: true, accessToken: 'synthetic-token' });
      expect(admitted.headers['set-cookie'][0]).toContain('HttpOnly');
      remaining.push(admitted.headers['ratelimit-remaining']);
    }
    const blocked = await post('token', '192.0.2.40');
    expect(blocked.status).toBe(429);
    expect(remaining).toEqual(Array.from({ length: 60 }, (_, i) => String(59 - i)));
    expect(blocked.body).toEqual({ success: false, message: '授權碼交換過於頻繁，請 1 分鐘後再試', error: 'AUTH_RATE_LIMIT_EXCEEDED', retryAfter: 60 });
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThanOrEqual(1);
    expect(Number(blocked.headers['retry-after'])).toBeLessThanOrEqual(60);
    expect(blocked.headers['ratelimit-policy']).toBe('60;w=60');
    expect(blocked.headers['ratelimit-limit']).toBe('60');
    expect(blocked.headers['ratelimit-remaining']).toBe('0');
    expect(Number(blocked.headers['ratelimit-reset'])).toBeGreaterThan(0);
    expect(Number(blocked.headers['ratelimit-reset'])).toBeLessThanOrEqual(60);
    expect(blocked.headers['set-cookie']).toBeUndefined();
    expect(authController.exchangeToken).toHaveBeenCalledTimes(60);
    expect(consumeCode).toHaveBeenCalledTimes(60);
  });

  it('counts malformed input and blocks later valid or invalid input without side effects', async () => {
    for (let i = 0; i < 60; i += 1) expect((await post('token', '192.0.2.41', {})).status).toBe(400);
    expect((await post('token', '192.0.2.41')).status).toBe(429);
    expect((await post('token', '192.0.2.41', {})).status).toBe(429);
    expect(authController.exchangeToken).toHaveBeenCalledTimes(60);
    expect(consumeCode).not.toHaveBeenCalled();
    expect((await post('token', '192.0.2.42')).status).toBe(200);
    expect(consumeCode).toHaveBeenCalledTimes(1);
  });

  it('keeps exchanges available when the shared login/register/Apple budget is exhausted', async () => {
    const routes = ['login', 'register', 'apple/token'];
    const bodies = [login, register, { idToken: 'synthetic-apple-token' }];
    for (let i = 0; i < 10; i += 1) expect((await post(routes[i % 3], '192.0.2.43', bodies[i % 3])).status).toBe(200);
    for (let i = 0; i < 3; i += 1) expect((await post(routes[i], '192.0.2.43', bodies[i])).status).toBe(429);
    const admitted = await post('token', '192.0.2.43');
    expect(admitted.status).toBe(200);
    expect(admitted.headers['ratelimit-limit']).toBe('60');
    expect(admitted.headers['ratelimit-remaining']).toBe('59');
    expect(consumeCode).toHaveBeenCalledTimes(1);
  });

  it('keeps login/register/Apple and another source available when exchanges are exhausted', async () => {
    for (let i = 0; i < 60; i += 1) expect((await post('token', '192.0.2.44')).status).toBe(200);
    expect((await post('token', '192.0.2.44')).status).toBe(429);
    for (const [route, body] of [['login', login], ['register', register], ['apple/token', { idToken: 'synthetic-apple-token' }]] as const) {
      const admitted = await post(route, '192.0.2.44', body);
      expect(admitted.status).toBe(200);
      expect(admitted.headers['ratelimit-limit']).toBe('10');
    }
    const otherSource = await post('token', '192.0.2.45');
    expect(otherSource.status).toBe(200);
    expect(otherSource.headers['ratelimit-remaining']).toBe('59');
    expect(authController.exchangeToken).toHaveBeenCalledTimes(61);
    expect(consumeCode).toHaveBeenCalledTimes(61);
  });
});
