import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registerHealthOpenApi } from '../health-openapi';

it('includes the real app health route in standalone contract generation', () => {
  const registry = new OpenAPIRegistry();
  registerHealthOpenApi(registry);
  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.0', info: { title: 'test', version: '1' } });
  expect(document.paths['/api/v1/health']?.get?.responses['200']).toEqual(expect.objectContaining({ description: '服務正常運行' }));
});
