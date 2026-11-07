import express from 'express';
import request from 'supertest';
import Redis from 'ioredis';
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createServer } from 'net';
import type { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { createSharedRateLimiter, disconnectRateLimitRedis } from '../shared-rate-limit';

let redisProcess: ChildProcess;
let admin: Redis;
let directory: string;
let port: number;
let container: string | undefined;
const isolatedDisconnects: Array<() => void> = [];

/** Allocate a loopback port for this suite's disposable Redis instance. */
async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing TCP address');
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

/** Start only the isolated process; never use a developer or deployed Redis. */
async function startRedis(): Promise<void> {
  if (spawnSync('redis-server', ['--version']).status !== 0) {
    container = `daodao452-${process.pid}-${port}`;
    redisProcess = spawn('docker', ['run', '--rm', '--name', container,
      '--label', 'io.daodao.test=shared-rate-limit', '--publish', `127.0.0.1:${port}:6379`,
      'redis:7-alpine', '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  } else redisProcess = spawn('redis-server', [
    '--bind', '127.0.0.1', '--port', String(port), '--save', '', '--appendonly', 'no', '--dir', directory,
  ], { stdio: 'ignore' });
  for (let i = 0; i < 400; i += 1) {
    try { await admin.ping(); return; } catch { await new Promise((resolve) => setTimeout(resolve, 25)); }
  }
  throw new Error('Disposable Redis failed to start');
}

/** Stop and await the owned child so recovery tests can reuse its port. */
async function stopRedis(): Promise<void> {
  await new Promise<void>((resolve) => {
    redisProcess.once('exit', () => resolve());
    if (container) spawnSync('docker', ['stop', container]);
    else redisProcess.kill('SIGTERM');
  });
}

/** Mount a real limiter behind an HTTP endpoint. */
function mount(limiter: RateLimitRequestHandler, userId?: number): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use((req, _res, next) => {
    if (userId !== undefined) req.user = { id: userId } as NonNullable<express.Request['user']>;
    next();
  });
  app.post('/report', limiter, (_req, res) => { res.sendStatus(200); });
  app.use((error: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.statusCode ?? 500).json({ message: error.message });
  });
  return app;
}

/** Build independent production modules as separate server processes would. */
function productionApp(userId?: number): express.Express {
  let limiter: RateLimitRequestHandler | undefined;
  jest.isolateModules(() => {
    const module = jest.requireActual<typeof import('../rate-limit.middleware')>('../rate-limit.middleware');
    const shared = jest.requireActual<typeof import('../shared-rate-limit')>('../shared-rate-limit');
    isolatedDisconnects.push(shared.disconnectRateLimitRedis);
    limiter = module.bugReportLimiter;
  });
  if (!limiter) throw new Error('Limiter was not initialized');
  return mount(limiter, userId);
}

/** Build a focused real-store limiter without changing production's configured amounts. */
function app(name: string, options: Partial<Options> = {}): express.Express {
  return mount(createSharedRateLimiter(name, { windowMs: 60_000, max: 5, ...options }));
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'daodao-452-redis-'));
  port = await freePort();
  process.env.REDIS_HOST = '127.0.0.1';
  process.env.REDIS_PORT = String(port);
  process.env.REDIS_DB = '0';
  delete process.env.REDIS_PASSWORD;
  admin = new Redis({ port, host: '127.0.0.1', maxRetriesPerRequest: 0, connectTimeout: 100 });
  admin.on('error', () => undefined);
  await startRedis();
});

beforeEach(async () => {
  disconnectRateLimitRedis();
  for (const disconnect of isolatedDisconnects.splice(0)) disconnect();
  await admin.flushdb();
});

afterAll(async () => {
  disconnectRateLimitRedis();
  for (const disconnect of isolatedDisconnects) disconnect();
  await stopRedis();
  admin.disconnect();
  await rm(directory, { recursive: true, force: true });
});

