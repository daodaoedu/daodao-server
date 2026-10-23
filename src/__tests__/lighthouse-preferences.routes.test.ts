/** Real preference route/controller/service with mocked authentication and persistence. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { prismaMock } from '../../tests/utils/prisma-mock';
jest.mock('../services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../middleware/auth', () => ({
  authenticateAny: (req: Request, _res: Response, next: NextFunction): void => {
    if (req.headers['x-test-user']) req.user = { id: Number(req.headers['x-test-user']) } as never;
    next();
  }
}));
import router from '../routes/organization.routes';
import { globalErrorHandler } from '../middleware/error.middleware';

const app = express();
app.use(express.json());
app.use('/api/v1/lighthouse', router);
app.use(globalErrorHandler);

describe('Lighthouse preference routes', () => {
  it('allows an authenticated account with no current organization to read an empty preference', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ last_lighthouse_organization_id: null } as never);
    const response = await request(app).get('/api/v1/lighthouse/preferences').set('x-test-user', '42');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ organizationId: null });
    expect(prismaMock.organization_members.findFirst).not.toHaveBeenCalled();
  });

  it('rejects guests on reads and writes before touching persistence', async () => {
    expect((await request(app).get('/api/v1/lighthouse/preferences')).status).toBe(401);
    expect((await request(app).patch('/api/v1/lighthouse/preferences').send({ organizationId: 9 })).status).toBe(401);
    expect(prismaMock.users.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.users.updateMany).not.toHaveBeenCalled();
  });

  it('returns the saved preference through the standard envelope', async () => {
    prismaMock.users.updateMany.mockResolvedValue({ count: 1 });
    const response = await request(app).patch('/api/v1/lighthouse/preferences').set('x-test-user', '42').send({ organizationId: 9 });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { organizationId: 9 } });
    expect(prismaMock.users.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 42 }) }));
  });

  it('rejects invalid IDs and client-provided account identities', async () => {
    for (const body of [{ organizationId: -1 }, { organizationId: '9' }, { organizationId: 9, userId: 99 }]) {
      const response = await request(app).patch('/api/v1/lighthouse/preferences').set('x-test-user', '42').send(body);
      expect(response.status).toBe(400);
    }
    expect(prismaMock.users.updateMany).not.toHaveBeenCalled();
  });

  it('returns forbidden for another organization or a suspended membership', async () => {
    prismaMock.users.updateMany.mockResolvedValue({ count: 0 });
    const response = await request(app).patch('/api/v1/lighthouse/preferences').set('x-test-user', '42').send({ organizationId: 99 });
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
