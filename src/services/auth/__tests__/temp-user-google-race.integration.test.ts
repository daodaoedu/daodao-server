/**
 * 真 PostgreSQL 併發回歸。只操作 localhost 上本測試建立的獨立 schema。
 * TEMP_USER_RACE_DATABASE_URL=postgresql://test:test@127.0.0.1:<port>/daodao_test pnpm test --runInBand <本檔>
 * 此 fixture 使用 storage 的 temp_users 欄位，加上 dev 已存在／migration 補齊的 UNIQUE。
 */
import { randomUUID } from 'crypto';
import express from 'express';
import request from 'supertest';
import { PrismaClient, Prisma } from '../../../../generated/prisma';
import { ConflictError, asyncHandler, globalErrorHandler } from '../../../middleware/error.middleware';

let mockDbClient: unknown;
jest.mock('../../database/prisma.service', () => ({ get prisma(): unknown { return mockDbClient; } }));
jest.mock('../../user.service', () => ({ userService: {} }));
jest.mock('../../jwt.service', () => ({ jwtService: {} }));
jest.mock('../../logging/logger.service', () => ({ loggerService: {} }));
jest.mock('../../email/welcome-email.service', () => ({ sendWelcomeEmailInBackground: jest.fn() }));

import { findOrCreateTempUser } from '../auth.service';

