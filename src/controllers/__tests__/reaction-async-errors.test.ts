/** Rejected reaction handlers must reach the error middleware instead of crashing the process. */
import express from 'express';
import request from 'supertest';
import { globalErrorHandler, NotFoundError } from '../../middleware/error.middleware';

jest.mock('../../services/id-converter.service', () => ({
  externalToInternalId: jest.fn(async (type: string, id: string) => { throw new NotFoundError(`${type} 不存在: ${id}`); })
}));
jest.mock('../../services/reaction.service', () => ({ reactionService: {} }));
jest.mock('../../services/database/prisma.service', () => ({ prisma: {} }));

import router from '../../routes/reaction.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/reactions', router);
app.use(globalErrorHandler);

describe('reaction routes forward async errors (server crash in journeys)', () => {
  const deleted = '8e936f1b-cece-4b25-a170-045ff39154e4';

  it('answers 404 for reactions of a just-deleted practice and keeps serving', async () => {
    const first = await request(app).get('/api/v1/reactions').query({ targetType: 'practice', targetId: deleted });
    expect(first.status).toBe(404);
    const second = await request(app).get('/api/v1/reactions').query({ targetType: 'practice', targetId: deleted });
    expect(second.status).toBe(404);
  });

  it('answers 404 for the reaction list of a missing target', async () => {
    const response = await request(app).get('/api/v1/reactions/list').query({ targetType: 'practice', targetId: deleted });
    expect(response.status).toBe(404);
  });
});
