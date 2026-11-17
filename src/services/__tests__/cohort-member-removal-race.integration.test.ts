/**
 * #549 real PostgreSQL concurrency regressions. No DB/service logic is mocked.
 * Fixture-scoped advisory gates synchronize actual lock waits, not elapsed time.
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../generated/prisma';
import { prisma } from '../database/prisma.service';
import { cohortJoinService } from '../cohort-join.service';
import { cohortMembershipService } from '../cohort-membership.service';
import { notificationEventService } from '../notification-event.service';
import { ConflictError } from '../../middleware/error.middleware';

jest.mock('../notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../chat-room.service', () => ({ appendSystemMessage: jest.fn().mockResolvedValue(undefined) }));

const now = new Date('2026-11-17T02:30:00.000Z');
const start = new Date('2026-11-01T00:00:00.000Z');
const end = new Date('2026-11-30T00:00:00.000Z');
type Fixture = { actorId: number; userId: number; organizationId: number; programId: number; cohortId: number; templateId: number; enrollmentId: number; token: string };
let fixture: Fixture | undefined;
let gate: PrismaClient;
let monitor: PrismaClient;

/** One connection per helper keeps session advisory locks on their owner. */
function helperClient(): PrismaClient {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('Run against the disposable PostgreSQL test database');
  const url = new URL(value);
  url.searchParams.set('connection_limit', '1');
  return new PrismaClient({ datasourceUrl: url.toString() });
}

/** Each poll inspects PostgreSQL's observed lock state; timeout is failure. */
async function waitFor<T>(label: string, read: () => Promise<T | undefined>): Promise<T> {
  const deadline = Date.now() + 3500;
  do {
    const value = await read();
    if (value !== undefined) return value;
    await new Promise(resolve => setTimeout(resolve, 10));
  } while (Date.now() < deadline);
  throw new Error(`PostgreSQL did not reach ${label}`);
}

/** Identify the actual service transaction paused by this fixture's gate. */
async function gatedPid(cohortId: number): Promise<number> {
  return waitFor('the fixture advisory lock wait', async () => {
    const rows = await monitor.$queryRaw<Array<{ pid: number }>>`
      SELECT pid FROM pg_locks WHERE locktype = 'advisory' AND NOT granted
        AND classid = 549::oid AND objid = ${cohortId}::oid
    `;
    return rows[0]?.pid;
  });
}

/** Wait until the second real service transaction is blocked by the first. */
async function blockedBy(pid: number): Promise<void> {
  await waitFor('the competing transaction lock wait', async () => {
    const rows = await monitor.$queryRaw<Array<{ pid: number }>>`
      SELECT pid FROM pg_stat_activity WHERE wait_event_type = 'Lock'
        AND ${pid}::int = ANY(pg_blocking_pids(pid))
    `;
    return rows[0]?.pid;
  });
}

/** Seed a published cohort with a real bound template and reusable invitation. */
async function seed(knownUser: boolean): Promise<Fixture> {
  const role = await prisma.roles.findUnique({ where: { name: 'User' } });
  if (!role) throw new Error('Canonical PostgreSQL schema must seed the User role');
  const marker = randomUUID();
  return prisma.$transaction(async tx => {
    const actor = await tx.users.create({ data: { mongo_id: randomUUID(), role_id: role.id, tag_list: [], nickname: '549 race 管理員' } });
    const user = await tx.users.create({ data: { mongo_id: randomUUID(), role_id: role.id, tag_list: [], nickname: '549 race 學員' } });
    const organization = await tx.organization.create({ data: { name: `549 race ${marker}` } });
    await tx.organization_members.create({ data: { organization_id: organization.id, user_id: actor.id, role: 'owner' } });
    const program = await tx.programs.create({ data: { organization_id: organization.id, name: '549 race' } });
    const cohort = await tx.cohorts.create({ data: { program_id: program.id, slug: marker, display_name: '549 race 本期', start_date: start, end_date: end, status: 'published' } });
    const template = await tx.practice_templates.create({ data: { organization_id: organization.id, title: '549 同時加入產生的實踐', duration_days: 30, practice_time_periods: [] } });
    await tx.cohort_templates.create({ data: { cohort_id: cohort.id, template_id: template.id } });
    const enrollment = await tx.cohort_enrollments.create({ data: { cohort_id: cohort.id, user_id: knownUser ? user.id : null, email: `${marker}@example.test`, status: 'invited' } });
    if (!enrollment.invite_token) throw new Error('Invitation token default is missing');
    return { actorId: actor.id, userId: user.id, organizationId: organization.id, programId: program.id, cohortId: cohort.id, templateId: template.id, enrollmentId: enrollment.id, token: enrollment.invite_token };
  });
}

