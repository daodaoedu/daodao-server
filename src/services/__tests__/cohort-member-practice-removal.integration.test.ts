/**
 * #549 real PostgreSQL regression. Run with the disposable test-local runner;
 * Prisma, membership mutations, and the participant/coach reads remain real.
 * Only outbound notification and queue delivery are replaced to avoid email.
 */
import { randomUUID } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import request from 'supertest';
import { generateToken } from '../jwt.service';
import { authenticateAny, optionalAuth } from '../../middleware/auth';
import { requireOrganizationMember } from '../../middleware/organization-member.middleware';
import { requireCohortCoach } from '../../middleware/cohort-role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { cohortMembershipController } from '../../controllers/cohort-membership.controller';
import { cohortDashboardController } from '../../controllers/cohort-dashboard.controller';
import { practiceController } from '../../controllers/practice.controller';
import { commentController } from '../../controllers/comment.controller';
import { listMySpaces } from '../../controllers/space.controller';
import { removeCohortMemberParamsSchema } from '../../validators/cohort-membership.validators';
import { cohortParamsSchema } from '../../validators/cohort.validators';
import { cohortParticipantsQuerySchema } from '../../validators/cohort-dashboard.validators';
import { myPracticesQuerySchema, practiceParamsSchema, checkInQuerySchema } from '../../validators/practice.validators';
import { commentParamsSchema, getCommentsQuerySchema } from '../../validators/comment.validators';
import { prisma } from '../database/prisma.service';
import { cohortMembershipService } from '../cohort-membership.service';
import { cohortDashboardService } from '../cohort-dashboard.service';
import { spaceService } from '../space.service';
import { findAll, findById } from '../practice.service';
import { ConflictError, ForbiddenError, NotFoundError, globalErrorHandler } from '../../middleware/error.middleware';
import { notificationEventService } from '../notification-event.service';
import { externalToInternalId, getTargetEntity } from '../id-converter.service';
import { commentService } from '../comment.service';

jest.mock('../notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../queues', () => ({ enqueuePracticeEmail: jest.fn() }));

const removedAt = new Date('2026-11-17T02:30:00.000Z');
const earlierDeletion = new Date('2026-11-01T01:02:03.000Z');
const start = new Date('2026-11-01T00:00:00.000Z');
const end = new Date('2026-11-30T00:00:00.000Z');
const participantQuery = { sort: 'nickname' as const, order: 'asc' as const };

type Fixture = {
  organizationId: number;
  programId: number;
  cohortId: number;
  otherCohortId: number;
  actorId: number;
  userId: number;
  otherUserId: number;
  outsiderId: number;
  enrollmentId: number;
  invitationId: number;
  targetIds: number[];
  targetExternalId: string;
  checkinId: number;
  commentIds: number[];
  targetTitles: string[];
  preservedIds: number[];
  allPracticeIds: number[];
};

let roleId: number;
let fixture: Fixture | undefined;

