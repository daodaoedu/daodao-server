import type { Prisma, PrismaClient } from '../../generated/prisma';
import { z } from 'zod';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';

type ReadDb = Pick<Prisma.TransactionClient, '$queryRaw'>;
const exportOptions = z.object({ registeredSince: z.string().datetime({ offset: true }), asOf: z.string().datetime({ offset: true }), instrumentedSince: z.string().datetime({ offset: true }) }).strict();
const invitationPayload = z.object({ enrollmentIds: z.array(z.number().int().positive()) });
const joinedPayload = z.object({ cohortId: z.number().int().positive(), enrollmentId: z.number().int().positive(), role: z.enum(['owner', 'assistant', 'member']), isManager: z.boolean(), joinTransition:z.string().datetime({offset:true}).optional() });
type RegistrationRow = { id: number; created_at: Date; is_leader: boolean; is_learner: boolean };
type PublicationRow = { id: number; admin_id: number; cohort_id: number; organization_id: number; created_at: Date; cohort_created_at: Date };
type EvidenceRow = { id: number; admin_id: number; cohort_id: number; organization_id: number; created_at: Date; action_type: string; new_value: unknown };
type CheckinRow = { id: number; user_id: number; cohort_id: number; organization_id: number; created_at: Date; evidence_id: number | null; evidence: unknown };
const participationPayload = z.object({ cohortId:z.number().int().positive(),checkinId:z.number().int().positive(),role:z.enum(['owner','assistant','member']),isManager:z.boolean() });
type NormalizedEvent = { eventId: string; occurredAt: string; leaderId: string; organizationId: string; cohortId: string; kind: string; enrollmentId?: string; participantId?: string; role?: string; isManager?: boolean };

type ActivationExportType = {
  input: {
    asOf: string;
    capturedAt: string;
    evidenceMode: 'observed';
    registrations: { leaderId: string; registeredAt: string; audience: 'leader' | 'learner' | 'unclassified'; source: 'unknown' }[];
    events: NormalizedEvent[];
    coverage: { publications: boolean; invitations: boolean; joins: boolean; participation: boolean };
  };
  provenance: { readConsistency: string; cutoffSemantics: string; publicationCreditPolicy: string; publicationCreditPolicyConfirmed: boolean; invitationEvidenceStage: string; capturedAt: string; registeredSince: string; instrumentedSince: string; classification: string; sourceAttribution: string; roleHistory: string; missingInvitationProvenance: boolean; missingParticipationProvenance: boolean; historicalCohorts: boolean; scope: string; privacy: string };
};

