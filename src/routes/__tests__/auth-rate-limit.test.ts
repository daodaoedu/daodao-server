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

/** Send synthetic input through the production router, validation and limiter. */
function post(route: 'login' | 'register', ip: string, body: object = route === 'login' ? login : register): request.Test {
  return request(server).post(`/api/v1/auth/${route}`).set('X-Forwarded-For', ip).send(body);
}

beforeEach(() => {
  (Redis as unknown as { counters: Map<string, number> }).counters.clear();
});
afterAll(() => disconnectRateLimitRedis());

describe('login and registration authentication budget', () => {
  it.each(['login', 'register'] as const)('admits ten %s requests then rejects before business side effects', async route => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await post(route, '192.0.2.10')).status).toBe(200);
    }
    const blocked = await post(route, '192.0.2.10');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, error: 'AUTH_RATE_LIMIT_EXCEEDED', retryAfter: 900 });
    expect(blocked.headers['retry-after']).toBe('900');
    expect(authController[route]).toHaveBeenCalledTimes(10);
  });

  it('shares one budget across login and registration and keeps other IPs usable', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await post(attempt % 2 === 0 ? 'login' : 'register', '192.0.2.20')).status).toBe(200);
    }
    expect((await post('login', '192.0.2.20')).status).toBe(429);
    expect((await post('register', '192.0.2.20')).status).toBe(429);
    expect(authController.login).toHaveBeenCalledTimes(5);
    expect(authController.register).toHaveBeenCalledTimes(5);
    expect((await post('register', '192.0.2.21')).status).toBe(200);
    expect(authController.register).toHaveBeenCalledTimes(6);
  });

  it.each(['login', 'register'] as const)('counts invalid %s attempts and blocks before validation once exhausted', async route => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await post(route, '192.0.2.30', {})).status).toBe(400);
    }
    const blocked = await post(route, '192.0.2.30', {});
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('AUTH_RATE_LIMIT_EXCEEDED');
    expect(authController[route]).not.toHaveBeenCalled();
    expect((await post(route, '192.0.2.31')).status).toBe(200);
  });
});