/** Seed one complete, uniquely owned scope in a single transaction. */
async function seed(): Promise<Fixture> {
  const marker = randomUUID();
  return prisma.$transaction(async tx => {
    const actor = await tx.users.create({ data: { mongo_id: randomUUID(), nickname: '549 管理員', tag_list: [], role_id: roleId } });
    const owner = await tx.users.create({ data: { mongo_id: randomUUID(), nickname: '549 移除對象', tag_list: [], role_id: roleId } });
    const other = await tx.users.create({ data: { mongo_id: randomUUID(), nickname: '549 其他參與者', tag_list: [], role_id: roleId } });
    const outsider = await tx.users.create({ data: { mongo_id: randomUUID(), nickname: '549 範圍外使用者', tag_list: [], role_id: roleId } });
    const organization = await tx.organization.create({ data: { name: `549 ${marker}`, status: 'active' } });
    await tx.organization_members.create({ data: { organization_id: organization.id, user_id: actor.id, role: 'owner' } });
    const program = await tx.programs.create({ data: { organization_id: organization.id, name: '549 管理員移除測試' } });
    const cohort = await tx.cohorts.create({ data: { program_id: program.id, slug: `remove-${marker}`, display_name: '549 本期', start_date: start, end_date: end } });
    const otherCohort = await tx.cohorts.create({ data: { program_id: program.id, slug: `other-${marker}`, display_name: '549 另一期', start_date: start, end_date: end } });
    const enrollment = await tx.cohort_enrollments.create({ data: { cohort_id: cohort.id, user_id: owner.id, email: `${marker}@example.test`, status: 'joined', joined_at: start } });
    await tx.cohort_enrollments.create({ data: { cohort_id: cohort.id, user_id: other.id, status: 'joined', joined_at: start } });
    const invitation = await tx.cohort_enrollments.create({ data: { cohort_id: cohort.id, email: `invited-${marker}@example.test`, status: 'invited' } });
    const targetTitles = ['549 本期啟用實踐', '549 本期草稿'];
    const active = await tx.practices.create({ data: { user_id: owner.id, cohort_id: cohort.id, title: targetTitles[0], status: 'active', creation_source: 'cohort_template', practice_time_periods: [] } });
    if (!active.external_id) throw new Error('Practice UUID default is missing');
    const checkin = await tx.practice_checkins.create({ data: { practice_id: active.id, user_id: owner.id, checkin_date: start, note: '549 保留的打卡內容', image_urls: [] } });
    const practiceComment = await tx.comments.create({ data: { target_type: 'practice', target_id: active.id, user_id: owner.id, visibility: 'public', content: '549 保留的實踐留言' } });
    const checkinComment = await tx.comments.create({ data: { target_type: 'checkin', target_id: checkin.id, user_id: owner.id, visibility: 'public', content: '549 保留的打卡留言' } });
    const draft = await tx.practices.create({ data: { user_id: owner.id, cohort_id: cohort.id, title: targetTitles[1], status: 'draft', practice_time_periods: [] } });
    const personal = await tx.practices.create({ data: { user_id: owner.id, title: '549 無關個人實踐', status: 'active', practice_time_periods: [] } });
    const otherPeriod = await tx.practices.create({ data: { user_id: owner.id, cohort_id: otherCohort.id, title: '549 另一期實踐', status: 'active', practice_time_periods: [] } });
    const otherMember = await tx.practices.create({ data: { user_id: other.id, cohort_id: cohort.id, title: '549 其他參與者實踐', status: 'active', practice_time_periods: [] } });
    const alreadyDeleted = await tx.practices.create({ data: { user_id: owner.id, cohort_id: cohort.id, title: '549 先前已刪實踐', status: 'active', deleted_at: earlierDeletion, practice_time_periods: [] } });
    for (const cohortId of [cohort.id, otherCohort.id]) {
      await tx.cohort_stat_snapshots.create({ data: { cohort_id: cohortId, period_start: start, metrics: { fixture: marker } } });
    }
    return {
      organizationId: organization.id, programId: program.id, cohortId: cohort.id,
      otherCohortId: otherCohort.id, actorId: actor.id, userId: owner.id, otherUserId: other.id, outsiderId: outsider.id,
      enrollmentId: enrollment.id, invitationId: invitation.id,
      targetIds: [active.id, draft.id], targetExternalId: active.external_id, checkinId: checkin.id,
      commentIds: [practiceComment.id, checkinComment.id], targetTitles,
      preservedIds: [personal.id, otherPeriod.id, otherMember.id, alreadyDeleted.id],
      allPracticeIds: [active.id, draft.id, personal.id, otherPeriod.id, otherMember.id, alreadyDeleted.id],
    };
  });
}

/** Require successful fixture creation rather than silently skipping DB cases. */
function current(): Fixture {
  if (!fixture) throw new Error('PostgreSQL fixture was not created');
  return fixture;
}

/** Read persisted fields to detect unintended updates outside the removal scope. */
async function practiceRows(ids: number[]) {
  return prisma.practices.findMany({ where: { id: { in: ids } }, orderBy: { id: 'asc' } });
}