/** Read only opaque identifiers/timestamps from authoritative rows; no contacts, notes, tokens or images. */
const readBlogActivationEvidence = async (db: ReadDb, rawOptions: unknown, readConsistency: string): Promise<ActivationExportType> => {
  const options = exportOptions.parse(rawOptions);
  const capturedAt = new Date();
  const since = new Date(options.registeredSince);
  const asOf = new Date(options.asOf);
  const instrumentation = new Date(options.instrumentedSince);
  if (since > asOf || instrumentation > asOf) throw new Error('Invalid reporting period');
  if (asOf > capturedAt) throw new Error('asOf exceeds actual capture time; future observation is unavailable');
  const registrations = await db.$queryRaw<RegistrationRow[]>`
    SELECT u.id, u.created_at,
           EXISTS(SELECT 1 FROM organization_members om JOIN organization o ON o.id=om.organization_id WHERE om.user_id=u.id AND o.status='active') AS is_leader,
           EXISTS(SELECT 1 FROM cohort_enrollments ce WHERE ce.user_id=u.id AND ce.role='member' AND ce.status='joined') AS is_learner
    FROM users u WHERE u.created_at >= ${since} AND u.created_at <= ${asOf}
    ORDER BY u.id
  `;
  const publications = await db.$queryRaw<PublicationRow[]>`
    SELECT a.id,a.admin_id,c.id AS cohort_id,p.organization_id,a.created_at,c.created_at AS cohort_created_at
    FROM audit_logs a JOIN cohorts c ON c.id::text=a.target_id
    JOIN programs p ON p.id=c.program_id JOIN users u ON u.id=a.admin_id
    WHERE a.action_type=${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED} AND a.target_resource='cohort'
      AND p.kind='lighthouse' AND a.created_at >= ${instrumentation} AND a.created_at <= ${asOf}
      AND u.created_at >= ${since} AND u.created_at <= ${asOf}
    ORDER BY a.id
  `;
  const audits = await db.$queryRaw<EvidenceRow[]>`
    SELECT a.id,a.admin_id,c.id AS cohort_id,p.organization_id,a.created_at,a.action_type,a.new_value
    FROM audit_logs a JOIN cohorts c ON c.id::text=CASE WHEN a.target_resource='cohort' THEN a.target_id ELSE a.new_value->>'cohortId' END
    JOIN programs p ON p.id=c.program_id
    WHERE a.action_type IN (${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_INVITATION_UPLOADED},${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_INVITED},${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_JOINED})
      AND a.created_at >= ${instrumentation} AND a.created_at <= ${asOf} AND p.kind='lighthouse'
    ORDER BY a.id
  `;
  const checkins = await db.$queryRaw<CheckinRow[]>`
    SELECT ci.id,ci.user_id,c.id AS cohort_id,p.organization_id,ci.created_at,
           a.id AS evidence_id,a.new_value AS evidence
    FROM practice_checkins ci JOIN practices pr ON pr.id=ci.practice_id
    JOIN cohorts c ON c.id=pr.cohort_id JOIN programs p ON p.id=c.program_id
    LEFT JOIN audit_logs a ON a.target_resource='practice_checkin' AND a.target_id=ci.id::text
      AND a.admin_id=ci.user_id AND a.action_type=${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_PARTICIPATED}
    WHERE ci.created_at >= ${since} AND ci.created_at <= ${asOf} AND p.kind='lighthouse'
    ORDER BY ci.id
  `;
  const events: NormalizedEvent[] = [];
  const cohortLeader = new Map<number, PublicationRow>();
  for (const row of publications) {
    if (cohortLeader.has(row.cohort_id)) throw new Error('Duplicate durable publication evidence');
    cohortLeader.set(row.cohort_id, row);
    events.push({ eventId: `publication-${row.id}`, kind: 'published', occurredAt: row.created_at.toISOString(), leaderId: String(row.admin_id), organizationId: String(row.organization_id), cohortId: String(row.cohort_id) });
  }
  let missingInvitationProvenance = false;
  for (const row of audits) {
    const leader = cohortLeader.get(row.cohort_id);
    if (!leader) continue;
    const scope = { occurredAt: row.created_at.toISOString(), leaderId: String(leader.admin_id), organizationId: String(row.organization_id), cohortId: String(row.cohort_id) };
    if (row.action_type === LIGHTHOUSE_AUDIT_ACTIONS.COHORT_INVITATION_UPLOADED) {
      if (!audits.some(candidate => candidate.action_type === LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_INVITED && candidate.cohort_id === row.cohort_id && candidate.admin_id === row.admin_id && candidate.created_at.valueOf() === row.created_at.valueOf())) missingInvitationProvenance = true;
      continue;
    }
    if (row.action_type === LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_INVITED) {
      const parsed = invitationPayload.safeParse(row.new_value);
      if (!parsed.success) { missingInvitationProvenance = true; continue; }
      for (const enrollmentId of new Set(parsed.data.enrollmentIds)) events.push({ ...scope, eventId: `invitation-${row.id}-${enrollmentId}`, kind: 'invited', enrollmentId: String(enrollmentId) });
    } else {
      const value = joinedPayload.parse(row.new_value);
      events.push({ ...scope, ...(value.joinTransition ? {occurredAt:value.joinTransition} : {}), eventId: `join-${row.id}`, kind: 'joined', enrollmentId: String(value.enrollmentId), participantId: String(row.admin_id), role: value.role, isManager: value.isManager });
    }
  }
  let missingParticipationProvenance = false;
  for (const row of checkins) {
    const leader = cohortLeader.get(row.cohort_id);
    if (!leader) continue;
    const proof=participationPayload.safeParse(row.evidence);
    if(!row.evidence_id || !proof.success || proof.data.cohortId!==row.cohort_id || proof.data.checkinId!==row.id) { missingParticipationProvenance=true; continue; }
    events.push({ eventId: `checkin-${row.id}`, kind: 'participated', occurredAt: row.created_at.toISOString(), leaderId: String(leader.admin_id), organizationId: String(row.organization_id), cohortId: String(row.cohort_id), participantId: String(row.user_id), isManager: proof.data.isManager, role:proof.data.role });
  }
  const historicalCohorts = publications.some(row => row.cohort_created_at < instrumentation);
  const completeWindow = since >= instrumentation && !historicalCohorts;
  return {
    input: {
      asOf: options.asOf,
      capturedAt: capturedAt.toISOString(),
      evidenceMode: 'observed',
      registrations: registrations.map(row => ({ leaderId: String(row.id), registeredAt: row.created_at.toISOString(), audience: row.is_leader ? 'leader' : row.is_learner ? 'learner' : 'unclassified', source: 'unknown' })),
      events,
      coverage: { publications: false, invitations: completeWindow && !missingInvitationProvenance, joins: completeWindow, participation: !missingParticipationProvenance }
    },
    provenance: { readConsistency, cutoffSemantics: 'event_timestamps_in_current_snapshot_not_historical_commit_state', publicationCreditPolicy: 'pending_takeover_decision', publicationCreditPolicyConfirmed: false, invitationEvidenceStage: 'target_created_not_queue_acceptance_or_delivery', capturedAt: capturedAt.toISOString(), registeredSince: options.registeredSince, instrumentedSince: options.instrumentedSince, classification: 'current_active_organization_manage_permission', sourceAttribution: 'unavailable', roleHistory: 'registration_classification_current_participation_roles_snapshotted', missingInvitationProvenance, missingParticipationProvenance, historicalCohorts, scope: 'observed_platform_leaders_not_all_teachers', privacy: 'opaque_ids_and_timestamps_only' }
  };
};

/** Operator clients get one read-only repeatable snapshot; a supplied transaction owns its isolation. */
export const exportBlogActivationEvidence = async (db: ReadDb & Partial<Pick<PrismaClient, '$transaction'>>, rawOptions: unknown): Promise<ActivationExportType> => {
  const options = exportOptions.parse(rawOptions);
  if (new Date(options.asOf) > new Date()) throw new Error('asOf exceeds actual capture time; future observation is unavailable');
  if (db.$transaction) return db.$transaction(async tx => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    return readBlogActivationEvidence(tx, options, 'repeatable_read');
  }, { isolationLevel: 'RepeatableRead' });
  return readBlogActivationEvidence(db, options, 'caller_owned_transaction_or_adapter');
};
