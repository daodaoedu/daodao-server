/**
 * daodao#179 AC7：共同挑戰建立能力只限島島阿學的授權管理員。
 * 路由層：未登入 401、非管理員（含其他組織的 owner）403 且不碰 service；
 * 管理員建立時 client 夾帶的 organizationId 會被 validator 略過，所屬組織由 service 決定。
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const mockIsAdmin = jest.fn<Promise<boolean>, [number]>();
jest.mock('@/services/auth/permission.service', () => ({
  permissionService: { isAdmin: (userId: number) => mockIsAdmin(userId) }
}));

const mockCreateProgram = jest.fn();
const mockCreateTemplate = jest.fn();
jest.mock('@/services/admin-challenge.service', () => ({
  adminChallengeService: {
    createProgram: (...args: unknown[]) => mockCreateProgram(...args),
    createTemplate: (...args: unknown[]) => mockCreateTemplate(...args)
  }
}));

import { globalErrorHandler } from '@/middleware/error.middleware';
import adminChallengeRoutes from '@/routes/admin-challenge.routes';

const ADMIN_ID = 1;
const ORG_OWNER_ID = 306;

const tokenFor = (id: number) =>
  jwt.sign({ id, email: `user${id}@test.local`, isTemp: false }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/admin/challenges', adminChallengeRoutes);
  app.use(globalErrorHandler);
  return app;
};

const programRow = {
  id: 20, organizationId: 7, organizationName: '島島阿學', name: 'PM 驗收 #179', description: null,
  cohortCount: 0, publishedCohortCount: 0, createdAt: new Date('2026-10-12T00:00:00.000Z'), updatedAt: null
};

describe('POST /api/v1/admin/challenges/programs 權限（daodao#179 AC7）', () => {
  beforeEach(() => {
    mockIsAdmin.mockReset().mockImplementation(async userId => userId === ADMIN_ID);
    mockCreateProgram.mockReset().mockResolvedValue(programRow);
    mockCreateTemplate.mockReset();
  });

  it('未登入 → 401，不建立', async () => {
    const res = await request(buildApp()).post('/api/v1/admin/challenges/programs').send({ name: 'x' });
    expect(res.status).toBe(401);
    expect(mockCreateProgram).not.toHaveBeenCalled();
  });

  it('其他組織的 owner（非平台管理員）→ 403，不建立', async () => {
    const res = await request(buildApp())
      .post('/api/v1/admin/challenges/programs')
      .set('Authorization', `Bearer ${tokenFor(ORG_OWNER_ID)}`)
      .send({ organizationId: 3, name: '其他組織想建的挑戰' });
    expect(res.status).toBe(403);
    expect(mockCreateProgram).not.toHaveBeenCalled();
  });

  it('非管理員建立模板 → 403，不建立', async () => {
    const res = await request(buildApp())
      .post('/api/v1/admin/challenges/templates')
      .set('Authorization', `Bearer ${tokenFor(ORG_OWNER_ID)}`)
      .send({ title: 't' });
    expect(res.status).toBe(403);
    expect(mockCreateTemplate).not.toHaveBeenCalled();
  });

  it('管理員建立：client 夾帶的 organizationId 不會傳進 service', async () => {
    const res = await request(buildApp())
      .post('/api/v1/admin/challenges/programs')
      .set('Authorization', `Bearer ${tokenFor(ADMIN_ID)}`)
      .send({ organizationId: 3, name: 'PM 驗收 #179' });
    expect(res.status).toBe(201);
    expect(mockCreateProgram).toHaveBeenCalledWith({ name: 'PM 驗收 #179' });
  });
});