/** Mirror the selected production route stacks with real auth, controllers, validators and DB. */
function httpApp() {
  const app = express();
  app.use(express.json());
  const scope = '/api/v1/lighthouse/programs/:programId/cohorts/:cohortId';
  app.delete(`${scope}/members/:enrollmentId`, authenticateAny, requireOrganizationMember, requireCohortCoach,
    validate(removeCohortMemberParamsSchema, 'params'), cohortMembershipController.remove);
  app.get(`${scope}/participants`, authenticateAny, requireOrganizationMember, requireCohortCoach,
    validate(cohortParamsSchema, 'params'), validate(cohortParticipantsQuerySchema, 'query'), cohortDashboardController.listParticipants);
  app.get('/api/v1/practices/me', authenticateAny, validate(myPracticesQuerySchema, 'query'), practiceController.getMyPractices);
  app.get('/api/v1/practices/:id', optionalAuth, validate(practiceParamsSchema, 'params'), practiceController.getPractice);
  app.get('/api/v1/practices/:id/checkins', optionalAuth,
    validate(practiceParamsSchema, 'params'), validate(checkInQuerySchema, 'query'), practiceController.getCheckIns);
  app.get('/api/v1/practices/:id/checkins/stats', authenticateAny,
    validate(practiceParamsSchema, 'params'), practiceController.getCheckInStats);
  // This route-local schema is not exported from practice.routes.ts; preserve
  // its exact valid-input parsing while exercising the actual controller.
  const calendarParams = z.object({
    id: z.string().uuid('Practice ID must be a valid UUID'),
    year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits').transform(Number),
    month: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Month must be 1-12').transform(Number),
  });
  app.get('/api/v1/practices/:id/checkins/calendar/:year/:month', authenticateAny,
    validate(calendarParams, 'params'), practiceController.getMonthlyCheckInCalendar);
  app.get('/api/v1/comments', optionalAuth,
    validate(getCommentsQuerySchema, 'query'), commentController.getComments);

  app.get('/api/v1/comments/:commentId', optionalAuth, validate(commentParamsSchema, 'params'), commentController.getCommentDetail);
  app.get('/api/v1/spaces', authenticateAny, listMySpaces);
  app.use(globalErrorHandler);
  return app;
}

