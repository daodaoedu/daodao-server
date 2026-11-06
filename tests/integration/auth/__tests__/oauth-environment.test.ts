import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const setup = path.join(__dirname, 'oauth-environment.cjs');
const isolated = {
  NODE_ENV: 'test', OAUTH_INTEGRATION_TEST: '1',
  OAUTH_TEST_DATABASE_URL: 'postgresql://test:disposable@127.0.0.1:5432/daodao_test',
  OAUTH_TEST_REDIS_URL: 'redis://127.0.0.1:6379/0',
  OAUTH_TEST_SMTP_PORT: '1025', OAUTH_TEST_MAILPIT_URL: 'http://127.0.0.1:8025',
};

/** Execute the actual preflight in a clean process without loading any application client. */
function preflight(environment: Record<string, string | undefined>, privateEnvironment = false): SpawnSyncReturns<string> {
  const directory = mkdtempSync(path.join(tmpdir(), 'oauth-env-guard-'));
  try {
    if (privateEnvironment) writeFileSync(path.join(directory, '.env'), 'DATABASE_URL=must-not-load');
    return spawnSync(process.execPath, ['-e', `require(${JSON.stringify(setup)}); process.stdout.write(JSON.stringify({database:process.env.DATABASE_URL,redis:process.env.REDIS_HOST,smtp:process.env.SMTP_HOST,emailPassword:process.env.EMAIL_PASSWORD,cookieDomain:process.env.COOKIE_DOMAIN,googleClient:process.env.GOOGLE_CLIENT_ID}))`], {
      cwd: directory, env: { ...process.env, ...isolated, ...environment }, encoding: 'utf8', timeout: 5000,
    });
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

describe('OAuth integration infrastructure preflight', () => {
  it('replaces inherited application credentials with isolated services before application imports', () => {
    const result = preflight({
      DATABASE_URL: 'postgresql://production:private@production.invalid/live',
      REDIS_HOST: 'production.invalid', SMTP_HOST: 'smtp.production.invalid',
      EMAIL_PASSWORD: 'must-not-survive', GOOGLE_CLIENT_ID: 'production-client', COOKIE_DOMAIN: '.production.invalid',
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      database: isolated.OAUTH_TEST_DATABASE_URL, redis: '127.0.0.1', smtp: '127.0.0.1', googleClient: 'isolated-oauth-test-client',
    });
    expect(result.stdout).not.toContain('production');
    expect(result.stdout).not.toContain('must-not-survive');
  });

  it.each([
    { NODE_ENV: 'production' },
    { OAUTH_INTEGRATION_TEST: undefined },
    { OAUTH_TEST_DATABASE_URL: undefined },
    { OAUTH_TEST_DATABASE_URL: 'postgresql://test:disposable@production.invalid/daodao_test' },
    { OAUTH_TEST_DATABASE_URL: 'postgresql://test:disposable@127.0.0.1/production' },
    { OAUTH_TEST_DATABASE_URL: 'postgresql://admin:disposable@127.0.0.1/daodao_test' },
    { OAUTH_TEST_REDIS_URL: 'redis://production.invalid:6379/0' },
    { OAUTH_TEST_MAILPIT_URL: 'https://mail.example.test' },
    { OAUTH_TEST_SMTP_PORT: '0' },
  ])('fails closed for invalid execution infrastructure %#', environment => {
    const result = preflight(environment);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('OAuth integration preflight:');
    expect(result.stdout).toBe('');
  });

  it('refuses a working directory containing private environment files', () => {
    const result = preflight({}, true);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('empty owned cwd');
  });
});
