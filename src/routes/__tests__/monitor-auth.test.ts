import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../services/database/prisma.service', () => ({
  prisma: { users: { findUnique: jest.fn() } },
  prismaService: { getClient: jest.fn() },
}));

import monitorRoutes from '../monitor.routes';
import { prisma, prismaService } from '../../services/database/prisma.service';
import { globalErrorHandler } from '../../middleware/error.middleware';

const findUser = prisma.users.findUnique as jest.Mock;
const getClient = prismaService.getClient as jest.Mock;
const query = jest.fn();
const app = express();
app.use(cookieParser());
app.use('/api/v1/monitor', monitorRoutes);
app.use(globalErrorHandler);

/** Sign a real JWT; roles are resolved by the real permission service from DB. */
function tokenFor(id: number, isTemp = false): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Test JWT secret is required');
  return jwt.sign({ id, isTemp, roles: ['SuperAdmin'] }, secret, { expiresIn: '5m' });
}

beforeEach(() => {
  findUser.mockImplementation(async ({ where }: { where: { id: number } }) => ({
    id: where.id,
    roles: { name: ({ 1: 'User', 2: 'Admin', 3: 'SuperAdmin' } as Record<number, string>)[where.id] },
  }));
  query.mockResolvedValue([]);
  getClient.mockReturnValue({ $queryRaw: query });
});

describe('monitor diagnostic access', () => {
  it('rejects anonymous requests before reading diagnostic data', async () => {
    const response = await request(app).get('/api/v1/monitor');
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, data: null });
    expect(response.body).not.toHaveProperty('system');
    expect(getClient).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects invalid JWTs before reading diagnostic data', async () => {
    const response = await request(app).get('/api/v1/monitor').set('Authorization', 'Bearer invalid');
    expect(response.status).toBe(401);
    expect(getClient).not.toHaveBeenCalled();
  });

  it('rejects a regular user even when their signed JWT claims an admin role', async () => {
    const response = await request(app).get('/api/v1/monitor').auth(tokenFor(1), { type: 'bearer' });
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ success: false, data: null });
    expect(getClient).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects temporary administrators', async () => {
    const response = await request(app).get('/api/v1/monitor').auth(tokenFor(2, true), { type: 'bearer' });
    expect(response.status).toBe(403);
    expect(getClient).not.toHaveBeenCalled();
  });

  it.each([['Admin', 2], ['SuperAdmin', 3]] as const)('preserves %s access without exposing process arguments', async (_role, id) => {
    const sentinel = '--database-url=synthetic-secret-must-not-leak';
    process.argv.push(sentinel);
    try {
      const response = await request(app).get('/api/v1/monitor').auth(tokenFor(id), { type: 'bearer' });
      expect(response.status).toBe(200);
      expect(Object.keys(response.body.system).sort()).toEqual(['freeMemory', 'loadAverage', 'processMemory', 'totalMemory', 'uptime']);
      expect(Object.keys(response.body.postgres).sort()).toEqual(['current_connections', 'max_connections']);
      expect(response.body).toHaveProperty('disk');
      expect(response.body.system).not.toHaveProperty('processArgs');
      expect(JSON.stringify(response.body)).not.toContain(sentinel);
      expect(query).toHaveBeenCalled();
    } finally {
      process.argv.pop();
    }
  });

  it('preserves cookie-authenticated admin access used by the diagnostic HTML page', async () => {
    const response = await request(app).get('/api/v1/monitor').set('Cookie', `auth_token=${tokenFor(2)}`);
    expect(response.status).toBe(200);
    expect(response.body.system).not.toHaveProperty('processArgs');
  });
});


describe('aggregate-only monitor contract', () => {
  it('keeps useful aggregate database metrics without returning fingerprints', async () => {
    query.mockResolvedValue([{ current_connections: 7, max_connections: 100, version: 'PRIVATE_DB_VERSION', table_name: 'PRIVATE_TABLE' }]);
    const response = await request(app).get('/api/v1/monitor').auth(tokenFor(2), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.postgres).toEqual({ current_connections: 7, max_connections: 100 });
    expect(response.body.system.loadAverage).toEqual(expect.any(Array));
    expect(response.body.system.totalMemory).toEqual(expect.any(Number));
    expect(response.body.system.processMemory.rss).toEqual(expect.any(Number));
    expect(Object.keys(response.body).sort()).toEqual(['disk', 'postgres', 'system']);
    expect(response.body.disk).toEqual([{ size: 0, used: 0, available: 0, use: 0 }]);
    expect(JSON.stringify(response.body)).not.toContain('PRIVATE_');
  });

  it('keeps available health aggregates and returns only a generic database failure', async () => {
    query.mockRejectedValue(new Error('PRIVATE_DB_PASSWORD_AND_HOST'));
    const response = await request(app).get('/api/v1/monitor').auth(tokenFor(2), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.postgres).toEqual({ error: 'PostgreSQL 連線不可用' });
    expect(response.body.system.totalMemory).toEqual(expect.any(Number));
    expect(JSON.stringify(response.body)).not.toContain('PRIVATE_DB_PASSWORD_AND_HOST');
  });
});

it.each(['test', 'dev', 'production'])('never reflects unexpected system failures in %s', async (environment) => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = environment;
  try {
  const os = await import('os');
  jest.spyOn(os.default, 'totalmem').mockImplementation(() => { throw new Error('PRIVATE_OS_FAILURE'); });
  const response = await request(app).get('/api/v1/monitor').auth(tokenFor(2), { type: 'bearer' });
  expect(response.status).toBe(500);
  expect(response.body).toMatchObject({ success: false, data: null, error: { code: 'INTERNAL_SERVER_ERROR', message: '系統監控暫不可用' } });
  expect(JSON.stringify(response.body)).not.toContain('PRIVATE_OS_FAILURE');
  expect(response.body).not.toHaveProperty('debug');
  } finally { process.env.NODE_ENV = previous; }
});

describe.each(['test', 'dev', 'production'])('private monitor auth errors in %s', (environment) => {
  it.each([
    ['anonymous', 401, 'UNAUTHORIZED', '請先登入'],
    ['invalid', 401, 'UNAUTHORIZED', '請先登入'],
    ['forged-member', 403, 'FORBIDDEN', '需要管理員權限'],
    ['temporary-admin', 403, 'FORBIDDEN', '需要管理員權限'],
  ] as const)('%s returns only the generic authorization envelope', async (identity, status, code, message) => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = environment;
    try {
      const call = request(app).get('/api/v1/monitor');
      if (identity === 'invalid') call.set('Authorization', 'Bearer invalid');
      if (identity === 'forged-member') call.auth(tokenFor(1), { type: 'bearer' });
      if (identity === 'temporary-admin') call.auth(tokenFor(2, true), { type: 'bearer' });
      const response = await call;
      expect(response.status).toBe(status);
      expect(response.body).not.toHaveProperty('debug');
      expect(response.body).toMatchObject({ success: false, data: null, error: { code, message } });
      expect(Object.keys(response.body).sort()).toEqual(['data', 'error', 'success', 'timestamp']);
      expect(Object.keys(response.body.error).sort()).toEqual(['code', 'message']);
      expect(getClient).not.toHaveBeenCalled();
      expect(query).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
