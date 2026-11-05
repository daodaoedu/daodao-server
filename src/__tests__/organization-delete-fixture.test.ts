import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/auth/permission.service', () => ({
  permissionService: { isAdmin: async (userId: number) => userId === 1 }
}));

import organizationRoutes from '../routes/organization.routes';
import { globalErrorHandler, NotFoundError } from '../middleware/error.middleware';
import { organizationIdValidationErrorResponseSchema } from '../validators/organization.validators';

const app = express();
app.use(express.json());
app.use('/api/v1/lighthouse', organizationRoutes);
app.use((_req, _res, next) => next(new NotFoundError('找不到路由')));
app.use(globalErrorHandler);

const tokenFor = (id: number): string => jwt.sign(
  { id, isTemp: false }, process.env.JWT_SECRET as string, { expiresIn: '1h' }
);
const endpoint = '/api/v1/lighthouse/admin/organizations';

describe('organization deletion protection (daodao#323 AC-03)', () => {
  afterEach(() => {
    expect(prismaMock.organization.delete).not.toHaveBeenCalled();
    expect(prismaMock.organization.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.organization.update).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it('explains to a platform admin that fixture organizations cannot be deleted', async () => {
    const response = await request(app).delete(`${endpoint}/900001`)
      .set('Authorization', `Bearer ${tokenFor(1)}`);
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toEqual(expect.any(String));
    expect(response.body.error.message).toContain('驗收 fixture，不可刪除');
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it('does not add deletion support for ordinary organizations', async () => {
    const response = await request(app).delete(`${endpoint}/3`)
      .set('Authorization', `Bearer ${tokenFor(1)}`);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, data: null, error: { message: '不支援刪除組織' } });
  });

  it('requires authentication', async () => {
    await request(app).delete(`${endpoint}/900001`).expect(401);
  });

  it('requires a platform admin before revealing the fixture policy', async () => {
    const response = await request(app).delete(`${endpoint}/900001`)
      .set('Authorization', `Bearer ${tokenFor(42)}`);
    expect(response.status).toBe(403);
    expect(response.body.error.message).not.toContain('驗收 fixture');
  });

  it('rejects malformed organization ids', async () => {
    const response = await request(app).delete(`${endpoint}/invalid`)
      .set('Authorization', `Bearer ${tokenFor(1)}`).expect(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { type: 'bad_request', message: '驗證失敗', details: [{ path: 'organizationId', message: expect.any(String) }] }
    });
    expect(organizationIdValidationErrorResponseSchema.safeParse(response.body).success).toBe(true);
  });
});
