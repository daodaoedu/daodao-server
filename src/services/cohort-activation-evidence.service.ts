import type { Prisma } from '../../generated/prisma';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';

type AuditDb = Pick<Prisma.TransactionClient, '$executeRaw'>;

/** Preserve the first observed successful publication; retries and later edits cannot rewrite its time. */
export const recordCohortPublication = async (db: AuditDb, actorId: number, cohortId: number, previousStatus: string | null, nextStatus: string): Promise<void> => {
  if (nextStatus !== 'published' || previousStatus === 'published') return;
  await db.$executeRaw`SELECT pg_advisory_xact_lock(538::int, ${cohortId}::int)`;
  await db.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value)
    SELECT ${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED}, 'cohort', ${String(cohortId)},
           ${JSON.stringify({ version: 1, cohortId, observation: 'status_transition' })}::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM audit_logs WHERE action_type = ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED}
        AND target_resource = 'cohort' AND target_id = ${String(cohortId)}
    )
  `;
};

/** Bind a successful join to its enrollment and member role without recording tokens, email or content. */
export const recordCohortActivationJoin = async (db: AuditDb, participantId: number, cohortId: number, enrollmentId: number, invitationTokenUsed: boolean): Promise<void> => {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(538::int, ${cohortId}::int)`;
  await db.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value)
    SELECT ${participantId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_JOINED}, 'cohort_enrollment', ${String(enrollmentId)},
           jsonb_build_object('version',1,'cohortId',c.id,'enrollmentId',ce.id,'role',ce.role,'invitationTokenUsed',${invitationTokenUsed}::boolean,
             'isManager',EXISTS(SELECT 1 FROM organization_members om WHERE om.organization_id=p.organization_id AND om.user_id=${participantId}))
    FROM cohort_enrollments ce JOIN cohorts c ON c.id=ce.cohort_id JOIN programs p ON p.id=c.program_id
    WHERE ce.id=${enrollmentId} AND ce.cohort_id=${cohortId} AND ce.user_id=${participantId} AND ce.status='joined' AND NOT EXISTS (
      SELECT 1 FROM audit_logs WHERE action_type = ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_JOINED}
        AND target_resource = 'cohort_enrollment' AND target_id = ${String(enrollmentId)}
    )
  `;
};

/** Snapshot the actual participant's enrollment and manage permission in the check-in transaction. */
export const recordCohortParticipation = async (db: AuditDb, participantId: number, cohortId: number, checkinId: number): Promise<void> => {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(539::int, ${checkinId}::int)`;
  await db.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value)
    SELECT ${participantId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_PARTICIPATED}, 'practice_checkin', ${String(checkinId)},
           jsonb_build_object('version',1,'cohortId',c.id,'checkinId',${checkinId}::int,'role',ce.role,
             'isManager',EXISTS(SELECT 1 FROM organization_members om WHERE om.organization_id=p.organization_id AND om.user_id=${participantId}))
    FROM cohorts c JOIN programs p ON p.id=c.program_id
    JOIN cohort_enrollments ce ON ce.cohort_id=c.id AND ce.user_id=${participantId} AND ce.status='joined'
    WHERE c.id=${cohortId} AND p.kind='lighthouse' AND NOT EXISTS (
      SELECT 1 FROM audit_logs WHERE action_type=${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_PARTICIPATED}
        AND target_resource='practice_checkin' AND target_id=${String(checkinId)}
    )
  `;
};
