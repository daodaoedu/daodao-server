const assert = require('node:assert/strict');
const { test } = require('node:test');
const { redactValue, redactText } = require('../lib/test-output.cjs');

test('display removes nested auth fields and input token reflections without mutating raw response', () => {
  const raw = { success: true, data: { id: 7, token: 'returned-private-value', profile: { name: 'Example', refreshToken: 'refresh-private-value' } }, message: 'rejected supplied-private-value returned-private-value' };
  const display = redactValue(raw, ['supplied-private-value']);
  assert.equal(display.data.token, '[REDACTED]');
  assert.equal(display.data.profile.refreshToken, '[REDACTED]');
  assert.equal(display.message, 'rejected [REDACTED] [REDACTED]');
  assert.equal(display.data.id, 7);
  assert.equal(display.data.profile.name, 'Example');
  assert.equal(raw.data.token, 'returned-private-value');
});

test('display removes auth headers, passwords and JWT strings from error text', () => {
  const raw = { headers: { Authorization: 'Bearer header-private-value', Cookie: 'auth_token=cookie-private-value' }, password: 'password-private-value' };
  const display = JSON.stringify(redactValue(raw));
  for (const value of ['header-private-value', 'cookie-private-value', 'password-private-value']) assert.ok(!display.includes(value));
  const syntheticJwt = ['eyJheader', 'eyJpayload', 'signature'].join('.');
  assert.equal(redactText(`failed Bearer header-private-value; JWT ${syntheticJwt}`), 'failed Bearer [REDACTED] JWT [REDACTED]');
});

test('known token prefixes are removed longest-first and empty values do not alter text', () => {
  assert.equal(redactText('long-private-value and long-private', ['', 'long-private', 'long-private-value']), '[REDACTED] and [REDACTED]');
});

test('display removes incoming and returned credential reflections from object keys without changing raw data', () => {
  const incoming = 'key-private-input-value';
  const returned = 'key-private-return-value';
  const raw = {
    token: returned,
    error: { details: { [incoming]: 'first detail', [returned]: 'second detail', [`field-${incoming}`]: 'third detail' } },
  };
  const original = JSON.stringify(raw);
  const display = redactValue(raw, [incoming]);
  const output = JSON.stringify(display);
  assert.ok(!output.includes(incoming));
  assert.ok(!output.includes(returned));
  assert.equal(JSON.stringify(raw), original);
  assert.equal(display.token, '[REDACTED]');
  // Display-key collisions may omit a diagnostic entry, but never change raw parsing.
  assert.ok(Object.keys(display.error.details).length < Object.keys(raw.error.details).length);
  const renamedSensitiveKey = redactValue({ token: returned }, ['token']);
  assert.equal(renamedSensitiveKey['[REDACTED]'], '[REDACTED]');
});

test('authorization credentials are removed from separate reflections and raw input is preserved', () => {
  for (const scheme of ['Bearer', 'Basic']) {
    const credential = `synthetic-${scheme.toLowerCase()}-credential`;
    const raw = {
      headers: { Authorization: [`${scheme} ${credential}`] },
      details: { [credential]: `Rejected ${credential}` },
      status: 401,
    };
    const original = JSON.stringify(raw);
    const display = redactValue(raw);
    assert.ok(!JSON.stringify(display).includes(credential));
    assert.equal(display.status, 401);
    assert.equal(JSON.stringify(raw), original);
  }
});

test('cookie credentials are removed from separate reflections without redacting attribute values', () => {
  const raw = {
    headers: {
      Cookie: 'session=synthetic-session-value; csrf=synthetic-csrf-value; quoted="synthetic-quoted-value"',
      'Set-Cookie': ['refresh=synthetic-refresh-value; Path=/; SameSite=Lax; Max-Age=3600; HttpOnly'],
    },
    message: 'synthetic-session-value synthetic-csrf-value synthetic-refresh-value synthetic-quoted-value',
    path: '/',
    retryAfter: '3600',
  };
  const original = JSON.stringify(raw);
  const display = redactValue(raw);
  for (const secret of ['synthetic-session-value', 'synthetic-csrf-value', 'synthetic-refresh-value', 'synthetic-quoted-value']) {
    assert.ok(!JSON.stringify(display).includes(secret));
  }
  assert.equal(display.path, '/');
  assert.equal(display.retryAfter, '3600');
  assert.equal(JSON.stringify(raw), original);
});
