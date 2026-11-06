import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const helper = path.join(__dirname, 'oauth-resources.cjs');
function verify(overrides: Record<string, string | undefined> = {}): SpawnSyncReturns<string> {
  const directory = mkdtempSync(path.join(tmpdir(), 'oauth-owner-'));
  const run = 'owned-test-run';
  const ids = ['a'.repeat(64), 'b'.repeat(64), 'c'.repeat(64)];
  const script = `#!${process.execPath}
const args=process.argv.slice(2);
if(args[0]==='context')process.stdout.write(args[1]==='show'?'local':(process.env.FAKE_ENDPOINT||'unix:///var/run/docker.sock'));
else {
const ports={'5432/tcp':[{HostIp:'127.0.0.1',HostPort:process.env.FAKE_PORT||'5432'}],'6379/tcp':[{HostIp:'127.0.0.1',HostPort:'6379'}],'1025/tcp':[{HostIp:'127.0.0.1',HostPort:'1025'}],'8025/tcp':[{HostIp:'127.0.0.1',HostPort:'8025'}]};
process.stdout.write(JSON.stringify({labels:{'io.daodao.local-tests':process.env.FAKE_LABEL||'${run}'},running:process.env.FAKE_STOPPED!=='1',ports}));
}`;
  try {
    writeFileSync(path.join(directory, 'docker'), script, { mode: 0o755 });
    return spawnSync(process.execPath, ['-e', `require(${JSON.stringify(helper)})();process.stdout.write('verified')`], {
      encoding: 'utf8', timeout: 5000, env: {
        ...process.env, PATH: `${directory}:${process.env.PATH}`, DOCKER_HOST: '', DOCKER_CONTEXT: '',
        OAUTH_TEST_RUN_ID: run, OAUTH_TEST_POSTGRES_CONTAINER_ID: ids[0], OAUTH_TEST_REDIS_CONTAINER_ID: ids[1], OAUTH_TEST_MAILPIT_CONTAINER_ID: ids[2],
        OAUTH_TEST_DATABASE_URL: 'postgresql://test:password@127.0.0.1:5432/daodao_test',
        OAUTH_TEST_REDIS_URL: 'redis://127.0.0.1:6379/0', OAUTH_TEST_SMTP_PORT: '1025', OAUTH_TEST_MAILPIT_URL: 'http://127.0.0.1:8025', ...overrides,
      },
    });
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

describe('OAuth disposable resource ownership', () => {
  it('accepts running owned containers with matching local ports', () => {
    const result = verify(); expect(result.status).toBe(0); expect(result.stdout).toBe('verified');
  });
  it.each([
    { OAUTH_TEST_RUN_ID: undefined }, { OAUTH_TEST_REDIS_CONTAINER_ID: undefined },
    { OAUTH_TEST_POSTGRES_CONTAINER_ID: 'foreign-name' }, { FAKE_LABEL: 'other-run' },
    { FAKE_PORT: '5433' }, { FAKE_ENDPOINT: 'tcp://remote.example.test:2375' },
    { DOCKER_HOST: 'ssh://remote.example.test' },
    { OAUTH_TEST_DATABASE_URL: 'postgresql://test:password@localhost:5432/daodao_test' },
    { OAUTH_TEST_REDIS_URL: 'redis://[::1]:6379/0' }, { FAKE_STOPPED: '1' },
  ])('rejects unowned infrastructure before application clients %#', overrides => {
    const result = verify(overrides); expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('OAuth integration resource ownership:'); expect(result.stdout).toBe('');
  });
});
