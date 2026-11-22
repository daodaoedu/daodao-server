import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

jest.mock('@/services/survey.service', () => ({ surveyService: { getPublic: (...args: unknown[]) => mockGetPublic(...args) } }));
jest.mock('@/services/database/prisma.service', () => ({ prisma: {} }));
jest.mock('@/middleware/rate-limit.middleware', () => ({
  createLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

import surveyRoutes from '../survey.routes';
import { GoneError, ServiceUnavailableError, UnauthorizedError, globalErrorHandler } from '@/middleware/error.middleware';

const mockGetPublic = jest.fn<Promise<unknown>, unknown[]>();
const app = express();
app.use(express.json());
app.use('/api/v1/surveys', surveyRoutes);
app.use(globalErrorHandler);
const url = '/api/v1/surveys/public/synthetic-share-id';

/** These responses depend on current status and identity, including when unavailable. */
function expectUncacheable(response: request.Response): void {
  expect(response.headers['cache-control']).toBe('private, no-store');
}

describe('public survey HTTP cache policy', () => {
  it('does not cache a closed response or the newly reopened response at the same URL', async () => {
    mockGetPublic.mockRejectedValueOnce(new GoneError('問卷尚未開放或已關閉'));
    const closed = await request(app).get(url).expect(410);
    expectUncacheable(closed);

    const active = { success: true, data: { managed_version: 1, status: 'active', has_responded: false } };
    mockGetPublic.mockResolvedValueOnce(active);
    const reopened = await request(app).get(url).expect(200);
    expect(reopened.body).toEqual(active);
    expectUncacheable(reopened);
  });

  it('does not cache identity-specific completion state from a real authenticated request', async () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('Missing test JWT secret');
    const token = jwt.sign({ id: 710001, isTemp: false }, secret);
    const completed = { success: true, data: { managed_version: 1, has_responded: true } };
    mockGetPublic.mockResolvedValueOnce(completed);
    const response = await request(app).get(url).auth(token, { type: 'bearer' }).expect(200);
    expect(mockGetPublic).toHaveBeenCalledWith('synthetic-share-id', 710001, false);
    expect(response.body).toEqual(completed);
    expectUncacheable(response);
  });

  it('keeps the unauthenticated member-only error uncacheable without changing its denial', async () => {
    mockGetPublic.mockRejectedValueOnce(new UnauthorizedError('請先登入再填寫此問卷'));
    const response = await request(app).get(url).expect(401);
    expect(mockGetPublic).toHaveBeenCalledWith('synthetic-share-id', null, false);
    expectUncacheable(response);
  });

  it('does not cache the controller not-found response', async () => {
    mockGetPublic.mockResolvedValueOnce(null);
    expectUncacheable(await request(app).get(url).expect(404));
  });

  it.each([
    [503, () => new ServiceUnavailableError()],
    [500, () => new Error('Synthetic unexpected failure')],
  ])('also prevents caching a %i error handled outside the controller', async (status, failure) => {
    mockGetPublic.mockRejectedValueOnce(failure());
    expectUncacheable(await request(app).get(url).expect(status));
  });

  it('preserves the existing legacy and cohort-feedback response payloads', async () => {
    for (const data of [{ managed_version: null, questions: [] }, { cohort_feedback: true, questions: [] }]) {
      const payload = { success: true, data };
      mockGetPublic.mockResolvedValueOnce(payload);
      const response = await request(app).get(url).expect(200);
      expect(response.body).toEqual(payload);
      expectUncacheable(response);
    }
  });
});
