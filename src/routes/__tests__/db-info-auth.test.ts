import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../services/database/prisma.service', () => ({
  prisma: { users: { findUnique: jest.fn() } },
  prismaService: { getClient: jest.fn() },
}));
jest.mock('../../services/database/redis.service', () => ({
  redis: { status: 'ready', info: jest.fn() },
}));

import dbInfoRoutes from '../db-info.routes';
import { prisma, prismaService } from '../../services/database/prisma.service';
import { redis } from '../../services/database/redis.service';
import { globalErrorHandler } from '../../middleware/error.middleware';

type RoleFixture = Awaited<ReturnType<typeof prisma.users.findUnique>>;

const lookupUser = jest.mocked(prisma.users.findUnique);
const getClient = jest.mocked(prismaService.getClient);
const redisInfo = jest.mocked(redis.info);
const query = jest.fn();
const secret = 'test-secret-key-for-testing';

/** Real HTTP router with the production authentication and role checks. */
function app(): express.Express {
  const server = express();
  server.use(cookieParser());
  server.use('/api/v1/db-info', dbInfoRoutes);
  server.use(globalErrorHandler);
  return server;
}

/** Sign synthetic identities; role authority remains in the database fixture. */
function token(extra: Record<string, unknown> = {}): string {
  return jwt.sign({ id: 530, uuid: 'qa530', email: 'qa530@example.invalid', ...extra }, secret);
}

describe('database diagnostic access', () => {
  beforeEach(() => {
    lookupUser.mockReset();
    getClient.mockReset();
    query.mockReset().mockResolvedValue([]);
    getClient.mockReturnValue({ $queryRaw: query } as unknown as ReturnType<typeof prismaService.getClient>);
    redisInfo.mockReset().mockResolvedValue('redis_version:7.0\r\n');
  });

  it.each([undefined, 'not-a-valid-token', jwt.sign({ id: 530 }, 'wrong-secret')])(
    'rejects missing or invalid credentials before reading infrastructure: %s', async credential => {
      const req = request(app()).get('/api/v1/db-info');
      if (credential) req.set('Authorization', `Bearer ${credential}`);
      const response = await req;
      expect(response.status).toBe(401);
      expect(response.body.data).toBeNull();
      expect(response.body).not.toHaveProperty('postgres');
      expect(response.body).not.toHaveProperty('redis');
      expect(lookupUser).not.toHaveBeenCalled();
      expect(getClient).not.toHaveBeenCalled();
      expect(redisInfo).not.toHaveBeenCalled();
    }
  );

  it('rejects an ordinary user even when JWT claims an administrator role', async () => {
    lookupUser.mockResolvedValue({ roles: { name: 'User' } } as unknown as RoleFixture);
    const response = await request(app()).get('/api/v1/db-info')
      .set('Authorization', `Bearer ${token({ role: 'Admin' })}`);
    expect(response.status).toBe(403);
    expect(response.body.data).toBeNull();
    expect(getClient).not.toHaveBeenCalled();
    expect(redisInfo).not.toHaveBeenCalled();
  });

  it('rejects temporary identities even with an administrative database role', async () => {
    lookupUser.mockResolvedValue({ roles: { name: 'Admin' } } as unknown as RoleFixture);
    const response = await request(app()).get('/api/v1/db-info')
      .set('Authorization', `Bearer ${token({ isTemp: true })}`);
    expect(response.status).toBe(403);
    expect(getClient).not.toHaveBeenCalled();
    expect(redisInfo).not.toHaveBeenCalled();
  });

  it.each(['Admin', 'SuperAdmin'])('preserves diagnostic access for %s', async role => {
    lookupUser.mockResolvedValue({ roles: { name: role } } as unknown as RoleFixture);
    const response = await request(app()).get('/api/v1/db-info')
      .set('Authorization', `Bearer ${token()}`);
    expect(response.status).toBe(200);
    expect(response.body.postgres).toEqual({});
    expect(response.body.redis.version).toBe('7.0');
    expect(query).toHaveBeenCalled();
    expect(redisInfo).toHaveBeenCalled();
  });

  it('supports the existing administrator cookie authentication', async () => {
    lookupUser.mockResolvedValue({ roles: { name: 'Admin' } } as unknown as RoleFixture);
    const response = await request(app()).get('/api/v1/db-info')
      .set('Cookie', `auth_token=${token()}`);
    expect(response.status).toBe(200);
    expect(response.body.redis.version).toBe('7.0');
  });
});
