import express from 'express';
import request from 'supertest';
import { prismaMock } from '@tests/utils/prisma-mock';
import type { Prisma } from '../../../generated/prisma';

jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));

import { getReviews } from '../resource-review.service';
import { getReviewsByResource } from '../../controllers/resource-review.controller';
import { globalErrorHandler } from '../../middleware/error.middleware';

const formerDebugResource = '074d9c9d-313d-4246-bec6-665798acf53f';
const ordinaryResource = '123e4567-e89b-42d3-a456-426614174000';
const unrelatedUser = 77777001;
const deletedUser = 77777002;
const deletedAt = '2025-01-15T12:34:56.000Z';
const diagnosticRows = [
  { id: 900001, resource_id: 82, status: 'published', user_id: unrelatedUser, deleted_at: null },
  { id: 900002, resource_id: 81, status: 'published', user_id: deletedUser, deleted_at: new Date(deletedAt) }
];

/** Synthetic records with distinct resource, publication and deletion boundaries. */
function rows(resourceId: string) {
  return [
    [104, 81, 34, 'published', null, '2026-08-04T00:00:00.000Z', 5],
    [103, 81, 31, 'published', null, '2026-08-03T00:00:00.000Z', 4],
    [102, 81, 32, 'published', null, '2026-08-02T00:00:00.000Z', 3],
    [101, 81, 33, 'published', null, '2026-08-01T00:00:00.000Z', 2],
    [100, 81, 36, 'published', null, '2026-07-31T00:00:00.000Z', 5],
    [99, 81, 35, 'published', null, '2026-07-30T00:00:00.000Z', 1],
    [900001, 82, unrelatedUser, 'published', null, '2026-08-04T00:00:00.000Z', 5],
    [900002, 81, deletedUser, 'published', new Date(deletedAt), '2026-08-05T00:00:00.000Z', 5],
    [900003, 81, 77777003, 'draft', null, '2026-08-06T00:00:00.000Z', 5]
  ].map(([id, resource_id, user_id, status, deleted_at, created_at, score_impact]) => ({
    id: Number(id), resource_id: Number(resource_id), user_id: Number(user_id), status: String(status),
    deleted_at, created_at: new Date(String(created_at)), updated_at: new Date(String(created_at)),
    score_impact: Number(score_impact), score_mindset: 3, score_problems: 3, score_perspectives: 3, score_goals: 3,
    time_usage: 'not_applicable_time', content: `public-review-${id}`,
    resources: { id: Number(resource_id), external_id: resourceId, name: 'Synthetic resource', url: 'https://example.invalid/resource' }
  }));
}

/** Keep the HTTP handler, response validation, mapper and pagination helper real. */
function app() {
  const server = express();
  server.get('/api/v1/resources/:resourceId/reviews', getReviewsByResource);
  server.use(globalErrorHandler);
  return server;
}

beforeEach(() => {
  prismaMock.resources.findFirst.mockResolvedValue({ id: 81 } as never);
  prismaMock.entity_tags.findMany.mockResolvedValue([]);
  prismaMock.resource_review.findMany.mockImplementation((async (args: Prisma.resource_reviewFindManyArgs = {}) => {
    if (args.where?.resource_id === undefined) return diagnosticRows;
    return [];
  }) as never);
});

test.each([formerDebugResource, ordinaryResource])('HTTP listing for %s excludes unrelated/deleted diagnostics from response and logs', async resourceId => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const response = await request(app()).get(`/api/v1/resources/${resourceId}/reviews?limit=2`);

  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({ success: true, data: [], pagination: { count: 0, hasMore: false, limit: 2 } });
  expect(response.body.meta).not.toHaveProperty('debug');
  const exposed = `${response.text}\n${JSON.stringify(log.mock.calls)}`;
  for (const marker of [String(unrelatedUser), String(deletedUser), deletedAt, 'allReviewsInDb', 'finalWhereCondition']) {
    expect(exposed).not.toContain(marker);
  }
  expect(prismaMock.resource_review.findMany).toHaveBeenCalled();
  for (const [args] of prismaMock.resource_review.findMany.mock.calls) {
    expect(args?.where).toMatchObject({ resource_id: 81, deleted_at: null, status: 'published' });
  }
});

test.each([formerDebugResource, ordinaryResource])('service listing for %s preserves filtering and cursor pages without diagnostics', async resourceId => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  prismaMock.resource_review.findMany.mockImplementation((async (args: Prisma.resource_reviewFindManyArgs = {}) => {
    if (args.where?.resource_id === undefined) return diagnosticRows;
    const where = args?.where;
    const cursor = where?.created_at as { lt?: Date } | undefined;
    const scores = where?.score_impact as { gte?: number; lte?: number } | undefined;
    return rows(resourceId).filter(row =>
      (where?.resource_id === undefined || row.resource_id === where.resource_id) &&
      (where?.deleted_at !== null || row.deleted_at === null) &&
      (where?.status === undefined || row.status === where.status) &&
      (!cursor?.lt || row.created_at < cursor.lt) &&
      (scores?.gte === undefined || row.score_impact >= scores.gte) &&
      (scores?.lte === undefined || row.score_impact <= scores.lte)
    ).slice(0, Number(args?.take ?? 100));
  }) as never);

  const first = await getReviews({ resourceId, minScore: 2, maxScore: 4 }, { limit: 2 });
  expect(first.data.map(row => row.id)).toEqual(['103', '102']);
  expect(first.data.map(row => row.content)).toEqual(['public-review-103', 'public-review-102']);
  expect(first.data.map(row => row.resourceId)).toEqual([resourceId, resourceId]);
  expect(first.pagination).toMatchObject({ count: 2, limit: 2, hasMore: true, hasNext: true });
  expect(first.pagination.nextCursor).toEqual(expect.any(String));

  const second = await getReviews({ resourceId, minScore: 2, maxScore: 4 }, { limit: 2, cursor: first.pagination.nextCursor ?? undefined });
  expect(second.data.map(row => row.id)).toEqual(['101']);
  expect(second.pagination).toMatchObject({ count: 1, limit: 2, hasMore: false, hasNext: false, nextCursor: null });
  const exposed = `${JSON.stringify([first, second])}\n${JSON.stringify(log.mock.calls)}`;
  for (const marker of [String(unrelatedUser), String(deletedUser), deletedAt, 'allReviewsInDb', 'finalWhereCondition']) {
    expect(exposed).not.toContain(marker);
  }
  expect(first.meta).not.toHaveProperty('debug');
  expect(second.meta).not.toHaveProperty('debug');
  for (const [args] of prismaMock.resource_review.findMany.mock.calls) {
    expect(args?.where).toMatchObject({ resource_id: 81, deleted_at: null, status: 'published' });
  }
});

test('invalid resource is rejected before any review query', async () => {
  const response = await request(app()).get('/api/v1/resources/not-a-uuid/reviews');
  expect(response.status).toBe(400);
  expect(prismaMock.resource_review.findMany).not.toHaveBeenCalled();
});