describe('#549 administrator removal with real PostgreSQL', () => {
  beforeAll(async () => {
    // Canonical schema seeds role IDs without advancing its serial sequence.
    // Reuse its User role, and never modify or delete seeded roles.
    const role = await prisma.roles.findUnique({ where: { name: 'User' } });
    if (!role) throw new Error('The canonical PostgreSQL schema must seed the User role');
    roleId = role.id;
  });
  beforeEach(async () => { fixture = await seed(); });
  afterEach(async () => {
    if (!fixture) return;
    const f = fixture;
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`DELETE FROM audit_logs WHERE admin_id = ${f.actorId}`;
      await tx.comments.deleteMany({ where: { id: { in: f.commentIds } } });
      await tx.practice_checkins.deleteMany({ where: { id: f.checkinId } });
      await tx.practices.deleteMany({ where: { id: { in: f.allPracticeIds } } });
      await tx.cohort_stat_snapshots.deleteMany({ where: { cohort_id: { in: [f.cohortId, f.otherCohortId] } } });
      await tx.cohort_enrollments.deleteMany({ where: { cohort_id: { in: [f.cohortId, f.otherCohortId] } } });
      await tx.cohorts.deleteMany({ where: { id: { in: [f.cohortId, f.otherCohortId] } } });
      await tx.programs.delete({ where: { id: f.programId } });
      await tx.organization_members.deleteMany({ where: { organization_id: f.organizationId } });
      await tx.organization.delete({ where: { id: f.organizationId } });
      await tx.users.deleteMany({ where: { id: { in: [f.actorId, f.userId, f.otherUserId, f.outsiderId] } } });
    });
    fixture = undefined;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('retains and timestamps only the removed member’s active cohort rows, hiding them from personal and coach reads', async () => {
    const f = current();
    const preservedBefore = await practiceRows(f.preservedIds);
    const listBefore = await findAll({ userId: f.userId, status: 'all' });
    for (const title of f.targetTitles) expect(JSON.stringify(listBefore)).toContain(title);
    const coachBefore = await cohortDashboardService.listParticipants(f.programId, f.cohortId, f.actorId, participantQuery, removedAt);
    expect(coachBefore.items.map(item => item.practiceId)).toEqual(expect.arrayContaining(f.targetIds));
    const spacesBefore = await spaceService.listMySpaces(f.userId);
    expect(spacesBefore.items.find(item => item.kind === 'personal')?.practiceCount).toBe(4);

    await expect(cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, removedAt))
      .resolves.toEqual({ userId: f.userId, detachedPracticeCount: 2 });

    const removedRows = await practiceRows(f.targetIds);
    expect(removedRows).toHaveLength(2);
    for (const row of removedRows) {
      expect(row.deleted_at).toEqual(removedAt);
      expect(row.cohort_id).toBeNull();
    }
    expect(await practiceRows(f.preservedIds)).toEqual(preservedBefore);
    expect(await prisma.cohort_enrollments.findUnique({ where: { id: f.enrollmentId } })).toEqual(expect.objectContaining({ status: 'removed', exited_at: removedAt }));
    expect(await prisma.cohort_stat_snapshots.count({ where: { cohort_id: f.cohortId } })).toBe(0);
    expect(await prisma.cohort_stat_snapshots.count({ where: { cohort_id: f.otherCohortId } })).toBe(1);

    const listAfter = await findAll({ userId: f.userId, status: 'all' });
    for (const title of f.targetTitles) expect(JSON.stringify(listAfter)).not.toContain(title);
    expect(JSON.stringify(listAfter)).toContain('549 無關個人實踐');
    expect(JSON.stringify(listAfter)).toContain('549 另一期實踐');
    for (const id of f.targetIds) await expect(findById(id, f.userId)).rejects.toBeInstanceOf(NotFoundError);
    const coachAfter = await cohortDashboardService.listParticipants(f.programId, f.cohortId, f.actorId, participantQuery, removedAt);
    expect(coachAfter.items.map(item => item.practiceId)).toEqual([f.preservedIds[2]]);
    for (const title of f.targetTitles) expect(JSON.stringify(coachAfter)).not.toContain(title);
    const spacesAfter = await spaceService.listMySpaces(f.userId);
    expect(spacesAfter.items.find(item => item.kind === 'personal')?.practiceCount).toBe(2);
    expect(spacesAfter.items.some(item => item.kind === 'event_course' && item.id === String(f.cohortId))).toBe(false);
    expect(notificationEventService.createEvent).toHaveBeenCalledWith(expect.objectContaining({ recipientId: f.userId, payload: expect.objectContaining({ message: expect.stringContaining('本期實踐已從個人空間移除') }) }));
  });


  it.each(['practice UUID', 'checkin ID', 'practice interaction target', 'checkin interaction target'] as const)('keeps retained rows unreachable through %s after removal', async surface => {
    const f = current();
    const resolve = () => {
      if (surface === 'practice UUID') return externalToInternalId('practice', f.targetExternalId);
      if (surface === 'checkin ID') return externalToInternalId('checkin', String(f.checkinId));
      if (surface === 'practice interaction target') return getTargetEntity('practice', f.targetExternalId);
      return getTargetEntity('checkin', String(f.checkinId));
    };
    await expect(resolve()).resolves.toBeDefined();
    await cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, removedAt);
    expect(await prisma.practice_checkins.findUnique({ where: { id: f.checkinId } })).toEqual(expect.objectContaining({ note: '549 保留的打卡內容' }));
    await expect(resolve()).rejects.toBeInstanceOf(NotFoundError);
  });

  it.each(['practice', 'checkin'] as const)('blocks a retained %s comment deep link for every viewer after removal', async target => {
    const f = current();
    const commentId = f.commentIds[target === 'practice' ? 0 : 1];
    const viewers = [null, { id: f.userId, role: '2' }, { id: f.actorId, role: '5' }, { id: f.otherUserId, role: '2' }];
    const targetId = target === 'practice' ? f.targetExternalId : String(f.checkinId);
    for (const viewer of viewers) {
      expect(JSON.stringify(await commentService.getCommentDetail(commentId, viewer))).toContain('549 保留的');
      expect(JSON.stringify(await commentService.getComments({ targetType: target, targetId, currentUser: viewer }))).toContain('549 保留的');
    }
    await cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, removedAt);
    expect(await prisma.comments.findUnique({ where: { id: commentId } })).toEqual(expect.objectContaining({ content: expect.stringContaining('549 保留的') }));
    for (const viewer of viewers) {
      await expect(commentService.getCommentDetail(commentId, viewer)).rejects.toBeInstanceOf(NotFoundError);
      await expect(commentService.getComments({ targetType: target, targetId, currentUser: viewer })).rejects.toBeInstanceOf(NotFoundError);
    }
  });


  it('enforces administrator removal and raw HTTP visibility for owner, member, outsider and anonymous viewers', async () => {
    const f = current();
    const app = httpApp();
    const token = (id: number) => `Bearer ${generateToken({ id, roles: ['2'] })}`;
    const ownerToken = token(f.userId);
    const adminToken = token(f.actorId);
    const scope = `/api/v1/lighthouse/programs/${f.programId}/cohorts/${f.cohortId}`;
    const mutation = `${scope}/members/${f.enrollmentId}`;
    const checkinsPath = `/api/v1/practices/${f.targetExternalId}/checkins`;
    const aggregatePaths = [`${checkinsPath}/stats`, `${checkinsPath}/calendar/2026/11`];
    const commentListPaths = [
      `/api/v1/comments?targetType=practice&targetId=${f.targetExternalId}`,
      `/api/v1/comments?targetType=checkin&targetId=${f.checkinId}`,
    ];
    await request(app).delete(mutation).expect(401);
    for (const id of [f.userId, f.otherUserId, f.outsiderId]) {
      const denied = await request(app).delete(mutation).set('Authorization', token(id)).expect(403);
      for (const title of f.targetTitles) expect(denied.text).not.toContain(title);
    }
    const mineBefore = await request(app).get('/api/v1/practices/me?status=all').set('Authorization', ownerToken).expect(200);
    for (const title of f.targetTitles) expect(mineBefore.text).toContain(title);
    const coachBefore = await request(app).get(`${scope}/participants`).set('Authorization', adminToken).expect(200);
    for (const title of f.targetTitles) expect(coachBefore.text).toContain(title);
    for (const commentId of f.commentIds) {
      const before = await request(app).get(`/api/v1/comments/${commentId}`).expect(200);
      expect(before.text).toContain('549 保留的');
    }

    const checkinsBefore = await request(app).get(checkinsPath).set('Authorization', ownerToken).expect(200);
    expect(checkinsBefore.text).toContain('549 保留的打卡內容');
    for (const path of aggregatePaths) {
      const aggregateBefore = await request(app).get(path).set('Authorization', ownerToken).expect(200);
      expect(aggregateBefore.body.data.totalCheckIns).toBe(1);
    }
    for (const path of commentListPaths) {
      const commentsBefore = await request(app).get(path).expect(200);
      expect(commentsBefore.text).toContain('549 保留的');
    }

    await request(app).delete(mutation).set('Authorization', adminToken).expect(204);
    const mineAfter = await request(app).get('/api/v1/practices/me?status=all').set('Authorization', ownerToken).expect(200);
    for (const title of f.targetTitles) expect(mineAfter.text).not.toContain(title);
    expect(mineAfter.text).toContain('549 無關個人實踐');
    expect(mineAfter.text).toContain('549 另一期實踐');
    const coachAfter = await request(app).get(`${scope}/participants`).set('Authorization', adminToken).expect(200);
    for (const title of f.targetTitles) expect(coachAfter.text).not.toContain(title);
    expect(coachAfter.text).toContain('549 其他參與者實踐');
    for (const id of [f.userId, f.otherUserId, f.outsiderId, null]) {
      const auth = id === null ? undefined : token(id);
      const coachRequest = request(app).get(`${scope}/participants`);
      if (auth) coachRequest.set('Authorization', auth);
      const denied = await coachRequest.expect(auth ? 403 : 401);
      for (const title of f.targetTitles) expect(denied.text).not.toContain(title);
    }
    for (const id of [f.userId, f.actorId, f.otherUserId, f.outsiderId, null]) {
      const auth = id === null ? undefined : token(id);
      for (const path of [`/api/v1/practices/${f.targetExternalId}`, checkinsPath, ...commentListPaths, ...f.commentIds.map(commentId => `/api/v1/comments/${commentId}`)]) {
        const deepLink = request(app).get(path);
        if (auth) deepLink.set('Authorization', auth);
        const missing = await deepLink.expect(404);
        expect(missing.text).not.toContain('549 保留的');
        for (const title of f.targetTitles) expect(missing.text).not.toContain(title);
      }
    }
    for (const id of [f.userId, f.actorId, f.otherUserId, f.outsiderId, null]) {
      for (const path of aggregatePaths) {
        const aggregateRequest = request(app).get(path);
        if (id !== null) aggregateRequest.set('Authorization', token(id));
        const aggregateAfter = await aggregateRequest.expect(id === null ? 401 : 404);
        expect(aggregateAfter.text).not.toContain('549 保留的');
        expect(aggregateAfter.body.data).toBeNull();
      }
    }
    const spaces = await request(app).get('/api/v1/spaces').set('Authorization', ownerToken).expect(200);
    expect(spaces.body.data.items.find((item: { kind: string }) => item.kind === 'personal').practiceCount).toBe(2);
    expect(await prisma.practices.count({ where: { id: { in: f.targetIds }, deleted_at: { not: null } } })).toBe(2);
    expect(await prisma.practice_checkins.findUnique({ where: { id: f.checkinId } })).not.toBeNull();
    expect(await prisma.comments.count({ where: { id: { in: f.commentIds } } })).toBe(2);
  }, 30_000);

  it('removes an invitation without a user without deleting anyone’s practices or sending a notification', async () => {
    const f = current();
    const before = await practiceRows(f.allPracticeIds);
    await expect(cohortMembershipService.remove(f.programId, f.cohortId, f.invitationId, f.actorId, removedAt))
      .resolves.toEqual({ userId: null, detachedPracticeCount: 0 });
    expect(await practiceRows(f.allPracticeIds)).toEqual(before);
    expect(await prisma.cohort_enrollments.findUnique({ where: { id: f.invitationId } })).toEqual(expect.objectContaining({ status: 'removed', exited_at: removedAt }));
    expect(notificationEventService.createEvent).not.toHaveBeenCalled();
  });

  it('rejects an unrelated actor and a mismatched cohort without changing enrollment or practices', async () => {
    const f = current();
    const before = await practiceRows(f.allPracticeIds);
    await expect(cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.otherUserId, removedAt)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(cohortMembershipService.remove(f.programId, f.otherCohortId, f.enrollmentId, f.actorId, removedAt)).rejects.toBeInstanceOf(ForbiddenError);
    expect(await practiceRows(f.allPracticeIds)).toEqual(before);
    expect(await prisma.cohort_enrollments.findUnique({ where: { id: f.enrollmentId } })).toEqual(expect.objectContaining({ status: 'joined', exited_at: null }));
    expect(notificationEventService.createEvent).not.toHaveBeenCalled();
  });


  it('rolls back practice, enrollment and snapshot changes when the audit write fails inside the transaction', async () => {
    const f = current();
    const before = await practiceRows(f.allPracticeIds);
    const enrollmentBefore = await prisma.cohort_enrollments.findUnique({ where: { id: f.enrollmentId } });
    const snapshotsBefore = await prisma.cohort_stat_snapshots.findMany({ where: { cohort_id: f.cohortId } });
    // Identifiers contain only a fixed prefix and UUID hex; the trigger applies
    // solely to this fixture's actor/enrollment in the disposable database.
    const name = `removal_549_${randomUUID().replace(/-/g, '')}`;
    try {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION '549 injected audit failure'; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER ${name} BEFORE INSERT ON audit_logs FOR EACH ROW WHEN (NEW.admin_id = ${f.actorId} AND NEW.target_id = '${f.enrollmentId}') EXECUTE FUNCTION ${name}()`);
      await expect(cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, removedAt)).rejects.toThrow('549 injected audit failure');
      expect(await practiceRows(f.allPracticeIds)).toEqual(before);
      expect(await prisma.cohort_enrollments.findUnique({ where: { id: f.enrollmentId } })).toEqual(enrollmentBefore);
      expect(await prisma.cohort_stat_snapshots.findMany({ where: { cohort_id: f.cohortId } })).toEqual(snapshotsBefore);
      expect(notificationEventService.createEvent).not.toHaveBeenCalled();
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${name} ON audit_logs`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${name}()`);
    }
  });

  it('rejects repeated removal without rewriting deletion times or sending another notification', async () => {
    const f = current();
    await cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, removedAt);
    const before = await practiceRows(f.allPracticeIds);
    await expect(cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, new Date('2026-11-18T02:30:00Z'))).rejects.toBeInstanceOf(ConflictError);
    expect(await practiceRows(f.allPracticeIds)).toEqual(before);
    expect(notificationEventService.createEvent).toHaveBeenCalledTimes(1);
  });
});
