const { existsSync } = require('node:fs');
const path = require('node:path');

const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
const fail = message => { throw new Error(`OAuth integration preflight: ${message}`); };
const localUrl = (name, protocols) => {
  const value = process.env[name];
  if (!value) fail(`${name} is required; use pnpm test:oauth:local.`);
  let url;
  try { url = new URL(value); } catch { fail(`${name} must be a local service URL.`); }
  if (!protocols.includes(url.protocol) || !loopback.has(url.hostname) || url.hash || url.search) {
    fail(`${name} must point only to an isolated loopback service.`);
  }
  return url;
};

if (process.env.NODE_ENV !== 'test' || process.env.OAUTH_INTEGRATION_TEST !== '1') {
  fail('NODE_ENV=test and OAUTH_INTEGRATION_TEST=1 are required.');
}
if (existsSync(path.join(process.cwd(), '.env')) || existsSync(path.join(process.cwd(), '.env.test'))) {
  fail('The integration worker must use an empty owned cwd, without private environment files.');
}
const database = localUrl('OAUTH_TEST_DATABASE_URL', ['postgres:', 'postgresql:']);
if (database.pathname !== '/daodao_test' || database.username !== 'test' || !database.password) {
  fail('Only the disposable test user/database is allowed.');
}
const redis = localUrl('OAUTH_TEST_REDIS_URL', ['redis:']);
if (redis.username || redis.password || !/^\/(?:[0-9]|1[0-5])?$/.test(redis.pathname)) {
  fail('Redis must use an unauthenticated disposable local database.');
}
const mailpit = localUrl('OAUTH_TEST_MAILPIT_URL', ['http:']);
if (mailpit.username || mailpit.password || !['', '/'].includes(mailpit.pathname)) {
  fail('Mailpit must be the disposable local HTTP API.');
}
const smtpPort = process.env.OAUTH_TEST_SMTP_PORT;
if (!/^\d+$/.test(smtpPort || '') || Number(smtpPort) < 1 || Number(smtpPort) > 65535) {
  fail('OAUTH_TEST_SMTP_PORT must be an explicit local service port.');
}
for (const name of Object.keys(process.env)) {
  if (/^(REDIS_|SMTP_|EMAIL_|GOOGLE_)/.test(name) || ['COOKIE_DOMAIN', 'DEV_LOGIN_SECRET', 'DOTENV_KEY'].includes(name)) {
    delete process.env[name];
  }
}
Object.assign(process.env, {
  DATABASE_URL: database.href,
  REDIS_URL: redis.href,
  REDIS_HOST: redis.hostname.replace(/^\[|\]$/g, ''),
  REDIS_PORT: redis.port || '6379',
  REDIS_DB: redis.pathname.slice(1) || '0',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: smtpPort,
  SMTP_SECURE: 'false',
  EMAIL_ADDRESS: 'sender@oauth.example.test',
  JWT_SECRET: 'isolated-oauth-integration-signing-key',
  SESSION_SECRET: 'isolated-oauth-integration-session-key',
  GOOGLE_CLIENT_ID: 'isolated-oauth-test-client',
  GOOGLE_CLIENT_SECRET: 'isolated-oauth-test-client-secret',
  GOOGLE_CALLBACK_URL: 'http://127.0.0.1/api/v1/auth/google/callback',
  FRONTEND_URL: 'http://127.0.0.1:3001',
  WEBSITE_URL: 'http://127.0.0.1:3001',
  BACKEND_URL: 'http://127.0.0.1:3000',
  ADMIN_FRONTEND_URL: 'http://127.0.0.1:3002',
  FUTURE_LETTER_ACTIVE_KEY_VERSION: 'oauth-test',
  FUTURE_LETTER_ENCRYPTION_KEYS: JSON.stringify({ 'oauth-test': Buffer.alloc(32, 7).toString('base64') }),
});
