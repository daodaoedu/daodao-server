import Redis from 'ioredis';
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createServer } from 'net';
import { exchangeAuthCode, generateAuthCode, isValidAuthCode, storeAuthCode } from '../auth-code.service';

let client: Redis;
let processHandle: ChildProcess;
let directory: string;
let container: string | undefined;

jest.mock('../../database/redis.service', () => ({
  __esModule: true,
  default: {
    setex: (...args: Parameters<Redis['setex']>) => client.setex(...args),
    get: (key: string) => client.get(key),
    del: (key: string) => client.del(key),
    eval: (script: string, keyCount: number, key: string) => client.eval(script, keyCount, key),
    exists: (key: string) => client.exists(key),
  },
}));

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'daodao-410-redis-'));
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing isolated Redis port');
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const port = address.port;
  container = `daodao410-${process.pid}-${port}`;
  processHandle = spawn('docker', ['run', '--rm', '--name', container,
    '--label', 'io.daodao.test=auth-code-410',
    '--publish', `127.0.0.1:${port}:6379`, 'redis:6.0-alpine',
    '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  processHandle.on('error', () => undefined);
  client = new Redis({ host: '127.0.0.1', port, maxRetriesPerRequest: 0, connectTimeout: 100 });
  client.on('error', () => undefined);
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try { await client.ping(); } catch {
      await new Promise((resolve) => setTimeout(resolve, 25));
      continue;
    }
    expect(await client.info('server')).toMatch(/redis_version:6\.0\./);
    return;
  }
  throw new Error('Required disposable real Redis unavailable');
}, 15000);

beforeEach(async () => { await client.flushdb(); });

afterAll(async () => {
  client?.disconnect();
  if (processHandle && processHandle.exitCode === null && processHandle.signalCode === null) {
    await new Promise<void>((resolve) => {
      processHandle.once('exit', () => resolve());
      if (container) spawnSync('docker', ['stop', container]);
      else processHandle.kill('SIGTERM');
    });
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('authorization code exchange with real isolated Redis', () => {
  it('allows exactly one of 32 simultaneous exchanges and rejects replay', async () => {
    const code = generateAuthCode();
    await storeAuthCode(code, 'synthetic-token', 'synthetic-state', true);
    const results = await Promise.all(Array.from({ length: 32 }, () => exchangeAuthCode(code)));
    expect(results.filter((result) => result !== null)).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(31);
    expect(results.find((result) => result !== null)).toEqual({ token: 'synthetic-token', state: 'synthetic-state', isNewUser: true });
    expect(await isValidAuthCode(code)).toBe(false);
    expect(await exchangeAuthCode(code)).toBeNull();
  });

  it('preserves independently stored payloads, default new-user status and 300-second TTL', async () => {
    const codes = Array.from({ length: 24 }, () => generateAuthCode());
    expect(new Set(codes).size).toBe(24);
    expect(codes.every((code) => /^[a-f0-9]{64}$/.test(code))).toBe(true);
    await Promise.all(codes.map((code, index) => storeAuthCode(code, `token-${index}`, `state-${index}`)));
    const ttl = await client.ttl(`auth_code:${codes[0]}`);
    expect(ttl).toBeGreaterThanOrEqual(299);
    expect(ttl).toBeLessThanOrEqual(300);
    expect(await isValidAuthCode(codes[0])).toBe(true);
    const results = await Promise.all(codes.map(exchangeAuthCode));
    expect(results).toEqual(codes.map((_code, index) => ({ token: `token-${index}`, state: `state-${index}`, isNewUser: false })));
  });

  it('rejects missing and Redis-expired codes', async () => {
    expect(await exchangeAuthCode(generateAuthCode())).toBeNull();
    const code = generateAuthCode();
    await storeAuthCode(code, 'synthetic', 'state');
    await client.pexpire(`auth_code:${code}`, 1);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(await exchangeAuthCode(code)).toBeNull();
  });

  it.each(['used', 'corrupt'])('rejects and consumes %s stored data', async (kind) => {
    const code = generateAuthCode();
    await client.setex(`auth_code:${code}`, 300, kind === 'used'
      ? JSON.stringify({ token: 'synthetic', state: 'state', used: true, isNewUser: false }) : '{');
    expect(await exchangeAuthCode(code)).toBeNull();
    expect(await isValidAuthCode(code)).toBe(false);
    expect(await exchangeAuthCode(code)).toBeNull();
  });

  it('fails closed on a real Redis command error', async () => {
    const code = generateAuthCode();
    await client.lpush(`auth_code:${code}`, 'wrong-type');
    await expect(exchangeAuthCode(code)).rejects.toThrow('WRONGTYPE');
  });
});
