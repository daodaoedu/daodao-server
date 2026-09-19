import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/r2.service', () => ({ uploadToR2: jest.fn(), deleteFromR2: jest.fn() }));
jest.mock('@/services/email/email.service', () => ({ emailService: {} }));

import userRouter from '@/routes/user.routes';
import { globalErrorHandler } from '@/middleware/error.middleware';

const app = express();
app.use('/api/v1/users', userRouter);
app.use(globalErrorHandler);
const endpoint = '/api/v1/users/name/check';

/** Create a signed token to exercise the actual optional auth middleware. */
const token = (id: number, isTemp = false) => jwt.sign({ id, isTemp }, process.env.JWT_SECRET!);

describe('name availability endpoint', () => {
  it('returns the standard envelope for an unused exact name', async () => {
    prismaMock.users.findFirst.mockResolvedValue(null);
    const response = await request(app).get(endpoint).query({ name: 'Alice 王' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { name: 'Alice 王', available: true }, timestamp: expect.any(String) });
    expect(prismaMock.users.findFirst).toHaveBeenCalledWith({ where: { nickname: 'Alice 王' } });
  });

  it('counts private users and preserves case and spaces like registration', async () => {
    prismaMock.users.findFirst.mockResolvedValue({ id: 42, nickname: ' Alice ', is_public: false } as never);
    const response = await request(app).get(endpoint).query({ name: ' Alice ' });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ name: ' Alice ', available: false });
    expect(prismaMock.users.findFirst).toHaveBeenCalledWith({ where: { nickname: ' Alice ' } });
  });

  it.each([
    [42, false, true],
    [41, false, false],
    [42, true, false],
  ])('handles user %s temporary=%s availability=%s', async (id, isTemp, available) => {
    prismaMock.users.findFirst.mockResolvedValue({ id: 42 } as never);
    const response = await request(app).get(endpoint).query({ name: 'Alice' }).auth(token(id, isTemp), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data.available).toBe(available);
  });

  it.each([undefined, '', 'a'.repeat(101), ['Alice', 'Bob']])('rejects invalid query %p', async (name) => {
    const response = await request(app).get(endpoint).query(name === undefined ? {} : { name });
    expect(response.status).toBe(400);
    expect(prismaMock.users.findFirst).not.toHaveBeenCalled();
  });

  it.each(['a', 'a'.repeat(100)])('accepts valid length boundaries', async (name) => {
    prismaMock.users.findFirst.mockResolvedValue(null);
    const response = await request(app).get(endpoint).query({ name });
    expect(response.status).toBe(200);
    expect(response.body.data.available).toBe(true);
  });

  it('does not turn a database failure into an available name', async () => {
    prismaMock.users.findFirst.mockRejectedValue(new Error('database unavailable'));
    const response = await request(app).get(endpoint).query({ name: 'Alice' });
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
