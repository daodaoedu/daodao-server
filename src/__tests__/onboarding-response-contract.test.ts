/** HTTP response contracts for onboarding routes: active flow, flow responses, status route removed. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';

const mockActiveFlow = {
  id: 1,
  name: 'default',
  steps: [
    { id: 1, order: 1, question: '你的學習目標是什麼？', options: ['探索興趣', '準備考試'] }
  ]
};

const onboardingFlowService = {
  getActiveFlow: jest.fn().mockResolvedValue(mockActiveFlow),
  recordResponse: jest.fn().mockResolvedValue(undefined)
};

jest.mock('../services/onboarding-flow.service', () => onboardingFlowService);

jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid' } as Request['user'];
    next();
  }
}));

import router from '../routes/onboarding.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/onboarding', router);
app.use(globalErrorHandler);

describe('onboarding response contracts', () => {
  it('GET /status is gone (新手任務移除) — router falls through to 404', async () => {
    await request(app).get('/api/v1/onboarding/status').expect(404);
  });

  it('returns active flow without authentication (public endpoint)', async () => {
    const res = await request(app).get('/api/v1/onboarding/flows/active').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.steps).toBeDefined();
  });

  it('records flow response and returns confirmation', async () => {
    const res = await request(app)
      .post('/api/v1/onboarding/flows/1/responses')
      .send({ stepId: 1, answer: ['探索興趣'] })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ recorded: true });
  });

  it('rejects flow response with missing stepId or answer', async () => {
    const res = await request(app)
      .post('/api/v1/onboarding/flows/1/responses')
      .send({ stepId: 1 })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});
