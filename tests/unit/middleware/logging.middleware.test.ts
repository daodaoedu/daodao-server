import { sanitizeHeadersForLogging, sanitizeRequestBodyForLogging, shouldLogRequestBody } from '@/middleware/logging.middleware';

describe('Future Letter request log privacy', () => {
  it('never logs Future Letter request bodies', () => {
    const body = { currentSelf: 'private now', message: 'private future' };
    expect(shouldLogRequestBody('/api/v1/me/future-letters', 'POST')).toBe(false);
    expect(shouldLogRequestBody('/api/v1/me/future-letters/id/open', 'POST')).toBe(false);
    expect(sanitizeRequestBodyForLogging('/api/v1/me/future-letters/id', body)).toBe('[REDACTED]');
  });

  it('redacts authentication headers and cookies', () => {
    expect(sanitizeHeadersForLogging({
      authorization: 'Bearer private-token',
      cookie: 'auth_token=private-token; session=private-session',
      'user-agent': 'Playwright',
    })).toEqual({
      authorization: '[REDACTED]',
      cookie: '[REDACTED]',
      'user-agent': 'Playwright',
    });
  });
});
