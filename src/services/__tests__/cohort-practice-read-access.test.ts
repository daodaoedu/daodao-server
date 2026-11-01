import { prismaMock } from '@tests/utils/prisma-mock';
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
jest.mock('@/services/view-tracking.service', () => ({ getViewCount: jest.fn().mockResolvedValue(0) }));

import { findById } from '@/services/practice.service';
import { getCheckIns } from '@/services/practice-checkin.service';
import { asyncHandler, globalErrorHandler } from '@/middleware/error.middleware';
import { canReadPrivateLighthousePractice } from '@/services/cohort-acl.service';

const ownerId = 10;
const peerId = 20;
const practiceId = 30;
const cohortId = 40;

/** Minimal database fixture shared by the actual detail and check-in services. */
const makePractice = (overrides: Record<string, unknown> = {}) => ({
  id: practiceId,
  external_id: 'practice-344',
  title: '同場實踐',
  user_id: ownerId,
  cohort_id: cohortId,
  status: 'active',
  privacy_status: 'private',
  deleted_at: null,
  practice_time_periods: [],
  reflection: 'owner reflection',
  next_intent: 'owner next step',
  selected_checkin_ids: ['1'],
  insight_feedback: { helpful: true },
  users: { external_id: 'owner-344', nickname: '學員', contacts: null, user_positions: [] },
  ...overrides
});

/** Set up auxiliary reads so assertions exercise full service response construction. */
const setupReads = (overrides: Record<string, unknown> = {}) => {
  prismaMock.practices.findUnique.mockResolvedValue(makePractice(overrides) as never);
  prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'lighthouse' } } as never);
  prismaMock.comments.groupBy.mockResolvedValue([]);
  prismaMock.entity_tags.findMany.mockResolvedValue([]);
  prismaMock.entity_resources.findMany.mockResolvedValue([]);
  prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
  prismaMock.practice_checkins.findMany.mockResolvedValue([]);
  prismaMock.practice_checkins.count.mockResolvedValue(0);
  prismaMock.reactions.groupBy.mockResolvedValue([]);
  prismaMock.$queryRaw.mockResolvedValue([]);
};

/** Minimal HTTP harness uses real services and the production error serializer. */
const app = express();
app.get('/practices/:id', asyncHandler(async (req, res) => {
  res.json(await findById(Number(req.params.id), Number(req.get('x-test-user'))));
}));
app.get('/practices/:id/checkins', asyncHandler(async (req, res) => {
  res.json(await getCheckIns(Number(req.params.id), {}, Number(req.get('x-test-user'))));
}));
app.use(globalErrorHandler);

