import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '需要登入' } });
      return;
    }
    req.user = { id: 7 } as never;
    next();
  },
}));

jest.mock('@/middleware/onboarding-gate.middleware', () => ({
  requireOnboardingComplete: (_req: Request, _res: Response, next: NextFunction): void => next(),
}));

const service = {
  create: jest.fn(), findAllByUser: jest.fn(), findById: jest.fn(), update: jest.fn(),
  softDelete: jest.fn(), send: jest.fn(), open: jest.fn(),
};
jest.mock('@/services/future-letter.service', () => ({ futureLetterService: service }));

import futureLetterRoutes from '@/routes/future-letter.routes';
import { BadRequestError, globalErrorHandler, NotFoundError } from '@/middleware/error.middleware';

const letter = {
  id: '550e8400-e29b-41d4-a716-446655440000', currentSelf: '', message: '', status: 'draft',
  deliverAt: null, sentAt: null, deliveredAt: null, openedAt: null, practiceId: null, practice: null,
  createdAt: '2026-08-18T00:00:00.000Z', updatedAt: '2026-08-18T00:00:00.000Z',
};

describe('future letter routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/me/future-letters', futureLetterRoutes);
  app.use(globalErrorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    service.create.mockResolvedValue(letter);
    service.findAllByUser.mockResolvedValue({ items: [letter], page: 1, limit: 20, total: 1 });
    service.findById.mockResolvedValue(letter);
    service.update.mockResolvedValue(letter);
    service.softDelete.mockResolvedValue(undefined);
    service.send.mockResolvedValue({ ...letter, status: 'scheduled' });
    service.open.mockResolvedValue({ ...letter, status: 'delivered', currentSelf: 'me', message: 'future', openedAt: '2026-09-01T00:00:00.000Z' });
  });

  it('creates an empty draft with 201', async () => {
    const response = await request(app).post('/api/v1/me/future-letters').set('Authorization', 'Bearer test').send({});
    expect(response.status).toBe(201);
    expect(service.create).toHaveBeenCalledWith(7, { currentSelf: '', message: '' });
  });

  it('returns 401 without authentication', async () => {
    expect((await request(app).get('/api/v1/me/future-letters')).status).toBe(401);
  });

  it('lists, gets, updates and deletes an owned draft', async () => {
    const auth = { Authorization: 'Bearer test' };
    expect((await request(app).get('/api/v1/me/future-letters').set(auth)).status).toBe(200);
    expect((await request(app).get(`/api/v1/me/future-letters/${letter.id}`).set(auth)).status).toBe(200);
    expect((await request(app).patch(`/api/v1/me/future-letters/${letter.id}`).set(auth).send({ message: 'updated' })).status).toBe(200);
    expect((await request(app).delete(`/api/v1/me/future-letters/${letter.id}`).set(auth)).status).toBe(200);
  });

  it('maps non-owner lookup to 404', async () => {
    service.findById.mockRejectedValueOnce(new NotFoundError('找不到指定的信件'));
    const response = await request(app).get(`/api/v1/me/future-letters/${letter.id}`).set('Authorization', 'Bearer test');
    expect(response.status).toBe(404);
  });

  it('maps editing a non-draft letter to 400', async () => {
    service.update.mockRejectedValueOnce(new BadRequestError('只有草稿可以編輯'));
    const response = await request(app).patch(`/api/v1/me/future-letters/${letter.id}`).set('Authorization', 'Bearer test').send({ message: 'updated' });
    expect(response.status).toBe(400);
  });

  it('opens a delivered owner letter through an idempotent endpoint', async () => {
    const response = await request(app)
      .post(`/api/v1/me/future-letters/${letter.id}/open`)
      .set('Authorization', 'Bearer test');
    expect(response.status).toBe(200);
    expect(service.open).toHaveBeenCalledWith(7, letter.id);
    expect(response.body.data).toEqual(expect.objectContaining({ currentSelf: 'me', openedAt: '2026-09-01T00:00:00.000Z' }));
  });

  it('validates send dates and accepts the inclusive three-day lower bound', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T00:00:00.000Z'));
    const path = `/api/v1/me/future-letters/${letter.id}/send`;
    const early = await request(app).post(path).set('Authorization', 'Bearer test').send({ deliverAt: '2026-08-20T23:59:59.999Z' });
    const exact = await request(app).post(path).set('Authorization', 'Bearer test').send({ deliverAt: '2026-08-21T00:00:00.000Z' });
    expect(early.status).toBe(400);
    expect(exact.status).toBe(200);
    jest.useRealTimers();
  });
});
