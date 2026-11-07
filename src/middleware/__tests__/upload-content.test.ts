import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  process.env.R2_ACCESS_KEY_ID = 'synthetic-test-access';
  process.env.R2_SECRET_ACCESS_KEY = 'synthetic-test-secret';
  process.env.R2_BUCKET_NAME = 'isolated-upload-content-test';
  process.env.R2_PUBLIC_URL = 'https://images.example.invalid';
  return { ...actual, S3Client: jest.fn().mockImplementation(() => ({ send: (command: unknown): Promise<unknown> => mockSend(command) })) };
});
jest.mock('../../middleware/rate-limit.middleware', () => ({
  uploadLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction): void => next(),
}));
jest.mock('../../services/database/prisma.service', () => ({
  prisma: { users: { findUnique: jest.fn(async () => ({ external_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })) } },
}));

import imageRoutes from '../../routes/image.routes';
import upload from '../multer.middleware';
import { globalErrorHandler } from '../error.middleware';

const mockSend = jest.fn(async (_command: unknown) => ({}));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC6sAAAAASUVORK5CYII=', 'base64');
const webp = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfA//Z', 'base64');
const apng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAACAAAAAPONk3AAAAAaZmNUTAAAAAAAAAABAAAAAQAAAAAAAAAAAAEACgAAWn8w0AAAAA1JREFUeJxj+M/A8B8ABQAB/4mZPR0AAAAaZmNUTAAAAAEAAAABAAAAAQAAAAAAAAAAAAEACgAAwQzaBAAAABFmZEFUAAAAAnicY2D4z/AfAAQBAf9i5+mcAAAAAElFTkSuQmCC', 'base64');
const app = express();
app.use('/images', imageRoutes);
const acceptedFields = jest.fn((_req: express.Request, res: express.Response) => res.sendStatus(204));
app.post('/fields', upload.fields([{ name: 'first' }, { name: 'second' }]), acceptedFields);
app.use(globalErrorHandler);
function post(multiple = false): request.Test {
  return request(app).post(multiple ? '/images/multiple' : '/images').auth(jwt.sign({ id: 71, isTemp: false }, 'test-secret-key-for-testing'), { type: 'bearer' });
}
function writes(): PutObjectCommand[] {
  return mockSend.mock.calls.map(([command]) => command).filter((command): command is PutObjectCommand => command instanceof PutObjectCommand);
}

describe('multipart image content boundary', () => {
  it.each([
    ['script', Buffer.from('<?php echo "not an image"; ?>')],
    ['unknown', Buffer.alloc(20)],
    ['incomplete PNG signature', png.subarray(0, 9)],
    ['empty', Buffer.alloc(0)],
  ])('rejects %s declared as JPEG before any R2 write', async (_name, body) => {
    const response = await post().attach('file', body, { filename: '偽造.jpg', contentType: 'image/jpeg' });
    expect(response.status).toBe(400);
    expect(writes()).toHaveLength(0);
  });
  it('rejects a recognizable image with a different declared type', async () => {
    const response = await post().attach('file', png, { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(response.status).toBe(400);
    expect(writes()).toHaveLength(0);
  });
  it.each([['image/jpeg', jpeg], ['image/png', png], ['image/webp', webp], ['image/png', apng]])('preserves %s uploads and storage ContentType', async (mime, body) => {
    const response = await post().attach('file', body, { filename: '中文 圖片', contentType: mime });
    expect(response.status).toBe(201);
    expect(writes()).toHaveLength(1);
    expect(writes()[0].input.Body).toEqual(body);
    expect(writes()[0].input.ContentType).toBe(mime);
  });
  it('validates the entire array before any storage write', async () => {
    const response = await post(true).attach('files', png, { filename: 'valid.png', contentType: 'image/png' }).attach('files', Buffer.from('<script>alert(1)</script>'), { filename: 'fake.png', contentType: 'image/png' });
    expect(response.status).toBe(400);
    expect(writes()).toHaveLength(0);
  });
  it('keeps the existing 500KB per-file limit', async () => {
    const response = await post().attach('file', Buffer.alloc(500 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' });
    expect(response.status).toBe(400);
    expect(writes()).toHaveLength(0);
  });
  it('keeps the five-file limit on the multiple-image route', async () => {
    let action = post(true);
    for (let index = 0; index < 6; index += 1) action = action.attach('files', png, { filename: `${index}.png`, contentType: 'image/png' });
    expect((await action).status).toBe(400);
    expect(writes()).toHaveLength(0);
  });
  it('keeps GIF outside the existing JPEG/PNG/WebP allowlist', async () => {
    const response = await post().attach('file', Buffer.from('GIF89a'), { filename: 'image.gif', contentType: 'image/gif' });
    expect(response.status).toBe(400);
    expect(writes()).toHaveLength(0);
  });
  it('validates every named field before entering its handler', async () => {
    const response = await request(app).post('/fields').attach('first', png, { filename: 'a.png', contentType: 'image/png' }).attach('second', Buffer.from('not an image'), { filename: 'b.png', contentType: 'image/png' });
    expect(response.status).toBe(400);
    expect(acceptedFields).not.toHaveBeenCalled();
  });
});