describe('private Lighthouse practice read access (#344)', () => {
  beforeEach(() => setupReads());

  it('allows a joined peer to load detail without exposing owner-only fields', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: cohortId, end_date: new Date() } as never);
    const result = await findById(practiceId, peerId);
    expect(result.data.id).toBe('practice-344');
    expect(result.data.privacyStatus).toBe('private');
    expect(result.data.reflection).toBeUndefined();
    expect(result.data.nextIntent).toBeUndefined();
    expect(result.data.selectedCheckInIds).toEqual([]);
    expect(result.data.insightFeedback).toBeNull();
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith({
      where: {
        id: cohortId,
        program: { kind: 'lighthouse' },
        OR: [
          { program: { organization: { organization_members: { some: { user_id: peerId } } } } },
          { cohort_enrollments: { some: { user_id: peerId, status: 'joined' } } }
        ]
      },
      select: { id: true, end_date: true }
    });
  });

  it('allows the same authorized peer to read the actual check-in content', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: cohortId, end_date: new Date() } as never);
    prismaMock.practice_checkins.findMany.mockResolvedValue([{
      id: 1, practice_id: practiceId, user_id: ownerId, checkin_date: new Date('2026-10-28'),
      mood: 'happy', note: '今天完成練習', image_urls: [], created_at: new Date('2026-10-28')
    }] as never);
    prismaMock.entity_stats.findMany.mockResolvedValue([]);
    prismaMock.practice_checkins.count.mockResolvedValue(1);
    const result = await getCheckIns(practiceId, {}, peerId);
    expect(result.data).toEqual([expect.objectContaining({ note: '今天完成練習', userId: ownerId })]);
  });

  it.each(['detail', 'checkins'])('keeps %s inaccessible to outsiders and non-joined members', async endpoint => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    const request = endpoint === 'detail' ? findById(practiceId, peerId) : getCheckIns(practiceId, {}, peerId);
    await expect(request).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.practice_checkins.findMany).not.toHaveBeenCalled();
  });

  it.each(['detail', 'checkins'])('keeps personal private %s owner-only', async endpoint => {
    setupReads({ cohort_id: null });
    const request = endpoint === 'detail' ? findById(practiceId, peerId) : getCheckIns(practiceId, {}, peerId);
    await expect(request).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.cohorts.findFirst).not.toHaveBeenCalled();
  });

  it.each(['detail', 'checkins'])('does not widen unfinished delayed %s', async endpoint => {
    setupReads({ privacy_status: 'delayed' });
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: cohortId, end_date: new Date() } as never);
    const request = endpoint === 'detail' ? findById(practiceId, peerId) : getCheckIns(practiceId, {}, peerId);
    await expect(request).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.cohorts.findFirst).not.toHaveBeenCalled();
  });

  it.each(['detail', 'checkins'])('does not grant private draft %s to cohort peers', async endpoint => {
    setupReads({ status: 'draft' });
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: cohortId, end_date: new Date() } as never);
    const request = endpoint === 'detail' ? findById(practiceId, peerId) : getCheckIns(practiceId, {}, peerId);
    await expect(request).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.cohorts.findFirst).not.toHaveBeenCalled();
  });

  it.each(['detail', 'checkins'])('does not query membership for anonymous private %s', async endpoint => {
    const request = endpoint === 'detail' ? findById(practiceId) : getCheckIns(practiceId, {});
    await expect(request).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.cohorts.findFirst).not.toHaveBeenCalled();
  });

  it.each(['detail', 'checkins'])('preserves owner access to private %s', async endpoint => {
    const result = endpoint === 'detail' ? await findById(practiceId, ownerId) : await getCheckIns(practiceId, {}, ownerId);
    expect(result.success).toBe(true);
    expect(prismaMock.cohorts.findFirst).not.toHaveBeenCalled();
  });

  it.each(['detail', 'checkins'])('serializes authorized %s HTTP responses as 200', async endpoint => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: cohortId, end_date: new Date() } as never);
    const path = `/practices/${practiceId}${endpoint === 'checkins' ? '/checkins' : ''}`;
    const response = await request(app).get(path).set('x-test-user', String(peerId)).expect(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.timestamp).toBe('string');
    expect(JSON.stringify(response.body)).not.toContain('owner reflection');
    expect(JSON.stringify(response.body)).not.toContain('owner next step');
    if (endpoint === 'detail') {
      expect(response.body.data).toMatchObject({ id: 'practice-344', privacyStatus: 'private' });
      expect(response.body.data).not.toHaveProperty('reflection');
    } else {
      expect(response.body.data).toEqual([]);
    }
  });

  it.each(['detail', 'checkins'])('serializes unauthorized %s HTTP responses as 403', async endpoint => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    const path = `/practices/${practiceId}${endpoint === 'checkins' ? '/checkins' : ''}`;
    const response = await request(app).get(path).set('x-test-user', String(peerId)).expect(403);
    expect(response.body).toMatchObject({ success: false, data: null, error: { code: 'APP_ERROR' } });
    expect(typeof response.body.error.message).toBe('string');
    expect(JSON.stringify(response.body)).not.toContain('owner reflection');
  });

  it('requires Lighthouse kind and scopes either organization membership or joined enrollment to the exact cohort', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: cohortId, end_date: new Date() } as never);
    await expect(canReadPrivateLighthousePractice({ cohort_id: cohortId, status: 'active' }, peerId)).resolves.toBe(true);
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith({
      where: {
        id: cohortId,
        program: { kind: 'lighthouse' },
        OR: [
          { program: { organization: { organization_members: { some: { user_id: peerId } } } } },
          { cohort_enrollments: { some: { user_id: peerId, status: 'joined' } } }
        ]
      },
      select: { id: true, end_date: true }
    });
  });


  it.each(['detail', 'checkins'])('does not bridge expired cohort retention for %s', async endpoint => {
    prismaMock.cohorts.findFirst.mockResolvedValue({
      id: cohortId, end_date: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000)
    } as never);
    const response = endpoint === 'detail' ? findById(practiceId, peerId) : getCheckIns(practiceId, {}, peerId);
    await expect(response).rejects.toMatchObject({ statusCode: 403 });
  });

  it.each(['detail', 'checkins'])('allows read-only cohort %s through the 90th day after ending', async endpoint => {
    prismaMock.cohorts.findFirst.mockResolvedValue({
      id: cohortId, end_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    } as never);
    const result = endpoint === 'detail' ? await findById(practiceId, peerId) : await getCheckIns(practiceId, {}, peerId);
    expect(result.success).toBe(true);
  });

});
