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
      expect(response.body).toHaveProperty('system.processId', process.pid);
      expect(response.body).toHaveProperty('postgres.tables', []);
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
