import { sanitizeLogData, sanitizeLogText, sanitizeUrlForLogging } from '../log-sanitizer';

describe('log privacy sanitizers', () => {
  test.each([
    '/cohorts/join/JOIN_SECRET?JOIN_QUERY=value&JOIN_QUERY=other#fragment',
    'https://name:password@example.com/COHORTS/%6aoin/JOIN_SECRET/extra/TAIL_SECRET?key=value',
    '/email/track/open/OPEN_SECRET',
    '/spaces/public/PUBLIC_SECRET',
    '/cohorts/join/%2e%2e/DOT_SECRET',
    '/%63ohorts%2fjoin%2fENCODED_SECRET',
  ])('redacts bearer paths and everything after them: %s', (url) => {
    const safe = sanitizeUrlForLogging(url);
    expect(safe).toContain('[REDACTED]');
    expect(safe).not.toMatch(/SECRET|QUERY|fragment|password|name:|key=value/);
  });

  test('retains safe origin/path and redacts query keys as well as values', () => {
    expect(sanitizeUrlForLogging('https://example.com/api/items?SECRET_KEY=SECRET_VALUE&again=2#secret'))
      .toBe('https://example.com/api/items?[REDACTED]');
    expect(sanitizeUrlForLogging('/api/items/42')).toBe('/api/items/42');
    expect(sanitizeUrlForLogging('https://[broken/secret?secret=1')).toBe('[REDACTED_URL]');
  });

  test('scrubs reflected URLs in messages, stacks and JSON strings', () => {
    const text = 'GET /api/items?QUERY_SECRET=value failed at https://name:PASS_SECRET@example.com/cohorts/join/JOIN_SECRET\n at /spaces/public/PUBLIC_SECRET';
    expect(sanitizeLogText(text)).not.toMatch(/SECRET|name:/);
    const json = JSON.stringify({ password: 'PASSWORD_SECRET', nested: [{ accessToken: 'TOKEN_SECRET', url: '/items?QUERY_SECRET=x' }] });
    expect(sanitizeLogText(json)).not.toMatch(/SECRET/);
    expect(sanitizeLogText('ordinary diagnostic: retry 3')).toBe('ordinary diagnostic: retry 3');
  });

  test('copies nested data, keeps diagnostics, masks credentials and tolerates cycles', () => {
    const input: Record<string, unknown> = {
      password: 'PASSWORD_SECRET', authorization: 'AUTH_SECRET', apiKey: 'KEY_SECRET',
      headers: { cookie: 'COOKIE_SECRET' }, nested: [{ refresh_token: 'TOKEN_SECRET', monkey: 'safe', count: 2 }],
      originalUrl: '/api/items?QUERY_SECRET=x', message: 'failed /cohorts/join/JOIN_SECRET',
    };
    input.self = input;
    const safe = sanitizeLogData(input);
    expect(JSON.stringify(safe)).not.toMatch(/SECRET/);
    expect(safe).toMatchObject({ nested: [{ monkey: 'safe', count: 2 }], self: '[Circular]' });
    expect(input.password).toBe('PASSWORD_SECRET');
    expect(input.originalUrl).toBe('/api/items?QUERY_SECRET=x');
    expect(input.self).toBe(input);
  });
});

describe('hostile diagnostic formatting', () => {
  test.each([
    'GET /items?value="SYNTHETIC_SECRET" failed\n at safe-stack.ts:42',
    'GET /cohorts/join/"SYNTHETIC_SECRET" failed\n at safe-stack.ts:42',
    'GET /items?value= spaced SYNTHETIC_SECRET failed\n at safe-stack.ts:42',
    'GET /items?value=<SYNTHETIC_SECRET> failed\n at safe-stack.ts:42',
    'safe /api/path then /cohorts/join/"SYNTHETIC_SECRET" failed\n at safe-stack.ts:42',
  ])('redacts the whole privacy-bearing diagnostic line: %s', (text) => {
    expect(sanitizeLogText(text)).not.toContain('SYNTHETIC_SECRET');
    expect(sanitizeLogText(text)).toContain('at safe-stack.ts:42');
  });

  test('scrubs valid JSON following diagnostic prefixes', () => {
    const text = 'Validation failed: {"password":"SYNTHETIC_SECRET","count":2,"nested":{"token":"OTHER_SECRET"}}\n at safe-stack.ts:42';
    const safe = sanitizeLogText(text);
    expect(safe).not.toMatch(/SYNTHETIC_SECRET|OTHER_SECRET/);
    expect(safe).toContain('Validation failed:');
    expect(safe).toContain('"count":2');
    expect(safe).toContain('at safe-stack.ts:42');
  });

  test('bounds deeply nested input without throwing or mutating', () => {
    const input: Record<string, unknown> = {};
    let cursor = input;
    for (let index = 0; index < 4000; index += 1) {
      const child = { password: 'SYNTHETIC_SECRET' };
      cursor.child = child;
      cursor = child;
    }
    expect(() => sanitizeLogData(input)).not.toThrow();
    expect(JSON.stringify(sanitizeLogData(input))).toContain('[MaxDepth]');
    expect(cursor.password).toBe('SYNTHETIC_SECRET');
  });
});
