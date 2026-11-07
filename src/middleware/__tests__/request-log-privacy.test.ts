import { EventEmitter } from 'events';
import { Request, Response, NextFunction } from 'express';

jest.mock('@/services/logging', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() } }));
import { logger } from '@/services/logging';
import { requestLogger, apiLogger, errorLogger } from '../logging.middleware';
import { globalErrorHandler, notFoundHandler } from '../error.middleware';
import { loggerService } from '../../services/logging/logger.service';

const url = '/api/v1/cohorts/join/SYNTHETIC_JOIN_PRIVATE?email=SYNTHETIC_QUERY_PRIVATE';
const privateMarkers = ['SYNTHETIC_JOIN_PRIVATE', 'SYNTHETIC_QUERY_PRIVATE', 'SYNTHETIC_COOKIE_PRIVATE', 'SYNTHETIC_BODY_PRIVATE'];
function fixture(statusCode = 200) {
  const req = { originalUrl: url, url, path: url.split('?')[0], method: 'POST', query: { email: 'SYNTHETIC_QUERY_PRIVATE' }, headers: { cookie: 'SYNTHETIC_COOKIE_PRIVATE' }, body: { safe: 'visible', nested: [{ password: 'SYNTHETIC_BODY_PRIVATE' }] }, get: jest.fn(), connection: {}, ip: '127.0.0.1' } as unknown as Request;
  const res = Object.assign(new EventEmitter(), { statusCode, get: jest.fn(), send: jest.fn(), json: jest.fn(), status: jest.fn() });
  res.send.mockReturnValue(res); res.json.mockReturnValue(res); res.status.mockReturnValue(res);
  return { req, res: res as unknown as Response, events: res };
}
function expectPrivateFree(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const marker of privateMarkers) expect(serialized).not.toContain(marker);
}
beforeEach(() => jest.clearAllMocks());

describe('HTTP log sinks privacy', () => {
  it.each([200, 400, 500])('sanitizes request start, completion, slow and response errors (%s) without changing payloads', status => {
    const { req, res, events } = fixture(status);
    const before = JSON.stringify(req);
    const next = jest.fn();
    const originalJson = events.json;
    requestLogger(req, res, next);
    const payload = { message: `Unable to open ${url}`, nested: { token: 'SYNTHETIC_BODY_PRIVATE' } };
    res.json(payload);
    expect(originalJson).toHaveBeenCalledWith(payload);
    (req as Request & { startTime: number }).startTime = Date.now() - 6000;
    events.emit('finish');
    events.emit('error', new Error(`Response failure ${url}`));
    expect(next).toHaveBeenCalledWith();
    expect(logger.info).toHaveBeenCalledWith('Request started', expect.objectContaining({ url: '/api/v1/cohorts/join/[REDACTED]?[REDACTED]', body: expect.objectContaining({ safe: 'visible' }) }));
    expect(logger.warn).toHaveBeenCalledWith('Slow request detected', expect.any(Object));
    for (const sink of [logger.info, logger.warn, logger.error]) expectPrivateFree((sink as jest.Mock).mock.calls);
    expect(JSON.stringify({ ...req, requestId: undefined, startTime: undefined })).toBe(before);
  });
  it.each(['/api/v1/future-letters', '/api/v1/surveys/public/fixture/responses'])('keeps complete sensitive answers out of request and error logs for %s', path => {
    const { req, res } = fixture();
    req.originalUrl = path; req.url = path;
    Object.defineProperty(req, 'path', { value: path });
    req.body = { answers: [{ answer_text: 'SYNTHETIC_ANSWER_PRIVATE' }] };
    requestLogger(req, res, jest.fn());
    errorLogger(new Error('ordinary failure'), req, res, jest.fn());
    expect(JSON.stringify((logger.info as jest.Mock).mock.calls)).not.toContain('SYNTHETIC_ANSWER_PRIVATE');
    expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain('SYNTHETIC_ANSWER_PRIVATE');
    expect(req.body.answers[0].answer_text).toBe('SYNTHETIC_ANSWER_PRIVATE');
  });
  it('sanitizes both API inline message and metadata', () => {
    const { req, res, events } = fixture(); const next = jest.fn();
    apiLogger(req, res, next); events.emit('finish');
    expect(logger.http).toHaveBeenCalledTimes(1); expectPrivateFree((logger.http as jest.Mock).mock.calls); expect(next).toHaveBeenCalledWith();
  });
  it('sanitizes error details, recursive headers and body while forwarding original error', () => {
    const { req, res } = fixture(); const next = jest.fn(); const error = new Error(`Unable to open ${url}`);
    errorLogger(error, req, res, next);
    expectPrivateFree((logger.error as jest.Mock).mock.calls); expect(next).toHaveBeenCalledWith(error);
    expect(req.body.nested[0].password).toBe('SYNTHETIC_BODY_PRIVATE');
  });
  it.each(['dev', 'prod'])('sanitizes global %s console output and preserves client not-found error', env => {
    const originalEnv = process.env.NODE_ENV; process.env.NODE_ENV = env;
    const output = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { req, res, events } = fixture(); const next = jest.fn();
      notFoundHandler(req, res, next); const error = next.mock.calls[0][0];
      globalErrorHandler(error, req, res, jest.fn() as NextFunction);
      expectPrivateFree(output.mock.calls);
      expect(events.json.mock.calls[0][0].error.message).toBe(`找不到路由: ${url}`);
    } finally { output.mockRestore(); process.env.NODE_ENV = originalEnv; }
  });
  it('sanitizes service request and error output at the Winston sink', () => {
    const sink = loggerService.getWinstonLogger();
    const http = jest.spyOn(sink, 'http').mockImplementation(() => sink);
    const error = jest.spyOn(sink, 'error').mockImplementation(() => sink);
    try {
      loggerService.logRequest({ method: 'GET', url });
      loggerService.logError(new Error(`Unable to open ${url}`), { url, nested: { cookie: 'SYNTHETIC_COOKIE_PRIVATE', password: 'SYNTHETIC_BODY_PRIVATE' } });
      expect(http).toHaveBeenCalledTimes(1); expect(error).toHaveBeenCalledTimes(1);
      expectPrivateFree(http.mock.calls); expectPrivateFree(error.mock.calls);
    } finally { http.mockRestore(); error.mockRestore(); }
  });
});
