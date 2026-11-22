import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import express from 'express';
import request from 'supertest';
import { prisma } from '../database/prisma.service';
import { practiceController } from '../../controllers/practice.controller';
import { asyncHandler, globalErrorHandler } from '../../middleware/error.middleware';
import { cohortMembershipService } from '../cohort-membership.service';
import { cohortDashboardService } from '../cohort-dashboard.service';

jest.mock('@/queues', () => ({ enqueuePracticeEmail: jest.fn() }));
jest.mock('@/services/notification-event.service', () => ({ notificationEventService: { createEvent: jest.fn() } }));
jest.mock('@/services/r2.service', () => ({ uploadToR2: jest.fn(), deleteFromR2: jest.fn() }));

/** Actual PostgreSQL + production controllers, with only authenticated identity supplied by the harness. */
describe('organization manager draft read access (#546)', () => {
  const key = `546-${randomUUID()}`;
  const fixedNow = new Date('2026-11-17T12:00:00.000Z');
  const title = '546 draft visible content';
  const privateMarker = '546 owner-only reflection';
  let manager: number;
  let peer: number;
  let outsider: number;
  let owner: number;
  let crossOrg: number;
  let organization: number;
  let program: number;
  let cohort: number;
  let practice: number;
  let externalId: string;
  let targetEnrollment: number;
  const app = express();
  app.use((req, _res, next) => {
    const userId = Number(req.get('x-test-user'));
    if (userId) req.user = { id: userId, roles: ['user'] };
    next();
  });
  app.get('/practices/:id', practiceController.getPractice);
  app.get('/practices/:id/checkins', practiceController.getCheckIns);
  app.get('/roster', asyncHandler(async (req, res) => {
    const actor = req.user?.id ?? 0;
    const enrollments = await cohortMembershipService.listEnrollments(program, cohort, actor);
    const participants = await cohortDashboardService.listParticipants(program, cohort, actor, { sort: 'nickname', order: 'asc' });
    const joined = new Set(enrollments.filter(row => row.status === 'joined').map(row => row.userId));
    res.json(participants.items.filter(row => joined.has(row.userId)));
  }));
  app.use(globalErrorHandler);

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (process.env.COHORT_ADMIN_PG_TEST !== '1' || url.hostname !== '127.0.0.1' || url.pathname !== '/daodao_test') {
      throw new Error('Use only the disposable test-local PostgreSQL runner for #546');
    }
    const role = await prisma.roles.findFirst() ?? await prisma.roles.create({ data: { name: key } });
    const users = await Promise.all(['manager', 'peer', 'outsider', 'owner', 'other-manager'].map(nickname =>
      prisma.users.create({ data: { mongo_id: `${key}-${nickname}`, nickname, role_id: role.id, tag_list: [] } })));
    [manager, peer, outsider, owner, crossOrg] = users.map(user => user.id);
    const org = await prisma.organization.create({ data: { name: key, status: 'active', organization_members: { create: { user_id: manager, role: 'owner' } } } });
    organization = org.id;
    await prisma.organization.create({ data: { name: `${key}-other`, status: 'active', organization_members: { create: { user_id: crossOrg, role: 'owner' } } } });
    const p = await prisma.programs.create({ data: { organization_id: org.id, name: key, kind: 'lighthouse' } });
    program = p.id;
    const c = await prisma.cohorts.create({ data: { program_id: p.id, slug: key, display_name: key, start_date: new Date('2026-11-01'), end_date: new Date('2026-11-18') } });
    cohort = c.id;
    const enrollment = await prisma.cohort_enrollments.create({ data: { cohort_id: c.id, user_id: owner, status: 'joined', role: 'member', email: `${key}-owner@example.invalid` } });
    targetEnrollment = enrollment.id;
    await prisma.cohort_enrollments.create({ data: { cohort_id: c.id, user_id: peer, status: 'joined', role: 'member', email: `${key}-peer@example.invalid` } });
    const source = await prisma.practices.create({ data: { user_id: owner, cohort_id: c.id, title, status: 'draft', privacy_status: 'private', creation_source: 'cohort_template', reflection: privateMarker, next_intent: privateMarker, practice_time_periods: [] } });
    practice = source.id; externalId = source.external_id ?? '';
    await prisma.practice_checkins.create({ data: { practice_id: source.id, user_id: owner, checkin_date: new Date('2026-11-12'), note: '546 visible draft check-in', image_urls: [] } });
  }, 30000);

  beforeEach(async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'hrtime', 'performance'] });
    jest.setSystemTime(fixedNow);
    await prisma.organization.update({ where: { id: organization }, data: { status: 'active' } });
    await prisma.organization_members.upsert({ where: { organization_id_user_id: { organization_id: organization, user_id: manager } }, create: { organization_id: organization, user_id: manager, role: 'owner' }, update: { role: 'owner' } });
    await prisma.programs.update({ where: { id: program }, data: { kind: 'lighthouse' } });
    await prisma.cohorts.update({ where: { id: cohort }, data: { start_date: new Date('2026-11-01'), end_date: new Date('2026-11-18') } });
    await prisma.cohort_enrollments.update({ where: { id: targetEnrollment }, data: { status: 'joined' } });
    await prisma.practices.update({ where: { id: practice }, data: { status: 'draft', privacy_status: 'private', deleted_at: null, cohort_id: cohort, creation_source: 'cohort_template' } });
  });
  afterEach(() => jest.useRealTimers());
  afterAll(() => prisma.$disconnect());

  it('shows the same joined draft in manager roster, detail and check-ins without private owner fields', async () => {
    const roster = await request(app).get('/roster').set('x-test-user', String(manager)).expect(200);
    expect(roster.body).toEqual(expect.arrayContaining([expect.objectContaining({ practiceId: practice, userId: owner })]));
    const detail = await request(app).get(`/practices/${externalId}`).set('x-test-user', String(manager)).expect(200);
    expect(detail.body.data).toMatchObject({
      id: externalId, title, status: 'draft', privacyStatus: 'private',
      isCopyRestricted: true, isCohortPractice: false, isCohortPrivacyLocked: true,
      hasResources: false, checkInCount: 1,
      stats: { commentCount: 0, viewCount: 0, likeCount: 0 }
    });
    expect(JSON.stringify(detail.body)).not.toContain(privateMarker);
    const checkins = await request(app).get(`/practices/${externalId}/checkins`).set('x-test-user', String(manager)).expect(200);
    expect(checkins.body.data).toEqual([expect.objectContaining({ note: '546 visible draft check-in' })]);
    if (process.env.COHORT_ADMIN_EVIDENCE_PATH) {
      writeFileSync(process.env.COHORT_ADMIN_EVIDENCE_PATH, JSON.stringify({
        database: 'disposable PostgreSQL16', fixedNow, seed: { manager, peer, outsider, owner, crossOrg, organization, program, cohort, practice },
        roster: roster.body, detail: detail.body, checkins: checkins.body
      }, null, 2));
    }
  });

  it.each(['peer', 'outsider', 'other-manager', 'anonymous'])('denies %s even with admin view query parameters', async role => {
    const actors: Record<string, number> = { peer, outsider, 'other-manager': crossOrg, anonymous: 0 };
    const actor = actors[role] ?? 0;
    for (const suffix of ['', '/checkins']) {
      const response = await request(app).get(`/practices/${externalId}${suffix}?view=cohort-admin&programId=${program}&cohortId=${cohort}`).set('x-test-user', String(actor)).expect(403);
      expect(JSON.stringify(response.body)).not.toContain(title);
      expect(JSON.stringify(response.body)).not.toContain('546 visible draft check-in');
      expect(JSON.stringify(response.body)).not.toContain(privateMarker);
    }
  });

  it.each(['invited', 'removed', 'exited'])('denies manager draft access when target is %s', async status => {
    await prisma.cohort_enrollments.update({ where: { id: targetEnrollment }, data: { status } });
    const roster = await request(app).get('/roster').set('x-test-user', String(manager)).expect(200);
    expect(roster.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ practiceId: practice })]));
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(manager)).expect(403);
  });

  it.each(['suspended-organization', 'challenge', 'detached', 'delayed'])('does not widen %s access', async scenario => {
    if (scenario === 'suspended-organization') await prisma.organization.update({ where: { id: organization }, data: { status: 'suspended' } });
    if (scenario === 'challenge') await prisma.programs.update({ where: { id: program }, data: { kind: 'challenge' } });
    if (scenario === 'detached') await prisma.practices.update({ where: { id: practice }, data: { cohort_id: null } });
    if (scenario === 'delayed') await prisma.practices.update({ where: { id: practice }, data: { privacy_status: 'delayed' } });
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(manager)).expect(403);
  });

  it('allows own draft reading unchanged', async () => {
    await request(app).get(`/practices/${externalId}`).set('x-test-user', String(owner)).expect(200);
    await request(app).get(`/practices/${externalId}/checkins`).set('x-test-user', String(owner)).expect(200);
  });

  it('does not expose public cohort drafts to peers or outsiders', async () => {
    await prisma.practices.update({ where: { id: practice }, data: { privacy_status: 'public' } });
    for (const actor of [peer, outsider, crossOrg, 0]) {
      for (const suffix of ['', '/checkins']) {
        const response = await request(app).get(`/practices/${externalId}${suffix}?view=cohort-admin`).set('x-test-user', String(actor)).expect(403);
        expect(JSON.stringify(response.body)).not.toContain(title);
        expect(JSON.stringify(response.body)).not.toContain('546 visible draft check-in');
      }
    }
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(manager)).expect(200);
  });

  it('preserves owner access to an ordinary personal draft', async () => {
    await prisma.practices.update({ where: { id: practice }, data: { cohort_id: null, creation_source: 'self_created', privacy_status: 'public' } });
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(owner)).expect(200);
    for (const actor of [outsider, 0]) {
      const response = await request(app).get(`/practices/${externalId}`).set('x-test-user', String(actor)).expect(200);
      expect(response.body.data.title).toBe(title);
      expect(JSON.stringify(response.body)).not.toContain(privateMarker);
      await request(app).get(`/practices/${externalId}/checkins`).set('x-test-user', String(actor)).expect(403);
    }
  });

  it('preserves private personal draft owner access and denies outsiders', async () => {
    await prisma.practices.update({ where: { id: practice }, data: { cohort_id: null, creation_source: 'self_created' } });
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(owner)).expect(200);
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(outsider)).expect(403);
  });

  it.each(['detached-cohort-template', 'challenge'])('preserves public draft detail policy for %s', async scenario => {
    await prisma.practices.update({ where: { id: practice }, data: { privacy_status: 'public' } });
    if (scenario === 'detached-cohort-template') await prisma.practices.update({ where: { id: practice }, data: { cohort_id: null } });
    if (scenario === 'challenge') await prisma.programs.update({ where: { id: program }, data: { kind: 'challenge' } });
    for (const actor of [outsider, 0]) {
      const response = await request(app).get(`/practices/${externalId}`).set('x-test-user', String(actor)).expect(200);
      expect(response.body.data).toMatchObject({ id: externalId, status: 'draft', isCopyRestricted: true });
      expect(JSON.stringify(response.body)).not.toContain(privateMarker);
      await request(app).get(`/practices/${externalId}/checkins`).set('x-test-user', String(actor)).expect(403);
    }
  });

  it('reads through UTC retention day90 and denies day91', async () => {
    await prisma.cohorts.update({ where: { id: cohort }, data: { start_date: new Date('2026-08-01T00:00:00Z'), end_date: new Date('2026-08-19T00:00:00Z') } });
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(manager)).expect(200);
    jest.setSystemTime(new Date('2026-11-18T12:00:00Z'));
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(manager)).expect(403);
  });

  it('revokes manager access immediately after membership removal', async () => {
    await request(app).get(`/practices/${externalId}`).set('x-test-user', String(manager)).expect(200);
    await prisma.organization_members.delete({ where: { organization_id_user_id: { organization_id: organization, user_id: manager } } });
    for (const suffix of ['', '/checkins']) await request(app).get(`/practices/${externalId}${suffix}`).set('x-test-user', String(manager)).expect(403);
  });
});
