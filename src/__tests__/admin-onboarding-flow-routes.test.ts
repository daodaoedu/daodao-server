/**
 * Regression（daodaoedu/daodao#245）：admin onboarding flow 的路由參數必須對得上 controller 解析的 flowId。
 * 路由原本寫 `:id`、controller 用 flowIdParamSchema 讀 `flowId` → NaN → 一律 400，
 * 「更新／刪除流程」與「流程分析」在 dev 都打不通。
 */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';

const adminCommunityService = {
  getFlowAnalytics: jest.fn(),
  updateFlow: jest.fn(),
  deleteFlow: jest.fn(),
};

jest.mock('../services/admin-community.service', () => ({
  __esModule: true,
  default: adminCommunityService,
}));

jest.mock('../middleware/auth', () => ({
  ...jest.requireActual('../middleware/auth'),
  authenticateAny: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 1, _id: 'admin-uuid' } as Request['user'];
    next();
  },
}));

jest.mock('../middleware/permission.middleware', () => ({
  ...jest.requireActual('../middleware/permission.middleware'),
  requireAdmin: (_req: Request, _res: Response, next: NextFunction): void => next(),
  requireSuperAdmin: (_req: Request, _res: Response, next: NextFunction): void => next(),
}));

import router from '../routes/admin.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/admin', router);
app.use(globalErrorHandler);

describe('admin onboarding flow routes pass the flow id to the service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /onboarding/flows/:id/analytics → 200 with flowId', async () => {
    adminCommunityService.getFlowAnalytics.mockResolvedValue({
      flowId: 7, totalStarted: 0, totalCompleted: 0, averageTimeMinutes: 0, dropOffSteps: [],
    });
    const res = await request(app).get('/api/v1/admin/onboarding/flows/7/analytics').expect(200);
    expect(adminCommunityService.getFlowAnalytics).toHaveBeenCalledWith(7);
    expect(res.body.data.flowId).toBe(7);
  });

  it('PUT /onboarding/flows/:id → 200 with flowId', async () => {
    adminCommunityService.updateFlow.mockResolvedValue({ id: 7, name: 'x', isEnabled: false, steps: [] });
    await request(app).put('/api/v1/admin/onboarding/flows/7').send({ isEnabled: false }).expect(200);
    expect(adminCommunityService.updateFlow).toHaveBeenCalledWith(7, { isEnabled: false });
  });

  it('DELETE /onboarding/flows/:id → 200 with flowId', async () => {
    adminCommunityService.deleteFlow.mockResolvedValue(undefined);
    const res = await request(app).delete('/api/v1/admin/onboarding/flows/7').expect(200);
    expect(adminCommunityService.deleteFlow).toHaveBeenCalledWith(7);
    expect(res.body.data).toEqual({ deleted: true, flowId: 7 });
  });

  it('non-numeric id is still rejected with 400', async () => {
    await request(app).get('/api/v1/admin/onboarding/flows/abc/analytics').expect(400);
    expect(adminCommunityService.getFlowAnalytics).not.toHaveBeenCalled();
  });
});
