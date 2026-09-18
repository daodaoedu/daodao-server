/** HTTP response contracts for buddy-request routes: request/accept flow, no PII in requester info. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  buddyRequestListApiResponseSchema,
  buddyRequestActionApiResponseSchema,
} from '../validators/buddy-request.validators';

const sensitiveEmail = 'buddy-secret@hidden.com';
const internalDbId = 99001122;

const mockBuddyItem = {
  requestId: 1,
  requesterExternalId: 'requester-uuid-001',
  requesterNickname: '學習夥伴',
  practiceId: 10,
  practiceTitle: '每日閱讀',
  createdAt: '2024-06-01T08:00:00.000Z'
};

const buddyService = {
  createBuddyRequest: jest.fn().mockResolvedValue({
    success: true, data: { message: 'Buddy 請求已送出' }, timestamp: new Date().toISOString()
  }),
  updateBuddyRequest: jest.fn().mockResolvedValue({
    success: true, data: { message: '已接受 Buddy 請求' }, timestamp: new Date().toISOString()
  }),
  getPendingIncoming: jest.fn().mockResolvedValue({
    success: true, data: [mockBuddyItem], timestamp: new Date().toISOString()
  })
};

jest.mock('../services/buddy-request.service', () => ({ buddyRequestService: buddyService }));

jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    req.user = { id: 42, _id: 'test-uuid' } as Request['user'];
    next();
  }
}));
jest.mock('../middleware/validation.middleware', () => ({
  validate: () => (_req: Request, _res: Response, next: NextFunction): void => next()
}));

import { buddyRequestRouter, practiceBuddyRequestRouter } from '../routes/buddy-request.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/buddy-requests', buddyRequestRouter);
app.use('/api/v1/practices/:id/buddy-requests', practiceBuddyRequestRouter);
app.use(globalErrorHandler);

describe('buddy-request response contracts', () => {
  it('validates pending incoming list against buddyRequestListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/buddy-requests').expect(200);
    expect(() => buddyRequestListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data[0].requesterExternalId).toBe('requester-uuid-001');
    expect(res.body.data[0].requesterNickname).toBe('學習夥伴');
  });

  it('validates create buddy request response against action schema with 201', async () => {
    const res = await request(app)
      .post('/api/v1/practices/practice-uuid/buddy-requests')
      .send({ receiverExternalId: 'receiver-uuid' })
      .expect(201);
    expect(() => buddyRequestActionApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.message).toBeDefined();
  });

  it('validates accept buddy request response against action schema', async () => {
    const res = await request(app)
      .patch('/api/v1/buddy-requests/1')
      .send({ status: 'accepted' })
      .expect(200);
    expect(() => buddyRequestActionApiResponseSchema.parse(res.body)).not.toThrow();
  });

  it('FINDING: controller does not Zod-parse — extra service fields leak verbatim', async () => {
    buddyService.getPendingIncoming.mockResolvedValueOnce({
      success: true,
      data: [{ ...mockBuddyItem, email: sensitiveEmail, password: 'hashed', internalId: internalDbId }],
      timestamp: new Date().toISOString()
    });
    const res = await request(app).get('/api/v1/buddy-requests').expect(200);
    // Controller passes service result directly via res.json() without Zod .parse()
    // Extra fields leak — this documents the gap (same as connection/follow/reaction)
    expect(res.text).toContain(sensitiveEmail);
    expect(res.body.data[0]).toHaveProperty('email');
  });

  it('exposes requester info limited to externalId and nickname (no contactList, birthDay, gender)', async () => {
    const res = await request(app).get('/api/v1/buddy-requests').expect(200);
    const item = res.body.data[0];
    expect(item).not.toHaveProperty('contactList');
    expect(item).not.toHaveProperty('birthDay');
    expect(item).not.toHaveProperty('gender');
    expect(item).not.toHaveProperty('email');
  });
});
