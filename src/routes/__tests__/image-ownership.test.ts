import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  process.env.R2_ACCESS_KEY_ID = 'synthetic-test-access';
  process.env.R2_SECRET_ACCESS_KEY = 'synthetic-test-secret';
  process.env.R2_BUCKET_NAME = 'isolated-image-ownership-test';
  process.env.R2_PUBLIC_URL = 'https://images.example.invalid';
  return { ...actual, S3Client: jest.fn().mockImplementation(() => ({ send: (command: unknown): Promise<unknown> => mockSend(command) })) };
});
jest.mock('../../middleware/rate-limit.middleware', () => ({
  uploadLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction): void => next(),
}));
jest.mock('../../services/database/prisma.service', () => ({
  prisma: { users: { findUnique: (args: { where: { id: number } }): Promise<{ external_id: string | null | undefined } | null> => mockFindUser(args) } },
}));

import imageRoutes from '../image.routes';
import { globalErrorHandler } from '../../middleware/error.middleware';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC6sAAAAASUVORK5CYII=', 'base64');
const users = new Map<number, string | null>();
const mockFindUser = jest.fn(async ({ where }: { where: { id: number } }) =>
  users.has(where.id) ? { external_id: users.get(where.id) } : null);
function required(value: string | undefined): string {
  if (value === undefined) throw new Error('Missing synthetic test value');
  return value;
}
const objects = new Map<string, { body: Buffer; metadata: Record<string, string> }>();
const deletedKeys: string[] = [];
let headFailure: Error | undefined;
let failedPutNumber: number | undefined;
let putAttempts = 0;
const mockSend = jest.fn(async (command: unknown) => {
  if (command instanceof PutObjectCommand) {
    putAttempts += 1;
    if (putAttempts === failedPutNumber) throw new Error('Synthetic storage write failure');
    if (command.input.IfNoneMatch === '*' && objects.has(required(command.input.Key))) {
      throw Object.assign(new Error('Precondition failed'), { $metadata: { httpStatusCode: 412 } });
    }
    objects.set(required(command.input.Key), { body: command.input.Body as Buffer, metadata: command.input.Metadata ?? {} });
    return {};
  }
  if (command instanceof HeadObjectCommand) {
    if (headFailure) throw headFailure;
    const object = objects.get(required(command.input.Key));
    if (!object) throw Object.assign(new Error('Not found'), { $metadata: { httpStatusCode: 404 } });
    return { Metadata: object.metadata };
  }
  if (command instanceof DeleteObjectCommand) {
    deletedKeys.push(required(command.input.Key));
    objects.delete(required(command.input.Key));
    return {};
  }
  if (command instanceof GetObjectCommand) throw new Error('Read not used in ownership regression');
  throw new Error('Unexpected S3 command');
});
const app = express();
app.use(express.json());
app.use('/api/v1/images', imageRoutes);
app.use(globalErrorHandler);

/** Sign real JWTs; only infrastructure is replaced, never the owner guard. */
function tokenFor(id: unknown, claims: Record<string, unknown> = {}): string {
  return jwt.sign({ id, isTemp: false, ...claims }, required(process.env.JWT_SECRET), { expiresIn: '5m' });
}
function remove(key: string, id: unknown = 710001, claims: Record<string, unknown> = {}): request.Test {
  return request(app).delete(`/api/v1/images/${encodeURIComponent(key)}`).auth(tokenFor(id, claims), { type: 'bearer' });
}
function seed(key = 'victim-image', metadata: Record<string, string> = { 'daodao-owner-id': OWNER, 'daodao-owner-version': '1' }): void {
  objects.set(key, { body: png, metadata });
}
function upload(multiple = false, id: unknown = 710001, claims: Record<string, unknown> = {}): request.Test {
  return request(app).post(`/api/v1/images${multiple ? '/multiple' : ''}`).auth(tokenFor(id, claims), { type: 'bearer' });
}
function putCommands(): PutObjectCommand[] {
  return mockSend.mock.calls.map(([command]) => command).filter((command): command is PutObjectCommand => command instanceof PutObjectCommand);
}

