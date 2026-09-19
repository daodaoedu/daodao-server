import express, { type RequestHandler } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/email/email.service', () => ({ emailService: {} }));

import { createDevLoginRouter, isDevLoginEnabled } from '@/routes/dev-login.routes';
import { DEV_LOGIN_GOOGLE_ID_PREFIX, devLoginGoogleId } from '@/controllers/dev-login.controller';
import { ConflictError } from '@/middleware/error.middleware';
import { globalErrorHandler, notFoundHandler } from '@/middleware/error.middleware';

const SECRET = 'unit-test-dev-login-secret';
const HEADER = 'x-dev-login-secret';
const endpoint = '/api/v1/auth/dev-login';
const passThrough: RequestHandler = (_req, _res, next) => next();

/** Build an app the same way auth.routes.ts mounts the router: null router means the path is simply absent. */
const buildApp = (env: Record<string, string | undefined>): express.Express => {
  const app = express();
  app.use(express.json());
  const router = createDevLoginRouter({ env, limiter: passThrough });
  if (router) app.use('/api/v1/auth', router);
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
  return app;
};

const devEnv = { NODE_ENV: 'dev', DEV_LOGIN_SECRET: SECRET };

describe('dev-login route availability (fail closed)', () => {
  it.each([
    ['prod', SECRET],
    ['production', SECRET],
    ['test', SECRET],
    [undefined, SECRET],
    ['dev', undefined],
    ['dev', ''],
    ['development', undefined]
  ])('NODE_ENV=%p DEV_LOGIN_SECRET=%p → router not created, path is 404', async (nodeEnv, secret) => {
    const env = { NODE_ENV: nodeEnv, DEV_LOGIN_SECRET: secret };
    expect(isDevLoginEnabled(env)).toBe(false);
    expect(createDevLoginRouter({ env })).toBeNull();
    const response = await request(buildApp(env)).post(endpoint).set(HEADER, SECRET).send({ email: 'a@b.co', mode: 'temp' });
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it.each(['dev', 'development'])('NODE_ENV=%s with secret → router created', (nodeEnv) => {
    expect(isDevLoginEnabled({ NODE_ENV: nodeEnv, DEV_LOGIN_SECRET: SECRET })).toBe(true);
    expect(createDevLoginRouter({ env: { NODE_ENV: nodeEnv, DEV_LOGIN_SECRET: SECRET } })).not.toBeNull();
  });
});

describe('dev-login secret check', () => {
  it.each([undefined, '', 'wrong', `${SECRET}x`, SECRET.slice(0, -1)])('rejects header %p with 401 and no hint', async (provided) => {
    const req = request(buildApp(devEnv)).post(endpoint).send({ email: 'a@b.co', mode: 'temp' });
    const response = await (provided === undefined ? req : req.set(HEADER, provided));
    expect(response.status).toBe(401);
    expect(JSON.stringify(response.body)).not.toContain(SECRET);
    expect(prismaMock.temp_users.findFirst).not.toHaveBeenCalled();
  });
});

describe('dev-login body validation', () => {
  it.each([
    [{ mode: 'temp' }],
    [{ email: 'not-an-email', mode: 'temp' }],
    [{ email: 'a@b.co', mode: 'admin' }],
    [{ email: 'a@b.co' }],
    [{ email: 'a@b.co', mode: 'temp', name: '' }]
  ])('rejects %p with 400 before touching the database', async (body) => {
    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send(body);
    expect(response.status).toBe(400);
    expect(prismaMock.temp_users.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.contacts.findFirst).not.toHaveBeenCalled();
  });
});

describe('dev-login mode=temp', () => {
  const tempRow = { id: 77, google_id: devLoginGoogleId('qa+230@daodao.so'), email: 'qa+230@daodao.so', name: '冒煙 QA 二三〇', photo_url: null };

  it('creates a temp user with the dev-login google_id prefix and returns a temp token + cookie', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValue(null);
    prismaMock.temp_users.create.mockResolvedValue(tempRow as never);

    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET)
      .send({ email: ' qa+230@daodao.so ', mode: 'temp', name: '冒煙 QA 二三〇' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { isTemporary: true, user: { id: '77', email: 'qa+230@daodao.so', name: '冒煙 QA 二三〇' } } });
    expect(prismaMock.temp_users.create).toHaveBeenCalledWith({
      data: { google_id: devLoginGoogleId('qa+230@daodao.so'), email: 'qa+230@daodao.so', name: '冒煙 QA 二三〇', photo_url: undefined }
    });
    expect(devLoginGoogleId('qa+230@daodao.so')).toMatch(new RegExp(`^${DEV_LOGIN_GOOGLE_ID_PREFIX}[0-9a-f]{64}$`));

    const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET!) as { id: number; isTemp: boolean };
    expect(decoded).toMatchObject({ id: 77, isTemp: true });

    const cookies = response.get('Set-Cookie') ?? [];
    expect(cookies.some((c) => c.startsWith(`auth_token=${response.body.data.token}`))).toBe(true);
    expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true);
  });

  it('reuses an existing temp user for the same email instead of creating a duplicate (AC-09)', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValue({ ...tempRow, google_id: 'real-google-id' } as never);

    const first = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: 'qa+230@daodao.so', mode: 'temp' });
    const second = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: 'qa+230@daodao.so', mode: 'temp' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.data.user.id).toBe('77');
    expect(second.body.data.user.id).toBe('77');
    expect(prismaMock.temp_users.create).not.toHaveBeenCalled();
  });

  it('keeps google_id within VARCHAR(255) even for the longest valid email', async () => {
    const longEmail = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(58)}.io`; // 254 chars
    expect(longEmail.length).toBe(254);
    prismaMock.temp_users.findFirst.mockResolvedValue(null);
    prismaMock.temp_users.create.mockImplementation((async (args: { data: { google_id: string } }) => ({ ...tempRow, id: 78, email: longEmail, google_id: args.data.google_id })) as never);

    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: longEmail, mode: 'temp' });
    expect(response.status).toBe(200);
    const created = prismaMock.temp_users.create.mock.calls[0]?.[0] as { data: { google_id: string } };
    expect(created.data.google_id.length).toBe(DEV_LOGIN_GOOGLE_ID_PREFIX.length + 64);
    expect(created.data.google_id.length).toBeLessThanOrEqual(255);
  });

  it.each([
    ['ConflictError from findOrCreateTempUser', new ConflictError('此電子郵件已被使用')],
    ['Prisma P2002 unique violation', Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })]
  ])('re-reads the row instead of returning 409 when a concurrent request created it first (%s)', async (_label, error) => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(tempRow as never);
    prismaMock.temp_users.create.mockRejectedValue(error as never);

    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: 'qa+230@daodao.so', mode: 'temp' });
    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe('77');
    expect(prismaMock.temp_users.findFirst).toHaveBeenCalledTimes(2);
  });

  it('still surfaces non-unique database failures', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValue(null);
    prismaMock.temp_users.create.mockRejectedValue(new Error('database unavailable') as never);
    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: 'qa+230@daodao.so', mode: 'temp' });
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('defaults the display name to the email local part', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValue(null);
    prismaMock.temp_users.create.mockImplementation((async (args: { data: { name: string } }) => ({ ...tempRow, name: args.data.name })) as never);

    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: 'smoke.bot@daodao.so', mode: 'temp' });
    expect(response.status).toBe(200);
    expect(prismaMock.temp_users.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'smoke.bot' }) }));
  });
});

describe('dev-login mode=user', () => {
  const userRow = { id: 42, external_id: '123e4567-e89b-12d3-a456-426614174000', nickname: '既有使用者', roles: { name: 'user' } };

  it('returns a regular (non-temp) token for an existing user', async () => {
    prismaMock.contacts.findFirst.mockResolvedValue({ id: 9, email: 'existing@daodao.so', users: [userRow] } as never);
    prismaMock.users.findUnique.mockResolvedValue({ ...userRow, roles: { name: 'user', permissions: [] } } as never);

    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: 'existing@daodao.so', mode: 'user' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ isTemporary: false, user: { id: userRow.external_id, email: 'existing@daodao.so', nickname: '既有使用者' } });
    const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET!) as { id: number; _id: string; isTemp: boolean };
    expect(decoded).toMatchObject({ id: 42, _id: userRow.external_id, isTemp: false });
    expect(prismaMock.temp_users.create).not.toHaveBeenCalled();
  });

  it('returns 404 when no registered user has that email (AC-03)', async () => {
    prismaMock.contacts.findFirst.mockResolvedValue(null);
    const response = await request(buildApp(devEnv)).post(endpoint).set(HEADER, SECRET).send({ email: 'nobody@daodao.so', mode: 'user' });
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});