/** Install an owned gate after join has updated enrollment and locked bindings. */
async function installJoinGate(f: Fixture, name: string): Promise<void> {
  await monitor.$executeRawUnsafe(`CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(549, ${f.cohortId}); RETURN NEW; END $$`);
  await monitor.$executeRawUnsafe(`CREATE TRIGGER ${name} AFTER INSERT ON practices FOR EACH ROW WHEN (NEW.cohort_id = ${f.cohortId} AND NEW.user_id = ${f.userId}) EXECUTE FUNCTION ${name}()`);
}

/** Always release and settle live transactions before removing their trigger. */
async function drain(f: Fixture, name: string, table: 'practices' | 'cohort_enrollments', pending: Promise<unknown>[]): Promise<void> {
  await gate.$executeRaw`SELECT pg_advisory_unlock(549::int, ${f.cohortId}::int)`;
  await Promise.allSettled(pending);
  await monitor.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${name} ON ${table}`);
  await monitor.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${name}()`);
}

describe('#549 concurrent join and administrator removal with PostgreSQL', () => {
  beforeAll(async () => {
    gate = helperClient(); monitor = helperClient();
    await Promise.all([gate.$connect(), monitor.$connect()]);
  });
  afterEach(async () => {
    if (!fixture) return;
    const f = fixture;
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`DELETE FROM audit_logs WHERE admin_id IN (${f.actorId}, ${f.userId})`;
      await tx.practices.deleteMany({ where: { user_id: f.userId } });
      await tx.cohort_stat_snapshots.deleteMany({ where: { cohort_id: f.cohortId } });
      await tx.cohort_enrollments.deleteMany({ where: { cohort_id: f.cohortId } });
      await tx.cohort_templates.deleteMany({ where: { cohort_id: f.cohortId } });
      await tx.practice_templates.delete({ where: { id: f.templateId } });
      await tx.cohorts.delete({ where: { id: f.cohortId } });
      await tx.programs.delete({ where: { id: f.programId } });
      await tx.organization_members.deleteMany({ where: { organization_id: f.organizationId } });
      await tx.organization.delete({ where: { id: f.organizationId } });
      await tx.users.deleteMany({ where: { id: { in: [f.actorId, f.userId] } } });
    });
    fixture = undefined;
  });
  afterAll(async () => {
    await Promise.all([gate.$disconnect(), monitor.$disconnect(), prisma.$disconnect()]);
  });

  it.each([false, true])('removes drafts created by an already-running invitation join (known user=%s)', async knownUser => {
    const f = fixture = await seed(knownUser);
    const name = `race549_${randomUUID().replace(/-/g, '')}`;
    const pending: Promise<unknown>[] = [];
    await gate.$executeRaw`SELECT pg_advisory_lock(549::int, ${f.cohortId}::int)`;
    try {
      await installJoinGate(f, name);
      const join = cohortJoinService.join(f.token, f.userId, true, now);
      pending.push(join); void join.catch(() => undefined);
      const joinPid = await gatedPid(f.cohortId);
      const remove = cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, now);
      pending.push(remove); void remove.catch(() => undefined);
      await blockedBy(joinPid);
      await gate.$executeRaw`SELECT pg_advisory_unlock(549::int, ${f.cohortId}::int)`;
      await expect(join).resolves.toEqual({ enrollmentId: f.enrollmentId, cohortId: f.cohortId, status: 'joined' });
      const removalResult = await remove;
      expect(await prisma.cohort_enrollments.findUnique({ where: { id: f.enrollmentId } })).toEqual(expect.objectContaining({ status: 'removed', user_id: f.userId, exited_at: now }));
      const rows = await prisma.practices.findMany({ where: { user_id: f.userId, template_id: f.templateId } });
      expect(rows).toHaveLength(1);
      expect({
        retainedRow: { cohortId: rows[0].cohort_id, deletedAt: rows[0].deleted_at },
        visiblePracticeCount: await prisma.practices.count({ where: { user_id: f.userId, deleted_at: null } }),
      }).toEqual({ retainedRow: { cohortId: null, deletedAt: now }, visiblePracticeCount: 0 });
      expect(removalResult).toEqual({ userId: f.userId, detachedPracticeCount: 1 });
      expect(notificationEventService.createEvent).toHaveBeenCalledTimes(1);
    } finally { await drain(f, name, 'practices', pending); }
  }, 20_000);

  it('permits one of two overlapping removals, with one audit and notification', async () => {
    const f = fixture = await seed(true);
    await cohortJoinService.join(f.token, f.userId, true, now);
    jest.clearAllMocks();
    const name = `race549_${randomUUID().replace(/-/g, '')}`;
    const pending: Promise<unknown>[] = [];
    await gate.$executeRaw`SELECT pg_advisory_lock(549::int, ${f.cohortId}::int)`;
    try {
      await monitor.$executeRawUnsafe(`CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(549, ${f.cohortId}); RETURN NEW; END $$`);
      await monitor.$executeRawUnsafe(`CREATE TRIGGER ${name} AFTER UPDATE ON cohort_enrollments FOR EACH ROW WHEN (NEW.id = ${f.enrollmentId} AND OLD.status = 'joined' AND NEW.status = 'removed') EXECUTE FUNCTION ${name}()`);
      const first = cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, now);
      pending.push(first); void first.catch(() => undefined);
      const firstPid = await gatedPid(f.cohortId);
      const second = cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, now);
      pending.push(second); void second.catch(() => undefined);
      await blockedBy(firstPid);
      await gate.$executeRaw`SELECT pg_advisory_unlock(549::int, ${f.cohortId}::int)`;
      await expect(first).resolves.toEqual({ userId: f.userId, detachedPracticeCount: 1 });
      await expect(second).rejects.toBeInstanceOf(ConflictError);
      const audit = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM audit_logs WHERE admin_id = ${f.actorId}
          AND action_type = 'lighthouse.cohort_member_removed' AND target_id = ${String(f.enrollmentId)}
      `;
      expect(audit[0].count).toBe(1n);
      expect(notificationEventService.createEvent).toHaveBeenCalledTimes(1);
    } finally { await drain(f, name, 'cohort_enrollments', pending); }
  }, 20_000);

  it.each(['exit', 'remove'] as const)('keeps the first %s outcome when voluntary exit and administrator removal overlap', async winner => {
    const f = fixture = await seed(true);
    await cohortJoinService.join(f.token, f.userId, true, now);
    jest.clearAllMocks();
    const name = `race549_${randomUUID().replace(/-/g, '')}`;
    const pending: Promise<unknown>[] = [];
    await gate.$executeRaw`SELECT pg_advisory_lock(549::int, ${f.cohortId}::int)`;
    try {
      await monitor.$executeRawUnsafe(`CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(549, ${f.cohortId}); RETURN NEW; END $$`);
      // The first service has already updated the actual practice. Its row is
      // uncommitted until the second service's observed lock wait is confirmed.
      const deletedCondition = winner === 'exit' ? 'NULL' : 'NOT NULL';
      await monitor.$executeRawUnsafe(`CREATE TRIGGER ${name} AFTER UPDATE ON practices FOR EACH ROW WHEN (OLD.cohort_id = ${f.cohortId} AND NEW.cohort_id IS NULL AND NEW.deleted_at IS ${deletedCondition}) EXECUTE FUNCTION ${name}()`);
      const runExit = () => cohortMembershipService.exit(f.cohortId, f.userId, now);
      const runRemove = () => cohortMembershipService.remove(f.programId, f.cohortId, f.enrollmentId, f.actorId, now);
      const first = winner === 'exit' ? runExit() : runRemove();
      pending.push(first); void first.catch(() => undefined);
      const firstPid = await gatedPid(f.cohortId);
      const second = winner === 'exit' ? runRemove() : runExit();
      pending.push(second);
      const secondOutcome = second.then(value => ({ value }), (error: unknown) => ({ error }));
      await blockedBy(firstPid);
      await gate.$executeRaw`SELECT pg_advisory_unlock(549::int, ${f.cohortId}::int)`;
      const firstResult = await first;
      const losingResult = await secondOutcome;
      const enrollment = await prisma.cohort_enrollments.findUniqueOrThrow({ where: { id: f.enrollmentId } });
      const rows = await prisma.practices.findMany({ where: { user_id: f.userId, template_id: f.templateId } });
      expect(rows).toHaveLength(1);
      const audit = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM audit_logs WHERE admin_id = ${f.actorId}
          AND action_type = 'lighthouse.cohort_member_removed' AND target_id = ${String(f.enrollmentId)}
      `;
      expect({
        enrollmentStatus: enrollment.status,
        exitedAt: enrollment.exited_at,
        retainedRow: { cohortId: rows[0].cohort_id, deletedAt: rows[0].deleted_at },
        visiblePracticeCount: await prisma.practices.count({ where: { user_id: f.userId, deleted_at: null } }),
        removalAuditCount: Number(audit[0].count),
        removalNotificationCount: jest.mocked(notificationEventService.createEvent).mock.calls.length,
      }).toEqual({
        enrollmentStatus: winner === 'exit' ? 'exited' : 'removed',
        exitedAt: now,
        retainedRow: { cohortId: null, deletedAt: winner === 'exit' ? null : now },
        visiblePracticeCount: winner === 'exit' ? 1 : 0,
        removalAuditCount: winner === 'exit' ? 0 : 1,
        removalNotificationCount: winner === 'exit' ? 0 : 1,
      });
      expect(firstResult).toEqual(winner === 'exit'
        ? { enrollmentId: f.enrollmentId, status: 'exited', detachedPracticeCount: 1 }
        : { userId: f.userId, detachedPracticeCount: 1 });
      expect(losingResult).toEqual({ error: expect.any(ConflictError) });
    } finally { await drain(f, name, 'practices', pending); }
  }, 20_000);
});
