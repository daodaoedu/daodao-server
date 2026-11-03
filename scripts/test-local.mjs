#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OWNER_LABEL = 'io.daodao.local-tests';
const CONTAINER_ID = /^[a-f0-9]{12,64}$/;
const HELP = `Usage: pnpm test:local [--integration] [--schema-repo PATH] [--ready-timeout-ms N] [-- JEST_ARGUMENTS]\n\nCreates its own PostgreSQL container, loads the CI-pinned schema, runs tests,\nand removes its own resources. An inherited DATABASE_URL is never used.\n`;

class CommandFailure extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
}

function parseArguments(argv) {
  const options = { integration: false, schemaRepo: undefined, readyTimeout: 60_000, jestArgs: [], help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') { options.jestArgs = argv.slice(i + 1); break; }
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--integration') options.integration = true;
    else if (arg === '--schema-repo') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new CommandFailure('--schema-repo requires a local Git path.');
      options.schemaRepo = path.resolve(value);
    } else if (arg === '--ready-timeout-ms') {
      const value = argv[++i];
      if (!value || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 600_000) {
        throw new CommandFailure('--ready-timeout-ms must be an integer between 1 and 600000.');
      }
      options.readyTimeout = Number(value);
    } else throw new CommandFailure(`Unknown runner option: ${arg}. Put Jest options after --.`);
  }
  return options;
}

async function readConfiguration(root) {
  const config = JSON.parse(await readFile(path.join(root, '.github/test-database.json'), 'utf8'));
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new CommandFailure('Invalid test database configuration object.');
  if (!/^postgres:[0-9]+(?:\.[0-9]+)*-alpine$/.test(config.postgresImage ?? '')) throw new CommandFailure('Invalid PostgreSQL image in .github/test-database.json.');
  if (config.storageRepository !== 'daodaoedu/daodao-storage') throw new CommandFailure('Invalid schema repository in .github/test-database.json.');
  if (!/^[a-f0-9]{40}$/.test(config.storageRef ?? '')) throw new CommandFailure('The schema reference must be a full immutable Git SHA.');
  if (config.schemaDirectory !== 'schema') throw new CommandFailure('The canonical schema directory must be schema.');
  return config;
}

