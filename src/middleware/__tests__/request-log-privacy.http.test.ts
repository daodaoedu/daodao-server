import express from 'express';
import request from 'supertest';
import { requestLogger, apiLogger, shouldLogRequestBody, sanitizeRequestBodyForLogging } from '../logging.middleware';
import { logger } from '../../services/logging';

jest.mock('../../services/logging', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() }
}));

const marker = 'regression-private-join-marker';

it.each([200, 400])('keeps HTTP routing and payload intact while %i logs exclude secrets', async status => {
  const app = express();
  app.use(express.json(), requestLogger, apiLogger);
  app.post('/api/v1/cohorts/join/:joinToken', (req, res) => {
    Object.assign(req, { startTime: Date.now() - 6001 });
    res.status(status).json({
      joinToken: req.params.joinToken,
      originalUrl: req.originalUrl,
      nested: req.body,
      message: `Route handled ${req.originalUrl}`
    });
  });
  const url = `/api/v1/cohorts/join/${marker}?opaque=${marker}`;
  const payload = { nested: { refreshToken: marker }, diagnostic: 'keep-this' };

  const response = await request(app).post(url).send(payload);

  expect(response.status).toBe(status);
  expect(response.body).toEqual({ joinToken: marker, originalUrl: url, nested: payload, message: `Route handled ${url}` });
  expect(logger.info).toHaveBeenCalledWith('Request started', expect.objectContaining({ method: 'POST' }));
  expect(logger.http).toHaveBeenCalled();
  const emitted = JSON.stringify([
    jest.mocked(logger.info).mock.calls,
    jest.mocked(logger.warn).mock.calls,
    jest.mocked(logger.error).mock.calls,
    jest.mocked(logger.http).mock.calls
  ]);
  expect(emitted).not.toContain(marker);
  expect(emitted).toContain('keep-this');
  expect(emitted).toContain('Slow request detected');
});

it('does not reject a valid deeply nested HTTP body while creating its log snapshot', async () => {
  const app = express();
  app.use(express.json(), requestLogger);
  let payload: Record<string, unknown> = { refreshToken: marker };
  for (let index = 0; index < 4000; index += 1) payload = { child: payload };
  let observedDepth = 0;
  app.post('/api/v1/diagnostics', (req, res) => {
    let current: unknown = req.body;
    while (current && typeof current === 'object' && 'child' in current) {
      observedDepth += 1;
      current = (current as Record<string, unknown>).child;
    }
    expect(current).toEqual({ refreshToken: marker });
    res.sendStatus(204);
  });

  const response = await request(app).post('/api/v1/diagnostics').send(payload);

  expect(response.status).toBe(204);
  expect(observedDepth).toBe(4000);
  expect(JSON.stringify(jest.mocked(logger.info).mock.calls)).not.toContain(marker);
});

it('keeps sensitive-body exclusions for case-insensitive routes and URLs with queries', () => {
  const body = { currentSelf: marker, message: marker };
  expect(shouldLogRequestBody('/api/v1/me/FUTURE-LETTERS', 'POST')).toBe(false);
  expect(sanitizeRequestBodyForLogging('/api/v1/me/FUTURE-LETTERS?mode=preview', body)).toBe('[REDACTED]');
  expect(shouldLogRequestBody('/api/v1/AUTH/LOGIN', 'POST')).toBe(false);
});
