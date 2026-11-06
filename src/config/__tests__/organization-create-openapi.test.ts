import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from '../openapi-registry';
import '../../routes/organization.routes';

it('documents owner Email creation at the same admin endpoint the server actually accepts', () => {
  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.0', info: { title: 'test', version: '1' } });
  expect(document.paths['/api/v1/lighthouse/admin/organizations']?.post).toEqual(expect.objectContaining({
    requestBody: expect.objectContaining({ content: { 'application/json': { schema: expect.objectContaining({
      properties: expect.objectContaining({ ownerEmail: expect.objectContaining({ type: 'string', format: 'email' }), ownerUserId: expect.objectContaining({ type: 'integer' }) })
    }) } } }),
    responses: expect.objectContaining({ 201: expect.anything() })
  }));
  expect(document.paths['/api/v1/lighthouse/organizations']?.post).toBeUndefined();
});
