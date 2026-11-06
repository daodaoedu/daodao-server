const { execFileSync } = require('node:child_process');

const fail = message => { throw new Error(`OAuth integration resource ownership: ${message}`); };
const docker = args => {
  try { return execFileSync('docker', args, { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { fail('Docker ownership verification failed.'); }
};

module.exports = () => {
  const run = process.env.OAUTH_TEST_RUN_ID;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,127}$/.test(run || '')) fail('A run ownership ID is required.');
  for (const name of ['OAUTH_TEST_DATABASE_URL', 'OAUTH_TEST_REDIS_URL', 'OAUTH_TEST_MAILPIT_URL']) {
    if (new URL(process.env[name]).hostname !== '127.0.0.1') fail(`${name} must use the exact owned address 127.0.0.1.`);
  }
  const services = [
    ['POSTGRES', [['5432/tcp', Number(new URL(process.env.OAUTH_TEST_DATABASE_URL).port || 5432)]]],
    ['REDIS', [['6379/tcp', Number(new URL(process.env.OAUTH_TEST_REDIS_URL).port || 6379)]]],
    ['MAILPIT', [['1025/tcp', Number(process.env.OAUTH_TEST_SMTP_PORT)], ['8025/tcp', Number(new URL(process.env.OAUTH_TEST_MAILPIT_URL).port || 80)]]],
  ];
  for (const [name] of services) {
    if (!/^[a-f0-9]{12,64}$/.test(process.env[`OAUTH_TEST_${name}_CONTAINER_ID`] || '')) fail(`${name} container ID is required.`);
  }
  const context = docker(['context', 'show']);
  const endpoint = (!process.env.DOCKER_CONTEXT && process.env.DOCKER_HOST) || docker(['context', 'inspect', context, '--format', '{{.Endpoints.docker.Host}}']);
  let local = /^(unix|npipe):\/\//.test(endpoint);
  if (!local) {
    try { const url = new URL(endpoint); local = url.protocol === 'tcp:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname); } catch { /* reject */ }
  }
  if (!local) fail('Remote Docker endpoints are forbidden.');
  for (const [name, ports] of services) {
    const id = process.env[`OAUTH_TEST_${name}_CONTAINER_ID`];
    const value = JSON.parse(docker(['inspect', '--format', '{"labels":{{json .Config.Labels}},"ports":{{json .NetworkSettings.Ports}},"running":{{json .State.Running}}}', id]));
    if (!value.running || value.labels?.['io.daodao.local-tests'] !== run) fail(`${name} is not a running container owned by this run.`);
    for (const [containerPort, expected] of ports) {
      const bindings = value.ports?.[containerPort];
      if (!Array.isArray(bindings) || bindings.length === 0 || !bindings.every(binding => binding.HostIp === '127.0.0.1' && Number(binding.HostPort) === expected)) {
        fail(`${name} ${containerPort} does not match the isolated loopback endpoint.`);
      }
    }
  }
};
