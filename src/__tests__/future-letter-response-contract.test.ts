/** HTTP response contracts for future-letter routes: schema compliance, encrypted content boundaries, internal field leakage. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  futureLetterApiResponseSchema,
  futureLetterListApiResponseSchema,
} from '../validators/future-letter.validators';

const sensitiveContent = 'encrypted-personal-secret-message';
const sensitiveCurrentSelf = 'encrypted-current-self-reflection';
const internalUserId = 42;

const mockLetter = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  currentSelf: sensitiveCurrentSelf,
  message: sensitiveContent,
  status: 'draft' as const,
  deliverAt: null,
  sentAt: null,
  deliveredAt: null,
  openedAt: null,
  practiceId: null,
  practice: null,
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};

const scheduledLetter = {
  ...mockLetter,
  status: 'scheduled' as const,
  deliverAt: '2026-09-20T08:00:00.000Z',
  sentAt: '2026-08-18T12:00:00.000Z',
};

const deliveredLetter = {
  ...mockLetter,
  status: 'delivered' as const,
  deliverAt: '2026-09-01T08:00:00.000Z',
  sentAt: '2026-08-18T12:00:00.000Z',
  deliveredAt: '2026-09-01T08:00:00.000Z',
  openedAt: '2026-09-01T10:30:00.000Z',
};

const service = {
  create: jest.fn().mockResolvedValue(mockLetter),
  findAllByUser: jest.fn().mockResolvedValue({ items: [mockLetter, scheduledLetter], page: 1, limit: 20, total: 2 }),
  findById: jest.fn().mockResolvedValue(mockLetter),
  update: jest.fn().mockResolvedValue(mockLetter),
  softDelete: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue(scheduledLetter),
  open: jest.fn().mockResolvedValue(deliveredLetter),
};

jest.mock('../services/future-letter.service', () => ({ futureLetterService: service }));
jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '需要登入' } });
      return;
    }
    req.user = { id: internalUserId } as Request['user'];
    next();
  },
}));
jest.mock('../middleware/onboarding-gate.middleware', () => ({
  requireOnboardingComplete: (_req: Request, _res: Response, next: NextFunction): void => next(),
}));

import futureLetterRoutes from '../routes/future-letter.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/me/future-letters', futureLetterRoutes);
app.use(globalErrorHandler);

const auth = { Authorization: 'Bearer test-token' };

describe('future-letter response contracts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without authentication and never leaks letter content', async () => {
    const res = await request(app).get('/api/v1/me/future-letters').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.text).not.toContain(sensitiveContent);
    expect(res.text).not.toContain(sensitiveCurrentSelf);
    expect(service.findAllByUser).not.toHaveBeenCalled();
  });

  it('validates list response against futureLetterListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/me/future-letters').set(auth).expect(200);
    expect(() => futureLetterListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toEqual(expect.objectContaining({
      currentPage: 1, totalItems: 2, hasNext: false, hasPrev: false,
    }));
  });

  it('validates single letter response against futureLetterApiResponseSchema', async () => {
    const res = await request(app).get(`/api/v1/me/future-letters/${mockLetter.id}`).set(auth).expect(200);
    expect(() => futureLetterApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.id).toBe(mockLetter.id);
    expect(res.body.data.currentSelf).toBe(sensitiveCurrentSelf);
    expect(res.body.data.message).toBe(sensitiveContent);
  });

  it('validates create response with 201 status and schema compliance', async () => {
    const res = await request(app).post('/api/v1/me/future-letters').set(auth)
      .send({ currentSelf: 'test', message: 'hello future' }).expect(201);
    expect(() => futureLetterApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.status).toBe('draft');
  });

  it('validates send response with scheduled status and date serialization', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app).post(`/api/v1/me/future-letters/${mockLetter.id}/send`).set(auth)
      .send({ deliverAt: futureDate }).expect(200);
    expect(() => futureLetterApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.status).toBe('scheduled');
    expect(typeof res.body.data.deliverAt).toBe('string');
    expect(typeof res.body.data.sentAt).toBe('string');
  });

  it('validates open response with delivered content and all date fields', async () => {
    const res = await request(app).post(`/api/v1/me/future-letters/${mockLetter.id}/open`).set(auth).expect(200);
    expect(() => futureLetterApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.openedAt).toBe('2026-09-01T10:30:00.000Z');
    expect(res.body.data.deliveredAt).toBe('2026-09-01T08:00:00.000Z');
    for (const field of ['id', 'currentSelf', 'message', 'status', 'deliverAt', 'sentAt', 'deliveredAt', 'openedAt', 'createdAt', 'updatedAt']) {
      expect(res.body.data).toHaveProperty(field);
    }
  });

  it('never exposes internal numeric user_id or DB-internal fields in any response', async () => {
    for (const res of [
      await request(app).get('/api/v1/me/future-letters').set(auth),
      await request(app).get(`/api/v1/me/future-letters/${mockLetter.id}`).set(auth),
      await request(app).post('/api/v1/me/future-letters').set(auth).send({}),
    ]) {
      expect(res.text).not.toContain(`"user_id"`);
      expect(res.text).not.toContain(`"userId"`);
      expect(res.text).not.toContain(`":${internalUserId},`);
      expect(res.text).not.toContain(`":${internalUserId}}`);
    }
  });

  it('rejects invalid UUID parameter before touching the service', async () => {
    const res = await request(app).get('/api/v1/me/future-letters/not-a-uuid').set(auth).expect(400);
    expect(res.body.success).toBe(false);
    expect(service.findById).not.toHaveBeenCalled();
    expect(res.text).not.toContain(sensitiveContent);
  });
});