describe('shared Redis rate limits through HTTP', () => {
  it('production bug-report limiter rejects the sixth combined request across server instances', async () => {
    const servers = [productionApp(), productionApp()];
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      statuses.push((await request(servers[i % 2]).post('/report')).status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it('counts the same authenticated user across IPs while isolating another user', async () => {
    const servers = [productionApp(452), productionApp(452)];
    for (let i = 0; i < 5; i += 1) {
      await request(servers[i % 2]).post('/report').set('X-Forwarded-For', `192.0.2.${i + 1}`).expect(200);
    }
    await request(servers[1]).post('/report').set('X-Forwarded-For', '192.0.2.99').expect(429);
    await request(productionApp(453)).post('/report').expect(200);
  });

  it('retains the existing window after a server instance is recreated', async () => {
    const first = productionApp();
    for (let i = 0; i < 5; i += 1) await request(first).post('/report').expect(200);
    await request(productionApp()).post('/report').expect(429);
  });

  it('atomically admits only five of twelve concurrent requests across instances', async () => {
    const servers = [app('concurrent'), app('concurrent')];
    const responses = await Promise.all(Array.from({ length: 12 }, (_, i) => request(servers[i % 2]).post('/report')));
    expect(responses.filter((response) => response.status === 200)).toHaveLength(5);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(7);
  });

  it('isolates different limiter namespaces and preserves their individual amounts', async () => {
    const first = app('one', { max: 1 });
    const second = app('two', { max: 2 });
    await request(first).post('/report').expect(200);
    await request(first).post('/report').expect(429);
    await request(second).post('/report').expect(200);
    await request(second).post('/report').expect(200);
    await request(second).post('/report').expect(429);
  });

  it('allows stacking global and route limits without double-count warnings', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const server = express();
    server.use(createSharedRateLimiter('stack-global', { max: 3, windowMs: 60_000 }));
    server.use(createSharedRateLimiter('stack-route', { max: 1, windowMs: 60_000 }));
    server.post('/report', (_req, res) => { res.sendStatus(200); });
    await request(server).post('/report').expect(200);
    await request(server).post('/report').expect(429);
    expect(errors).not.toHaveBeenCalled();
  });

  it('isolates different deployment environments using the same Redis', async () => {
    const previous = process.env.APP_ENV;
    try {
      process.env.APP_ENV = 'qa452-a';
      const first = app('same', { max: 1 });
      process.env.APP_ENV = 'qa452-b';
      const second = app('same', { max: 1 });
      await request(first).post('/report').expect(200);
      await request(first).post('/report').expect(429);
      await request(second).post('/report').expect(200);
    } finally {
      if (previous === undefined) delete process.env.APP_ENV; else process.env.APP_ENV = previous;
    }
  });

  it('allows requests again after the configured window expires', async () => {
    const server = app('expiry', { max: 1, windowMs: 100 });
    await request(server).post('/report').expect(200);
    await request(server).post('/report').expect(429);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await request(server).post('/report').expect(200);
  });

  it('reloads scripts after Redis SCRIPT FLUSH without resetting counters', async () => {
    const server = app('scripts', { max: 1 });
    await request(server).post('/report').expect(200);
    await admin.script('FLUSH');
    await request(server).post('/report').expect(429);
  });

  it('fails open with an error log at startup, then resumes enforcement after Redis recovers', async () => {
    await stopRedis();
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const server = app('recovery', { max: 1 });
    const began = Date.now();
    await request(server).post('/report').expect(200);
    expect(Date.now() - began).toBeLessThan(1500);
    expect(errors).toHaveBeenCalled();
    await startRedis();
    // The dedicated client reconnects independently of the fixture's admin client.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await request(server).post('/report').expect(200);
    await request(server).post('/report').expect(429);
  });

  it('does not repeat an increment when Redis executed it but its response was lost', async () => {
    const server = app('lost-response', { max: 2 });
    await request(server).post('/report').expect(200);
    const original = Redis.prototype.call;
    let lost = false;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Redis.prototype, 'call').mockImplementation(function (this: Redis, ...args: Parameters<Redis['call']>) {
      const result = original.apply(this, args);
      if (String(args[0]).toUpperCase() === 'EVALSHA' && !lost) {
        lost = true;
        return Promise.resolve(result).then(() => { throw new Error('Command timed out after Redis executed increment'); });
      }
      return result;
    });
    await request(server).post('/report').expect(200);
    const keys = await admin.keys('*lost-response:*');
    expect(keys).toHaveLength(1);
    expect(await admin.get(keys[0])).toBe('2');
    await request(server).post('/report').expect(429);
  });

  it('bounds latency and logs while an established Redis connection stops answering', async () => {
    const server = app('stall', { max: 1 });
    await request(server).post('/report').expect(200);
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await admin.call('CLIENT', 'PAUSE', '1400', 'ALL');
    const began = Date.now();
    await request(server).post('/report').expect(200);
    expect(Date.now() - began).toBeLessThan(1300);
    expect(errors).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await request(server).post('/report').expect(429);
  });
});