beforeEach(() => {
  objects.clear(); deletedKeys.length = 0;
  headFailure = undefined; failedPutNumber = undefined; putAttempts = 0;
  users.clear(); users.set(710001, OWNER); users.set(710002, OTHER);
});

describe('public image deletion ownership', () => {
  it('rejects a different authenticated user without deleting the victim image', async () => {
    seed();
    const response = await remove('victim-image', 710002);
    expect(response.status).toBe(403);
    expect(deletedKeys).toEqual([]);
    expect(objects.get('victim-image')?.body).toEqual(png);
    expect(JSON.stringify(response.body)).not.toContain(OWNER);
  });

  it('lets the owner delete an uploaded image using their server-resolved public UUID', async () => {
    const result = await upload().attach('file', png, { filename: '中文測試.png', contentType: 'image/png' });
    expect(result.status).toBe(201);
    const key = result.body.data.filename as string;
    expect(objects.get(key)?.metadata).toEqual({ 'daodao-owner-id': OWNER, 'daodao-owner-version': '1' });
    expect(objects.get(key)?.body).toEqual(png);
    expect(result.body.data.url).toBe(`https://images.example.invalid/${key}`);
    const deletion = await remove(key);
    expect(deletion.status).toBe(200);
    expect(deletion.body.data.filename).toBe(key);
    expect(objects.has(key)).toBe(false);
    expect(deletedKeys).toEqual([key]);
  });

  it.each([false, true])('stores trusted owner metadata for single/multiple upload (multiple=%s)', async multiple => {
    let action = upload(multiple, 710001, { external_id: OTHER, _id: OTHER })
      .set('x-amz-meta-daodao-owner-id', OTHER)
      .field('ownerId', OTHER).field('userId', '710002').field('external_id', OTHER)
      .attach(multiple ? 'files' : 'file', png, { filename: 'first.png', contentType: 'image/png' });
    if (multiple) action = action.attach('files', png, { filename: 'second.png', contentType: 'image/png' });
    const response = await action;
    expect(response.status).toBe(201);
    const commands = putCommands();
    expect(commands).toHaveLength(multiple ? 2 : 1);
    expect(objects.size).toBe(multiple ? 2 : 1);
    for (const command of commands) {
      expect(command.input.Metadata).toEqual({ 'daodao-owner-id': OWNER, 'daodao-owner-version': '1' });
      expect(command.input.IfNoneMatch).toBe('*');
      expect(command.input.Key).toMatch(/^[0-9a-f-]{36}$/);
      expect(objects.get(required(command.input.Key))?.body).toEqual(png);
      expect((await remove(required(command.input.Key), 710002, { external_id: OWNER })).status).toBe(403);
      expect(objects.has(required(command.input.Key))).toBe(true);
    }
    expect(deletedKeys).toEqual([]);
    for (const key of [...objects.keys()]) expect((await remove(key)).status).toBe(200);
    expect(objects.size).toBe(0);
  });

  it('ignores forged deletion body and signed optional UUID claims for another user', async () => {
    seed();
    const response = await remove('victim-image', 710002, { external_id: OWNER, _id: OWNER })
      .send({ userId: 710001, ownerId: OWNER, external_id: OWNER });
    expect(response.status).toBe(403);
    expect(deletedKeys).toEqual([]);
    expect(objects.has('victim-image')).toBe(true);
  });

  it.each([
    ['legacy', {}],
    ['missing-version', { 'daodao-owner-id': OWNER }],
    ['unknown-version', { 'daodao-owner-id': OWNER, 'daodao-owner-version': '2' }],
    ['malformed-owner', { 'daodao-owner-id': '710001', 'daodao-owner-version': '1' }],
    ['missing-owner', { 'daodao-owner-version': '1' }],
  ] as const)('denies %s metadata without deleting the object', async (_name, metadata) => {
    seed('legacy-image', metadata);
    expect((await remove('legacy-image')).status).toBe(403);
    expect(deletedKeys).toEqual([]);
    expect(objects.get('legacy-image')?.body).toEqual(png);
  });

  it.each(['delete', 'single-upload', 'multiple-upload'] as const)('rejects temporary identity colliding with a real account on %s', async operation => {
    seed();
    const claims = { isTemp: true, external_id: OWNER };
    const action = operation === 'delete'
      ? remove('victim-image', 710001, claims)
      : upload(operation === 'multiple-upload', 710001, claims)
        .attach(operation === 'multiple-upload' ? 'files' : 'file', png, { filename: 'test.png', contentType: 'image/png' });
    expect((await action).status).toBe(403);
    expect(mockFindUser).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(deletedKeys).toEqual([]);
    expect(objects.get('victim-image')?.body).toEqual(png);
  });

  it('preserves owner access for registered JWTs without the optional temporary flag', async () => {
    seed();
    expect((await remove('victim-image', 710001, { isTemp: undefined })).status).toBe(200);
    expect(deletedKeys).toEqual(['victim-image']);
    expect(objects.has('victim-image')).toBe(false);
  });

  it('does not grant administrators an owner bypass', async () => {
    seed();
    expect((await remove('victim-image', 710002, { roles: ['admin'] })).status).toBe(403);
    expect(deletedKeys).toEqual([]);
    expect(objects.has('victim-image')).toBe(true);
  });

  it('returns 404 for a missing object without issuing a delete', async () => {
    expect((await remove('missing-image')).status).toBe(404);
    expect(deletedKeys).toEqual([]);
  });

  it.each([new Error('Synthetic timeout'), Object.assign(new Error('Storage forbidden'), { $metadata: { httpStatusCode: 403 } })])(
    'fails closed if ownership metadata cannot be read (%s)', async failure => {
      seed(); headFailure = failure;
      expect((await remove('victim-image')).status).toBeGreaterThanOrEqual(400);
      expect(deletedKeys).toEqual([]);
      expect(objects.has('victim-image')).toBe(true);
    });

  it('rejects anonymous deletion and upload before storage or user lookup', async () => {
    seed();
    expect((await request(app).delete('/api/v1/images/victim-image')).status).toBe(401);
    expect((await request(app).post('/api/v1/images').attach('file', png, { filename: 'test.png', contentType: 'image/png' })).status).toBe(401);
    expect(mockFindUser).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(objects.has('victim-image')).toBe(true);
  });

  it.each([undefined, '710001', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects noncanonical numeric identity %s before storage', async id => {
    seed();
    expect((await request(app).delete('/api/v1/images/victim-image').auth(tokenFor(id), { type: 'bearer' })).status).toBe(401);
    expect(mockFindUser).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 'not-a-public-uuid'])('fails closed when the user has no valid public UUID (%s)', async value => {
    if (value === undefined) users.delete(710001); else users.set(710001, value);
    seed();
    expect((await remove('victim-image')).status).toBe(403);
    expect((await upload().attach('file', png, { filename: 'test.png', contentType: 'image/png' })).status).toBe(403);
    expect(mockSend).not.toHaveBeenCalled();
    expect(objects.has('victim-image')).toBe(true);
  });

  it('rejects invalid filenames and missing upload files without changing storage', async () => {
    seed();
    expect((await remove('folder/victim-image')).status).toBe(400);
    expect((await upload().send({})).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
    expect(objects.has('victim-image')).toBe(true);
  });

  it('cleans each newly uploaded key once on a partial multi-upload failure, preserving prior objects', async () => {
    seed(); failedPutNumber = 2;
    const response = await upload(true)
      .field('filename', 'victim-image')
      .attach('files', png, { filename: 'first.png', contentType: 'image/png' })
      .attach('files', png, { filename: 'second.png', contentType: 'image/png' });
    expect(response.status).toBe(500);
    const firstKey = required(putCommands()[0].input.Key);
    expect(firstKey).not.toBe('victim-image');
    expect(deletedKeys).toEqual([firstKey]);
    expect([...objects.keys()]).toEqual(['victim-image']);
    expect(objects.get('victim-image')?.body).toEqual(png);
  });
});
