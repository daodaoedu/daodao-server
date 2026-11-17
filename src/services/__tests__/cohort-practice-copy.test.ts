import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import express from 'express';
import request from 'supertest';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));
jest.mock('@/queues', () => ({ enqueuePracticeEmail: jest.fn() }));
jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn() }
}));
jest.mock('@/services/r2.service', () => ({ uploadToR2: jest.fn(), deleteFromR2: jest.fn() }));

import { copyPractice, findById } from '@/services/practice.service';
import { practiceEntityResponseSchema } from '@/validators/practice.validators';
import { asyncHandler, globalErrorHandler } from '@/middleware/error.middleware';

const sourceId = 30;
const ownerId = 10;
const viewerId = 20;
const copiedId = '7b039d11-86fb-4c26-9025-67bab9acc010';

/** Build a normal copyable source so missing guards produce actual successful copies. */
const sourcePractice = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: sourceId, external_id: '7b039d11-86fb-4c26-9025-67bab9acc030',
  user_id: ownerId, title: '每天練習', practice_action: '閱讀一頁',
  cohort_id: null, creation_source: 'self_created', deleted_at: null,
  privacy_status: 'public', status: 'active', duration_days: 7,
  practice_time_periods: [], ...overrides
});

const app = express();
app.post('/practices/:id/copy', asyncHandler(async (req, res) => {
  res.json(await copyPractice(Number(req.params.id), Number(req.get('x-test-user'))));
}));
app.use(globalErrorHandler);

describe('cohort-created practice copy restrictions (#546 AC7)', () => {
  beforeEach(() => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice() as never);
    prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'lighthouse' } } as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([]);
    prismaMock.entity_tags.findMany.mockResolvedValue([]);
    prismaMock.practices.create.mockResolvedValue({ id: 100, external_id: copiedId } as never);
    setupTransactionMock();
  });

  it.each([ownerId, viewerId])('rejects copying a linked cohort practice for user %s', async userId => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({ cohort_id: 40 }) as never);
    const response = await request(app).post(`/practices/${sourceId}/copy`).set('x-test-user', String(userId));
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(prismaMock.practices.create).not.toHaveBeenCalled();
    expect(prismaMock.practices.update).not.toHaveBeenCalled();
  });

  it.each([ownerId, viewerId])('rejects a detached cohort-created practice for user %s', async userId => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({ creation_source: 'cohort_template' }) as never);
    await expect(copyPractice(sourceId, userId)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.practices.create).not.toHaveBeenCalled();
  });

  it('preserves the existing challenge restriction', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({ cohort_id: 40 }) as never);
    prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'challenge' } } as never);
    await expect(copyPractice(sourceId, viewerId)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.practices.create).not.toHaveBeenCalled();
  });

  it.each(['self_created', 'copied', null])('still returns a new practice for a public personal source (%s)', async creationSource => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({ creation_source: creationSource }) as never);
    const result = await copyPractice(sourceId, viewerId);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(copiedId);
    expect(prismaMock.practices.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ title: '每天練習', user_id: viewerId, source_practice_id: sourceId, creation_source: 'copied' })
    }));
  });

  it('preserves copying one own private personal practice', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({ privacy_status: 'private' }) as never);
    await expect(copyPractice(sourceId, ownerId)).resolves.toMatchObject({ success: true, data: { id: copiedId } });
  });

  it('keeps someone else private personal practice inaccessible', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({ privacy_status: 'private' }) as never);
    await expect(copyPractice(sourceId, viewerId)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.practices.create).not.toHaveBeenCalled();
  });

  it('returns not found for a deleted cohort practice', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({ cohort_id: 40, deleted_at: new Date() }) as never);
    await expect(copyPractice(sourceId, viewerId)).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.practices.create).not.toHaveBeenCalled();
  });
});

/** The detail contract must communicate the copy guard independently of resource locks. */
describe('practice detail copy restriction contract (#546)', () => {
  beforeEach(() => {
    prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'lighthouse' } } as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([]);
    prismaMock.entity_tags.findMany.mockResolvedValue([]);
    prismaMock.comments.findMany.mockResolvedValue([]);
    prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
    prismaMock.reactions.groupBy.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);
  });

  it.each([
    { label: 'linked cohort template', cohort_id: 40, creation_source: 'cohort_template', restricted: true, resourceLocked: true },
    { label: 'linked manual source', cohort_id: 40, creation_source: 'self_created', restricted: true, resourceLocked: false },
    { label: 'detached cohort template', cohort_id: null, creation_source: 'cohort_template', restricted: true, resourceLocked: false },
    { label: 'personal manual source', cohort_id: null, creation_source: 'self_created', restricted: false, resourceLocked: false },
    { label: 'personal copied source', cohort_id: null, creation_source: 'copied', restricted: false, resourceLocked: false },
  ])('serializes copy restrictions for $label without widening resource locks', async fixture => {
    prismaMock.practices.findUnique.mockResolvedValue(sourcePractice({
      cohort_id: fixture.cohort_id, creation_source: fixture.creation_source,
      template_id: fixture.creation_source === 'cohort_template' ? 50 : null,
      users: { external_id: 'owner-546', nickname: '學員', contacts: null, user_positions: [] }
    }) as never);
    const result = await findById(sourceId, ownerId);
    const serialized = practiceEntityResponseSchema.parse(result.data);
    expect(serialized).toMatchObject({
      isCopyRestricted: fixture.restricted,
      isCohortPractice: fixture.resourceLocked,
    });
  });
});
