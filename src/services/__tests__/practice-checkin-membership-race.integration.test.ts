/**
 * f2e#1194 real PostgreSQL regression: a member removed while their check-in is in flight
 * must not end up with a cohort check-in. No DB or service logic is mocked; waits observe pg_locks.
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../generated/prisma';
import { prisma } from '../database/prisma.service';
import { createCheckIn } from '../practice-checkin.service';

jest.mock('../../queues', () => ({ enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn().mockResolvedValue(undefined) },
}));

type Fixture = { userId: number; organizationId: number; programId: number; cohortId: number; practiceId: number; enrollmentId: number };
let fixture: Fixture | undefined;
let remover: PrismaClient;
let monitor: PrismaClient;

function helperClient(): PrismaClient {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('Run against the disposable PostgreSQL test database');
  const url = new URL(value);
  url.searchParams.set('connection_limit', '1');
  return new PrismaClient({ datasourceUrl: url.toString() });
}

async function waitFor<T>(label: string, read: () => Promise<T | undefined>): Promise<T> {
  const deadline = Date.now() + 3500;
  do {
    const value = await read();
    if (value !== undefined) return value;
    await new Promise(resolve => setTimeout(resolve, 10));
  } while (Date.now() < deadline);
  throw new Error(`PostgreSQL did not reach ${label}`);
}

async function seed(): Promise<Fixture> {
  const role = await prisma.roles.findUnique({ where: { name: 'User' } });
  if (!role) throw new Error('Canonical PostgreSQL schema must seed the User role');
  const marker = randomUUID();
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000);
  return prisma.$transaction(async tx => {
    const user = await tx.users.create({ data: { mongo_id: randomUUID(), role_id: role.id, tag_list: [], nickname: '1194 race 學員' } });
    const organization = await tx.organization.create({ data: { name: `1194 race ${marker}` } });
    const program = await tx.programs.create({ data: { organization_id: organization.id, name: `1194 race ${marker}`, kind: 'lighthouse' } });
    const cohort = await tx.cohorts.create({ data: { program_id: program.id, slug: `race-1194-${marker}`, display_name: '1194 race', start_date: day(-7), end_date: day(30), status: 'published' } });
    const enrollment = await tx.cohort_enrollments.create({ data: { cohort_id: cohort.id, user_id: user.id, status: 'joined', role: 'member', joined_at: day(-7) } });
    const practice = await tx.practices.create({ data: {
      user_id: user.id, title: '共用連結打卡', cohort_id: cohort.id, creation_source: 'cohort_template', status: 'active',
      start_date: day(-7), end_date: day(20), duration_days: 28, frequency_min_days: 1, frequency_max_days: 7
    } });
    return { userId: user.id, organizationId: organization.id, programId: program.id, cohortId: cohort.id, practiceId: practice.id, enrollmentId: enrollment.id };
  });
}

describe('f2e#1194 check-in racing an administrator removal with PostgreSQL', () => {
  beforeAll(async () => {
    remover = helperClient(); monitor = helperClient();
    await Promise.all([remover.$connect(), monitor.$connect()]);
  });
  afterEach(async () => {
    if (!fixture) return;
    const f = fixture;
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`DELETE FROM audit_logs WHERE admin_id = ${f.userId}`;
      await tx.practice_checkins.deleteMany({ where: { practice_id: f.practiceId } });
      await tx.practices.deleteMany({ where: { user_id: f.userId } });
      await tx.cohort_enrollments.deleteMany({ where: { cohort_id: f.cohortId } });
      await tx.cohorts.delete({ where: { id: f.cohortId } });
      await tx.programs.delete({ where: { id: f.programId } });
      await tx.organization.delete({ where: { id: f.organizationId } });
      await tx.users.delete({ where: { id: f.userId } });
    });
    fixture = undefined;
  });
  afterAll(async () => {
    await Promise.all([remover.$disconnect(), monitor.$disconnect(), prisma.$disconnect()]);
  });

  it('rejects a check-in that was waiting on a removal which then commits, and writes nothing', async () => {
    const f = fixture = await seed();
    let release!: () => void;
    const released = new Promise<void>(resolve => { release = resolve; });
    let locked!: () => void;
    const holding = new Promise<void>(resolve => { locked = resolve; });
    // Same writes as cohortMembershipService.remove, held open until the check-in is observed waiting.
    const removal = remover.$transaction(async tx => {
      await tx.practices.updateMany({ where: { cohort_id: f.cohortId, user_id: f.userId, deleted_at: null }, data: { cohort_id: null, deleted_at: new Date() } });
      await tx.cohort_enrollments.update({ where: { id: f.enrollmentId }, data: { status: 'removed', exited_at: new Date() } });
      locked();
      await released;
    }, { timeout: 10_000 });
    await holding;

    const checkIn = createCheckIn(f.practiceId, { note: '移除途中送出的打卡', mood: 'good', tags: ['閱讀'] } as never, f.userId);
    void checkIn.catch(() => undefined);
    await waitFor('the check-in waiting on the removal lock', async () => {
      const rows = await monitor.$queryRaw<Array<{ pid: number }>>`
        SELECT pid FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND datname = current_database()`;
      return rows[0]?.pid;
    });
    release();
    await removal;

    // Removal soft-deleted the practice, so the locked re-read finds nothing: same 404 as any later request.
    await expect(checkIn).rejects.toMatchObject({ statusCode: 404 });
    expect(await prisma.practice_checkins.count({ where: { practice_id: f.practiceId } })).toBe(0);
  });

  it('lets a removal wait for an in-flight check-in that locked first, without deadlocking', async () => {
    const f = fixture = await seed();
    const name = `race1194_${randomUUID().replace(/-/g, '')}`;
    // Pause the check-in after it has taken its locks and inserted the row, before it updates the practice.
    await remover.$executeRaw`SELECT pg_advisory_lock(1194::int, ${f.practiceId}::int)`;
    await monitor.$executeRawUnsafe(`CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(1194, ${f.practiceId}); RETURN NEW; END $$`);
    await monitor.$executeRawUnsafe(`CREATE TRIGGER ${name} AFTER INSERT ON practice_checkins FOR EACH ROW WHEN (NEW.practice_id = ${f.practiceId}) EXECUTE FUNCTION ${name}()`);
    const pending: Promise<unknown>[] = [];
    try {
      const checkIn = createCheckIn(f.practiceId, { note: '先鎖住的打卡', mood: 'good', tags: ['閱讀'] } as never, f.userId);
      pending.push(checkIn); void checkIn.catch(() => undefined);
      await waitFor('the check-in paused by the advisory gate', async () => {
        const rows = await monitor.$queryRaw<Array<{ pid: number }>>`
          SELECT pid FROM pg_locks WHERE locktype = 'advisory' AND NOT granted AND classid = 1194::oid AND objid = ${f.practiceId}::oid`;
        return rows[0]?.pid;
      });
      // Same order as cohortMembershipService.remove: practices first, then the enrollment.
      const removal = prisma.$transaction(async tx => {
        await tx.practices.updateMany({ where: { cohort_id: f.cohortId, user_id: f.userId, deleted_at: null }, data: { cohort_id: null, deleted_at: new Date() } });
        await tx.cohort_enrollments.update({ where: { id: f.enrollmentId }, data: { status: 'removed', exited_at: new Date() } });
      }, { timeout: 10_000 });
      pending.push(removal); void removal.catch(() => undefined);
      await waitFor('the removal waiting on the check-in row lock', async () => {
        const rows = await monitor.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*) AS count FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND datname = current_database()`;
        return Number(rows[0]?.count ?? 0) >= 2 ? true : undefined;
      });
      await remover.$executeRaw`SELECT pg_advisory_unlock(1194::int, ${f.practiceId}::int)`;
      await expect(checkIn).resolves.toMatchObject({ success: true });
      await expect(removal).resolves.toBeUndefined();
      expect(await prisma.practice_checkins.count({ where: { practice_id: f.practiceId } })).toBe(1);
      expect(await prisma.practices.findUniqueOrThrow({ where: { id: f.practiceId }, select: { deleted_at: true } })).toEqual({ deleted_at: expect.any(Date) });
    } finally {
      await remover.$executeRaw`SELECT pg_advisory_unlock_all()`;
      await Promise.allSettled(pending);
      await monitor.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${name} ON practice_checkins`);
      await monitor.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${name}()`);
    }
  });
});
