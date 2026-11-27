import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';

jest.mock('../../services/feature-flags.service', () => ({
  getPublicFeatureFlags: jest.fn(), listFeatureFlags: jest.fn(), createFeatureFlag: jest.fn(), updateFeatureFlag: jest.fn()
}));
jest.mock('../../middleware/auth', () => ({
  ...jest.requireActual('../../middleware/auth'),
  authenticateAny: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.get('authorization')) { res.sendStatus(401); return; }
    req.user = { id: 7, isTemp: req.get('authorization') === 'Bearer temporary' } as Express.User;
    next();
  }
}));
jest.mock('../../services/auth/permission.service', () => ({ permissionService: { isAdmin: jest.fn() } }));
import { permissionService } from '../../services/auth/permission.service';
import { createFeatureFlag, getPublicFeatureFlags, listFeatureFlags, updateFeatureFlag } from '../../services/feature-flags.service';
import { adminFeatureFlagsRouter, publicFeatureFlagsRouter } from '../feature-flags.routes';
import { ConflictError, globalErrorHandler, NotFoundError } from '../../middleware/error.middleware';
const app = express();
app.use(express.json()); app.use(cookieParser());
app.use('/api/v1/feature-flags', publicFeatureFlagsRouter);
app.use('/api/v1/admin/feature-flags', adminFeatureFlagsRouter);
app.use(globalErrorHandler);
const configuration = { name: 'Timeline', description: '', stage: 'alpha' as const, organizationIds: [9] };
const saved = { key: 'homeTimeline', ...configuration, updatedAt: new Date().toISOString() };
const token = (id: number, isTemp = false): string => jwt.sign({ id, isTemp }, process.env.JWT_SECRET ?? 'test-secret-key-for-testing');
describe('feature registry API access, identity and cache contract', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.mocked(permissionService.isAdmin).mockResolvedValue(false);
    jest.mocked(getPublicFeatureFlags).mockResolvedValue({ homeTimeline: false, arbitraryFeature: true });
  });
  it('serves only effective booleans privately and varies by authentication', async () => {
    const response = await request(app).get('/api/v1/feature-flags');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.vary).toContain('Cookie'); expect(response.headers.vary).toContain('Authorization');
    expect(response.body.data).toEqual({ homeTimeline: false, arbitraryFeature: true });
    expect(getPublicFeatureFlags).toHaveBeenCalledWith(undefined, undefined);
  });
  it('evaluates exact organization and current bearer identity on every request', async () => {
    for (const [id, organizationId] of [[1, 9], [1, 10], [2, 9]]) {
      await request(app).get(`/api/v1/feature-flags?organizationId=${organizationId}`).set('Authorization', `Bearer ${token(id)}`).expect(200);
      expect(getPublicFeatureFlags).toHaveBeenLastCalledWith(id, organizationId);
    }
  });
  it('supports cookie identity and treats temporary/invalid tokens as guest', async () => {
    await request(app).get('/api/v1/feature-flags?organizationId=9').set('Cookie', `auth_token=${token(3)}`).expect(200);
    expect(getPublicFeatureFlags).toHaveBeenLastCalledWith(3, 9);
    for (const credential of [token(3, true), 'invalid']) {
      await request(app).get('/api/v1/feature-flags?organizationId=9').set('Authorization', `Bearer ${credential}`).expect(200);
      expect(getPublicFeatureFlags).toHaveBeenLastCalledWith(undefined, 9);
    }
  });
  it('rejects invalid selected organizations before querying flags', async () => {
    for (const query of ['organizationId=0', 'organizationId=abc', 'organizationId=1&organizationId=2', 'userId=7']) {
      const response = await request(app).get(`/api/v1/feature-flags?${query}`).expect(400);
      expect(response.headers['cache-control']).toBe('private, no-store');
    }
    expect(getPublicFeatureFlags).not.toHaveBeenCalled();
  });
  it('keeps identity-safe cache headers on public evaluation failure', async () => {
    jest.mocked(getPublicFeatureFlags).mockRejectedValueOnce(new Error('database unavailable'));
    const response = await request(app).get('/api/v1/feature-flags?organizationId=9').expect(500);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.vary).toContain('Cookie'); expect(response.headers.vary).toContain('Authorization');
    expect(response.body.success).toBe(false);
  });
  test.each(['get', 'post', 'patch'] as const)('rejects unauthenticated admin %s', async method => {
    await request(app)[method]('/api/v1/admin/feature-flags' + (method === 'patch' ? '/homeTimeline' : '')).send(configuration).expect(401);
    expect(createFeatureFlag).not.toHaveBeenCalled(); expect(updateFeatureFlag).not.toHaveBeenCalled(); expect(listFeatureFlags).not.toHaveBeenCalled();
  });
  test.each(['get', 'post', 'patch'] as const)('rejects ordinary-user admin %s', async method => {
    await request(app)[method]('/api/v1/admin/feature-flags' + (method === 'patch' ? '/homeTimeline' : '')).set('Authorization', 'Bearer user').send(configuration).expect(403);
    expect(createFeatureFlag).not.toHaveBeenCalled(); expect(updateFeatureFlag).not.toHaveBeenCalled(); expect(listFeatureFlags).not.toHaveBeenCalled();
  });
  it('rejects temporary users even if their role lookup would allow access', async () => {
    jest.mocked(permissionService.isAdmin).mockResolvedValue(true);
    await request(app).patch('/api/v1/admin/feature-flags/homeTimeline').set('Authorization', 'Bearer temporary').send(configuration).expect(403);
    expect(updateFeatureFlag).not.toHaveBeenCalled();
  });
  it('lets admin list metadata without caching', async () => {
    jest.mocked(permissionService.isAdmin).mockResolvedValue(true);
    jest.mocked(listFeatureFlags).mockResolvedValue([saved]);
    const response = await request(app).get('/api/v1/admin/feature-flags').set('Authorization', 'Bearer admin').expect(200);
    expect(response.body.data).toEqual([saved]); expect(response.headers['cache-control']).toBe('no-store');
  });
  it('registers a feature using authenticated actor, and rejects duplicates', async () => {
    jest.mocked(permissionService.isAdmin).mockResolvedValue(true);
    const input = { key: 'newFeature', name: 'New', description: '' };
    jest.mocked(createFeatureFlag).mockResolvedValue({ ...saved, ...input, stage: 'off', organizationIds: [] });
    const response = await request(app).post('/api/v1/admin/feature-flags').set('Authorization', 'Bearer admin').send(input).expect(201);
    expect(response.body.data.stage).toBe('off');
    expect(createFeatureFlag).toHaveBeenCalledWith(input, expect.objectContaining({ adminId: 7 }));
    jest.mocked(createFeatureFlag).mockRejectedValue(new ConflictError('duplicate'));
    await request(app).post('/api/v1/admin/feature-flags').set('Authorization', 'Bearer admin').send(input).expect(409);
  });
  it('validates full configuration even for admins', async () => {
    jest.mocked(permissionService.isAdmin).mockResolvedValue(true);
    for (const body of [{ enabled: true }, { ...configuration, stage: 'alpha', organizationIds: [] }, { ...configuration, actor: 99 }]) {
      await request(app).patch('/api/v1/admin/feature-flags/homeTimeline').set('Authorization', 'Bearer admin').send(body).expect(400);
    }
    expect(updateFeatureFlag).not.toHaveBeenCalled();
  });
  it('returns persisted complete configuration and unknown-key 404', async () => {
    jest.mocked(permissionService.isAdmin).mockResolvedValue(true); jest.mocked(updateFeatureFlag).mockResolvedValue(saved);
    const response = await request(app).patch('/api/v1/admin/feature-flags/homeTimeline').set('Authorization', 'Bearer admin').send(configuration).expect(200);
    expect(response.body.data).toEqual(saved);
    expect(updateFeatureFlag).toHaveBeenCalledWith('homeTimeline', configuration, expect.objectContaining({ adminId: 7 }));
    jest.mocked(updateFeatureFlag).mockRejectedValue(new NotFoundError('unknown'));
    await request(app).patch('/api/v1/admin/feature-flags/unknown').set('Authorization', 'Bearer admin').send(configuration).expect(404);
  });
  it('returns errors instead of successful configuration when the database fails', async () => {
    jest.mocked(permissionService.isAdmin).mockResolvedValue(true); jest.mocked(updateFeatureFlag).mockRejectedValue(new Error('database unavailable'));
    const response = await request(app).patch('/api/v1/admin/feature-flags/homeTimeline').set('Authorization', 'Bearer admin').send(configuration).expect(500);
    expect(response.body.success).toBe(false);
  });
});
