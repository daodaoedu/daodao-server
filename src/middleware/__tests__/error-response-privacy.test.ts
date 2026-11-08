import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { z } from 'zod';
import {
  asyncHandler,
  BadRequestError,
  globalErrorHandler,
  notFoundHandler,
} from '../error.middleware';

const environments = ['dev', 'test', 'prod', 'production'] as const;
const originalEnvironment = process.env.NODE_ENV;
const stackMarker = 'SYNTHETIC_INTERNAL_STACK_369';
const internalPath = '/srv/private/synthetic-369/handler.ts:17:4';
const privateErrorName = 'SyntheticInternalError369';
const requestId = 'synthetic-request-369';

/** Use real Zod validation rather than imitating its public error shape. */
function validationError(): Error {
  try {
    z.object({ title: z.string().min(1, '請填標題') }).parse({ title: '' });
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
  throw new Error('Expected the synthetic input to fail validation');
}

/** Exercise Express error forwarding and only replace stack content with synthetic diagnostics. */
function errorApp(error?: Error): Express {
  const app = express();
  app.use((req: Request, _res: Response, next: NextFunction): void => {
    req.requestId = requestId;
    req.startTime = Date.now() - 25;
    next();
  });
  if (error) {
    app.get('/error', asyncHandler(async (): Promise<void> => {
      throw error;
    }));
  }
  app.use(notFoundHandler);
  app.use((failure: Error, req: Request, res: Response, next: NextFunction): void => {
    failure.stack = `${failure.name}: ${stackMarker}\n    at ${internalPath}`;
    globalErrorHandler(failure, req, res, next);
  });
  return app;
}

/** Verify the public failure envelope without coupling it to timestamp/latency values. */
function expectPublicEnvelope(body: Record<string, unknown>, code: string, message: string): void {
  expect(body).toMatchObject({
    success: false,
    data: null,
    error: { code, message },
    meta: { requestId, processingTime: expect.any(Number) },
    timestamp: expect.any(String),
  });
  expect(Number.isNaN(Date.parse(String(body.timestamp)))).toBe(false);
  expect(body.meta).toEqual(expect.objectContaining({ processingTime: expect.any(Number) }));
  expect(body).not.toHaveProperty('debug');
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  if (originalEnvironment === undefined) delete process.env.NODE_ENV;
  else Object.assign(process.env, { NODE_ENV: originalEnvironment });
});

describe.each(environments)('public error privacy in NODE_ENV=%s', environment => {
  beforeEach(() => {
    Object.assign(process.env, { NODE_ENV: environment });
  });

  test('keeps AppError status, message and field details without diagnostic fields', async () => {
    const failure = new BadRequestError('欄位資料不完整', { title: '請填標題' });
    const response = await request(errorApp(failure)).get('/error');

    expect(response.status).toBe(400);
    expectPublicEnvelope(response.body, 'APP_ERROR', '欄位資料不完整');
    expect(response.body.error.details).toEqual({ title: '請填標題' });
    for (const marker of [stackMarker, internalPath, failure.name]) expect(response.text).not.toContain(marker);
  });

  test('keeps real notFoundHandler 404 without exposing its stack or name', async () => {
    const response = await request(errorApp()).get('/missing');

    expect(response.status).toBe(404);
    expectPublicEnvelope(response.body, 'APP_ERROR', '找不到路由: /missing');
    for (const marker of [stackMarker, internalPath, 'AppError']) expect(response.text).not.toContain(marker);
  });

  test('keeps Zod validation field messages without exposing validation internals', async () => {
    const response = await request(errorApp(validationError())).get('/error');

    expect(response.status).toBe(400);
    expectPublicEnvelope(response.body, 'VALIDATION_ERROR', '請求資料格式錯誤');
    expect(response.body.error.details).toEqual({ title: '請填標題' });
    for (const marker of [stackMarker, internalPath, 'ZodError']) expect(response.text).not.toContain(marker);
  });

  test('keeps generic 500 semantics without serializing the internal error identity', async () => {
    const failure = new Error('合成公開錯誤訊息');
    failure.name = privateErrorName;
    const response = await request(errorApp(failure)).get('/error');

    expect(response.status).toBe(500);
    expectPublicEnvelope(response.body, 'INTERNAL_SERVER_ERROR', '合成公開錯誤訊息');
    for (const marker of [stackMarker, internalPath, privateErrorName]) expect(response.text).not.toContain(marker);
  });
});

test('forged debug/internal/loopback headers cannot enable response diagnostics', async () => {
  Object.assign(process.env, { NODE_ENV: 'dev' });
  const failure = new Error('合成公開錯誤訊息');
  failure.name = privateErrorName;
  const response = await request(errorApp(failure)).get('/error').set({
    'X-Debug': 'true',
    'X-Internal-Request': 'true',
    'X-Forwarded-For': '127.0.0.1',
    'X-Debug-Token': 'synthetic-not-a-secret',
  });

  expect(response.status).toBe(500);
  expectPublicEnvelope(response.body, 'INTERNAL_SERVER_ERROR', '合成公開錯誤訊息');
  for (const marker of [stackMarker, internalPath, privateErrorName]) expect(response.text).not.toContain(marker);
});

test('dev retains necessary internal diagnostics while the wire response stays private', async () => {
  Object.assign(process.env, { NODE_ENV: 'dev' });
  const failure = new Error('合成公開錯誤訊息');
  failure.name = privateErrorName;
  const response = await request(errorApp(failure)).get('/error');

  expect(response.status).toBe(500);
  const internalDiagnostics = JSON.stringify(jest.mocked(console.error).mock.calls);
  for (const marker of [stackMarker, internalPath, privateErrorName]) {
    expect(internalDiagnostics).toContain(marker);
    expect(response.text).not.toContain(marker);
  }
  expect(console.error).toHaveBeenCalled();
});