function assertLocalDockerEndpoint(endpoint) {
  if (endpoint.startsWith('unix:///') || endpoint.startsWith('npipe://')) return;
  let url;
  try { url = new URL(endpoint); } catch { throw new CommandFailure('Docker must use a local socket or loopback endpoint. Remote Docker contexts are not supported.'); }
  if (url.protocol === 'tcp:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.username && !url.password) return;
  throw new CommandFailure('Docker must use a local socket or loopback endpoint. Remote Docker contexts are not supported.');
}

function redactor(secrets) {
  return value => secrets.reduce((text, secret) => secret ? text.split(secret).join('[redacted]') : text, String(value));
}

// Keep the tail until a secret spanning stream chunks can be recognized.
function safeWriter(target, secrets) {
  const redact = redactor(secrets);
  const tail = Math.max(1, ...secrets.map(value => value.length));
  let pending = '';
  return {
    write(chunk) {
      pending += chunk;
      let cut = Math.max(0, pending.length - tail);
      for (const secret of secrets) {
        if (!secret) continue;
        const start = pending.lastIndexOf(secret, cut);
        if (start >= 0 && start < cut && start + secret.length > cut) cut = start;
      }
      target.write(redact(pending.slice(0, cut)));
      pending = pending.slice(cut);
    },
    end() { target.write(redact(pending)); pending = ''; },
  };
}

export async function runLocal(argv = process.argv.slice(2), { root = ROOT } = {}) {
  let options;
  try { options = parseArguments(argv); }
  catch (error) { process.stderr.write(`[test-local] ${error.message}\n`); return 1; }
  if (options.help) { process.stdout.write(HELP); return 0; }

  const runId = randomUUID();
  const password = randomBytes(30).toString('base64url');
  const secrets = [password];
  const redact = redactor(secrets);
  const environment = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  delete environment.DATABASE_URL;
  delete environment.POSTGRES_PASSWORD;
  let work;
  let containerId;
  let createAttempted = false;
  let active;
  let activeKillTimer;
  let interruptTimer;
  let activeCreate = false;
  let signalCode;
  let cleaning = false;
  let result = 0;
  const abort = new AbortController();
  const stage = message => process.stdout.write(`[test-local] ${message}\n`);

  function stopActive() {
    if (!active || active.exitCode !== null || active.signalCode !== null) return;
    const child = active;
    const send = signal => {
      try { process.platform === 'win32' ? child.kill(signal) : process.kill(-child.pid, signal); }
      catch (error) { if (error.code !== 'ESRCH') process.stderr.write(`[test-local] Could not stop test child: ${error.code}\n`); }
    };
    send('SIGTERM');
    activeKillTimer = setTimeout(() => send('SIGKILL'), 1_000);
    activeKillTimer.unref();
  }

  const interrupt = signal => {
    if (signalCode) return;
    signalCode = signal === 'SIGINT' ? 130 : 143;
    abort.abort();
    if (!cleaning) {
      if (activeCreate && active) {
        const child = active;
        // Let Docker return/write the ID before cleanup; the label also recovers partial creates.
        interruptTimer = setTimeout(() => { if (active === child) stopActive(); }, 5_000);
        interruptTimer.unref();
      } else stopActive();
    }
  };
  const onInterrupt = () => interrupt('SIGINT');
  const onTerminate = () => interrupt('SIGTERM');
  process.on('SIGINT', onInterrupt);
  process.on('SIGTERM', onTerminate);

  async function command(program, args, { env = environment, quiet = true, allowFailure = false, timeout = 120_000, input, cleanup = false, creating = false } = {}) {
    if (abort.signal.aborted && !cleanup) throw new CommandFailure('Interrupted.', signalCode);
    return await new Promise((resolve, reject) => {
      const child = spawn(program, args, { cwd: root, env, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
      active = child;
      activeCreate = creating;
      let stdout = '', stderr = '', expired = false;
      const out = safeWriter(process.stdout, secrets), err = safeWriter(process.stderr, secrets);
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      child.stdout.on('data', chunk => { stdout += chunk; if (!quiet) out.write(chunk); });
      child.stderr.on('data', chunk => { stderr += chunk; if (!quiet) err.write(chunk); });
      child.stdin.on('error', () => {});
      child.stdin.end(input);
      const timer = setTimeout(() => { expired = true; stopActive(); }, timeout);
      timer.unref();
      child.once('error', error => {
        clearTimeout(timer); clearTimeout(activeKillTimer); clearTimeout(interruptTimer);
        if (active === child) { active = undefined; activeCreate = false; }
        reject(new CommandFailure(`${program} could not start (${error.code}). Install the required tool and retry.`));
      });
      child.once('close', (code, signal) => {
        clearTimeout(timer); clearTimeout(activeKillTimer); clearTimeout(interruptTimer);
        if (active === child) { active = undefined; activeCreate = false; }
        if (!quiet) { out.end(); err.end(); }
        if (abort.signal.aborted && !cleanup) return reject(new CommandFailure('Interrupted.', signalCode));
        if (expired) return reject(new CommandFailure(`${program} timed out.`, 1));
        const exitCode = code ?? (signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1);
        if (exitCode !== 0 && !allowFailure) {
          return reject(new CommandFailure(`${program} failed (exit ${exitCode}). ${redact(stderr.trim()).slice(-1000)}`, exitCode));
        }
        resolve({ code: exitCode, stdout, stderr });
      });
    });
  }

  async function cleanupContainers() {
    if (!createAttempted) return;
    const ids = new Set(containerId ? [containerId] : []);
    const errors = [];
    if (work) {
      try {
        const cid = (await readFile(path.join(work, 'container.cid'), 'utf8')).trim();
        if (CONTAINER_ID.test(cid)) ids.add(cid);
      } catch (error) { if (error.code !== 'ENOENT') errors.push(error.message); }
    }
    // A create client may stop before the daemon commits the resource. Re-query only
    // our unique label for a bounded grace period after interruption.
    const attempts = signalCode ? 10 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const matches = await command('docker', ['ps', '-aq', '--filter', `label=${OWNER_LABEL}=${runId}`], { cleanup: true, timeout: 15_000 });
        for (const id of matches.stdout.trim().split(/\s+/).filter(Boolean)) {
          if (!CONTAINER_ID.test(id)) throw new CommandFailure('Docker returned an invalid owned container ID during cleanup.');
          ids.add(id);
        }
      } catch (error) { errors.push(error.message); }
      if (ids.size || attempt === attempts - 1) break;
      await sleep(200);
    }
    for (const id of ids) {
      try {
        const label = await command('docker', ['inspect', '--format', `{{ index .Config.Labels "${OWNER_LABEL}" }}`, id], { cleanup: true, allowFailure: true, timeout: 15_000 });
        if (label.code !== 0) {
          if (/No such (object|container)/i.test(label.stderr)) continue;
          throw new CommandFailure(`Cannot verify owned container during cleanup: ${label.stderr.trim()}`);
        }
        if (label.stdout.trim() !== runId) throw new CommandFailure('Refusing to remove a container without this run’s ownership label.');
        await command('docker', ['rm', '-f', '-v', id], { cleanup: true, timeout: 15_000 });
      } catch (error) { errors.push(error.message); }
    }
    if (errors.length) throw new CommandFailure(errors.join('; '));
  }

  try {
    const config = await readConfiguration(root);
    stage(`Run ownership ID: ${runId}`);
    stage('Checking Docker, Git and pnpm prerequisites.');
    if (environment.DOCKER_HOST && !environment.DOCKER_CONTEXT) {
      assertLocalDockerEndpoint(environment.DOCKER_HOST);
    } else {
      const context = await command('docker', ['context', 'inspect', ...(environment.DOCKER_CONTEXT ? [environment.DOCKER_CONTEXT] : []), '--format', '{{.Endpoints.docker.Host}}']);
      assertLocalDockerEndpoint(context.stdout.trim());
    }
    await command('docker', ['version', '--format', '{{.Server.Version}}']);
    await command('git', ['--version']);
    await command('pnpm', ['--version']);
    work = await mkdtemp(path.join(tmpdir(), 'daodao-test-local-'));
    let schemaRepo = options.schemaRepo;
    if (schemaRepo) {
      await command('git', ['-C', schemaRepo, 'rev-parse', '--git-dir']);
      await command('git', ['-C', schemaRepo, 'cat-file', '-e', `${config.storageRef}^{commit}`]);
    } else {
      schemaRepo = path.join(work, 'storage');
      await command('git', ['init', '--quiet', schemaRepo]);
      await command('git', ['-C', schemaRepo, 'remote', 'add', 'origin', `https://github.com/${config.storageRepository}.git`]);
      await command('git', ['-C', schemaRepo, 'fetch', '--quiet', '--depth=1', 'origin', config.storageRef]);
    }
    stage(`Loading canonical schema at ${config.storageRef}.`);
    const archive = path.join(work, 'schema.tar');
    await command('git', ['-C', schemaRepo, 'archive', '--format=tar', '--output', archive, config.storageRef, '--', config.schemaDirectory]);
    await command('tar', ['-xf', archive, '-C', work]);

    stage('Creating a disposable PostgreSQL container on a dynamic loopback port.');
    createAttempted = true;
    const created = await command('docker', ['create', '--cidfile', path.join(work, 'container.cid'), '--label', `${OWNER_LABEL}=${runId}`, '--publish', '127.0.0.1::5432', '--env', 'POSTGRES_USER=test', '--env', 'POSTGRES_DB=daodao_test', '--env', 'POSTGRES_PASSWORD', config.postgresImage], { env: { ...environment, POSTGRES_PASSWORD: password }, creating: true });
    containerId = created.stdout.trim();
    if (!CONTAINER_ID.test(containerId)) throw new CommandFailure('Docker did not return a valid container ID.');
    await command('docker', ['start', containerId]);
    const endpoint = await command('docker', ['port', containerId, '5432/tcp']);
    const portMatch = endpoint.stdout.trim().match(/^127\.0\.0\.1:(\d+)$/);
    if (!portMatch || Number(portMatch[1]) < 1 || Number(portMatch[1]) > 65535) throw new CommandFailure('Docker did not expose an isolated IPv4 loopback endpoint.');
    const databaseUrl = `postgresql://test:${password}@127.0.0.1:${portMatch[1]}/daodao_test`;
    secrets.push(databaseUrl);
    const testEnvironment = { ...environment, NODE_ENV: 'test', DATABASE_URL: databaseUrl };
    const deadline = Date.now() + options.readyTimeout;
    stage('Waiting for PostgreSQL TCP readiness.');
    while (true) {
      const ready = await command('docker', ['exec', containerId, 'pg_isready', '-h', '127.0.0.1', '-U', 'test', '-d', 'daodao_test'], { allowFailure: true, timeout: Math.max(1, deadline - Date.now()) });
      if (ready.code === 0) break;
      if (Date.now() >= deadline) throw new CommandFailure('PostgreSQL did not become ready within the configured timeout.');
      try { await sleep(Math.min(200, Math.max(1, deadline - Date.now())), undefined, { signal: abort.signal }); }
      catch { throw new CommandFailure('Interrupted.', signalCode); }
    }
    stage('Initializing the empty test database using the CI bootstrap.');
    await command('bash', [path.join(root, '.github/scripts/init-test-database.sh'), containerId, path.join(work, config.schemaDirectory)]);
    stage('Generating Prisma types from this checkout.');
    await command('pnpm', ['run', 'types:generate'], { env: testEnvironment, quiet: false, timeout: 300_000 });
    const testArguments = ['test', ...(options.integration ? ['tests/integration'] : []), ...options.jestArgs];
    stage(options.integration ? 'Running integration tests.' : 'Running the complete test suite.');
    await command('pnpm', testArguments, { env: testEnvironment, quiet: false, timeout: 1_800_000 });
  } catch (error) {
    result = signalCode ?? error.code ?? 1;
    if (!Number.isInteger(result)) result = 1;
    process.stderr.write(`[test-local] ${redact(error.message)}\n`);
  } finally {
    cleaning = true;
    stage('Cleaning this run’s disposable resources.');
    try { await cleanupContainers(); }
    catch (error) {
      process.stderr.write(`[test-local] Cleanup failed: ${redact(error.message)}\n`);
      if (result === 0) result = 1;
    }
    try { if (work) await rm(work, { recursive: true, force: true }); }
    catch (error) { process.stderr.write(`[test-local] Temporary cleanup failed: ${redact(error.message)}\n`); if (result === 0) result = 1; }
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onTerminate);
  }
  return signalCode ?? result;
}

if (process.argv[1] && await realpath(process.argv[1]).catch(() => path.resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runLocal();
}
