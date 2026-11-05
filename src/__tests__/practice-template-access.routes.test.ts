/** Public template HTTP permissions: exercise real JWT, admin middleware and controllers. */
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createSuccessResponse } from '../utils/response-helper';
import { globalErrorHandler } from '../middleware/error.middleware';

jest.mock('../services/auth/permission.service', () => ({
  permissionService: { isAdmin: jest.fn(async (id: number) => id === 2) }
}));
jest.mock('../services/practice-template.service', () => ({
  getTemplateById: jest.fn(), updateTemplate: jest.fn(), deleteTemplate: jest.fn(),
  createTemplate: jest.fn(), batchCreateTemplates: jest.fn()
}));
jest.mock('../services/practice.service', () => ({}));
jest.mock('../services/practice-checkin.service', () => ({}));
jest.mock('../services/practice-interaction.service', () => ({}));
jest.mock('../services/encouragement.service', () => ({}));
jest.mock('../services/tag-prompt.service', () => ({}));
jest.mock('../services/id-converter.service', () => ({}));
jest.mock('../middleware/cohort-content-lifecycle.middleware', () => ({
  enforcePracticeCohortContentLifecycle: (_req: unknown, _res: unknown, next: () => void) => next()
}));
jest.mock('../middleware/multer.middleware', () => ({
  __esModule: true, default: { array: () => (_req: unknown, _res: unknown, next: () => void) => next() }
}));

import router from '../routes/practice.routes';
import * as templates from '../services/practice-template.service';

const service = jest.mocked(templates);
const app = express();
app.use(express.json());
app.use('/api/v1/practices', router);
app.use(globalErrorHandler);
const templateId = '00000000-0323-4000-8001-000000900003';
const path = `/api/v1/practices/templates/${templateId}`;
/** Sign a local test-only identity; admin authorization still reads permission service. */
function token(id: number, isTemp = false): string {
  return jwt.sign({ id, isTemp, roles: ['admin'] }, process.env.JWT_SECRET || '', { expiresIn: '5m' });
}

beforeEach(() => {
  service.updateTemplate.mockResolvedValue(createSuccessResponse({ id: templateId, title: '閱讀 API' }) as Awaited<ReturnType<typeof templates.updateTemplate>>);
  service.deleteTemplate.mockResolvedValue(createSuccessResponse({ deleted: true }));
});

for (const method of ['put', 'delete'] as const) {
  describe(`${method.toUpperCase()} public template`, () => {
    it('rejects visitors before mutations', async () => {
      const result = await request(app)[method](path).send({ title: '閱讀 API' });
      expect(result.status).toBe(401);
      expect(service.updateTemplate).not.toHaveBeenCalled();
      expect(service.deleteTemplate).not.toHaveBeenCalled();
    });
    it.each([['regular user with forged role claims', 1, false], ['temporary admin identity', 2, true]] as const)(
      'rejects %s without mutations', async (_label, id, temporary) => {
        const result = await request(app)[method](path).set('Authorization', `Bearer ${token(id, temporary)}`).send({ title: '閱讀 API' });
        expect(result.status).toBe(403);
        expect(service.updateTemplate).not.toHaveBeenCalled();
        expect(service.deleteTemplate).not.toHaveBeenCalled();
      }
    );
    it('permits an administrator to mutate an official template', async () => {
      const result = await request(app)[method](path).set('Authorization', `Bearer ${token(2)}`).send({ title: '閱讀 API' });
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      if (method === 'put') expect(service.updateTemplate).toHaveBeenCalledWith(templateId, expect.objectContaining({ title: '閱讀 API' }));
      else expect(service.deleteTemplate).toHaveBeenCalledWith(templateId);
    });
  });
}

it('returns 404 for a hidden or unknown template, without a successful empty detail', async () => {
  service.getTemplateById.mockResolvedValue(createSuccessResponse(null));
  const result = await request(app).get(path);
  expect(result.status).toBe(404);
  expect(result.body.success).toBe(false);
});

it('keeps official template details publicly readable', async () => {
  service.getTemplateById.mockResolvedValue(createSuccessResponse({ id: templateId, title: '官方' }) as Awaited<ReturnType<typeof templates.getTemplateById>>);
  const result = await request(app).get(path);
  expect(result.status).toBe(200);
  expect(result.body.data.title).toBe('官方');
});

it('returns 404 for administrator updates to hidden or unknown templates', async () => {
  service.updateTemplate.mockResolvedValue(createSuccessResponse(null));
  const result = await request(app).put(path).set('Authorization', `Bearer ${token(2)}`).send({ title: '閱讀 API' });
  expect(result.status).toBe(404);
  expect(result.body.success).toBe(false);
});

for (const endpoint of ['/templates', '/templates/batch']) {
  it(`rejects ordinary users creating official templates at ${endpoint}`, async () => {
    const result = await request(app).post(`/api/v1/practices${endpoint}`)
      .set('Authorization', `Bearer ${token(1)}`)
      .send(endpoint.endsWith('batch') ? { segments: [{ title: '測試', durationDays: 7 }] } : { title: '測試' });
    expect(result.status).toBe(403);
    expect(service.createTemplate).not.toHaveBeenCalled();
    expect(service.batchCreateTemplates).not.toHaveBeenCalled();
  });
}

for (const endpoint of ['/templates', '/templates/batch']) {
  it(`rejects visitors at ${endpoint}`, async () => {
    const result = await request(app).post(`/api/v1/practices${endpoint}`).send({});
    expect(result.status).toBe(401);
    expect(service.createTemplate).not.toHaveBeenCalled();
    expect(service.batchCreateTemplates).not.toHaveBeenCalled();
  });
  it(`allows administrator creation and strips organization assignment at ${endpoint}`, async () => {
    service.createTemplate.mockResolvedValue(createSuccessResponse({ id: templateId, title: '官方' }) as Awaited<ReturnType<typeof templates.createTemplate>>);
    service.batchCreateTemplates.mockResolvedValue(createSuccessResponse({ templates: [] }));
    const input = { title: '  官方 API 閱讀  ', durationDays: 7, organizationId: 900001, organization_id: 900001 };
    const batch = endpoint.endsWith('batch');
    const result = await request(app).post(`/api/v1/practices${endpoint}`)
      .set('Authorization', `Bearer ${token(2)}`).send(batch ? { segments: [input, input] } : input);
    expect(result.status).toBe(201);
    const parsed = batch
      ? service.batchCreateTemplates.mock.calls[0][0][0]
      : service.createTemplate.mock.calls[0][0];
    expect(parsed).toEqual(expect.objectContaining({ title: input.title, durationDays: 7 }));
    expect(parsed).not.toHaveProperty('organizationId');
    expect(parsed).not.toHaveProperty('organization_id');
  });
}

it('returns validation feedback to an administrator without mutating an invalid title', async () => {
  const result = await request(app).put(path).set('Authorization', `Bearer ${token(2)}`).send({ title: '' });
  expect(result.status).toBe(400);
  expect(result.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'title' })]));
  expect(service.updateTemplate).not.toHaveBeenCalled();
});
