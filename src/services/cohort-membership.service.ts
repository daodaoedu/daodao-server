import type { Prisma } from '../../generated/prisma';
import { ConflictError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { ForbiddenError } from '../middleware/error.middleware';
import { notificationEventService } from './notification-event.service';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';

/** Preserve detached practices as independent personal copies before leaving the binding scope. */
async function detachCohortPractices(tx: Prisma.TransactionClient, cohortId: number, userId: number): Promise<Prisma.BatchPayload> {
  // Match join's ascending template lock order; admin PUT also locks its binding
  // before touching resources/practices. Never lock a practice before these rows.
  await tx.$queryRaw`SELECT id FROM cohort_templates WHERE cohort_id = ${cohortId} ORDER BY template_id FOR UPDATE`;
  const sharedLinks = await tx.entity_resources.findMany({
    where: { entity_type: 'practice', deleted_at: null, cohort_template_resource_id: { not: null },
      entity_id: { in: (await tx.practices.findMany({ where: { cohort_id: cohortId, user_id: userId }, select: { id: true } })).map(row => row.id) } },
    include: { resources: true }
  });
  for (const link of sharedLinks) {
    const source = link.resources;
    const copy = await tx.resources.create({ data: {
      created_by: userId, name: source.name, url: source.url, description: source.description,
      type: source.type, cost: source.cost, level: source.level, image_url: source.image_url,
      video_url: source.video_url, major_category_id: source.major_category_id,
      sub_category_id: source.sub_category_id, status: source.status, deleted_at: source.deleted_at
    } });
    await tx.entity_resources.update({ where: { id: link.id }, data: {
      resource_id: copy.id, cohort_template_resource_id: null
    } });
  }
  return tx.practices.updateMany({ where: { cohort_id: cohortId, user_id: userId }, data: { cohort_id: null } });
}

const exit = async (cohortId: number, userId: number, now = new Date()) => {
  const result = await prisma.$transaction(async tx => {
    const enrollment = await tx.cohort_enrollments.findFirst({ where: { cohort_id: cohortId, user_id: userId }, select: { id: true, status: true } });
    if (!enrollment) throw new NotFoundError('找不到本期參與紀錄');
    if (enrollment.status !== 'joined') throw new ConflictError('目前狀態無法退出');
    const detached = await detachCohortPractices(tx, cohortId, userId);
    await tx.cohort_enrollments.update({ where: { id: enrollment.id }, data: { status: 'exited', exited_at: now } });
    await tx.cohort_stat_snapshots.deleteMany({ where: { cohort_id: cohortId } });
    return { enrollmentId: enrollment.id, status: 'exited' as const, detachedPracticeCount: detached.count };
  });
  return result;
};
const remove = async (programId: number, cohortId: number, enrollmentId: number, actorId: number, now = new Date()) => {
  const result = await prisma.$transaction(async tx => {
    const enrollment = await tx.cohort_enrollments.findFirst({
      where: { id: enrollmentId, cohort_id: cohortId, cohort: { program_id: programId, program: { organization: { status: 'active', organization_members: { some: { user_id: actorId } } } } } },
      select: { id: true, user_id: true, status: true, cohort: { select: { display_name: true } } }
    });
    if (!enrollment) throw new ForbiddenError('無權限移除此成員');
    if (enrollment.status !== 'joined' && enrollment.status !== 'invited') throw new ConflictError('此成員目前不在期內');
    const detached = enrollment.user_id === null ? { count: 0 } : await detachCohortPractices(tx, cohortId, enrollment.user_id);
    await tx.cohort_enrollments.update({ where: { id: enrollment.id }, data: { status: 'removed', exited_at: now } });
    await tx.cohort_stat_snapshots.deleteMany({ where: { cohort_id: cohortId } });
    await tx.$executeRaw`
      INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
      VALUES (${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_MEMBER_REMOVED}, 'cohort_enrollment', ${String(enrollment.id)},
              ${JSON.stringify({ status: enrollment.status })}::jsonb,
              ${JSON.stringify({ status: 'removed', affectedCount: 1, detachedPracticeCount: detached.count })}::jsonb)
    `;
    return { userId: enrollment.user_id, detachedPracticeCount: detached.count, cohortName: enrollment.cohort?.display_name };
  });
  if (result.userId !== null) {
    await notificationEventService.createEvent({ type: NOTIFICATION_TYPES.COHORT_MEMBER_REMOVED, actorId, recipientId: result.userId, entityType: 'cohort', entityId: cohortId, payload: { ...(result.cohortName && { cohortName: result.cohortName }), message: `你已不再參與${result.cohortName ? `「${result.cohortName}」` : '此期'}，原有實踐已轉回個人實踐。` }, priority: 'P1' });
  }
  return { userId: result.userId, detachedPracticeCount: result.detachedPracticeCount };
};
const listLearners = async (programId: number, cohortId: number, actorId: number) => {
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, program: { organization: { organization_members: { some: { user_id: actorId } } } } }, select: { id: true } });
  if (!cohort) throw new ForbiddenError('無權限查看此期名冊');
  const rows = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: cohortId, status: 'joined', user_id: { not: null } },
    select: { user_id: true, joined_at: true, user: { select: { nickname: true, contacts: { select: { photo_url: true } } } } },
    orderBy: { joined_at: 'asc' }
  });
  return rows.flatMap(row => row.user_id === null || row.joined_at === null ? [] : [{ id: row.user_id, nickname: row.user?.nickname ?? null, avatar: row.user?.contacts?.photo_url ?? null, joinedAt: row.joined_at }]);
};
const listEnrollments = async (programId: number, cohortId: number, actorId: number) => {
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, program: { organization: { organization_members: { some: { user_id: actorId } } } } }, select: { id: true } });
  if (!cohort) throw new ForbiddenError('無權限查看此期名單');
  const rows = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: cohortId },
    select: { id: true, email: true, user_id: true, role: true, status: true, invited_at: true, joined_at: true, exited_at: true, export_opt_in: true, user: { select: { nickname: true } } },
    orderBy: [{ status: 'asc' }, { invited_at: 'asc' }]
  });
  return rows.map(row => ({
    id: row.id,
    email: row.email,
    userId: row.user_id,
    nickname: row.user?.nickname ?? null,
    role: row.role,
    status: row.status,
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
    exitedAt: row.exited_at
    , exportOptIn: row.export_opt_in
  }));
};
export const cohortMembershipService = { exit, remove, listLearners, listEnrollments };