const databaseUrl = process.env.TEMP_USER_RACE_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Google temporary identity real PostgreSQL concurrency', () => {
  const schemaName = `temp_user_race_${randomUUID().replace(/-/g, '')}`;
  let admin: PrismaClient;
  let database: PrismaClient;
  let afterRead: ((where: Prisma.temp_usersWhereInput | undefined) => Promise<void>) | undefined;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error('TEMP_USER_RACE_DATABASE_URL is required');
    const target = new URL(databaseUrl);
    if (!['localhost', '127.0.0.1'].includes(target.hostname)) throw new Error('Only a local disposable PostgreSQL is allowed');
    admin = new PrismaClient({ datasourceUrl: target.toString() });
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    target.searchParams.set('schema', schemaName);
    database = new PrismaClient({ datasourceUrl: target.toString() });
    await database.$executeRawUnsafe(`CREATE TABLE "temp_users" (
      "id" SERIAL PRIMARY KEY,
      "google_id" VARCHAR(255) UNIQUE,
      "email" VARCHAR(255) NOT NULL UNIQUE,
      "apple_id" VARCHAR(255) UNIQUE,
      "name" VARCHAR(255) NOT NULL,
      "photo_url" TEXT,
      "verified_login_email" VARCHAR(255),
      "created_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    mockDbClient = database.$extends({
      query: {
        temp_users: {
          async $allOperations({ operation, args, query }) {
            const result = await query(args);
            if ((operation === 'findFirst' || operation === 'findUnique') && result === null) {
              await afterRead?.(args.where);
            }
            return result;
          }
        }
      }
    });
  });

  beforeEach(async () => {
    afterRead = undefined;
    await database.temp_users.deleteMany();
  });

  afterAll(async () => {
    await database?.$disconnect();
    if (admin) {
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await admin.$disconnect();
    }
  });

  /** Release only once every competing request has really read the absent email. */
  const raceAfterEmptyEmailReads = (count: number): void => {
    let remaining = count;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    afterRead = async (where): Promise<void> => {
      if (!where?.email || remaining === 0) return;
      remaining -= 1;
      if (remaining === 0) release();
      await gate;
    };
  };

  it('returns one identity to all concurrent logins and marks exactly one creator', async () => {
    raceAfterEmptyEmailReads(6);
    const outcomes = await Promise.allSettled(Array.from({ length: 6 }, () => findOrCreateTempUser({
      googleId: 'same-subject', email: 'same@example.test', name: 'Original Name'
    })));
    const responses = outcomes.flatMap((outcome) => outcome.status === 'fulfilled' ? [outcome.value] : []);
    expect(responses).toHaveLength(6);
    const rows = await database.temp_users.findMany();
    expect(rows).toHaveLength(1);
    expect(responses.map((response) => response.data)).toEqual(expect.arrayContaining([
      { user: rows[0], isNewUser: true }, { user: rows[0], isNewUser: false }
    ]));
    expect(responses.filter((response) => response.data?.isNewUser)).toHaveLength(1);
    for (const response of responses) expect(response.data?.user).toEqual(rows[0]);
  });

  it('keeps one stable identity when its concurrent profiles have different emails', async () => {
    raceAfterEmptyEmailReads(2);
    const outcomes = await Promise.allSettled([
      findOrCreateTempUser({ googleId: 'stable-subject', email: 'first@example.test', name: 'First' }),
      findOrCreateTempUser({ googleId: 'stable-subject', email: 'second@example.test', name: 'Second' })
    ]);
    const responses = outcomes.flatMap((outcome) => outcome.status === 'fulfilled' ? [outcome.value] : []);
    expect(responses).toHaveLength(2);
    const rows = await database.temp_users.findMany();
    expect(rows).toHaveLength(1);
    expect(responses.filter((response) => response.data?.isNewUser)).toHaveLength(1);
    for (const response of responses) expect(response.data?.user).toEqual(rows[0]);
  });

  it('rejects a competing distinct Google subject instead of authenticating by email', async () => {
    raceAfterEmptyEmailReads(2);
    const outcomes = await Promise.allSettled([
      findOrCreateTempUser({ googleId: 'first-subject', email: 'shared@example.test', name: 'First' }),
      findOrCreateTempUser({ googleId: 'second-subject', email: 'shared@example.test', name: 'Second' })
    ]);
    const rows = await database.temp_users.findMany();
    expect(rows).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    const rejected = outcomes.find((outcome) => outcome.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason).toBeInstanceOf(ConflictError);
    const accepted = outcomes.find((outcome) => outcome.status === 'fulfilled');
    expect(accepted?.status === 'fulfilled' && accepted.value.data?.user).toEqual(rows[0]);
  });

  it('reuses a same-subject row inserted between the provider and email reads', async () => {
    let reached: () => void = () => undefined;
    let release: () => void = () => undefined;
    const paused = new Promise<void>((resolve) => { reached = resolve; });
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let pauseFirst = true;
    afterRead = async (where): Promise<void> => {
      if (where?.google_id && pauseFirst) {
        pauseFirst = false;
        reached();
        await gate;
      }
    };
    const profile = { googleId: 'read-gap-subject', email: 'read-gap@example.test', name: 'Original' };
    const pending = findOrCreateTempUser(profile);
    await paused;
    const [winner] = await Promise.allSettled([findOrCreateTempUser(profile)]);
    release();
    const [reused] = await Promise.allSettled([pending]);
    expect(winner.status).toBe('fulfilled');
    expect(reused.status).toBe('fulfilled');
    if (winner.status !== 'fulfilled' || reused.status !== 'fulfilled') throw new Error('Both same-subject logins must succeed');
    expect(winner.value.data?.isNewUser).toBe(true);
    expect(reused.value.data).toEqual({ user: winner.value.data?.user, isNewUser: false });
    expect(await database.temp_users.count()).toBe(1);
  });


  /** Test-only HTTP adapter: no real Google provider callback or new product route. */
  const httpHarness = (): express.Express => {
    const app = express();
    app.use(express.json());
    app.post('/test/google-temp-user', asyncHandler(async (req, res) => {
      res.json(await findOrCreateTempUser(req.body));
    }));
    app.use(globalErrorHandler);
    return app;
  };

  it('serves concurrent same-subject HTTP requests as 200 with one identity', async () => {
    raceAfterEmptyEmailReads(3);
    const app = httpHarness();
    const responses = await Promise.all(Array.from({ length: 3 }, () => request(app).post('/test/google-temp-user').send({
      googleId: 'http-same-subject', email: 'http-same@example.test', name: '原始名稱'
    })));
    const rows = await database.temp_users.findMany();
    expect(rows).toHaveLength(1);
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ success: true, data: { user: { id: rows[0].id, google_id: 'http-same-subject' } } });
    }
    expect(responses.filter((response) => response.body.data.isNewUser)).toHaveLength(1);
  });

  it('returns one HTTP 200 and one domain 409 for distinct subjects sharing an email', async () => {
    raceAfterEmptyEmailReads(2);
    const app = httpHarness();
    const responses = await Promise.all(['http-first-subject', 'http-second-subject'].map((googleId) => request(app)
      .post('/test/google-temp-user').send({ googleId, email: 'http-shared@example.test', name: '原始名稱' })));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const rejected = responses.find((response) => response.status === 409);
    expect(rejected?.body).toMatchObject({ success: false, data: null, error: { code: 'APP_ERROR', message: '此電子郵件已被使用' } });
    expect(rejected?.body).not.toHaveProperty('debug');
    expect(rejected?.body).not.toHaveProperty('stack');
    expect(rejected?.body.error).not.toHaveProperty('stack');
    expect(await database.temp_users.count()).toBe(1);
  });

  it('leaves an existing identity profile unchanged on subsequent login', async () => {
    const original = await database.temp_users.create({ data: {
      google_id: 'existing-subject', email: 'original@example.test', name: 'Original', photo_url: 'https://example.test/original.png'
    } });
    const response = await findOrCreateTempUser({
      googleId: 'existing-subject', email: 'changed@example.test', name: 'Changed', photoUrl: 'https://example.test/changed.png'
    });
    expect(response.data).toEqual({ user: original, isNewUser: false });
    expect(await database.temp_users.findMany()).toEqual([original]);
  });
});
