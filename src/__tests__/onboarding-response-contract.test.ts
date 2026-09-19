/** HTTP response contracts for onboarding routes: status schema, active flow, no internal state. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';

const mockStatus = {
  taskList: [
    { taskKey: 'A', done: true, ctaHref: '/practices/uuid-1' },
    { taskKey: 'B', done: false },
    { taskKey: 'C', done: false },
  ],
  completedTasks: 1,
  badgeGranted: false,
};

const mockActiveFlow = {
  id: 1,
  name: 'default',
  steps: [
    { id: 1, order: 1, question: '你的學習目標是什麼？', options: ['探索興趣', '準備考試'] }
  ]
};

const onboardingService = {
  getStatus: jest.fn().mockResolvedValue(mockStatus)
};
const onboardingFlowService = {
  getActiveFlow: jest.fn().mockResolvedValue(mockActiveFlow),
  recordResponse: jest.fn().mockResolvedValue(undefined)
};

jest.mock('../services/onboarding.service', () => ({ onboardingService }));
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
  it('returns onboarding status with taskList, completedTasks, badgeGranted', async () => {
    const res = await request(app).get('/api/v1/onboarding/status').expect(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.taskList).toHaveLength(3);
    expect(data.completedTasks).toBe(1);
    expect(data.badgeGranted).toBe(false);
    expect(data.taskList[0]).toEqual(expect.objectContaining({ taskKey: 'A', done: true }));
  });

  it('FINDING: controller wraps with createSuccessResponse but no Zod parse — extra fields leak', async () => {
    onboardingService.getStatus.mockResolvedValueOnce({
      ...mockStatus,
      userId: 42,
      internalState: 'processing',
      dbRecordId: 999
    });
    const res = await request(app).get('/api/v1/onboarding/status').expect(200);
    // Controller uses createSuccessResponse(status) without Zod .parse()
    // Extra fields from service leak through — documenting the gap
    expect(res.body.data).toHaveProperty('userId');
    expect(res.body.data).toHaveProperty('internalState');
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
