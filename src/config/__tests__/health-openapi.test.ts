import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registerHealthOpenApi } from '../health-openapi';

describe('offline liveness API contract', () => {
  it('keeps the existing health endpoint and required response fields in generated clients', () => {
    const registry = new OpenAPIRegistry();
    registerHealthOpenApi(registry);
    const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.0', info: { title: 'test', version: '1' } });
    expect(document.paths['/api/v1/health']?.get?.responses['200']).toEqual(expect.objectContaining({
      content: { 'application/json': { schema: expect.objectContaining({ required: ['status', 'uptime', 'timestamp'] }) } }
    }));
  });
});
