/** Opt-in real persistence check. Only the task-owned disposable PostgreSQL port is permitted. */
import { randomUUID } from 'crypto';
import { prisma } from '../database/prisma.service';
import { cohortService } from '../cohort.service';
import { cohortJoinService } from '../cohort-join.service';
import { activityService } from '../activity.service';
import { createCohortSchema } from '../../validators/cohort.validators';

const suite = process.env.RUN_COHORT_SCHEDULE_POSTGRES === '1' ? describe : describe.skip;
suite('cohort schedule actual PostgreSQL round-trip', () => {
  let actor = 0;
  let organization = 0;
  let program = 0;
  let role = 0;
  const cohortIds: number[] = [];
  const groupId = randomUUID();
  const rule = { startDate: '2026-11-10', weeks: 4, weekdays: [2, 4] };
  const sessions = [
    { sessionDate: '2026-11-10', startTime: '19:00', endTime: '20:00', recurrenceGroupId: groupId, recurrenceRule: rule },
    { sessionDate: '2026-11-12', startTime: '19:00', endTime: '20:00', recurrenceGroupId: groupId, recurrenceRule: rule },
    { sessionDate: '2026-11-17', startTime: '19:00', endTime: '20:00', recurrenceGroupId: null, recurrenceRule: null },
    { sessionDate: '2026-11-24', startTime: '19:00', endTime: '20:00', recurrenceGroupId: null, recurrenceRule: null }
  ];
  beforeAll(async () => {
    const target = new URL(process.env.DATABASE_URL ?? '');
    if (target.hostname !== '127.0.0.1' || target.port !== '5547' || target.pathname !== '/daodao_test') {
      throw new Error('This test only permits the #347 disposable database');
    }
    const marker = `347-${randomUUID()}`;
    role = (await prisma.roles.create({ data: { name: marker } })).id;
    actor = (await prisma.users.create({ data: { mongo_id: marker, nickname: marker, role_id: role, tag_list: [] } })).id;
    organization = (await prisma.organization.create({ data: { name: marker } })).id;
    await prisma.organization_members.create({ data: { organization_id: organization, user_id: actor } });
    program = (await prisma.programs.create({ data: { organization_id: organization, name: marker } })).id;
  });
  afterAll(async () => {
    if (actor) await prisma.$executeRaw`DELETE FROM audit_logs WHERE admin_id = ${actor}`;
    if (cohortIds.length) {
      await prisma.cohort_enrollments.deleteMany({ where: { cohort_id: { in: cohortIds } } });
      await prisma.chat_rooms.deleteMany({ where: { cohort_id: { in: cohortIds } } });
      await prisma.cohort_sessions.deleteMany({ where: { cohort_id: { in: cohortIds } } });
      await prisma.cohorts.deleteMany({ where: { id: { in: cohortIds } } });
    }
    if (program) await prisma.programs.delete({ where: { id: program } });
    if (organization) {
      await prisma.organization_members.deleteMany({ where: { organization_id: organization } });
      await prisma.organization.delete({ where: { id: organization } });
    }
    if (actor) await prisma.users.delete({ where: { id: actor } });
    if (role) await prisma.roles.delete({ where: { id: role } });
    await prisma.$disconnect();
  });
  it('persists rules, independently edits occurrences, preserves wall times on timezone changes and duplicates', async () => {
    const created = await cohortService.create(program, createCohortSchema.parse({
      slug: 'schedule-real', displayName: '347 round trip', startDate: '2026-11-01', endDate: '2099-12-31',
      timezone: 'Asia/Taipei', interactionModes: ['sync'], visibility: 'public', status: 'published', sessions
    }), actor);
    cohortIds.push(created.id);
    expect(created.timezone).toBe('Asia/Taipei');
    expect(created.sessions.map(({ id: _id, ...rest }) => rest)).toEqual(sessions);
    const edited = sessions.map((session, index) => index === 1 ? { ...session, startTime: '21:00', endTime: '22:00' } : session);
    await cohortService.update(program, created.id, { sessions: edited }, actor);
    const reloaded = await cohortService.get(program, created.id, actor);
    expect(reloaded.sessions.map(({ id: _id, ...rest }) => rest)).toEqual(edited);
    const timezoneChanged = await cohortService.update(program, created.id, { timezone: 'Asia/Tokyo' }, actor);
    expect(timezoneChanged.timezone).toBe('Asia/Tokyo');
    expect(timezoneChanged.sessions).toEqual(reloaded.sessions);
    const duplicate = await cohortService.duplicate(program, created.id, actor);
    cohortIds.push(duplicate.id);
    expect(duplicate.timezone).toBe('Asia/Tokyo');
    expect(duplicate.sessions.map(({ id: _id, ...rest }) => rest)).toEqual(edited);
    await prisma.cohort_enrollments.create({ data: { cohort_id: created.id, user_id: actor, status: 'joined' } });
    const member = await cohortJoinService.getMemberHome(created.id, actor);
    expect(member).toMatchObject({ timezone: 'Asia/Tokyo', sessions: reloaded.sessions });
    const detail = await activityService.getDetail(created.id, actor);
    expect(detail).toMatchObject({ timezone: 'Asia/Tokyo', sessions: reloaded.sessions });
    expect(detail).not.toHaveProperty('meetingUrl');
    if (!created.joinToken) throw new Error('Expected real join token');
    const publicJoin = await cohortJoinService.getJoinInfo(created.joinToken);
    expect(publicJoin).toMatchObject({ timezone: 'Asia/Tokyo', sessions: reloaded.sessions });
    expect(publicJoin).not.toHaveProperty('meetingUrl');
  });
});
